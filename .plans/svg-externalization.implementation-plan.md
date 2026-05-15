# SVG Externalization — Clean DOM, Faster Pages, Better SEO — Implementation Plan

> **Status:** v1.0 — implementation-ready
> **Scope:** Three coordinated fixes that eliminate inline SVG bloat from all article outputs
> **Prerequisite:** Current main branch with SVG-primary architecture (commit `6a87589`)

---

## 0. Problem Statement

Google's review flagged inline SVG content causing:

1. **Bloated DOM size & page speed** — each Mermaid diagram injects 5,000–15,000 characters of SVG markup with hundreds of DOM nodes (paths, groups, text elements, embedded `<style>` blocks)
2. **Crawl budget & indexing confusion** — text fragments inside SVG `<text>` elements skew the page's text-to-code ratio and can be misinterpreted by crawlers
3. **CSS pollution** — embedded `<style>` blocks inside SVGs can conflict with page styles

### Current Architecture (What's Actually Happening)

After investigation, the codebase has **two separate SVG paths** with different behaviors:

| Output | Current format | Problem? |
|---|---|---|
| `bodyHtml` (database, WordPress, HTML export) | `<img src="cdn.../1.svg">` via `buildFigureHtml` | **No** — already external `<img>` reference |
| "Final article review" copy-paste area (frontend) | Raw SVG XML inlined into markdown via `htmlToMarkdownWithDiagrams` | **Yes** — this is what Google evaluates |
| WordPress publish | Uploads **PNG** to WP media library, but rewrite targets PNG CDN URL which doesn't match SVG CDN URL in `bodyHtml` → **no rewrite happens** | **Yes** — SVG CDN URLs remain, creating external dependency + URL mismatch |
| Bundle export (ZIP) | Separate `.svg` files in the archive | **No** |

### Key Insight

The `bodyHtml` path is already clean — `buildFigureHtml` emits `<img src>`, not inline SVG. The problems are:

1. The **review text** inlines raw SVG XML for Google evaluation
2. The **WordPress publisher** uploads PNGs but the HTML contains SVG URLs — the URL rewrite silently fails because the keys don't match
3. The `<img>` tags lack explicit `width`/`height` attributes, causing Cumulative Layout Shift (CLS)

---

## 1. Goals & Success Criteria

| Outcome | Verification |
|---|---|
| "Final article review" text contains no raw SVG XML | Copy the review text; search for `<svg` — zero matches |
| "Final article review" still references diagrams with markdown image syntax | Review text contains `![caption](https://cdn...)` for each diagram |
| WordPress posts use WP-hosted SVG URLs (not external CDN) | Inspect published WP post HTML — `<img src>` points to WP media library domain |
| WordPress SVG upload falls back to PNG on failure | If SVG upload fails, PNG is uploaded instead and URL is rewritten |
| Article `<img>` tags include `width` and `height` for CLS prevention | Inspect enriched `bodyHtml` — diagram `<img>` tags have `width` and `height` attributes |
| No regression in article visual rendering | Diagrams display correctly in WordPress, HTML export, and review UI |

---

## 2. Fix A — Clean "Final Article Review" Text

### 2.1 Problem

`buildFinalReviewText` in `page.tsx` calls `htmlToMarkdownWithDiagrams`, which:

1. Fetches raw SVG content from CDN via `/api/articles/{jobId}/diagram-svg/{id}`
2. Replaces each `<figure class="article-diagram">` with the full SVG XML string
3. Outputs markdown with 5,000–15,000 characters of SVG per diagram

When this text is pasted into Google's review tools, Google sees bloated markup.

### 2.2 Changes

#### A1. Replace inline SVG with markdown image references in `htmlToMarkdownWithDiagrams`

**File:** `apps/web/src/app/(protected)/workflow/[jobId]/page.tsx`

**Function:** `htmlToMarkdownWithDiagrams` (lines 206–241)

Change the SVG substitution logic. Instead of inlining raw SVG content, emit a clean markdown image reference:

```typescript
function htmlToMarkdownWithDiagrams(
  html: string,
  svgBySrc: Record<string, string>,
): string {
  const tokens: string[] = []
  const withPlaceholders = html.replace(
    /<figure\s[^>]*class="[^"]*article-diagram[^"]*"[^>]*>([\s\S]*?)<\/figure>/gi,
    (fullMatch, inner) => {
      const srcMatch = inner.match(/\bsrc="([^"]+)"/)
      const captionMatch = inner.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i)
      const src = srcMatch?.[1] ?? ''
      const captionText = captionMatch
        ? captionMatch[1].replace(/<[^>]+>/g, '').trim()
        : ''
      const altText = captionText || 'Diagram'
      const replacement = src
        ? `\n\n![${altText}](${src})\n\n`
        : `\n\n*[Diagram: ${altText}]*\n\n`
      const token = `@@DIAGRAM_${tokens.length}@@`
      tokens.push(replacement)
      return token
    },
  )

  let markdown = htmlToMarkdown(withPlaceholders)

  for (let i = 0; i < tokens.length; i++) {
    markdown = markdown.replace(`@@DIAGRAM_${i}@@`, tokens[i])
  }

  return markdown.replace(/\n{3,}/g, '\n\n').trim()
}
```

The function signature stays the same (`svgBySrc` parameter remains for backward compatibility) but SVG content is no longer used.

#### A2. Remove SVG content fetching

**File:** `apps/web/src/app/(protected)/workflow/[jobId]/page.tsx`

Remove the `useEffect` block (around lines 611–628) that fetches SVG content via `/api/articles/{jobId}/diagram-svg/{id}`. The `diagramSvgs` state variable and its setter can also be removed.

**Functions affected:**
- `buildFinalReviewText` — remove `diagramSvgs` parameter; the `svgBySrc` lookup inside is no longer needed since `htmlToMarkdownWithDiagrams` no longer uses it
- `handleCopyFinal` (line 908) — remove `diagramSvgs` argument
- Textarea `value` (line 1398) — remove `diagramSvgs` argument
- `htmlToMarkdownWithDiagrams` — simplify signature to just `(html: string)`; remove `svgBySrc` parameter

#### A3. Cleanup: remove unused `diagramSvgs` state

**File:** `apps/web/src/app/(protected)/workflow/[jobId]/page.tsx`

Remove:
- `const [diagramSvgs, setDiagramSvgs] = useState<Record<string, string>>({})` (line 514)
- The `useEffect` that populates it (lines 611–628)
- All references to `diagramSvgs` in function calls

### 2.3 Impact

- **Review text size:** Drops by 25,000–75,000 characters per article (5 diagrams × 5,000–15,000 chars each)
- **Network requests:** Eliminates 1 fetch per diagram on the workflow page (the `/api/articles/{jobId}/diagram-svg/{id}` calls)
- **No visual change:** The review text is markdown — diagrams appear as `![caption](url)` links, which Google can follow to evaluate

---

## 3. Fix B — WordPress SVG Upload & URL Rewrite

### 3.1 Problem

The WordPress target (`wordpress-target.ts`) has a URL mismatch bug:

1. `payload.diagrams[].cdnUrl` points to the **PNG** CDN URL (built from `d.pngS3Key` in `payload-builder.ts` line 94)
2. `bodyHtml` contains **SVG** CDN URLs (from `buildFigureHtml` which uses `svgUrl`)
3. `rewriteImageSrcs` maps `d.cdnUrl` (PNG) → WP URL, but searches `bodyHtml` for that PNG URL
4. Since `bodyHtml` contains SVG URLs, the `replaceAll` finds zero matches → **no rewrite happens**

Result: Published WordPress posts reference the external S3/CDN SVG URLs instead of WP-hosted media.

### 3.2 Changes

#### B1. Add `svgCdnUrl` to the `OutputPayload` diagrams array

**File:** `apps/api/src/article-pipeline/output/types.ts`

Add `svgCdnUrl` to the diagrams interface:

```typescript
diagrams: Array<{
  position: number
  sectionAnchor: string
  sectionTitle: string
  caption?: string | null
  cdnUrl: string        // PNG CDN URL (existing — for fallback)
  svgCdnUrl: string     // SVG CDN URL (new — matches what's in bodyHtml)
  svgContent: string
  pngS3Key: string
  svgS3Key: string      // new — needed for WP SVG upload
  width?: number | null
  height?: number | null
}>
```

#### B2. Populate `svgCdnUrl` and `svgS3Key` in payload builder

**File:** `apps/api/src/article-pipeline/output/payload-builder.ts`

Update the diagrams mapping (lines 87–99):

```typescript
const diagrams = sp.diagrams
  .filter((d) => d.pngS3Key)
  .map((d) => ({
    position: d.position,
    sectionAnchor: d.sectionAnchor,
    sectionTitle: d.sectionTitle,
    caption: d.caption,
    cdnUrl: cdnUrl(d.pngS3Key!),
    svgCdnUrl: d.svgS3Key ? cdnUrl(d.svgS3Key) : cdnUrl(d.pngS3Key!),
    svgContent: d.svgContent,
    pngS3Key: d.pngS3Key!,
    svgS3Key: d.svgS3Key ?? '',
    width: d.pngWidth,
    height: d.pngHeight,
  }))
```

Also add `svgS3Key: true` to the Prisma select clause for diagrams.

#### B3. Upload SVGs to WordPress media library with PNG fallback

**File:** `apps/api/src/article-pipeline/output/wordpress-target.ts`

Replace the diagram upload block (lines 231–250) with SVG-first upload logic:

```typescript
// 2. Upload diagrams to WP — try SVG first, fall back to PNG
const diagramUrlMap = new Map<string, string>()
for (const d of payload.diagrams) {
  const svgSrc = d.svgCdnUrl  // This is what bodyHtml contains

  // Try uploading SVG to WP media library
  if (d.svgS3Key) {
    try {
      const svgCdnFullUrl = d.svgCdnUrl
      const { source_url } = await uploadWpMedia(
        siteUrl,
        auth,
        svgCdnFullUrl,
        `${payload.slug}-diagram-${d.position}.svg`,
        d.caption ?? d.sectionTitle,
      )
      diagramUrlMap.set(svgSrc, source_url)
      continue  // SVG uploaded successfully
    } catch (err) {
      logger.warn(
        { err, jobId: payload.jobId, position: d.position },
        '[wordpress] SVG upload failed — trying PNG fallback',
      )
    }
  }

  // Fallback: upload PNG and rewrite SVG URL to PNG URL
  try {
    const { source_url } = await uploadWpMedia(
      siteUrl,
      auth,
      d.cdnUrl,
      `${payload.slug}-diagram-${d.position}.png`,
      d.caption ?? d.sectionTitle,
    )
    diagramUrlMap.set(svgSrc, source_url)
  } catch (err) {
    logger.warn(
      { err, jobId: payload.jobId, position: d.position },
      '[wordpress] diagram upload failed — using CDN fallback',
    )
  }
}
```

**Key difference:** `diagramUrlMap.set(svgSrc, ...)` uses the **SVG** CDN URL as the map key (what's actually in `bodyHtml`), not the PNG URL.

#### B4. WordPress SVG upload compatibility note

Many WordPress installations block SVG uploads by default for security reasons. The `uploadWpMedia` function sets `Content-Type: image/svg+xml` for `.svg` extensions (already handled at line 82). If WP rejects the SVG, the `catch` block falls back to PNG — so this is self-healing.

If the user's WP site consistently rejects SVGs, they can install a plugin like "Safe SVG" or add SVG to allowed MIME types. This is documented but not a code change.

### 3.3 Impact

- **WordPress posts:** Diagram images served from same domain (better for Core Web Vitals, no CORS, no external dependency)
- **Graceful degradation:** If SVG upload fails, PNG is uploaded instead — always results in a valid image
- **No change to article HTML structure** — only the URL values change

---

## 4. Fix C — Add `width` and `height` to Diagram `<img>` Tags (CLS Prevention)

### 4.1 Problem

`buildFigureHtml` emits:

```html
<img src="..." alt="..." loading="lazy" style="max-width:100%;height:auto" />
```

Without `width` and `height` attributes, the browser doesn't know the image dimensions until it loads, causing layout shifts (CLS). Google penalizes pages with high CLS.

### 4.2 Changes

#### C1. Pass SVG dimensions through `saveDiagramAndInsert`

**File:** `apps/api/src/article-pipeline/enrichment/index.ts`

In `saveDiagramAndInsert`, after the SVG is sanitized (line 766), extract dimensions from the SVG viewBox:

```typescript
function extractSvgViewBoxDimensions(svg: string): { width: number; height: number } | null {
  const vb = /\bviewBox\s*=\s*["']\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)\s*["']/i.exec(svg)
  if (vb) {
    return { width: Math.round(Number.parseFloat(vb[1])), height: Math.round(Number.parseFloat(vb[2])) }
  }
  const w = /\bwidth\s*=\s*["']([\d.]+)(?:px)?["']/i.exec(svg)
  const h = /\bheight\s*=\s*["']([\d.]+)(?:px)?["']/i.exec(svg)
  if (w && h) {
    return { width: Math.round(Number.parseFloat(w[1])), height: Math.round(Number.parseFloat(h[1])) }
  }
  return null
}
```

This function already exists in `svg-rasterizer.ts` as `extractSvgDimensions` (lines 87–108). Reuse it by exporting it, or add a lighter version directly.

Then pass dimensions to `buildFigureHtml`:

```typescript
const svgDims = extractSvgViewBoxDimensions(cleanSvg)

figuresToInsert.push({
  afterH2Offset: section.afterH2Offset,
  figureHtml: buildFigureHtml({
    imgUrl: svgUrl,
    alt: section.heading,
    caption,
    width: svgDims?.width,
    height: svgDims?.height,
  }),
})
```

#### C2. Update `buildFigureHtml` to accept and render dimensions

**File:** `apps/api/src/article-pipeline/enrichment/html-parser.ts`

Update the function signature and template:

```typescript
export function buildFigureHtml(opts: {
  imgUrl: string
  alt: string
  caption?: string | null
  width?: number
  height?: number
}): string {
  const altText = opts.caption?.trim() || opts.alt
  const cap = opts.caption
    ? `<figcaption>${escapeHtml(opts.caption)}</figcaption>`
    : ''
  const dimAttrs = opts.width && opts.height
    ? ` width="${opts.width}" height="${opts.height}"`
    : ''
  return `<figure class="article-diagram">\n  <img src="${opts.imgUrl}" alt="${escapeHtml(altText)}" loading="lazy"${dimAttrs} style="max-width:100%;height:auto" />\n  ${cap}\n</figure>`
}
```

### 4.3 Impact

- **CLS score improvement:** Browser reserves exact space for images before load → no layout shift
- **Google Core Web Vitals:** Direct positive impact on CLS metric
- **Backward compatible:** If dimensions can't be extracted, the `<img>` renders without them (same as current behavior)

---

## 5. File Inventory

| File | Fix | Change |
|---|---|---|
| `apps/web/src/app/(protected)/workflow/[jobId]/page.tsx` | A | Replace inline SVG with markdown image refs; remove SVG fetching |
| `apps/api/src/article-pipeline/output/types.ts` | B | Add `svgCdnUrl` and `svgS3Key` to diagram payload type |
| `apps/api/src/article-pipeline/output/payload-builder.ts` | B | Populate `svgCdnUrl` and `svgS3Key` in diagram mapping |
| `apps/api/src/article-pipeline/output/wordpress-target.ts` | B | SVG-first WP upload with PNG fallback; fix URL rewrite key |
| `apps/api/src/article-pipeline/enrichment/html-parser.ts` | C | Add `width`/`height` params to `buildFigureHtml` |
| `apps/api/src/article-pipeline/enrichment/index.ts` | C | Extract SVG dimensions; pass to `buildFigureHtml` |

---

## 6. Implementation Order

The fixes are independent and can be implemented in any order. Recommended sequence:

1. **Fix A** (review text cleanup) — immediate impact on Google evaluations, zero backend risk
2. **Fix C** (CLS dimensions) — improves Core Web Vitals for all future articles
3. **Fix B** (WordPress SVG upload) — requires testing with a WP site; has PNG fallback for safety

---

## 7. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| WordPress site blocks SVG uploads | PNG fallback in Fix B handles this automatically; no manual intervention needed |
| SVG viewBox missing from some diagrams | Fix C returns `null` dimensions → `<img>` renders without width/height (same as current) |
| Review text loses visual context without inline SVGs | Markdown `![caption](url)` links are clickable; evaluator can open diagrams in browser |
| Existing articles with old `bodyHtml` format | No migration needed — `bodyHtml` already uses `<img src>` references |

---

## 8. What This Does NOT Change

- **`bodyHtml` structure** — already uses `<img src="cdn.../1.svg">`, no change needed
- **SVG rendering pipeline** — Mermaid → mmdc → SVG → S3 upload remains unchanged
- **PNG generation** — still produced for email/bundle/social fallback
- **SVG accessibility** — `addSvgAccessibility` in `svg-sanitizer.ts` continues to run on the uploaded `.svg` file
- **HTML export** — `html-target.ts` uses `payload.bodyHtml` which is already clean
- **Bundle export** — `bundle-target.ts` packages SVGs as separate files in the ZIP

---

## 9. Implementation Checklist

- [ ] **A1** — Update `htmlToMarkdownWithDiagrams` to emit `![caption](url)` instead of raw SVG
- [ ] **A2** — Remove SVG content fetching `useEffect` and `diagramSvgs` state
- [ ] **A3** — Remove `diagramSvgs` from `buildFinalReviewText` signature and all call sites
- [ ] **B1** — Add `svgCdnUrl` and `svgS3Key` to `OutputPayload` types
- [ ] **B2** — Populate new fields in `payload-builder.ts`
- [ ] **B3** — Implement SVG-first WP upload with PNG fallback in `wordpress-target.ts`
- [ ] **C1** — Add `extractSvgViewBoxDimensions` and pass dimensions in `saveDiagramAndInsert`
- [ ] **C2** — Update `buildFigureHtml` to accept and render `width`/`height`

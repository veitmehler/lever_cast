# Diagram Rendering Fix — SVG-Primary Architecture + Init Directive + S3 Path Cleanup

> **Scope:** Fix the empty-diagram bug (text missing from Mermaid PNGs), switch to SVG-primary output for article HTML, sanitize SVGs against XSS, fix S3 path inconsistency, and keep PNG as a fallback for email/social/bundle exports.

> **Root cause (confirmed):** `mermaid-config.json` with `htmlLabels: false` is **ignored by mmdc** (Mermaid CLI v11+). The generated SVGs contain `<foreignObject>` with HTML text labels. `@resvg/resvg-js` is a pure-SVG renderer that cannot process `<foreignObject>`, so rasterized PNGs come out as boxes-without-text. Browsers render `<foreignObject>` perfectly — so SVG-primary output avoids the rasterizer entirely.

> **Diagnostic evidence:** `fobj: true, text: true` on the live `ArticleDiagram.svgContent` for job `cmorirslg0003o101mohv2g0e`. The SVG is structurally valid; the PNG rasterizer is the broken link.

---

## Table of Contents

1. [Architecture Decision](#1-architecture-decision)
2. [Fix A: `%%{init}%%` Directive in Mermaid Syntax](#2-fix-a-init-directive-in-mermaid-syntax)
3. [Fix B: SVG-Primary Article HTML](#3-fix-b-svg-primary-article-html)
4. [Fix C: SVG Sanitization](#4-fix-c-svg-sanitization)
5. [Fix D: Alpine Font for PNG Fallback](#5-fix-d-alpine-font-for-png-fallback)
6. [Fix E: S3 Path Cleanup](#6-fix-e-s3-path-cleanup)
7. [Database Changes](#7-database-changes)
8. [File Inventory](#8-file-inventory)
9. [Implementation Checklist](#9-implementation-checklist)

---

## 1. Architecture Decision

### Before (PNG-only)

```
LLM → Mermaid syntax → mmdc → SVG → resvg-js → PNG → S3 → <img src="…/N.png">
                                                  ↑ BUG: <foreignObject> invisible
```

### After (SVG-primary + PNG fallback)

```
LLM → Mermaid syntax → inject %%{init}%% → mmdc → SVG
                                                     ├─ sanitize → S3 (…/N.svg) → <img src="…/N.svg">  ← article HTML
                                                     └─ resvg-js → PNG → S3 (…/N.png)                  ← bundle/email fallback
```

**Why both formats:**

| Consumer | Format | Reason |
|----------|--------|--------|
| Article preview (`/workflow/[jobId]/preview`) | SVG via `<img>` | Crawlable text, crisp at any zoom, no rasterizer dependency |
| WordPress export | SVG via `<img>` | WP renders external `<img src="…svg">` fine; avoids media library SVG block |
| HTML export (download) | SVG via `<img>` | Same as WP |
| Bundle export (.zip) | PNG file included | Email clients / RSS may strip SVG |
| Social card / og:image | Featured image (already PNG) | Diagrams are never used as og:image |

---

## 2. Fix A: `%%{init}%%` Directive in Mermaid Syntax

**File:** `apps/api/src/article-pipeline/enrichment/svg-renderer.ts`

**Problem:** `mmdc --configFile mermaid-config.json` does not apply `htmlLabels: false` to the Mermaid rendering engine in CLI v11+. The config file format may be wrong for this version.

**Fix:** Prepend a `%%{init: …}%%` directive to every Mermaid syntax string **before writing to the temp file**. This injects the config at the syntax level, which Mermaid processes unconditionally regardless of CLI version.

```typescript
const INIT_DIRECTIVE = `%%{init: {"theme": "default", "themeVariables": {"fontFamily": "Arial, Helvetica, sans-serif"}, "flowchart": {"htmlLabels": false}, "sequence": {"htmlLabels": false}, "class": {"htmlLabels": false}, "state": {"htmlLabels": false}}}%%`

export async function renderMermaidToSvg(mermaidSyntax: string): Promise<string> {
  const id = randomUUID()
  const inFile  = join(tmpdir(), `mermaid-in-${id}.mmd`)
  const outFile = join(tmpdir(), `mermaid-out-${id}.svg`)

  const withInit = mermaidSyntax.trimStart().startsWith('%%{init')
    ? mermaidSyntax   // LLM already included an init — don't double-inject
    : INIT_DIRECTIVE + '\n' + mermaidSyntax

  await writeFile(inFile, withInit, 'utf8')
  // ... rest unchanged
}
```

**Why keep `--configFile` too:** Belt-and-braces. If a future mmdc version fixes config-file handling, both work together.

---

## 3. Fix B: SVG-Primary Article HTML

### 3a. Upload SVG alongside PNG

**File:** `apps/api/src/article-pipeline/enrichment/index.ts` → `saveDiagramAndInsert()`

After rendering SVG and before rasterizing, upload the sanitized SVG to S3:

```typescript
async function saveDiagramAndInsert(opts: SaveDiagramOpts): Promise<void> {
  const { jobId, sitePage, section, mermaidSyntax, svgContent, gen, figuresToInsert } = opts

  const cleanSvg = sanitizeSvg(svgContent)

  // Upload SVG (primary format for article HTML)
  const svgKey = `articles/${sitePage.userId}/${jobId}/diagrams/${section.position}.svg`
  await uploadBufferWithKey(svgKey, Buffer.from(cleanSvg, 'utf8'), 'image/svg+xml')
  const svgUrl = getCdnUrl(svgKey)

  // Upload PNG (fallback for bundle/email)
  const { png, width, height } = rasterizeSvg(cleanSvg, 1200)
  const pngKey = `articles/${sitePage.userId}/${jobId}/diagrams/${section.position}.png`
  await uploadBufferWithKey(pngKey, png, 'image/png')

  await prisma.articleDiagram.upsert({
    where: { sitePageId_position: { sitePageId: sitePage.id, position: section.position } },
    create: {
      sitePageId: sitePage.id,
      position: section.position,
      sectionAnchor: section.anchor,
      sectionTitle: section.heading,
      caption: buildCaption(section.heading),
      mermaidSyntax,
      svgContent: cleanSvg,
      svgS3Key: svgKey,        // NEW
      pngS3Key: pngKey,
      pngWidth: width,
      pngHeight: height,
      pngGeneratedAt: new Date(),
      llmProvider: gen.provider,
      llmModel: gen.model,
      inputTokens: gen.inputTokens,
      outputTokens: gen.outputTokens,
      cost: gen.cost,
    },
    update: {
      mermaidSyntax,
      svgContent: cleanSvg,
      svgS3Key: svgKey,        // NEW
      pngS3Key: pngKey,
      pngWidth: width,
      pngHeight: height,
      pngGeneratedAt: new Date(),
      llmProvider: gen.provider,
      llmModel: gen.model,
      inputTokens: gen.inputTokens,
      outputTokens: gen.outputTokens,
      cost: gen.cost,
    },
  })

  // HTML figure now points to SVG (browsers render <img src="…svg"> natively)
  figuresToInsert.push({
    afterH2Offset: section.afterH2Offset,
    figureHtml: buildFigureHtml({
      imgUrl: svgUrl,
      alt: section.heading,
      caption: buildCaption(section.heading),
    }),
  })
}
```

### 3b. Update `saveDiagramOpts` to include `userId`

The `sitePage` parameter in `SaveDiagramOpts` already has `userId?: string`. Ensure it's always populated:

```typescript
// In the enrichment loop where saveDiagramAndInsert is called:
await saveDiagramAndInsert({
  jobId,
  sitePage: { id: sitePage.id, userId: job.userId },
  // ...
})
```

### 3c. Update `buildFigureHtml` (no change needed)

The function already generates `<img src="…" alt="…" loading="lazy" />`. It's format-agnostic — passing an SVG URL instead of a PNG URL requires **zero changes**.

### 3d. Output targets

**HTML export** (`html-target.ts`): No change needed — it uses `payload.bodyHtml` which already contains the `<figure>` blocks with `<img src>`. The `src` will now point to `.svg` instead of `.png`.

**WordPress export** (`wordpress-target.ts`): No change needed — the `bodyHtml` posted to the WP REST API will contain SVG `<img>` URLs. WordPress renders external `<img src="…svg">` in post content without issue (this is not a media library upload).

**Bundle export** (`bundle-target.ts`): This target downloads diagrams locally into the .zip. It should use the **PNG** fallback for maximum compatibility. Currently it reads from `pngS3Key` — keep as-is.

### 3e. Workflow detail page diagram grid

**File:** `apps/web/src/app/(protected)/workflow/[jobId]/page.tsx`

The diagram grid currently uses `diagram.cdnUrl` (derived from `pngS3Key`). Update the backend response to also include `svgCdnUrl` (derived from `svgS3Key`), and use that for the `<Image>` component in the grid. The Next.js `<Image>` component handles SVGs via `<img>` natively.

**Backend route** (`apps/api/src/routes/articles.ts` → `GET /articles/:jobId`):

Add `svgS3Key` to the diagram select:

```typescript
diagrams: {
  select: { id: true, position: true, sectionTitle: true, caption: true, pngS3Key: true, svgS3Key: true },
  orderBy: { position: 'asc' },
},
```

And in the CDN URL mapping:

```typescript
diagrams: (job.sitePage.diagrams ?? []).map((d) => ({
  ...d,
  cdnUrl: d.pngS3Key ? `${cdnBase}/${d.pngS3Key}` : null,
  svgCdnUrl: d.svgS3Key ? `${cdnBase}/${d.svgS3Key}` : null,
})),
```

**Frontend:** Prefer `svgCdnUrl` in the diagram grid `<Image>` component, fall back to `cdnUrl` (PNG):

```tsx
src={diagram.svgCdnUrl ?? diagram.cdnUrl}
```

---

## 4. Fix C: SVG Sanitization

**New file:** `apps/api/src/article-pipeline/enrichment/svg-sanitizer.ts`

SVGs from `mmdc` are machine-generated from LLM-produced Mermaid syntax. Mermaid grammar cannot produce `<script>` tags. However, belt-and-braces: strip any executable content before persisting/uploading.

```typescript
/**
 * Strip executable content from SVG before upload.
 * Mermaid syntax cannot produce <script> or event handlers, but we
 * sanitize defensively in case of future mmdc bugs or LLM injection.
 */
export function sanitizeSvg(svg: string): string {
  return svg
    // Remove <script> blocks
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    // Remove on* event handlers (onclick, onload, onerror, etc.)
    .replace(/\s+on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\s+on\w+\s*=\s*'[^']*'/gi, '')
    // Remove javascript: URLs in href/xlink:href
    .replace(/href\s*=\s*"javascript:[^"]*"/gi, 'href="#"')
    .replace(/href\s*=\s*'javascript:[^']*'/gi, "href='#'")
}
```

Called in `saveDiagramAndInsert()` before both the SVG upload and the PNG rasterization.

---

## 5. Fix D: Alpine Font for PNG Fallback

Even with SVG-primary, we still generate PNGs for the bundle export. The rasterizer should produce correct PNGs too.

### 5a. Install Liberation Sans in Dockerfile

**File:** `apps/api/Dockerfile`

```dockerfile
# Before (line 32):
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont postgresql16-client

# After:
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont font-liberation postgresql16-client
```

`font-liberation` provides Liberation Sans — the open-source metric-compatible equivalent of Arial. Once installed, resvg-js's `loadSystemFonts: true` will discover it.

### 5b. Update resvg-js font config

**File:** `apps/api/src/article-pipeline/enrichment/svg-rasterizer.ts`

```typescript
font: {
  defaultFontFamily: 'Liberation Sans',  // was: 'Arial, Helvetica, sans-serif'
  loadSystemFonts: true,
},
```

`defaultFontFamily` must be a **single concrete font family name**, not a CSS comma-separated fallback list. `Liberation Sans` is the actual font installed by `font-liberation` on Alpine.

---

## 6. Fix E: S3 Path Cleanup

### Current paths

| Asset | Current S3 key | Issue |
|-------|---------------|-------|
| Featured image | `articles/{userId}/{jobId}/featured.{ext}` | ✅ Correct — namespaced by user |
| Diagram PNG | `diagrams/{jobId}/{position}.png` | ❌ No userId namespace |
| HTML export | `exports/{userId}/{jobId}/article.html` | ✅ Correct |

### New paths

| Asset | New S3 key |
|-------|-----------|
| Featured image | `articles/{userId}/{jobId}/featured.{ext}` (unchanged) |
| Diagram SVG | `articles/{userId}/{jobId}/diagrams/{position}.svg` |
| Diagram PNG | `articles/{userId}/{jobId}/diagrams/{position}.png` |

This places all assets for one article under a single `articles/{userId}/{jobId}/` prefix. Benefits:
- Per-user S3 prefix listing for GDPR/data deletion
- Consistent structure
- Single-prefix cleanup for article deletion

### Backwards compatibility

Existing CDN URLs baked into already-enriched articles point to `diagrams/{jobId}/{position}.png`. These old S3 objects remain untouched — we don't delete them. Only NEW enrichment runs write to the new path. Old articles continue to work until re-enriched.

---

## 7. Database Changes

### New field on `ArticleDiagram`

```prisma
model ArticleDiagram {
  // ... existing fields ...
  svgS3Key       String?               // NEW — S3 key for the sanitized SVG
  // ... rest unchanged ...
}
```

This requires a Prisma migration: `ALTER TABLE article_diagrams ADD COLUMN "svgS3Key" TEXT;`

**No migration for existing rows** — they'll have `svgS3Key = null`. The frontend falls back to `cdnUrl` (PNG) when `svgCdnUrl` is null.

---

## 8. File Inventory

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/article-pipeline/enrichment/svg-renderer.ts` | MODIFY | Add `%%{init}%%` directive injection |
| `apps/api/src/article-pipeline/enrichment/svg-sanitizer.ts` | CREATE | `sanitizeSvg()` — strips `<script>`, `on*=`, `javascript:` |
| `apps/api/src/article-pipeline/enrichment/svg-rasterizer.ts` | MODIFY | Change `defaultFontFamily` to `'Liberation Sans'` |
| `apps/api/src/article-pipeline/enrichment/index.ts` | MODIFY | Upload SVG, new S3 paths, pass `userId`, call `sanitizeSvg()` |
| `apps/api/src/article-pipeline/enrichment/html-parser.ts` | NO CHANGE | `buildFigureHtml` is format-agnostic |
| `apps/api/src/routes/articles.ts` | MODIFY | Add `svgS3Key` to diagram select + CDN mapping |
| `apps/api/Dockerfile` | MODIFY | Add `font-liberation` to `apk add` |
| `apps/web/src/app/(protected)/workflow/[jobId]/page.tsx` | MODIFY | Add `svgCdnUrl` to type + prefer SVG in diagram grid |
| `packages/db/prisma/schema.prisma` | MODIFY | Add `svgS3Key` to `ArticleDiagram` |

---

## 9. Implementation Checklist

- [ ] **1. Prisma schema: add `svgS3Key` to `ArticleDiagram`** — add field + generate migration
- [ ] **2. Create `svg-sanitizer.ts`** — `sanitizeSvg()` function
- [ ] **3. Fix `svg-renderer.ts`** — inject `%%{init}%%` directive before Mermaid syntax
- [ ] **4. Fix `svg-rasterizer.ts`** — `defaultFontFamily: 'Liberation Sans'`
- [ ] **5. Fix `Dockerfile`** — add `font-liberation` to `apk add`
- [ ] **6. Update `enrichment/index.ts`** — upload SVG + PNG with new S3 paths, call `sanitizeSvg()`, pass `userId`
- [ ] **7. Update `routes/articles.ts`** — include `svgS3Key` in diagram select + add `svgCdnUrl` mapping
- [ ] **8. Update frontend diagram grid** — add `svgCdnUrl` to type, prefer SVG over PNG
- [ ] **9. TypeScript build verification** — `tsc --noEmit` passes in `apps/api` and `apps/web`
- [ ] **10. Commit, push, deploy** — CI builds new Docker image with `font-liberation`, runs migration
- [ ] **11. Re-run enrichment on test article** — verify SVGs on S3, diagrams show text

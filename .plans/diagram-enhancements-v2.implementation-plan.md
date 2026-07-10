# Diagram Enhancements V2 — Puppeteer PNG, Type Variety, Brand Colors

> **Status: IMPLEMENTED** (audited 2026-07-09) — Puppeteer PNG, type variety, and brand colors live on `article_diagrams`.

> **Scope:** Replace the broken resvg-js PNG rasterizer with Puppeteer screenshots, add a GPT-4o-mini diagram-type selector for visual variety, and wire diagram colors to user BrandSettings.

> **Prerequisites:** The SVG-primary architecture from the previous plan is already deployed. SVGs render correctly with text in browsers. PNGs remain broken (empty boxes) because resvg-js cannot render `<foreignObject>`.

---

## Table of Contents

1. [Phase A: Puppeteer PNG Rasterizer](#phase-a-puppeteer-png-rasterizer)
2. [Phase B: GPT-4o-mini Diagram Type Selector](#phase-b-gpt-4o-mini-diagram-type-selector)
3. [Phase C: Brand-Matched Diagram Colors](#phase-c-brand-matched-diagram-colors)
4. [Database Changes](#database-changes)
5. [File Inventory](#file-inventory)
6. [Implementation Checklist](#implementation-checklist)

---

## Phase A: Puppeteer PNG Rasterizer

### Problem

`@resvg/resvg-js` is a pure-SVG renderer. Mermaid CLI v11+ emits all text inside `<foreignObject>` (HTML-in-SVG), which resvg-js cannot process. Result: PNGs have boxes and lines but no text. The `htmlLabels: false` setting (both via config file and `%%{init}%%` directive) is ignored by the current mmdc version.

### Solution

Replace resvg-js with Puppeteer-based screenshot rasterization. We already have Chromium installed in the Docker image for mmdc — Puppeteer connects to it directly via `puppeteer-core` (no Chromium download).

### Architecture

```
SVG string
  → Write temp HTML file (<!doctype html><body style="margin:0;background:#fff">{svg}</body>)
  → Puppeteer opens file:///tmp/…html
  → page.setViewport({ width: svgWidth, height: svgHeight })
  → page.screenshot({ type: 'png', fullPage: true })
  → Return PNG Buffer + dimensions
  → Clean up temp file
```

### Browser Instance Management

To avoid launching Chromium 9 times per article (once per section), maintain a **shared browser instance** for the duration of one enrichment run:

```typescript
// enrichment/puppeteer-pool.ts

import puppeteer, { type Browser } from 'puppeteer-core'

const CHROMIUM_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser'

let browser: Browser | null = null
let refCount = 0

export async function acquireBrowser(): Promise<Browser> {
  if (!browser || !browser.connected) {
    browser = await puppeteer.launch({
      executablePath: CHROMIUM_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })
  }
  refCount++
  return browser
}

export async function releaseBrowser(): Promise<void> {
  refCount--
  if (refCount <= 0 && browser) {
    await browser.close().catch(() => {})
    browser = null
    refCount = 0
  }
}
```

The enrichment orchestrator calls `acquireBrowser()` before the section loop and `releaseBrowser()` in a `finally` block after. Each `rasterizeSvg()` call opens a new **page** (cheap) rather than a new browser (expensive).

### New `svg-rasterizer.ts`

```typescript
// enrichment/svg-rasterizer.ts  (full rewrite)

import { writeFile, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { acquireBrowser } from './puppeteer-pool'

export interface RasterizeResult {
  png: Buffer
  width: number
  height: number
}

export async function rasterizeSvg(svg: string, targetWidth = 1200): Promise<RasterizeResult> {
  const browser = await acquireBrowser()
  const page = await browser.newPage()

  try {
    // Extract intrinsic dimensions from the SVG viewBox or width/height attrs
    const dims = extractSvgDimensions(svg, targetWidth)

    await page.setViewport({ width: dims.width, height: dims.height, deviceScaleFactor: 2 })

    const html = buildHtmlWrapper(svg, dims.width, dims.height)
    const tmpFile = join(tmpdir(), `raster-${randomUUID()}.html`)
    await writeFile(tmpFile, html, 'utf8')

    try {
      await page.goto(`file://${tmpFile}`, { waitUntil: 'networkidle0', timeout: 15_000 })
      const pngBuffer = await page.screenshot({ type: 'png', fullPage: true }) as Buffer

      return { png: Buffer.from(pngBuffer), width: dims.width * 2, height: dims.height * 2 }
    } finally {
      await unlink(tmpFile).catch(() => {})
    }
  } finally {
    await page.close()
  }
}

function buildHtmlWrapper(svg: string, width: number, height: number): string {
  return `<!doctype html>
<html>
<head><style>*{margin:0;padding:0}body{background:#fff;width:${width}px;height:${height}px;overflow:hidden}</style></head>
<body>${svg}</body>
</html>`
}

function extractSvgDimensions(svg: string, fallbackWidth: number): { width: number; height: number } {
  // Try viewBox first
  const vb = /viewBox=["'](\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)["']/i.exec(svg)
  if (vb) {
    const vbWidth = parseFloat(vb[3])
    const vbHeight = parseFloat(vb[4])
    const scale = fallbackWidth / vbWidth
    return { width: fallbackWidth, height: Math.round(vbHeight * scale) }
  }

  // Try explicit width/height attributes
  const w = /width=["'](\d+(?:\.\d+)?)(?:px)?["']/i.exec(svg)
  const h = /height=["'](\d+(?:\.\d+)?)(?:px)?["']/i.exec(svg)
  if (w && h) {
    const origW = parseFloat(w[1])
    const origH = parseFloat(h[1])
    const scale = fallbackWidth / origW
    return { width: fallbackWidth, height: Math.round(origH * scale) }
  }

  return { width: fallbackWidth, height: Math.round(fallbackWidth * 0.6) }
}
```

### Dependency Changes

**Add:** `puppeteer-core` (connects to existing Chromium, no download)
**Remove:** `@resvg/resvg-js` (native binary, no longer needed)

```bash
# In apps/api:
pnpm add puppeteer-core
pnpm remove @resvg/resvg-js
```

### Dockerfile Changes

The `font-liberation` package we added previously is still useful — Chromium will use Liberation Sans when rendering SVG text in the page. No additional Dockerfile changes needed.

The existing `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser` env var is already set in the Dockerfile and will be picked up by `puppeteer-core`.

### Enrichment Orchestrator Changes

**File:** `enrichment/index.ts`

```typescript
import { acquireBrowser, releaseBrowser } from './puppeteer-pool'

// In runArticleEnrichment(), wrap the diagram section loop:
const browser = await acquireBrowser()
try {
  for (const section of sections) {
    // ... existing diagram generation + rasterization logic ...
  }
} finally {
  await releaseBrowser()
}
```

---

## Phase B: GPT-4o-mini Diagram Type Selector

### Architecture: Two-LLM Pipeline

```
For each H2 section:
  ① GPT-4o-mini (cheap)  → selects diagram type
  ② Claude Sonnet (smart) → generates Mermaid syntax of that type
```

### New File: `enrichment/diagram-type-selector.ts`

```typescript
import { getLLMAdapter } from '../llm/factory'
import { logger } from '../../lib/logger'

const PROVIDER = 'openai'
const MODEL = 'gpt-4o-mini'
const TEMPERATURE = 0.2
const MAX_TOKENS = 30

const VALID_TYPES = [
  'flowchart',
  'sequenceDiagram',
  'mindmap',
  'timeline',
  'pie',
  'stateDiagram-v2',
  'gantt',
  'classDiagram',
  'quadrantChart',
] as const

export type MermaidDiagramType = typeof VALID_TYPES[number]

const TYPE_GUIDANCE = `Available diagram types and when to use each:
- flowchart: Processes, decision logic, cause-and-effect chains, step-by-step workflows
- sequenceDiagram: Interactions between actors/entities, communication protocols, request/response flows
- mindmap: Concept relationships, topic breakdowns, brainstorming maps, category overviews
- timeline: Chronological events, recovery phases, historical progression, milestones
- pie: Proportions, distributions, percentage breakdowns (only when section contains numeric data)
- stateDiagram-v2: State transitions, lifecycle stages, condition changes, status workflows
- gantt: Schedules, parallel activities, treatment plans with time durations, project phases
- classDiagram: Hierarchies, taxonomies, type relationships, has-a / is-a structures
- quadrantChart: 2-axis comparisons, risk vs. reward, cost vs. benefit matrices`

const SYSTEM_PROMPT =
  'You select the most appropriate Mermaid.js diagram type for an article section. ' +
  'Output ONLY the diagram type name — nothing else. ' +
  'If no diagram fits the section at all, output: SKIP\n\n' +
  TYPE_GUIDANCE

export interface TypeSelectionResult {
  diagramType: MermaidDiagramType | null
  inputTokens: number
  outputTokens: number
  cost: number
}

export async function selectDiagramType(opts: {
  sectionTitle: string
  contentSnippet: string
  alreadyUsed: string[]
  jobId: string
  position: number
}): Promise<TypeSelectionResult> {
  const adapter = getLLMAdapter(PROVIDER)

  const usedList = opts.alreadyUsed.length > 0
    ? `\nTypes already used in this article (avoid repeating): ${opts.alreadyUsed.join(', ')}`
    : ''

  const userPrompt =
    `Section heading: ${opts.sectionTitle}\n` +
    `Content snippet: ${opts.contentSnippet.slice(0, 400)}\n` +
    usedList +
    `\n\nSelect the single best diagram type for this section.`

  const response = await adapter.call({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    model: MODEL,
    temperature: TEMPERATURE,
    maxTokens: MAX_TOKENS,
  })

  const raw = response.content.trim().toLowerCase()

  if (raw === 'skip') {
    return { diagramType: null, inputTokens: response.tokens.input, outputTokens: response.tokens.output, cost: response.cost }
  }

  // Fuzzy match against valid types
  const matched = VALID_TYPES.find(t => t.toLowerCase() === raw) ?? null

  if (!matched) {
    logger.warn({ jobId: opts.jobId, position: opts.position, raw }, '[enrichment] type-selector returned unknown type — falling back to flowchart')
  }

  return {
    diagramType: matched ?? 'flowchart',
    inputTokens: response.tokens.input,
    outputTokens: response.tokens.output,
    cost: response.cost,
  }
}
```

### Updated `mermaid-generator.ts`

The system prompt and user prompt change to receive and enforce the selected type:

**Current:** "Pick the most appropriate diagram type."
**New:** "Generate a `{selectedType}` Mermaid diagram for this section. You MUST use this diagram type."

The function signature gains a `diagramType` parameter:

```typescript
export async function generateMermaidDiagram(opts: {
  sectionTitle: string
  sectionHtml: string
  articleTopic: string
  primaryKeyword: string
  jobId: string
  position: number
  diagramType: string          // NEW — from type selector
  retryContext?: string
}): Promise<DiagramResult> { ... }
```

Updated system prompt:

```typescript
const SYSTEM_PROMPT =
  'You generate Mermaid.js diagrams that visually summarize a section of an article. ' +
  'You output ONLY valid Mermaid syntax — no explanation, no code fences, no markdown. ' +
  'If the section is purely narrative or does not benefit from a visual, output exactly: SKIP'
```

Updated user prompt (adds type constraint):

```typescript
`You MUST generate a ${opts.diagramType} diagram.\n` +
`Do not use any other diagram type.\n\n` +
`Section heading: ${opts.sectionTitle}\n\n` +
`Section HTML:\n${htmlSnippet}\n\n` +
'Output a Mermaid diagram that adds visual clarity to this section. ' +
'Do not exceed 12 nodes. Use plain English labels. No code fences. No commentary.'
```

### Updated Enrichment Loop

**File:** `enrichment/index.ts`

The per-section loop changes from:

```
for section: generateMermaidDiagram(section) → render → save
```

To:

```
const usedTypes: string[] = []

for section:
  ① selectDiagramType(section, usedTypes) → type
  ② if type === null: skip
  ③ generateMermaidDiagram(section, type) → syntax
  ④ render → save
  ⑤ usedTypes.push(type)
```

**Cost impact:** GPT-4o-mini at ~300 input + 20 output tokens per call = ~$0.00006 per section. For 9 sections: ~$0.0005 total. Negligible.

---

## Phase C: Brand-Matched Diagram Colors

### New Database Fields

Add to `BrandSettings` in `schema.prisma`:

```prisma
model BrandSettings {
  // ... existing fields ...

  // Diagram color scheme (used by Mermaid init directive)
  diagramPrimaryColor      String?  // Node fill — e.g. "#4F46E5"
  diagramPrimaryTextColor  String?  // Text inside nodes — e.g. "#FFFFFF"
  diagramSecondaryColor    String?  // Accent/highlight — e.g. "#F59E0B"
  diagramLineColor         String?  // Connector lines — e.g. "#374151"
  diagramTextColor         String?  // Text outside nodes — e.g. "#1F2937"
  diagramFontFamily        String?  // Font name — e.g. "Inter"
}
```

`tertiaryColor` is not stored — it equals `secondaryColor` (enforced in the init directive builder).

### Default Palette (when fields are null)

| Variable | Default | Source |
|----------|---------|--------|
| primaryColor | `#3B82F6` (blue-500) | Tailwind blue |
| primaryTextColor | `#FFFFFF` | White |
| secondaryColor | `#8B5CF6` (violet-500) | Tailwind violet |
| tertiaryColor | = secondaryColor | Enforced |
| lineColor | `#6B7280` (gray-500) | Tailwind gray |
| textColor | `#1F2937` (gray-800) | Tailwind gray |
| fontFamily | `Arial, Helvetica, sans-serif` | Web-safe |

### Init Directive Builder

**File:** `enrichment/diagram-theme.ts` (NEW)

```typescript
export interface DiagramTheme {
  primaryColor: string
  primaryTextColor: string
  secondaryColor: string
  lineColor: string
  textColor: string
  fontFamily: string
}

const DEFAULTS: DiagramTheme = {
  primaryColor: '#3B82F6',
  primaryTextColor: '#FFFFFF',
  secondaryColor: '#8B5CF6',
  lineColor: '#6B7280',
  textColor: '#1F2937',
  fontFamily: 'Arial, Helvetica, sans-serif',
}

export function buildThemeFromBrand(brand: Partial<DiagramTheme> | null): DiagramTheme {
  return {
    primaryColor: brand?.primaryColor || DEFAULTS.primaryColor,
    primaryTextColor: brand?.primaryTextColor || DEFAULTS.primaryTextColor,
    secondaryColor: brand?.secondaryColor || DEFAULTS.secondaryColor,
    lineColor: brand?.lineColor || DEFAULTS.lineColor,
    textColor: brand?.textColor || DEFAULTS.textColor,
    fontFamily: brand?.fontFamily || DEFAULTS.fontFamily,
  }
}

export function buildInitDirective(theme: DiagramTheme): string {
  return (
    `%%{init: {"theme": "base", "themeVariables": {` +
    `"primaryColor": "${theme.primaryColor}", ` +
    `"primaryTextColor": "${theme.primaryTextColor}", ` +
    `"primaryBorderColor": "${darken(theme.primaryColor, 15)}", ` +
    `"secondaryColor": "${theme.secondaryColor}", ` +
    `"secondaryTextColor": "${theme.primaryTextColor}", ` +
    `"secondaryBorderColor": "${darken(theme.secondaryColor, 15)}", ` +
    `"tertiaryColor": "${theme.secondaryColor}", ` +
    `"tertiaryTextColor": "${theme.primaryTextColor}", ` +
    `"lineColor": "${theme.lineColor}", ` +
    `"textColor": "${theme.textColor}", ` +
    `"fontFamily": "${theme.fontFamily}"` +
    `}, ` +
    `"flowchart": {"htmlLabels": false}, ` +
    `"sequence": {"htmlLabels": false}, ` +
    `"class": {"htmlLabels": false}, ` +
    `"state": {"htmlLabels": false}` +
    `}}%%`
  )
}

function darken(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, (num >> 16) - Math.round(2.55 * percent))
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(2.55 * percent))
  const b = Math.max(0, (num & 0xff) - Math.round(2.55 * percent))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}
```

### Flow Through Enrichment

```
runArticleEnrichment(jobId)
  → Fetch BrandSettings for job.userId
  → buildThemeFromBrand(brandSettings) → theme
  → buildInitDirective(theme) → initDirective
  → Pass initDirective to renderMermaidToSvg() instead of hardcoded INIT_DIRECTIVE
```

`svg-renderer.ts` changes: `renderMermaidToSvg()` gains a second parameter:

```typescript
export async function renderMermaidToSvg(
  mermaidSyntax: string,
  initDirective?: string,   // caller provides brand-themed directive
): Promise<string> {
  // ...
  const directive = initDirective ?? DEFAULT_INIT_DIRECTIVE
  const withInit = mermaidSyntax.trimStart().startsWith('%%{init')
    ? mermaidSyntax
    : directive + '\n' + mermaidSyntax
  // ...
}
```

### Settings UI — Diagram Style Card

**File:** `apps/web/src/app/(protected)/settings/page.tsx`

Add a new card **after** the "Article Brand Profile" card and **before** "Connected Accounts":

```
┌─────────────────────────────────────────────────┐
│ Diagram Style                                    │
│                                                  │
│ Customize the colors and font used in article    │
│ diagrams. Leave blank for defaults.              │
│                                                  │
│ ┌─────────────┐  ┌──────────────┐               │
│ │ Primary      │  │ Secondary    │               │
│ │ [■ #4F46E5]  │  │ [■ #F59E0B]  │               │
│ └─────────────┘  └──────────────┘               │
│ ┌─────────────┐  ┌──────────────┐               │
│ │ Text Color   │  │ Line Color   │               │
│ │ [■ #1F2937]  │  │ [■ #6B7280]  │               │
│ └─────────────┘  └──────────────┘               │
│ ┌──────────────────────────────┐                 │
│ │ Font Family                   │                 │
│ │ [  Arial, Helvetica, sans  v] │                 │
│ └──────────────────────────────┘                 │
│                                                  │
│  [Preview]  [Save Diagram Style]                 │
└─────────────────────────────────────────────────┘
```

Each color field is a standard `<input type="color">` next to a text input showing the hex value. The font dropdown includes:

- Arial, Helvetica, sans-serif (default)
- Georgia, serif
- Inter, sans-serif
- Roboto, sans-serif
- Open Sans, sans-serif
- Lato, sans-serif
- Source Sans Pro, sans-serif
- Nunito, sans-serif

The "Preview" button is a stretch goal — it renders a small static sample diagram using an inline SVG with the chosen colors applied via CSS variables. Not required for MVP.

### API Route for Diagram Settings

The existing `PATCH /api/brand-settings` route already saves all `BrandSettings` fields. The new diagram fields will be included in the same payload — no new route needed.

**Backend route** (`apps/api/src/routes/brand-settings.ts` or equivalent): Add the 6 new fields to the update whitelist.

---

## Database Changes

### Migration 1: Diagram brand color fields

```sql
ALTER TABLE "brand_settings"
  ADD COLUMN "diagramPrimaryColor"     TEXT,
  ADD COLUMN "diagramPrimaryTextColor" TEXT,
  ADD COLUMN "diagramSecondaryColor"   TEXT,
  ADD COLUMN "diagramLineColor"        TEXT,
  ADD COLUMN "diagramTextColor"        TEXT,
  ADD COLUMN "diagramFontFamily"       TEXT;
```

All nullable, no breaking change.

---

## File Inventory

| File | Action | Phase | Description |
|------|--------|-------|-------------|
| `apps/api/src/article-pipeline/enrichment/puppeteer-pool.ts` | CREATE | A | Shared browser instance management |
| `apps/api/src/article-pipeline/enrichment/svg-rasterizer.ts` | REWRITE | A | Replace resvg-js with Puppeteer screenshot |
| `apps/api/src/article-pipeline/enrichment/index.ts` | MODIFY | A+B | acquireBrowser/releaseBrowser lifecycle, type selector integration |
| `apps/api/package.json` | MODIFY | A | Add `puppeteer-core`, remove `@resvg/resvg-js` |
| `apps/api/src/article-pipeline/enrichment/diagram-type-selector.ts` | CREATE | B | GPT-4o-mini type selection |
| `apps/api/src/article-pipeline/enrichment/mermaid-generator.ts` | MODIFY | B | Accept `diagramType` param, constrain prompt |
| `apps/api/src/article-pipeline/enrichment/diagram-theme.ts` | CREATE | C | Brand theme → init directive builder |
| `apps/api/src/article-pipeline/enrichment/svg-renderer.ts` | MODIFY | C | Accept `initDirective` param (replaces hardcoded constant) |
| `packages/db/prisma/schema.prisma` | MODIFY | C | Add 6 diagram color fields to BrandSettings |
| `apps/api/src/routes/brand-settings.ts` | MODIFY | C | Whitelist new fields in PATCH handler |
| `apps/web/src/app/(protected)/settings/page.tsx` | MODIFY | C | Diagram Style card with color pickers + font dropdown |
| `apps/web/src/app/api/brand-settings/route.ts` | MODIFY | C | Pass new fields through proxy (if filtered) |

---

## Implementation Checklist

### Phase A — Puppeteer PNG Rasterizer

- [ ] **A1.** Add `puppeteer-core` to `apps/api`, remove `@resvg/resvg-js`
- [ ] **A2.** Create `puppeteer-pool.ts` — shared browser instance with ref counting
- [ ] **A3.** Rewrite `svg-rasterizer.ts` — Puppeteer page screenshot
- [ ] **A4.** Update `enrichment/index.ts` — `acquireBrowser()` before loop, `releaseBrowser()` in finally
- [ ] **A5.** TypeScript build check
- [ ] **A6.** Commit + push + deploy
- [ ] **A7.** Re-run enrichment on test article → verify PNGs show text

### Phase B — Diagram Type Selector

- [ ] **B1.** Create `diagram-type-selector.ts` — GPT-4o-mini selection
- [ ] **B2.** Update `mermaid-generator.ts` — accept `diagramType`, constrain prompt
- [ ] **B3.** Update `enrichment/index.ts` — call type selector before mermaid generator, track `usedTypes`
- [ ] **B4.** TypeScript build check
- [ ] **B5.** Commit + push + deploy
- [ ] **B6.** Re-run enrichment → verify diagram variety (expect 3+ distinct types in one article)

### Phase C — Brand-Matched Colors

- [ ] **C1.** Add 6 diagram color fields to `BrandSettings` in Prisma schema + migration
- [ ] **C2.** Create `diagram-theme.ts` — theme builder + init directive generator
- [ ] **C3.** Update `svg-renderer.ts` — accept `initDirective` parameter
- [ ] **C4.** Update `enrichment/index.ts` — fetch BrandSettings, build theme, pass to renderer
- [ ] **C5.** Update backend brand-settings route — whitelist new fields
- [ ] **C6.** Update Settings UI — Diagram Style card with 4 color pickers + font dropdown
- [ ] **C7.** Update `handleSaveBrandProfile` — include new fields in PATCH payload
- [ ] **C8.** TypeScript build check (api + web)
- [ ] **C9.** Commit + push + deploy
- [ ] **C10.** Set test colors in Settings → re-run enrichment → verify diagrams use brand colors

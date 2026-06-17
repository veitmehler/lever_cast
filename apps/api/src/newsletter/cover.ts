/**
 * Cover "summary image" for a newsletter edition.
 *
 * A composited briefing cover (title + date + a grid of up to 6 tiles, each = a
 * text-free Fal icon + the real headline) — rendered server-side via the headless
 * Chrome already used for diagrams (diffusion can't render legible headlines, so
 * the text is composited, not generated). Returns the S3 URL.
 */
import { prisma } from '@socioply/shared'
import { generateWithFalAI, uploadBufferWithKey } from '@socioply/shared'
import { getDiagramRasterBrowser } from '../article-pipeline/enrichment/diagram-browser-pool'
import { getSystemApiKey } from '../lib/system-keys'
import { cleanTextOutput } from '../article-pipeline/output-cleaner'
import { logger } from '../lib/logger'
import { runNewsletterPrompt } from './llm'
import { cacheBust } from './image-overlay'
import type { UsageRecorder } from './article'

const FALLBACK_ICON_STYLE =
  'minimal single-color line icon, dark navy (#011328) on a plain solid white background, thin uniform monoline strokes, outline only, no fill, no shadow, no gradient, centered single subject, vector style, no text, no words, no letters'
const FALLBACK_ICON_MODEL = 'fal-ai/flux/schnell'

export interface CoverItem {
  headline: string
}

export interface CoverColors {
  headerBg: string
  sections: string[] // tile accent colors, cycled
}

interface Tile {
  headline: string
  iconDataUri: string | null
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function buildCoverHtml(title: string, date: string, tiles: Tile[], colors: CoverColors): string {
  // Minimal 2-color scheme: dark navy + white. Navy background + caption strip,
  // white icon panel with a centered monoline icon, white text.
  const navy = colors.headerBg
  const cells = tiles
    .map((t) => {
      const icon = t.iconDataUri
        ? `<div class="ico" style="background-image:url('${t.iconDataUri}')"></div>`
        : `<div class="ico ico-empty"></div>`
      return `<div class="tile">
        ${icon}
        <div class="cap">${esc(t.headline)}</div>
      </div>`
    })
    .join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:${navy}; }
  #cover { width:680px; background:${navy}; padding:30px 26px 34px; font-family:'Trebuchet MS','Segoe UI',Helvetica,Arial,sans-serif; }
  .title { color:#fff; font-size:46px; font-weight:800; line-height:1.05; letter-spacing:0.5px; text-align:left; }
  .date { color:#fff; opacity:0.75; font-size:18px; font-weight:600; margin:8px 0 26px; }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
  .tile { background:#ffffff; border-radius:12px; overflow:hidden; display:flex; flex-direction:column; }
  .ico { height:120px; background:#ffffff; background-size:contain; background-position:center; background-repeat:no-repeat; margin:14px 14px 0; }
  .ico-empty { background:#f1f4f8; border-radius:8px; }
  .cap { color:#ffffff; background:${navy}; font-size:15px; font-weight:700; line-height:1.25; padding:14px 16px; min-height:66px; display:flex; align-items:center; }
</style></head>
<body><div id="cover">
  <div class="title">${esc(title)}</div>
  <div class="date">${esc(date)}</div>
  <div class="grid">${cells}</div>
</div></body></html>`
}

/** Generate one text-free icon → base64 data URI (null on failure). */
async function generateIcon(headline: string, styleSuffix: string, model: string, falKey: string): Promise<string | null> {
  try {
    const prompt = `Icon representing: ${headline}. ${styleSuffix}`
    const buf = await generateWithFalAI(falKey, prompt, model)
    return `data:image/jpeg;base64,${buf.toString('base64')}`
  } catch (err) {
    logger.warn({ headline, err }, '[newsletter/cover] icon generation failed (non-fatal)')
    return null
  }
}

/** Screenshot the composed cover HTML and upload to S3. Returns the URL. */
async function renderCover(html: string, key: string): Promise<string> {
  const browser = await getDiagramRasterBrowser()
  const page = await browser.newPage()
  try {
    await page.setViewport({ width: 680, height: 900, deviceScaleFactor: 2 })
    // Icons are embedded as data URIs, so 'load' (images decoded) is enough —
    // and 'networkidle0' isn't a valid setContent waitUntil in puppeteer-core v24.
    await page.setContent(html, { waitUntil: 'load' })
    const el = await page.$('#cover')
    if (!el) throw new Error('cover element not found')
    const shot = await el.screenshot({ type: 'png' })
    const { url } = await uploadBufferWithKey(`newsletter/${key}-cover.png`, Buffer.from(shot), 'image/png')
    return cacheBust(url)
  } finally {
    await page.close().catch(() => {})
  }
}

export interface GenerateCoverParams {
  keyPrefix: string // `${topicId}/${userId}`
  industry: string
  who: string
  editionDate: Date
  items: CoverItem[] // already capped/ordered (max 6)
  colors: CoverColors
  usage: UsageRecorder
}

/**
 * Build the cover: LLM 3-word title + date, one Fal icon per item, composite →
 * S3. Returns { summaryTitle, summaryImageUrl } (either may be null on failure).
 */
export async function generateCoverImage(
  params: GenerateCoverParams,
): Promise<{ summaryTitle: string | null; summaryImageUrl: string | null }> {
  const items = params.items.slice(0, 6).filter((i) => i.headline?.trim())
  if (items.length === 0) return { summaryTitle: null, summaryImageUrl: null }

  // 1. 3-word title.
  let summaryTitle: string | null = null
  try {
    const { content, response } = await runNewsletterPrompt('nl_summary_title', {
      industry: params.industry,
      who: params.who,
      headlines: items.map((i) => i.headline).join('; '),
    })
    await params.usage.record(response)
    summaryTitle = cleanTextOutput(content).replace(/["']/g, '').trim() || null
  } catch (err) {
    logger.warn({ err }, '[newsletter/cover] title generation failed')
  }

  // 2. Icon style + model (admin-editable config row).
  const styleRow = await prisma.promptTemplate.findUnique({ where: { key: 'nl_summary_icon_style' } })
  const styleSuffix = styleRow?.userPrompt?.trim() || FALLBACK_ICON_STYLE
  const iconModel = styleRow?.defaultModel || FALLBACK_ICON_MODEL
  const falKey = await getSystemApiKey('fal-ai')

  // 3. Icons (sequential to keep the Fal load gentle).
  const tiles: Tile[] = []
  for (const item of items) {
    const iconDataUri = falKey ? await generateIcon(item.headline, styleSuffix, iconModel, falKey) : null
    tiles.push({ headline: item.headline, iconDataUri })
  }

  // 4. Compose + render.
  const dateStr = params.editionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const title = summaryTitle ?? `${params.industry || 'Your'} Briefing`
  try {
    const html = buildCoverHtml(title, dateStr, tiles, params.colors)
    const url = await renderCover(html, params.keyPrefix)
    return { summaryTitle, summaryImageUrl: url }
  } catch (err) {
    logger.warn({ err }, '[newsletter/cover] compose/render failed')
    return { summaryTitle, summaryImageUrl: null }
  }
}

/**
 * Cover "summary image" for a newsletter edition.
 *
 * A composited briefing cover (title + date + a grid of up to 6 tiles, each = a
 * text-free Fal icon + the real headline) — rendered server-side via the headless
 * Chrome already used for diagrams (diffusion can't render legible headlines, so
 * the text is composited, not generated). Returns the S3 URL.
 */
import { prisma } from '@socioply/shared'
import { generateWithFalAI, generateWithGeminiImage, uploadBufferWithKey } from '@socioply/shared'
import { getDiagramRasterBrowser } from '../article-pipeline/enrichment/diagram-browser-pool'
import { getSystemApiKey } from '../lib/system-keys'
import { cleanTextOutput } from '../article-pipeline/output-cleaner'
import { logger } from '../lib/logger'
import { runNewsletterPrompt } from './llm'
import { vtoken } from './image-overlay'
import type { UsageRecorder } from './article'

// Primary cover path: one Gemini ("Nano Banana") image rendering the whole cover
// (icons + short labels) in a single call. The title/date are NOT in the image —
// they're a navy HTML masthead band emitted above the cover in render.ts. On any
// failure we fall back to the legacy text-free-icon composite below.
const FALLBACK_COVER_MODEL = 'gemini-3.1-flash-image'
const FALLBACK_STYLE_GUIDE = `Style Instructions:

Overall Aesthetic: Sophisticated, minimalist, modern infographic style. Clean-line vector art. The overall impression should be a high-end glowing blueprint or technical diagram.

Background: Use a solid, deep matte indigo-blue/dark navy background. Strictly no gradients or background clutter.

Line Work: Render all subjects using continuous, fine, uniform-weight outlines. Strictly no solid color fills or shading within the subjects — rely entirely on minimalist contour lines.

Color Palette (Strict Duo-Tone — only these two ink colors, nothing else):
- Primary Line Color: Pure bright white (used for the main subjects, structural outlines, and typography). Do NOT use blue or any other color for the line work — the lines and text are white only.
- Accent Line Color: Warm, burnished copper / brown-gold (used sparingly for highlights, secondary details, and motion indicators). This is the ONLY non-white color in the artwork.

Typography: Any text labels must be clean, crisp, all-caps, modern sans-serif font using the primary white color.

Lighting & Finish: Apply a very subtle, soft luminescent glow (like a faint neon effect) to all lines and text so they pop crisply against the dark background.`

/** Compose the one-shot cover prompt: what to depict + label/dedupe rules + style guide. */
function buildCoverPrompt(items: CoverItem[], industry: string, who: string, styleGuide: string): string {
  // Drop exact-duplicate headlines; the prompt also tells the model to merge
  // near-duplicate themes so the same concept is never drawn twice.
  const seen = new Set<string>()
  const unique = items.filter((i) => {
    const k = i.headline.trim().toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  const topics = unique.map((i) => `- ${i.headline}`).join('\n')
  return `Create a single MAGAZINE-COVER infographic that is a catchy visual summary of this ${industry || 'wellness'} newsletter edition${who ? ` for this audience: ${who}` : ''}.

Show these as small illustrated icons/vignettes arranged in ONE balanced composition, each with its own short all-caps label (correctly spelled):
${topics}

Each distinct topic gets exactly ONE icon and ONE label. If two topics cover the same theme (e.g. both about recovery), MERGE them into a single icon — never draw the same concept twice and never repeat a label. No sentences, no paragraphs, no body text, no fake or garbled lettering. Fill the entire square frame with the artwork — no empty banner and no large title text (a title and date are added outside the image). Square 1:1 composition.

${styleGuide}`
}

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
    const { url } = await uploadBufferWithKey(`newsletter/${key}-cover-${vtoken()}.png`, Buffer.from(shot), 'image/png')
    return url
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
 * Build the cover. Primary path: one Gemini ("Nano Banana") image of the whole
 * cover. Falls back to the legacy text-free-icon composite on any failure.
 * Returns { summaryTitle, summaryImageUrl } (summaryTitle is null on the Gemini
 * path — the title is an HTML masthead band in render.ts).
 */
export async function generateCoverImage(
  params: GenerateCoverParams,
): Promise<{ summaryTitle: string | null; summaryImageUrl: string | null }> {
  const items = params.items.slice(0, 6).filter((i) => i.headline?.trim())
  if (items.length === 0) return { summaryTitle: null, summaryImageUrl: null }

  const cfg = await prisma.promptTemplate.findUnique({ where: { key: 'nl_summary_style_guide' } })
  const styleGuide = cfg?.userPrompt?.trim() || FALLBACK_STYLE_GUIDE
  const model = cfg?.defaultModel || FALLBACK_COVER_MODEL
  const geminiKey = await getSystemApiKey('gemini')

  if (geminiKey) {
    try {
      const prompt = buildCoverPrompt(items, params.industry, params.who, styleGuide)
      const buf = await generateWithGeminiImage(geminiKey, prompt, model, '1:1')
      const { url } = await uploadBufferWithKey(
        `newsletter/${params.keyPrefix}-cover-${vtoken()}.png`,
        buf,
        'image/png',
      )
      return { summaryTitle: null, summaryImageUrl: url }
    } catch (err) {
      logger.warn({ err }, '[newsletter/cover] Gemini cover failed; falling back to icon composite')
    }
  }
  return generateCoverComposite(params, items)
}

/**
 * Legacy fallback: LLM 3-word title + date, one Fal icon per item, composite →
 * S3. Returns { summaryTitle, summaryImageUrl } (either may be null on failure).
 */
async function generateCoverComposite(
  params: GenerateCoverParams,
  items: CoverItem[],
): Promise<{ summaryTitle: string | null; summaryImageUrl: string | null }> {

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

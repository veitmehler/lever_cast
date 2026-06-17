/**
 * Magazine newsletter email renderer.
 *
 * Pure function (no DB) → an email-safe HTML string used as both the on-app
 * preview and the body sent to GHL. Table-based, ~680px centered, critical CSS
 * inlined. Visual hierarchy = full-width colored heading bands (cycling 4 brand
 * "section" colors) separating white content blocks.
 *
 * Section order (redesign): header → trivia question → cover summary image →
 * video → facts → teaser 1 → tips → teaser 2 → joke → feature → teaser 3 →
 * secondary article → recipe → recipe 2 → trivia answer → footer. Sections with
 * no data drop out.
 */

export interface RenderArticle {
  title: string
  teaser: string
  tldr: string
  body: string // HTML
  imageUrl: string | null
}

export interface RenderTeaser {
  headline: string | null // the real source article title (preferred heading)
  title: string // voiced teaser title (fallback heading)
  body: string // HTML
  cta: string // HTML
  link: string
}

export interface RenderVideo {
  url: string | null
  title: string | null
  thumbnailUrl: string | null
  s3Url: string | null
  manual: boolean
}

export interface RenderRecipe {
  intro: string
  ingredients: string
  instructions: string
  imageUrl: string | null
}

export interface RenderModules {
  recipe?: RenderRecipe
  recipe2?: RenderRecipe
}

export interface RenderBrand {
  organizationName?: string | null
  organizationAddress?: string | null
  nlLogoUrl?: string | null
  organizationLogoUrl?: string | null
  nlLogoWidth?: number | null
  nlHeaderBgColor?: string | null
  nlFooterBgColor?: string | null
  nlSectionColor1?: string | null
  nlSectionColor2?: string | null
  nlSectionColor3?: string | null
  nlSectionColor4?: string | null
  nlFontFamily?: string | null
  nlFontColor?: string | null
  nlHeadingFontWeight?: string | null
  nlBodyFontWeight?: string | null
  nlLinkColor?: string | null
}

export interface RenderInput {
  featureArticle?: RenderArticle | null
  secondaryArticle?: RenderArticle | null
  teasers?: RenderTeaser[] | null
  quickHits?: { tips: string[]; facts: string[] } | null
  fun?: { triviaQuestion: string | null; triviaAnswer: string | null; joke: string | null } | null
  modules?: RenderModules | null
  previewText?: string | null
  video?: RenderVideo | null
  summaryImageUrl?: string | null
}

interface Theme {
  headerBg: string
  footerBg: string
  sections: string[] // 4 band colors, cycled
  fontStack: string
  fontColor: string
  headingWeight: string
  bodyWeight: string
  linkColor: string
  logoUrl: string | null
  logoWidth: number
}

const FALLBACK_FONTS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
const HEADING_STACK = "'Trebuchet MS', 'Segoe UI', Helvetica, Arial, sans-serif"

function resolveTheme(brand: RenderBrand): Theme {
  const primary = brand.nlFontFamily?.trim()
  return {
    headerBg: brand.nlHeaderBgColor?.trim() || '#fa00bb',
    footerBg: brand.nlFooterBgColor?.trim() || '#011328',
    sections: [
      brand.nlSectionColor1?.trim() || '#fa00bb',
      brand.nlSectionColor2?.trim() || '#00bbf9',
      brand.nlSectionColor3?.trim() || '#00142b',
      brand.nlSectionColor4?.trim() || '#00dd81',
    ],
    fontStack: primary ? `${primary}, ${FALLBACK_FONTS}` : FALLBACK_FONTS,
    fontColor: brand.nlFontColor?.trim() || '#00142b',
    headingWeight: brand.nlHeadingFontWeight?.trim() || '700',
    bodyWeight: brand.nlBodyFontWeight?.trim() || '400',
    linkColor: brand.nlLinkColor?.trim() || '#fa00bb',
    logoUrl: brand.nlLogoUrl?.trim() || brand.organizationLogoUrl?.trim() || null,
    logoWidth: brand.nlLogoWidth && brand.nlLogoWidth > 0 ? brand.nlLogoWidth : 320,
  }
}

function esc(s: string | null | undefined): string {
  if (!s) return ''
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** A full-width colored heading band. */
function band(title: string, bg: string, theme: Theme): string {
  return `<tr><td style="background-color:${bg};padding:22px 24px;text-align:center;">
    <h1 style="margin:0;font-family:${HEADING_STACK};font-size:30px;font-weight:${theme.headingWeight};color:#ffffff;letter-spacing:0.5px;line-height:1.2;">${esc(title)}</h1>
  </td></tr>`
}

/** A white content row. */
function content(inner: string): string {
  return `<tr><td style="background-color:#ffffff;padding:32px 28px;">${inner}</td></tr>`
}

/** 30px vertical spacer between sections. */
function spacer(): string {
  return `<tr><td style="height:30px;line-height:30px;font-size:0;background-color:#ffffff;">&nbsp;</td></tr>`
}

/** A large plain heading (no colored band) on white — used for the trivia question. */
function plainHeading(title: string, theme: Theme): string {
  return `<tr><td style="background-color:#ffffff;padding:8px 24px 0;text-align:center;">
    <h1 style="margin:0;font-family:${HEADING_STACK};font-size:30px;font-weight:${theme.headingWeight};color:${theme.fontColor};letter-spacing:0.3px;line-height:1.2;">${esc(title)}</h1>
  </td></tr>`
}

function para(html: string, theme: Theme, align: 'left' | 'center' = 'left'): string {
  return `<div style="font-family:${theme.fontStack};font-size:16px;font-weight:${theme.bodyWeight};color:${theme.fontColor};line-height:1.6;text-align:${align};">${html}</div>`
}

function bulletList(items: string[], theme: Theme): string {
  const lis = items
    .map(
      (i) =>
        `<li style="margin:0 0 12px;font-family:${theme.fontStack};font-size:16px;font-weight:${theme.bodyWeight};color:${theme.fontColor};line-height:1.5;">${esc(i)}</li>`,
    )
    .join('')
  return `<ul style="margin:0;padding:0 0 0 22px;">${lis}</ul>`
}

function readMoreButton(link: string, theme: Theme, label = 'Read full article →'): string {
  return `<div style="margin-top:20px;"><a href="${esc(link || '#')}" target="_blank" style="display:inline-block;font-family:${theme.fontStack};font-size:16px;font-weight:${theme.headingWeight};color:${theme.linkColor};text-decoration:none;border:2px solid ${theme.linkColor};border-radius:4px;padding:10px 22px;">${esc(label)}</a></div>`
}

function articleBlock(a: RenderArticle, theme: Theme, showTitle = true): string {
  const img = a.imageUrl
    ? `<img src="${esc(a.imageUrl)}" width="624" alt="${esc(a.title)}" style="display:block;width:100%;max-width:624px;height:auto;border-radius:6px;margin:0 0 18px;" />`
    : ''
  // When the band already shows the article title (secondary), skip the inner h2.
  const h2 = showTitle
    ? `<h2 style="margin:0 0 14px;font-family:${theme.fontStack};font-size:24px;font-weight:${theme.headingWeight};color:${theme.fontColor};line-height:1.3;">${esc(a.title)}</h2>`
    : ''
  const tldr = a.tldr
    ? `<p style="margin:0 0 14px;font-family:${theme.fontStack};font-size:15px;color:${theme.fontColor};"><u>TL;DR:</u> ${esc(a.tldr)}</p>`
    : ''
  return `${img}${h2}${tldr}${para(a.body, theme)}`
}

function teaserBlock(t: RenderTeaser, theme: Theme): string {
  return `${para(t.body, theme)}<div style="margin-top:14px;">${para(t.cta, theme)}</div>${readMoreButton(t.link, theme)}`
}

function videoCard(v: RenderVideo, theme: Theme): string {
  const thumb = v.s3Url || v.thumbnailUrl
  const title = v.title || 'Watch the video'
  const img = thumb
    ? `<img src="${esc(thumb)}" width="624" alt="${esc(title)}" style="display:block;width:100%;max-width:624px;height:auto;border-radius:6px;" />`
    : ''
  // The play button is composited onto the thumbnail server-side, so no glyph here.
  return `<a href="${esc(v.url || '#')}" target="_blank" style="text-decoration:none;">${img}<div style="font-family:${theme.fontStack};font-size:18px;font-weight:${theme.headingWeight};color:${theme.linkColor};margin:12px 0 0;text-align:center;">${esc(title)}</div></a>`
}

function recipeBlock(r: RenderRecipe, theme: Theme): string {
  const img = r.imageUrl
    ? `<img src="${esc(r.imageUrl)}" width="624" alt="Recipe" style="display:block;width:100%;max-width:624px;height:auto;border-radius:6px;margin:0 0 18px;" />`
    : ''
  const h3 = (t: string) =>
    `<h3 style="margin:22px 0 10px;font-family:${theme.fontStack};font-size:18px;font-weight:${theme.headingWeight};color:${theme.fontColor};">${t}</h3>`
  return `${img}${para(r.intro, theme)}${h3('Ingredients')}${para(r.ingredients, theme)}${h3('Instructions')}${para(r.instructions, theme)}`
}

export function buildRenderInput(
  nl: {
    featureArticle?: unknown
    secondaryArticle?: unknown
    teasers?: unknown
    quickHits?: unknown
    fun?: unknown
    modules?: unknown
    previewText?: string | null
    summaryImageUrl?: string | null
  },
  video?: RenderVideo | null,
): RenderInput {
  const qh = nl.quickHits as { tips?: string[]; facts?: string[] } | null | undefined
  return {
    featureArticle: (nl.featureArticle as RenderArticle | null) ?? null,
    secondaryArticle: (nl.secondaryArticle as RenderArticle | null) ?? null,
    teasers: (nl.teasers as RenderTeaser[] | null) ?? null,
    quickHits: qh ? { tips: qh.tips ?? [], facts: qh.facts ?? [] } : null,
    fun: (nl.fun as RenderInput['fun']) ?? null,
    modules: (nl.modules as RenderModules | null) ?? null,
    previewText: nl.previewText ?? null,
    video: video ?? null,
    summaryImageUrl: nl.summaryImageUrl ?? null,
  }
}

export function renderNewsletterHtml(input: RenderInput, brand: RenderBrand): string {
  const theme = resolveTheme(brand)
  const rows: string[] = []
  // Start the band cycle at color 2 so the first band never matches the header
  // (whose default equals section color 1).
  let colorIdx = 1
  const nextColor = () => theme.sections[colorIdx++ % theme.sections.length]
  // Emit a colored band + white content block + spacer for one section.
  const section = (title: string, inner: string) => {
    rows.push(band(title, nextColor(), theme))
    rows.push(content(inner))
    rows.push(spacer())
  }

  // Header (logo on header band)
  const logo = theme.logoUrl
    ? `<img src="${esc(theme.logoUrl)}" alt="${esc(brand.organizationName ?? 'Logo')}" width="${theme.logoWidth}" style="display:block;width:100%;max-width:${theme.logoWidth}px;height:auto;margin:0 auto;" />`
    : `<div style="font-family:${HEADING_STACK};font-size:26px;font-weight:${theme.headingWeight};color:#ffffff;text-align:center;">${esc(brand.organizationName ?? '')}</div>`
  rows.push(`<tr><td style="background-color:${theme.headerBg};padding:24px;text-align:center;">${logo}</td></tr>`)
  rows.push(spacer())

  const fun = input.fun
  const teasers = input.teasers ?? []

  // Trivia question — plain heading (no band)
  if (fun?.triviaQuestion) {
    rows.push(plainHeading('Trivia Question', theme))
    rows.push(content(para(`<p style="margin:0;font-size:20px;">${esc(fun.triviaQuestion)}</p>`, theme, 'center')))
    rows.push(spacer())
  }

  // Cover summary image (full-width, no band)
  if (input.summaryImageUrl) {
    rows.push(
      `<tr><td style="background-color:#ffffff;padding:0;"><img src="${esc(input.summaryImageUrl)}" width="680" alt="In this issue" style="display:block;width:100%;max-width:680px;height:auto;" /></td></tr>`,
    )
    rows.push(spacer())
  }

  // Video
  if (input.video?.url) section('Watch This', videoCard(input.video, theme))

  // Facts
  if (input.quickHits && input.quickHits.facts.length > 0) {
    section('Did You Know?', bulletList(input.quickHits.facts, theme))
  }

  // Teaser 1
  if (teasers[0]) section(teaserHeading(teasers[0]), teaserBlock(teasers[0], theme))

  // Tips
  if (input.quickHits && input.quickHits.tips.length > 0) {
    section('Tips Of The Day', bulletList(input.quickHits.tips, theme))
  }

  // Teaser 2
  if (teasers[1]) section(teaserHeading(teasers[1]), teaserBlock(teasers[1], theme))

  // Joke
  if (fun?.joke) section('Joke Of The Day', para(fun.joke, theme, 'center'))

  // Feature article
  if (input.featureArticle) section('Article Of The Day', articleBlock(input.featureArticle, theme))

  // Teaser 3
  if (teasers[2]) section(teaserHeading(teasers[2]), teaserBlock(teasers[2], theme))

  // Secondary (specialization) article — band shows its own headline
  if (input.secondaryArticle) section(input.secondaryArticle.title, articleBlock(input.secondaryArticle, theme, false))

  // Recipes
  if (input.modules?.recipe) section('Recipe Of The Day', recipeBlock(input.modules.recipe, theme))
  if (input.modules?.recipe2) section('Another Recipe', recipeBlock(input.modules.recipe2, theme))

  // Trivia answer (payoff, last)
  if (fun?.triviaQuestion && fun?.triviaAnswer) {
    section('Trivia Answer', para(`<p style="margin:0;font-size:22px;">${esc(fun.triviaAnswer)}</p>`, theme, 'center'))
  }

  // Footer
  const addr = brand.organizationAddress ? `<br/>${esc(brand.organizationAddress)}` : ''
  rows.push(
    `<tr><td style="background-color:${theme.footerBg};padding:32px 24px;">
      <div style="font-family:${theme.fontStack};font-size:12px;color:#ffffff;text-align:center;line-height:1.6;opacity:0.85;">${esc(brand.organizationName ?? '')}${addr}<br/>You are receiving this newsletter as a valued subscriber.</div>
    </td></tr>`,
  )

  const preheader = input.previewText
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${esc(input.previewText)}</div>`
    : ''

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="color-scheme" content="light dark" />
<title>Newsletter</title>
<style>
  body { margin:0; padding:0; width:100% !important; -webkit-text-size-adjust:100%; }
  img { border:0; outline:none; text-decoration:none; }
  @media only screen and (max-width:680px) { .nl-container { width:100% !important; } }
</style>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;">
  <tr><td align="center" style="padding:20px 10px;">
    <table role="presentation" class="nl-container" width="680" cellpadding="0" cellspacing="0" style="width:680px;max-width:680px;background-color:#ffffff;">
      ${rows.join('\n      ')}
    </table>
  </td></tr>
</table>
</body>
</html>`
}

/** Teaser heading = the real source article title, falling back to the voiced title. */
function teaserHeading(t: RenderTeaser): string {
  return (t.headline || t.title || 'Around the web').trim()
}

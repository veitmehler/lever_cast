/**
 * Magazine newsletter email renderer.
 *
 * Pure function (no DB) → an email-safe HTML string used as both the on-app
 * preview and the body sent to GHL (editorContent). Table-based, ~600px centered,
 * critical CSS inlined; a small <style> block only for progressive enhancement
 * (dark mode) that degrades gracefully. Customizable via BrandSettings.nl* fields.
 *
 * Section order (plan §8): preheader → header → feature article → secondary
 * article → "Around the web" teasers → tips → facts → video → fun → modules →
 * footer. Each section renders only when it has content.
 */

export interface RenderArticle {
  title: string
  teaser: string
  tldr: string
  body: string // HTML
  imageUrl: string | null
}

export interface RenderTeaser {
  title: string
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

export interface RenderModules {
  recipe?: { intro: string; ingredients: string; instructions: string; imageUrl: string | null }
  kidsSnack?: { intro: string; ingredients: string; instructions: string; imageUrl: string | null }
  techFreeActivity?: { intro: string; materials: string; instructions: string }
}

export interface RenderBrand {
  organizationName?: string | null
  organizationLogoUrl?: string | null
  organizationAddress?: string | null
  nlHeaderBgColor?: string | null
  nlFooterBgColor?: string | null
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
}

interface Theme {
  headerBg: string
  footerBg: string
  fontStack: string
  fontColor: string
  headingWeight: string
  bodyWeight: string
  linkColor: string
}

const FALLBACK_FONTS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

function resolveTheme(brand: RenderBrand): Theme {
  const primary = brand.nlFontFamily?.trim()
  return {
    headerBg: brand.nlHeaderBgColor?.trim() || '#1a1a1a',
    footerBg: brand.nlFooterBgColor?.trim() || '#f4f4f4',
    fontStack: primary ? `${primary}, ${FALLBACK_FONTS}` : FALLBACK_FONTS,
    fontColor: brand.nlFontColor?.trim() || '#333333',
    headingWeight: brand.nlHeadingFontWeight?.trim() || '700',
    bodyWeight: brand.nlBodyFontWeight?.trim() || '400',
    linkColor: brand.nlLinkColor?.trim() || '#2563eb',
  }
}

function esc(s: string | null | undefined): string {
  if (!s) return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** A full-width section wrapper row (single-column table cell). */
function section(inner: string, bg = '#ffffff', padding = '24px'): string {
  return `<tr><td style="background-color:${bg};padding:${padding};">${inner}</td></tr>`
}

function heading(text: string, theme: Theme, size = '22px'): string {
  return `<h2 style="margin:0 0 12px;font-family:${theme.fontStack};font-size:${size};font-weight:${theme.headingWeight};color:${theme.fontColor};line-height:1.3;">${esc(text)}</h2>`
}

function articleBlock(a: RenderArticle, theme: Theme, label?: string): string {
  const img = a.imageUrl
    ? `<img src="${esc(a.imageUrl)}" width="552" alt="${esc(a.title)}" style="display:block;width:100%;max-width:552px;height:auto;border-radius:6px;margin:0 0 16px;" />`
    : ''
  const tldr = a.tldr
    ? `<p style="margin:0 0 12px;font-family:${theme.fontStack};font-size:15px;font-style:italic;color:${theme.fontColor};line-height:1.5;">${esc(a.tldr)}</p>`
    : ''
  const eyebrow = label
    ? `<div style="font-family:${theme.fontStack};font-size:12px;font-weight:${theme.headingWeight};letter-spacing:1px;text-transform:uppercase;color:${theme.linkColor};margin:0 0 8px;">${esc(label)}</div>`
    : ''
  return `${eyebrow}${img}${heading(a.title, theme)}${tldr}<div style="font-family:${theme.fontStack};font-size:15px;font-weight:${theme.bodyWeight};color:${theme.fontColor};line-height:1.6;">${a.body}</div>`
}

function teaserCard(t: RenderTeaser, theme: Theme): string {
  const link = t.link ? esc(t.link) : '#'
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border:1px solid #e5e7eb;border-radius:6px;">
    <tr><td style="padding:16px;">
      <a href="${link}" style="font-family:${theme.fontStack};font-size:16px;font-weight:${theme.headingWeight};color:${theme.fontColor};text-decoration:none;">${esc(t.title)}</a>
      <div style="font-family:${theme.fontStack};font-size:14px;font-weight:${theme.bodyWeight};color:${theme.fontColor};line-height:1.5;margin:8px 0;">${t.body}</div>
      <div style="font-family:${theme.fontStack};font-size:14px;">${t.cta}</div>
      <a href="${link}" style="font-family:${theme.fontStack};font-size:14px;font-weight:${theme.headingWeight};color:${theme.linkColor};text-decoration:none;">Read more &rarr;</a>
    </td></tr>
  </table>`
}

function bulletList(items: string[], theme: Theme): string {
  const lis = items
    .map(
      (i) =>
        `<li style="margin:0 0 8px;font-family:${theme.fontStack};font-size:15px;font-weight:${theme.bodyWeight};color:${theme.fontColor};line-height:1.5;">${esc(i)}</li>`,
    )
    .join('')
  return `<ul style="margin:0;padding:0 0 0 20px;">${lis}</ul>`
}

function videoCard(v: RenderVideo, theme: Theme): string {
  if (!v.url) return ''
  const thumb = v.s3Url || v.thumbnailUrl
  const title = v.title || 'Watch the video'
  const img = thumb
    ? `<img src="${esc(thumb)}" width="552" alt="${esc(title)}" style="display:block;width:100%;max-width:552px;height:auto;border-radius:6px;" />`
    : ''
  return `${heading('Watch this', theme)}
    <a href="${esc(v.url)}" style="text-decoration:none;">
      ${img}
      <div style="font-family:${theme.fontStack};font-size:15px;font-weight:${theme.headingWeight};color:${theme.linkColor};margin:10px 0 0;">&#9658; ${esc(title)}</div>
    </a>`
}

function funBlock(
  fun: NonNullable<RenderInput['fun']>,
  theme: Theme,
): string {
  const parts: string[] = []
  if (fun.triviaQuestion && fun.triviaAnswer) {
    parts.push(
      `${heading('Trivia', theme, '18px')}
      <p style="margin:0 0 6px;font-family:${theme.fontStack};font-size:15px;font-weight:${theme.headingWeight};color:${theme.fontColor};">${esc(fun.triviaQuestion)}</p>
      <p style="margin:0 0 16px;font-family:${theme.fontStack};font-size:15px;font-weight:${theme.bodyWeight};color:${theme.fontColor};">${esc(fun.triviaAnswer)}</p>`,
    )
  }
  if (fun.joke) {
    parts.push(
      `${heading('Joke of the day', theme, '18px')}<div style="font-family:${theme.fontStack};font-size:15px;font-weight:${theme.bodyWeight};color:${theme.fontColor};line-height:1.5;">${fun.joke}</div>`,
    )
  }
  return parts.join('')
}

function moduleBlock(
  title: string,
  intro: string,
  list: string,
  instructions: string,
  imageUrl: string | null,
  theme: Theme,
): string {
  const img = imageUrl
    ? `<img src="${esc(imageUrl)}" width="552" alt="${esc(title)}" style="display:block;width:100%;max-width:552px;height:auto;border-radius:6px;margin:0 0 12px;" />`
    : ''
  return `${heading(title, theme)}${img}<div style="font-family:${theme.fontStack};font-size:15px;font-weight:${theme.bodyWeight};color:${theme.fontColor};line-height:1.6;">${intro}${list}${instructions}</div>`
}

/**
 * Map the Newsletter row's JSON section columns (+ topic video research) into the
 * renderer input. Tolerant of the loosely-typed Json values.
 */
export function buildRenderInput(
  nl: {
    featureArticle?: unknown
    secondaryArticle?: unknown
    teasers?: unknown
    quickHits?: unknown
    fun?: unknown
    modules?: unknown
    previewText?: string | null
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
  }
}

export function renderNewsletterHtml(input: RenderInput, brand: RenderBrand): string {
  const theme = resolveTheme(brand)
  const rows: string[] = []

  // Header
  const logo = brand.organizationLogoUrl
    ? `<img src="${esc(brand.organizationLogoUrl)}" alt="${esc(brand.organizationName ?? 'Logo')}" height="40" style="display:block;height:40px;width:auto;margin:0 auto;" />`
    : `<div style="font-family:${theme.fontStack};font-size:22px;font-weight:${theme.headingWeight};color:#ffffff;text-align:center;">${esc(brand.organizationName ?? '')}</div>`
  rows.push(section(logo, theme.headerBg, '24px'))

  // Feature article
  if (input.featureArticle) {
    rows.push(section(articleBlock(input.featureArticle, theme)))
  }

  // Secondary article
  if (input.secondaryArticle) {
    rows.push(section(articleBlock(input.secondaryArticle, theme, 'Also in this issue')))
  }

  // Teasers — "Around the web"
  if (input.teasers && input.teasers.length > 0) {
    const cards = input.teasers.map((t) => teaserCard(t, theme)).join('')
    rows.push(section(`${heading('Around the web', theme)}${cards}`))
  }

  // Tips
  if (input.quickHits && input.quickHits.tips.length > 0) {
    rows.push(section(`${heading('Quick tips', theme)}${bulletList(input.quickHits.tips, theme)}`))
  }

  // Facts
  if (input.quickHits && input.quickHits.facts.length > 0) {
    rows.push(section(`${heading('Did you know?', theme)}${bulletList(input.quickHits.facts, theme)}`))
  }

  // Video
  if (input.video && input.video.url) {
    rows.push(section(videoCard(input.video, theme)))
  }

  // Fun
  if (input.fun && (input.fun.joke || (input.fun.triviaQuestion && input.fun.triviaAnswer))) {
    rows.push(section(funBlock(input.fun, theme)))
  }

  // Modules
  const m = input.modules
  if (m?.recipe) {
    rows.push(section(moduleBlock('Recipe of the month', m.recipe.intro, m.recipe.ingredients, m.recipe.instructions, m.recipe.imageUrl, theme)))
  }
  if (m?.kidsSnack) {
    rows.push(section(moduleBlock('Kids snack', m.kidsSnack.intro, m.kidsSnack.ingredients, m.kidsSnack.instructions, m.kidsSnack.imageUrl, theme)))
  }
  if (m?.techFreeActivity) {
    rows.push(section(moduleBlock('Tech-free activity', m.techFreeActivity.intro, m.techFreeActivity.materials, m.techFreeActivity.instructions, null, theme)))
  }

  // Footer (GHL injects the unsubscribe link — leave a placeholder note).
  const addr = brand.organizationAddress ? `<br/>${esc(brand.organizationAddress)}` : ''
  rows.push(
    section(
      `<div style="font-family:${theme.fontStack};font-size:12px;color:#888888;text-align:center;line-height:1.5;">${esc(brand.organizationName ?? '')}${addr}<br/><span style="color:#aaaaaa;">You are receiving this newsletter as a valued subscriber.</span></div>`,
      theme.footerBg,
      '24px',
    ),
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
<meta name="supported-color-schemes" content="light dark" />
<title>Newsletter</title>
<style>
  body { margin:0; padding:0; width:100% !important; -webkit-text-size-adjust:100%; }
  img { border:0; outline:none; text-decoration:none; }
  @media only screen and (max-width:600px) {
    .nl-container { width:100% !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#eeeeee;">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eeeeee;">
  <tr><td align="center" style="padding:16px;">
    <table role="presentation" class="nl-container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:8px;overflow:hidden;">
      ${rows.join('\n      ')}
    </table>
  </td></tr>
</table>
</body>
</html>`
}

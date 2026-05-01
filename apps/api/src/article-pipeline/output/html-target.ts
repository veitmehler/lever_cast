import { uploadBufferWithKey } from '../../lib/storage'
import type { OutputPayload, OutputTarget, OutputAttemptResult } from './types'

const CDN_BASE = (process.env.CDN_BASE ?? '').replace(/\/$/, '')

// Clean editorial typography baked into every HTML export
const ARTICLE_CSS = `
*,*::before,*::after{box-sizing:border-box}
html{font-size:18px;-webkit-text-size-adjust:100%}
body{margin:0;background:#fff;color:#1a1a2e;font-family:'Georgia',serif;line-height:1.75}
.page{max-width:780px;margin:0 auto;padding:3rem 1.5rem 5rem}
h1{font-size:2.2rem;line-height:1.2;font-weight:700;margin:0 0 1rem;color:#111}
h2{font-size:1.5rem;font-weight:700;margin:2.5rem 0 0.75rem;color:#111;border-bottom:2px solid #eee;padding-bottom:.35rem}
h3{font-size:1.2rem;font-weight:700;margin:2rem 0 .5rem;color:#222}
p{margin:0 0 1.25rem}
a{color:#2563eb;text-decoration:none}a:hover{text-decoration:underline}
img{max-width:100%;height:auto;border-radius:.5rem}
img.hero{width:100%;max-height:480px;object-fit:cover;border-radius:.75rem;margin-bottom:2rem}
.excerpt{font-size:1.1rem;font-style:italic;color:#555;border-left:4px solid #e2e8f0;padding-left:1rem;margin-bottom:2rem}
figure.article-diagram{margin:1.5rem 0;text-align:center}
figure.article-diagram img{max-width:100%;border-radius:.5rem;border:1px solid #e5e7eb}
figure.article-diagram figcaption{margin-top:.5rem;font-size:.875rem;color:#6b7280;font-style:italic}
.citations{border-top:2px solid #eee;margin-top:3rem;padding-top:1.5rem}
.citations h2{font-size:1.1rem;text-transform:uppercase;letter-spacing:.05em;color:#888;border-bottom:none}
.citations ol{padding-left:1.25rem}
.citations li{margin-bottom:.5rem;font-size:.9rem}
.disclaimer{background:#f8fafc;border:1px solid #e2e8f0;border-radius:.75rem;padding:1.5rem;margin-top:2.5rem;font-size:.85rem;color:#64748b;line-height:1.6}
.meta-bar{display:flex;flex-wrap:wrap;gap:1rem;margin-bottom:2rem;font-size:.875rem;color:#888}
.meta-bar span::before{content:"• ";margin-right:.25rem}
.meta-bar span:first-child::before{content:""}
.snippet-preview{background:#f0f4ff;border:1px solid #c7d2fe;border-radius:.75rem;padding:1rem 1.25rem;margin-bottom:2rem;font-family:Arial,sans-serif}
.snippet-preview .seo-url{font-size:.75rem;color:#0d6832;margin-bottom:.25rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.snippet-preview .seo-title{font-size:1.1rem;color:#1a0dab;font-weight:600;margin-bottom:.25rem}
.snippet-preview .seo-desc{font-size:.875rem;color:#4d5156;line-height:1.5}
`.trim()

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function buildHtmlBody(
  payload: OutputPayload,
  opts: { relativeImages?: boolean } = {},
): string {
  const citationsHtml =
    payload.citations.length > 0
      ? `<section class="citations">
  <h2>References</h2>
  <ol>
    ${payload.citations
      .filter((c) => c.link_url)
      .map((c) => `<li><a href="${escapeHtml(c.link_url)}" rel="noopener noreferrer" target="_blank">${escapeHtml(c.link_title || c.link_url)}</a></li>`)
      .join('\n    ')}
  </ol>
</section>`
      : ''

  const disclaimerHtml = payload.disclaimer
    ? `<footer class="disclaimer">${escapeHtml(payload.disclaimer)}</footer>`
    : ''

  const heroHtml = payload.featuredImage
    ? `<img class="hero" src="${escapeHtml(opts.relativeImages ? 'images/featured.jpg' : payload.featuredImage.cdnUrl)}" alt="${escapeHtml(payload.featuredImage.alt)}" />`
    : ''

  const metaBar = [
    payload.meta.readingTime ? `<span>${payload.meta.readingTime} min read</span>` : '',
    payload.primaryKeyword ? `<span>${escapeHtml(payload.primaryKeyword)}</span>` : '',
    payload.meta.publishedAt
      ? `<span>${new Date(payload.meta.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>`
      : '',
  ]
    .filter(Boolean)
    .join('\n    ')

  const excerptHtml = payload.excerpt
    ? `<p class="excerpt">${escapeHtml(payload.excerpt)}</p>`
    : ''

  const snippetPreview = `<div class="snippet-preview">
  <div class="seo-url">${escapeHtml(payload.slug)}</div>
  <div class="seo-title">${escapeHtml(payload.seoTitle)}</div>
  <div class="seo-desc">${escapeHtml(payload.seoDescription)}</div>
</div>`

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(payload.seoTitle)}</title>
  <meta name="description" content="${escapeHtml(payload.seoDescription)}" />
  <meta property="og:title" content="${escapeHtml(payload.seoTitle)}" />
  <meta property="og:description" content="${escapeHtml(payload.seoDescription)}" />
  ${payload.featuredImage ? `<meta property="og:image" content="${escapeHtml(payload.featuredImage.cdnUrl)}" />` : ''}
  <link rel="canonical" href="${escapeHtml(payload.slug)}" />
  <style>${ARTICLE_CSS}</style>
</head>
<body>
<div class="page">
  ${heroHtml}
  <h1>${escapeHtml(payload.title)}</h1>
  ${metaBar ? `<div class="meta-bar">${metaBar}</div>` : ''}
  ${excerptHtml}
  ${snippetPreview}
  ${payload.bodyHtml}
  ${citationsHtml}
  ${disclaimerHtml}
</div>
</body>
</html>`
}

export class HtmlTarget implements OutputTarget {
  name = 'html'

  async publish(
    payload: OutputPayload,
    _config: Record<string, unknown>,
  ): Promise<OutputAttemptResult> {
    const start = Date.now()
    const html = buildHtmlBody(payload)
    const buffer = Buffer.from(html, 'utf-8')
    const s3Key = `exports/${payload.userId}/${payload.jobId}/article.html`
    const { url } = await uploadBufferWithKey(s3Key, buffer, 'text/html; charset=utf-8')
    return {
      success: true,
      resultUrl: url,
      targetRefId: s3Key,
      durationMs: Date.now() - start,
    }
  }
}

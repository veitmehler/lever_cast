/**
 * Server-side image overlays for the newsletter, composited via the headless
 * Chrome already used for diagrams (reliable text/shape rendering):
 *  - a play button on the video thumbnail
 *  - a dark-navy translucent banner with the recipe name on the recipe image
 *
 * Source can be an http(s) URL or a data: URI (used for freshly-generated Fal
 * buffers, avoiding a throwaway upload). Output is a 16:9 JPEG in S3.
 */
import { uploadBufferWithKey } from '@socioply/shared'
import { getDiagramRasterBrowser } from '../article-pipeline/enrichment/diagram-browser-pool'
import { logger } from '../lib/logger'

const W = 1280
const H = 720 // 16:9

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * A short, time-ordered token used to make each generation's S3 keys unique.
 *
 * Cache-busting via a `?v=` query string does NOT work here: CloudFront
 * (cdn.socioply.com) ignores the query string in its cache key, so a stable key
 * keeps serving the previously-cached object until its TTL expires. The KEY
 * itself must change, so the URL points at an object the CDN has never seen.
 */
export function vtoken(): string {
  return Date.now().toString(36)
}

async function composite(src: string, overlayHtml: string, key: string): Promise<string | null> {
  const browser = await getDiagramRasterBrowser()
  const page = await browser.newPage()
  try {
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 })
    // Base <img> (awaited by 'load') cover-cropped to 16:9, overlay on top.
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
      *{margin:0;padding:0;box-sizing:border-box}
      #c{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:#0b1f33;}
      #c img.bg{width:100%;height:100%;object-fit:cover;display:block;}
    </style></head><body><div id="c"><img class="bg" src="${src}" />${overlayHtml}</div></body></html>`
    await page.setContent(html, { waitUntil: 'load' })
    const el = await page.$('#c')
    if (!el) throw new Error('overlay container not found')
    const shot = await el.screenshot({ type: 'jpeg', quality: 88 })
    const { url } = await uploadBufferWithKey(`newsletter/${key}-${vtoken()}.jpg`, Buffer.from(shot), 'image/jpeg')
    return url
  } catch (err) {
    logger.warn({ key, err }, '[newsletter/image-overlay] composite failed (non-fatal)')
    return null
  } finally {
    await page.close().catch(() => {})
  }
}

/** Center a play button on a video thumbnail. */
export function overlayPlayButton(src: string, key: string): Promise<string | null> {
  const play = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
    <div style="width:128px;height:128px;border-radius:50%;background:rgba(1,19,40,0.72);box-shadow:0 6px 24px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;">
      <div style="width:0;height:0;border-style:solid;border-width:30px 0 30px 50px;border-color:transparent transparent transparent #ffffff;margin-left:12px;"></div>
    </div></div>`
  return composite(src, play, key)
}

/** Overlay a dark-navy translucent banner + centered white recipe name, ~2/3 down. */
export function overlayTitleBanner(src: string, title: string, key: string): Promise<string | null> {
  // Banner top at ~62% of the image height (sits in the lower third), generous
  // vertical padding, text centered both axes.
  const banner = `<div style="position:absolute;left:0;right:0;top:62%;bottom:0;background:rgba(1,19,40,0.82);display:flex;align-items:center;justify-content:center;padding:36px 48px;">
    <div style="font-family:'Trebuchet MS','Segoe UI',Helvetica,Arial,sans-serif;color:#ffffff;font-size:46px;font-weight:800;line-height:1.15;letter-spacing:0.3px;text-align:center;">${esc(title)}</div>
  </div>`
  return composite(src, banner, key)
}

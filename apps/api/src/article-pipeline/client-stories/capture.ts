/**
 * Review capture: resolve a stored GBP/Maps URL to the canonical place page,
 * screenshot the reviews panel while scrolling, and transcribe via vision LLM.
 * See .plans/client-story-review-mining.implementation-plan.md Phase 2.
 *
 * Confirmed live against staging (2026-07-10 spike): Oxylabs' google_maps SERP
 * source can't be parsed and returns only the JS app shell; universal+render
 * rejects Maps URLs outright. Reviews genuinely require our own browser
 * navigation — this module does that, routed through the Oxylabs residential
 * proxy (browser-pool.ts) to avoid datacenter-IP blocking.
 */
import type { Page } from 'puppeteer-core'
import { logger } from '../../lib/logger'
import { withTimeout } from '../../lib/net/with-timeout'
import { withRetry } from '../../lib/net/retry'
import { getLLMAdapter } from '../llm/factory'
import { launchReviewCaptureBrowser } from './browser-pool'

const NAV_TIMEOUT_MS = 45_000
const SCROLL_INCREMENTS = 8
const SCROLL_WAIT_MS = 1_800
const MAX_SCREENSHOTS = 8

export interface TranscribedReview {
  reviewerName: string | null
  starRating: number | null
  reviewText: string
  relativeDate: string | null
}

/** Follow redirects on a stored GBP URL (short g.page/goo.gl links, or our own constructed
 * maps.google.com/maps/search URL) to the canonical `/maps/place/...` page — no proxy needed,
 * this is just a redirect chain, not content scraping. */
export async function resolvePlaceUrl(rawUrl: string): Promise<string> {
  let url = rawUrl
  for (let hop = 0; hop < 5; hop++) {
    const res = await fetch(url, { redirect: 'manual' })
    const location = res.headers.get('location')
    if (!location) break
    url = new URL(location, url).toString()
    if (url.includes('/maps/place/')) break
  }
  return url
}

/** Click "Sort" then "Newest" by visible text/aria-label — far more stable than CSS classes,
 * which Google rotates. Best-effort: logs and continues with default sort if not found. */
async function trySortByNewest(page: Page): Promise<void> {
  try {
    const sortBtn = await page.waitForSelector('button[aria-label*="Sort" i], button[data-value="Sort"]', {
      timeout: 8_000,
    })
    if (!sortBtn) throw new Error('sort button not found')
    await sortBtn.click()
    const newestOption = await page.waitForSelector('div[role="menuitemradio"] ::-p-text(Newest)', {
      timeout: 5_000,
    })
    if (!newestOption) throw new Error('"Newest" option not found')
    await newestOption.click()
    await new Promise((r) => setTimeout(r, SCROLL_WAIT_MS))
  } catch (err) {
    logger.warn({ err }, '[client-stories/capture] sort-by-newest click failed — using default sort')
  }
}

/** Scroll the reviews panel, screenshotting its bounding box after each increment. */
async function scrollAndScreenshot(page: Page): Promise<Buffer[]> {
  const panelHandle = await page.$('div[role="feed"], div.m6QErb[aria-label]')
  if (!panelHandle) {
    logger.warn('[client-stories/capture] reviews panel not found')
    return []
  }

  const shots: Buffer[] = []
  let lastHeight = 0
  for (let i = 0; i < SCROLL_INCREMENTS && shots.length < MAX_SCREENSHOTS; i++) {
    const box = await panelHandle.boundingBox()
    if (box) {
      const shot = await page.screenshot({
        clip: { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, 1400) },
      })
      shots.push(Buffer.from(shot))
    }
    const { height, grew } = await page.evaluate((el, prevHeight) => {
      // Runs in the browser context, where DOM lib types aren't available to this
      // Node project — the element's actual shape is well-known (scrollBy/clientHeight/
      // scrollHeight), so a minimal structural cast is clearer than pulling in "dom" lib.
      const node = el as unknown as { scrollBy(x: number, y: number): void; clientHeight: number; scrollHeight: number }
      node.scrollBy(0, node.clientHeight * 0.85)
      return { height: node.scrollHeight, grew: node.scrollHeight > prevHeight }
    }, panelHandle, lastHeight)
    if (i > 1 && !grew) break // reached the end of all reviews
    lastHeight = height
    await new Promise((r) => setTimeout(r, SCROLL_WAIT_MS))
  }
  return shots
}

interface TranscribeJson {
  reviews?: Array<{ reviewerName?: string; starRating?: number; reviewText?: string; relativeDate?: string }>
}

/** One multimodal call: transcribe every visually-distinct review across all screenshots,
 * deduping reviews that appear in the scroll overlap between consecutive images. */
async function transcribeScreenshots(screenshots: Buffer[]): Promise<TranscribedReview[]> {
  if (screenshots.length === 0) return []
  const adapter = getLLMAdapter('openai')
  const response = await adapter.call({
    systemPrompt:
      'You transcribe Google Maps review screenshots into structured JSON. Read every visually ' +
      'distinct review across all provided images. Consecutive images overlap (scrolling re-shows ' +
      'a few rows) — if the same review appears in more than one image, include it only once. ' +
      'Star rating is a VISUAL count of filled stars (1-5), not text. Return null for any field ' +
      'you cannot read confidently rather than guessing.',
    userPrompt:
      'Transcribe every unique review visible across these screenshots. Output STRICT JSON: ' +
      '{"reviews":[{"reviewerName":"first name or initial only","starRating":1-5,' +
      '"reviewText":"...","relativeDate":"e.g. 2 weeks ago"}]}',
    model: 'gpt-5.4-mini',
    jsonMode: true,
    maxTokens: 4096,
    images: screenshots.map((buf) => ({ mimeType: 'image/png', base64: buf.toString('base64') })),
  })

  let parsed: TranscribeJson
  try {
    parsed = JSON.parse(response.content) as TranscribeJson
  } catch (err) {
    logger.warn({ err }, '[client-stories/capture] vision transcription returned invalid JSON')
    return []
  }

  return (parsed.reviews ?? [])
    .filter((r) => r.reviewText?.trim())
    .map((r) => ({
      reviewerName: r.reviewerName?.trim() || null,
      starRating: typeof r.starRating === 'number' ? Math.round(r.starRating) : null,
      reviewText: r.reviewText!.trim(),
      relativeDate: r.relativeDate?.trim() || null,
    }))
}

/** Full capture: resolve → navigate (proxied) → sort → scroll+screenshot → vision-transcribe. */
export async function captureReviews(googleBusinessProfileUrl: string): Promise<TranscribedReview[]> {
  const placeUrl = await resolvePlaceUrl(googleBusinessProfileUrl)

  const { browser, authenticate } = await launchReviewCaptureBrowser()
  try {
    const page = await browser.newPage()
    await authenticate(page)
    await page.setViewport({ width: 1080, height: 1400 })

    await withRetry(
      () =>
        withTimeout(
          async () => {
            await page.goto(placeUrl, { waitUntil: 'networkidle2', timeout: NAV_TIMEOUT_MS })
          },
          NAV_TIMEOUT_MS,
          'client-story-capture:navigate',
        ),
      { attempts: 2, onRetry: (err) => logger.warn({ err }, '[client-stories/capture] navigation retrying') },
    )

    await trySortByNewest(page)
    const screenshots = await scrollAndScreenshot(page)
    return await transcribeScreenshots(screenshots)
  } finally {
    await browser.close().catch(() => {})
  }
}

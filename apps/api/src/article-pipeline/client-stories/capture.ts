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

// Derived from Page itself rather than spelled out as ElementHandle<Element> — this project has
// no "dom" lib, so the bare `Element` type name isn't resolvable here.
type PanelHandle = NonNullable<Awaited<ReturnType<Page['$']>>>

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

/** Force English so our text/aria-label selectors (Sort, Newest, Reviews, More) match reliably —
 * without this Google renders in whatever locale the Oxylabs residential-proxy exit IP geolocates
 * to, which silently breaks every text-based click below. */
function withEnglishLocale(url: string): string {
  const u = new URL(url)
  u.searchParams.set('hl', 'en')
  return u.toString()
}

/** The Oxylabs residential proxy's exit IP rotates per connection and occasionally geolocates to
 * an EU/EEA country, which redirects the whole navigation to consent.google.com instead of the
 * Maps place page — confirmed live (2026-07-10 spike: a run landed on consent.google.com with
 * gl=HR, found no Reviews tab or Sort control because neither exists on that page, and correctly
 * transcribed 0 reviews from screenshots of it). Best-effort: if the button text doesn't match
 * (different consent-page variant), capture proceeds and will likely find nothing — same
 * degradation as any other selector miss here. */
async function dismissConsentIfPresent(page: Page): Promise<void> {
  if (!page.url().includes('consent.google.com')) return
  try {
    const acceptBtn = await page.waitForSelector('button ::-p-text(Accept all), button ::-p-text(I agree)', {
      timeout: 8_000,
    })
    if (!acceptBtn) throw new Error('accept-all button not found')
    await acceptBtn.click()
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: NAV_TIMEOUT_MS })
  } catch (err) {
    logger.warn({ err }, '[client-stories/capture] consent-interstitial dismiss failed — capture may return nothing')
  }
}

/** The place page loads with only a short, truncated preview carousel of reviews — the full
 * scrollable list (with Sort control) only appears after clicking into the Reviews tab. Best-effort:
 * if the tab isn't found, capture proceeds against whatever preview panel is already on the page. */
async function openReviewsTab(page: Page): Promise<void> {
  try {
    const tab = await page.waitForSelector(
      'button[aria-label*="Reviews for" i], button[role="tab"] ::-p-text(Reviews), ::-p-text(Reviews)',
      { timeout: 8_000 },
    )
    if (!tab) throw new Error('reviews tab not found')
    await tab.click()
    await new Promise((r) => setTimeout(r, SCROLL_WAIT_MS))
  } catch (err) {
    logger.warn({ err }, '[client-stories/capture] reviews-tab click failed — using whatever panel is already present')
  }
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

/** Click every visible "More" expansion control in the panel so long reviews aren't screenshotted
 * mid-truncation. Best-effort: Google's expand control isn't always a real <button>, so this
 * matches on visible text within the panel rather than a specific tag/class. */
async function expandTruncatedReviews(panelHandle: PanelHandle): Promise<void> {
  try {
    const moreButtons = await panelHandle.$$('::-p-text(More)')
    for (const btn of moreButtons) {
      await btn.click().catch(() => {})
    }
  } catch (err) {
    logger.warn({ err }, '[client-stories/capture] expand-review-text click failed — leaving reviews as previewed')
  }
}

/** Scroll the reviews panel, screenshotting its bounding box after each increment. The first
 * screenshot is taken before any scrolling (captures whatever's initially in view); each
 * subsequent one scrolls, waits for Google's lazy-loaded reviews to arrive, expands truncated
 * text, THEN measures height/screenshots — checking height before the wait (the previous version)
 * raced the lazy-load and could look "done" one scroll too early. */
async function scrollAndScreenshot(page: Page): Promise<Buffer[]> {
  const panelHandle = await page.$('div[role="feed"], div.m6QErb[aria-label]')
  if (!panelHandle) {
    logger.warn('[client-stories/capture] reviews panel not found')
    return []
  }

  const shots: Buffer[] = []
  let lastHeight = 0
  let stagnantRounds = 0
  for (let i = 0; i < SCROLL_INCREMENTS && shots.length < MAX_SCREENSHOTS; i++) {
    if (i > 0) {
      await page.evaluate((el) => {
        // Runs in the browser context, where DOM lib types aren't available to this Node
        // project — the element's shape is well-known (scrollBy/clientHeight), so a minimal
        // structural cast is clearer than pulling in "dom" lib.
        const node = el as unknown as { scrollBy(x: number, y: number): void; clientHeight: number }
        node.scrollBy(0, node.clientHeight * 0.85)
      }, panelHandle)
      await new Promise((r) => setTimeout(r, SCROLL_WAIT_MS))
      await expandTruncatedReviews(panelHandle)
    }

    const box = await panelHandle.boundingBox()
    if (box) {
      const shot = await page.screenshot({
        clip: { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, 1400) },
      })
      shots.push(Buffer.from(shot))
    }

    const height = await page.evaluate(
      (el) => (el as unknown as { scrollHeight: number }).scrollHeight,
      panelHandle,
    )
    if (height <= lastHeight) {
      stagnantRounds++
      if (stagnantRounds >= 2) break // two scrolls in a row with no new content — reached the end
    } else {
      stagnantRounds = 0
    }
    lastHeight = height
  }
  logger.info({ screenshotCount: shots.length }, '[client-stories/capture] scroll capture complete')
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

/** Full capture: resolve → navigate (proxied, forced hl=en) → open Reviews tab → sort →
 * scroll+expand+screenshot → vision-transcribe. */
export async function captureReviews(googleBusinessProfileUrl: string): Promise<TranscribedReview[]> {
  const placeUrl = withEnglishLocale(await resolvePlaceUrl(googleBusinessProfileUrl))

  const { browser, authenticate } = await launchReviewCaptureBrowser()
  try {
    const page = await browser.newPage()
    await authenticate(page)
    await page.setViewport({ width: 1080, height: 1400 })
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' })

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

    await dismissConsentIfPresent(page)
    await openReviewsTab(page)
    await trySortByNewest(page)
    const screenshots = await scrollAndScreenshot(page)
    return await transcribeScreenshots(screenshots)
  } finally {
    await browser.close().catch(() => {})
  }
}

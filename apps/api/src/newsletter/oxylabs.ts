/**
 * Oxylabs clients for newsletter shared-research.
 *
 * Uses the Oxylabs Realtime API (https://realtime.oxylabs.io/v1/queries) — the
 * same endpoint + Basic-auth pattern the citation validator already uses — with
 * different `source` values:
 *   - google_search  → SERP for teaser-source discovery (geo-targeted, parsed)
 *   - youtube_search → video discovery (parsed)
 *   - universal      → scrape a page's HTML + report its HTTP status (validation)
 *
 * Account is confirmed to include SERP scraping. The parsed-content JSON shapes
 * vary by source/version, so extraction here is deliberately defensive and logs
 * the raw shape on a miss rather than throwing.
 */
import { ProxyAgent } from 'undici'
import { logger } from '../lib/logger'
import {
  getOxylabsSerpAuth,
  getOxylabsProxyAuth,
  basicAuthHeader,
  buildProxyUrl,
} from '../lib/oxylabs-auth'

const OXY_ENDPOINT = 'https://realtime.oxylabs.io/v1/queries'
const QUERY_TIMEOUT_MS = 90_000
const SCRAPE_TIMEOUT_MS = 30_000
const MAX_ATTEMPTS = 3

/** SERP/Scraper API is the gate for newsletter research (search needs it). */
export async function isOxylabsConfigured(): Promise<boolean> {
  return !!(await getOxylabsSerpAuth())
}

interface OxyResult {
  content?: unknown
  status_code?: number
  url?: string
}

interface OxyResponse {
  results?: OxyResult[]
}

/** Low-level POST to the Realtime API with timeout + exponential backoff. */
async function oxyQuery(payload: Record<string, unknown>): Promise<OxyResponse> {
  const auth = await getOxylabsSerpAuth()
  if (!auth) throw new Error('Oxylabs SERP API not configured')
  const header = basicAuthHeader(auth)

  let lastErr: unknown
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), QUERY_TIMEOUT_MS)
    try {
      const res = await fetch(OXY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: header },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
      clearTimeout(timer)
      if (!res.ok) {
        lastErr = new Error(`Oxylabs HTTP ${res.status}`)
      } else {
        return (await res.json()) as OxyResponse
      }
    } catch (err) {
      clearTimeout(timer)
      lastErr = err
    }
    if (attempt < MAX_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, 2000 * 2 ** (attempt - 1))) // 2s, 4s
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr))
}

/**
 * Fetch a URL through the Oxylabs residential proxy. Returns null when no proxy
 * creds are configured (caller falls back to the Scraper API). Throws on a
 * network/proxy error so the caller can fall back too.
 */
async function proxyFetch(url: string): Promise<{ status: number; html: string } | null> {
  const auth = await getOxylabsProxyAuth()
  if (!auth) return null
  const dispatcher = new ProxyAgent(buildProxyUrl(auth))
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      // `dispatcher` is an undici extension not in the DOM RequestInit types.
      dispatcher,
    } as RequestInit & { dispatcher: ProxyAgent })
    const html = await res.text()
    return { status: res.status, html }
  } finally {
    clearTimeout(timer)
    dispatcher.close().catch(() => {})
  }
}

// ── Google SERP ───────────────────────────────────────────────────────────────

/** Recursively collect `url`/`link` strings from a parsed-content object. */
function collectUrls(node: unknown, out: string[], depth = 0): void {
  if (depth > 6 || out.length > 100) return
  if (Array.isArray(node)) {
    for (const item of node) collectUrls(item, out, depth + 1)
    return
  }
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    for (const [k, v] of Object.entries(obj)) {
      if ((k === 'url' || k === 'link') && typeof v === 'string' && v.startsWith('http')) {
        out.push(v)
      } else {
        collectUrls(v, out, depth + 1)
      }
    }
  }
}

/**
 * Google search for a query. Returns organic result URLs (deduped, in order).
 * `geo` defaults to California, United States (matches the reference workflow).
 */
export async function googleSearch(
  query: string,
  geo = 'California,United States',
): Promise<string[]> {
  const resp = await oxyQuery({
    source: 'google_search',
    query,
    parse: true,
    geo_location: geo,
    pages: 1,
  })
  const content = resp.results?.[0]?.content
  // Prefer the structured organic block, but fall back to a recursive sweep.
  const c = content as
    | { results?: { organic?: Array<{ url?: string }> }; organic?: Array<{ url?: string }> }
    | undefined
  const organic = c?.results?.organic ?? c?.organic
  const urls: string[] = []
  if (Array.isArray(organic)) {
    for (const o of organic) if (o?.url?.startsWith('http')) urls.push(o.url)
  }
  if (urls.length === 0) collectUrls(content, urls)
  if (urls.length === 0) {
    logger.warn({ query }, '[newsletter/oxylabs] google_search returned no URLs')
  }
  return [...new Set(urls)]
}

// ── YouTube search ──────────────────────────────────────────────────────────

export interface YoutubeHit {
  videoId: string
  url: string
  title: string
  thumbnailUrl: string | null
}

/** Find the first relevant video for a query. Returns null if none parseable. */
export async function youtubeSearch(query: string): Promise<YoutubeHit | null> {
  const resp = await oxyQuery({ source: 'youtube_search', query, parse: true })
  const content = resp.results?.[0]?.content

  // Defensive extraction across plausible shapes.
  const first = findFirstVideo(content)
  if (!first) {
    logger.warn({ query }, '[newsletter/oxylabs] youtube_search returned no parseable video')
    return null
  }
  return first
}

function findFirstVideo(node: unknown, depth = 0): YoutubeHit | null {
  if (depth > 6 || !node || typeof node !== 'object') return null
  const obj = node as Record<string, unknown>

  // A video-like object has a video_id (or id) + title.
  const videoId =
    (typeof obj.video_id === 'string' && obj.video_id) ||
    (typeof obj.videoId === 'string' && obj.videoId) ||
    (typeof obj.id === 'string' && obj.id) ||
    null
  const title =
    (typeof obj.title === 'string' && obj.title) ||
    (typeof obj.name === 'string' && obj.name) ||
    null
  if (videoId && title) {
    return {
      videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title,
      thumbnailUrl: extractThumbnail(obj),
    }
  }

  // Otherwise recurse into arrays/objects (organic/videos/results blocks).
  for (const v of Object.values(obj)) {
    if (Array.isArray(v)) {
      for (const item of v) {
        const hit = findFirstVideo(item, depth + 1)
        if (hit) return hit
      }
    } else if (v && typeof v === 'object') {
      const hit = findFirstVideo(v, depth + 1)
      if (hit) return hit
    }
  }
  return null
}

function extractThumbnail(obj: Record<string, unknown>): string | null {
  const t = obj.thumbnails ?? obj.thumbnail
  if (Array.isArray(t) && t.length > 0) {
    const pick = (t[1] ?? t[0]) as { url?: string } | string
    if (typeof pick === 'string') return pick
    if (pick?.url) return pick.url
  }
  if (typeof t === 'string') return t
  if (t && typeof t === 'object' && typeof (t as { url?: string }).url === 'string') {
    return (t as { url: string }).url
  }
  return null
}

// ── Universal scrape + URL validation ─────────────────────────────────────────

export interface ScrapeResult {
  statusCode: number
  html: string
}

/**
 * Scrape a page's HTML. Prefers the residential proxy (cheaper, residential IPs);
 * falls back to the Scraper API `universal` source on proxy failure or when no
 * proxy creds are configured.
 */
export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  try {
    const viaProxy = await proxyFetch(url)
    if (viaProxy) return { statusCode: viaProxy.status, html: viaProxy.html }
  } catch (err) {
    logger.warn({ url, err }, '[newsletter/oxylabs] proxy scrape failed — falling back to Scraper API')
  }
  const resp = await oxyQuery({ source: 'universal', url, render: 'html' })
  const result = resp.results?.[0]
  const content = result?.content
  const html = typeof content === 'string' ? content : ''
  return { statusCode: result?.status_code ?? 0, html }
}

/** Lightweight validation — returns the target's HTTP status (0 on failure). */
export async function urlStatus(url: string): Promise<number> {
  try {
    const viaProxy = await proxyFetch(url)
    if (viaProxy) return viaProxy.status
  } catch {
    /* fall through to Scraper API */
  }
  try {
    const resp = await oxyQuery({ source: 'universal', url })
    return resp.results?.[0]?.status_code ?? 0
  } catch {
    return 0
  }
}

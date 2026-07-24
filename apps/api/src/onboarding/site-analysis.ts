/**
 * Onboarding website analysis (onboarding plan Phase 2).
 *
 * crawlSite: home + a handful of nav-linked pages → logo candidates, social
 * links, text corpus, CSS color/font hints. Screenshot via the pooled
 * Chromium; the screenshot is the PRIMARY palette source (vision-LLM with
 * SEMANTIC roles that map straight onto the nl* template fields) — CSS hints
 * are a cross-check. Specialization detection runs over the text corpus
 * against the Specialization registry.
 */
import { prisma } from '@omniply/shared'
import { logger } from '../lib/logger'
import { withRasterPage } from '../article-pipeline/enrichment/diagram-browser-pool'
import { instrumentCall } from '../lib/net/instrument'
import { withTimeout } from '../lib/net/with-timeout'

const PAGE_FETCH_TIMEOUT_MS = 15_000
const MAX_PAGES = 6
const NAV_KEYWORDS = /about|service|team|treatment|therap|contact|care|condition/i

export interface CrawlResult {
  websiteUrl: string
  pages: { url: string; title: string; text: string }[]
  logoCandidates: string[]
  socialLinks: Record<string, string>
  cssColorHints: string[]
  fontHints: string[]
}

function absolutize(href: string, base: string): string | null {
  try {
    return new URL(href, base).toString()
  } catch {
    return null
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// A plain browser UA: common WP hosts (SiteGround et al) hard-403 anything
// with a "bot" marker in the UA, and we're fetching the client's own site
// with their consent during onboarding.
const CRAWL_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await withTimeout(
      (signal) =>
        fetch(url, {
          headers: { 'User-Agent': CRAWL_USER_AGENT },
          redirect: 'follow',
          signal,
        }),
      PAGE_FETCH_TIMEOUT_MS,
      `fetch ${url}`,
    )
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('html')) {
      logger.warn(
        { url, status: res.status, contentType: res.headers.get('content-type') },
        '[site-analysis] page fetch rejected',
      )
      return null
    }
    return await res.text()
  } catch (err) {
    logger.warn({ url, err }, '[site-analysis] page fetch failed')
    return null
  }
}

const SOCIAL_HOSTS: Record<string, RegExp> = {
  facebook: /facebook\.com\/(?!sharer)[\w.\-/]+/i,
  instagram: /instagram\.com\/[\w.\-/]+/i,
  linkedin: /linkedin\.com\/(company|in)\/[\w.\-/]+/i,
  youtube: /(youtube\.com\/(channel|c|@)[\w.\-/]*|youtu\.be\/[\w-]+)/i,
  tiktok: /tiktok\.com\/@[\w.\-]+/i,
}

export async function crawlSite(websiteUrl: string): Promise<CrawlResult> {
  const result: CrawlResult = {
    websiteUrl,
    pages: [],
    logoCandidates: [],
    socialLinks: {},
    cssColorHints: [],
    fontHints: [],
  }

  const homeHtml = await fetchHtml(websiteUrl)
  if (!homeHtml) return result

  const seen = new Set<string>([websiteUrl.replace(/\/$/, '')])
  const queue: string[] = []

  // Discover same-origin nav pages worth reading.
  const origin = new URL(websiteUrl).origin
  for (const m of homeHtml.matchAll(/<a[^>]+href=["']([^"'#?]+)["']/gi)) {
    const abs = absolutize(m[1], websiteUrl)
    if (!abs || !abs.startsWith(origin)) continue
    const norm = abs.replace(/\/$/, '')
    if (seen.has(norm) || !NAV_KEYWORDS.test(norm)) continue
    seen.add(norm)
    queue.push(abs)
    if (queue.length >= MAX_PAGES - 1) break
  }

  const htmls: { url: string; html: string }[] = [{ url: websiteUrl, html: homeHtml }]
  for (const url of queue) {
    const html = await fetchHtml(url)
    if (html) htmls.push({ url, html })
  }

  for (const { url, html } of htmls) {
    const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim() ?? ''
    result.pages.push({ url, title, text: stripHtml(html).slice(0, 8000) })

    // Social links (footer/header hrefs).
    for (const [platform, re] of Object.entries(SOCIAL_HOSTS)) {
      if (result.socialLinks[platform]) continue
      const m = re.exec(html)
      if (m) result.socialLinks[platform] = `https://${m[0].replace(/^https?:\/\//, '')}`
    }
  }

  // Logo candidates — home page only, ordered by likely quality.
  const push = (u: string | null) => {
    if (u && !result.logoCandidates.includes(u)) result.logoCandidates.push(u)
  }
  const og = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i.exec(homeHtml)
    ?? /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i.exec(homeHtml)
  // Header <img> with "logo" in src/class/alt beats og:image (og is often a hero).
  for (const m of homeHtml.matchAll(/<img[^>]+>/gi)) {
    const tag = m[0]
    if (/logo/i.test(tag)) {
      const src = /src=["']([^"']+)["']/i.exec(tag)?.[1]
      push(src ? absolutize(src, websiteUrl) : null)
    }
  }
  push(og ? absolutize(og[1], websiteUrl) : null)
  const appleIcon = /<link[^>]+rel=["']apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i.exec(homeHtml)
  push(appleIcon ? absolutize(appleIcon[1], websiteUrl) : null)
  result.logoCandidates = result.logoCandidates.slice(0, 4)

  // CSS hints: hex colors + font families from inline <style> blocks.
  const styleBlocks = [...homeHtml.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n')
  const colorCounts = new Map<string, number>()
  for (const m of styleBlocks.matchAll(/#[0-9a-f]{6}\b/gi)) {
    const c = m[0].toLowerCase()
    colorCounts.set(c, (colorCounts.get(c) ?? 0) + 1)
  }
  result.cssColorHints = [...colorCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([c]) => c)
  const fonts = new Set<string>()
  for (const m of styleBlocks.matchAll(/font-family:\s*([^;}]+)/gi)) {
    const fam = m[1].split(',')[0].replace(/["']/g, '').trim()
    if (fam && !/inherit|sans-serif|serif|monospace/i.test(fam)) fonts.add(fam)
  }
  result.fontHints = [...fonts].slice(0, 4)

  return result
}

export async function screenshotHomepage(websiteUrl: string): Promise<Buffer | null> {
  try {
    return await withRasterPage(async (page) => {
      await page.setViewport({ width: 1440, height: 1200 })
      await page.goto(websiteUrl, { waitUntil: 'networkidle2', timeout: 30_000 })
      return (await page.screenshot({ type: 'png' })) as Buffer
    })
  } catch (err) {
    logger.warn({ websiteUrl, err }, '[onboarding/site] screenshot failed')
    return null
  }
}

export interface SemanticPalette {
  headerBackground?: string
  headerText?: string
  accent?: string
  button?: string
  bodyBackground?: string
  sectionTints?: string[]
  confidence?: Record<string, number>
}

const GEMINI_TEXT_MODEL = 'gemini-3-flash-preview'

async function geminiGenerate(apiKey: string, parts: unknown[], op: string): Promise<string> {
  const res = await instrumentCall({ provider: 'gemini', op }, () =>
    withTimeout(
      (signal) =>
        fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
            }),
            signal,
          },
        ),
      60_000,
      op,
    ),
  )
  if (!res.ok) throw new Error(`gemini ${op} HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[]
  }
  return (
    data.candidates?.[0]?.content?.parts
      ?.filter((p) => !p.thought)
      .map((p) => p.text ?? '')
      .join('') ?? ''
  )
}

/**
 * Parse the first balanced JSON value in LLM output. Even in JSON response
 * mode Gemini occasionally appends trailing content after the object (seen
 * live: "Unexpected non-whitespace character after JSON at position N").
 */
function parseFirstJson<T>(text: string): T {
  const cleaned = text.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '')
  const start = cleaned.search(/[[{]/)
  if (start === -1) throw new Error('no JSON value in LLM output')
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i]
    if (escaped) {
      escaped = false
    } else if (ch === '\\') {
      if (inString) escaped = true
    } else if (ch === '"') {
      inString = !inString
    } else if (!inString) {
      if (ch === '{' || ch === '[') depth++
      else if (ch === '}' || ch === ']') {
        depth--
        if (depth === 0) return JSON.parse(cleaned.slice(start, i + 1)) as T
      }
    }
  }
  return JSON.parse(cleaned.slice(start)) as T // unbalanced — let JSON.parse report it
}

export async function extractPaletteFromScreenshot(
  geminiKey: string,
  screenshotPng: Buffer,
  cssHints: string[],
): Promise<SemanticPalette | null> {
  try {
    const text = await geminiGenerate(
      geminiKey,
      [
        {
          text: `You are analyzing a screenshot of a business website to extract its brand palette for building email/newsletter templates.
Return STRICT JSON: {"headerBackground":"#hex","headerText":"#hex","accent":"#hex","button":"#hex","bodyBackground":"#hex","sectionTints":["#hex","#hex"],"confidence":{"headerBackground":0-1,...}}.
Rules: real rendered colors only (no guessing from the logo); accent = the color used for links/highlights; sectionTints = 2 light tints that would harmonize as alternating section backgrounds; if a role is genuinely absent use a sensible neutral and low confidence.
CSS hints found in the page source (frequency-ordered, may be noise): ${cssHints.join(', ') || 'none'}`,
        },
        { inlineData: { mimeType: 'image/png', data: screenshotPng.toString('base64') } },
      ],
      'onboarding.palette',
    )
    return parseFirstJson<SemanticPalette>(text)
  } catch (err) {
    logger.warn({ err }, '[onboarding/site] palette extraction failed')
    return null
  }
}

export interface SpecializationDraft {
  primarySpecialization?: string
  specializations?: string[]
  industry?: string
  targetMarket?: string
  services?: string[]
  toneObservations?: string
}

export async function detectSpecialization(
  geminiKey: string,
  corpus: string,
  registryKeys: string[],
): Promise<SpecializationDraft | null> {
  try {
    const text = await geminiGenerate(
      geminiKey,
      [
        {
          text: `Analyze this healthcare-practice website text and classify the practice.
Return STRICT JSON: {"industry":"e.g. Chiropractor","primarySpecialization":"<one of: ${registryKeys.join(', ')}>","specializations":["subset of the same list"],"targetMarket":"1-2 sentences","services":["..."],"toneObservations":"1-2 sentences on how they talk about themselves"}.
If none of the registry keys fit, pick the closest and note it in toneObservations.

WEBSITE TEXT:
${corpus.slice(0, 24_000)}`,
        },
      ],
      'onboarding.specialization',
    )
    return parseFirstJson<SpecializationDraft>(text)
  } catch (err) {
    logger.warn({ err }, '[onboarding/site] specialization detection failed')
    return null
  }
}

export async function specializationRegistryKeys(): Promise<string[]> {
  const rows = await prisma.specialization.findMany({ select: { key: true } })
  return rows.map((r) => r.key)
}

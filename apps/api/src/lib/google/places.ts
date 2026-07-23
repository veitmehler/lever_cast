/**
 * Google Places client (google-reviews plan Tier 2 + hours lookup).
 *
 * Uses the LEGACY Place Details endpoint deliberately: it supports
 * `reviews_sort` (most_relevant | newest), which is the only way to pull two
 * different top-5 review sets (~6-10 unique reviews) — the New Places API has
 * no review sorting. Platform-keyed (`GOOGLE_MAPS_API_KEY`); clinics set up
 * nothing. Every function is a no-op returning null/[] when the key is unset,
 * so the whole feature stays dormant until the key exists.
 *
 * Rapid re-polling is pointless: the top-5 selection is cached/deterministic
 * per sort; rotation happens over days. The weekly cron harvests it.
 */
import { logger } from '../logger'

const BASE = 'https://maps.googleapis.com/maps/api/place'

export function placesConfigured(): boolean {
  return Boolean(process.env.GOOGLE_MAPS_API_KEY)
}

function key(): string {
  return process.env.GOOGLE_MAPS_API_KEY ?? ''
}

export interface PlaceProbe {
  placeId: string
  name?: string
  rating?: number
  totalReviews?: number
  /** Weekly hours as newline-joined weekday_text (owner-editable afterwards). */
  openingHours?: string
  reviews: PlaceReview[]
}

export interface PlaceReview {
  authorName: string | null
  rating: number | null
  text: string
  relativeTime: string | null
}

/**
 * Resolve a Place ID from the captured GBP/Maps URL, falling back to a text
 * search on "name address". Maps share URLs rarely carry the place_id
 * directly, so the text-search fallback does most of the real work.
 */
export async function resolvePlaceId(
  gbpUrl: string | null,
  nameAndAddress: string,
): Promise<string | null> {
  if (!placesConfigured()) return null
  const fromUrl = gbpUrl?.match(/place_id[=:]([A-Za-z0-9_-]{20,})/)?.[1]
  if (fromUrl) return fromUrl
  try {
    const q = encodeURIComponent(nameAndAddress)
    const res = await fetch(
      `${BASE}/findplacefromtext/json?input=${q}&inputtype=textquery&fields=place_id&key=${key()}`,
    )
    if (!res.ok) return null
    const data = (await res.json()) as { candidates?: { place_id?: string }[] }
    return data.candidates?.[0]?.place_id ?? null
  } catch (err) {
    logger.warn({ err }, '[places] place resolution failed')
    return null
  }
}

async function details(placeId: string, sort: 'most_relevant' | 'newest'): Promise<PlaceProbe | null> {
  const fields = 'name,rating,user_ratings_total,opening_hours,reviews'
  const res = await fetch(
    `${BASE}/details/json?place_id=${placeId}&fields=${fields}&reviews_sort=${sort}&reviews_no_translations=true&key=${key()}`,
  )
  if (!res.ok) return null
  const data = (await res.json()) as {
    status?: string
    result?: {
      name?: string
      rating?: number
      user_ratings_total?: number
      opening_hours?: { weekday_text?: string[] }
      reviews?: { author_name?: string; rating?: number; text?: string; relative_time_description?: string }[]
    }
  }
  if (data.status !== 'OK' || !data.result) return null
  return {
    placeId,
    name: data.result.name,
    rating: data.result.rating,
    totalReviews: data.result.user_ratings_total,
    openingHours: data.result.opening_hours?.weekday_text?.join('\n'),
    reviews: (data.result.reviews ?? [])
      .filter((r) => r.text?.trim())
      .map((r) => ({
        authorName: r.author_name ?? null,
        rating: r.rating ?? null,
        text: r.text!.trim(),
        relativeTime: r.relative_time_description ?? null,
      })),
  }
}

/** Dual-sort probe: most_relevant + newest → up to ~10 unique reviews + hours. */
export async function probePlace(placeId: string): Promise<PlaceProbe | null> {
  if (!placesConfigured()) return null
  try {
    const [relevant, newest] = await Promise.all([details(placeId, 'most_relevant'), details(placeId, 'newest')])
    const base = relevant ?? newest
    if (!base) return null
    const seen = new Set(base.reviews.map((r) => r.text.slice(0, 80)))
    for (const r of newest?.reviews ?? []) {
      if (!seen.has(r.text.slice(0, 80))) {
        base.reviews.push(r)
        seen.add(r.text.slice(0, 80))
      }
    }
    return base
  } catch (err) {
    logger.warn({ err, placeId }, '[places] probe failed')
    return null
  }
}

/** The public "write a review" deep link for a place. */
export function reviewDeepLink(placeId: string): string {
  return `https://search.google.com/local/writereview?placeid=${placeId}`
}

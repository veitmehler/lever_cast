/**
 * Auto-route a client to the correct newsletter calendar:
 *   calendar = (primary specialization) × (country-derived hemisphere)
 * The hemisphere override is honored ONLY when the client's country is an edge
 * (equator-straddling) country. Sets/clears user.newsletterCalendarId.
 */
import {
  prisma,
  hemisphereForCountry,
  brandSettingsForUser,
  canonicalAccountUserId,
  accountIdForUser,
  type Hemisphere,
} from '@omniply/shared'
import { logger } from '../lib/logger'

/** Resolve a specialization key to its display label (for {{specialization}} in prompts). */
export async function specializationLabel(key: string | null | undefined): Promise<string> {
  if (!key) return ''
  const s = await prisma.specialization.findUnique({ where: { key }, select: { label: true } })
  return s?.label ?? key
}

export interface RoutingResult {
  calendarId: string | null
  hemisphere: Hemisphere | null
  reason?: 'no_primary' | 'no_country' | 'no_calendar' | 'ok'
}

/** Resolve the effective hemisphere for a brand (override applies only on edge countries). */
export function effectiveHemisphere(
  countryCode: string | null | undefined,
  override: string | null | undefined,
): Hemisphere | null {
  if (!countryCode?.trim()) return null // country is required
  const { hemisphere, edge } = hemisphereForCountry(countryCode)
  if (edge && (override === 'north' || override === 'south')) return override
  return hemisphere
}

export async function resolveNewsletterCalendar(userId: string): Promise<RoutingResult> {
  // Brand is account-scoped; routing is set on the account owner (the account's
  // single newsletter "customer"). All members resolve to the same calendar.
  const [brand, ownerUserId] = await Promise.all([
    brandSettingsForUser(userId),
    canonicalAccountUserId(userId),
  ])

  const setCalendar = async (id: string | null) => {
    await prisma.user.update({ where: { id: ownerUserId }, data: { newsletterCalendarId: id } })
  }

  const primary = brand?.primarySpecialization?.trim()
  if (!primary) {
    await setCalendar(null)
    return { calendarId: null, hemisphere: null, reason: 'no_primary' }
  }
  const hemisphere = effectiveHemisphere(brand?.organizationCountryCode, brand?.hemisphereOverride)
  if (!hemisphere) {
    await setCalendar(null)
    return { calendarId: null, hemisphere: null, reason: 'no_country' }
  }

  const calendar = await prisma.newsletterCalendar.findFirst({
    where: { specializationKey: primary, hemisphere },
    select: { id: true },
  })
  await setCalendar(calendar?.id ?? null)
  if (!calendar) {
    logger.info({ userId, primary, hemisphere }, '[calendar-routing] no matching calendar — client left unassigned')
    return { calendarId: null, hemisphere, reason: 'no_calendar' }
  }
  return { calendarId: calendar.id, hemisphere, reason: 'ok' }
}

/** Re-resolve every client routed (or routable) to a given specialization — used after a calendar is created/uploaded. */
export async function reresolveForSpecialization(specializationKey: string): Promise<number> {
  const clients = await prisma.brandSettings.findMany({
    where: { primarySpecialization: specializationKey },
    select: { userId: true },
  })
  for (const c of clients) await resolveNewsletterCalendar(c.userId)
  return clients.length
}

/**
 * Resolve the account's article calendar = (primary specialization) ×
 * (country-derived hemisphere). Sets Account.articleCalendarId. Separate from
 * the newsletter calendar but uses the same routing inputs.
 */
export async function resolveArticleCalendar(userId: string): Promise<RoutingResult> {
  const accountId = await accountIdForUser(userId)
  const brand = await brandSettingsForUser(userId)

  const setCalendar = async (id: string | null) => {
    if (accountId) await prisma.account.update({ where: { id: accountId }, data: { articleCalendarId: id } })
  }

  const primary = brand?.primarySpecialization?.trim()
  if (!primary) {
    await setCalendar(null)
    return { calendarId: null, hemisphere: null, reason: 'no_primary' }
  }
  const hemisphere = effectiveHemisphere(brand?.organizationCountryCode, brand?.hemisphereOverride)
  if (!hemisphere) {
    await setCalendar(null)
    return { calendarId: null, hemisphere: null, reason: 'no_country' }
  }

  const calendar = await prisma.articleCalendar.findFirst({
    where: { specializationKey: primary, hemisphere },
    select: { id: true },
  })
  await setCalendar(calendar?.id ?? null)
  if (!calendar) {
    logger.info({ userId, primary, hemisphere }, '[calendar-routing] no matching article calendar — account left unassigned')
    return { calendarId: null, hemisphere, reason: 'no_calendar' }
  }
  return { calendarId: calendar.id, hemisphere, reason: 'ok' }
}

/** Re-resolve every account whose primary specialization matches — used after an article calendar is created/uploaded. */
export async function reresolveArticleForSpecialization(specializationKey: string): Promise<number> {
  const clients = await prisma.brandSettings.findMany({
    where: { primarySpecialization: specializationKey },
    select: { userId: true },
  })
  for (const c of clients) await resolveArticleCalendar(c.userId)
  return clients.length
}

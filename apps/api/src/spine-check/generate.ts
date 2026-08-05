/**
 * Spine Check generation + publishing (spine-check plan).
 *
 * Mirrors the linktree machinery: data assembled from BrandSettings +
 * LeadGenDocuments, WP page idempotently upserted at /spine-check, standalone
 * document (logo inlined as data URI) for non-WordPress clinics + the hosted
 * route. Best-effort by design — onboarding's finale never breaks on this.
 */
import { prisma, decrypt, brandSettingsForUser, accountMemberIdsForUser } from '@omniply/shared'
import { logger } from '../lib/logger'
import { assertSafeWpUrl } from '../lib/ssrf'
import { withTimeout } from '../lib/net/with-timeout'
import { buildSpineCheckFragment, buildSpineCheckHtml, type SpineCheckClinic } from './template'

/** Domain → guide slug (plan: first-chiropractic-visit is NOT quiz-matched). */
export const GUIDE_SLUG_BY_DOMAIN = {
  desk: 'desk-workers-survival-guide',
  sleep: 'better-sleep-without-pills',
  morning: 'morning-habits-spine',
  niggle: 'pain-normal-or-warning-sign',
} as const
export const FIRST_VISIT_SLUG = 'first-chiropractic-visit'

const DEFAULT_TITLES = {
  desk: 'The Desk Worker’s Survival Guide',
  sleep: 'Better Sleep Without Pills',
  morning: 'Morning Habits for a Healthy Spine',
  niggle: 'Pain: Normal or Warning Sign?',
} as const

function publicApiBase(): string {
  return (process.env.XRAY_PUBLIC_API_BASE ?? 'https://svc.omniply.io').replace(/\/$/, '')
}

export async function spineCheckClinicForUser(userId: string): Promise<SpineCheckClinic | null> {
  const brand = await brandSettingsForUser(userId)
  if (!brand) return null
  const user = await prisma.user.findUnique({ where: { id: brand.userId }, select: { accountId: true } })
  if (!user?.accountId) return null

  const docs = await prisma.leadGenDocument.findMany({
    where: { accountId: user.accountId, status: 'live' },
    select: { slug: true, title: true },
  })
  const titleBySlug = new Map(docs.map((d) => [d.slug, d.title]))
  const guideTitles = {
    desk: titleBySlug.get(GUIDE_SLUG_BY_DOMAIN.desk) ?? DEFAULT_TITLES.desk,
    sleep: titleBySlug.get(GUIDE_SLUG_BY_DOMAIN.sleep) ?? DEFAULT_TITLES.sleep,
    morning: titleBySlug.get(GUIDE_SLUG_BY_DOMAIN.morning) ?? DEFAULT_TITLES.morning,
    niggle: titleBySlug.get(GUIDE_SLUG_BY_DOMAIN.niggle) ?? DEFAULT_TITLES.niggle,
  }

  return {
    accountId: user.accountId,
    practiceName: brand.organizationName ?? 'Our Practice',
    logoUrl: brand.nlLogoLightUrl ?? brand.nlLogoUrl ?? null,
    headerBg: brand.nlHeaderBgColor ?? '#0b2545',
    buttonColor: brand.nlButtonColor ?? brand.nlLinkColor ?? '#2a6f97',
    buttonTextColor: brand.nlButtonTextColor ?? '#ffffff',
    accent: brand.nlLinkColor ?? '#2a6f97',
    bookingUrl: brand.bookingUrl ?? null,
    captureUrl: `${publicApiBase()}/api/spine-check/capture`,
    guideTitles,
    firstVisitGuideTitle: titleBySlug.get(FIRST_VISIT_SLUG) ?? null,
  }
}

/** Inline the logo as a data URI so the single file works anywhere. */
async function inlineLogo(clinic: SpineCheckClinic): Promise<SpineCheckClinic> {
  if (!clinic.logoUrl) return clinic
  try {
    const res = await withTimeout((signal) => fetch(clinic.logoUrl!, { signal }), 15_000, 'spine-check logo inline')
    if (res.ok) {
      const mime = res.headers.get('content-type') ?? 'image/png'
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length <= 2_000_000) return { ...clinic, logoUrl: `data:${mime};base64,${buf.toString('base64')}` }
    }
  } catch {
    /* remote URL fallback is fine */
  }
  return clinic
}

/** Standalone document (hosted route + Settings download). */
export async function buildStandaloneSpineCheckHtml(userId: string): Promise<string | null> {
  const clinic = await spineCheckClinicForUser(userId)
  if (!clinic) return null
  return buildSpineCheckHtml(await inlineLogo(clinic))
}

/** The URL the linktree (and anything else) should point at. */
export async function spineCheckUrlForUser(userId: string): Promise<string | null> {
  const memberIds = await accountMemberIdsForUser(userId)
  const conn = await prisma.wordPressConnection.findFirst({
    where: { userId: { in: memberIds } },
    select: { siteUrl: true },
  })
  if (conn) return `${conn.siteUrl.replace(/\/+$/, '')}/spine-check/`
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { accountId: true } })
  if (!user?.accountId) return null
  return `${publicApiBase()}/api/spine-check/p/${user.accountId}`
}

/**
 * Publish (create or update) the /spine-check page on the clinic's WordPress
 * site. Best-effort: failures log and return null (hosted route remains).
 */
export async function publishSpineCheckPage(userId: string): Promise<string | null> {
  try {
    const clinic = await spineCheckClinicForUser(userId)
    if (!clinic) return null
    const memberIds = await accountMemberIdsForUser(userId)
    const conn = await prisma.wordPressConnection.findFirst({
      where: { userId: { in: memberIds } },
      select: { username: true, appPassword: true, siteUrl: true },
    })
    if (!conn) {
      logger.info({ userId }, '[spine-check] no WordPress connection — hosted route only')
      return null
    }
    await assertSafeWpUrl(conn.siteUrl)
    const auth = `Basic ${Buffer.from(`${conn.username}:${decrypt(conn.appPassword) ?? ''}`).toString('base64')}`
    const siteBase = conn.siteUrl.replace(/\/+$/, '')

    // Fragment (scoped CSS + scripts) — the WP theme provides the page shell.
    const content = buildSpineCheckFragment(clinic)

    const wp = (path: string, init?: RequestInit) =>
      withTimeout(
        (signal) =>
          fetch(`${siteBase}/wp-json/wp/v2${path}`, {
            ...init,
            headers: { Authorization: auth, 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
            signal,
          }),
        30_000,
        `spine-check wp ${path}`,
      )

    const existingRes = await wp('/pages?slug=spine-check&status=publish,draft,private,pending')
    const existing = existingRes.ok ? ((await existingRes.json()) as { id: number }[]) : []
    const body = JSON.stringify({
      title: 'The 2-Minute Spine Check',
      slug: 'spine-check',
      status: 'publish',
      content,
    })
    const res = existing[0]
      ? await wp(`/pages/${existing[0].id}`, { method: 'POST', body })
      : await wp('/pages', { method: 'POST', body })
    if (!res.ok) {
      logger.warn({ userId, status: res.status }, '[spine-check] WP page upsert failed')
      return null
    }
    const page = (await res.json()) as { link?: string }
    const url = page.link ?? `${siteBase}/spine-check/`
    logger.info({ userId, url }, '[spine-check] published to WordPress')
    return url
  } catch (err) {
    logger.warn({ userId, err }, '[spine-check] publish failed (non-fatal)')
    return null
  }
}

/**
 * Real commit bodies for the onboarding steps (onboarding plan Phases 4–7).
 * Kept out of flow.ts so the step machine stays readable.
 */
import { prisma, encrypt } from '@omniply/shared'
import { logger } from '../lib/logger'
import { getBoss, QUEUES } from '../queues/index'
import { getSystemApiKey } from '../lib/system-keys'
import { getGhlCredentials } from '../lib/ghl/settings'
import { listGhlAccounts } from '../lib/ghl/client'
import { processLogo } from '../newsletter/logo-process'
import {
  generateWritingStyle,
  generateOfferDrafts,
  buildTemplatePreviewHtml,
  type BrandProfileDraft,
  type OfferDraft,
} from './synthesis'
import { effectiveHemisphere } from '../newsletter/calendar-routing'
import type { SemanticPalette } from './site-analysis'
import type { StepContext } from './flow'

async function brandUpsert(userId: string, data: Record<string, unknown>): Promise<void> {
  await prisma.brandSettings.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  })
}

async function settingsUpsert(userId: string, data: Record<string, unknown>): Promise<void> {
  await prisma.settings.upsert({
    where: { userId },
    create: { userId, theme: 'light', sidebarState: 'open', ...data },
    update: data,
  })
}

/** business_confirm: persist identity basics; (re)start the crawl on a corrected URL. */
export async function commitBusinessConfirm(ctx: StepContext, answer: unknown): Promise<string | null> {
  const a = (answer ?? {}) as Record<string, string> & { confirmed?: boolean }
  const prefill = (ctx.stepData.ghlPrefill as Record<string, string>) ?? {}
  const merged = { ...prefill, ...a }
  if (!merged.organizationName?.trim()) return 'Business name is required'

  await brandUpsert(ctx.userId, {
    organizationName: merged.organizationName.trim(),
    geolocation: merged.address || null,
    organizationCountryCode: merged.country || null,
    defaultAuthorName: merged.contactName || null,
    organizationWebsite: merged.website || null,
  })
  if (merged.timezone) await settingsUpsert(ctx.userId, { socialTimezone: merged.timezone })

  const oldWebsite = (prefill.website ?? '').trim()
  const newWebsite = (merged.website ?? '').trim()
  ctx.stepData.ghlPrefill = merged
  if (newWebsite && (newWebsite !== oldWebsite || !ctx.stepData.crawlDone)) {
    const boss = await getBoss()
    await boss.send(
      QUEUES.ONBOARDING_CRAWL,
      { accountId: ctx.accountId, websiteUrl: newWebsite.startsWith('http') ? newWebsite : `https://${newWebsite}` },
      { singletonKey: `onboarding-crawl-${ctx.accountId}-${Date.now()}`, expireInSeconds: 15 * 60 },
    )
    ctx.stepData.crawlDone = false
  }
  return null
}

/** q_proof (fifth question): kick the synthesis job. */
export async function afterFifthQuestion(ctx: StepContext): Promise<void> {
  const boss = await getBoss()
  await boss.send(
    QUEUES.ONBOARDING_SYNTHESIS,
    { accountId: ctx.accountId },
    { singletonKey: `onboarding-synthesis-${ctx.accountId}`, expireInSeconds: 15 * 60 },
  )
}

/** logo_confirm: chosen/uploaded URL → light/dark variants → nlLogoUrl. */
export async function commitLogoConfirm(ctx: StepContext, answer: unknown): Promise<string | null> {
  const a = (answer ?? {}) as { chosenUrl?: string; none?: boolean }
  if (a.none) {
    ctx.stepData.logoChosen = null
    return null // org-name text header fallback; not a validator blocker if nlLogoUrl set later in settings
  }
  const source = a.chosenUrl?.trim()
  if (!source) return 'Pick a logo or choose "no logo"'
  const palette = (ctx.stepData.palette as SemanticPalette) ?? {}
  try {
    const processed = await processLogo(ctx.userId, source, palette.headerBackground ?? '#011328', `onboarding/${ctx.accountId}/logo`)
    ctx.stepData.logoVariants = processed as unknown as Record<string, unknown>
    const light = (processed as { lightUrl?: string }).lightUrl
    const dark = (processed as { darkUrl?: string }).darkUrl
    await brandUpsert(ctx.userId, {
      nlLogoUrl: light ?? source,
      nlLogoLightUrl: light ?? null,
      nlLogoDarkUrl: dark ?? null,
      nlLogoWidth: 180,
    })
  } catch (err) {
    logger.warn({ err }, '[onboarding] logo processing failed — using source as-is')
    await brandUpsert(ctx.userId, { nlLogoUrl: source, nlLogoWidth: 180 })
  }
  ctx.stepData.logoChosen = source
  return null
}

/** brand_profile_confirm: persist the (possibly edited) profile; ready the reveal. */
export async function commitBrandProfile(ctx: StepContext, answer: unknown): Promise<string | null> {
  const edited = (answer ?? {}) as Partial<BrandProfileDraft> & { confirmed?: boolean }
  const draft = { ...((ctx.stepData.brandProfileDraft as BrandProfileDraft) ?? {}), ...edited }
  if (!draft.businessDescription?.trim() || !draft.who?.trim()) {
    return 'The profile needs at least a business description and target audience — fix those fields'
  }
  await brandUpsert(ctx.userId, {
    businessDescription: draft.businessDescription,
    who: draft.who,
    ourExperience: draft.ourExperience ?? null,
    articleGoal: draft.articleGoal ?? null,
    specialInstructions: draft.specialInstructions ?? null,
    industry: draft.industry ?? null,
    primarySpecialization: draft.primarySpecialization ?? null,
    specializations: draft.specializations ?? [],
    specialization: draft.primarySpecialization ?? null,
  })
  ctx.stepData.brandProfileDraft = draft as unknown as Record<string, unknown>

  // Ready "the reveal": preview from palette + logo (manual palette fallback).
  const palette = (ctx.stepData.palette as SemanticPalette) ?? {}
  const prefill = (ctx.stepData.ghlPrefill as Record<string, string>) ?? {}
  const variants = (ctx.stepData.logoVariants as { lightUrl?: string; darkUrl?: string } | undefined) ?? {}
  const logo = variants.lightUrl ?? (ctx.stepData.logoChosen as string | null)
  ctx.stepData.templateDraft = {
    palette,
    logoUrl: logo,
    logoVariants: variants,
    organizationName: prefill.organizationName ?? 'Your Practice',
    previewHtml: buildTemplatePreviewHtml({
      organizationName: prefill.organizationName ?? 'Your Practice',
      logoUrl: logo,
      palette,
    }),
  }
  ctx.stepData.templateReady = true
  return null
}

/** template_reveal: write the nl* template fields; pre-generate the offer drafts. */
export async function commitTemplateReveal(ctx: StepContext, answer: unknown): Promise<string | null> {
  const a = (answer ?? {}) as { palette?: SemanticPalette; logoVariant?: 'light' | 'dark'; confirmed?: boolean }
  const draft = (ctx.stepData.templateDraft as { palette?: SemanticPalette }) ?? {}
  const palette: SemanticPalette = { ...(draft.palette ?? {}), ...(a.palette ?? {}) }

  // Honor the light/dark logo choice against the (possibly recolored) header.
  const variants = (ctx.stepData.logoVariants as { lightUrl?: string; darkUrl?: string } | undefined) ?? {}
  const pickedLogo = a.logoVariant === 'dark' ? variants.darkUrl : a.logoVariant === 'light' ? variants.lightUrl : null
  if (pickedLogo) await brandUpsert(ctx.userId, { nlLogoUrl: pickedLogo })
  const tints = palette.sectionTints?.length ? palette.sectionTints : ['#f2f6fa', '#fdf6ee']
  const fonts = ((ctx.stepData.crawl as { fontHints?: string[] })?.fontHints ?? [])[0]

  await brandUpsert(ctx.userId, {
    nlHeaderBgColor: palette.headerBackground ?? '#0b2545',
    nlFooterBgColor: palette.headerBackground ?? '#0b2545',
    nlLinkColor: palette.accent ?? '#2a6f97',
    nlFontColor: '#222222',
    nlSectionColor1: tints[0],
    nlSectionColor2: tints[1] ?? tints[0],
    nlSectionColor3: palette.bodyBackground ?? '#ffffff',
    nlSectionColor4: tints[0],
    ...(fonts ? { nlFontFamily: fonts } : {}),
  })
  ctx.stepData.paletteFinal = palette as unknown as Record<string, unknown>

  // Pre-generate offers so the next step is instant.
  try {
    const geminiKey = await getSystemApiKey('gemini')
    const profile = (ctx.stepData.brandProfileDraft as BrandProfileDraft) ?? null
    if (geminiKey && profile && !ctx.stepData.offerDrafts) {
      const prefill = (ctx.stepData.ghlPrefill as Record<string, string>) ?? {}
      const hemisphere = effectiveHemisphere(prefill.country, null) ?? 'south'
      ctx.stepData.offerDrafts = (await generateOfferDrafts(geminiKey, profile, hemisphere)) as unknown as Record<string, unknown>[]
    }
  } catch (err) {
    logger.warn({ err }, '[onboarding] offer generation failed — manual offers')
    ctx.stepData.offerDrafts = []
  }
  ctx.stepData.offersReady = true
  return null
}

/** offers: create NewsletterOffer rows for the kept drafts. */
export async function commitOffers(ctx: StepContext, answer: unknown): Promise<string | null> {
  const a = (answer ?? {}) as { offers?: OfferDraft[]; confirmed?: boolean }
  const kept = a.offers ?? ((ctx.stepData.offerDrafts as OfferDraft[]) ?? [])
  if (kept.length === 0) return 'Keep at least one offer — your newsletter needs something to feature'

  const now = new Date()
  let sort = 0
  for (const o of kept) {
    let startDate: Date | null = null
    let endDate: Date | null = null
    if (o.month && o.month >= 1 && o.month <= 12) {
      const year = o.month - 1 >= now.getUTCMonth() ? now.getUTCFullYear() : now.getUTCFullYear() + 1
      startDate = new Date(Date.UTC(year, o.month - 1, 1))
      endDate = new Date(Date.UTC(year, o.month, 0, 23, 59, 59))
    }
    await prisma.newsletterOffer.create({
      data: {
        userId: ctx.userId,
        title: o.title.slice(0, 120),
        body: o.body,
        ctaLabel: o.ctaLabel?.slice(0, 60) ?? null,
        startDate,
        endDate,
        enabled: true,
        sortOrder: sort++,
      },
    })
  }
  ctx.stepData.offersCreated = kept.length
  return null
}

/** cta: socialCallToAction (+ goal mapping). */
export async function commitCta(ctx: StepContext, answer: unknown): Promise<string | null> {
  const a = (answer ?? {}) as { value?: string; label?: string; customText?: string }
  const text = a.value === 'custom' ? a.customText?.trim() : (a.label ?? a.value)?.trim()
  if (!text) return 'Tell me where posts should send people'
  await brandUpsert(ctx.userId, { socialCallToAction: text, socialPrimaryGoal: null })
  return null
}

/** writing_sample: transcripts (+ optional article) → writingStyle. */
export async function commitWritingSample(ctx: StepContext, answer: unknown): Promise<string | null> {
  const a = (answer ?? {}) as { text?: string }
  const article = a.text?.trim().toLowerCase() === 'skip' ? null : (a.text?.trim() ?? null)

  const transcripts = ['q_declaration', 'q_enemy', 'q_tribe', 'q_line', 'q_proof']
    .map((k) => (ctx.stepData[k] as { text?: string })?.text)
    .filter(Boolean)
    .join('\n\n')
  if (!transcripts && !article) return 'I need either your spoken answers or a writing sample to learn your voice'

  const geminiKey = await getSystemApiKey('gemini')
  if (!geminiKey) return 'Style analysis is unavailable right now — try again in a minute'
  try {
    const style = await generateWritingStyle(geminiKey, transcripts, article)
    await settingsUpsert(ctx.userId, { writingStyle: style })
    ctx.stepData.writingStyleSet = true
    return null
  } catch (err) {
    logger.error({ err }, '[onboarding] writing style generation failed')
    return 'Style analysis hiccuped — hit send again'
  }
}

/** wordpress: verify + store, or record the explicit opt-out. */
export async function commitWordpress(ctx: StepContext, answer: unknown): Promise<string | null> {
  const a = (answer ?? {}) as { mode?: string; siteUrl?: string; username?: string; appPassword?: string }
  if (a.mode === 'skip') {
    ctx.stepData.wordpressDeclined = true
    return null
  }
  const { siteUrl, username, appPassword } = a
  if (!siteUrl || !username || !appPassword) return 'I need the site URL, username and Application Password'
  const base = siteUrl.replace(/\/$/, '').startsWith('http') ? siteUrl.replace(/\/$/, '') : `https://${siteUrl.replace(/\/$/, '')}`
  try {
    const auth = `Basic ${Buffer.from(`${username}:${appPassword}`).toString('base64')}`
    const res = await fetch(`${base}/wp-json/wp/v2/users/me`, { headers: { Authorization: auth } })
    if (!res.ok) return `WordPress said no (${res.status}) — double-check the username and Application Password`
  } catch {
    return "Couldn't reach that site — is the URL right?"
  }
  await prisma.wordPressConnection.create({
    data: {
      userId: ctx.userId,
      label: 'Main website',
      siteUrl: base,
      username,
      appPassword: encrypt(appPassword),
      defaultStatus: 'draft',
    },
  })
  ctx.stepData.wordpressConnected = true
  return null
}

/** socials: pull the Social Planner connections into ghlSettings.accountIds. */
export async function commitSocials(ctx: StepContext, _answer: unknown): Promise<string | null> {
  const creds = await getGhlCredentials(ctx.userId)
  if (!creds) {
    ctx.stepData.socialAccounts = []
    return null // provisioning covers this; validator flags ghlSettings separately
  }
  try {
    const accounts = await listGhlAccounts(creds.apiKey, creds.locationId)
    ctx.stepData.socialAccounts = accounts as unknown as Record<string, unknown>[]
    const ids: Record<string, string> = { ...((creds.accountIds as Record<string, string>) ?? {}) }
    for (const acc of accounts) {
      const platform = acc.platform?.toLowerCase()
      if (platform && ['facebook', 'instagram', 'linkedin', 'threads'].includes(platform) && !ids[platform]) {
        ids[platform] = acc.id
      }
    }
    await prisma.ghlSettings.update({ where: { userId: ctx.userId }, data: { accountIds: ids } })
  } catch (err) {
    logger.warn({ err }, '[onboarding] social account fetch failed (retryable from settings)')
    ctx.stepData.socialAccounts = []
  }
  return null
}

/** elevenlabs: store key + clone the voice from the archived answers. */
export async function commitElevenLabs(ctx: StepContext, answer: unknown): Promise<string | null> {
  const a = (answer ?? {}) as { value?: string; apiKey?: string }
  if (a.value !== 'yes') return null // decision recorded via stepData

  const elKey = a.apiKey?.trim()
  if (!elKey) return 'Paste your ElevenLabs API key (Profile → API Keys) to set up your voice'

  // ApiKey has no (userId, provider) unique — mirror the voice route's pattern.
  const existingKey = await prisma.apiKey.findFirst({ where: { userId: ctx.userId, provider: 'elevenlabs' } })
  if (existingKey) {
    await prisma.apiKey.update({ where: { id: existingKey.id }, data: { encryptedKey: encrypt(elKey) } })
  } else {
    await prisma.apiKey.create({ data: { userId: ctx.userId, provider: 'elevenlabs', encryptedKey: encrypt(elKey) } })
  }

  // Voice clone from the archived answers (best-effort; settings page can redo).
  try {
    const cdn = (process.env.CDN_BASE ?? 'https://cdn.omniply.io').replace(/\/$/, '')
    const audioKeys = ['q_declaration', 'q_enemy', 'q_tribe', 'q_line', 'q_proof']
      .map((k) => (ctx.stepData[k] as { audioKey?: string })?.audioKey)
      .filter((k): k is string => !!k)
      .slice(0, 4)
    if (audioKeys.length === 0) {
      ctx.stepData.voiceCloneSkipped = 'no audio archived'
      return null
    }
    const form = new FormData()
    form.append('name', `Onboarding voice ${ctx.accountId.slice(0, 8)}`)
    for (const key of audioKeys) {
      const res = await fetch(`${cdn}/${key}`)
      if (!res.ok) continue
      const buf = Buffer.from(await res.arrayBuffer())
      form.append('files', new Blob([buf], { type: 'audio/webm' }), key.split('/').pop() ?? 'answer.webm')
    }
    const res = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: { 'xi-api-key': elKey },
      body: form,
    })
    if (res.ok) {
      const data = (await res.json()) as { voice_id?: string }
      if (data.voice_id) {
        await settingsUpsert(ctx.userId, { elevenLabsVoiceId: data.voice_id })
        ctx.stepData.voiceCloned = true
      }
    } else {
      logger.warn({ status: res.status }, '[onboarding] ElevenLabs clone failed (key stored; redo from settings)')
      ctx.stepData.voiceCloneSkipped = `elevenlabs HTTP ${res.status}`
    }
  } catch (err) {
    logger.warn({ err }, '[onboarding] voice clone errored (key stored)')
  }
  return null
}

/** toggles: automation on + auto-generate-on-payment choice. */
export async function commitToggles(ctx: StepContext, answer: unknown): Promise<string | null> {
  const a = (answer ?? {}) as { value?: string }
  await settingsUpsert(ctx.userId, {
    socialAutomationEnabled: true,
    autoGenerateNextCycle: a.value === 'auto',
  })
  return null
}

/** booking_url: the universal CTA destination (clinic's PMS booking page). */
export async function commitBookingUrl(ctx: StepContext, answer: unknown): Promise<string | null> {
  const a = (answer ?? {}) as { text?: string }
  const raw = a.text?.trim()
  if (!raw) return 'Paste your online booking link (the page patients use to book)'
  const url = raw.startsWith('http') ? raw : `https://${raw}`
  try {
    new URL(url)
  } catch {
    return "That doesn't look like a link — try copying it straight from your booking page"
  }
  const brand = await prisma.brandSettings.findUnique({ where: { userId: ctx.userId }, select: { socialBioUrl: true } })
  await brandUpsert(ctx.userId, {
    bookingUrl: url,
    // Existing CTA consumers read socialBioUrl — backfill it so the booking
    // destination takes effect immediately without touching those call sites.
    ...(brand?.socialBioUrl?.trim() ? {} : { socialBioUrl: url }),
  })
  return null
}

/** pms: market-research capture only (connector framework stays parked). */
export async function commitPms(ctx: StepContext, answer: unknown): Promise<string | null> {
  const a = (answer ?? {}) as { value?: string; customText?: string }
  const value = a.value === 'other' ? (a.customText?.trim() || 'other') : a.value
  if (!value) return 'Pick the closest option'
  await brandUpsert(ctx.userId, { pmsSystem: value })
  return null
}

/** gbp: capture the Google Business Profile / Maps link; resolve place + probe (best-effort). */
export async function commitGbp(ctx: StepContext, answer: unknown): Promise<string | null> {
  const a = (answer ?? {}) as { text?: string }
  const raw = a.text?.trim() ?? ''
  if (!raw) return 'Paste your Google listing link, or type "skip" if you don\'t have one'
  if (/^(skip|none|no)$/i.test(raw)) {
    ctx.stepData.gbpSkipped = true
    return null
  }
  const url = raw.startsWith('http') ? raw : `https://${raw}`
  try {
    new URL(url)
  } catch {
    return 'That doesn\'t look like a link — use the Share button on your Google Business Profile, or type "skip"'
  }
  await brandUpsert(ctx.userId, { googleBusinessProfileUrl: url })

  // Best-effort place resolution + review/hours probe — NEVER blocks onboarding.
  try {
    const { placesConfigured, resolvePlaceId, probePlace } = await import('../lib/google/places')
    if (placesConfigured()) {
      const brand = await prisma.brandSettings.findUnique({
        where: { userId: ctx.userId },
        select: { organizationName: true, geolocation: true, openingHours: true },
      })
      const placeId = await resolvePlaceId(url, [brand?.organizationName, brand?.geolocation].filter(Boolean).join(' '))
      if (placeId) {
        await brandUpsert(ctx.userId, { googlePlaceId: placeId })
        const probe = await probePlace(placeId)
        if (probe) {
          if (probe.openingHours && !brand?.openingHours?.trim()) {
            await brandUpsert(ctx.userId, { openingHours: probe.openingHours })
          }
          const { ingestReviews } = await import('../lib/google/review-ingest')
          await ingestReviews(ctx.accountId, 'places-probe', probe.reviews)
        }
        // Option C provisioning: point the snapshot's `omniply-review` trigger
        // link at the clinic's Google review deep link (best-effort).
        try {
          const { getGhlCredentials } = await import('../lib/ghl/settings')
          const creds = await getGhlCredentials(ctx.userId)
          if (creds) {
            const { listTriggerLinks, updateTriggerLink } = await import('../lib/ghl/client')
            const { reviewDeepLink } = await import('../lib/google/places')
            const link = (await listTriggerLinks(creds.apiKey, creds.locationId)).find(
              (l) => l.name?.toLowerCase() === 'omniply-review',
            )
            if (link) await updateTriggerLink(creds.apiKey, link.id, link.name, reviewDeepLink(placeId))
          }
        } catch (err) {
          logger.warn({ err }, '[onboarding] trigger-link provisioning failed (non-fatal)')
        }
      }
    }
  } catch (err) {
    logger.warn({ err }, '[onboarding] places probe failed (non-fatal)')
  }
  return null
}

/** google_reviews: record the OAuth decision (the popup does the actual connect). */
export async function commitGoogleReviews(ctx: StepContext, answer: unknown): Promise<string | null> {
  const a = (answer ?? {}) as { value?: string }
  if (!a.value) return 'Pick an option'
  ctx.stepData.googleReviews = a.value
  return null
}

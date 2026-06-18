import type { FastifyInstance } from 'fastify'
import { Prisma } from '@prisma/client'
import { prisma } from '@socioply/shared'
import { requireAuth } from '../middleware/auth'
import { logger } from '../lib/logger'
import {
  renderAndSave,
  regenerateNewsletterSection,
  normalizeSocialLinks,
  type NewsletterSection,
} from '../newsletter/generate'
import { getNewsletterEmailConfig, type NewsletterEmailConfig } from '../lib/ghl/settings'
import { renderNewsletterHtml, type RenderBrand, type RenderInput } from '../newsletter/render'
import { processLogo } from '../newsletter/logo-process'
import { computeSendAt } from '../handlers/promo-email-generate'
import {
  createGhlEmailCampaign,
  scheduleGhlEmailCampaign,
  deleteGhlEmailCampaign,
  formatLocalSendAt,
  type GhlEmailMeta,
} from '../lib/ghl/client'

const J = (v: unknown): Prisma.InputJsonValue => v as unknown as Prisma.InputJsonValue

const REGEN_SECTIONS: NewsletterSection[] = [
  'feature',
  'secondary',
  'teasers',
  'quickHits',
  'fun',
  'modules',
  'subject',
  'preview',
  'summaryImage',
  'all',
]

// JSON section columns that inline edit (PATCH) may overwrite wholesale.
const EDITABLE_JSON = ['featureArticle', 'secondaryArticle', 'teasers', 'quickHits', 'fun', 'modules'] as const

// BrandSettings.nl* string fields the template editor controls.
const TEMPLATE_FIELDS = [
  'nlHeaderBgColor',
  'nlFooterBgColor',
  'nlSectionColor1',
  'nlSectionColor2',
  'nlSectionColor3',
  'nlSectionColor4',
  'nlFontFamily',
  'nlFontColor',
  'nlHeadingFontWeight',
  'nlBodyFontWeight',
  'nlLinkColor',
  'nlLogoUrl',
  'nlHeaderLogoVariant',
  'nlFooterLogoVariant',
  'nlFooterDisclaimer',
] as const

// GhlSettings.newsletter* delivery fields the user configures.
const DELIVERY_FIELDS = [
  'newsletterTagId',
  'newsletterTagName',
  'newsletterSendTime',
  'newsletterTimezone',
  'newsletterFromName',
  'newsletterFromEmail',
] as const

// A representative edition used for the live template preview.
const SAMPLE_PREVIEW: RenderInput = {
  previewText: 'A taste of how your newsletter will look',
  featureArticle: {
    title: 'Your Feature Story',
    teaser: '',
    tldr: 'The quick summary your readers see first.',
    body: '<h2>A section heading</h2><p>This is where the feature article body appears, in your chosen fonts and colors.</p><ul><li>Point one</li><li>Point two</li></ul>',
    imageUrl: null,
  },
  teasers: [
    { headline: 'A Curated Article Headline', title: 'A highlight', body: '<p>A short, voiced teaser of a curated article.</p>', cta: '<p>Worth a read.</p>', link: 'https://example.com' },
  ],
  quickHits: { tips: ['A punchy, practical tip', 'Another quick win'], facts: ['A surprising did-you-know fact'] },
  fun: { triviaQuestion: 'A curious question?', triviaAnswer: 'The satisfying answer.', joke: '<p>A light setup…</p><p>…and the payoff.</p>' },
  modules: null,
  video: null,
  summaryImageUrl: null,
}

function pick<T extends Record<string, unknown>>(src: T | null, keys: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (!src) {
    for (const k of keys) out[k] = null
    return out
  }
  for (const k of keys) out[k] = (src as Record<string, unknown>)[k] ?? null
  return out
}

async function resolveUserId(clerkId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  return user?.id ?? null
}

/** Create + schedule the GHL campaign for one ready edition. Throws on failure. */
async function approveOne(
  newsletterId: string,
  userId: string,
  config: NewsletterEmailConfig,
): Promise<{ campaignId: string; scheduledFor: Date }> {
  const nl = await prisma.newsletter.findFirst({
    where: { id: newsletterId, userId },
    include: { topic: { select: { date: true, topic: true } } },
  })
  if (!nl) throw new Error('Newsletter not found')

  // Ensure we have rendered HTML (render on demand if missing).
  const html = nl.renderedHtml ?? (await renderAndSave(newsletterId))

  const subject = nl.subjectLine || nl.topic.topic
  const meta: GhlEmailMeta = {
    subject,
    fromName: config.fromName ?? config.fromEmail,
    fromEmail: config.fromEmail,
    previewText: nl.previewText ?? '',
  }

  // Reuse a campaign from a prior attempt (idempotent retry).
  let campaignId = nl.ghlCampaignId
  if (!campaignId) {
    const created = await createGhlEmailCampaign({
      apiKey: config.apiKey,
      locationId: config.locationId,
      name: `Newsletter — ${subject}`.slice(0, 120),
      meta,
      bodyHtml: html,
      timeZone: config.timezone,
      userId: config.ghlUserId,
    })
    campaignId = created.campaignId
    await prisma.newsletter.update({ where: { id: newsletterId }, data: { ghlCampaignId: campaignId } })
  }

  const sendAtUtc = computeSendAt(nl.topic.date, config.sendTime, config.timezone)
  const sendAtLocal = formatLocalSendAt(sendAtUtc, config.timezone)
  try {
    await scheduleGhlEmailCampaign({
      apiKey: config.apiKey,
      locationId: config.locationId,
      campaignId,
      meta,
      tagIds: [config.tagId],
      timeZone: config.timezone,
      userId: config.ghlUserId,
      sendAt: sendAtLocal,
    })
  } catch (scheduleErr) {
    try {
      await deleteGhlEmailCampaign(config.apiKey, config.locationId, campaignId)
      await prisma.newsletter.update({ where: { id: newsletterId }, data: { ghlCampaignId: null } })
    } catch (rollbackErr) {
      logger.warn({ newsletterId, campaignId, rollbackErr }, '[newsletters] rollback failed')
    }
    throw scheduleErr
  }

  await prisma.newsletter.update({
    where: { id: newsletterId },
    data: { status: 'scheduled', ghlCampaignId: campaignId, scheduledFor: sendAtUtc, approvedAt: new Date() },
  })
  return { campaignId, scheduledFor: sendAtUtc }
}

export async function newsletterRoutes(app: FastifyInstance) {
  // GET /newsletters?status=ready_for_review
  app.get<{ Querystring: { status?: string } }>('/newsletters', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return
    const userId = await resolveUserId(clerkId)
    if (!userId) return reply.status(404).send({ error: 'User not found' })

    const status = request.query.status
    const rows = await prisma.newsletter.findMany({
      where: { userId, ...(status ? { status } : {}) },
      select: {
        id: true,
        status: true,
        subjectLine: true,
        validation: true,
        scheduledFor: true,
        updatedAt: true,
        topic: { select: { date: true, topic: true, calendar: { select: { name: true } } } },
      },
      orderBy: { topic: { date: 'asc' } },
    })
    return reply.send({ newsletters: rows })
  })

  // GET /newsletters/:id
  app.get<{ Params: { id: string } }>('/newsletters/:id', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return
    const userId = await resolveUserId(clerkId)
    if (!userId) return reply.status(404).send({ error: 'User not found' })

    const nl = await prisma.newsletter.findFirst({
      where: { id: request.params.id, userId },
      include: { topic: { select: { date: true, topic: true, secondaryTopic: true, calendar: { select: { name: true } } } } },
    })
    if (!nl) return reply.status(404).send({ error: 'Newsletter not found' })

    // Render on demand if missing (e.g. an older row before renderedHtml existed).
    if (!nl.renderedHtml) {
      try {
        nl.renderedHtml = await renderAndSave(nl.id)
      } catch (err) {
        logger.warn({ id: nl.id, err }, '[newsletters] on-demand render failed')
      }
    }
    return reply.send({ newsletter: nl })
  })

  // POST /newsletters/:id/regenerate { section }
  app.post<{ Params: { id: string }; Body: { section?: string } }>(
    '/newsletters/:id/regenerate',
    async (request, reply) => {
      const clerkId = await requireAuth(request, reply)
      if (!clerkId) return
      const userId = await resolveUserId(clerkId)
      if (!userId) return reply.status(404).send({ error: 'User not found' })

      const section = request.body?.section as NewsletterSection | undefined
      if (!section || !REGEN_SECTIONS.includes(section)) {
        return reply.status(400).send({ error: `section must be one of: ${REGEN_SECTIONS.join(', ')}` })
      }

      const nl = await prisma.newsletter.findFirst({
        where: { id: request.params.id, userId },
        select: { id: true, status: true },
      })
      if (!nl) return reply.status(404).send({ error: 'Newsletter not found' })
      if (nl.status !== 'ready_for_review') {
        return reply.status(400).send({ error: `Cannot regenerate an edition in status "${nl.status}"` })
      }

      try {
        await regenerateNewsletterSection(nl.id, section)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return reply.status(500).send({ error: message })
      }
      const updated = await prisma.newsletter.findUnique({ where: { id: nl.id } })
      return reply.send({ newsletter: updated })
    },
  )

  // PATCH /newsletters/:id — inline edits (subjectLine, previewText, section JSON)
  app.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/newsletters/:id',
    async (request, reply) => {
      const clerkId = await requireAuth(request, reply)
      if (!clerkId) return
      const userId = await resolveUserId(clerkId)
      if (!userId) return reply.status(404).send({ error: 'User not found' })

      const nl = await prisma.newsletter.findFirst({
        where: { id: request.params.id, userId },
        select: { id: true, status: true },
      })
      if (!nl) return reply.status(404).send({ error: 'Newsletter not found' })
      if (nl.status !== 'ready_for_review') {
        return reply.status(400).send({ error: `Cannot edit an edition in status "${nl.status}"` })
      }

      const body = request.body ?? {}
      const data: Prisma.NewsletterUpdateInput = {}
      if (typeof body.subjectLine === 'string') data.subjectLine = body.subjectLine
      if (typeof body.previewText === 'string') data.previewText = body.previewText
      for (const key of EDITABLE_JSON) {
        if (body[key] !== undefined) {
          ;(data as Record<string, unknown>)[key] = J(body[key])
        }
      }
      if (Object.keys(data).length === 0) {
        return reply.status(400).send({ error: 'No editable fields provided' })
      }

      await prisma.newsletter.update({ where: { id: nl.id }, data })
      await renderAndSave(nl.id) // re-render + re-validate from the edited row
      const updated = await prisma.newsletter.findUnique({ where: { id: nl.id } })
      return reply.send({ newsletter: updated })
    },
  )

  // POST /newsletters/:id/approve
  app.post<{ Params: { id: string } }>('/newsletters/:id/approve', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return
    const userId = await resolveUserId(clerkId)
    if (!userId) return reply.status(404).send({ error: 'User not found' })

    const config = await getNewsletterEmailConfig(userId)
    if (!config) {
      return reply.status(400).send({
        error: 'Newsletter delivery is not configured — set a GHL tag and From email in newsletter settings.',
      })
    }

    const nl = await prisma.newsletter.findFirst({
      where: { id: request.params.id, userId },
      select: { id: true, status: true },
    })
    if (!nl) return reply.status(404).send({ error: 'Newsletter not found' })
    if (nl.status !== 'ready_for_review') {
      return reply.status(400).send({ error: `Cannot approve an edition in status "${nl.status}"` })
    }

    try {
      const result = await approveOne(nl.id, userId, config)
      return reply.send({ status: 'scheduled', ...result })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      logger.error({ id: nl.id, err }, '[newsletters] approve failed')
      return reply.status(502).send({ error: message })
    }
  })

  // POST /newsletters/:id/approve-all — approve every ready edition for the user
  app.post('/newsletters/approve-all', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return
    const userId = await resolveUserId(clerkId)
    if (!userId) return reply.status(404).send({ error: 'User not found' })

    const config = await getNewsletterEmailConfig(userId)
    if (!config) {
      return reply.status(400).send({
        error: 'Newsletter delivery is not configured — set a GHL tag and From email in newsletter settings.',
      })
    }

    const ready = await prisma.newsletter.findMany({
      where: { userId, status: 'ready_for_review' },
      select: { id: true },
      orderBy: { topic: { date: 'asc' } },
    })

    let approved = 0
    const failures: Array<{ id: string; error: string }> = []
    for (const row of ready) {
      try {
        await approveOne(row.id, userId, config)
        approved++
      } catch (err) {
        failures.push({ id: row.id, error: err instanceof Error ? err.message : String(err) })
      }
    }
    return reply.send({ approved, failed: failures.length, total: ready.length, failures })
  })

  // ── Template + delivery settings ───────────────────────────────────────────────

  // GET /newsletters/settings
  app.get('/newsletters/settings', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return
    const userId = await resolveUserId(clerkId)
    if (!userId) return reply.status(404).send({ error: 'User not found' })

    const brand = await prisma.brandSettings.findUnique({ where: { userId } })
    const ghl = await prisma.ghlSettings.findUnique({ where: { userId } })

    const template = pick(brand as Record<string, unknown> | null, TEMPLATE_FIELDS)
    template.nlLogoWidth = brand?.nlLogoWidth ?? null
    template.nlFooterLogoWidth = brand?.nlFooterLogoWidth ?? null
    template.nlLogoSourceUrl = brand?.nlLogoSourceUrl ?? null
    template.nlLogoLightUrl = brand?.nlLogoLightUrl ?? null
    template.nlLogoDarkUrl = brand?.nlLogoDarkUrl ?? null

    // Delivery fields fall back to the promo-email config so the editor is
    // pre-filled with the user's existing GHL details (still overridable).
    const PROMO_FALLBACK: Record<string, string> = {
      newsletterTagId: 'promoEmailTagId',
      newsletterTagName: 'promoEmailTagName',
      newsletterSendTime: 'promoEmailSendTime',
      newsletterTimezone: 'promoEmailTimezone',
      newsletterFromName: 'promoEmailFromName',
      newsletterFromEmail: 'promoEmailFromEmail',
    }
    const g = ghl as Record<string, unknown> | null
    const delivery: Record<string, unknown> = {}
    for (const k of DELIVERY_FIELDS) {
      delivery[k] = g?.[k] ?? g?.[PROMO_FALLBACK[k]] ?? null
    }
    return reply.send({
      template,
      delivery,
      ghlConnected: !!(ghl?.ghlApiKey && ghl?.ghlLocationId && ghl?.ghlUserId),
    })
  })

  // PUT /newsletters/settings { template?: {...}, delivery?: {...} }
  app.put<{ Body: { template?: Record<string, unknown>; delivery?: Record<string, unknown> } }>(
    '/newsletters/settings',
    async (request, reply) => {
      const clerkId = await requireAuth(request, reply)
      if (!clerkId) return
      const userId = await resolveUserId(clerkId)
      if (!userId) return reply.status(404).send({ error: 'User not found' })

      const { template, delivery } = request.body ?? {}

      if (template) {
        const data: Record<string, string | number | null> = {}
        for (const k of TEMPLATE_FIELDS) {
          if (template[k] !== undefined) data[k] = (template[k] as string) || null
        }
        for (const wk of ['nlLogoWidth', 'nlFooterLogoWidth'] as const) {
          if (template[wk] !== undefined) {
            const w = parseInt(String(template[wk]), 10)
            data[wk] = Number.isFinite(w) && w > 0 ? w : null
          }
        }
        if (Object.keys(data).length > 0) {
          await prisma.brandSettings.upsert({
            where: { userId },
            create: { userId, ...data },
            update: data,
          })
        }
      }

      if (delivery) {
        const data: Record<string, string | null> = {}
        for (const k of DELIVERY_FIELDS) {
          if (delivery[k] !== undefined) data[k] = (delivery[k] as string) || null
        }
        if (Object.keys(data).length > 0) {
          await prisma.ghlSettings.upsert({
            where: { userId },
            create: { userId, ...data },
            update: data,
          })
        }
      }

      return reply.send({ ok: true })
    },
  )

  // POST /newsletters/template-preview { template?: {...} } — live preview HTML
  app.post<{ Body: { template?: Record<string, unknown> } }>(
    '/newsletters/template-preview',
    async (request, reply) => {
      const clerkId = await requireAuth(request, reply)
      if (!clerkId) return
      const userId = await resolveUserId(clerkId)
      if (!userId) return reply.status(404).send({ error: 'User not found' })

      const brand = await prisma.brandSettings.findUnique({ where: { userId } })
      // Overlay any unsaved edits from the request on top of the saved brand.
      const t = request.body?.template ?? {}
      const s = (k: string) => (t[k] as string) ?? (brand as Record<string, unknown> | null)?.[k] ?? null
      const renderBrand: RenderBrand = {
        organizationName: brand?.organizationName,
        organizationLogoUrl: brand?.organizationLogoUrl,
        organizationAddress: brand?.organizationAddress,
        organizationEmail: brand?.organizationEmail,
        organizationPhone: brand?.organizationPhone,
        socialMediaLinks: normalizeSocialLinks(brand?.socialMediaLinks),
        addressLine1: brand?.addressLine1,
        addressLine2: brand?.addressLine2,
        addressLocality: brand?.addressLocality,
        addressRegion: brand?.addressRegion,
        postalCode: brand?.postalCode,
        addressCountryName: brand?.addressCountryName,
        nlLogoUrl: s('nlLogoUrl'),
        nlLogoLightUrl: brand?.nlLogoLightUrl,
        nlLogoDarkUrl: brand?.nlLogoDarkUrl,
        nlHeaderLogoVariant: s('nlHeaderLogoVariant'),
        nlFooterLogoVariant: s('nlFooterLogoVariant'),
        nlFooterLogoWidth: (t.nlFooterLogoWidth as number) ?? brand?.nlFooterLogoWidth ?? null,
        nlFooterDisclaimer: s('nlFooterDisclaimer'),
        nlLogoWidth: (t.nlLogoWidth as number) ?? brand?.nlLogoWidth ?? null,
        nlHeaderBgColor: s('nlHeaderBgColor'),
        nlFooterBgColor: s('nlFooterBgColor'),
        nlSectionColor1: s('nlSectionColor1'),
        nlSectionColor2: s('nlSectionColor2'),
        nlSectionColor3: s('nlSectionColor3'),
        nlSectionColor4: s('nlSectionColor4'),
        nlFontFamily: s('nlFontFamily'),
        nlFontColor: s('nlFontColor'),
        nlHeadingFontWeight: s('nlHeadingFontWeight'),
        nlBodyFontWeight: s('nlBodyFontWeight'),
        nlLinkColor: s('nlLinkColor'),
      }
      return reply.send({ html: renderNewsletterHtml(SAMPLE_PREVIEW, renderBrand) })
    },
  )

  // POST /newsletters/logo/process — generate light/dark variants from the
  // stored source logo (called after a source upload, and on "re-process").
  app.post('/newsletters/logo/process', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return
    const userId = await resolveUserId(clerkId)
    if (!userId) return reply.status(404).send({ error: 'User not found' })

    const brand = await prisma.brandSettings.findUnique({ where: { userId } })
    const sourceUrl = brand?.nlLogoSourceUrl
    if (!sourceUrl) return reply.status(400).send({ error: 'No source logo uploaded yet' })

    try {
      const { lightUrl, darkUrl } = await processLogo(userId, sourceUrl)
      await prisma.brandSettings.update({
        where: { userId },
        data: { nlLogoLightUrl: lightUrl, nlLogoDarkUrl: darkUrl },
      })
      return reply.send({ lightUrl, darkUrl })
    } catch (err) {
      logger.error({ userId, err }, '[newsletters] logo processing failed')
      return reply.status(500).send({ error: 'Logo processing failed' })
    }
  })
}

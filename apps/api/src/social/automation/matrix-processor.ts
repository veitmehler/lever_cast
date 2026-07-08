import type { SocialAutomationRun, SocialPostSpec } from '@prisma/client'
import { prisma } from '@socioply/shared'
import { logger } from '../../lib/logger'
import { sendFailureAlert } from '../../lib/alerts'
import { ensureFutureScheduleDate, slotToUtc } from './schedule'
import { buildPostsForSpec } from './schedule-posts'
import type { ArticleContentContext, SlotContent } from './content'
import type { SpecAssets } from './generate-spec'
import type { DaySlot, PostSource } from './weekly-matrix'
import { sourceKind } from './weekly-matrix'
import { resolveArticleSlot } from './article-social-selectors'
import {
  buildNewsletterContentContext,
  resolveNewsletterSlotContent,
  type NewsletterContentContext,
} from './newsletter-content'
import { generateQuoteCardAsset, generateCarouselAssets } from '../generate-assets'
import { generateVideoReelAsset, generateHookVideoAsset } from '../generate-video-assets'
import { loadPromptTemplate } from '../../article-pipeline/enrichment/prompt-template'

/** Shared admin-configurable Fal.ai image model for social carousels/slideshows (Step 218). */
async function socialImageModel(): Promise<string | undefined> {
  return (await loadPromptTemplate(218))?.defaultModel
}
import type { AutomationLogContext } from './log-context'
import { withSlotKey } from './log-context'
import { withTimeout } from '../../lib/net/with-timeout'

/**
 * Hard deadline for one feed slot's full pipeline (resolve → generate →
 * schedule → build posts). Backstop only — every external call inside is
 * already individually timed out (Phase 1); this catches anything missed.
 */
const SLOT_DEADLINE_MS = 20 * 60 * 1000

export interface ResolvedSlot {
  slot: SlotContent
  diagramBackground: Buffer | null
}

/** Generate the asset for one matrix slot from already-resolved content. */
async function generateMatrixAsset(opts: {
  userId: string
  assetJobId: string
  postType: string
  resolved: ResolvedSlot
  contextTitle: string
  slideCount: number
  diagramLogoVariant: 'light' | 'dark'
}): Promise<SpecAssets> {
  const { userId, assetJobId, postType, resolved, contextTitle, slideCount, diagramLogoVariant } = opts
  const { slot } = resolved
  const topic = slot.title ?? contextTitle

  switch (postType) {
    case 'quote': {
      const card = await generateQuoteCardAsset({
        userId,
        content: slot.text,
        variant: 'feed',
        quoteText: slot.quoteText,
        jobId: assetJobId,
      })
      return { postType: 'quote', imageUrl: card.imageUrl }
    }
    case 'video_reel': {
      const reel = await generateVideoReelAsset({
        userId,
        content: slot.text,
        topic,
        h2Content: slot.text,
        jobId: assetJobId,
      })
      return { postType: 'video_reel', videoUrl: reel.videoUrl, rawVideoUrl: reel.rawVideoUrl }
    }
    case 'hook_video': {
      const hook = await generateHookVideoAsset({
        userId,
        content: slot.text,
        title: topic,
        slideCount,
        jobId: assetJobId,
      })
      return {
        postType: 'hook_video',
        videoUrl: hook.videoUrl,
        title: hook.title,
        mediaUrls: hook.carouselImageUrls,
        backgroundImageUrls: hook.carouselBackgroundImageUrls,
        hookRawVideoUrl: hook.hookRawVideoUrl,
      }
    }
    case 'carousel':
    default: {
      const carousel = await generateCarouselAssets({
        userId,
        content: slot.text,
        topic,
        articleUrl: '',
        slideCount,
        jobId: assetJobId,
        diagramBackground: resolved.diagramBackground ?? undefined,
        diagramLogoVariant,
        // Image-carousel backgrounds honor the shared social image model (Step 218).
        // Ignored when diagramBackground is set (diagram is the background).
        imageModel: await socialImageModel(),
      })
      return {
        postType: 'carousel',
        mediaUrls: carousel.imageUrls,
        imageUrl: carousel.imageUrls[0],
        title: carousel.slides[0]?.headline ?? topic,
        backgroundImageUrls: carousel.backgroundImageUrls,
      }
    }
  }
}

/** Minimal ArticleContentContext so buildPostsForSpec's caption fallback uses this slot's content. */
function captionCtxForSlot(slot: SlotContent, fallbackTitle: string): ArticleContentContext {
  const title = slot.title ?? fallbackTitle
  return {
    title,
    introText: slot.text,
    keyTakeawaysText: slot.text,
    h2Sections: [{ heading: title, text: slot.text }],
    h2Title: title,
    h2SectionText: slot.text,
  }
}

export interface MatrixRunContext {
  articleCtx: ArticleContentContext | null
  newsletterCtx: NewsletterContentContext | null
  contextTitle: string
}

/** Build the source content context for a run (article or newsletter). */
export async function buildMatrixRunContext(
  run: SocialAutomationRun & { sitePage: { id: string } | null },
): Promise<MatrixRunContext> {
  if (run.newsletterId) {
    const nl = await prisma.newsletter.findUnique({ where: { id: run.newsletterId } })
    if (!nl) throw new Error(`Newsletter ${run.newsletterId} not found for run ${run.id}`)
    const newsletterCtx = buildNewsletterContentContext(nl)
    return { articleCtx: null, newsletterCtx, contextTitle: newsletterCtx.feature.title }
  }
  const sitePage = await prisma.sitePage.findFirst({ where: { jobId: run.jobId ?? undefined } })
  if (!sitePage) throw new Error(`Article context missing for run ${run.id}`)
  const { buildArticleContentContext } = await import('./content')
  const articleCtx = buildArticleContentContext(sitePage)
  return { articleCtx, newsletterCtx: null, contextTitle: articleCtx.title }
}

async function resolveSlot(
  source: PostSource,
  ctx: MatrixRunContext,
  jobId: string | null,
): Promise<ResolvedSlot> {
  if (sourceKind(source) === 'newsletter') {
    if (!ctx.newsletterCtx) throw new Error('Newsletter context missing for newsletter slot')
    return { slot: resolveNewsletterSlotContent(source, ctx.newsletterCtx), diagramBackground: null }
  }
  if (!ctx.articleCtx || !jobId) throw new Error('Article context missing for article slot')
  return resolveArticleSlot(source, jobId, ctx.articleCtx)
}

/** Process one matrix slot: resolve content → generate → build scheduled posts → record. */
export async function processMatrixSlot(opts: {
  run: SocialAutomationRun & { sitePage: { id: string } | null }
  slotKey: string
  daySlot: DaySlot
  ctx: MatrixRunContext
  timeZone: string
  slideCount: number
  diagramLogoVariant: 'light' | 'dark'
  logCtx: AutomationLogContext
}): Promise<{ ok: boolean; error?: string }> {
  const { run, slotKey, daySlot, ctx, timeZone, slideCount, diagramLogoVariant, logCtx } = opts
  const specCtx = withSlotKey(logCtx, slotKey)

  await prisma.socialAutomationSpecResult.upsert({
    where: { runId_slotKey: { runId: run.id, slotKey } },
    create: { runId: run.id, slotKey, status: 'pending' },
    update: { status: 'pending', error: null, postsCreated: 0, approvedAt: null },
  })

  try {
    // Hard deadline backstop: every external call inside this pipeline is now
    // individually timed out (Phase 1), but this catches anything we missed
    // or a future call site that forgets to — no single slot can wedge the
    // run past this ceiling. Sized generously above the worst-case legitimate
    // chain (image gen retries + video gen retries + narration + ffmpeg).
    const { assets, buildResult } = await withTimeout(
      async () => {
        const resolved = await resolveSlot(daySlot.source, ctx, run.jobId)
        const assetJobId = `${run.jobId ?? run.newsletterId}-${slotKey}`

        const assets = await generateMatrixAsset({
          userId: run.userId,
          assetJobId,
          postType: daySlot.postType,
          resolved,
          contextTitle: ctx.contextTitle,
          slideCount,
          diagramLogoVariant,
        })

        const scheduledAt = ensureFutureScheduleDate(slotToUtc(run.scheduledDate, daySlot.hour, 0, timeZone))
        const syntheticSpec = { isStory: false, postType: daySlot.postType, slotKey } as unknown as SocialPostSpec

        const buildResult = await buildPostsForSpec({
          logCtx: specCtx,
          spec: syntheticSpec,
          assets,
          scheduledAt,
          articleCtx: captionCtxForSlot(resolved.slot, ctx.contextTitle),
        })

        if (buildResult.failed > 0 && buildResult.built === 0) {
          throw new Error(`All ${buildResult.failed} platform build(s) failed`)
        }

        return { assets, buildResult }
      },
      SLOT_DEADLINE_MS,
      `matrix-slot:${slotKey}`,
    )

    await prisma.socialAutomationSpecResult.update({
      where: { runId_slotKey: { runId: run.id, slotKey } },
      data: {
        status: 'completed',
        postsCreated: buildResult.built,
        assetsJson: assets as object,
        previewJson: buildResult.preview as object,
        error: buildResult.failed > 0 ? `${buildResult.failed} platform(s) failed` : null,
      },
    })
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await prisma.socialAutomationSpecResult.update({
      where: { runId_slotKey: { runId: run.id, slotKey } },
      data: { status: 'failed', error: message },
    })
    await sendFailureAlert({
      userId: run.userId,
      jobId: run.jobId ?? undefined,
      errorType: 'social_automation_spec',
      message: `Slot ${slotKey}: ${message}`,
      context: { ...specCtx },
    })
    logger.error({ ...specCtx, err }, '[social-automation] matrix slot failed')
    return { ok: false, error: message }
  }
}

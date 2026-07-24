/**
 * Onboarding background crawl (onboarding plan Phase 2).
 *
 * Runs the website analysis while the user answers the five questions, so the
 * logo/palette/profile confirm steps are ready by the time they arrive.
 * Everything is best-effort: a missing website or failed extraction leaves the
 * corresponding confirm step in manual mode (upload/pick-yourself) rather than
 * blocking the flow.
 */
import type PgBoss from 'pg-boss'
import { prisma } from '@omniply/shared'
import { logger } from '../lib/logger'
import { getSystemApiKey } from '../lib/system-keys'
import {
  crawlSite,
  screenshotHomepage,
  extractPaletteFromScreenshot,
  detectSpecialization,
  specializationRegistryKeys,
} from '../onboarding/site-analysis'

export interface OnboardingCrawlJobData {
  accountId: string
  websiteUrl: string
}

export async function onboardingCrawlHandler(jobs: PgBoss.Job<OnboardingCrawlJobData>[]): Promise<void> {
  for (const job of jobs) {
    const { accountId, websiteUrl } = job.data
    const session = await prisma.onboardingSession.findUnique({ where: { accountId } })
    if (!session) continue

    const stepData = (session.stepData as Record<string, unknown>) ?? {}
    try {
      const crawl = await crawlSite(websiteUrl)
      stepData.crawl = {
        websiteUrl: crawl.websiteUrl,
        pageTitles: crawl.pages.map((p) => p.title),
        socialLinks: crawl.socialLinks,
        cssColorHints: crawl.cssColorHints,
        fontHints: crawl.fontHints,
      }
      stepData.logoCandidates = crawl.logoCandidates
      // Corpus persisted for the Phase 4 synthesis (capped — stepData is not a data lake).
      stepData.corpus = crawl.pages.map((p) => `## ${p.title}\n${p.text}`).join('\n\n').slice(0, 30_000)

      const geminiKey = await getSystemApiKey('gemini')
      if (geminiKey) {
        const [screenshot, registryKeys] = await Promise.all([
          screenshotHomepage(websiteUrl),
          specializationRegistryKeys(),
        ])
        const [palette, specialization] = await Promise.all([
          screenshot ? extractPaletteFromScreenshot(geminiKey, screenshot, crawl.cssColorHints) : null,
          stepData.corpus ? detectSpecialization(geminiKey, stepData.corpus as string, registryKeys) : null,
        ])
        if (palette) stepData.palette = palette
        if (specialization) stepData.specializationDraft = specialization
      }

      stepData.crawlDone = true
      logger.info(
        { accountId, pages: crawl.pages.length, logos: crawl.logoCandidates.length, hasPalette: !!stepData.palette },
        '[onboarding-crawl] complete',
      )
    } catch (err) {
      stepData.crawlDone = true // never block the flow — confirm steps fall back to manual
      stepData.crawlError = err instanceof Error ? err.message : String(err)
      logger.warn({ accountId, websiteUrl, err }, '[onboarding-crawl] failed — manual fallbacks apply')
    }

    await prisma.onboardingSession.update({
      where: { id: session.id },
      data: { stepData: stepData as object },
    })
  }
}

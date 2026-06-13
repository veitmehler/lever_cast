import { loadSocialBrandTheme, loadLogoBuffer } from './brand-theme'
import { registerSocialMedia } from './media-register'
import { renderQuoteCard } from './compositors/quote-card'
import { selectQuoteForCard } from './generators/quote-selection'
import {
  generateCarouselBackground,
  renderCarouselSlide,
  type CarouselSlidePlan,
} from './compositors/carousel'
import { planCarouselSlides } from './generators/carousel-plan'
import { renderPitchStory, type PitchStoryType } from './compositors/pitch-story'
import { maxSlidesForPlatforms } from './platform-limits'

export type QuoteCardVariant = 'feed' | 'story'

export interface GeneratedQuoteCard {
  postType: 'quote'
  quoteText: string
  attribution?: string
  variant: QuoteCardVariant
  imageUrl: string
  mediaId: string
}

export interface GeneratedCarousel {
  postType: 'carousel'
  /** Shared id for this carousel's media; reused when regenerating a single slide. */
  jobId: string
  slides: Array<{ imageUrl: string; mediaId: string; headline: string }>
  /** Full slide plans retained so callers can extract per-slide text for voiceover sync. */
  slidePlans: CarouselSlidePlan[]
  imageUrls: string[]
  /** Raw (pre-overlay) background image URLs, one per slide — used by S4/S6 pitch slides. */
  backgroundImageUrls: string[]
}

export interface GeneratedPitchStory {
  postType: 'pitch_carousel' | 'pitch_hook'
  slides: Array<{ imageUrl: string; mediaId: string }>
  imageUrls: string[]
}

function generationId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export async function generateQuoteCardAsset(opts: {
  userId: string
  content: string
  variant?: QuoteCardVariant
  quoteText?: string
  attribution?: string
  jobId?: string
}): Promise<GeneratedQuoteCard> {
  const brand = await loadSocialBrandTheme(opts.userId)
  const logoBuffer = await loadLogoBuffer(brand.logoUrl)
  const variant = opts.variant ?? 'feed'

  let quoteText = opts.quoteText?.trim()
  let attribution = opts.attribution?.trim()

  if (!quoteText) {
    const selected = await selectQuoteForCard({
      content: opts.content,
      organizationName: brand.organizationName,
    })
    quoteText = selected.quote
    attribution = selected.attribution
  }

  const buffer = await renderQuoteCard({
    quoteText,
    attribution,
    variant,
    brand,
    logoBuffer,
  })

  const genId = generationId()
  const s3Key = `social/${opts.userId}/${opts.jobId ?? genId}/quote-${variant}-${genId}.png`
  const registered = await registerSocialMedia({
    userId: opts.userId,
    buffer,
    s3Key,
    title: `Quote card — ${quoteText.slice(0, 40)}`,
    altText: quoteText,
    source: 'quote_card',
    jobId: opts.jobId,
  })

  return {
    postType: 'quote',
    quoteText,
    attribution,
    variant,
    imageUrl: registered.url,
    mediaId: registered.mediaId,
  }
}

export async function generateCarouselAssets(opts: {
  userId: string
  content: string
  topic?: string
  articleUrl?: string
  platforms?: string[]
  slideCount?: number
  jobId?: string
}): Promise<GeneratedCarousel> {
  const brand = await loadSocialBrandTheme(opts.userId)
  const logoBuffer = await loadLogoBuffer(brand.logoUrl)
  const slideCount = opts.slideCount ?? maxSlidesForPlatforms(opts.platforms ?? [])
  const genId = generationId()
  const jobId = opts.jobId ?? genId

  const slidePlans = await planCarouselSlides({
    content: opts.content,
    topic: opts.topic,
    organizationName: brand.organizationName,
    industry: brand.industry || undefined,
    writingStyle: brand.writingStyle || undefined,
    callToAction: brand.socialCallToAction || undefined,
    slideCount,
    articleUrl: opts.articleUrl ?? '',
    specialInstructions: brand.videoSpecialInstructions || undefined,
  })

  const slides: GeneratedCarousel['slides'] = []
  const backgroundImageUrls: string[] = []

  for (let i = 0; i < slidePlans.length; i++) {
    const plan = slidePlans[i]
    const bg = await generateCarouselBackground(plan.imagePrompt || plan.headlineText || '', jobId)

    // Save the raw background before compositing — S4/S6 use these clean images for pitch slides.
    const bgRegistered = await registerSocialMedia({
      userId: opts.userId,
      buffer: bg,
      s3Key: `social/${opts.userId}/${jobId}/carousel-bg-${i + 1}-${genId}.png`,
      title: `Carousel background ${i + 1}`,
      altText: `Background for slide ${i + 1}`,
      source: 'carousel_slide',
      jobId,
    })
    backgroundImageUrls.push(bgRegistered.url)

    const buffer = await renderCarouselSlide(bg, {
      slide: plan,
      slideIndex: i,
      totalSlides: slidePlans.length,
      brand,
      logoBuffer,
    })

    const registered = await registerSocialMedia({
      userId: opts.userId,
      buffer,
      s3Key: `social/${opts.userId}/${jobId}/carousel-${i + 1}-${genId}.png`,
      title: `Carousel slide ${i + 1} — ${(plan.headlineText ?? plan.bodyText ?? '').slice(0, 40)}`,
      altText: plan.headlineText ?? plan.bodyText ?? `Slide ${i + 1}`,
      source: 'carousel_slide',
      jobId,
    })

    slides.push({
      imageUrl: registered.url,
      mediaId: registered.mediaId,
      headline: plan.headlineText ?? plan.bodyText?.split('\n')[0] ?? `Slide ${i + 1}`,
    })
  }

  return {
    postType: 'carousel',
    jobId,
    slides,
    slidePlans,
    imageUrls: slides.map((s) => s.imageUrl),
    backgroundImageUrls,
  }
}

/**
 * Re-render a single carousel slide from a (possibly user-edited) plan. Mirrors
 * one iteration of generateCarouselAssets' loop: generate a fresh background
 * from the slide's imagePrompt, composite the text overlay, and register it.
 * Fast (one image) so it runs synchronously in the request, unlike full videos.
 */
export async function regenerateCarouselSlide(opts: {
  userId: string
  slidePlan: CarouselSlidePlan
  slideIndex: number
  totalSlides: number
  jobId?: string
}): Promise<{ imageUrl: string; mediaId: string }> {
  const brand = await loadSocialBrandTheme(opts.userId)
  const logoBuffer = await loadLogoBuffer(brand.logoUrl)
  const genId = generationId()
  const jobId = opts.jobId ?? genId
  const plan = opts.slidePlan

  const bg = await generateCarouselBackground(plan.imagePrompt || plan.headlineText || '', jobId)

  const buffer = await renderCarouselSlide(bg, {
    slide: plan,
    slideIndex: opts.slideIndex,
    totalSlides: opts.totalSlides,
    brand,
    logoBuffer,
  })

  const registered = await registerSocialMedia({
    userId: opts.userId,
    buffer,
    s3Key: `social/${opts.userId}/${jobId}/carousel-${opts.slideIndex + 1}-${genId}.png`,
    title: `Carousel slide ${opts.slideIndex + 1} — ${(plan.headlineText ?? plan.bodyText ?? '').slice(0, 40)}`,
    altText: plan.headlineText ?? plan.bodyText ?? `Slide ${opts.slideIndex + 1}`,
    source: 'carousel_slide',
    jobId,
  })

  return { imageUrl: registered.url, mediaId: registered.mediaId }
}

export async function generatePitchStoryAssets(opts: {
  userId: string
  title: string
  pitchType: PitchStoryType
  jobId?: string
}): Promise<GeneratedPitchStory> {
  const brand = await loadSocialBrandTheme(opts.userId)
  const buffers = await renderPitchStory({
    title: opts.title,
    pitchType: opts.pitchType,
    brand,
    logoBuffer: await loadLogoBuffer(brand.logoUrl),
  })

  const genId = generationId()
  const jobId = opts.jobId ?? genId
  const postType = opts.pitchType === 'carousel' ? 'pitch_carousel' : 'pitch_hook'
  const slides: GeneratedPitchStory['slides'] = []

  for (let i = 0; i < buffers.length; i++) {
    const registered = await registerSocialMedia({
      userId: opts.userId,
      buffer: buffers[i],
      s3Key: `social/${opts.userId}/${jobId}/pitch-${opts.pitchType}-${i + 1}-${genId}.png`,
      title: `Pitch ${opts.pitchType} slide ${i + 1}`,
      altText: i === 0 ? opts.title : 'View profile CTA',
      source: 'pitch_story',
      jobId,
    })
    slides.push({ imageUrl: registered.url, mediaId: registered.mediaId })
  }

  return { postType, slides, imageUrls: slides.map((s) => s.imageUrl) }
}

export type { CarouselSlidePlan, PitchStoryType }

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
  slides: Array<{ imageUrl: string; mediaId: string; headline: string }>
  imageUrls: string[]
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
    organizationName: brand.organizationName,
    industry: undefined,
    slideCount,
  })

  const slides: GeneratedCarousel['slides'] = []

  for (let i = 0; i < slidePlans.length; i++) {
    const plan = slidePlans[i]
    const bg = await generateCarouselBackground(plan.imagePrompt || plan.headline, jobId)
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
      title: `Carousel slide ${i + 1} — ${plan.headline.slice(0, 40)}`,
      altText: plan.headline,
      source: 'carousel_slide',
      jobId,
    })

    slides.push({
      imageUrl: registered.url,
      mediaId: registered.mediaId,
      headline: plan.headline,
    })
  }

  return {
    postType: 'carousel',
    slides,
    imageUrls: slides.map((s) => s.imageUrl),
  }
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

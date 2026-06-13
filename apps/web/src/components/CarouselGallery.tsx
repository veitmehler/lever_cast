'use client'

import { useState } from 'react'
import Image from 'next/image'
import { RotateCw, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { CarouselSlidePlan } from '@/lib/social/types'

interface CarouselGalleryProps {
  images: string[]
  slidePlans?: CarouselSlidePlan[]
  onRegenerateSlide?: (slideIndex: number, editedPlan: CarouselSlidePlan) => Promise<void>
}

/**
 * Carousel slide viewer: a thumbnail strip that opens an enlarged lightbox you
 * can page through. When slide plans + a regenerate handler are supplied, each
 * slide can be re-rendered from an editable image prompt / headline.
 */
export function CarouselGallery({ images, slidePlans, onRegenerateSlide }: CarouselGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [imagePrompt, setImagePrompt] = useState('')
  const [headline, setHeadline] = useState('')
  const [isRegenerating, setIsRegenerating] = useState(false)

  const canEdit = !!slidePlans && slidePlans.length === images.length && !!onRegenerateSlide

  const openSlide = (i: number) => {
    setOpenIndex(i)
    const plan = slidePlans?.[i]
    setImagePrompt(plan?.imagePrompt ?? '')
    setHeadline(plan?.headlineText ?? '')
  }

  const go = (delta: number) => {
    if (openIndex === null) return
    openSlide((openIndex + delta + images.length) % images.length)
  }

  const regenerate = async () => {
    if (openIndex === null || !slidePlans || !onRegenerateSlide) return
    const original = slidePlans[openIndex]
    setIsRegenerating(true)
    try {
      await onRegenerateSlide(openIndex, {
        ...original,
        imagePrompt: imagePrompt.trim() || original.imagePrompt,
        headlineText: headline.trim() ? headline.trim() : original.headlineText,
      })
      toast.success(`Slide ${openIndex + 1} regenerated`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to regenerate slide')
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <div className="mb-3">
      {/* Thumbnail strip */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.map((url, i) => (
          <button
            key={`${url}-${i}`}
            type="button"
            onClick={() => openSlide(i)}
            className="relative shrink-0 rounded-lg border border-border overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary"
            title={`View slide ${i + 1}`}
          >
            <Image
              src={url}
              alt={`Slide ${i + 1}`}
              width={64}
              height={64}
              className="h-16 w-16 object-cover aspect-square"
            />
            <span className="absolute bottom-0.5 right-0.5 rounded bg-black/60 px-1 text-[10px] text-white">
              {i + 1}
            </span>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {openIndex !== null && images[openIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpenIndex(null)}
        >
          <div
            className="relative w-full max-w-md rounded-xl bg-card p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-card-foreground">
                Slide {openIndex + 1} of {images.length}
              </span>
              <button
                type="button"
                onClick={() => setOpenIndex(null)}
                className="rounded p-1 hover:bg-secondary"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative flex items-center justify-center">
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="absolute left-0 z-10 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                  title="Previous slide"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <Image
                src={images[openIndex]}
                alt={`Slide ${openIndex + 1}`}
                width={1080}
                height={1080}
                className="max-h-[55vh] w-auto rounded-lg object-contain"
              />
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="absolute right-0 z-10 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                  title="Next slide"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </div>

            {canEdit && (
              <div className="mt-3 space-y-2">
                <label className="block text-xs font-medium text-card-foreground">Image prompt</label>
                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  rows={2}
                  disabled={isRegenerating}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />
                <label className="block text-xs font-medium text-card-foreground">Headline</label>
                <input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  disabled={isRegenerating}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />
                <Button type="button" onClick={regenerate} disabled={isRegenerating} className="w-full">
                  {isRegenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCw className="mr-2 h-4 w-4" />
                  )}
                  Regenerate slide
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

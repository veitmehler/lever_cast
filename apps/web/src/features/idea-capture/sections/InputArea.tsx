import { X } from 'lucide-react'
import Image from 'next/image'
import type { IdeaCaptureView } from '../useIdeaCapture'

export function InputArea({ capture }: { capture: IdeaCaptureView }) {
  const {
    content,
    setContent,
    getCharCountColor,
    charCount,
    maxChars,
    isRecording,
    selectedImage,
    postType,
    handleRemoveImage,
    carouselImages,
    recognitionError,
  } = capture

  return (
    <>
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-card-foreground mb-2">
          Capture Your Idea
        </h2>
        <p className="text-sm text-muted-foreground">
          Type or record your thought, and let AI transform it into polished posts
        </p>
      </div>

      {/* Main Input Area */}
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your idea here... What's on your mind?"
          className="w-full min-h-[200px] p-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          disabled={isRecording}
        />

        {/* Character Counter */}
        <div className={`absolute bottom-3 right-3 text-xs ${getCharCountColor()}`}>
          {charCount} / {maxChars}
          {charCount > maxChars && ' ⚠️'}
        </div>
      </div>

      {/* Image Preview */}
      {selectedImage && postType !== 'carousel' && (
        <div className="mt-4 relative inline-block">
          <Image
            src={selectedImage}
            alt="Attached"
            width={96}
            height={96}
            className="h-24 w-24 object-cover rounded-lg border border-border"
          />
          <button
            onClick={handleRemoveImage}
            className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Carousel Preview */}
      {postType === 'carousel' && carouselImages.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-card-foreground mb-2">
            Carousel slides ({carouselImages.length})
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {carouselImages.map((url, index) => (
              <Image
                key={`${url}-${index}`}
                src={url}
                alt={`Slide ${index + 1}`}
                width={96}
                height={96}
                className="h-24 w-24 shrink-0 object-cover rounded-lg border border-border"
              />
            ))}
          </div>
        </div>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex gap-1">
            <div className="w-1 h-4 bg-primary rounded animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-4 bg-primary rounded animate-pulse" style={{ animationDelay: '150ms' }} />
            <div className="w-1 h-4 bg-primary rounded animate-pulse" style={{ animationDelay: '300ms' }} />
            <div className="w-1 h-4 bg-primary rounded animate-pulse" style={{ animationDelay: '450ms' }} />
          </div>
          <span className="text-sm font-medium text-foreground">Recording... Speak now</span>
        </div>
      )}

      {/* Recognition Error */}
      {recognitionError && (
        <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">{recognitionError}</p>
        </div>
      )}
    </>
  )
}

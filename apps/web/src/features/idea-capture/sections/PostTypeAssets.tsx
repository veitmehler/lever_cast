import { Quote, LayoutGrid, Loader2, Film, Clapperboard, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SocialPostTypeSelector } from '@/components/SocialPostTypeSelector'
import { maxSlidesForPlatforms } from '@/lib/social/types'
import type { IdeaCaptureView } from '../useIdeaCapture'

export function PostTypeAssets({ capture }: { capture: IdeaCaptureView }) {
  const {
    postType,
    onPostTypeChange,
    isGeneratingAssets,
    isRecording,
    quoteVariant,
    setQuoteVariant,
    handleGenerateQuoteCard,
    content,
    selectedPlatformList,
    handleGenerateCarousel,
    selectedPlatforms,
    handleGenerateVideoReel,
    handleGenerateHookVideo,
    handleGenerateQuoteVideo,
  } = capture

  return (
    <>
      <SocialPostTypeSelector
        value={postType}
        onChange={(type) => onPostTypeChange?.(type)}
        disabled={isGeneratingAssets || isRecording}
      />

      {postType === 'quote' && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="quoteVariant"
                checked={quoteVariant === 'feed'}
                onChange={() => setQuoteVariant('feed')}
                className="w-4 h-4"
              />
              <span className="text-sm">1:1 Feed</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="quoteVariant"
                checked={quoteVariant === 'story'}
                onChange={() => setQuoteVariant('story')}
                className="w-4 h-4"
              />
              <span className="text-sm">9:16 Story</span>
            </label>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={handleGenerateQuoteCard}
            disabled={!content.trim() || isGeneratingAssets}
          >
            {isGeneratingAssets ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Quote className="w-4 h-4 mr-2" />
            )}
            Generate Quote Card
          </Button>
        </div>
      )}

      {postType === 'carousel' && (
        <div className="mt-4">
          <p className="text-xs text-muted-foreground mb-2">
            Slide count adapts to selected platforms (Twitter max {maxSlidesForPlatforms(['twitter'])}, LinkedIn max {maxSlidesForPlatforms(['linkedin'])}).
            {selectedPlatformList.length > 0 && (
              <> Current limit: {maxSlidesForPlatforms(selectedPlatformList)} slides.</>
            )}
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={handleGenerateCarousel}
            disabled={!content.trim() || isGeneratingAssets || selectedPlatforms.size === 0}
          >
            {isGeneratingAssets ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <LayoutGrid className="w-4 h-4 mr-2" />
            )}
            Generate Carousel
          </Button>
        </div>
      )}

      {(postType === 'video_reel' || postType === 'hook_video' || postType === 'quote_video') && (
        <div className="mt-4">
          <p className="text-xs text-muted-foreground mb-2">
            Video generation uses FFmpeg + fal Seedance (720p). Quote videos use your ElevenLabs voice when enabled in Settings.
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={
              postType === 'video_reel'
                ? handleGenerateVideoReel
                : postType === 'hook_video'
                  ? handleGenerateHookVideo
                  : handleGenerateQuoteVideo
            }
            disabled={!content.trim() || isGeneratingAssets}
          >
            {isGeneratingAssets ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : postType === 'video_reel' ? (
              <Film className="w-4 h-4 mr-2" />
            ) : postType === 'hook_video' ? (
              <Clapperboard className="w-4 h-4 mr-2" />
            ) : (
              <Video className="w-4 h-4 mr-2" />
            )}
            Generate {postType === 'video_reel' ? 'Video Reel' : postType === 'hook_video' ? 'Hook Video' : 'Quote Video'}
          </Button>
        </div>
      )}
    </>
  )
}

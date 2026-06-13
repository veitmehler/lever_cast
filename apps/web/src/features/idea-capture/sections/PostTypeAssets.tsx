import { SocialPostTypeSelector } from '@/components/SocialPostTypeSelector'
import type { IdeaCaptureView } from '../useIdeaCapture'

export function PostTypeAssets({ capture }: { capture: IdeaCaptureView }) {
  const {
    postType,
    onPostTypeChange,
    isGeneratingAssets,
    isRecording,
    quoteVariant,
    setQuoteVariant,
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
        </div>
      )}
    </>
  )
}

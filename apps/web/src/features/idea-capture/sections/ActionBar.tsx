import { Mic, Image as ImageIcon, Sparkles, Images, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImageGenerationModal } from '@/components/ImageGenerationModal'
import { ImageLibraryPicker } from '@/components/ImageLibraryPicker'
import type { IdeaCaptureView } from '../useIdeaCapture'

export function ActionBar({ capture }: { capture: IdeaCaptureView }) {
  const {
    toggleRecording,
    isRecording,
    fileInputRef,
    isUploadingImage,
    handleImageSelect,
    setIsLibraryPickerOpen,
    setIsImageGenerationModalOpen,
    handleGeneratePost,
    isGeneratingAssets,
    content,
    isLibraryPickerOpen,
    setSelectedImage,
    onImageAttached,
    isImageGenerationModalOpen,
    handleImageGenerated,
  } = capture

  return (
    <>
      {/* Action Buttons */}
      <div className="mt-6 flex items-center gap-3 flex-wrap">
        <button
          onClick={toggleRecording}
          className={`p-3 md:p-3 min-h-[44px] min-w-[44px] rounded-full transition-all flex items-center justify-center ${
            isRecording
              ? 'bg-destructive text-destructive-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
          title={isRecording ? 'Stop recording' : 'Start voice recording'}
        >
          <Mic className="w-5 h-5" />
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingImage}
          className="p-3 md:p-3 min-h-[44px] min-w-[44px] rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          title={isUploadingImage ? 'Uploading image...' : 'Upload image'}
        >
          {isUploadingImage ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <ImageIcon className="w-5 h-5" />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />

        <button
          onClick={() => setIsLibraryPickerOpen(true)}
          className="p-3 md:p-3 min-h-[44px] min-w-[44px] rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all flex items-center justify-center"
          title="Choose from image library"
        >
          <Images className="w-5 h-5" />
        </button>

        <button
          onClick={() => setIsImageGenerationModalOpen(true)}
          className="p-3 md:p-3 min-h-[44px] min-w-[44px] rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all flex items-center justify-center"
          title="Generate image with AI"
        >
          <Sparkles className="w-5 h-5" />
        </button>

        <div className="flex-1" />

        <Button
          onClick={handleGeneratePost}
          disabled={!content.trim() || isRecording || isGeneratingAssets}
          className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          {isGeneratingAssets ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          Generate Posts
        </Button>
      </div>

      <ImageLibraryPicker
        open={isLibraryPickerOpen}
        onClose={() => setIsLibraryPickerOpen(false)}
        onSelect={(url) => {
          setSelectedImage(url)
          onImageAttached?.(url)
        }}
      />

      {/* Image Generation Modal */}
      <ImageGenerationModal
        isOpen={isImageGenerationModalOpen}
        onClose={() => setIsImageGenerationModalOpen(false)}
        onImageGenerated={handleImageGenerated}
        postContent={content || 'Generate an image for my post'}
      />
    </>
  )
}

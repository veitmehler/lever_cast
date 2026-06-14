import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Trash2, Image as ImageIcon, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImageGenerationModal } from '@/components/ImageGenerationModal'
import type { PostEditorView } from '../usePostEditor'

export function PostHeader({ editor }: { editor: PostEditorView }) {
  const {
    id,
    post,
    handleDelete,
    isPlatformPublished,
    handleRemoveImage,
    fileInputRef,
    setIsImageGenerationModalOpen,
    handleImageSelect,
    isImageGenerationModalOpen,
    handleImageGenerated,
  } = editor

  if (!post) return null

  return (
    <>
      {/* Back Button */}
      <Link
        href="/posts"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Posts
      </Link>

      {/* Post Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{post.title}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="uppercase font-medium">
                {(() => {
                  // Try to parse as JSON array first (for multi-select)
                  try {
                    const parsed = JSON.parse(post.platforms)
                    if (Array.isArray(parsed)) {
                      return parsed.join(', ')
                    }
                  } catch {
                    // Not JSON, treat as string
                  }
                  return post.platforms
                })()}
              </span>
              <span>•</span>
              <span>{new Date(post.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}</span>
              <span>•</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  post.status === 'published'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {post.status}
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>

        {/* Original Idea - Only show for drafts and scheduled posts, not published */}
        {!(isPlatformPublished('linkedin') || isPlatformPublished('twitter') || isPlatformPublished('facebook') || isPlatformPublished('instagram') || isPlatformPublished('telegram') || isPlatformPublished('threads')) && (
          <div className="rounded-lg border border-border bg-card p-6 mb-6">
            <h3 className="text-sm font-semibold text-card-foreground mb-2">Original Idea</h3>
            <p className="text-muted-foreground mb-4">{post.contentRaw}</p>

            {/* Image Upload Section */}
            <div className="mt-4 pt-4 border-t border-border">
              <h4 className="text-sm font-semibold text-card-foreground mb-3">Attached Image</h4>
              {post.attachedImage ? (
                <div className="relative inline-block">
                  <Image
                    src={post.attachedImage}
                    alt="Attached to post"
                    width={512}
                    height={512}
                    className="rounded-lg max-h-48 w-auto object-cover border border-border"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <ImageIcon className="w-4 h-4" />
                      Upload Image
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsImageGenerationModalOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Generate with AI
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload an image or generate one with AI
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Image Generation Modal */}
      <ImageGenerationModal
        isOpen={isImageGenerationModalOpen}
        onClose={() => setIsImageGenerationModalOpen(false)}
        onImageGenerated={handleImageGenerated}
        postContent={post.contentRaw}
        draftId={id}
      />
    </>
  )
}

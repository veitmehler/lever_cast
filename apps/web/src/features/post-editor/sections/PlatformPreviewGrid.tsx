import { PlatformPreview } from '@/components/PlatformPreview'
import { PostAnalytics } from '@/components/PostAnalytics'
import type { PostEditorView } from '../usePostEditor'

export function PlatformPreviewGrid({ editor }: { editor: PostEditorView }) {
  const {
    post,
    userName,
    userInitials,
    isRegenerating,
    getSelectedPlatforms,
    handleRegenerate,
    handlePublish,
    handleSchedule,
    handleReschedule,
    handleContentChange,
    isPlatformPublished,
    getPublishedDate,
    isPlatformScheduled,
    getScheduledDate,
    getScheduledPostId,
    getPublishedPostAnalytics,
    handleRefreshAnalytics,
  } = editor

  if (!post) return null

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {getSelectedPlatforms().includes('linkedin') && post.linkedinContent && (
        <div className="space-y-4">
          <PlatformPreview
            platform="linkedin"
            content={post.linkedinContent}
            userName={userName}
            userInitials={userInitials}
            image={post.attachedImage || undefined}
            onRegenerate={() => handleRegenerate('linkedin')}
            onPublish={(editedContent) => handlePublish('linkedin', editedContent)}
            onSchedule={(editedContent, scheduledAt) => handleSchedule('linkedin', editedContent, scheduledAt)}
            onReschedule={(postId, scheduledAt) => handleReschedule(postId, scheduledAt)}
            onContentChange={handleContentChange}
            isPublished={isPlatformPublished('linkedin')}
            publishedDate={getPublishedDate('linkedin')}
            isScheduled={isPlatformScheduled('linkedin')}
            scheduledDate={getScheduledDate('linkedin')}
            scheduledPostId={getScheduledPostId('linkedin')}
            isRegenerating={isRegenerating.linkedin}
          />
          {isPlatformPublished('linkedin') && (
            <PostAnalytics
              platform="linkedin"
              analytics={getPublishedPostAnalytics('linkedin').analytics}
              lastSyncedAt={getPublishedPostAnalytics('linkedin').lastSyncedAt}
              postId={getPublishedPostAnalytics('linkedin').postId || ''}
              onRefresh={() => handleRefreshAnalytics('linkedin')}
            />
          )}
        </div>
      )}
      {getSelectedPlatforms().includes('twitter') && post.twitterContent && (
        <div className="space-y-4">
          <PlatformPreview
            platform="twitter"
            content={post.twitterContent}
            userName={userName}
            userInitials={userInitials}
            image={post.attachedImage || undefined}
            onRegenerate={() => handleRegenerate('twitter')}
            onPublish={(editedContent) => handlePublish('twitter', editedContent)}
            onSchedule={(editedContent, scheduledAt) => handleSchedule('twitter', editedContent, scheduledAt)}
            onReschedule={(postId, scheduledAt) => handleReschedule(postId, scheduledAt)}
            onContentChange={handleContentChange}
            isPublished={isPlatformPublished('twitter')}
            publishedDate={getPublishedDate('twitter')}
            isScheduled={isPlatformScheduled('twitter')}
            scheduledDate={getScheduledDate('twitter')}
            scheduledPostId={getScheduledPostId('twitter')}
            isRegenerating={isRegenerating.twitter}
          />
          {isPlatformPublished('twitter') && (
            <PostAnalytics
              platform="twitter"
              analytics={getPublishedPostAnalytics('twitter').analytics}
              lastSyncedAt={getPublishedPostAnalytics('twitter').lastSyncedAt}
              postId={getPublishedPostAnalytics('twitter').postId || ''}
              onRefresh={() => handleRefreshAnalytics('twitter')}
            />
          )}
        </div>
      )}
      {getSelectedPlatforms().includes('facebook') && post.facebookContent && (
        <div className="space-y-4">
          <PlatformPreview
            platform="facebook"
            content={post.facebookContent}
            userName={userName}
            userInitials={userInitials}
            image={post.attachedImage || undefined}
            onRegenerate={() => handleRegenerate('facebook')}
            onPublish={(editedContent) => handlePublish('facebook', editedContent)}
            onSchedule={(editedContent, scheduledAt) => handleSchedule('facebook', editedContent, scheduledAt)}
            onReschedule={(postId, scheduledAt) => handleReschedule(postId, scheduledAt)}
            onContentChange={handleContentChange}
            isPublished={isPlatformPublished('facebook')}
            publishedDate={getPublishedDate('facebook')}
            isScheduled={isPlatformScheduled('facebook')}
            scheduledDate={getScheduledDate('facebook')}
            scheduledPostId={getScheduledPostId('facebook')}
            isRegenerating={isRegenerating.facebook}
          />
        </div>
      )}
      {getSelectedPlatforms().includes('instagram') && post.instagramContent && (
        <div className="space-y-4">
          <PlatformPreview
            platform="instagram"
            content={post.instagramContent}
            userName={userName}
            userInitials={userInitials}
            image={post.attachedImage || undefined}
            onRegenerate={() => handleRegenerate('instagram')}
            onPublish={(editedContent) => handlePublish('instagram', editedContent)}
            onSchedule={(editedContent, scheduledAt) => handleSchedule('instagram', editedContent, scheduledAt)}
            onReschedule={(postId, scheduledAt) => handleReschedule(postId, scheduledAt)}
            onContentChange={handleContentChange}
            isPublished={isPlatformPublished('instagram')}
            publishedDate={getPublishedDate('instagram')}
            isScheduled={isPlatformScheduled('instagram')}
            scheduledDate={getScheduledDate('instagram')}
            scheduledPostId={getScheduledPostId('instagram')}
            isRegenerating={isRegenerating.instagram}
          />
        </div>
      )}
      {getSelectedPlatforms().includes('telegram') && post.telegramContent && (
        <div className="space-y-4">
          <PlatformPreview
            platform="telegram"
            content={post.telegramContent}
            userName={userName}
            userInitials={userInitials}
            image={post.attachedImage || undefined}
            onRegenerate={() => handleRegenerate('telegram')}
            onPublish={(editedContent) => handlePublish('telegram', editedContent)}
            onSchedule={(editedContent, scheduledAt) => handleSchedule('telegram', editedContent, scheduledAt)}
            onReschedule={(postId, scheduledAt) => handleReschedule(postId, scheduledAt)}
            onContentChange={handleContentChange}
            isPublished={isPlatformPublished('telegram')}
            publishedDate={getPublishedDate('telegram')}
            isScheduled={isPlatformScheduled('telegram')}
            scheduledDate={getScheduledDate('telegram')}
            scheduledPostId={getScheduledPostId('telegram')}
            isRegenerating={isRegenerating.telegram}
          />
        </div>
      )}
      {getSelectedPlatforms().includes('threads') && post.threadsContent && (
        <div className="space-y-4">
          <PlatformPreview
            platform="threads"
            content={post.threadsContent}
            userName={userName}
            userInitials={userInitials}
            image={post.attachedImage || undefined}
            onRegenerate={() => handleRegenerate('threads')}
            onPublish={(editedContent) => handlePublish('threads', editedContent)}
            onSchedule={(editedContent, scheduledAt) => handleSchedule('threads', editedContent, scheduledAt)}
            onReschedule={(postId, scheduledAt) => handleReschedule(postId, scheduledAt)}
            onContentChange={handleContentChange}
            isPublished={isPlatformPublished('threads')}
            publishedDate={getPublishedDate('threads')}
            isScheduled={isPlatformScheduled('threads')}
            scheduledDate={getScheduledDate('threads')}
            scheduledPostId={getScheduledPostId('threads')}
            isRegenerating={isRegenerating.threads}
          />
        </div>
      )}
    </div>
  )
}

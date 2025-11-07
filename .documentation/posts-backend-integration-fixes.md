# Posts & Drafts Backend Integration - Fixes

## Issues Fixed

### 1. User Details Not Showing in Generated Posts
**Problem**: When creating a post on the Dashboard, the "Your Generated Posts" preview was showing "John Doe" instead of the actual user's information from Clerk.

**Solution**:
- Updated `PlatformPreview.tsx` to accept `userName` and `userInitials` as props
- Modified `dashboard/page.tsx` to:
  - Import and use `useUser()` from Clerk
  - Extract user's full name and initials from Clerk data
  - Pass real user data to `PlatformPreview` components

### 2. Published Posts Not Appearing on /posts Page
**Problem**: When clicking "Publish", a success message appeared, but posts weren't showing up on the `/posts` page because everything was stored in `localStorage` instead of the database.

**Solution**:
Created a complete API-based draft and post management system:

#### API Routes Created:
1. **`/api/drafts`** (GET, POST)
   - GET: Fetch all drafts for authenticated user
   - POST: Create new draft with auto-user creation

2. **`/api/drafts/[id]`** (GET, PATCH, DELETE)
   - GET: Fetch single draft
   - PATCH: Update draft (e.g., mark as published)
   - DELETE: Delete draft

3. **`/api/posts`** (GET, POST)
   - GET: Fetch all posts for authenticated user
   - POST: Create new post and auto-update related draft status

4. **`/api/posts/[id]`** (GET, PATCH, DELETE)
   - GET: Fetch single post with related draft info
   - PATCH: Update post
   - DELETE: Delete post

#### Frontend Updates:

**Dashboard Page** (`dashboard/page.tsx`):
- Replaced `localStorage` imports with Clerk's `useUser()`
- Updated `handleSaveDraft()` to POST to `/api/drafts`
- Updated `handlePublish()` to:
  - Save draft first if not already saved
  - Create post record via `/api/posts`
  - Automatically update draft status to "published"
- Added real user data (name, initials) to `PlatformPreview` components

**Posts Page** (`posts/page.tsx`):
- Replaced `getDrafts()` from `localStorage` with API fetch from `/api/drafts`
- Added loading state with spinner
- Updated UI to show drafts from database
- Fixed "New Post" button to redirect to `/dashboard`
- Changed `draft.platform` to `draft.platforms` to match database schema
- Changed `draft.rawIdea` to `draft.contentRaw` to match database schema

**Individual Post Page** (`posts/[id]/page.tsx`):
- Replaced `getDraft()`, `deleteDraft()`, `markAsPublished()` from `localStorage` with API calls
- Added `useUser()` from Clerk for real user data
- Updated `handleDelete()` to DELETE via `/api/drafts/[id]`
- Updated `handlePublish()` to:
  - Create post via `/api/posts`
  - Refresh draft data after publishing
- Added loading state with spinner
- Added user data (name, initials) to `PlatformPreview` components
- Added attached image display support

## Key Features

### Auto-User Creation
All API routes include a `getOrCreateUser()` helper that automatically:
- Checks if user exists in database by `clerkUserId`
- Creates user record if they don't exist
- Returns the user for subsequent operations

This ensures that Clerk-authenticated users always have a corresponding database record.

### Data Persistence
- All drafts and posts are now stored in PostgreSQL via Prisma
- No more `localStorage` usage for drafts/posts
- User authentication via Clerk
- Automatic relationship management (drafts ↔ posts)

### Real-Time User Data
- User's full name and initials from Clerk
- Displayed in post previews across the app
- Falls back to sensible defaults if name not available

## Database Schema Used

### Draft Model
- `title`: Short preview title
- `contentRaw`: User's original idea
- `linkedinContent`: AI-generated LinkedIn post
- `twitterContent`: AI-generated Twitter post
- `platforms`: Selected platforms (JSON string)
- `templateId`: Optional template used
- `attachedImage`: Optional image attachment
- `status`: "draft" or "published"
- `publishedAt`: Timestamp when published

### Post Model
- `draftId`: Link to original draft
- `platform`: "linkedin" or "twitter"
- `content`: Published content
- `publishedAt`: Publication timestamp
- `postUrl`: URL to published post (for future OAuth)
- `status`: "published", "failed", or "deleted"
- `errorMsg`: Error details if publishing failed

## Next Steps

Future enhancements could include:
1. OAuth integration with LinkedIn and Twitter APIs for real publishing
2. Post scheduling functionality
3. Analytics for published posts
4. Draft versioning and revision history
5. Bulk publish to multiple platforms
6. Post performance metrics

## Testing

To verify the fixes:
1. Navigate to Dashboard
2. Create a new post with your idea
3. Verify your real name and initials appear in the preview (not "John Doe")
4. Click "Save Draft" - should see success message
5. Navigate to `/posts` - should see your saved draft
6. Click "Publish" on a post
7. Navigate back to `/posts` - should see the post marked as "published"
8. Click on a post to view details - should see your name in the preview

All data is now persisted in the database and survives page refreshes.



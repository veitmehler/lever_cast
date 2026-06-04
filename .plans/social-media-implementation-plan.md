# Social Media Posting — Complete Implementation Plan

## Overview

This document describes the complete social media posting system including platform integrations, manual posting, the 18-post automation engine, background processing, image/video generation, and the full database schema. It is intended as a handover document for implementing equivalent functionality in another application.

---

## 1. Supported Platforms

Six platforms are supported for publishing. TikTok, Pinterest, and YouTube are **not** integrated for posting (they appear only in frontend UI).

| Platform | Auth Type | Token Lifetime | Auto-Refresh |
|----------|-----------|---------------|--------------|
| **LinkedIn** | OAuth 2.0 (company or personal app) | ~60 days | No — verify and mark `expired` |
| **Facebook** | Meta OAuth + long-lived page token | ~60 days | No — warn 7 days before expiry |
| **Instagram** | Meta OAuth (same app as Facebook) | ~60 days | No |
| **Twitter/X** | OAuth 2.0 + PKCE | ~2 hours (access), long (refresh) | **Yes** — refresh every 30 min via cron |
| **Threads** | Meta Threads OAuth | Variable | No |
| **Telegram** | Bot token (no OAuth) | Permanent | N/A |

---

## 2. Platform Integrations (OAuth)

### 2.1 Architecture

All accounts are stored in the `SocialMediaAccount` Prisma model. Tokens are encrypted with AES-256-GCM using `ENCRYPTION_KEY` (`lib/social-media/oauth/encryption.ts`). The `encrypt()` / `decrypt()` functions wrap the token storage — in development, a Base64 fallback is used if `ENCRYPTION_KEY` is not set.

**Unique constraint:** `[platform, languageCode, appType]` — one account per platform per language per app type.

### 2.2 OAuth Initiation

**Route:** `GET /api/social/[platform]`  
**File:** `app/api/social/[platform]/route.ts`

Query params: `?language=XX&appType=personal|company`

This route calls the platform-specific URL builder:

```typescript
// lib/social-media/oauth/index.ts
getLinkedInAuthUrl(userId, appType, languageCode)
getTwitterAuthUrl(userId, languageCode)
getFacebookAuthUrl(userId, languageCode)
getInstagramAuthUrl(userId, languageCode)
getThreadsAuthUrl(userId, languageCode)
```

Each function builds the authorization URL with a signed state JWT (via `generateOAuthState()` in `lib/social-media/oauth/state.ts`) and redirects the browser to the provider.

### 2.3 OAuth Callbacks

**Route:** `GET /api/social/[platform]/callback`  
**File:** `app/api/social/[platform]/callback/route.ts`

Flow:
1. Verify the `state` param with `verifyOAuthState()`
2. Exchange `code` for tokens (provider-specific)
3. Fetch user/page info from provider
4. Call `upsertAccount()` in `lib/social-media/account-service.ts`
5. Redirect to `/app/settings?tab=oauth&oauth_success=1` or `oauth_error=...`

### 2.4 Per-Platform OAuth Details

#### LinkedIn

- **Auth URL:** `https://www.linkedin.com/oauth/v2/authorization`
- **Token URL:** `POST https://www.linkedin.com/oauth/v2/accessToken`
- **Scopes (company):** `w_organization_social r_organization_social rw_organization_admin`
- **Scopes (personal):** `w_member_social r_liteprofile`
- **Env vars:** `LINKEDIN_COMPANY_CLIENT_ID`, `LINKEDIN_COMPANY_CLIENT_SECRET`, `LINKEDIN_COMPANY_REDIRECT_URI` (company) or `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI` (personal)
- **Stored:** `accessToken` (encrypted), `platformUserId` (organization URN or member URN), `accountName`

#### Facebook

- **Auth URL:** `https://www.facebook.com/v24.0/dialog/oauth`
- **Token URL:** `GET https://graph.facebook.com/v24.0/oauth/access_token`
- **Long-lived exchange:** `GET https://graph.facebook.com/v24.0/oauth/access_token?grant_type=fb_exchange_token`
- **Scopes:** `public_profile,business_management,pages_show_list,pages_manage_posts,pages_read_engagement`
- **After exchange:** fetch pages list → store selected page token with `pageId`
- **Env vars:** `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `FACEBOOK_REDIRECT_URI`
- **Stored:** `accessToken` (page token, encrypted), `pageId`, `platformUserId`, `accountName`

#### Instagram

- Uses same Meta app as Facebook
- **Scopes:** `pages_show_list,pages_read_engagement,instagram_content_publish,instagram_basic,business_management`
- After callback: fetch connected IG Business Account from Facebook page → store IG account ID as `platformUserId`
- **Env vars:** `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`, `INSTAGRAM_REDIRECT_URI` (fallback to Facebook vars if not set)
- **Stored:** `accessToken` (Facebook page token, encrypted), `platformUserId` (IG account ID), `pageId` (Facebook page ID)

#### Twitter/X

- Uses `@xdevplatform/xdk` library
- **Auth:** `createXOAuth2()` in `lib/social-media/x-client.ts` → `oauth2.getAuthorizationUrl()` with PKCE
- **Code verifier** stored in session/cookie during flow
- **Token URL:** `https://api.x.com/2/oauth2/token`
- **Scopes:** `tweet.read tweet.write users.read offline.access media.write`
- **Refresh:** `refreshXToken()` in `lib/social-media/x-client.ts` using `refreshToken`
- **Env vars:** `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET`, `TWITTER_REDIRECT_URI`
- **Stored:** `accessToken` (encrypted), `refreshToken` (encrypted), `tokenExpiresAt`, `platformUserId`, `platformUsername`

#### Threads

- **Scopes:** `threads_basic,threads_content_publish`
- **Env vars:** `THREADS_CLIENT_ID`, `THREADS_CLIENT_SECRET`, `THREADS_REDIRECT_URI`
- **Stored:** `accessToken` (encrypted), `platformUserId`, `accountName`

#### Telegram

- No OAuth — bot tokens are entered manually in the admin UI
- **Setup:** Admin enters bot token + chat ID via `POST /api/social-media/accounts`
- **Verification:** `GET https://api.telegram.org/bot{token}/getMe` confirms the token is valid
- **Stored:** `botToken` (encrypted), `chatId`, `platformUsername`, `accountName`

### 2.5 Account Service (`lib/social-media/account-service.ts`)

Key functions:

```typescript
getAccounts(userId: string): Promise<SocialMediaAccount[]>
upsertAccount(data: UpsertAccountData): Promise<SocialMediaAccount>
getDecryptedToken(accountId: string): Promise<{ accessToken: string; refreshToken?: string; botToken?: string }>
disconnectAccount(accountId: string): Promise<void>
```

### 2.6 Token Refresh Cron (`lib/social-media/token-refresh-service.ts`)

**Route:** `POST /api/cron/token-refresh` — runs every 30 minutes.

- For Twitter accounts: calls `refreshXToken()` if `tokenExpiresAt < now + 5min`
- For Facebook/Instagram: checks token debug endpoint; marks `expired` if within 7 days
- On failures: calls `sendConnectionAlerts()` from `lib/social-media/connection-alert-service.ts` — sends email via Resend

### 2.7 Environment Variables for OAuth

```
ENCRYPTION_KEY                   # AES-256-GCM key for token encryption
NEXT_PUBLIC_APP_URL              # Base URL for OAuth redirect URIs
LINKEDIN_COMPANY_CLIENT_ID
LINKEDIN_COMPANY_CLIENT_SECRET
LINKEDIN_COMPANY_REDIRECT_URI
LINKEDIN_CLIENT_ID               # Personal LinkedIn (optional)
LINKEDIN_CLIENT_SECRET
LINKEDIN_REDIRECT_URI
FACEBOOK_CLIENT_ID
FACEBOOK_CLIENT_SECRET
FACEBOOK_REDIRECT_URI
INSTAGRAM_CLIENT_ID              # Optional: falls back to Facebook vars
INSTAGRAM_CLIENT_SECRET
INSTAGRAM_REDIRECT_URI
TWITTER_CLIENT_ID
TWITTER_CLIENT_SECRET
TWITTER_REDIRECT_URI
THREADS_CLIENT_ID
THREADS_CLIENT_SECRET
THREADS_REDIRECT_URI
```

---

## 3. Publishing Clients (per platform)

All publishing functions live in `lib/social-media/posting/`. They are called by the posting dispatcher (`lib/social-media/posting-dispatcher.ts`).

### 3.1 LinkedIn (`lib/social-media/posting/linkedin.ts`)

**Function:** `postToLinkedIn(post, account)`

- **Text post:** `POST https://api.linkedin.com/v2/ugcPosts`
- **Image upload:** First register asset via `POST https://api.linkedin.com/v2/assets?action=registerUpload`, then PUT binary to the upload URL, then reference asset URN in ugcPost
- **Carousel:** Upload each image separately, reference all URNs in a multi-image `ugcPost`
- **Video:** Not directly supported — posts link preview instead
- **Auth:** `Authorization: Bearer {accessToken}`
- **Organization URN:** `urn:li:organization:{platformUserId}`

### 3.2 Facebook (`lib/social-media/posting/facebook.ts`)

**Function:** `postToFacebook(post, account)`

API base: `https://graph.facebook.com/v24.0/{pageId}/`

- **Text/link post:** `POST /{pageId}/feed` with `{message, link}`
- **Photo post:** `POST /{pageId}/photos` with `{url, caption}`
- **Carousel (multiple images):** Multiple `photos` calls with `published: false`, then reference `attached_media` IDs in a feed post
- **Video reel:** `POST /{pageId}/videos` with `{file_url, description}`
- **Story (image):** `POST /{pageId}/photo_stories` with `{url}`
- **Story (video):** `POST /{pageId}/video_stories` with `{file_url}`
- **Auth:** `access_token={pageToken}` as query param or header

### 3.3 Instagram (`lib/social-media/posting/instagram.ts`)

**Function:** `postToInstagram(post, account)`

API base: `https://graph.facebook.com/v24.0/{igAccountId}/`

Two-step publish for all post types:
1. Create media container: `POST /{igAccountId}/media` → returns `{id: containerId}`
2. Publish container: `POST /{igAccountId}/media_publish` with `{creation_id: containerId}`

Post type routing:
- **Single image:** `media_type: IMAGE`, `image_url`
- **Story (image):** `media_type: IMAGE`, `image_url`, `media_type: STORIES` (or `is_stories_item: true`)
- **Story (video):** `media_type: VIDEO`, `video_url`, `media_type: STORIES`
- **Carousel:** Create N child containers with `is_carousel_item: true`, then create parent with `media_type: CAROUSEL`, `children: [id1, id2, ...]`
- **Reels:** `media_type: REELS`, `video_url`

Before publishing: calls `logMetaTokenStatus()` to debug token issues.

### 3.4 Twitter/X (`lib/social-media/posting/twitter.ts`)

**Function:** `postToTwitter(post, account)`

Uses `@xdevplatform/xdk`:

```typescript
const client = new xdk.XClient({ auth: { accessToken } })
```

- **Tweet:** `client.posts.create({ text, media: { media_ids } })`
- **Media upload:** `POST https://upload.twitter.com/1.1/media/upload.json` (chunked for video)
- **Carousel:** Upload up to 4 images, attach all as `media_ids` in single tweet
- **Thread (replies):** Sequential tweets with 3s delay between each; `reply: { in_reply_to_tweet_id }`
- **Character limit:** 280 (enforced in caption generation)
- **Video:** Upload + `media_category: tweet_video`

### 3.5 Threads (`lib/social-media/posting/threads.ts`)

**Function:** `postToThreads(post, account)`

Two-step publish (same pattern as Instagram):
1. `POST https://graph.threads.net/v1.0/{userId}/threads` with `{media_type, text, image_url}`
2. `POST https://graph.threads.net/v1.0/{userId}/threads_publish` with `{creation_id}`

**Character limit:** 500

### 3.6 Telegram (`lib/social-media/posting/telegram.ts`)

**Function:** `postToTelegram(post, account)`

API: `https://api.telegram.org/bot{botToken}/`

- **Text:** `sendMessage` with `{chat_id, text, parse_mode: "HTML"}`
- **Photo:** `sendPhoto` with `{chat_id, photo: url, caption, parse_mode: "HTML"}`
- **Video:** `sendVideo` with `{chat_id, video: url, caption}`
- **Media group (carousel):** `sendMediaGroup` with `{chat_id, media: [{type, media, caption}]}`
- **Caption limit:** 1,024 characters for photos; 4,096 for text-only
- Supports HTML formatting: `<b>`, `<i>`, `<a href>`, `<code>`

---

## 4. Database Schema (Prisma)

### 4.1 `SocialMediaAccount`

```prisma
model SocialMediaAccount {
  id               String    @id @default(cuid())
  platform         String    // linkedin|facebook|instagram|twitter|threads|telegram
  languageCode     String    // ISO language code (e.g. "en", "es")
  accountName      String
  platformUserId   String?   // org URN / IG account ID / Twitter ID
  platformUsername String?
  pageId           String?   // Facebook Page ID
  appType          String    @default("company")  // company|personal
  accessToken      String?   // encrypted
  refreshToken     String?   // encrypted (Twitter only)
  tokenExpiresAt   DateTime? // Twitter token expiry
  botToken         String?   // encrypted (Telegram only)
  chatId           String?   // Telegram chat ID
  status           String    @default("connected") // connected|disconnected|expired|error
  lastVerified     DateTime?
  errorMessage     String?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  posts            SocialPost[]

  @@unique([platform, languageCode, appType])
}
```

### 4.2 `SocialPost`

```prisma
model SocialPost {
  id                String    @id @default(cuid())
  jobId             String?   // links to SocialContentAutomation
  sitePageId        String?   // article this post was generated from
  accountId         String?
  account           SocialMediaAccount? @relation(fields: [accountId], references: [id])
  templateId        String?
  platform          String
  languageCode      String
  content           String    @db.Text    // caption/post text
  topic             String?
  imageUrls         String[]  // S3/CDN URLs for carousel slides or single image
  videoUrl          String?   // S3/CDN URL for feed video
  postType          String    // single|carousel|video_reel|diagram|story|quote_single|quote_carousel|quote_video
  carouselSlideData String?   @db.Text  // JSON array of CarouselSlide objects
  storyVideoUrl     String?   // 9:16 video URL for stories
  postAsStory       Boolean   @default(false)
  threadReplies     String[]  // Twitter thread reply texts
  h2Index           Int?      // which H2 section this post covers
  h2Title           String?
  platformPostId    String?   // ID returned from platform after publish
  platformPostUrl   String?   // public URL of published post
  scheduledAt       DateTime?
  status            String    @default("draft") // draft|scheduled|publish_queued|posting|posted|failed
  isManual          Boolean   @default(false)
  groupId           String?   // groups all 18 posts from same automation run
  llmCostUsd        Float?
  imageCostUsd      Float?
  videoCostUsd      Float?
  postedAt          DateTime?
  errorMessage      String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}
```

### 4.3 `SocialMediaTemplate`

```prisma
model SocialMediaTemplate {
  id            String  @id @default(cuid())
  name          String
  platform      String
  template      String  @db.Text  // content template with {{generated_content}} placeholder
  description   String?
  maxLength     Int?
  hashtagRules  String? @db.Text
  imageRequired Boolean @default(false)
  isActive      Boolean @default(true)
  usageCount    Int     @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### 4.4 `SocialMediaPrompt`

```prisma
model SocialMediaPrompt {
  id           String  @id @default(cuid())
  platform     String  @unique  // platform name OR prompt key (e.g. "story_content_plan")
  name         String
  systemPrompt String  @db.Text
  userPrompt   String  @db.Text
  provider     String  @default("openai")   // openai|anthropic|gemini
  model        String  @default("gpt-4o-mini")
  variables    Json?   // documentation of template variables
  version      Int     @default(1)
  isActive     Boolean @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### 4.5 `SocialMediaSettings`

```prisma
model SocialMediaSettings {
  id                        String   @id @default(cuid())
  schedulingPaused          Boolean  @default(false)
  pausedAt                  DateTime?
  pausedBy                  String?
  voiceoverEnabled          Boolean  @default(false)
  voiceoverSpeed            Float    @default(1.0)
  voiceoverLanguage         String   @default("en")
  storyVoiceId              String?  // ElevenLabs voice ID for story videos
  quoteVideoVoiceId         String?  // ElevenLabs voice ID for quote videos
  scheduleSlots             Json?    // array of {specId, timeHour, timeMinute}
  imageSpecialInstructions  String?  @db.Text
  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt
}
```

### 4.6 `SocialContentAutomation`

```prisma
model SocialContentAutomation {
  id             String   @id @default(cuid())
  sitePageId     String
  scheduledDate  String   // "YYYY-MM-DD" — calendar date for post scheduling
  status         String   @default("pending") // pending|processing|completed|failed|cancelled
  totalSpecs     Int      @default(18)
  completedSpecs Int      @default(0)
  failedSpecs    Int      @default(0)
  currentSpec    String?  // e.g. "S3" — spec being processed
  error          String?  @db.Text
  groupId        String?  // shared with all SocialPost records from this run
  createdBy      String?  // userId who triggered it
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

---

## 5. Manual Posting

### 5.1 Admin UI Pages

| Route | Purpose |
|-------|---------|
| `/app/social-media/create` | Create posts manually (all types) |
| `/app/social-media/calendar` | View scheduled posts, publish now, retry, reschedule |
| `/app/social-media/settings` | Voiceover config, schedule slot overrides, image instructions |
| `/app/social-media/audio-library` | Upload/manage background audio for stories |
| `/app/social-media/video-hooks-library` | Upload/manage hook video clips prepended to reels |
| `/app/settings?tab=oauth` | Connect/disconnect platform accounts |
| `/admin/social-media/prompts` | Edit `SocialMediaPrompt` records in DB |
| `/admin/social-media/templates` | Edit `SocialMediaTemplate` records in DB |

### 5.2 Create Form Model

```typescript
interface FormData {
  topic: string             // post subject / article section heading
  details: string           // additional context for LLM
  articleUrl: string        // optional article URL to include in caption
  imageUrl: string          // optional seed image URL
  postType: PostType        // determines which generator to call
  selectedPlatforms: SocialPlatform[]
  selectedLanguages: string[]
  templateIds: Record<SocialPlatform, string>  // which template per platform
  writeManually: boolean    // skip LLM generation, write caption yourself
}
```

PostType values: `single`, `carousel`, `video_reel`, `diagram`, `story`, `quote_single`, `quote_carousel`, `quote_video`, `hook_video_reel`, `hook_story`, `hook_quote_video`

### 5.3 Caption Generation Flow (`POST /api/social-media/posts/generate-manual`)

1. Load `SocialMediaPrompt` for target platform from DB
2. Load `SocialMediaTemplate` for platform+language (for `maxLength`, `hashtagRules`)
3. Substitute template variables: `{{topic}}`, `{{details}}`, `{{article_url}}`, `{{h2_title}}`, `{{h2_content}}`, `{{keywords}}`, `{{platform_name}}`, `{{max_length}}`, `{{hashtag_rules}}`
4. Call LLM: `getLLMAdapter(provider).call({ systemPrompt, userPrompt, model, temperature: 0.7, maxTokens: 1000 })`
5. Merge into template: replace `{{generated_content}}` in `SocialMediaTemplate.template`
6. Apply `sanitizeContent()` (strip disallowed HTML, trim)
7. Return `{ content: string }`

### 5.4 Post Creation (`POST /api/social-media/posts`)

**Validation rules:**
- `platform` (required), `languageCode` (required), `content` (non-empty)
- `status`: `draft` | `scheduled` | `publish_queued`
- `scheduled` requires `scheduledAt` (future datetime)
- `carousel` / `quote_carousel`: `imageUrls` array with ≥2 entries
- `video_reel` / `quote_video`: `videoUrl` required (or `storyVideoUrl` if `postAsStory`)
- `diagram` / `quote_single`: ≥1 image URL
- `story`: `storyVideoUrl` or `videoUrl` or ≥1 image URL

**Publish immediately:** Set `status: publish_queued` → then call `POST /api/social-media/posts/{id}/publish` → `publishPostNow()` → same dispatcher as cron.

### 5.5 Key API Routes

| Method | Route | Function |
|--------|-------|---------|
| `GET` | `/api/social-media/posts` | List posts (filterable by status, platform, language, date range) |
| `POST` | `/api/social-media/posts` | Create post |
| `GET` | `/api/social-media/posts/[id]` | Get single post |
| `PUT` | `/api/social-media/posts/[id]` | Update post (reschedule, edit content) |
| `DELETE` | `/api/social-media/posts/[id]` | Delete post |
| `POST` | `/api/social-media/posts/[id]/publish` | Publish immediately |
| `POST` | `/api/social-media/posts/[id]/retry` | Retry failed post |
| `POST` | `/api/social-media/posts/batch-reschedule` | Bulk reschedule multiple posts |
| `GET` | `/api/social-media/accounts` | List connected accounts |
| `POST` | `/api/social-media/accounts` | Connect Telegram account |
| `DELETE` | `/api/social-media/accounts/[id]` | Disconnect account |

---

## 6. Post Types and Compositing

### 6.1 Post Type Reference

| `postType` | Story? | Dimensions | Platforms | Notes |
|------------|--------|------------|-----------|-------|
| `single` | No | Varies (user image) | All | Plain image + caption |
| `carousel` | No | 1024×1024 px/slide | All | AI images via fal + Sharp compositor |
| `diagram` | Both | Feed: 1080×1080, Story: 1080×1920 | All (feed) / FB+IG (story) | SVG diagram embedded in canvas |
| `story` | Yes | 1080×1920 (video) | FB + IG | 6-slide video with AI images + FFmpeg |
| `video_reel` | Both | Feed: 1:1, Story: 9:16 | All | fal Seedance video + overlay + hook prepend |
| `quote_single` | Both | 1080×1080 or 1080×1920 | All | Branded quote card with Sharp |
| `quote_carousel` | No | 1080×1080/slide | All | Multiple quote cards; FB trims >10 to title+8+CTA |
| `quote_video` | Both | 9:16 video | All (story for FB/IG) | ElevenLabs audio + slide images + FFmpeg |
| `hook_video_reel` | Both | Same as video_reel | All | video_reel with random hook prepended |
| `hook_story` | Both | Same as story | FB+IG (story) / all (feed) | story with random hook prepended |
| `hook_quote_video` | Both | Same as quote_video | All | quote_video with random hook prepended |

### 6.2 Carousel Compositor (`lib/social-media/carousel-compositor.ts`)

Output: **1024×1024 px** JPEG per slide

For each slide (from `CarouselSlide[]`):
1. Download/generate background image via fal.ai (`DEFAULT_IMAGE_MODEL = 'fal-ai/flux/schnell'`)
2. Use Sharp to compose:
   - Color overlay (from `styleGuide.palette`)
   - Brand gradient bar (bottom, from `BrandConfig`)
   - Headline text (SVG text rendered onto canvas)
   - Body text bullets (SVG text)
   - Logo watermark (top-right)
   - Verified badge (optional)
3. Upload composited JPEG to S3
4. Return CDN URLs

**Twitter carousel variant** (`lib/social-media/twitter-carousel-compositor.ts`): same pipeline, exactly 4 slides, slightly different text layout optimized for square format.

### 6.3 Story Compositor (`lib/social-media/story-compositor.ts`)

Output: **1080×1920 px** MP4 video (optional static JPEG fallback)

Flow:
1. Generate `StorySlide[]` via LLM (`story_content_plan` prompt key) — 6 slides (hook + 4 content + CTA)
2. For each slide: generate background image via fal.ai at 1080×1920
3. Compose each frame with Sharp:
   - Background image (scaled to fill 1080×1920)
   - Headline text overlay
   - Body text (24 words per slide rule)
   - Brand elements (gradient bar, logo, badge)
4. If voiceover enabled: generate audio via ElevenLabs for each slide text, concatenate
5. Assemble frames + audio into MP4 with FFmpeg
6. Optional: prepend hook video clip (from audio library)
7. Upload MP4 to S3

**Duration limit:** If assembled video > 60s, fall back to static diagram image story for FB/IG.

### 6.4 Video Reel Compositor (`lib/social-media/video-compositor.ts`)

Output: MP4 video (1:1 feed or 9:16 story)

Flow:
1. Generate video prompt via `video_prompt` LLM key
2. Generate video via fal.ai Seedance: `fal-ai/bytedance/seedance/v1/pro/fast/text-to-video`
3. Poll for completion: `waitForVideoGeneration(requestId)` — polls `GET /api/social-media/posts/generate-video/status`
4. Compose overlay onto video with FFmpeg:
   - Headline text
   - Bullet points (max 52 chars per line — `VIDEO_REEL_USE_SCALE_FALLBACK` env var enables alternative sizing)
   - Brand bar (bottom strip)
   - Logo
5. If `needsHook`: prepend random hook clip from video hooks library (fetched via `getRandomHookUrl()`)
6. Upload to S3

### 6.5 Quote Card Compositor (`lib/social-media/quote-card-compositor.ts`)

Output: **1080×1080** (feed) or **1080×1920** (story) JPEG

Uses Sharp + SVG:
1. Solid background in brand primary color
2. Large quote text centered
3. Speaker name / attribution line
4. Brand logo and gradient accent

**Quote carousel variant:** Generates N quote cards; Facebook receives max 10 (title card + slides 2–9 + CTA card).

### 6.6 Diagram Inverter (`lib/social-media/diagram-inverter.ts`)

Converts article's light SVG diagram to dark version for social posts.

```typescript
getDarkDiagramUrlOrNull(svg: string | null, lightUrl: string | null, sitePageId: string): Promise<string | null>
```

Steps:
1. Fetch the light SVG
2. Use Sharp to invert colors + increase contrast
3. `cropToContent()` — trim transparent/white margins using Sharp `trim()`
4. Upload dark JPEG to S3

**Feed wrapper** (`wrapDiagramAsFeedCanvas`): Places dark diagram on 1080×1080 dark background with brand elements.

**Story wrapper** (`wrapDiagramAsStoryCanvas`): Places diagram on 1080×1920 dark background, maintains aspect ratio with max height 1500px (capped), centers vertically.

---

## 7. The 18-Post Automation Engine

### 7.1 Overview

Every article can generate exactly **18 social posts**:
- **9 STORY posts** — Facebook + Instagram stories only
- **9 NORMAL posts** — all connected platforms (feed posts)

Each post is scheduled at a specific local time on the `scheduledDate` provided at trigger time. Times are converted to UTC using the site's configured timezone (`getWebsiteTimezone()`).

### 7.2 Trigger Points

**Trigger 1: Manual via article UI**
```typescript
// POST /api/social-media/automation/create
{ sitePageId: string, scheduledDate: "YYYY-MM-DD" }
```
Creates a `SocialContentAutomation` record with `status: 'pending'`, then fire-and-forgets `processAutomationJob(jobId)`.

**Trigger 2: Automatic on article publish**
In `lib/services/article-schedule-queue.ts`, after enrichment completes:
```typescript
if (!topic.skipSocialMedia) {
  await runSocialAutomation(sitePageId, scheduledDate)
}
```
`skipSocialMedia` is a flag set when uploading a CSV article to backfill content without triggering automation.

**Trigger 3: Safety cron restart**
`POST /api/cron/social-content-process` — runs every minute, restarts:
- `processing` jobs stuck > 15 minutes (system crash recovery)
- `pending` jobs older than 5 minutes that were never picked up

### 7.3 The 18 Post Specifications

Each spec has: `id`, scheduled `timeHour:timeMinute` (local), `postType`, `postAsStory`, `contentSource`, `needsDiagram`, `needsHook`, `durationCheck`, `targetPlatforms`.

#### Story Specs (Facebook + Instagram stories only)

| Spec ID | Time (local) | Post Type | Content Source | Notes |
|---------|-------------|-----------|----------------|-------|
| S1 | 08:00 | `quote_single` | `intro` | Article intro as quote card story |
| S2 | 10:00 | `video_reel` | `key_takeaways` | Video from key takeaways, story format |
| S3 | 12:00 | `hook_quote_video` | H2 section 0 | With hook; 60s duration check |
| S4 | 14:00 | `diagram` | H2 section 1 | Dark diagram on story canvas |
| S5 | 16:00 | `story` | H2 section 2 | 6-slide video story |
| S6 | 17:30 | `quote_video` | H2 section 3 | 60s duration check |
| S7 | 19:00 | `hook_quote_video` | H2 section 4 | With hook; 60s duration check |
| S8 | 20:30 | `story` | H2 section 5 | 6-slide video story |
| S9 | 22:00 | `hook_story` | H2 section 6 | Story with hook prepended |

#### Normal Specs (all connected platforms)

| Spec ID | Time (local) | Post Type | Content Source | Notes |
|---------|-------------|-----------|----------------|-------|
| N1 | 08:30 | `hook_quote_video` | H2 section 0 | With hook; feed format |
| N2 | 10:30 | `diagram` | H2 section 1 | Dark diagram on 1080×1080 canvas |
| N3 | 12:30 | `carousel` | H2 section 2 | AI image carousel |
| N4 | 14:30 | `quote_carousel` | H2 section 3 | Quote cards carousel |
| N5 | 16:30 | `video_reel` | `key_takeaways` | Feed video reel |
| N6 | 18:00 | `quote_carousel` | H2 section 4 | Quote cards carousel |
| N7 | 19:30 | `carousel` | H2 section 5 | AI image carousel |
| N8 | 21:00 | `quote_single` | `intro` | Single quote card feed post |
| N9 | 22:30 | `hook_story` | H2 section 6 | Hook + story, feed format for non-story platforms |

**Schedule slot overrides:** Admin can change any spec's time via `SocialMediaSettings.scheduleSlots` (array of `{specId, timeHour, timeMinute}`). The engine applies overrides at runtime before processing.

### 7.4 Content Source Resolution

```typescript
function resolveContentForSpec(spec, articleContent):
  { topic, details, plainText, section }
```

- `'intro'` → `{ topic: article.title, details: article.introParagraph }`
- `'key_takeaways'` → `{ topic: article.title, details: article.keyTakeawaysHtml (HTML-stripped) }`
- `{ h2Index: N }` → resolves to the Nth H2 section; `topic = section.title`, `details = section.plainText`

If an article has fewer than 7 H2 sections, missing sections use the article intro as fallback (via `resolveH2Section()`).

### 7.5 Engine Flow (`lib/social-media/article-content-automation.ts`)

```typescript
async function processAutomationJob(jobId: string): Promise<void>
```

1. **Fetch job** → set `status: 'processing'`
2. **Parse article** via `parseArticleForAutomation(sitePageId)` — loads SitePage, ArticleEnrichment, H2 sections, diagrams, translations from Prisma
3. **Load connected accounts** — grouped by `languageCode`; only `status: 'connected'` accounts
4. **Load settings** — `SocialMediaSettings` (voiceover, schedule slots, imageSpecialInstructions)
5. **Get site timezone** via `getWebsiteTimezone()`
6. **Apply schedule slot overrides** from DB onto `ALL_SPECS`
7. **Process each of the 18 specs** via `processSpec(spec, ctx)` — sequential (not parallel)
8. **Update job status** → `completed` (if any specs succeeded) or `failed` (if all failed)
9. **Send summary email** via `sendAutomationSummaryEmail()` if any specs failed

### 7.6 Per-Spec Processing (`processSpec`)

```typescript
async function processSpec(spec: PostSpec, ctx: SpecContext): Promise<void>
```

1. **Resolve content** via `resolveContentForSpec()`
2. **Determine target accounts** per language
3. **Get dark diagram URL** if `spec.needsDiagram`:
   ```typescript
   darkDiagramUrl = await getDarkDiagramUrlOrNull(section.diagramSvg, section.diagramUrlLight, sitePageId)
   ```
4. **Route to type-specific generator** (see below)
5. **For each language group**: call generation API, create `SocialPost` records with `status: 'scheduled'`, correct `scheduledAt`

**Type routing:**

```
diagram     → wrapDiagramAs{Story|Feed}Canvas → generateDiagramPost()
quote_single → generateQuoteSinglePost()
quote_video / hook_quote_video → generateQuoteVideoPost()
story / hook_story → generateStoryPost()
carousel    → generateCarouselPost()
quote_carousel → generateQuoteCarouselPost()
video_reel / hook_video_reel → generateVideoReelPost()
```

**Duration check** (`spec.durationCheck = true`): After video generation, use `ffprobe` to check duration. If > 60s, fall back to static diagram story for FB/IG instead of video.

**Hook loading**: If `spec.needsHook`: call `getRandomHookUrl()` → `GET /api/social-media/video-hooks-library` → random hook clip URL.

### 7.7 Internal API (`lib/social-media/internal-api.ts`)

All generation API routes are called via internal HTTP to avoid Next.js boundary issues:

```typescript
async function internalPost<T>(path: string, body: object): Promise<T>
async function internalGet<T>(path: string): Promise<T>
```

- Base URL: `http://127.0.0.1:${PORT}` (from env `PORT`, default 3000)
- Auth: `X-Service-Token: {CRON_SECRET}` header
- All generation routes accept this token via `authenticateServiceOrUser()` middleware

---

## 8. LLM Prompts (Full Text)

All prompts are stored in the `SocialMediaPrompt` table and editable in the admin UI. Default values are seeded by `scripts/seed-social-media.ts`. The runtime always loads from DB.

### 8.1 Platform Caption Prompts

Each platform has one entry in `SocialMediaPrompt` with `platform` = the platform name. All use `gpt-4o-mini` by default.

#### LinkedIn

**System:** "You are a professional social media copywriter specializing in LinkedIn Company Page posts. You write in a professional yet engaging tone that drives engagement and clicks. Your posts are optimized for the LinkedIn algorithm and encourage meaningful conversations."

**User template:**
```
Write a LinkedIn Company Page post based on the following article section.

**Article:** {{article_title}}
**Section Heading:** {{h2_title}}
**Section Content:**
{{h2_content}}

**Article URL:** {{article_url}}
**Keywords:** {{keywords}}
**Author:** {{author_name}}

GUIDELINES:
- Write a compelling hook in the first 2 lines (this shows "above the fold" on LinkedIn)
- Use 1-3 relevant emojis sparingly for visual interest
- Include 3-5 relevant hashtags at the end
- Keep the post between 150-300 words for optimal engagement
- End with a clear call-to-action directing readers to the article
- Include the article URL naturally in the post
- Write in a professional but conversational tone
- Break text into short paragraphs (2-3 lines max) for readability

Return ONLY the post text, ready to publish. No explanations or meta-commentary.
```

#### Facebook

**System:** "You are a social media copywriter specializing in Facebook Page posts. You write engaging, shareable content that encourages comments and shares. Your posts feel authentic and conversational while still being professional."

**User template:**
```
Write a Facebook Page post based on the following article section.

**Article:** {{article_title}}
**Section Heading:** {{h2_title}}
**Section Content:**
{{h2_content}}

**Article URL:** {{article_url}}
**Keywords:** {{keywords}}

GUIDELINES:
- Start with an attention-grabbing question or statement
- Write 100-200 words (Facebook engagement sweet spot)
- Use 1-2 emojis for visual appeal
- Include the article URL at the end
- Add a clear call-to-action (e.g., "Read more", "Learn more", "What do you think?")
- Encourage engagement by asking a question
- Keep paragraphs short (1-2 sentences)
- Use 2-3 relevant hashtags maximum

Return ONLY the post text, ready to publish.
```

#### Instagram

**System:** "You are a social media copywriter specializing in Instagram captions. You write visually-oriented, engaging captions that complement images. Your captions are optimized for Instagram's algorithm with strategic hashtag use."

**User template:**
```
Write an Instagram caption based on the following article section.

**Article:** {{article_title}}
**Section Heading:** {{h2_title}}
**Section Content:**
{{h2_content}}

**Keywords:** {{keywords}}

GUIDELINES:
- Write a compelling first line (only first ~125 characters show before "more")
- Keep the caption between 100-200 words
- Use line breaks for readability
- Include a clear call-to-action (e.g., "Link in bio", "Save this post")
- Add 15-25 relevant hashtags in a separate block at the end
- Mix popular, niche, and branded hashtags
- Use emojis strategically throughout (3-5 total)
- Write in an engaging, visual-first tone
- Note: The article URL cannot be clickable in captions — direct to "link in bio"

Return ONLY the caption text, ready to publish.
```

#### Twitter/X

**System:** "You are a social media copywriter specializing in Twitter/X posts. You write concise, punchy tweets that drive engagement and clicks. You understand character limits and thread formatting."

**User template:**
```
Write a Twitter/X post based on the following article section.

**Article:** {{article_title}}
**Section Heading:** {{h2_title}}
**Section Content:**
{{h2_content}}

**Article URL:** {{article_url}}
**Keywords:** {{keywords}}

GUIDELINES:
- Write a single tweet (max 280 characters including the URL)
- Make the first few words attention-grabbing
- Include the article URL
- Use 1-3 relevant hashtags (count toward character limit)
- Be concise and impactful — every word must earn its place
- Use an emoji or two if it adds value
- Optimize for retweets and clicks

Return ONLY the tweet text, ready to publish.
```

#### Threads

**System:** "You are a social media copywriter specializing in Threads posts. You write conversational, authentic content that feels native to the Threads platform. Your posts encourage replies and meaningful discussion."

**User template:**
```
Write a Threads post based on the following article section.

**Article:** {{article_title}}
**Section Heading:** {{h2_title}}
**Section Content:**
{{h2_content}}

**Article URL:** {{article_url}}
**Keywords:** {{keywords}}

GUIDELINES:
- Write a conversational post (max 500 characters)
- Start with a thought-provoking statement or question
- Keep it casual yet informative
- Include the article URL
- Use 2-3 relevant hashtags maximum
- Focus on starting a conversation
- Threads is more casual than LinkedIn — write accordingly
- Avoid excessive emojis (1-2 max)

Return ONLY the post text, ready to publish.
```

#### Telegram

**System:** "You are a content writer specializing in Telegram channel posts. You write informative, well-structured posts that provide value to channel subscribers. Your posts use Telegram's HTML formatting for visual appeal."

**User template:**
```
Write a Telegram channel post based on the following article section.

**Article:** {{article_title}}
**Section Heading:** {{h2_title}}
**Section Content:**
{{h2_content}}

**Article URL:** {{article_url}}
**Keywords:** {{keywords}}
**Author:** {{author_name}}

GUIDELINES:
- Write a well-structured post (200-400 words)
- Use HTML formatting: <b>bold</b>, <i>italic</i>, <a href="url">links</a>
- Start with an engaging headline using <b> tags
- Use line breaks (\n) to separate paragraphs and sections
- Break content into clear sections with line breaks between paragraphs
- Include the article URL as a clickable <a> link
- Add relevant emojis as bullet points or section markers
- End with a call-to-action
- If this post will have a photo, keep the first paragraph under 1,024 characters

CRITICAL: Return ONLY the post HTML text with line breaks. Do NOT wrap in code fences. Output raw HTML.
```

### 8.2 Carousel Content Plan (`carousel_content_plan`)

**System prompt:** Instructs the model to create a carousel plan as strict JSON with `caption`, `styleGuide` (palette, mood, photographyStyle), and `slides[]` (each with index, type, headlineText ≤8 words, bodyText ≤50 words / null, imagePrompt).

**Rules:**
- Slide 1: `hook` type — bold attention-grabbing headline
- Middle slides: `content` type — one key point per slide, 2-3 bullet points separated by `\n` in bodyText
- Last slide: `cta` type — call to action
- Image prompts: Detailed photographic descriptions including the style guide in every prompt

**User template:**
```
Create an educational carousel with {{slide_count}} slides about:

TOPIC: {{topic}}
DETAILS: {{details}}
URL TO PROMOTE (if any): {{article_url}}
SPECIAL INSTRUCTIONS (if any): {{special_instructions}}

Return ONLY valid JSON, no markdown code fences, no extra text.
```

### 8.3 Twitter Carousel Plan (`carousel_content_plan_twitter`)

Same structure as carousel but always exactly 4 slides, caption max 280 characters.

### 8.4 Story Content Plan (`story_content_plan`)

**System prompt:** Instructs model to create 6-slide story plan as strict JSON. Slide 1 is `hook` (headline only). Slides 2–6 have exactly 24 words in `bodyText`. Each slide has an `imagePrompt` for 9:16 (vertical) photography. Caption included. Style guide defines the visual tone.

**User template:**
```
Create a 6-slide story post about:

TOPIC: {{topic}}
DETAILS: {{details}}
URL: {{article_url}}
SPECIAL INSTRUCTIONS: {{special_instructions}}

Return ONLY valid JSON.
```

### 8.5 Quote Video (`quote_video_content`)

Instructs LLM to generate quote slide texts — short, impactful quotes from the article section, formatted for text-over-video rendering.

### 8.6 Brand Config (`carousel_brand_config`)

Special prompt entry that stores brand configuration as JSON in `variables`:

```json
{
  "primaryColor": "#002442",
  "secondaryColor": "#D9017A",
  "headlineGradient": "linear-gradient(135deg, #002442, #00456e)",
  "contentGradient": "linear-gradient(135deg, #0a1f3e, #003060)",
  "ctaGradient": "linear-gradient(135deg, #D9017A, #ff4499)",
  "headlineFontFamily": "Arial, sans-serif",
  "bodyFontFamily": "Arial, sans-serif",
  "watermarkText": "@brand",
  "brandName": "Brand Name",
  "logoUrl": "https://cdn.example.com/logo.png",
  "lightLogoUrl": "https://cdn.example.com/logo-light.png",
  "showVerifiedBadge": true,
  "napkinStyleId": "napkin-style-id"
}
```

This is loaded by `loadBrandSettings()` in `lib/social-media/brand-config-loader.ts` and used by all compositors.

---

## 9. Background Processing (Cron Jobs)

### 9.1 Social Publish Cron

**Route:** `POST /api/cron/social-publish`  
**Schedule:** Every 1 minute  
**Auth:** `Authorization: Bearer {CRON_SECRET}`

**Entry:** `runSocialPublishCronJob()` in `lib/cron/run-social-publish.ts`

Flow:
1. Check `SocialMediaSettings.schedulingPaused` → if true, skip entirely
2. Call `processScheduledPosts()` in `lib/social-media/posting-dispatcher.ts`

**Poll query:**
```typescript
prisma.socialPost.findMany({
  where: {
    status: 'scheduled',
    scheduledAt: { lte: new Date(now + 2 * 60 * 1000) },  // 2-minute lookahead buffer
    accountId: { not: null },
  },
  orderBy: { scheduledAt: 'asc' },
  take: 20,
})
```

**Atomic claim** (prevents double-publish):
```typescript
prisma.socialPost.updateMany({
  where: { id: post.id, status: 'scheduled' },
  data: { status: 'posting' },
})
// Only proceed if update count === 1
```

**State transitions:**
- `scheduled` → `posting` (atomic claim)
- `posting` → `posted` (on success, sets `platformPostId`, `platformPostUrl`, `postedAt`)
- `posting` → `failed` (after exhausting retries, sets `errorMessage`)

**Story routing:**
- `post.postAsStory === true` OR (`postType === 'story' && storyVideoUrl`) → route to story-specific API (photo_stories / video_stories for FB/IG)
- Otherwise: standard feed post

**Retry logic:** 3 attempts with exponential backoff (2s, 4s, 8s). `isNonRetryableError()` detects 401/403/permission/content policy errors and skips retries immediately.

**Failure alerts:** `checkAndAlertConsecutiveFailures()` — if ≥3 failures on same account in 24h → email via Resend.

### 9.2 Social Content Process Cron (Safety Net)

**Route:** `POST /api/cron/social-content-process`  
**Schedule:** Every 1 minute

Restarts stalled automation jobs:
- `status: 'processing'` AND `updatedAt < now - 15min` → reset to `pending`, restart
- `status: 'pending'` AND `createdAt < now - 5min` → restart

### 9.3 Token Refresh Cron

**Route:** `POST /api/cron/token-refresh`  
**Schedule:** Every 30 minutes

- Twitter: refreshes access tokens expiring within 5 minutes
- Facebook/Instagram: checks token debug endpoint; marks `expired` if expiry ≤ 7 days
- Sends connection alert emails on persistent failures

### 9.4 Cron Setup Script (`scripts/setup-cron.sh`)

Run on the DigitalOcean backend server to install the crontab:

```bash
./scripts/setup-cron.sh
```

Installs this cron block (replacing any existing `BEGIN_BLITZKRIEG_CRON` block):

```
*/1 * * * * curl -sf -X POST http://127.0.0.1:3000/api/cron/publish-articles ...
*/1 * * * * curl -sf -X POST http://127.0.0.1:3000/api/cron/lead-gen-process ...
*/5 * * * * curl -sf -X POST http://127.0.0.1:3000/api/cron/social-publish ...
*/30 * * * * curl -sf -X POST http://127.0.0.1:3000/api/cron/token-refresh ...
0 9 * * 1 curl -sf -X POST http://127.0.0.1:3000/api/cron/weekly-digest ...
```

Logs: `/var/log/blitzkrieg-cron.log`

---

## 10. Image & Video Generation Pipeline

### 10.1 AI Image Generation (fal.ai)

**Route:** `POST /api/social-media/posts/generate-image`

```typescript
// Request
{ prompt: string, model?: string, width?: number, height?: number }

// Default model
'fal-ai/flux/schnell'

// Response
{ imageUrl: string }  // S3/CDN URL
```

The fal.ai API key is stored in the `ApiKey` table in the DB (provider: `fal-ai`), not in environment variables directly.

### 10.2 AI Video Generation (fal.ai Seedance)

**Route:** `POST /api/social-media/posts/generate-video`

```typescript
// Request
{ prompt: string, model?: string, aspectRatio?: '1:1' | '9:16' | '16:9' }

// Default model
'fal-ai/bytedance/seedance/v1/pro/fast/text-to-video'

// Response (initial)
{ requestId: string }

// Poll status: GET /api/social-media/posts/generate-video/status?requestId=...
{ status: 'pending' | 'processing' | 'completed' | 'failed', videoUrl?: string }
```

`waitForVideoGeneration(requestId)` polls every 5 seconds up to 5 minutes.

### 10.3 Napkin AI (Manual Diagram Only)

**Route:** `POST /api/social-media/posts/generate-diagram`

- Uses `NAPKIN_API_TOKEN` env var
- API: `POST https://api.napkin.ai/v1/visual`
- Style ID from `carousel_brand_config.variables.napkinStyleId`
- Returns light + dark SVG/PNG pair
- **Only used for manual diagram creation** — automation uses the article's pre-generated SVG

### 10.4 ElevenLabs Voiceover

Used in `story` and `quote_video` post types when voiceover is enabled:

```typescript
// Config from SocialMediaSettings
voiceoverEnabled: boolean
voiceoverSpeed: number (0.5–2.0)
storyVoiceId: string      // ElevenLabs voice ID for stories
quoteVideoVoiceId: string // ElevenLabs voice ID for quote videos

// Env vars
ELEVENLABS_API_KEY
ELEVENLABS_VOICE_ID  // fallback default voice ID
```

Audio: `POST https://api.elevenlabs.io/v1/text-to-speech/{voiceId}` → MP3 → merged with video frames via FFmpeg.

### 10.5 S3/CDN Storage

All generated assets (images, videos) are uploaded to S3 and served via CloudFront:

```
ENVIRONMENT VARIABLES:
AWS_REGION
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_S3_BUCKET
CLOUDFRONT_DISTRIBUTION_URL  (or CLOUDFRONT_URL)
```

Upload function: `PutObjectCommand` with `ContentType`, `CacheControl: 'public, max-age=31536000'`.

CDN URL: `${CLOUDFRONT_DISTRIBUTION_URL}/${key}`

---

## 11. Brand & Style Configuration

### 11.1 BrandConfig (`lib/social-media/brand-config-types.ts`)

```typescript
interface BrandConfig {
  primaryColor: string           // e.g. "#002442" — used for slide backgrounds
  secondaryColor: string         // e.g. "#D9017A" — CTA slides, accents
  headlineGradient: string       // CSS gradient for hook/headline slides
  contentGradient: string        // CSS gradient for content slides
  ctaGradient: string            // CSS gradient for CTA slides
  hookGradient: string           // Gradient for hook slides with video
  headlineFontFamily: string     // Font for headlines
  bodyFontFamily: string         // Font for body text
  headlineFontSize: number       // px
  bodyFontSize: number           // px
  watermarkText: string          // e.g. "@handle"
  brandName: string
  logoUrl: string                // Dark/colored logo
  lightLogoUrl: string           // Light/white logo (for dark backgrounds)
  showVerifiedBadge: boolean
  napkinStyleId: string          // Napkin AI style ID for manual diagrams
}
```

### 11.2 Loading Brand Config

```typescript
// lib/social-media/brand-config-loader.ts
async function loadBrandSettings(): Promise<BrandConfig>
```

Reads `SocialMediaPrompt` where `platform = 'carousel_brand_config'`, parses `variables` JSON, merges with `DEFAULT_BRAND_CONFIG` defaults.

Used by: carousel compositor, story compositor, quote card compositor, Twitter slide compositor, diagram wrapper.

---

## 12. Error Handling & Notifications

### 12.1 Post Failure Flow

1. Publishing attempt fails → retry up to 3 times with exponential backoff
2. Non-retryable errors (auth/permission/content policy): immediate `failed` status
3. `post.status = 'failed'`, `post.errorMessage = error.message`
4. Logs to `ErrorLog` table (`source: 'social_media'`) via `logErrorToDb()`

### 12.2 Consecutive Failure Alerts

After each publish failure, `checkAndAlertConsecutiveFailures(accountId)` checks:
- Count failures for this account in the last 24 hours
- If ≥3: send email via Resend (`lib/social-media/failure-alert-service.ts`)

Email: `from: RESEND_FROM_EMAIL`, `to: ADMIN_EMAIL`, subject: "Social media post failures for {platform}"

### 12.3 Automation Summary Email

After `processAutomationJob()` completes with any failures:

```typescript
sendAutomationSummaryEmail({
  sitePageId,
  completedSpecs,
  failedSpecs,
  failures: AutomationFailureDetail[]  // [{ specId, postType, error }]
})
```

### 12.4 Connection Alert Emails

`sendConnectionAlerts()` — sent when token refresh fails repeatedly. Lists accounts that need reconnection.

### 12.5 Cron Failure Alerts

`sendCronFailureAlert()` — sent when the `social-publish` or `token-refresh` cron throws an unhandled error.

---

## 13. All Environment Variables (Social Media)

```bash
# Core
ENCRYPTION_KEY                    # AES-256-GCM key for token encryption
CRON_SECRET                       # Auth for cron endpoints + internal API calls
PORT                              # App port (default 3000) — internal API base URL
NEXT_PUBLIC_APP_URL               # Base URL for OAuth redirects + email links

# Platform OAuth
LINKEDIN_COMPANY_CLIENT_ID
LINKEDIN_COMPANY_CLIENT_SECRET
LINKEDIN_COMPANY_REDIRECT_URI
LINKEDIN_CLIENT_ID                # Personal LinkedIn (optional)
LINKEDIN_CLIENT_SECRET
LINKEDIN_REDIRECT_URI
FACEBOOK_CLIENT_ID
FACEBOOK_CLIENT_SECRET
FACEBOOK_REDIRECT_URI
INSTAGRAM_CLIENT_ID               # Optional; falls back to FACEBOOK_CLIENT_ID
INSTAGRAM_CLIENT_SECRET
INSTAGRAM_REDIRECT_URI
TWITTER_CLIENT_ID
TWITTER_CLIENT_SECRET
TWITTER_REDIRECT_URI
THREADS_CLIENT_ID
THREADS_CLIENT_SECRET
THREADS_REDIRECT_URI

# Media Storage
AWS_REGION
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_S3_BUCKET
CLOUDFRONT_DISTRIBUTION_URL       # or CLOUDFRONT_URL
CLOUDFLARE_DISTRIBUTION_URL       # Optional alternative CDN

# AI Services
NAPKIN_API_TOKEN                  # Manual diagram generation via Napkin AI
ELEVENLABS_API_KEY                # Voiceover for story/quote videos
ELEVENLABS_VOICE_ID               # Default fallback voice ID

# Email (notifications/alerts)
RESEND_API_KEY
RESEND_FROM_EMAIL                 # Sender address
ADMIN_EMAIL                       # Recipient for failure alerts

# Other
DUB_API_KEY                       # Link shortening (mgdr.cc) for post URLs
VIDEO_REEL_USE_SCALE_FALLBACK    # "true" enables alternative video scaling

# LLM API keys are stored in the ApiKey DB table (not env vars), one row per provider:
# openai, anthropic, gemini, fal-ai
```

---

## 14. Key File Index

```
Platform OAuth
├── lib/social-media/oauth/index.ts          Auth URL builders per platform
├── lib/social-media/oauth/config.ts         Env var mapping + scopes
├── lib/social-media/oauth/state.ts          JWT state generation + verification
├── lib/social-media/oauth/encryption.ts     AES-256-GCM encrypt/decrypt
├── app/api/social/[platform]/route.ts       OAuth initiation route
└── app/api/social/[platform]/callback/route.ts  OAuth callback route

Account Management
├── lib/social-media/account-service.ts      CRUD for SocialMediaAccount
└── lib/social-media/x-client.ts            Twitter token refresh client

Publishing
├── lib/social-media/posting-dispatcher.ts   Cron publish orchestrator
├── lib/social-media/posting/linkedin.ts     LinkedIn publisher
├── lib/social-media/posting/facebook.ts     Facebook publisher
├── lib/social-media/posting/instagram.ts    Instagram publisher
├── lib/social-media/posting/twitter.ts      Twitter publisher
├── lib/social-media/posting/threads.ts      Threads publisher
├── lib/social-media/posting/telegram.ts     Telegram publisher
└── lib/social-media/posting/fetch-retry.ts  HTTP retry wrapper

Automation Engine
├── lib/social-media/article-content-automation.ts  18-post engine + specs
├── lib/social-media/article-content-parser.ts       Parse article for automation
├── lib/social-media/internal-api.ts                 Internal HTTP client
└── lib/social-media/token-refresh-service.ts        Token refresh + alerts

Image/Video Generation
├── lib/social-media/carousel-compositor.ts          Carousel slides (1024×1024)
├── lib/social-media/twitter-carousel-compositor.ts  Twitter carousel (1024×1024)
├── lib/social-media/story-compositor.ts             Story video (1080×1920)
├── lib/social-media/video-compositor.ts             Video reel compositor
├── lib/social-media/quote-card-compositor.ts        Quote cards
├── lib/social-media/diagram-inverter.ts             SVG→dark diagram
├── lib/napkin/diagram-service.ts                    Napkin AI integration
└── lib/social-media/brand-config-loader.ts          Brand config from DB

Cron Routes
├── app/api/cron/social-publish/route.ts             Publish scheduler
├── app/api/cron/social-content-process/route.ts     Automation safety net
├── app/api/cron/token-refresh/route.ts              Token refresh
└── lib/cron/run-social-publish.ts                   Publish cron logic

Generation API Routes
├── app/api/social-media/posts/generate-manual/      Caption generation
├── app/api/social-media/posts/generate-image/       fal.ai image generation
├── app/api/social-media/posts/generate-video/       fal.ai video generation
├── app/api/social-media/posts/generate-diagram/     Napkin diagram
├── app/api/social-media/posts/generate-carousel-plan/   Carousel plan LLM
├── app/api/social-media/posts/generate-story-plan/      Story plan LLM
├── app/api/social-media/posts/generate-quote-content/   Quote content LLM
├── app/api/social-media/posts/generate-video-content/   Video content LLM
├── app/api/social-media/posts/composite-slide/      Carousel compositor API
├── app/api/social-media/posts/composite-story/      Story compositor API
├── app/api/social-media/posts/composite-video/      Video compositor API
├── app/api/social-media/posts/composite-quote-card/ Quote card compositor API
└── app/api/social-media/posts/composite-twitter-slide/ Twitter compositor API

Database Seeds & Scripts
├── scripts/seed-social-media.ts        Seed default prompts + templates
├── scripts/setup-cron.sh               Install crontab on backend server
└── scripts/fix-lead-gen-capture.ts     One-off DB fix utility

Admin UI
├── app/app/social-media/create/        Manual post creator
├── app/app/social-media/calendar/      Post calendar + management
├── app/app/social-media/settings/      Automation + voiceover settings
├── app/app/social-media/audio-library/ Story background audio
├── app/app/social-media/video-hooks-library/  Hook clips
└── app/admin/social-media/             Prompt + template editors
```

---

## 15. Adding a New Platform (Extension Guide)

To add a 7th platform (e.g. YouTube, TikTok):

1. **OAuth flow:**
   - Add platform name to `SocialPlatform` type in `lib/social-media/types.ts`
   - Add env vars to `lib/social-media/oauth/config.ts` (scopes, client ID, secret, redirect URI)
   - Implement `get{Platform}AuthUrl()` in `lib/social-media/oauth/index.ts`
   - Create `app/api/social/{platform}/route.ts` and `callback/route.ts`

2. **Publishing client:**
   - Create `lib/social-media/posting/{platform}.ts` with `postTo{Platform}(post, account)` function
   - Export from `lib/social-media/posting/index.ts`
   - Add routing in `lib/social-media/posting-dispatcher.ts`

3. **Caption prompt:**
   - Add a new `SocialMediaPrompt` record (via seed script or admin UI) with `platform = 'newplatform'`

4. **Automation engine:**
   - Add to `STORY_PLATFORMS` if it supports stories
   - Decide if it's a `story_platforms` or `all_platforms` target per spec
   - The 18 specs themselves don't need to change — just the platform routing in `targetPlatforms`

5. **Database:**
   - No schema changes needed — `platform` fields are plain strings
   - Add platform to `SocialMediaAccount` `@@unique` consideration if needed

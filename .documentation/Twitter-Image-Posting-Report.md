# Twitter/X Image Posting — Detailed Implementation Report

**Last Updated:** February 8, 2026  
**Primary Source File:** `src/lib/twitterApi.ts`  
**Supporting Files:** `src/lib/supabase.ts`, `src/app/api/posts/publish/route.ts`, `prisma/schema.prisma`

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [End-to-End Flow](#2-end-to-end-flow)
3. [OAuth Authentication & Token Management](#3-oauth-authentication--token-management)
4. [Image Download from Supabase Storage](#4-image-download-from-supabase-storage)
5. [Image Upload to Twitter API](#5-image-upload-to-twitter-api)
6. [Tweet Posting with Media Attachment](#6-tweet-posting-with-media-attachment)
7. [Thread Posting with Images](#7-thread-posting-with-images)
8. [Rate Limiting System](#8-rate-limiting-system)
9. [Error Handling & Fallback Logic](#9-error-handling--fallback-logic)
10. [Tweet Verification](#10-tweet-verification)
11. [Database Schema](#11-database-schema)
12. [Environment Variables & Configuration](#12-environment-variables--configuration)
13. [Known Limitations & Edge Cases](#13-known-limitations--edge-cases)

---

## 1. Architecture Overview

The Twitter image posting system is built across several layers:

```
User Dashboard → Publish API Route → twitterApi.ts → Twitter API v2
                                          ↓
                                    supabase.ts (image download)
                                          ↓
                                    Supabase Storage (hosted images)
```

**Key files and their responsibilities:**

| File | Responsibility |
|------|---------------|
| `src/app/api/posts/publish/route.ts` | Entry point — routes publish requests to the correct platform handler |
| `src/lib/twitterApi.ts` | Core Twitter API library — image upload, tweet posting, token refresh, rate limiting, thread posting, tweet verification |
| `src/lib/supabase.ts` | Downloads images from Supabase Storage into a `Buffer` for upload |
| `src/lib/socialConnections.ts` | Retrieves and decrypts stored OAuth tokens from the database |
| `src/lib/encryption.ts` | Encrypts/decrypts access and refresh tokens (Base64 encoding) |
| `prisma/schema.prisma` | Database models for `SocialConnection`, `Post`, `TwitterApiRequest`, `Draft` |

---

## 2. End-to-End Flow

When a user publishes a tweet with an image, the following sequence executes:

### Step 1: Publish API receives the request

The frontend calls `POST /api/posts/publish` with:
- `platform: "twitter"`
- `content: "Tweet text..."` (string for single tweet, or `string[]` for a thread)
- `imageUrl: "https://...supabase.co/storage/v1/..."` (Supabase Storage URL)

### Step 2: Route dispatches to Twitter handler

```typescript
// src/app/api/posts/publish/route.ts
if (platform === 'twitter') {
  if (Array.isArray(content)) {
    // Thread — image only attached to first tweet
    const threadResult = await postTwitterThread(user.id, content, imageUrl)
  } else {
    // Single tweet
    const tweetResult = await postToTwitter(user.id, content, undefined, imageUrl)
  }
}
```

### Step 3: Token validation & proactive refresh

Before any API call, the system:
1. Retrieves the encrypted OAuth connection from the database
2. Decrypts the access token
3. Checks if the token is expired or expiring within 30 minutes
4. If needed, refreshes the token using the refresh token (Basic Auth with client credentials)
5. Updates the database with the new tokens and expiry

### Step 4: Rate limit pre-check

Before posting, the system queries the `TwitterApiRequest` database table to count requests in the last 24 hours. If the count exceeds the Free tier limit (17 requests), the post is rejected with a detailed error message including the estimated reset time.

### Step 5: Image download from Supabase

The image is downloaded from its Supabase Storage public URL into a `Buffer`:

```typescript
// src/lib/supabase.ts
const response = await fetch(imageUrl)
const arrayBuffer = await response.arrayBuffer()
return Buffer.from(arrayBuffer)
```

### Step 6: Image upload to Twitter

The image buffer is converted to a `Blob`, wrapped in `FormData` with `media_category: "tweet_image"`, and uploaded to the Twitter v2 media endpoint:

```
POST https://api.twitter.com/2/media/upload
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

FormData:
  - media: [binary image data] (as "image.jpg")
  - media_category: "tweet_image"
```

Twitter returns a `media_id` (extracted from `response.data.id`).

### Step 7: Tweet creation with media

The tweet is posted with the media ID attached:

```
POST https://api.twitter.com/2/tweets
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "text": "Tweet content...",
  "media": {
    "media_ids": ["1234567890"]
  }
}
```

### Step 8: Post-publish verification

After posting, the system:
1. Logs the API request in `TwitterApiRequest` (status code, success/failure)
2. Constructs the tweet URL: `https://twitter.com/{username}/status/{tweetId}`
3. Returns the URL and tweet ID to the publish route
4. The publish route stores the result in the `Post` database table

---

## 3. OAuth Authentication & Token Management

### Initial OAuth Flow

Twitter uses OAuth 2.0 with PKCE (Proof Key for Code Exchange).

**Scopes requested during authorization:**

```
tweet.read tweet.write users.read offline.access media.write
```

The `media.write` scope is critical for image uploads.

**OAuth initiation (`src/app/api/social/[platform]/route.ts`):**

1. Generate PKCE code verifier and code challenge (SHA-256, base64url-encoded)
2. Build authorization URL with scopes including `media.write`
3. Store state + code verifier in HTTP-only cookie (`oauth_state_twitter`)
4. Redirect user to `https://twitter.com/i/oauth2/authorize`

**OAuth callback (`src/app/api/social/[platform]/callback/route.ts`):**

1. Verify state token matches cookie
2. Exchange authorization code for tokens using Basic Auth:
   - `Authorization: Basic base64(TWITTER_CLIENT_ID:TWITTER_CLIENT_SECRET)`
   - `grant_type: authorization_code`
   - `code_verifier` from cookie (PKCE)
3. Fetch user profile from `GET https://api.twitter.com/2/users/me`
4. Encrypt and store tokens in `SocialConnection` table

### Proactive Token Refresh

Twitter access tokens expire after ~2 hours. The system refreshes proactively:

```typescript
const shouldRefresh = connection.tokenExpiry && (
  new Date(connection.tokenExpiry) <= new Date() ||                          // Already expired
  new Date(connection.tokenExpiry) <= new Date(Date.now() + 30 * 60 * 1000) // Expiring within 30 minutes
)
```

**Refresh process:**
1. Decrypt the stored refresh token
2. Call `POST https://api.twitter.com/2/oauth2/token` with `grant_type=refresh_token`
3. Twitter returns a new access token AND a new refresh token
4. Encrypt both and update the database
5. Update the token expiry timestamp

**Why proactive refresh matters:** Twitter refresh tokens expire after ~90 days of inactivity. By refreshing 30 minutes before access token expiry, we ensure refresh tokens are regularly used and never expire from inactivity.

**Token refresh is applied before every API operation:**
- `uploadImageToTwitter()` — before image upload
- `postToTwitter()` — before tweet posting
- `verifyTweetExists()` — before tweet verification
- `getTwitterAnalytics()` — before analytics fetch

---

## 4. Image Download from Supabase Storage

**File:** `src/lib/supabase.ts` — `downloadImageFromStorage()`

Images are stored in Supabase Storage and accessed via public URLs. Before uploading to Twitter, the image must be downloaded into memory:

```typescript
export async function downloadImageFromStorage(imageUrl: string): Promise<Buffer> {
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
```

**Key details:**
- Input: Full Supabase Storage public URL (e.g., `https://xxxx.supabase.co/storage/v1/object/public/images/...`)
- Output: Node.js `Buffer` containing raw image binary data
- Error handling: Throws descriptive error if download fails
- No image processing or resizing — raw binary is uploaded as-is

---

## 5. Image Upload to Twitter API

**File:** `src/lib/twitterApi.ts` — `uploadImageToTwitter()`

### Endpoint

```
POST https://api.twitter.com/2/media/upload
```

### Request Construction

```typescript
const formData = new FormData()
const blobSource = imageBuffer instanceof Buffer
  ? Uint8Array.from(imageBuffer)
  : new Uint8Array(imageBuffer)
const blob = new Blob([blobSource], { type: 'image/jpeg' })
formData.append('media', blob, 'image.jpg')
formData.append('media_category', 'tweet_image')  // Required for v2 endpoint
```

**Important details:**
- The `Buffer` is converted to `Uint8Array` then wrapped in a `Blob` with explicit MIME type `image/jpeg`
- The `Content-Type` header is NOT manually set — `fetch()` automatically sets it to `multipart/form-data` with the correct boundary
- `media_category: "tweet_image"` is required by the v2 endpoint to identify the media type
- The filename `"image.jpg"` is passed as the third argument to `formData.append()`

### Response Parsing

Twitter v2 returns the media ID in the `data` object:

```typescript
const mediaId = uploadResult.data?.id       // v2 format (primary)
  || uploadResult.id                         // fallback
  || uploadResult.media_id                   // v1 format fallback
  || uploadResult.media_id_string            // v1 string format fallback
```

The function handles multiple response formats for compatibility.

### Media Specifications

| Property | Limit |
|----------|-------|
| Max file size | 5 MB |
| Supported formats | JPG, PNG, GIF, WebP |
| Max dimensions | 4096 x 4096 pixels |
| Media category | `tweet_image` |

---

## 6. Tweet Posting with Media Attachment

**File:** `src/lib/twitterApi.ts` — `postToTwitter()`

### Function Signature

```typescript
export async function postToTwitter(
  userId: string,
  content: string,
  replyToTweetId?: string,
  imageUrl?: string
): Promise<{ success: true; postUrl: string; tweetId: string } | { success: false; error: string }>
```

### Tweet Payload Construction

```typescript
const tweetData: {
  text: string
  reply?: { in_reply_to_tweet_id: string }
  media?: { media_ids: string[] }
} = {
  text: content,
}

// Add reply context if this is a thread reply
if (replyToTweetId) {
  tweetData.reply = { in_reply_to_tweet_id: replyToTweetId }
}

// Attach uploaded media
if (mediaId) {
  tweetData.media = { media_ids: [mediaId] }
}
```

### API Request

```
POST https://api.twitter.com/2/tweets
Authorization: Bearer {accessToken}
Content-Type: application/json
Accept: application/json
User-Agent: Levercast/1.0

{
  "text": "...",
  "media": { "media_ids": ["..."] }
}
```

### Post-Success Handling

On success, the function:
1. Extracts the `tweetId` from `response.data.id`
2. Constructs the public URL: `https://twitter.com/{username}/status/{tweetId}`
3. Updates the `TwitterApiRequest` record with `success: true` and the HTTP status code
4. Returns `{ success: true, postUrl, tweetId }`

---

## 7. Thread Posting with Images

**File:** `src/lib/twitterApi.ts` — `postTwitterThread()`

### Function Signature

```typescript
export async function postTwitterThread(
  userId: string,
  tweets: string[],
  imageUrl?: string
): Promise<{ success: true; postUrls: string[]; tweetIds: string[] } | { success: false; error: string }>
```

### Thread Logic

1. **First tweet** is posted with the image attachment (if provided) using `postToTwitter(userId, tweets[0], undefined, imageUrl)`
2. **Wait 3 seconds** for Twitter to process the first tweet
3. **Subsequent tweets** are posted as replies to the previous tweet using `postToTwitter(userId, tweets[i], previousTweetId)` — **no image attached to replies**
4. **3-second delay** between each reply to avoid rate limiting
5. If any reply fails, the function returns an error but includes URLs of tweets already posted

**Key design decisions:**
- Image is only attached to the **first tweet** in the thread
- 3-second delays are used instead of verification polling to avoid consuming rate limit quota
- Each reply references the previous tweet's ID via `reply.in_reply_to_tweet_id`
- Thread failures are partial — already-posted tweets remain live

---

## 8. Rate Limiting System

### Pre-Request Database Check

Before every `postToTwitter()` call, the system queries the database:

```typescript
const requestsLast24Hours = await prisma.twitterApiRequest.count({
  where: {
    userId,
    endpoint: 'POST /2/tweets',
    requestedAt: { gte: twentyFourHoursAgo },
  },
})
```

**Tier limits:**
- **Free tier:** 17 requests per 24 hours
- **Basic tier:** 100 requests per 24 hours

If the Free tier limit is exceeded, the function:
1. Finds the oldest request in the 24-hour window
2. Calculates when the rate limit resets (oldest request + 24 hours)
3. Returns a detailed error message with hours/minutes until reset

### Request Logging

Every tweet POST request is logged in the database **before** the API call is made:

```typescript
const requestRecord = await prisma.twitterApiRequest.create({
  data: {
    userId,
    endpoint: 'POST /2/tweets',
    statusCode: null,     // Updated after response
    success: false,        // Updated after response
    errorMessage: null,
  },
})
```

After the API responds, the record is updated with the actual status code, success state, and any error message. This ensures that failed requests are still counted toward rate limits (matching Twitter's behavior).

### 429 Response Handling

When Twitter returns a `429 Too Many Requests`, the system performs sophisticated rate window detection:

1. **Extract headers:** `x-rate-limit-reset`, `x-rate-limit-remaining`, `x-rate-limit-limit`
2. **Check database** for 24-hour request count
3. **Classify the rate limit window:**
   - **24-hour window** — if database count >= 17 (Free tier limit)
   - **15-minute window** — if reset time is within ~15 minutes
   - **3-hour window** — if reset time is within ~3 hours
   - Fallback heuristics based on `remaining` count and reset time range
4. **Generate user-friendly error** with specific wait time and reset timestamp

---

## 9. Error Handling & Fallback Logic

### Layer 1: Image Upload Failure → Fall Back to Text-Only

If the image upload fails for any reason, the system gracefully falls back to posting a text-only tweet:

```typescript
let mediaId: string | undefined
if (imageUrl) {
  try {
    mediaId = await uploadImageToTwitter(userId, imageUrl)
  } catch (error) {
    console.error('[Twitter API] Failed to upload image, falling back to text-only post:', error)
    // Continue with text-only post
  }
}
```

### Layer 2: 403 with Media → Retry Without Media

If Twitter returns `403 Forbidden` when posting a tweet WITH media, the system automatically retries without the media attachment:

```typescript
if (!postResponse.ok && postResponse.status === 403 && mediaId) {
  console.log('[Twitter API] Posting with media failed (403), trying text-only post...')
  const textOnlyData = { text: content }
  postResponse = await fetch(`${TWITTER_API_BASE}/tweets`, { ... body: JSON.stringify(textOnlyData) })
}
```

This handles the edge case where the Free tier may reject tweets with media attachments.

### Layer 3: 401 Unauthorized → Refresh & Retry

If a `401` is received during posting:
1. Refresh the access token using the stored refresh token
2. Update the database with the new tokens
3. Retry the original tweet request with the fresh token
4. If the retry also fails, return a descriptive error suggesting reconnection

### Layer 4: Upload-Specific Error Messages

The upload function provides targeted error messages for common failures:

| HTTP Status | Error Guidance |
|-------------|----------------|
| `404` | Endpoint URL may be incorrect, or `media.write` scope is missing |
| `403` | OAuth token likely missing `media.write` scope — reconnect the account |
| Other | Generic error with full response details |

### Layer 5: 403 on Tweet Post (Detailed Diagnosis)

For `403` errors on tweet posting (not media upload), the system provides a detailed diagnostic message:

```
Twitter API returned 403 Forbidden: "..."

Diagnosis: Your token shows 'read-write' permissions, but tweet posting is still blocked.

Possible causes:
1. Free tier limitation: Free tier may not support posting WITH media
2. Account restrictions or read-only mode
3. Undocumented Free tier restrictions on POST /2/tweets

What we tried:
- ✅ Image upload works (media.write scope confirmed)
- ✅ Token has read-write permissions (x-access-level header confirmed)
- ❌ Tweet posting fails (403 Forbidden)

To fix this:
1. Try posting without an image
2. Upgrade to Basic tier ($100/month)
3. Check account status
4. Contact Twitter Developer Support
```

---

## 10. Tweet Verification

**File:** `src/lib/twitterApi.ts` — `verifyTweetExists()`

After posting, the system can verify a tweet was successfully created:

```typescript
export async function verifyTweetExists(userId: string, tweetId: string): Promise<boolean>
```

**Process:**
1. Retrieve and decrypt the OAuth connection
2. Proactively refresh the token if needed (same 30-minute window)
3. Call `GET https://api.twitter.com/2/tweets/{tweetId}`
4. Return `true` if `response.ok`, `false` otherwise

**Note:** Thread posting relies on 3-second delays rather than verification to conserve rate limit quota.

---

## 11. Database Schema

### `TwitterApiRequest` — Rate Limit Tracking

```prisma
model TwitterApiRequest {
  id           String   @id @default(cuid())
  userId       String
  endpoint     String   // "POST /2/tweets", "POST /2/media/upload"
  statusCode   Int?     // HTTP status (null if request failed before response)
  success      Boolean
  errorMessage String?  @db.Text
  requestedAt  DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, requestedAt])
  @@map("twitter_api_requests")
}
```

### `Post` — Twitter-Specific Fields

```prisma
model Post {
  // ...
  parentPostId  String?  // Thread parent (summary tweet)
  threadOrder   Int?     // 0 = summary, 1+ = replies
  tweetId       String?  // Twitter tweet ID
  imageUrl      String?  // Supabase Storage URL of published image
  // ...

  @@index([tweetId])                // Quick tweet ID lookups
  @@index([draftId, threadOrder])   // Thread ordering
}
```

### `Draft` — Twitter Content Field

```prisma
model Draft {
  // ...
  twitterContent String? @db.Text  // AI-generated Twitter post
  attachedImage  String?           // Supabase Storage URL
  // ...
}
```

### `SocialConnection` — OAuth Token Storage

```prisma
model SocialConnection {
  // ...
  accessToken   String    @db.Text  // Encrypted OAuth access token
  refreshToken  String?   @db.Text  // Encrypted OAuth refresh token
  tokenExpiry   DateTime?           // Access token expiry timestamp
  // ...
}
```

---

## 12. Environment Variables & Configuration

### Required Environment Variables

| Variable | Purpose |
|----------|---------|
| `TWITTER_CLIENT_ID` | OAuth 2.0 Client ID |
| `TWITTER_CLIENT_SECRET` | OAuth 2.0 Client Secret |
| `TWITTER_REDIRECT_URI` | OAuth callback URL (defaults to `${NEXT_PUBLIC_APP_URL}/api/social/twitter/callback`) |

### Internal Constants

| Constant | Value | Location |
|----------|-------|----------|
| `TWITTER_API_BASE` | `https://api.twitter.com/2` | `src/lib/twitterApi.ts` |
| `TWITTER_API_V1_BASE` | `https://api.twitter.com/1.1` | `src/lib/twitterApi.ts` (reserved, unused) |
| `FREE_TIER_24H_LIMIT` | `17` | `src/lib/twitterApi.ts` |
| `BASIC_TIER_24H_LIMIT` | `100` | `src/lib/twitterApi.ts` |
| Character limit (generation) | `270` | `src/app/api/ai/generate/route.ts` (safety buffer) |
| Character limit (display/truncation) | `280` | `src/components/PlatformPreview.tsx` |

---

## 13. Known Limitations & Edge Cases

### Free Tier Restrictions

- **17 POST requests per 24 hours** (rolling window, includes failed attempts)
- Free tier *may* reject tweets with media attachments (403) — the system automatically retries without media
- Media upload endpoint (`/2/media/upload`) itself works on Free tier; the restriction appears when posting the tweet with the media ID

### Image Handling

- Images are always uploaded as `image/jpeg` regardless of actual format — this works for JPG/PNG but may cause issues with GIF animations
- No image resizing or compression is performed — images exceeding 5 MB will fail
- No image dimension validation — images exceeding 4096x4096 pixels will fail
- The filename is always `"image.jpg"` — Twitter ignores this, but it's not ideal

### Token Management

- If both the access token and refresh token are expired (>90 days of inactivity), the user must reconnect their account
- Token refresh is attempted inline during the publishing flow — if it fails, the entire publish operation fails
- Refresh token rotation: Twitter returns a new refresh token on each refresh. If the database update fails after receiving new tokens, the old refresh token becomes invalid

### Thread Posting

- Images are only attached to the first tweet in a thread
- 3-second delays between tweets mean a 10-tweet thread takes ~30 seconds minimum
- If a mid-thread reply fails, earlier tweets in the thread remain posted (partial thread)
- Each tweet in a thread consumes one rate limit request

### Rate Limiting

- Rate limit tracking only counts `POST /2/tweets` requests — media upload requests are not counted against the 24-hour limit
- The system uses the Free tier limit (17) as the conservative default — users on Basic tier ($100/month) have a higher limit (100) but the system doesn't detect which tier the user is on
- Rate limit windows tracked: 15 minutes, 3 hours, and 24 hours
- Database-based tracking may slightly lag real Twitter rate limits if requests are made outside the application

### Media ID Format

The system handles multiple media ID response formats for compatibility:
- `response.data.id` — Twitter v2 format (primary)
- `response.id` — fallback
- `response.media_id` — Twitter v1 format fallback
- `response.media_id_string` — Twitter v1 string format fallback

---

## Summary

The Twitter image posting implementation is a robust, multi-layered system with:

1. **Proactive token management** — refreshes 30 minutes before expiry to keep refresh tokens alive indefinitely
2. **Graceful degradation** — three fallback layers ensure tweets are posted even when image upload fails
3. **Accurate rate limiting** — database-backed request tracking with detailed user-facing error messages
4. **Thread support** — images attached to the first tweet only, with 3-second inter-tweet delays
5. **Comprehensive error handling** — specific diagnostic messages for 401, 403, 404, and 429 errors
6. **Full audit trail** — every API request logged in `TwitterApiRequest` with status codes and error messages

The primary risk area is the image MIME type hardcoding (`image/jpeg`) and the lack of pre-upload validation for file size and dimensions.

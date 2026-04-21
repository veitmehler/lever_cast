# OAuth Integration & Scopes Report

## Overview

The application supports OAuth 2.0 for 5 social media platforms: LinkedIn (Personal & Company), Twitter/X, Facebook, Instagram, and Threads. Telegram uses Bot API tokens instead of OAuth. All OAuth flows are handled through a unified routing structure at `/api/social/[platform]/route.ts` (initiation) and `/api/social/[platform]/callback/route.ts` (callback).

---

## 1. LinkedIn — Personal Profile

### OAuth Scopes

```
openid profile email w_member_social
```

- **`openid`** — Required for OpenID Connect
- **`profile`** — Basic profile information
- **`email`** — User email address
- **`w_member_social`** — Post to personal profile (requires "Share on LinkedIn" product)

### OAuth Flow

- **Authorization URL:** `https://www.linkedin.com/oauth/v2/authorization`
- **Token Exchange:** `POST https://www.linkedin.com/oauth/v2/accessToken`
- **Profile Fetch:** `GET https://api.linkedin.com/v2/userinfo` (OpenID Connect)

### Environment Variables

- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `LINKEDIN_REDIRECT_URI` (defaults to `${NEXT_PUBLIC_APP_URL}/api/social/linkedin/callback`)

### Token Handling

- **Storage:** Encrypted in SocialConnection table with `appType: 'personal'`
- **Refresh:** Not supported by LinkedIn. Tokens are long-lived but users must reconnect when expired.
- **Encryption:** Base64 encoding via `src/lib/encryption.ts`

### API Endpoints Used

- **Post Content:** `POST https://api.linkedin.com/v2/ugcPosts`
- **Image Upload:** `POST https://api.linkedin.com/v2/assets?action=registerUpload` → PUT binary upload
- **Analytics:** `GET https://api.linkedin.com/v2/ugcPosts/{postId}?fields=id,distribution` (partial implementation)

### Special Considerations

- Requires "Share on LinkedIn" product approval in LinkedIn Developer Portal
- Image upload is multi-step with a 20-second wait after upload
- Known image API issues with automatic fallback to text-only posting

---

## 2. LinkedIn — Company Pages

### OAuth Scopes

```
w_organization_social r_organization_social rw_organization_admin
```

- **`w_organization_social`** — Post to Company Pages
- **`r_organization_social`** — Read organization content and analytics
- **`rw_organization_admin`** — Admin access to organization (read + write)

**Important:** OpenID Connect scopes (`openid`, `profile`, `email`) are not supported by the Community Management API and are excluded from the request.

### OAuth Flow

- **Authorization URL:** `https://www.linkedin.com/oauth/v2/authorization`
- **Token Exchange:** `POST https://www.linkedin.com/oauth/v2/accessToken`
- **Profile Fetch:** Skipped — uses placeholder values ("LinkedIn Company Page") since OpenID Connect is unavailable

### Environment Variables

- `LINKEDIN_COMPANY_CLIENT_ID` (separate app from Personal)
- `LINKEDIN_COMPANY_CLIENT_SECRET`
- `LINKEDIN_COMPANY_REDIRECT_URI` (defaults to same callback path as Personal)

### Token Handling

- **Storage:** Encrypted in SocialConnection table with `appType: 'company'`
- **Refresh:** Not supported. Users must reconnect when expired.
- **Unique Constraint:** `userId_platform_appType` allows both personal and company connections to coexist

### Page Fetching

**Endpoint:** `GET https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED&projection=(elements*(organizationalTarget~(id,name,vanityName)))`

- When rate-limited, LinkedIn returns `organizationalTarget` as a string URN instead of an object
- Code extracts organization IDs from URN format: `urn:li:organization:(\d+)`
- Individual organization names fetched via `GET https://api.linkedin.com/v2/organizations/{orgId}`
- Name extraction handles LinkedIn's localized name format: `{ localized: { en_US: '...' }, preferredLocale: {...} }`

### Special Considerations

- Requires separate LinkedIn app with "Community Management API" product approval
- Requires business verification (can take several weeks)
- Target type (personal vs company) stored in OAuth state cookie to route callbacks correctly
- Both LinkedIn apps share the same callback URL path

---

## 3. Twitter/X

### OAuth Scopes

```
tweet.read tweet.write users.read offline.access media.write
```

- **`tweet.read`** — Read tweets
- **`tweet.write`** — Create tweets
- **`users.read`** — Read user profile
- **`offline.access`** — Obtain refresh tokens
- **`media.write`** — Upload media (images)

### OAuth Flow

- **Authorization URL:** `https://twitter.com/i/oauth2/authorize`
- **Token Exchange:** `POST https://api.twitter.com/2/oauth2/token`
- **Authentication:** Basic Auth with `base64(TWITTER_CLIENT_ID:TWITTER_CLIENT_SECRET)`
- **PKCE:** Implemented with `code_challenge_method: S256`

### Environment Variables

- `TWITTER_CLIENT_ID`
- `TWITTER_CLIENT_SECRET`
- `TWITTER_REDIRECT_URI` (defaults to `${NEXT_PUBLIC_APP_URL}/api/social/twitter/callback`)

### Token Handling

- **Storage:** Encrypted in SocialConnection table
- **Access Token Expiry:** ~2 hours
- **Refresh:** Implemented in `refreshTwitterToken()` in `src/lib/twitterApi.ts`
  - Proactive refresh: triggers 30 minutes before expiry
  - Endpoint: `POST https://api.twitter.com/2/oauth2/token` with `grant_type=refresh_token`
  - New refresh tokens returned on each refresh
  - Refresh tokens expire after ~90 days of inactivity

### API Endpoints Used

- **Post Tweet:** `POST https://api.twitter.com/2/tweets`
- **Image Upload:** `POST https://api.twitter.com/2/media/upload` (FormData)
- **Analytics:** `GET https://api.twitter.com/2/tweets/{tweetId}?tweet.fields=public_metrics,non_public_metrics`
- **Thread Support:** Multiple tweets posted as replies with 3-second delays

### Rate Limiting

- Tracked in database via `TwitterApiRequest` model
- **Free tier:** 17 requests per 24 hours
- **Basic tier:** 100 requests per 24 hours
- Tracks 15-minute, 3-hour, and 24-hour windows
- Logs all API request attempts (not just successes)

### Special Considerations

- Only platform with full token refresh implementation
- Free tier may not support tweets with media (403 error, falls back to text-only)
- Thread posting adds `reply: { in_reply_to_tweet_id }` for replies
- Tweet existence verified with `verifyTweetExists()` after posting

---

## 4. Facebook

### OAuth Scopes

```
public_profile,business_management,pages_show_list,pages_manage_posts,pages_read_engagement
```

- **`public_profile`** — Basic profile information
- **`business_management`** — Manage business assets
- **`pages_show_list`** — List Pages the user manages
- **`pages_manage_posts`** — Create and manage Page posts
- **`pages_read_engagement`** — Read engagement data

### OAuth Flow

- **Authorization URL:** `https://www.facebook.com/v24.0/dialog/oauth`
- **Token Exchange:** `GET https://graph.facebook.com/v24.0/oauth/access_token`
- **Long-Lived Token Exchange:** Short-lived token (1 hour) automatically exchanged for long-lived token (60 days) via `grant_type=fb_exchange_token`

### Environment Variables

- `FACEBOOK_CLIENT_ID`
- `FACEBOOK_CLIENT_SECRET`
- `FACEBOOK_REDIRECT_URI` (defaults to `${NEXT_PUBLIC_APP_URL}/api/social/facebook/callback`)

### Token Handling

- **Storage:** Encrypted in SocialConnection table
- **Token Lifetime:** 60 days (long-lived token)
- **Refresh:** Not implemented. Users must reconnect after 60 days.

### API Endpoints Used

- **Post Content:** `POST https://graph.facebook.com/v24.0/{pageId}/feed`
- **Image Upload:** `POST https://graph.facebook.com/v24.0/{pageId}/photos` (uploaded unpublished, then attached)
- **Pages List:** `GET https://graph.facebook.com/v24.0/me/accounts`

### Special Considerations

- Posts to Facebook Pages only (not personal profiles)
- Permissions may require App Review for production
- Rate limit detection for code 4 (`is_transient: true`)
- Page access tokens obtained from `/me/accounts` response

---

## 5. Instagram

### OAuth Scopes

```
pages_show_list,pages_read_engagement,instagram_content_publish,instagram_basic,business_management
```

- **`pages_show_list`** — List Pages (Instagram uses Facebook Pages)
- **`pages_read_engagement`** — Read engagement data
- **`instagram_content_publish`** — Publish content to Instagram
- **`instagram_basic`** — Basic Instagram account access
- **`business_management`** — Manage business assets

### OAuth Flow

- **Authorization URL:** `https://www.facebook.com/v24.0/dialog/oauth` (same as Facebook)
- **Token Exchange:** `GET https://graph.facebook.com/v24.0/oauth/access_token`
- **Long-Lived Token Exchange:** Same as Facebook (60-day tokens)

### Environment Variables

- `INSTAGRAM_CLIENT_ID` (falls back to `FACEBOOK_CLIENT_ID`)
- `INSTAGRAM_CLIENT_SECRET` (falls back to `FACEBOOK_CLIENT_SECRET`)
- `INSTAGRAM_REDIRECT_URI` (defaults to `${NEXT_PUBLIC_APP_URL}/api/social/instagram/callback`)

### Token Handling

- **Storage:** Page access token in `accessToken`, user access token in `refreshToken` field
- **Token Lifetime:** 60 days (long-lived token)
- **Refresh:** Not implemented

### API Endpoints Used

- **Create Container:** `POST https://graph.facebook.com/v24.0/{igAccountId}/media`
- **Publish:** `POST https://graph.facebook.com/v24.0/{igAccountId}/media_publish`
- **Image Upload:** Via Facebook Page → Instagram container → publish

### Special Considerations

- Requires Instagram Business Account linked to a Facebook Page
- Uses Facebook OAuth flow (not Instagram's own)
- Requires Tech Provider status + Business Verification + Advanced Access approval for production
- Instagram account ID found via `debug_token` endpoint or granular scopes
- Username fetched asynchronously after connection if not immediately available
- `refreshToken` field stores user access token (not a refresh token)

---

## 6. Threads

### OAuth Scopes

```
threads_basic,threads_content_publish
```

- **`threads_basic`** — Basic Threads account access
- **`threads_content_publish`** — Publish content to Threads

### OAuth Flow

- **Authorization URL:** `https://threads.net/oauth/authorize` (separate domain from Facebook)
- **Token Exchange:** `POST https://graph.threads.net/oauth/access_token`
- **Profile Fetch:** `GET https://graph.threads.net/v1.0/me?fields=id,username`

### Environment Variables

- `THREADS_CLIENT_ID` (separate from Facebook — cannot reuse Facebook Client ID)
- `THREADS_CLIENT_SECRET` (separate from Facebook)
- `THREADS_REDIRECT_URI` (must be HTTPS, even for local development)

### Token Handling

- **Storage:** Encrypted in SocialConnection table
- **Refresh:** Not implemented

### API Endpoints Used

- **Create Container:** `POST https://graph.threads.net/v1.0/me/threads`
- **Publish:** `POST https://graph.threads.net/v1.0/me/threads_publish`

### Special Considerations

- Requires HTTPS redirect URI (use ngrok for local development)
- Uses separate domain: `threads.net` for OAuth, `graph.threads.net` for API
- Requires separate Client ID/Secret from Facebook app
- Test users must accept invitation in Threads mobile app
- Callback URL must be added in 3 places in Meta App Dashboard

---

## 7. Telegram (Bot API — Not OAuth)

### Authentication

- Uses Bot API tokens (not OAuth)
- Token obtained from @BotFather
- Stored in `ApiKey` table (not SocialConnection) with `provider: 'telegram'`

### Environment Variables

- None required — bot token stored in database via Settings page

### API Endpoints Used

- **Send Message:** `POST https://api.telegram.org/bot{token}/sendMessage`
- **Send Photo:** `POST https://api.telegram.org/bot{token}/sendPhoto`

### Special Considerations

- Bot must be admin of target channel
- Channel ID can be `@channelname` or numeric ID
- Default channel ID stored in user settings (`telegramChatId`)
- Supports HTML formatting (`parse_mode: 'HTML'`)
- Photo captions limited to 1,024 characters

---

## Common Infrastructure

### OAuth State Management (`src/lib/oauth.ts`)

- In-memory Map storage (consider Redis for production)
- State tokens: cryptographically secure random bytes
- Expiration: 10 minutes
- Stores PKCE code verifier (Twitter) and target type (LinkedIn)
- Functions: `generateOAuthState()`, `verifyOAuthState()`

### Token Encryption (`src/lib/encryption.ts`)

- Current implementation: Base64 encoding
- Functions: `encrypt()`, `decrypt()`, `maskApiKey()`
- **Note:** Should be upgraded to AES-256-GCM for production (environment variable `ENCRYPTION_KEY` reserved)

### Social Connections (`src/lib/socialConnections.ts`)

- `getSocialConnection(userId, platform, appType?)` — retrieves and decrypts connection
- `isTokenExpiringSoon(tokenExpiry)` — checks if token expires within 5 minutes

### Database Schema (SocialConnection model)

- Unique constraint: `userId_platform_appType` (allows LinkedIn personal + company)
- Fields: `accessToken`, `refreshToken`, `tokenExpiry`, `platformUserId`, `platformUsername`, `postTargetType`, `selectedPageId`, `appType`, `isActive`

---

## Token Refresh Summary

| Platform | Refresh Mechanism | Implementation Status | Token Lifetime |
|----------|-------------------|----------------------|----------------|
| LinkedIn Personal | Not supported | N/A | Long-lived (months) |
| LinkedIn Company | Not supported | N/A | Long-lived (months) |
| Twitter/X | Refresh token | Fully implemented | 2 hours (access), ~90 days inactive (refresh) |
| Facebook | Token exchange | Partial (initial only) | 60 days |
| Instagram | Token exchange | Partial (initial only) | 60 days |
| Threads | Not implemented | N/A | Unknown |
| Telegram | N/A (Bot token) | N/A | Permanent |

---

## Environment Variables Summary

| Platform | Client ID | Client Secret | Redirect URI |
|----------|-----------|---------------|--------------|
| LinkedIn Personal | `LINKEDIN_CLIENT_ID` | `LINKEDIN_CLIENT_SECRET` | `LINKEDIN_REDIRECT_URI` |
| LinkedIn Company | `LINKEDIN_COMPANY_CLIENT_ID` | `LINKEDIN_COMPANY_CLIENT_SECRET` | `LINKEDIN_COMPANY_REDIRECT_URI` |
| Twitter/X | `TWITTER_CLIENT_ID` | `TWITTER_CLIENT_SECRET` | `TWITTER_REDIRECT_URI` |
| Facebook | `FACEBOOK_CLIENT_ID` | `FACEBOOK_CLIENT_SECRET` | `FACEBOOK_REDIRECT_URI` |
| Instagram | `INSTAGRAM_CLIENT_ID` | `INSTAGRAM_CLIENT_SECRET` | `INSTAGRAM_REDIRECT_URI` |
| Threads | `THREADS_CLIENT_ID` | `THREADS_CLIENT_SECRET` | `THREADS_REDIRECT_URI` |
| Telegram | N/A | N/A | N/A |

All redirect URIs default to `${NEXT_PUBLIC_APP_URL}/api/social/{platform}/callback` if not explicitly set.

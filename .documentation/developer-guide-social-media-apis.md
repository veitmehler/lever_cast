# Developer Guide: Social Media API Integration

**Last Updated:** 2025-01-XX  
**Purpose:** Comprehensive reference for all social media API integrations, permissions, scopes, and platform-specific nuances.

---

## Table of Contents

1. [Twitter/X API](#twitterx-api)
2. [LinkedIn API](#linkedin-api)
3. [Facebook API](#facebook-api)
4. [Instagram API](#instagram-api)
5. [Threads API](#threads-api)
6. [Telegram API](#telegram-api)
7. [Common Patterns](#common-patterns)
8. [Troubleshooting](#troubleshooting)

---

## Twitter/X API

### Overview
Twitter/X uses OAuth 2.0 with PKCE (Proof Key for Code Exchange) for authentication. The API supports posting tweets, uploading media, and replying to tweets.

### Required Scopes

```
tweet.read tweet.write users.read offline.access media.write
```

- **`tweet.read`**: Read tweets
- **`tweet.write`**: Post tweets (required for publishing)
- **`users.read`**: Read user profile information
- **`offline.access`**: Required for refresh tokens (long-lived tokens)
- **`media.write`**: Upload images/media (required for image posts)

### OAuth Flow

**Authorization URL:** `https://twitter.com/i/oauth2/authorize`

**Token Exchange:** `https://api.twitter.com/2/oauth2/token`

**Token Refresh:** `https://api.twitter.com/2/oauth2/token` (using `refresh_token` grant type)

### API Endpoints

- **Post Tweet:** `POST https://api.twitter.com/2/tweets`
- **Upload Media:** `POST https://api.twitter.com/2/media/upload`
- **Get User Info:** `GET https://api.twitter.com/2/users/me`
- **Get Tweet:** `GET https://api.twitter.com/2/tweets/{id}`

### App Setup Requirements

1. **Twitter Developer Account**
   - Create app at https://developer.twitter.com/
   - Enable OAuth 2.0
   - Set callback URL: `{YOUR_DOMAIN}/api/social/twitter/callback`
   - Set app permissions to **"Read and write"** (required for posting)

2. **Environment Variables**
   ```env
   TWITTER_CLIENT_ID=your_client_id
   TWITTER_CLIENT_SECRET=your_client_secret
   TWITTER_REDIRECT_URI=https://yourdomain.com/api/social/twitter/callback
   ```

### Rate Limits

**Free Tier:**
- **24-hour limit:** 17 POST requests per 24 hours (rolling window)
- **15-minute limit:** Varies (typically lower than Basic tier)

**Basic Tier ($100/month):**
- **24-hour limit:** 100 POST requests per 24 hours
- **15-minute limit:** Higher than Free tier

**Important Notes:**
- Rate limits apply to **API requests**, not successful posts
- Failed requests still count toward the limit
- Rate limit tracking is implemented in `TwitterApiRequest` model
- Rate limit headers: `x-rate-limit-remaining`, `x-rate-limit-reset`, `x-rate-limit-limit`

### Content Limits

- **Tweet length:** 280 characters (for text-only tweets)
- **Thread support:** Yes (multiple tweets as replies)
- **Image support:** Yes (via `media.write` scope)
- **Image requirements:**
  - Max size: 5 MB
  - Formats: JPG, PNG, GIF, WebP
  - Max dimensions: 4096x4096 pixels

### Platform-Specific Nuances

1. **Media Upload:**
   - Uses `/2/media/upload` endpoint (v2 API)
   - Requires `media_category: "tweet_image"` parameter
   - Media ID must be included in tweet payload: `{ media: { media_ids: [mediaId] } }`

2. **Replies:**
   - Use `reply: { in_reply_to_tweet_id: tweetId }` in tweet payload
   - Replies count toward rate limits

3. **Token Refresh:**
   - Tokens expire after 2 hours (default)
   - Refresh tokens are long-lived (if `offline.access` scope is granted)
   - Refresh endpoint uses Basic Auth: `Authorization: Basic {base64(client_id:client_secret)}`

4. **Free Tier Limitations:**
   - May not support tweets with media attachments (even though media upload works)
   - If posting with media fails (403), fallback to text-only post

### Common Issues

**Issue:** `403 Forbidden` when posting with media  
**Solution:** Free tier may not support media attachments. Try text-only post or upgrade to Basic tier.

**Issue:** `429 Rate Limit Exceeded`  
**Solution:** Check database for 24-hour request count. Wait until reset time (oldest request + 24 hours).

**Issue:** `401 Unauthorized`  
**Solution:** Token expired. Refresh token or reconnect account.

---

## LinkedIn API

### Overview
LinkedIn uses OAuth 2.0 for authentication. **Important:** LinkedIn requires **separate apps** for Personal Profiles and Company Pages due to different API products and scopes.

### Required Scopes

#### Personal Profiles
```
openid profile email w_member_social
```

- **`openid`**: Required for OAuth 2.0
- **`profile`**: Basic profile information
- **`email`**: User email address
- **`w_member_social`**: Post to personal profile (requires "Share on LinkedIn" product)

#### Company Pages
```
openid profile email w_organization_social r_organization_social r_organization_admin
```

- **`w_organization_social`**: Post to Company Pages (requires "Community Management API" product)
- **`r_organization_social`**: Read organization content and analytics
- **`r_organization_admin`**: Admin access to organization (required for fetching pages)

### OAuth Flow

**Authorization URL:** `https://www.linkedin.com/oauth/v2/authorization`

**Token Exchange:** `https://www.linkedin.com/oauth/v2/accessToken`

**Note:** LinkedIn does **not** support refresh tokens. Tokens are long-lived but may expire.

### API Endpoints

- **Post Content:** `POST https://api.linkedin.com/v2/ugcPosts`
- **Upload Image:** `POST https://api.linkedin.com/v2/assets?action=registerUpload`
- **Get User Info:** `GET https://api.linkedin.com/v2/userinfo`
- **Get Organizations:** `GET https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED&projection=(elements*(organizationalTarget~(id,name,vanityName)))`

### App Setup Requirements

#### Personal Profile App

1. **LinkedIn Developer Account**
   - Create app at https://www.linkedin.com/developers/
   - Request access to **"Share on LinkedIn"** product
   - Approval typically takes 2-5 business days
   - Set redirect URL: `{YOUR_DOMAIN}/api/social/linkedin/callback`

2. **Environment Variables**
   ```env
   LINKEDIN_CLIENT_ID=your_personal_app_client_id
   LINKEDIN_CLIENT_SECRET=your_personal_app_client_secret
   LINKEDIN_REDIRECT_URI=https://yourdomain.com/api/social/linkedin/callback
   ```

#### Company Pages App

1. **LinkedIn Developer Account**
   - Create a **separate** app at https://www.linkedin.com/developers/
   - Request access to **"Community Management API"** product (replaces deprecated "Marketing Developer Platform")
   - **VERIFICATION REQUIRED:** Approval requires:
     - **Business verification** (LinkedIn verifies your business entity)
     - **Use case submission** (detailed explanation of how you'll use the API)
     - **Review process** (can take several weeks)
   - Set redirect URL: `{YOUR_DOMAIN}/api/social/linkedin/callback` (same as personal app)

2. **Environment Variables**
   ```env
   LINKEDIN_COMPANY_CLIENT_ID=your_company_app_client_id
   LINKEDIN_COMPANY_CLIENT_SECRET=your_company_app_client_secret
   LINKEDIN_COMPANY_REDIRECT_URI=https://yourdomain.com/api/social/linkedin/callback
   ```

**Important:** Both apps use the **same callback URL**. The `target` type (`personal` or `company`) is stored in the OAuth state token, not the callback URL.

### Database Schema

LinkedIn connections are stored with an `appType` field to distinguish between personal and company apps:

```prisma
model SocialConnection {
  appType String? // "personal" | "company" | null (null for other platforms)
  @@unique([userId, platform, appType])
}
```

### Content Limits

- **Post length:** 3,000 characters
- **Image support:** Yes
- **Image requirements:**
  - Min dimensions: 552x276 pixels
  - Max size: 5 MB
  - Formats: JPG, PNG, GIF
  - Aspect ratio: 0.8 (4:5) to 3.0 (3:1)

### Platform-Specific Nuances

1. **Dual App Architecture:**
   - Personal Profiles and Company Pages require separate LinkedIn apps
   - Each app has different scopes and API products
   - OAuth state stores `target` type to route to correct app credentials

2. **Community Management API Verification:**
   - **Business verification is mandatory** for Company Pages access
   - LinkedIn reviews your business entity and use case
   - Approval process can take **several weeks**
   - Without verification, you'll receive `ACCESS_DENIED` errors
   - Check verification status in LinkedIn Developer Portal → Your App → Products

3. **Image Upload Process:**
   - Step 1: Register upload (`/assets?action=registerUpload`)
   - Step 2: Upload binary to returned `uploadUrl` (PUT request)
   - Step 3: Wait 20 seconds for LinkedIn to process asset
   - Step 4: Include `mediaArtifact` URN in post payload

4. **Posting to Company Pages:**
   - Requires `postTargetType: "page"` and `selectedPageId` in connection
   - Author URN format: `urn:li:organization:{pageId}`
   - User must be an **admin** of the Company Page

5. **Fetching Company Pages:**
   - Endpoint: `/organizationalEntityAcls` (not `/organizationAcls`)
   - Projection field: `organizationalTarget` (not `organization`)
   - Requires `w_organization_social` + `r_organization_admin` scopes
   - **Requires business verification** - API will return `ACCESS_DENIED` without verification

6. **Image Upload Issues:**
   - LinkedIn's image API has known issues
   - If image upload fails, fallback to text-only post
   - Error: `ShareMedia.media (URN) is missing` indicates LinkedIn rejected the media URN

### Common Issues

**Issue:** `unauthorized_scope_error` for `w_member_social`  
**Solution:** Request "Share on LinkedIn" product access in LinkedIn Developer Portal.

**Issue:** `ACCESS_DENIED` when fetching Company Pages  
**Solution:** 
1. Ensure "Community Management API" product is approved (requires business verification)
2. Verify business verification is complete in LinkedIn Developer Portal
3. Ensure scopes include `w_organization_social` + `r_organization_admin`
4. If still denied, check approval status - LinkedIn review can take several weeks

**Issue:** `redirect_uri does not match`  
**Solution:** Both LinkedIn apps must use the same callback URL. Update `LINKEDIN_COMPANY_REDIRECT_URI` to match personal app callback.

**Issue:** Image upload succeeds but post fails with media error  
**Solution:** LinkedIn image API has known issues. Fallback to text-only post is implemented.

---

## Facebook API

### Overview
Facebook uses OAuth 2.0 via Meta Graph API v24.0. Facebook Pages are required for posting (personal profiles cannot be posted to via API).

### Required Scopes

```
public_profile,business_management,pages_show_list,pages_manage_posts,pages_read_engagement
```

- **`public_profile`**: Required for Facebook Login
- **`business_management`**: Required for Page management use case
- **`pages_show_list`**: List user's Pages
- **`pages_manage_posts`**: Post to Pages (required for publishing)
- **`pages_read_engagement`**: Read Page analytics

### OAuth Flow

**Authorization URL:** `https://www.facebook.com/v24.0/dialog/oauth`

**Token Exchange:** `https://graph.facebook.com/v24.0/oauth/access_token`

**API Base:** `https://graph.facebook.com/v24.0`

### API Endpoints

- **Get Pages:** `GET /me/accounts`
- **Post to Page:** `POST /{pageId}/feed`
- **Upload Photo:** `POST /{pageId}/photos`

### App Setup Requirements

1. **Meta App Dashboard**
   - Create app at https://developers.facebook.com/apps/
   - Add **"Manage everything on your Page"** use case
   - Customize use case to include required permissions
   - Set redirect URL: `{YOUR_DOMAIN}/api/social/facebook/callback`
   - Add app domain (Settings → Basic)

2. **Environment Variables**
   ```env
   FACEBOOK_CLIENT_ID=your_app_id
   FACEBOOK_CLIENT_SECRET=your_app_secret
   FACEBOOK_REDIRECT_URI=https://yourdomain.com/api/social/facebook/callback
   ```

3. **App Review**
   - `pages_manage_posts` may require App Review for production
   - Development mode allows testing with app admins/developers/testers only

### Content Limits

- **Post length:** 2,000 characters
- **Image support:** Yes
- **Image requirements:**
  - Max size: 4 MB
  - Formats: JPG, PNG, GIF, WebP

### Platform-Specific Nuances

1. **Page Access Tokens:**
   - User access token is exchanged for Page access tokens
   - Each Page has its own access token (returned in `/me/accounts`)
   - Page access tokens are used for posting

2. **Posting to Pages:**
   - Personal profiles cannot be posted to via API
   - Must post to a Facebook Page
   - User must be an **admin** of the Page

3. **Image Upload:**
   - Upload photo to Page: `POST /{pageId}/photos`
   - Set `published: false` to attach to post later
   - Attach photo to post: `attached_media: [{ media_fbid: photoId }]`

4. **Use Case Customization:**
   - New Meta App Dashboard uses use-case driven UI
   - Permissions are managed within use case customization
   - No separate "Products" section for basic permissions

### Common Issues

**Issue:** `Invalid Scopes: pages_manage_posts`  
**Solution:** Ensure "Manage everything on your Page" use case is added and customized with required permissions.

**Issue:** No pages shown after OAuth  
**Solution:** User must be a Page admin. Check Page permissions in Facebook Business Settings.

**Issue:** `403 Permission denied`  
**Solution:** App may need App Review for `pages_manage_posts`. Check App Review dashboard.

---

## Instagram API

### Overview
Instagram uses Meta Graph API v24.0 (same as Facebook). Instagram Business Accounts must be linked to Facebook Pages. **Images are required** - text-only posts are not supported.

### Required Scopes

```
pages_show_list,pages_read_engagement,instagram_basic,instagram_content_publish,business_management
```

- **`pages_show_list`**: List Facebook Pages linked to Instagram accounts
- **`pages_read_engagement`**: Read engagement metrics
- **`instagram_basic`**: **Required dependency** for `instagram_content_publish` (per Facebook docs)
- **`instagram_content_publish`**: Publish content to Instagram (requires Advanced Access)
- **`business_management`**: Manage business accounts

**Important:** `instagram_basic` is **NOT deprecated** - it's a required dependency for `instagram_content_publish`.

### OAuth Flow

**Authorization URL:** `https://www.facebook.com/v24.0/dialog/oauth`

**Token Exchange:** `https://graph.facebook.com/v24.0/oauth/access_token`

**API Base:** `https://graph.facebook.com/v24.0`

### API Endpoints

- **Get Instagram Account:** `GET /me/accounts?fields=instagram_business_account`
- **Create Media Container:** `POST /{igAccountId}/media`
- **Publish Media:** `POST /{igAccountId}/media_publish`

### App Setup Requirements

1. **Meta App Dashboard**
   - Create app at https://developers.facebook.com/apps/
   - Add **"Manage everything on your Page"** use case
   - Customize use case to add Instagram permissions:
     - `instagram_basic`
     - `instagram_content_publish`
     - `pages_read_user_content` (implicit dependency for "Content" task)
   - **VERIFICATION REQUIRED:**
     - **Become a Tech Provider** (required for business features)
       - Click "Become a Tech Provider" on the main dashboard
       - Complete the confirmation process
     - **Business Verification** (required for Instagram posting)
       - Meta requires business verification for Instagram API access
       - Complete business verification in App Settings → Business Verification
       - This may require submitting business documents
   - Request **Advanced Access** for `instagram_content_publish`:
     - Go to App Review → Permissions and Features
     - Search for "instagram"
     - Click "Request advanced access" for `instagram_content_publish`
     - Submit screencast and usage description
     - **Note:** Advanced Access approval may be blocked until business verification is complete
   - Set redirect URL: `{YOUR_DOMAIN}/api/social/instagram/callback`

2. **Environment Variables**
   ```env
   INSTAGRAM_CLIENT_ID=your_facebook_app_id  # Can use FACEBOOK_CLIENT_ID
   INSTAGRAM_CLIENT_SECRET=your_facebook_app_secret  # Can use FACEBOOK_CLIENT_SECRET
   INSTAGRAM_REDIRECT_URI=https://yourdomain.com/api/social/instagram/callback
   ```

3. **Instagram Account Requirements**
   - Instagram account must be a **Business or Creator account** (not personal)
   - Instagram account must be **linked to a Facebook Page**
   - User must be an **admin** of both the Facebook Page and Instagram account

### Content Limits

- **Caption length:** 2,200 characters (we limit to 2,000)
- **Image support:** **REQUIRED** (Instagram does not support text-only posts)
- **Image requirements:**
  - Min dimensions: 600x600 pixels (square recommended)
  - Max size: 8 MB
  - Formats: JPG, PNG
  - Aspect ratio: 1:1 (square) recommended

### Platform-Specific Nuances

1. **Two-Step Publishing:**
   - Step 1: Create media container (`POST /{igAccountId}/media`)
   - Step 2: Publish media container (`POST /{igAccountId}/media_publish`)

2. **Image Upload Process:**
   - Upload image to Facebook Page: `POST /{pageId}/photos`
   - Get image URL: `https://graph.facebook.com/v24.0/{imageId}/picture?access_token={token}`
   - Use image URL in media container creation

3. **Instagram Product Setup:**
   - New Meta App Dashboard: Instagram capabilities are managed within use case customization
   - Look for "Customize the Manage everything on your Page use case"
   - Use search bar or "Add permission or feature" button to add Instagram permissions
   - No separate "Products" section or product cards (in new UI)

4. **Verification and Advanced Access Required:**
   - **Tech Provider status** is required (become a Tech Provider first)
   - **Business verification** is mandatory for Instagram API access
     - Complete in App Settings → Business Verification
     - Submit business documents as required
     - Approval can take days/weeks
   - `instagram_content_publish` requires Advanced Access approval
     - Simply adding permission in use case customizer is not enough
     - Must submit App Review request with screencast
     - **Advanced Access may be blocked until business verification is complete**

### Common Issues

**Issue:** `Invalid Scopes: instagram_basic, instagram_content_publish`  
**Solution:** 
1. **Become a Tech Provider** (if not already done)
2. **Complete Business Verification** (required for Instagram API access)
   - Go to App Settings → Business Verification
   - Submit required business documents
   - Wait for Meta approval (can take days/weeks)
3. Ensure Instagram product is added (via use case customization)
4. Request Advanced Access for `instagram_content_publish` in App Review
   - Note: Advanced Access may be blocked until business verification is complete
5. Wait for Meta approval (can take days/weeks)
6. Disconnect and reconnect Instagram after approval

**Issue:** `403 Permission denied`  
**Solution:** Ensure all scopes are approved: `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`, `business_management`.

**Issue:** No Instagram account found  
**Solution:** 
1. Verify Instagram account is Business/Creator (not personal)
2. Verify Instagram account is linked to Facebook Page
3. Verify user is admin of both Page and Instagram account

**Issue:** Cannot find "Products" section in Meta App Dashboard  
**Solution:** New UI is use-case driven. Look for "Customize the Manage everything on your Page use case" instead.

---

## Threads API

### Overview
Threads uses Meta Graph API v24.0 (similar to Instagram). Threads accounts are linked to Instagram Business Accounts.

### Required Scopes

```
threads_basic,threads_content_publish,pages_show_list
```

- **`threads_basic`**: Basic Threads access
- **`threads_content_publish`**: Publish content to Threads
- **`pages_show_list`**: List Pages (for Instagram account lookup)

### OAuth Flow

**Authorization URL:** `https://www.facebook.com/v24.0/dialog/oauth`

**Token Exchange:** `https://graph.facebook.com/v24.0/oauth/access_token`

**API Base:** `https://graph.facebook.com/v24.0`

### API Endpoints

- **Get Threads Account:** `GET /me/accounts?fields=instagram_business_account`
- **Post to Threads:** `POST /{threadsAccountId}/threads`

### App Setup Requirements

1. **Meta App Dashboard**
   - Create app at https://developers.facebook.com/apps/
   - Add Threads permissions (similar to Instagram)
   - Set redirect URL: `{YOUR_DOMAIN}/api/social/threads/callback`

2. **Environment Variables**
   ```env
   THREADS_CLIENT_ID=your_facebook_app_id  # Can use FACEBOOK_CLIENT_ID
   THREADS_CLIENT_SECRET=your_facebook_app_secret  # Can use FACEBOOK_CLIENT_SECRET
   THREADS_REDIRECT_URI=https://yourdomain.com/api/social/threads/callback
   ```

### Content Limits

- **Post length:** 500 characters
- **Image support:** Optional
- **Image requirements:** Similar to Instagram

### Platform-Specific Nuances

1. **Threads Account Lookup:**
   - Threads accounts are linked to Instagram Business Accounts
   - Use Instagram account ID for Threads posting

2. **Posting:**
   - Text-only: `POST /{threadsAccountId}/threads` with `text` field
   - With image: Include `media_id` in payload

### Common Issues

**Issue:** Threads account not found  
**Solution:** Ensure Instagram Business Account is linked and accessible.

---

## Telegram API

### Overview
Telegram uses **Bot API** (not OAuth). Users provide a bot token, which is stored encrypted in the `ApiKey` model.

### Authentication

**No OAuth flow** - users provide bot token directly.

**API Base:** `https://api.telegram.org/bot{token}`

### API Endpoints

- **Send Message:** `POST /sendMessage`
- **Send Photo:** `POST /sendPhoto`

### Setup Requirements

1. **Create Telegram Bot**
   - Message @BotFather on Telegram
   - Use `/newbot` command
   - Get bot token

2. **Add Bot Token**
   - User adds token in Settings → Telegram
   - Token is encrypted and stored in `ApiKey` model

3. **Add Bot to Channel**
   - Bot must be added as admin to target channel
   - Channel ID format: `@channelname` or numeric ID

### Content Limits

- **Message length:** 2,000 characters (for text messages)
- **Photo caption:** 1,024 characters
- **Image support:** Yes
- **Image requirements:**
  - Max size: 10 MB
  - Formats: JPG, PNG, GIF

### Platform-Specific Nuances

1. **Chat ID Formats:**
   - Public channels: `@channelname`
   - Private channels: Numeric ID (e.g., `-1001234567890`)

2. **Bot Permissions:**
   - Bot must be admin of channel to post
   - Bot must have "Post Messages" permission

3. **Error Codes:**
   - `401`: Invalid bot token
   - `403`: Bot not admin or no permission
   - `400`: Invalid chat ID

### Common Issues

**Issue:** `403 Forbidden`  
**Solution:** Bot must be added as admin to channel with "Post Messages" permission.

**Issue:** `400 Bad Request`  
**Solution:** Check chat ID format. Use `@channelname` for public channels or numeric ID for private.

---

## Common Patterns

### OAuth State Management

OAuth state tokens are used to:
1. Prevent CSRF attacks
2. Store additional data (e.g., `target` for LinkedIn)
3. Link OAuth callback to original request

**Implementation:**
- State token generated with `generateOAuthState(userId, platform, target?)`
- Stored in HTTP-only cookie: `oauth_state_{platform}`
- Verified in callback: `verifyOAuthState(state, userId, platform)`

### Token Refresh

**Twitter:** Supports refresh tokens (if `offline.access` scope granted)  
**LinkedIn:** No refresh tokens (tokens are long-lived)  
**Facebook/Instagram/Threads:** Supports token refresh (via Meta API)

### Error Handling

All API functions return:
```typescript
{ success: true; postUrl: string; ... } | { success: false; error: string }
```

### Image Upload Pattern

1. Download image from Supabase Storage
2. Upload to platform-specific endpoint
3. Get media ID/URN
4. Include in post payload

### Database Schema

**SocialConnection Model:**
```prisma
model SocialConnection {
  platform      String   // "linkedin" | "twitter" | "facebook" | "instagram" | "threads"
  appType       String?   // "personal" | "company" (LinkedIn only)
  postTargetType String? // "personal" | "page"
  selectedPageId String?  // Selected page ID (for LinkedIn Company Pages or Facebook Pages)
  accessToken   String   @db.Text // Encrypted
  refreshToken  String?  @db.Text // Encrypted
  tokenExpiry   DateTime?
  @@unique([userId, platform, appType])
}
```

---

## Troubleshooting

### General OAuth Issues

**Issue:** `redirect_uri does not match`  
**Solution:** Ensure redirect URI in app settings matches exactly (including protocol, domain, path).

**Issue:** `invalid_client`  
**Solution:** Check `CLIENT_ID` and `CLIENT_SECRET` environment variables.

**Issue:** `invalid_grant`  
**Solution:** Authorization code expired (typically 10 minutes). Re-initiate OAuth flow.

### Token Issues

**Issue:** Token expired  
**Solution:** 
- Twitter: Refresh token (if `offline.access` granted)
- LinkedIn: Reconnect (no refresh tokens)
- Facebook/Instagram/Threads: Refresh token or reconnect

**Issue:** Token missing required scopes  
**Solution:** Disconnect and reconnect to get new token with correct scopes.

### Permission Issues

**Issue:** `403 Forbidden` or `ACCESS_DENIED`  
**Solution:**
1. Check app has required permissions/scopes approved
2. Check user has required role (admin, etc.)
3. Check App Review status (for production apps)
4. Disconnect and reconnect to refresh permissions

### Rate Limit Issues

**Issue:** `429 Too Many Requests`  
**Solution:**
1. Check platform-specific rate limits
2. Implement exponential backoff
3. Track requests in database (Twitter example)
4. Wait until reset time

### Platform-Specific Debugging

**Twitter:**
- Check `x-access-level` header (should be "read-write")
- Check rate limit headers: `x-rate-limit-remaining`, `x-rate-limit-reset`

**LinkedIn:**
- Check scopes in token response
- Verify app has required products approved
- Check `appType` matches connection type

**Facebook/Instagram:**
- Check App Review status
- Verify use case is customized with required permissions
- Check Page/Instagram account admin status

---

## References

- [Twitter API v2 Documentation](https://developer.twitter.com/en/docs/twitter-api)
- [LinkedIn API Documentation](https://learn.microsoft.com/en-us/linkedin/)
- [Meta Graph API Documentation](https://developers.facebook.com/docs/graph-api)
- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api)
- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)

---

**Note:** This guide reflects the current implementation as of 2025-01-XX. API documentation and requirements may change. Always refer to official platform documentation for the latest information.


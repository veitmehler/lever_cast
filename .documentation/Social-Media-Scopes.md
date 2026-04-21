# Social Media OAuth Scopes Report

**Last Updated:** February 8, 2026  
**Purpose:** Comprehensive documentation of OAuth 2.0 scopes required for each social media platform integration in Socioply.

---

## Table of Contents

1. [Overview](#overview)
2. [Twitter/X](#twitterx)
3. [LinkedIn](#linkedin)
4. [Facebook](#facebook)
5. [Instagram](#instagram)
6. [Threads](#threads)
7. [Telegram](#telegram)
8. [Scope Comparison Matrix](#scope-comparison-matrix)
9. [Common Issues & Solutions](#common-issues--solutions)

---

## Overview

This document details the OAuth 2.0 scopes required for each social media platform integrated in Socioply. Scopes define what permissions your application can request from users during the OAuth authorization flow.

**Key Concepts:**
- **Scopes** are permissions requested during OAuth authorization
- Some platforms require **separate apps** for different use cases (e.g., LinkedIn Personal vs. Company Pages)
- Some scopes require **product access** or **app review** approval
- Scopes are returned in the access token response and should be verified

---

## Twitter/X

### Required Scopes

```
tweet.read tweet.write users.read offline.access media.write
```

### Scope Details

| Scope | Purpose | Required For |
|-------|---------|--------------|
| `tweet.read` | Read tweets | Basic functionality |
| `tweet.write` | Post tweets | **Publishing posts** |
| `users.read` | Read user profile information | User identification |
| `offline.access` | Long-lived refresh tokens | Token refresh |
| `media.write` | Upload images/media | **Image posts** |

### OAuth Flow

- **Authorization URL:** `https://twitter.com/i/oauth2/authorize`
- **Token Exchange:** `https://api.twitter.com/2/oauth2/token`
- **Uses PKCE:** Yes (Proof Key for Code Exchange)

### App Setup Requirements

1. **Twitter Developer Account**
   - Create app at https://developer.twitter.com/
   - Enable OAuth 2.0
   - Set app permissions to **"Read and write"** (required for `tweet.write`)
   - Set callback URL: `{YOUR_DOMAIN}/api/social/twitter/callback`

2. **Environment Variables**
   ```env
   TWITTER_CLIENT_ID=your_client_id
   TWITTER_CLIENT_SECRET=your_client_secret
   TWITTER_REDIRECT_URI=https://yourdomain.com/api/social/twitter/callback
   ```

### Notes

- **Free Tier Limitation:** May not support tweets with media attachments (even with `media.write` scope)
- **Rate Limits:** 17 POST requests per 24 hours (Free tier), 100 POST requests per 24 hours (Basic tier)
- **Token Refresh:** Supported if `offline.access` scope is granted

---

## LinkedIn

### Overview

LinkedIn requires **separate apps** for Personal Profiles and Company Pages due to different API products and scopes.

### Personal Profiles

#### Required Scopes

```
openid profile email w_member_social
```

#### Scope Details

| Scope | Purpose | Required For |
|-------|---------|--------------|
| `openid` | OAuth 2.0 authentication | Authentication |
| `profile` | Basic profile information | User identification |
| `email` | User email address | User identification |
| `w_member_social` | Post to personal profile | **Publishing posts** |

#### Product Access Required

- **"Share on LinkedIn"** product must be approved
- Approval typically takes 2-5 business days
- Request access in LinkedIn Developer Portal → Products

#### App Setup

1. **LinkedIn Developer Account**
   - Create app at https://www.linkedin.com/developers/
   - Request access to **"Share on LinkedIn"** product
   - Set redirect URL: `{YOUR_DOMAIN}/api/social/linkedin/callback`

2. **Environment Variables**
   ```env
   LINKEDIN_CLIENT_ID=your_personal_app_client_id
   LINKEDIN_CLIENT_SECRET=your_personal_app_client_secret
   LINKEDIN_REDIRECT_URI=https://yourdomain.com/api/social/linkedin/callback
   ```

### Company Pages

#### Required Scopes

```
w_organization_social r_organization_social rw_organization_admin
```

#### Scope Details

| Scope | Purpose | Required For |
|-------|---------|--------------|
| `w_organization_social` | Post to Company Pages | **Publishing posts** |
| `r_organization_social` | Read organization content and analytics | Analytics |
| `rw_organization_admin` | Admin access to organization | **Fetching pages**, posting |

**Important:** LinkedIn's Community Management API does **not** support OpenID Connect scopes (`openid`, `profile`, `email`). Only request organization scopes for Company Pages.

#### Product Access Required

- **"Community Management API"** product must be approved
- **VERIFICATION REQUIRED:**
  - Business verification (LinkedIn verifies your business entity)
  - Use case submission (detailed explanation)
  - Review process (can take several weeks)

#### App Setup

1. **LinkedIn Developer Account**
   - Create a **separate** app at https://www.linkedin.com/developers/
   - Request access to **"Community Management API"** product
   - Complete business verification
   - Set redirect URL: `{YOUR_DOMAIN}/api/social/linkedin/callback` (same as personal app)

2. **Environment Variables**
   ```env
   LINKEDIN_COMPANY_CLIENT_ID=your_company_app_client_id
   LINKEDIN_COMPANY_CLIENT_SECRET=your_company_app_client_secret
   LINKEDIN_COMPANY_REDIRECT_URI=https://yourdomain.com/api/social/linkedin/callback
   ```

### Notes

- **No Refresh Tokens:** LinkedIn does not support refresh tokens. Tokens are long-lived but may expire.
- **Dual App Architecture:** Personal and Company Pages use different apps with different scopes
- **OpenID Connect:** Not available for Company Pages (Community Management API limitation)
- **Rate Limiting:** When rate-limited, LinkedIn returns organization URNs instead of full details

---

## Facebook

### Required Scopes

```
public_profile,business_management,pages_show_list,pages_manage_posts,pages_read_engagement
```

### Scope Details

| Scope | Purpose | Required For |
|-------|---------|--------------|
| `public_profile` | Required for Facebook Login | Authentication |
| `business_management` | Page management use case | Page management |
| `pages_show_list` | List user's Pages | **Page selection** |
| `pages_manage_posts` | Post to Pages | **Publishing posts** |
| `pages_read_engagement` | Read Page analytics | Analytics |

### OAuth Flow

- **Authorization URL:** `https://www.facebook.com/v24.0/dialog/oauth`
- **Token Exchange:** `https://graph.facebook.com/v24.0/oauth/access_token`
- **API Base:** `https://graph.facebook.com/v24.0`

### App Setup Requirements

1. **Meta App Dashboard - Use Case Setup**
   - Create app at https://developers.facebook.com/apps/
   - Add **"Manage everything on your Page"** Use Case
   - Customize use case to add required permissions
   - Set redirect URL: `{YOUR_DOMAIN}/api/social/facebook/callback`

2. **Environment Variables**
   ```env
   FACEBOOK_CLIENT_ID=your_app_id
   FACEBOOK_CLIENT_SECRET=your_app_secret
   FACEBOOK_REDIRECT_URI=https://yourdomain.com/api/social/facebook/callback
   ```

3. **App Review**
   - `pages_manage_posts` may require App Review for production
   - Development mode allows testing with app admins/developers/testers only

### Notes

- **Page Access Tokens:** User token is exchanged for Page access tokens
- **Personal Profiles:** Cannot be posted to via API (must use Pages)
- **Token Refresh:** Supports long-lived tokens (60 days)

---

## Instagram

### Required Scopes

```
pages_show_list,pages_read_engagement,instagram_content_publish,instagram_basic,business_management
```

### Scope Details

| Scope | Purpose | Required For |
|-------|---------|--------------|
| `pages_show_list` | List Facebook Pages linked to Instagram accounts | **Page selection** |
| `pages_read_engagement` | Read engagement metrics | Analytics |
| `instagram_content_publish` | Publish content to Instagram | **Publishing posts** |
| `instagram_basic` | Read profile metadata of Business accounts | Profile information |
| `business_management` | Manage business accounts | Account management |

**Important:** `instagram_basic` is part of the **Instagram Graph API** and is compatible with `instagram_content_publish`. The deprecated Basic Display API uses different scopes (`user_profile`, `user_media`).

### OAuth Flow

- **Authorization URL:** `https://www.facebook.com/v24.0/dialog/oauth` (uses Facebook OAuth)
- **Token Exchange:** `https://graph.facebook.com/v24.0/oauth/access_token`
- **API Base:** `https://graph.facebook.com/v24.0`

### App Setup Requirements

1. **Meta App Dashboard - Use Case Setup**
   - Create app at https://developers.facebook.com/apps/
   - Add **"Manage messaging and content on Instagram"** Use Case
   - Customize use case to add required permissions
   - **VERIFICATION REQUIRED:**
     - **Become a Tech Provider** (required for business features)
     - **Business Verification** (required for Instagram posting)
   - Request **Advanced Access** for `instagram_content_publish`:
     - Go to App Review → Permissions and Features
     - Search for "instagram"
     - Click "Request advanced access" for `instagram_content_publish`
     - Submit screencast and usage description
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

### Notes

- **Images Required:** Instagram does not support text-only posts (images are required)
- **Two-Step Publishing:** Create media container, then publish
- **Advanced Access:** `instagram_content_publish` requires Advanced Access approval
- **Business Verification:** Mandatory for Instagram API access

---

## Threads

### Required Scopes

```
threads_basic,threads_content_publish
```

### Scope Details

| Scope | Purpose | Required For |
|-------|---------|--------------|
| `threads_basic` | Required to know who the user is | User identification |
| `threads_content_publish` | Post content to Threads | **Publishing posts** |

**Note:** Threads uses its own scopes, separate from Instagram Graph API scopes.

### OAuth Flow

- **Authorization URL:** `https://threads.net/oauth/authorize` ⚠️ **NOT facebook.com**
- **Token Exchange:** `https://graph.threads.net/oauth/access_token` ⚠️ **NOT graph.facebook.com**
- **API Base:** `https://graph.threads.net/v1.0` ⚠️ **NOT graph.facebook.com**

### App Setup Requirements

1. **Meta App Dashboard - Use Case Setup**
   - Create app at https://developers.facebook.com/apps/
   - **IMPORTANT:** Start with **"Access to Threads API"** Use Case first
   - Add additional use cases as needed:
     - "Manage messaging and content on Instagram"
     - "Manage everything on your Page"
   - Customize each use case to add required permissions
   - **CRITICAL:** Threads OAuth **REQUIRES HTTPS** - cannot use HTTP even for localhost
   - Add callback URL in **3 places**:
     - Redirect Callback URLs
     - Uninstall Callback URL
     - Delete Callback URL
   - All three must use: `https://your-domain.ngrok.io/api/social/threads/callback`

2. **Threads Test User Setup**
   - Add user as Test User in Use Case → Access to Threads API → Customize → Settings
   - **Accept invitation in Threads mobile app:**
     - Open Threads mobile app (iOS or Android)
     - Go to: Profile → Menu (≡) → Account → Website Permissions → Invites
     - Tap "Accept" for your Meta app

3. **Environment Variables**
   ```env
   THREADS_CLIENT_ID=your_threads_app_id  # Separate from Facebook app
   THREADS_CLIENT_SECRET=your_threads_app_secret  # Separate from Facebook app
   THREADS_REDIRECT_URI=https://your-domain.ngrok.io/api/social/threads/callback  # Must be HTTPS
   ```

**Important:** Threads requires its own Client ID and Secret (separate from Facebook app). You cannot use Facebook Client ID for Threads.

### Notes

- **Separate OAuth Gateway:** Threads uses `threads.net` domain (not `facebook.com`)
- **HTTPS Required:** Cannot use HTTP even for localhost (use ngrok for local development)
- **Test User Acceptance:** Must accept invitation in Threads mobile app (not web browser)
- **Two-Step Publishing:** Create media container, then publish
- **User Access Token:** Threads API uses user access token directly (not Page token)

---

## Telegram

### Overview

Telegram uses **Bot API** (not OAuth). Users provide a bot token, which is stored encrypted in the `ApiKey` model.

### Authentication

**No OAuth flow** - users provide bot token directly.

- **API Base:** `https://api.telegram.org/bot{token}`

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

### Notes

- **No Scopes:** Telegram Bot API doesn't use OAuth scopes
- **Bot Permissions:** Bot must be admin of channel with "Post Messages" permission
- **Chat ID Formats:** Public channels use `@channelname`, private channels use numeric ID

---

## Scope Comparison Matrix

| Platform | OAuth 2.0 | PKCE | Refresh Tokens | Separate Apps | Product Access Required | Business Verification |
|----------|-----------|------|----------------|---------------|------------------------|----------------------|
| Twitter/X | ✅ | ✅ | ✅ (with `offline.access`) | ❌ | ❌ | ❌ |
| LinkedIn Personal | ✅ | ❌ | ❌ | ❌ | ✅ ("Share on LinkedIn") | ❌ |
| LinkedIn Company | ✅ | ❌ | ❌ | ✅ (separate app) | ✅ ("Community Management API") | ✅ |
| Facebook | ✅ | ❌ | ✅ (long-lived tokens) | ❌ | ❌ | ❌ |
| Instagram | ✅ | ❌ | ✅ (long-lived tokens) | ❌ | ✅ (Advanced Access) | ✅ |
| Threads | ✅ | ❌ | ✅ (long-lived tokens) | ✅ (separate app) | ✅ | ❌ |
| Telegram | ❌ (Bot API) | ❌ | N/A | ❌ | ❌ | ❌ |

---

## Common Issues & Solutions

### LinkedIn

**Issue:** `unauthorized_scope_error` for `w_member_social`  
**Solution:** Request "Share on LinkedIn" product access in LinkedIn Developer Portal.

**Issue:** `unauthorized_scope_error` for `openid` scope when connecting Company Pages  
**Solution:** LinkedIn's Community Management API does not support OpenID Connect scopes. Remove `openid`, `profile`, and `email` from Company Pages OAuth request. Only request organization scopes: `w_organization_social r_organization_social rw_organization_admin`.

**Issue:** `ACCESS_DENIED` when fetching Company Pages  
**Solution:** 
1. Ensure "Community Management API" product is approved (requires business verification)
2. Verify business verification is complete in LinkedIn Developer Portal
3. Ensure scopes include `w_organization_social` + `rw_organization_admin` (or `r_organization_admin`)

**Issue:** Pages show as "Unnamed Page" or "Company Page (12345678)"  
**Solution:** LinkedIn is rate-limiting organization details. When rate-limited, only organization URNs are returned. Pages will still work for posting, but names may not display until rate limit resets.

### Twitter/X

**Issue:** `403 Forbidden` when posting with media  
**Solution:** Free tier may not support media attachments. Try text-only post or upgrade to Basic tier.

**Issue:** `429 Rate Limit Exceeded`  
**Solution:** Check database for 24-hour request count. Wait until reset time (oldest request + 24 hours).

### Facebook

**Issue:** `Invalid Scopes: pages_manage_posts`  
**Solution:** Ensure "Manage everything on your Page" use case is added and customized with required permissions.

**Issue:** No pages shown after OAuth  
**Solution:** User must be a Page admin. Check Page permissions in Facebook Business Settings.

### Instagram

**Issue:** `Invalid Scopes: instagram_basic, instagram_content_publish`  
**Solution:** 
1. Ensure `instagram_basic` is included (it's part of Instagram Graph API)
2. Add "Instagram Graph API" product (not "Instagram Basic Display API")
3. Become a Tech Provider
4. Complete Business Verification
5. Request Advanced Access for `instagram_content_publish` in App Review

**Issue:** `403 Permission denied`  
**Solution:** Ensure all scopes are approved: `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`, `business_management`. Make sure you're using Instagram Graph API (not Basic Display API).

### Threads

**Issue:** `Authorization Failed: No app ID was sent with the request` (error code 4476002)  
**Solution:** Ensure `THREADS_CLIENT_ID` is set correctly. Threads requires its own Client ID (cannot use Facebook Client ID).

**Issue:** `Insecure Login Blocked: You can't get an access token or login to this app from an insecure page` (error code 1349187)  
**Solution:** Threads OAuth requires HTTPS. Use ngrok for local development or ensure production uses HTTPS.

**Issue:** `The user has not accepted the invite to test the app` (error code 1349245)  
**Solution:** 
1. Add user as Test User in Use Case → Access to Threads API → Customize → Settings
2. Open Threads mobile app with that account
3. Go to Profile → Menu (≡) → Account → Website Permissions → Invites
4. Tap "Accept" for your Meta app

### Telegram

**Issue:** `403 Forbidden`  
**Solution:** Bot must be added as admin to channel with "Post Messages" permission.

**Issue:** `400 Bad Request`  
**Solution:** Check chat ID format. Use `@channelname` for public channels or numeric ID for private.

---

## References

- [Twitter API v2 Documentation](https://developer.twitter.com/en/docs/twitter-api)
- [LinkedIn API Documentation](https://learn.microsoft.com/en-us/linkedin/)
- [Meta Graph API Documentation](https://developers.facebook.com/docs/graph-api)
- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api)
- [Threads API Documentation](https://developers.facebook.com/docs/threads)
- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)

---

**Note:** This report reflects the current implementation as of February 8, 2026. API documentation and requirements may change. Always refer to official platform documentation for the latest information.

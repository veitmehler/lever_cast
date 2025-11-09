# OAuth and Social Media Publishing Setup Guide

## Overview
This guide explains how to set up OAuth integration and social media publishing for LinkedIn and Twitter/X.

## Prerequisites

1. **LinkedIn Developer Account**
   - Go to https://www.linkedin.com/developers/
   - Create a new app
   - Note your Client ID and Client Secret

2. **Twitter/X Developer Account**
   - Go to https://developer.twitter.com/
   - Create a new app
   - Enable OAuth 2.0
   - Note your Client ID and Client Secret

## Environment Variables

Add these to your `.env` file:

```env
# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=https://yourdomain.com/api/social/linkedin/callback

# Twitter/X OAuth
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
TWITTER_REDIRECT_URI=https://yourdomain.com/api/social/twitter/callback

# App URL (for OAuth redirects)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## OAuth Flow Implementation

### 1. LinkedIn OAuth

**Authorization URL**: `/api/social/linkedin` (POST)
- Generates OAuth state token
- Redirects to LinkedIn authorization page
- Required scopes: `openid profile email w_member_social`

**Callback URL**: `/api/social/linkedin/callback` (GET)
- Receives authorization code
- Exchanges code for access token
- Fetches user profile
- Stores encrypted tokens in database

### 2. Twitter/X OAuth

**Authorization URL**: `/api/social/twitter` (POST)
- Generates OAuth state token
- Redirects to Twitter authorization page
- Required scopes: `tweet.read tweet.write users.read offline.access`
- Uses OAuth 2.0 with PKCE (simplified for now)

**Callback URL**: `/api/social/twitter/callback` (GET)
- Receives authorization code
- Exchanges code for access token
- Fetches user profile
- Stores encrypted tokens in database

## Publishing Implementation

### API Endpoint: `/api/posts/publish` (POST)

This endpoint handles actual publishing to social media platforms.

**Request Body**:
```json
{
  "platform": "linkedin" | "twitter",
  "content": "string" | ["string", "string", ...], // Array for Twitter threads
  "draftId": "string" | null,
  "imageUrl": "string" | undefined
}
```

**Response**:
```json
{
  "success": true,
  "postUrl": "string" | ["string", ...], // Array for Twitter threads
  "message": "Post successfully published to LinkedIn!"
}
```

### LinkedIn Publishing

- Uses LinkedIn UGC Posts API
- Posts are published as public shares
- Image support: TODO (currently text-only)
- Returns LinkedIn post URL

### Twitter/X Publishing

- Uses Twitter API v2
- Supports single tweets and threads
- Threads are posted as replies to the summary tweet
- Returns Twitter post URL(s)

## Token Management

### Storage
- Tokens are encrypted using `src/lib/encryption.ts`
- Stored in `SocialConnection` table
- Includes access token, refresh token (if available), and expiry

### Token Refresh
- Currently not implemented (TODO)
- When tokens expire, users need to reconnect their accounts
- Future: Automatic token refresh using refresh tokens

## Security Considerations

1. **OAuth State Tokens**
   - Generated using cryptographically secure random bytes
   - Stored in-memory (expires after 10 minutes)
   - Verified on callback to prevent CSRF attacks

2. **Token Encryption**
   - Currently uses base64 encoding (basic)
   - TODO: Upgrade to AES-256-GCM encryption for production

3. **Environment Variables**
   - Never commit secrets to git
   - Use secure environment variable management
   - Rotate secrets regularly

## Testing

### Manual Testing

1. **Connect LinkedIn**:
   - Go to Settings page
   - Click "Connect" for LinkedIn
   - Complete OAuth flow
   - Verify connection appears in Connected Accounts

2. **Connect Twitter/X**:
   - Go to Settings page
   - Click "Connect" for Twitter/X
   - Complete OAuth flow
   - Verify connection appears in Connected Accounts

3. **Publish Post**:
   - Create a post on Dashboard
   - Click "Publish" for LinkedIn or Twitter
   - Verify post appears on the platform
   - Check post URL is saved in database

4. **Publish Thread**:
   - Create a Twitter thread (select "Thread" format)
   - Click "Publish"
   - Verify summary tweet and replies are posted
   - Check all post URLs are saved

## Troubleshooting

### "OAuth not configured" Error
- Check environment variables are set correctly
- Verify Client ID and Client Secret are correct
- Ensure redirect URIs match exactly

### "Account not connected" Error
- User needs to connect their account first
- Go to Settings page and click "Connect"

### "Token expired" Error
- User needs to reconnect their account
- Future: Implement automatic token refresh

### Publishing Fails
- Check OAuth tokens are valid
- Verify API permissions/scopes are correct
- Check platform API status
- Review error logs for details

## Next Steps

1. ✅ OAuth flow implemented
2. ✅ Publishing APIs implemented
3. ⏳ Token refresh logic (TODO)
4. ⏳ Image upload to LinkedIn (TODO)
5. ⏳ Enhanced error handling and retries (TODO)
6. ⏳ Rate limiting handling (TODO)
7. ⏳ Upgrade encryption to AES-256-GCM (TODO)


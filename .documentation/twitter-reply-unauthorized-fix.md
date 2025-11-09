# Twitter Reply Publishing Issue - Troubleshooting Guide

## Issue
Scheduled Twitter posts fail with "Unauthorized" error, specifically when posting replies (Twitter threads).

## Root Cause
The Twitter API requires **"Read and write"** permissions to post replies. If your Twitter app only has "Read" permissions, or if the OAuth token was issued before write permissions were enabled, replies will fail with a 401 Unauthorized error.

## Solution

### Step 1: Verify Twitter App Permissions

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Navigate to your app → **Settings** → **User authentication settings**
3. Check **App permissions**:
   - ✅ Must be **"Read and write"** (not just "Read")
   - ✅ Must have **OAuth 2.0** enabled

### Step 2: Reconnect Twitter Account

**Important:** Even if your app has write permissions, you need to reconnect your Twitter account to get a new access token with write permissions.

1. Go to `/settings` in your app
2. Click **"Disconnect"** next to Twitter/X
3. Click **"Connect"** again
4. Authorize the app (you should see write permissions requested)
5. Complete the OAuth flow

### Step 3: Verify OAuth Scopes

When you reconnect, ensure these scopes are requested:
- `tweet.read` - Read tweets
- `tweet.write` - **Write tweets (required for replies)**
- `users.read` - Read user info
- `offline.access` - Refresh tokens

These are already configured in the code at `src/app/api/social/[platform]/route.ts`:
```typescript
scope: 'tweet.read tweet.write users.read offline.access'
```

### Step 4: Test Again

1. Schedule a new Twitter post (or thread)
2. Wait for scheduled time
3. Trigger: `curl http://localhost:3000/api/posts/publish-scheduled`
4. Check server logs for detailed error messages

## Why This Happens

- **Immediate publishing works** because the token might have been issued with write permissions
- **Scheduled publishing fails** because:
  - The token might have been issued before write permissions were enabled
  - Or the token doesn't have reply-specific permissions
  - Or there's a difference in how the API is called

## Additional Checks

### Check Server Logs
When you trigger scheduled publishing, look for these log messages:
```
[Twitter API] Posting tweet for user <userId>, replyTo: <tweetId>
[Twitter API] Request body: { "text": "...", "reply": { "in_reply_to_tweet_id": "..." } }
[Twitter API] Response status: 401 Unauthorized
```

### Check Twitter Developer Portal
- Go to **Keys and tokens** → **Access Token and Secret**
- Verify the token has write permissions
- If not, regenerate tokens and reconnect

### Check Database
Query your `social_connections` table:
```sql
SELECT id, platform, "platformUsername", "isActive", "tokenExpiry"
FROM social_connections
WHERE platform = 'twitter';
```

Verify:
- `isActive` = `true`
- `tokenExpiry` is in the future
- Connection exists for the user

## Prevention

1. **Always request write permissions** when setting up OAuth
2. **Reconnect accounts** after enabling write permissions
3. **Test scheduled publishing** after any OAuth changes
4. **Monitor error logs** for 401 errors

## Next Steps

1. ✅ Verify Twitter app has "Read and write" permissions
2. ✅ Reconnect Twitter account in `/settings`
3. ✅ Test immediate publishing (should work)
4. ✅ Test scheduled publishing (should now work)
5. ✅ Check server logs for any remaining errors

If the issue persists after reconnecting, check the server logs for the exact Twitter API error message - it will provide more details about what's missing.


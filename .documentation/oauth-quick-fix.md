# Quick Fix: OAuth Not Configured

## Problem
You're seeing errors because the OAuth Client IDs and Secrets are not set in your environment variables.

## Solution

### Step 1: Check Current Error
When you click "Connect" for LinkedIn or Twitter, check:
1. **Browser Console** - Look for the error message
2. **Toast Notification** - Should show "LinkedIn OAuth not configured" or "Twitter/X OAuth not configured"

### Step 2: Set Up OAuth Apps (If Not Done Yet)

**LinkedIn:**
1. Go to https://www.linkedin.com/developers/
2. Create app → Get Client ID and Secret
3. Add redirect URI: `http://localhost:3000/api/social/linkedin/callback`

**Twitter/X:**
1. Go to https://developer.twitter.com/
2. Create app → Get Client ID and Secret  
3. Add redirect URI: `http://localhost:3000/api/social/twitter/callback`

# Quick Fix: OAuth Not Configured

## Problem
You're seeing errors because the OAuth Client IDs and Secrets are not set in your environment variables.

## Solution

### Step 1: Check Current Error
When you click "Connect" for LinkedIn or Twitter, check:
1. **Browser Console** - Look for the error message
2. **Toast Notification** - Should show "LinkedIn OAuth not configured" or "Twitter/X OAuth not configured"

### Step 2: Set Up OAuth Apps (If Not Done Yet)

**LinkedIn:**
1. Go to https://www.linkedin.com/developers/
2. Create app → Get Client ID and Secret
3. Add redirect URI: `http://localhost:3000/api/social/linkedin/callback`

**Twitter/X:**
1. Go to https://developer.twitter.com/
2. Create app → Get Client ID and Secret  
3. Add redirect URI: `http://localhost:3000/api/social/twitter/callback`

### Step 3: Add Environment Variables

Add these to your `.env` file in your project root:

```env
# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_actual_client_id_here
LINKEDIN_CLIENT_SECRET=your_actual_client_secret_here
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/social/linkedin/callback

# Twitter/X OAuth
TWITTER_CLIENT_ID=your_actual_client_id_here
TWITTER_CLIENT_SECRET=your_actual_client_secret_here
TWITTER_REDIRECT_URI=http://localhost:3000/api/social/twitter/callback

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 4: Restart Dev Server

After adding environment variables:
```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 5: Test Again

1. Go to `/settings`
2. Click "Connect" for LinkedIn or Twitter
3. Should redirect to OAuth authorization page
4. After authorizing, should redirect back and show "Connected"

## Common Issues

### "OAuth not configured" Error
- ✅ Environment variables not set
- ✅ Dev server not restarted after adding env vars
- ✅ Wrong file name (should be `.env`, not `.env.local`)

### LinkedIn Redirect Error
- Check redirect URI matches exactly in LinkedIn app settings
- Must be: `http://localhost:3000/api/social/linkedin/callback`

### Twitter/X Errors in Console
- The errors you're seeing (`api.x.com/1.1/onboarding/...`) are from Twitter's login page
- This happens when OAuth redirect fails
- Fix: Set `TWITTER_CLIENT_ID` and `TWITTER_CLIENT_SECRET` in `.env`

## Quick Test

After setting up, check the Network tab in browser DevTools:
1. Click "Connect" for LinkedIn
2. Look for `/api/social/linkedin` request
3. Should return `{ redirectUrl: "https://www.linkedin.com/oauth/v2/authorization?..." }`
4. If it returns an error, check the error message

### Step 4: Restart Dev Server

After adding environment variables:
```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 5: Test Again

1. Go to `/settings`
2. Click "Connect" for LinkedIn or Twitter
3. Should redirect to OAuth authorization page
4. After authorizing, should redirect back and show "Connected"

## Common Issues

### "OAuth not configured" Error
- ✅ Environment variables not set
- ✅ Dev server not restarted after adding env vars
- ✅ Wrong file name (should be `.env.local`, not `.env`)

### LinkedIn Redirect Error
- Check redirect URI matches exactly in LinkedIn app settings
- Must be: `http://localhost:3000/api/social/linkedin/callback`

### Twitter/X Errors in Console
- The errors you're seeing (`api.x.com/1.1/onboarding/...`) are from Twitter's login page
- This happens when OAuth redirect fails
- Fix: Set `TWITTER_CLIENT_ID` and `TWITTER_CLIENT_SECRET` in `.env.local`

## Quick Test

After setting up, check the Network tab in browser DevTools:
1. Click "Connect" for LinkedIn
2. Look for `/api/social/linkedin` request
3. Should return `{ redirectUrl: "https://www.linkedin.com/oauth/v2/authorization?..." }`
4. If it returns an error, check the error message


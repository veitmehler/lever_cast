# OAuth Troubleshooting Guide

## Your Current Status
✅ OAuth credentials are set in `.env` file
❌ LinkedIn connection fails
❌ Twitter/X shows console errors

## Step-by-Step Debugging

### 1. Verify Dev Server Has Loaded Environment Variables

**Important:** After adding/changing `.env` variables, you MUST restart the dev server:

```bash
# Stop server (Ctrl+C)
npm run dev
```

### 2. Check What Error You're Getting

When you click "Connect":

**For LinkedIn:**
- Check browser console for the API response
- Check toast notification for error message
- Common errors:
  - "LinkedIn OAuth not configured" → Server didn't load env vars
  - "redirect_uri_mismatch" → Redirect URI doesn't match LinkedIn app settings
  - "invalid_client" → Client ID/Secret incorrect

**For Twitter:**
- The console errors (`api.x.com/1.1/onboarding/...`) are from Twitter's login page
- This means the OAuth redirect IS working, but Twitter's page is having issues
- Check Network tab → Look for `/api/social/twitter` request → Check response

### 3. Verify LinkedIn App Configuration

Go to https://www.linkedin.com/developers/ → Your App → Auth:

1. **Redirect URLs** must include EXACTLY:
   ```
   http://localhost:3000/api/social/linkedin/callback
   ```
   - No trailing slash
   - Must match exactly (case-sensitive)

2. **Products** must have:
   - ✅ Sign In with LinkedIn using OpenID Connect
   - ✅ Share on LinkedIn (for posting)

3. **Scopes** should include:
   - `openid`
   - `profile`
   - `email`
   - `w_member_social`

### 4. Verify Twitter/X App Configuration

Go to https://developer.twitter.com/ → Your App → Settings → User authentication settings:

1. **Callback URI / Redirect URL** must include EXACTLY:
   ```
   http://localhost:3000/api/social/twitter/callback
   ```
   - No trailing slash
   - Must match exactly

2. **App permissions** must be:
   - ✅ Read and write (for posting tweets)

3. **Type of App**: Web App

4. **OAuth 2.0** must be enabled

### 5. Test the OAuth Flow Manually

**Test LinkedIn:**
1. Open browser DevTools → Network tab
2. Click "Connect" for LinkedIn
3. Look for `/api/social/linkedin` request
4. Check response:
   - ✅ Should return: `{ redirectUrl: "https://www.linkedin.com/oauth/v2/authorization?..." }`
   - ❌ If error: Check error message

**Test Twitter:**
1. Open browser DevTools → Network tab
2. Click "Connect" for Twitter
3. Look for `/api/social/twitter` request
4. Check response:
   - ✅ Should return: `{ redirectUrl: "https://twitter.com/i/oauth2/authorize?..." }`
   - ❌ If error: Check error message

### 6. Check Server Logs

Look at your terminal where `npm run dev` is running:

- If you see "LinkedIn OAuth not configured" → Environment variables not loaded
- If you see other errors → Check the error details

### 7. Common Fixes

**Issue: "OAuth not configured" error**
- ✅ Restart dev server after adding `.env` variables
- ✅ Check `.env` file is in project root (same level as `package.json`)
- ✅ Check variable names are correct (no typos)

**Issue: LinkedIn redirect error**
- ✅ Verify redirect URI in LinkedIn app matches exactly
- ✅ Check for trailing slashes
- ✅ Ensure "Share on LinkedIn" product is approved

**Issue: Twitter console errors**
- ✅ These are Twitter's internal errors, not ours
- ✅ Try in incognito/private window
- ✅ Clear browser cache
- ✅ Check Twitter app settings match exactly

**Issue: Twitter login page doesn't show password field**
- ✅ This is a Twitter UI issue, not our code
- ✅ Try different browser
- ✅ Check if Twitter account is already logged in
- ✅ Try logging out of Twitter first, then connecting

## Quick Test Checklist

- [ ] Restarted dev server after adding `.env` variables
- [ ] LinkedIn redirect URI matches exactly in LinkedIn app
- [ ] Twitter redirect URI matches exactly in Twitter app
- [ ] LinkedIn "Share on LinkedIn" product is approved
- [ ] Twitter app has "Read and write" permissions
- [ ] Checked Network tab for actual API responses
- [ ] Checked server terminal for error messages

## Next Steps

1. **Restart dev server** (most common fix)
2. **Check Network tab** to see actual API responses
3. **Verify redirect URIs** match exactly in developer portals
4. **Try in incognito window** to rule out browser cache issues


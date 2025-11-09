# Testing OAuth & Publishing - Next Steps

## ✅ Current Status
- LinkedIn OAuth: Connected
- Twitter/X OAuth: Connected
- Tokens stored in database
- Ready to test publishing!

## Step 1: Test Publishing to LinkedIn

1. **Go to Dashboard**: http://localhost:3000/dashboard
2. **Create a Test Post**:
   - Enter a test idea (e.g., "Testing LinkedIn publishing from LeverCast")
   - Select platform: **LinkedIn** (or "Both")
   - Click "Generate"
3. **Publish**:
   - Review the generated content
   - Click "Publish" button on LinkedIn preview
   - Should see success message
   - Check your LinkedIn feed - post should appear!

## Step 2: Test Publishing to Twitter/X

1. **Create a Test Post**:
   - Enter a test idea
   - Select platform: **Twitter** (or "Both")
   - Click "Generate"
2. **Publish**:
   - Review the generated content
   - Click "Publish" button on Twitter preview
   - Should see success message
   - Check your Twitter feed - tweet should appear!

## Step 3: Test Twitter Thread

1. **Create a Thread**:
   - Enter a test idea
   - Select platform: **Twitter**
   - Select format: **Thread** (not Single Post)
   - Click "Generate"
2. **Publish Thread**:
   - Should see summary post + multiple reply posts
   - Click "Publish"
   - Check Twitter - should see summary tweet + replies

## Step 4: Test Scheduled Publishing

1. **Schedule a Post**:
   - Create a post
   - Click "Schedule" instead of "Publish"
   - Set time 1-2 minutes in the future
   - Save
2. **Verify Scheduled**:
   - Go to `/posts` page
   - Check "Scheduled" tab
   - Post should appear there
3. **Trigger Publishing**:
   - Wait for scheduled time, OR
   - Manually call: `curl http://localhost:3000/api/posts/publish-scheduled`
   - Post should move to "Published" tab
   - Check platform - post should appear!

## Step 5: Verify Database Records

Check that posts are being saved correctly:

1. **Published Posts**:
   - Go to `/posts` → "Published" tab
   - Should see posts with platform badges
   - Click on a post to see details

2. **Database Check** (optional):
   - Check `posts` table in database
   - Should see records with:
     - `platform`: "linkedin" or "twitter"
     - `status`: "published"
     - `postUrl`: URL to the published post
     - `publishedAt`: Timestamp

## Step 6: Test Error Handling

1. **Disconnect Platform**:
   - Go to `/settings`
   - Click "Disconnect" for LinkedIn or Twitter
   - Try to publish - should show error: "Account not connected"

2. **Reconnect**:
   - Click "Connect" again
   - Should work seamlessly

## Common Issues & Fixes

### "Account not connected" Error
- ✅ Platform was disconnected
- ✅ Fix: Reconnect in Settings

### "Access token expired" Error
- ✅ Token expired (LinkedIn tokens expire after 60 days)
- ✅ Fix: Reconnect the account

### Publishing Fails Silently
- ✅ Check browser console for errors
- ✅ Check server terminal logs
- ✅ Verify OAuth tokens are valid
- ✅ Check platform API status

### Post Doesn't Appear on Platform
- ✅ Check `postUrl` in database - verify it's correct
- ✅ Check platform feed manually
- ✅ Verify post wasn't flagged/spam filtered

## What to Verify

- [ ] LinkedIn post publishes successfully
- [ ] Twitter post publishes successfully
- [ ] Twitter thread publishes correctly (summary + replies)
- [ ] Scheduled posts work
- [ ] Posts appear in `/posts` page
- [ ] Post URLs are saved correctly
- [ ] Error handling works (disconnect → try publish)

## Next Steps After Testing

1. ✅ OAuth & Publishing: Working
2. ⏳ Test with real content (not just test posts)
3. ⏳ Monitor for any edge cases
4. ⏳ Set up production OAuth apps
5. ⏳ Deploy to production
6. ⏳ Set up cron job for scheduled posts

## Production Checklist

Before deploying:
- [ ] Update redirect URIs in LinkedIn app to production domain
- [ ] Update redirect URIs in Twitter app to production domain
- [ ] Add production environment variables in Vercel
- [ ] Update `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Set up Vercel Cron job (or external cron service)
- [ ] Test OAuth flow on production domain
- [ ] Test publishing on production


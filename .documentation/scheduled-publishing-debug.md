# Scheduled Publishing Debugging Guide

## Issue: Scheduled Posts Don't Publish Automatically

### Root Cause
**Vercel Cron only runs in production**, not in local development. So scheduled posts won't automatically publish when testing locally.

### Solutions

#### Option 1: Test Locally (Manual Trigger)
To test scheduled publishing locally, manually call the endpoint:

```bash
# In browser console or terminal:
fetch('http://localhost:3000/api/posts/publish-scheduled')
  .then(r => r.json())
  .then(console.log)
```

Or use curl:
```bash
curl http://localhost:3000/api/posts/publish-scheduled
```

#### Option 2: Deploy to Vercel
1. Deploy your app to Vercel
2. Vercel Cron will automatically run every minute
3. Scheduled posts will publish automatically

#### Option 3: Set Up Local Cron (Development)
For local testing, you can set up a cron job:

**macOS/Linux:**
```bash
# Add to crontab (runs every minute)
* * * * * curl http://localhost:3000/api/posts/publish-scheduled
```

**Or use a Node.js script:**
```javascript
// scripts/local-cron.js
setInterval(async () => {
  try {
    const response = await fetch('http://localhost:3000/api/posts/publish-scheduled')
    const data = await response.json()
    console.log('Cron result:', data)
  } catch (error) {
    console.error('Cron error:', error)
  }
}, 60000) // Every minute
```

## Testing Scheduled Publishing

### Step 1: Schedule a Post
1. Create a post on Dashboard
2. Click "Schedule" (not "Publish")
3. Set time 1-2 minutes in the future
4. Save

### Step 2: Verify It's Scheduled
1. Go to `/posts` → "Scheduled" tab
2. Post should appear there
3. Check database: `status` should be `'scheduled'`, `scheduledAt` should be set

### Step 3: Trigger Publishing
**Local Development:**
- Manually call: `curl http://localhost:3000/api/posts/publish-scheduled`
- Or wait for local cron job (if set up)

**Production:**
- Vercel Cron runs automatically every minute
- No manual action needed

### Step 4: Verify Publishing
1. Check `/posts` → "Published" tab
2. Post should appear there
3. Check platform (LinkedIn/Twitter) - post should be live
4. Check database: `status` should be `'published'`, `publishedAt` should be set

## Common Issues

### Issue: Route Returns 404
**Cause**: Next.js routing issue or dev server needs restart
**Fix**: 
- Restart dev server
- Check route file exists: `src/app/api/posts/publish-scheduled/route.ts`

### Issue: "No scheduled posts due for publishing"
**Cause**: 
- No posts with `status: 'scheduled'` and `scheduledAt <= now`
- Or `scheduledAt` is in the future
**Fix**:
- Check database for scheduled posts
- Verify `scheduledAt` timestamp is correct
- Check timezone issues

### Issue: Posts Don't Publish Even After Scheduled Time
**Cause**: 
- Cron job not running (local development)
- Or cron job failing silently
**Fix**:
- Check Vercel Cron logs (production)
- Manually trigger endpoint to test
- Check server logs for errors

### Issue: Twitter Thread Replies Don't Publish
**Cause**: 
- Parent post not published yet
- Or `replyToTweetId` not being passed
**Fix**:
- Ensure summary post publishes first
- Replies will publish on next cron run after summary is published
- Check that parent post has `postUrl` set (contains tweet ID)

## Debugging Steps

1. **Check Database**:
   ```sql
   SELECT id, platform, status, "scheduledAt", "publishedAt", "parentPostId"
   FROM posts
   WHERE status = 'scheduled'
   ORDER BY "scheduledAt" ASC;
   ```

2. **Check Cron Endpoint**:
   ```bash
   curl http://localhost:3000/api/posts/publish-scheduled
   ```
   Should return JSON with `processed`, `published`, `failed` arrays

3. **Check Server Logs**:
   - Look for errors in terminal where `npm run dev` is running
   - Check for "Error publishing post" messages

4. **Check Vercel Logs** (Production):
   - Go to Vercel Dashboard → Your Project → Logs
   - Look for cron job executions
   - Check for errors

## Production Setup

### Vercel Cron Configuration
The `vercel.json` file is already configured:
```json
{
  "crons": [
    {
      "path": "/api/posts/publish-scheduled",
      "schedule": "* * * * *"
    }
  ]
}
```

### Environment Variables
Make sure `CRON_SECRET` is set in Vercel:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: `CRON_SECRET=your-secret-key`
3. Redeploy

### Verify Cron is Running
1. Deploy to Vercel
2. Check Vercel Dashboard → Cron Jobs
3. Should see `/api/posts/publish-scheduled` running every minute
4. Check logs for execution results


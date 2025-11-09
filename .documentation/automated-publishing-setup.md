# Automated Scheduled Post Publishing Setup

## Overview
This document explains how to set up automated publishing for scheduled posts.

## Current Status
✅ **API Route Created**: `/api/posts/publish-scheduled`
- Checks for scheduled posts where `scheduledAt <= now`
- Publishes them using `publishToPlatform()` (currently mock, will use real APIs when integrated)
- Updates post status and draft status accordingly
- Handles Twitter thread replies (publishes after parent post)

## Setup Options

### Option 1: Vercel Cron (Recommended for Vercel deployments)

**File**: `vercel.json` (already created)

The cron job is configured to run every minute:
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

**Steps**:
1. Deploy to Vercel
2. Set `CRON_SECRET` environment variable in Vercel dashboard
3. Vercel will automatically call the endpoint every minute
4. The endpoint will check for scheduled posts and publish them

**Security**: 
- Vercel automatically includes the `CRON_SECRET` in the Authorization header
- The route validates this secret before processing

### Option 2: External Cron Service

If not using Vercel, you can use external cron services:

**Examples**:
- **Cron-job.org**: Free cron service
- **EasyCron**: Paid cron service
- **GitHub Actions**: Free for public repos
- **AWS EventBridge**: For AWS deployments

**Setup**:
1. Create a cron job that calls: `GET https://yourdomain.com/api/posts/publish-scheduled`
2. Set Authorization header: `Bearer YOUR_CRON_SECRET`
3. Schedule to run every minute: `* * * * *`

### Option 3: Manual Testing

For development/testing, you can call the endpoint manually:

```bash
# Without authentication (development only)
curl http://localhost:3000/api/posts/publish-scheduled

# With authentication (production)
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://yourdomain.com/api/posts/publish-scheduled
```

## Environment Variables

Add to your `.env` file:
```env
CRON_SECRET=your-secret-key-here
```

**Important**: 
- Use a strong, random secret key
- Never commit this to git
- Set it in your hosting platform's environment variables

## How It Works

1. **Cron Job** calls `/api/posts/publish-scheduled` every minute
2. **Route** queries database for posts where:
   - `status = 'scheduled'`
   - `scheduledAt <= now`
3. **For each post**:
   - If it's a Twitter thread reply, check if parent is published first
   - Call `publishToPlatform()` (mock now, real API later)
   - Update post status to 'published' or 'failed'
   - Update draft status if all platforms are published
4. **Returns** summary of processed posts

## Current Limitations

⚠️ **Mock Publishing**: Currently uses `publishToPlatform()` mock function
- When real social media APIs are integrated, this will automatically use them
- No code changes needed to the cron route

## Testing

1. Schedule a post for a time in the past (or very near future)
2. Wait for the cron job to run (or call manually)
3. Check the `/posts` page - the post should move from "Scheduled" to "Published"
4. Check the response from the endpoint for processing details

## Monitoring

The endpoint returns:
```json
{
  "message": "Processed 2 scheduled post(s)",
  "processed": 2,
  "published": ["post-id-1", "post-id-2"],
  "failed": [],
  "timestamp": "2024-11-07T..."
}
```

Monitor this endpoint's responses to track:
- How many posts were processed
- Which posts succeeded/failed
- Any errors that occurred

## Next Steps

1. ✅ Cron infrastructure is ready
2. ⏳ Integrate real social media APIs (LinkedIn, Twitter/X)
3. ⏳ Replace `publishToPlatform()` mock with real API calls
4. ⏳ Add retry logic for failed posts
5. ⏳ Add notifications for users when posts are published/failed


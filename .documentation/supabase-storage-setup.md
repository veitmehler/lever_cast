# Supabase Storage Setup Guide

## Overview

Images are now stored in Supabase Storage instead of the database as base64 strings. This provides:
- ✅ **Cost savings**: Object storage is ~10x cheaper than database storage
- ✅ **Better performance**: Faster queries, smaller database size
- ✅ **Scalability**: Handles large images efficiently
- ✅ **CDN delivery**: Supabase Storage URLs are served via CDN

---

## Step 1: Create Supabase Storage Bucket

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Storage** in the sidebar
4. Click **"New bucket"**
5. Configure:
   - **Name**: `post-images` (must match exactly)
   - **Public bucket**: ✅ **Enable** (so images are publicly accessible)
   - **File size limit**: 10MB (recommended)
   - **Allowed MIME types**: `image/*` (or specific types like `image/jpeg,image/png,image/webp`)
6. Click **"Create bucket"**

---

## Step 2: Set Up Storage Policies (Security)

Since we're using **Clerk for authentication** (not Supabase Auth), we have two options:

### Option A: Use Service Role Key (Recommended for Production)

**Best for**: Production apps with proper API route security

1. **No RLS policies needed** - Service role key bypasses RLS
2. **API routes validate ownership** - Our `/api/images/upload` route verifies user via Clerk
3. **More secure** - Service role key never exposed to client

**Setup**:
- Add `SUPABASE_SERVICE_ROLE_KEY` to `.env` (see Step 3)
- API routes will use service role key automatically
- Users can only upload/delete their own images (validated by API route)

### Option B: Use Anon Key with RLS (Alternative)

**Best for**: Development or if you prefer RLS-based security

1. Go to **Storage** → **Policies** → **post-images**
2. Click **"New Policy"**
3. Create **Upload Policy**:
   - **Policy name**: `Public can upload images`
   - **Allowed operation**: INSERT
   - **Policy definition**:
     ```sql
     bucket_id = 'post-images'::text
     ```
   - ⚠️ **Note**: This allows anyone to upload. Our API route validates user ownership.
4. Create **Delete Policy**:
   - **Policy name**: `Public can delete images`
   - **Allowed operation**: DELETE
   - **Policy definition**:
     ```sql
     bucket_id = 'post-images'::text
     ```
5. Create **Select Policy** (for public access):
   - **Policy name**: `Public can view images`
   - **Allowed operation**: SELECT
   - **Policy definition**:
     ```sql
     bucket_id = 'post-images'::text
     ```

**Recommendation**: Use **Option A** (Service Role Key) for production. It's more secure and doesn't require complex RLS policies.

---

## Step 3: Add Environment Variables

Add these to your `.env` file:

```bash
# Supabase Storage (for image uploads)
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]

# Optional: Service Role Key (for server-side operations, bypasses RLS)
# Recommended for production - provides better security
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
```

### How to Get These Values:

1. Go to Supabase Dashboard → **Settings** → **API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

**Important**: 
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are **public** keys (safe to expose in client-side code)
- `SUPABASE_SERVICE_ROLE_KEY` is **secret** - never commit to git or expose to client
- The service role key bypasses RLS, so our API routes validate user ownership via Clerk

---

## Step 4: Verify Setup

1. **Test Upload**:
   - Go to Dashboard
   - Try uploading an image
   - Check Supabase Storage → `post-images` bucket
   - You should see a folder with your user ID containing the image

2. **Test Delete**:
   - Remove an image from a post
   - Verify it's deleted from Storage

3. **Check URLs**:
   - Image URLs should look like:
     ```
     https://[project-ref].supabase.co/storage/v1/object/public/post-images/[userId]/[timestamp]-[random].jpg
     ```

---

## Migration from Base64

Existing drafts with base64 images will continue to work (they're displayed as-is). When users:
- **Upload a new image**: It goes to Supabase Storage
- **Remove an old base64 image**: It's deleted from the database
- **Replace a base64 image**: Old base64 is replaced with new Storage URL

**Optional**: Create a migration script to convert existing base64 images to Storage (not required, but recommended for production).

---

## Troubleshooting

### "Failed to upload image: new row violates row-level security policy"
- **Cause**: Storage policies not set up correctly
- **Fix**: Verify RLS policies are created (Step 2)

### "Bucket not found"
- **Cause**: Bucket name doesn't match
- **Fix**: Ensure bucket is named exactly `post-images` (case-sensitive)

### "Unauthorized" error
- **Cause**: Missing or incorrect environment variables
- **Fix**: Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

### Images not displaying
- **Cause**: Bucket not set to public, or RLS policy blocking SELECT
- **Fix**: Enable public bucket and add SELECT policy (Step 2)

---

## Cost Estimate

**Supabase Free Tier**:
- 1GB storage
- 2GB bandwidth/month
- Perfect for development/testing

**Supabase Pro** ($25/month):
- 100GB storage
- 200GB bandwidth/month
- More than enough for most production apps

**Cost Comparison** (for 10GB of images):
- Database storage: ~$1.25/month + slower queries
- Supabase Storage: ~$0.21/month + CDN delivery
- **Savings: ~84%**

---

## Next Steps

1. ✅ Set up Storage bucket
2. ✅ Configure RLS policies
3. ✅ Add environment variables
4. ✅ Test upload/delete
5. ⏳ (Optional) Migrate existing base64 images to Storage

---

**Last Updated**: December 2024  
**Status**: ✅ Supabase Storage Integration Complete


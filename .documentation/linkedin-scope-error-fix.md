# LinkedIn OAuth Scope Error Fix

## Problem
You're seeing this error:
```
unauthorized_scope_error
Scope "w_member_social" is not authorized for your application
```

## Root Cause
The `w_member_social` scope is required for posting content to LinkedIn, but your LinkedIn app doesn't have access to it yet. This scope is granted through LinkedIn's "Share on LinkedIn" product.

## Solution: Request "Share on LinkedIn" Product Access

### Step 1: Go to LinkedIn Developers
1. Visit: https://www.linkedin.com/developers/
2. Sign in with your LinkedIn account
3. Select your app (the one with Client ID: `78r77yrjpykzei`)

### Step 2: Request Product Access
1. Click on the **"Products"** tab in your app dashboard
2. Look for **"Share on LinkedIn"** product
3. Click **"Request access"** or **"Apply"**
4. Fill out the application form:
   - **Use case**: Explain that you're building a social media management tool
   - **How you'll use it**: Post content on behalf of users
   - **User experience**: Users authorize your app to post to their LinkedIn

### Step 3: Wait for Approval
- LinkedIn typically reviews applications within **2-5 business days**
- You'll receive an email when approved
- Once approved, the `w_member_social` scope will be available

### Step 4: Test Again
After approval:
1. Try connecting LinkedIn again
2. The OAuth flow should work without the scope error

## Temporary Workaround (Testing Only)

If you want to test the OAuth flow **without posting capabilities**, you can temporarily remove the `w_member_social` scope:

**File**: `src/app/api/social/[platform]/route.ts`

Change:
```typescript
scope: 'openid profile email w_member_social',
```

To:
```typescript
scope: 'openid profile email', // w_member_social removed temporarily
```

**Note**: This will allow you to connect, but you won't be able to post content. You'll need to add `w_member_social` back after approval.

## What Each Scope Does

- `openid`: Required for OAuth 2.0 authentication
- `profile`: Access to user's basic profile information
- `email`: Access to user's email address
- `w_member_social`: **Required for posting content** - needs product approval

## Next Steps

1. ✅ Request "Share on LinkedIn" product access
2. ⏳ Wait for LinkedIn approval (2-5 days)
3. ✅ Test OAuth connection again after approval
4. ✅ Test posting functionality

## Reference
- LinkedIn Products: https://www.linkedin.com/developers/apps
- Share on LinkedIn Documentation: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/ugc-post-api


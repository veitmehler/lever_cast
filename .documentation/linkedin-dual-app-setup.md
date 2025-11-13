# LinkedIn Dual App Setup Guide

## Overview

If you want to support both **Personal Profiles** and **Company Pages**, you'll need to maintain **two separate LinkedIn apps** because:
- Personal Profiles require "Share on LinkedIn" product
- Company Pages require "Community Management API" product
- These products **cannot be combined** in a single app

## Environment Variables Required

You'll need to add **new environment variables** for the Company Pages app:

### Current (Personal Profiles Only)
```env
LINKEDIN_CLIENT_ID=your_personal_profiles_client_id
LINKEDIN_CLIENT_SECRET=your_personal_profiles_client_secret
LINKEDIN_REDIRECT_URI=https://yourdomain.com/api/social/linkedin/callback
```

### Additional (For Company Pages)
```env
# LinkedIn Company Pages App (separate app)
LINKEDIN_COMPANY_CLIENT_ID=your_company_pages_client_id
LINKEDIN_COMPANY_CLIENT_SECRET=your_company_pages_client_secret
LINKEDIN_COMPANY_REDIRECT_URI=https://yourdomain.com/api/social/linkedin/company/callback
```

## Implementation Changes Needed

### 1. Update OAuth Routes

**File:** `src/app/api/social/[platform]/route.ts`

Add logic to select the correct app based on user's choice:

```typescript
// Add new environment variables
const LINKEDIN_COMPANY_CLIENT_ID = process.env.LINKEDIN_COMPANY_CLIENT_ID
const LINKEDIN_COMPANY_CLIENT_SECRET = process.env.LINKEDIN_COMPANY_CLIENT_SECRET
const LINKEDIN_COMPANY_REDIRECT_URI = process.env.LINKEDIN_COMPANY_REDIRECT_URI || 
  `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/social/linkedin/company/callback`

// In the LinkedIn OAuth flow, check if user wants Company Pages
if (platform === 'linkedin') {
  // Check if this is for Company Pages (could be passed as query param or in request body)
  const isCompanyPage = request.nextUrl.searchParams.get('target') === 'company'
  
  const clientId = isCompanyPage ? LINKEDIN_COMPANY_CLIENT_ID : LINKEDIN_CLIENT_ID
  const redirectUri = isCompanyPage ? LINKEDIN_COMPANY_REDIRECT_URI : LINKEDIN_REDIRECT_URI
  
  if (!clientId) {
    return NextResponse.json(
      { error: 'LinkedIn OAuth not configured. Please set LinkedIn Client ID environment variable.' },
      { status: 500 }
    )
  }
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    // Request appropriate scopes
    scope: isCompanyPage 
      ? 'openid profile email w_organization_social'  // Company Pages
      : 'openid profile email w_member_social',      // Personal Profiles
  })
  
  redirectUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
}
```

### 2. Update Callback Route

**File:** `src/app/api/social/[platform]/callback/route.ts`

Handle both callback URLs and use the correct credentials:

```typescript
// Add new environment variables
const LINKEDIN_COMPANY_CLIENT_ID = process.env.LINKEDIN_COMPANY_CLIENT_ID
const LINKEDIN_COMPANY_CLIENT_SECRET = process.env.LINKEDIN_COMPANY_CLIENT_SECRET

// In the callback handler, determine which app was used
if (platform === 'linkedin') {
  // Check if this is the company callback (could check URL path or query param)
  const isCompanyCallback = request.nextUrl.pathname.includes('/company/callback')
  
  const clientId = isCompanyCallback ? LINKEDIN_COMPANY_CLIENT_ID : LINKEDIN_CLIENT_ID
  const clientSecret = isCompanyCallback ? LINKEDIN_COMPANY_CLIENT_SECRET : LINKEDIN_CLIENT_SECRET
  
  if (!clientId || !clientSecret) {
    return redirectWithCleanup('/settings?error=oauth_not_configured')
  }
  
  // Exchange code for token using correct credentials
  const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: isCompanyCallback ? LINKEDIN_COMPANY_REDIRECT_URI : LINKEDIN_REDIRECT_URI,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })
  
  // Store connection with a flag indicating which app was used
  // You might want to add a field to SocialConnection model: appType: 'personal' | 'company'
}
```

### 3. Update Database Schema (Optional but Recommended)

**File:** `prisma/schema.prisma`

Add a field to track which app was used:

```prisma
model SocialConnection {
  // ... existing fields ...
  appType String? // 'personal' | 'company' - for LinkedIn to distinguish between apps
  // ... rest of fields ...
}
```

### 4. Update Settings UI

**File:** `src/app/(protected)/settings/page.tsx`

Add UI to let users choose between Personal Profile and Company Page:

```typescript
// Add buttons/options for:
// - "Connect Personal Profile" (uses LINKEDIN_CLIENT_ID)
// - "Connect Company Page" (uses LINKEDIN_COMPANY_CLIENT_ID)
```

### 5. Update Posting Logic

**File:** `src/lib/linkedinApi.ts`

When posting, check which app/connection to use:

```typescript
export async function postToLinkedIn(
  userId: string,
  content: string,
  imageUrl?: string,
  targetType?: 'personal' | 'company' // Add parameter
) {
  // Get the appropriate connection based on targetType
  const connection = await getSocialConnection(
    userId, 
    'linkedin',
    targetType // Pass target type if you store it
  )
  
  // Rest of the posting logic...
}
```

## Alternative: Simpler Approach

If you want to keep it simpler, you could:

1. **Keep current app for Personal Profiles** (no changes needed)
2. **Create a separate Company Pages app** but handle it as a completely separate platform
3. **Store Company Pages connections separately** (maybe as platform: 'linkedin-company')

This way, you don't need to modify the existing LinkedIn OAuth flow - just add a new platform type.

## Summary

**Yes, you need to add Client ID and Client Secret for the 2nd app:**

1. ✅ Add `LINKEDIN_COMPANY_CLIENT_ID` to environment variables
2. ✅ Add `LINKEDIN_COMPANY_CLIENT_SECRET` to environment variables  
3. ✅ Add `LINKEDIN_COMPANY_REDIRECT_URI` to environment variables
4. ✅ Update OAuth routes to use correct credentials based on user's choice
5. ✅ Update callback handler to use correct credentials
6. ✅ Optionally update database schema to track which app was used
7. ✅ Update UI to let users choose Personal Profile vs Company Page

## Recommendation

**For most users:** Stick with Personal Profiles only (simpler, no additional setup needed)

**For users needing Company Pages:** Consider implementing the dual-app approach, but be aware it adds complexity to your codebase.


# LinkedIn API Implementation Review

**Date:** 2025-01-XX  
**Based on:** Current implementation + LinkedIn API best practices  
**Reference:** `.documentation/linkedin_api_docs.pdf`

## Current Implementation Summary

### Endpoints Used

1. **OAuth Authorization:** `https://www.linkedin.com/oauth/v2/authorization`
2. **Token Exchange:** `https://www.linkedin.com/oauth/v2/accessToken`
3. **User Profile:** `https://api.linkedin.com/v2/userinfo`
4. **Fetch Organizations:** `https://api.linkedin.com/v2/organizationalEntityAcls` ✅ **UPDATED** (was `organizationAcls`)
5. **Post Content:** `https://api.linkedin.com/v2/ugcPosts`
6. **Image Upload:** `https://api.linkedin.com/v2/assets?action=registerUpload`

### Current Scopes

- `openid` - Required for OAuth 2.0
- `profile` - Basic profile information
- `email` - User email address
- `w_member_social` - Post to personal profile (requires "Share on LinkedIn" product)

### Missing Scopes (for Company Pages)

- `w_organization_social` - Post to Company Pages (requires separate approval)
- `rw_organization_admin` - Full organization management (may be required for some endpoints)

## Key Findings & Recommendations

### 1. Organization Pages Endpoint

**Current Implementation (UPDATED):**
```typescript
// src/app/api/social/[platform]/pages/route.ts
const orgsResponse = await fetch(
  `${LINKEDIN_API_BASE}/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED&projection=(elements*(organizationalTarget~(id,name,vanityName)))`,
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  }
)
```

**Status:** ✅ **CORRECTED** - Updated to use the correct endpoint name per LinkedIn API documentation.

**Changes Made:**
- ✅ Changed endpoint from `/organizationAcls` to `/organizationalEntityAcls` (correct endpoint name)
- ✅ Changed projection field from `organization` to `organizationalTarget` (correct field name per API docs)
- ✅ Updated response parsing to use `element.organizationalTarget` instead of `element.organization`

**Required Permissions:**
- The `/organizationalEntityAcls` endpoint requires `w_organization_social` scope OR `rw_organization_admin` scope
- The user must have ADMINISTRATOR role in the organization
- The organization must be in APPROVED state
- Requires "Marketing Developer Platform (MDP)" product approval

**Note:** The 403 error you're seeing is expected because:
1. We're only requesting `w_member_social` scope (personal profiles only)
2. Company Pages require `w_organization_social` scope
3. This scope requires separate product approval from LinkedIn

### 2. Scope Confusion

**Issue:** There's a discrepancy in error messages:
- Error message says: `"Marketing Developer Platform" product and rw_organization_admin scope`
- Code comments say: `w_organization_social scope`
- Web search suggests: Both might be needed depending on use case

**IMPORTANT UPDATE (2024):**
- **"Share on LinkedIn"** product → `w_member_social` scope (personal profiles) ✅
- **"Marketing Developer Platform (MDP)"** was **DEPRECATED in April 2024** ❌
- **"Community Management API"** → New product for Company Pages (replaces MDP) ✅
- **Requirement:** Community Management API requires a **separate LinkedIn app** (cannot be combined with other products)
- Both scopes (`w_organization_social` and `rw_organization_admin`) are valid for organization access
- `w_organization_social` is sufficient for posting to Company Pages
- `rw_organization_admin` provides additional organization management capabilities

**Recommendation:** Update error messages to be consistent:
- Use `w_organization_social` for posting to Company Pages (most common)
- Use `rw_organization_admin` only if full organization management is needed

### 3. Posting to Company Pages

**Current Implementation:**
```typescript
// src/lib/linkedinApi.ts
if (connection.postTargetType === 'page' && connection.selectedPageId) {
  authorUrn = `urn:li:organization:${connection.selectedPageId}`
} else {
  authorUrn = `urn:li:person:${profile.sub}`
}
```

**Status:** ✅ **CORRECT** - Using organization URN for Company Pages is correct.

**Required Permissions:**
- Posting to Company Pages requires `w_organization_social` scope
- The user must have permission to post on behalf of the organization
- The organization URN format `urn:li:organization:{id}` is correct

### 4. Image Upload

**Current Implementation:**
```typescript
// Uses /assets?action=registerUpload endpoint
// Owner is set to personUrn (even for Company Pages)
```

**Potential Issue:** ⚠️ **NEEDS REVIEW**

For Company Pages, the image owner might need to be the organization URN instead of person URN. According to LinkedIn API docs:
- Personal posts: Owner should be `urn:li:person:{id}`
- Company Page posts: Owner might need to be `urn:li:organization:{id}` OR `urn:li:person:{id}` (depending on API version)

**Recommendation:** Test with organization URN as owner when posting to Company Pages.

### 5. API Version

**Current:** Using `https://api.linkedin.com/v2` (no version specified in path)

**Status:** ✅ **CORRECT** - LinkedIn v2 API is the current stable version.

**Note:** LinkedIn uses Rest.li protocol version header (`X-Restli-Protocol-Version: 2.0.0`) which we're already using.

### 6. Error Handling

**Current Implementation:**
- Returns empty array `[]` for 403/401/400 errors when fetching pages
- Shows helpful error messages in UI
- Falls back gracefully

**Status:** ✅ **GOOD** - Error handling is appropriate.

## Recommendations

### Immediate Actions

1. **Clarify Scope Requirements:**
   - Update error messages to consistently mention `w_organization_social` for Company Pages
   - Document that "Marketing Developer Platform" product is needed (not just "Share on LinkedIn")

2. **Test Image Upload for Company Pages:**
   - Verify if image owner should be organization URN or person URN
   - Update `uploadImageToLinkedIn` to accept `authorUrn` parameter

3. **Add Scope Detection:**
   - When fetching pages fails with 403, check if it's a scope issue
   - Provide more specific error messages based on the error code

### Future Enhancements

1. **Token Refresh:**
   - Implement LinkedIn token refresh (currently TODO)
   - LinkedIn tokens expire after 60 days

2. **Analytics:**
   - Implement proper LinkedIn analytics fetching
   - Requires `r_member_social` or `r_organization_social` scope (currently restricted)

3. **Multiple Organizations:**
   - Support users with multiple Company Pages
   - Allow switching between organizations

## Questions for PDF Review

Since I cannot read the PDF directly, please verify:

1. **Organization Pages Endpoint:**
   - Is `/organizationAcls` still the correct endpoint?
   - Are there any newer endpoints for fetching organizations?

2. **Scopes:**
   - What is the exact difference between `w_organization_social` and `rw_organization_admin`?
   - Which one is required for posting to Company Pages?

3. **Image Upload:**
   - For Company Page posts, should the image owner be the organization URN or person URN?
   - Are there any special requirements for Company Page image uploads?

4. **Products:**
   - Is "Marketing Developer Platform" the correct product name?
   - Are there any other products needed for Company Pages?

5. **API Version:**
   - Are we using the latest API version?
   - Are there any deprecated endpoints we should avoid?

## Conclusion

After reviewing the LinkedIn API documentation (`linkedin_api_docs.md`), I found and fixed **critical issues**:

### ✅ Issues Fixed

1. **Wrong Endpoint Name:**
   - ❌ Was using: `/organizationAcls`
   - ✅ Correct: `/organizationalEntityAcls`
   - **Impact:** This was likely causing the 403 error even with correct scopes

2. **Wrong Projection Field:**
   - ❌ Was using: `organization~(id,name,vanityName)`
   - ✅ Correct: `organizationalTarget~(id,name,vanityName)`
   - **Impact:** Response parsing would fail even if endpoint worked

3. **Wrong Response Field:**
   - ❌ Was using: `element.organization`
   - ✅ Correct: `element.organizationalTarget`
   - **Impact:** Would cause runtime errors when parsing response

### 📋 Confirmed from API Docs

1. **Product Names:**
   - ✅ "Share on LinkedIn" → `w_member_social` (personal profiles)
   - ✅ "Marketing Developer Platform (MDP)" → `w_organization_social` or `rw_organization_admin` (Company Pages)

2. **Scopes:**
   - ✅ `w_organization_social` is sufficient for posting to Company Pages
   - ✅ `rw_organization_admin` provides additional management capabilities
   - ✅ Both scopes work with `/organizationalEntityAcls` endpoint

3. **Endpoint Usage:**
   - ✅ `/organizationalEntityAcls` is the correct endpoint for fetching organizations
   - ✅ Query tunneling may be required for long URLs (if URL exceeds 8KB)
   - ✅ Uses `organizationalTarget` field in projection and response

### ⚠️ Remaining Issue

The 403 error when fetching organizations is **still expected** because:
- We only have `w_member_social` scope (personal profiles)
- Company Pages require `w_organization_social` scope
- **"Marketing Developer Platform (MDP)" was deprecated in April 2024**
- **New requirement:** "Community Management API" product approval
- **Important:** Community Management API requires a **separate LinkedIn app** (cannot be combined with "Share on LinkedIn" product)

**However**, with the corrected endpoint and projection fields, once the user:
1. Creates a separate LinkedIn app for Company Pages
2. Gets "Community Management API" product approval
3. Adds `w_organization_social` scope to OAuth request

The endpoint should work correctly.

### Next Steps

1. ✅ **DONE:** Fixed endpoint name and projection fields
2. ✅ **DONE:** Updated error messages for consistency
3. ✅ **DONE:** Updated documentation to reflect MDP deprecation and Community Management API requirement
4. **TODO:** Create a separate LinkedIn app specifically for Company Pages (if needed)
5. **TODO:** Request "Community Management API" product approval from LinkedIn (separate from "Share on LinkedIn")
6. **TODO:** Add `w_organization_social` scope to OAuth request once Community Management API is approved
7. **TODO:** Test image upload with organization URN when posting to Company Pages (once approved)

### Important Notes

- **Current app:** Can only post to personal profiles with "Share on LinkedIn" product
- **Company Pages:** Requires a **separate LinkedIn app** with "Community Management API" product
- **Cannot combine:** Community Management API cannot be added to an app that already has "Share on LinkedIn"
- **Workaround:** Users can continue using personal profiles, or create a second app for Company Pages


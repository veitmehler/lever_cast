# LinkedIn Company Pages Setup Guide

## Important Update (April 2024)

**"Marketing Developer Platform (MDP)" was deprecated by LinkedIn in April 2024.**

To manage LinkedIn Company Pages programmatically, you now need to use the **"Community Management API"** product, which has different requirements.

## Current Situation

### What Works Now ✅

- ✅ **Personal Profile Posting:** Your current LinkedIn app with "Share on LinkedIn" product can post to personal profiles
- ✅ **Scope:** `w_member_social` is working correctly
- ✅ **Endpoint:** `/organizationalEntityAcls` endpoint is correct (we fixed it)

### What Doesn't Work ❌

- ❌ **Company Pages:** Cannot post to Company Pages with your current app
- ❌ **Reason:** "Marketing Developer Platform" is deprecated and not available
- ❌ **Alternative:** Requires "Community Management API" which needs a **separate LinkedIn app**

## Why You Can't Find "Marketing Developer Platform"

The "Marketing Developer Platform (MDP)" product is **no longer available** in the LinkedIn Developer Portal because it was deprecated in April 2024. This is why you don't see it in your Products tab.

## How to Enable Company Pages (If Needed)

### Option 1: Continue with Personal Profiles Only (Recommended for Most Users)

**Pros:**
- ✅ No additional setup required
- ✅ Works immediately with your current app
- ✅ Simpler to maintain

**Cons:**
- ❌ Cannot post to Company Pages
- ❌ Limited to personal profile posting

**This is the recommended approach** unless you specifically need Company Pages functionality.

### Option 2: Create a Separate App for Company Pages

If you need Company Pages functionality, you'll need to:

1. **Create a New LinkedIn App**
   - Go to https://www.linkedin.com/developers/
   - Create a **new application** (separate from your current one)
   - **Important:** This app should NOT have "Share on LinkedIn" product enabled

2. **Request "Community Management API" Product**
   - In your new app, go to the "Products" tab
   - Look for "Community Management API"
   - Request access (may require approval)

3. **Update Your Application**
   - You'll need to support **two LinkedIn apps**:
     - App 1: Personal profiles (current app with "Share on LinkedIn")
     - App 2: Company Pages (new app with "Community Management API")
   - Update OAuth flow to use the correct app based on user's choice
   - Store both sets of credentials

4. **Update OAuth Scopes**
   - For Company Pages app, request: `w_organization_social` or `rw_organization_admin`
   - For Personal Profiles app, keep: `w_member_social`

5. **Update Code**
   - Modify OAuth flow to select the correct app based on posting target
   - Update connection storage to track which app is used

## Technical Details

### Endpoint (Already Fixed ✅)

We've already updated the endpoint to the correct one:
- ✅ **Correct:** `/organizationalEntityAcls`
- ❌ **Was:** `/organizationAcls` (incorrect)

### Projection Fields (Already Fixed ✅)

We've already updated the projection fields:
- ✅ **Correct:** `organizationalTarget~(id,name,vanityName)`
- ❌ **Was:** `organization~(id,name,vanityName)` (incorrect)

### Response Parsing (Already Fixed ✅)

We've already updated response parsing:
- ✅ **Correct:** `element.organizationalTarget`
- ❌ **Was:** `element.organization` (incorrect)

## Current Status

✅ **Fixed Issues:**
- Endpoint name corrected
- Projection fields corrected
- Response parsing corrected
- Error messages updated

⚠️ **Remaining Limitation:**
- Company Pages require "Community Management API" product
- This requires a separate LinkedIn app
- Cannot be combined with "Share on LinkedIn" product

## Recommendations

1. **For Most Users:** Continue using personal profiles only
   - Simpler setup
   - No additional approval needed
   - Works immediately

2. **For Users Needing Company Pages:**
   - Create a separate LinkedIn app
   - Request "Community Management API" product approval
   - Update application to support both apps

3. **Future Consideration:**
   - Monitor LinkedIn API changes
   - "Community Management API" may evolve
   - Consider if Company Pages are essential for your use case

## References

- LinkedIn Help: https://www.linkedin.com/help/linkedin/answer/a527267/
- LinkedIn Developer Portal: https://www.linkedin.com/developers/
- API Documentation: `.documentation/linkedin_api_docs.md`

## Questions?

If you need Company Pages functionality, you'll need to:
1. Create a separate LinkedIn app
2. Request "Community Management API" product approval
3. Update your application code to support both apps

For now, personal profile posting works perfectly with your current setup! ✅


# 🎉 Posts Backend Integration - Complete

## Summary

Successfully integrated the posts backend with enhanced schema for multi-platform social media posting.

## ✅ Database Schema Changes

### **1. Enhanced Draft Model**
- Added `title` field - Short preview/title of the draft
- Added `linkedinContent` - AI-generated LinkedIn post content
- Added `twitterContent` - AI-generated Twitter post content
- Added `platforms` - Tracks which platforms selected ("linkedin", "twitter", or "both")
- Added `templateId` - Links to the template used for generation
- Added `attachedImage` - Stores image URL or base64 data
- Added relationship to `Post` model (one draft can create multiple posts)
- Added composite index on `userId` and `status` for efficient queries

### **2. Enhanced Post Model**
- Added `draftId` - Links back to the original draft
- Added `status` - Tracks post status ("published", "failed", "deleted")
- Added `errorMsg` - Stores error message if publishing fails
- Changed `publishedAt` to have default timestamp
- Added relationship back to `Draft` model
- Added composite index on `userId`, `platform`, and `publishedAt`

### **3. New SocialConnection Model**
Stores OAuth tokens for social media platforms:
- `platform` - "linkedin" or "twitter"
- `accessToken` - OAuth access token (encrypted)
- `refreshToken` - OAuth refresh token (encrypted, if applicable)
- `tokenExpiry` - When the access token expires
- `platformUserId` - User's ID on the social platform
- `platformUsername` - User's username/handle on platform
- `isActive` - Can disable connection without deleting
- `lastUsed` - Track when connection was last used
- **Unique constraint**: One connection per platform per user
- **Index**: Composite on `userId` and `isActive`

## 📊 Database Relationships

```
User (1) ──< (many) Draft
User (1) ──< (many) Post
User (1) ──< (many) SocialConnection
User (1) ──< (many) Template (already existing)

Draft (1) ──< (many) Post
  └─ When a draft is published, it creates Post records
  └─ One Post per platform (LinkedIn, Twitter)
```

## 🎯 Data Flow

### Creating a Draft:
1. User captures idea on dashboard
2. AI generates content using selected template
3. Draft saved with:
   - Original idea (`contentRaw`)
   - LinkedIn version (`linkedinContent`)
   - Twitter version (`twitterContent`)
   - Selected platforms
   - Template used
   - Attached image (if any)

### Publishing a Draft:
1. User clicks publish on LinkedIn/Twitter
2. System checks `SocialConnection` for platform
3. If connected → Publish via OAuth
4. Create `Post` record with:
   - Link to original `Draft` (`draftId`)
   - Platform published to
   - Actual content published
   - Post URL (if available from API)
   - Status (published/failed)
5. Update draft status to "published"

## 🔐 Security Considerations

### OAuth Token Storage:
- Tokens stored in `SocialConnection` model
- **Must be encrypted** before storing (use encryption library)
- Tokens should be encrypted at rest and decrypted only when needed
- Consider using environment variable for encryption key

### Recommendations:
```typescript
// Use a library like @47ng/cloak or crypto
import { encrypt, decrypt } from '@/lib/encryption'

// When storing
await prisma.socialConnection.create({
  data: {
    accessToken: encrypt(token),
    refreshToken: refreshToken ? encrypt(refreshToken) : null,
    // ...
  }
})

// When retrieving
const connection = await prisma.socialConnection.findUnique(...)
const decryptedToken = decrypt(connection.accessToken)
```

## 📝 Next Steps

### **Immediate (Required for Basic Functionality):**

1. **Create Drafts API Routes**
   - `POST /api/drafts` - Create draft
   - `GET /api/drafts` - List user drafts
   - `GET /api/drafts/[id]` - Get single draft
   - `PATCH /api/drafts/[id]` - Update draft
   - `DELETE /api/drafts/[id]` - Delete draft

2. **Create Posts API Routes**
   - `GET /api/posts` - List user posts
   - `GET /api/posts/[id]` - Get single post
   - `POST /api/posts/publish` - Publish draft to platform

3. **Update Dashboard Component**
   - Replace localStorage with API calls
   - Use new draft structure
   - Handle template selection

4. **Social Connections API Routes**
   - `GET /api/social/connections` - List connections
   - `POST /api/social/connect/:platform` - OAuth connection flow
   - `DELETE /api/social/disconnect/:platform` - Remove connection
   - `GET /api/social/status` - Check connection status

### **Future Enhancements:**

1. **OAuth Integration**
   - LinkedIn OAuth flow
   - Twitter/X OAuth flow
   - Token refresh logic
   - Token expiry handling

2. **Publishing Service**
   - LinkedIn API integration
   - Twitter API integration
   - Error handling and retry logic
   - Rate limiting

3. **Analytics & Tracking**
   - Track post performance
   - Engagement metrics
   - Publishing history

## 🔧 Technical Debt to Address

1. **Encryption Implementation**
   - Set up encryption for OAuth tokens
   - Add encryption key to environment variables
   - Implement encryption/decryption utilities

2. **Migration Approach**
   - Currently using runtime migrations (Prisma Client)
   - SSL issues with Prisma CLI
   - Consider using Supabase SQL Editor for future migrations

3. **Data Migration from localStorage**
   - Existing drafts in localStorage need migration
   - Create utility script to migrate local data to database
   - Consider migration UI for users

## 📋 API Endpoints to Build

### Drafts:
- `GET /api/drafts` - List all user drafts
- `POST /api/drafts` - Create new draft
- `GET /api/drafts/[id]` - Get single draft
- `PATCH /api/drafts/[id]` - Update draft
- `DELETE /api/drafts/[id]` - Delete draft

### Posts:
- `GET /api/posts` - List all user posts
- `GET /api/posts/[id]` - Get single post
- `POST /api/posts/publish` - Publish draft to platform(s)
- `DELETE /api/posts/[id]` - Delete post record

### Social Connections:
- `GET /api/social/connections` - List user's connected platforms
- `POST /api/social/linkedin/connect` - Initiate LinkedIn OAuth
- `POST /api/social/twitter/connect` - Initiate Twitter OAuth
- `DELETE /api/social/[platform]` - Disconnect platform
- `GET /api/social/[platform]/callback` - OAuth callback handler

## 🎨 Templates Already Configured

✅ Templates are already set up for multi-platform support:
- Each template has `linkedinTemplate` and `twitterTemplate` fields
- Templates use placeholder variables: `{idea}`, `{point1}`, `{point2}`, `{point3}`
- AI processing can use these templates to format content

## 📚 Reference

- Software Specifications: `.documentation/levercast-software-specifications.md`
- Database Integration Rules: See cursor rules for Prisma best practices
- OAuth Flow: Will need LinkedIn and Twitter OAuth app credentials

---

**Status**: ✅ Database schema complete, ready for API implementation
**Next Milestone**: API routes for drafts and posts management



# Go HighLevel (GHL) API Integration — Complete Implementation Plan

## Overview

This document describes the complete Go HighLevel CRM integration: credential management, contact upsert, newsletter email campaigns, lead generation via Google Drive, contact form capture, and inbound conversation messages. It is a handover document for implementing equivalent functionality in another application.

**GHL API base URL:** `https://services.leadconnectorhq.com`  
**API version header (required on all requests):** `Version: 2021-07-28`  
**Auth:** `Authorization: Bearer {apiKey}` (Private Integration API key — no OAuth)

---

## 1. Authentication & Credential Management

### 1.1 How GHL Credentials Are Stored

GHL uses a **Private Integration API key** (not OAuth). The key and Location ID are entered manually by an admin and stored encrypted in the database.

**Primary storage model:** `LeadGenOperatorSettings`

```prisma
model LeadGenOperatorSettings {
  id            String   @id @default(cuid())
  userId        String   @unique          // Clerk user ID of the admin who set it up
  ghlApiKey     String?  @db.Text         // AES-256-GCM encrypted API key
  ghlLocationId String?                   // Plain text GHL Location ID
  // (also stores Google Drive OAuth tokens — see Section 5)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

**Encryption:** `encrypt()` / `decrypt()` from `lib/social-media/oauth/encryption.ts` using AES-256-GCM with `ENCRYPTION_KEY` env var. Plain Base64 in development when `ENCRYPTION_KEY` is not set.

**How credentials are loaded at runtime (all integrations):**

```typescript
const ops = await prisma.leadGenOperatorSettings.findFirst()
const apiKey = decrypt(ops.ghlApiKey)
const locationId = ops.ghlLocationId
```

`findFirst()` is used everywhere — the system assumes a single operator record. There is no per-user scoping in the API calls.

### 1.2 Request Headers (All GHL Calls)

Every GHL API request must include:

```typescript
{
  Authorization: `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
  Version: '2021-07-28',
}
```

### 1.3 Admin Setup Routes

| Method | Route | Purpose |
|--------|-------|---------|
| `GET/PUT` | `/api/lead-gen/settings` | Get/save `ghlApiKey` + `ghlLocationId` in `LeadGenOperatorSettings` |
| `GET` | `/api/newsletter/ghl-users` | List GHL team members for selecting campaign owner |

**Configure via:** Admin → Lead Gen Settings page → enter GHL API Key + Location ID → saved to `LeadGenOperatorSettings.ghlApiKey` (encrypted) + `ghlLocationId`.

### 1.4 Environment Variables

```bash
ENCRYPTION_KEY   # AES-256-GCM key for encrypting/decrypting the GHL API key in DB
```

The GHL API key and Location ID are **not** stored as environment variables — they are stored encrypted in the database via the admin UI. `env.example` documents `GHL_API_KEY` and `GHL_LOCATION_ID` as references only; they are not read by any TypeScript code.

---

## 2. Contact Management (Upsert)

### 2.1 The Only Contact API Used: Upsert

There is **no** `createContact`, `searchContacts`, or `updateContact` call anywhere. All contact creation/update uses the single upsert endpoint.

**Endpoint:** `POST https://services.leadconnectorhq.com/contacts/upsert`

GHL's upsert endpoint looks up an existing contact by `email` or `phone`, then either creates a new contact or merges the provided data into the existing one (tags are merged/appended, not replaced).

### 2.2 `upsertGhlContact()` — Lead Gen Function

**File:** `lib/lead-gen/ghl-client.ts`

```typescript
export async function upsertGhlContact(
  apiKey: string,
  locationId: string,
  email: string,
  name: string | undefined,
  tag: string,           // primary document tag (required)
  extraTags: string[],   // additional tags (master tag, language tag)
): Promise<string | null>
```

**Request body sent:**

```json
{
  "locationId": "<locationId>",
  "email": "<requester email address>",
  "tags": ["<primary doc tag>", "<master tag>", "<language tag>"],
  "firstName": "<first token of display name>",
  "lastName": "<rest of display name>"
}
```

Name splitting: first whitespace-separated token → `firstName`, remainder → `lastName`. Empty strings are omitted.

**Response handling:**

```typescript
// GHL can return either shape:
{ "contact": { "id": "..." } }
// or
{ "id": "..." }
```

Returns `data.contact?.id ?? data.id ?? null`.

On non-OK response: logs error, returns `null` (non-fatal — callers proceed).

### 2.3 Inline Upsert — Contact Form

**File:** `app/api/contact-form/route.ts`

Same endpoint with slightly different body (supports email-less WhatsApp submissions):

```json
{
  "locationId": "<locationId>",
  "tags": ["Homepage Contact Form"],
  "email": "<optional>",
  "phone": "<optional>",
  "firstName": "<first name token>",
  "lastName": "<rest of name>"
}
```

- **Email form:** `email` is required; `phone` optional
- **WhatsApp form:** `phone` is required; `email` optional — GHL uses phone as the dedup key

**Tags applied:**
- Email submission: `["Homepage Contact Form"]`
- WhatsApp submission: `["Homepage Contact Form", "WhatsApp"]`

### 2.4 Tag Strategy

Tags are plain strings passed in the `tags` array. GHL creates them if they don't exist or merges them into existing contacts. Three tag categories are used:

| Tag | Where Applied | Purpose |
|-----|--------------|---------|
| Document tag (`LeadGenDocument.ghlTag`) | Lead gen upsert | Identifies which lead magnet the lead came from |
| Master tag (`NewsletterSettings.masterTag`) | Lead gen upsert | Marks contacts as newsletter-eligible |
| Language tag (`NewsletterSettings.languageConfig[].tag`) | Lead gen upsert | Segments contacts by language for campaign targeting |
| `"Homepage Contact Form"` | Contact form upsert | Identifies contact form submissions |
| `"WhatsApp"` | Contact form upsert (WhatsApp channel) | Identifies WhatsApp channel leads |

---

## 3. Newsletter Email Campaigns

### 3.1 Architecture

GHL Email Campaigns V2 is used for all newsletter delivery. The app builds a full HTML email and submits it to GHL as a campaign draft, then schedules it. GHL handles the actual sending to subscribers.

**Two campaign types:**
1. **Article newsletter** — one email per published article, sent to language-segmented subscriber tags
2. **Weekly digest** — aggregates up to 10 articles from the past 7 days, sent on a configured day of the week

### 3.2 Two-Step Campaign Flow

Every newsletter goes through the same two GHL API calls:

**Step 1: Create draft campaign**

```
POST https://services.leadconnectorhq.com/emails/public/v2/locations/{locationId}/campaigns/email-campaign
```

**Request body:**

```json
{
  "name": "Article Newsletter — {articleTitle} [EN]",
  "subject": "New Article: {articleTitle}",
  "previewText": "{teaserText trimmed to 100 chars}",
  "fromName": "{NewsletterSettings.fromName}",
  "fromEmail": "{NewsletterSettings.fromEmail}",
  "editorType": "html",
  "editorContent": "{full HTML email string}",
  "timeZone": "{IANA timezone, e.g. America/Santo_Domingo}",
  "userId": "{NewsletterSettings.ghlUserId}",
  "emailMeta": {
    "subject": "{same as subject}",
    "fromName": "{same as fromName}",
    "fromEmail": "{same as fromEmail}",
    "previewText": "{same as previewText}"
  }
}
```

**Response:** Returns `{ id: "...", campaignId: "..." }` — extract `id ?? campaignId`.

**Step 2: Schedule campaign with recipients**

```
POST https://services.leadconnectorhq.com/emails/public/v2/locations/{locationId}/campaigns/{campaignId}/schedule
```

**Request body:**

```json
{
  "scheduleType": "scheduled",
  "timeZone": "{IANA timezone}",
  "userId": "{NewsletterSettings.ghlUserId}",
  "emailMeta": {
    "subject": "{email subject}",
    "fromName": "{sender name}",
    "fromEmail": "{sender email}",
    "previewText": "{preview text}"
  },
  "recipients": {
    "type": "tag",
    "tagIds": ["{resolved GHL tag UUID}", ...]
  },
  "scheduleConfig": {
    "sendAt": "2026-04-10T11:30:00"
  }
}
```

**Important:** `sendAt` is **local time in the given `timeZone`**, not UTC. The app converts the UTC scheduled time to local using:

```typescript
function toLocalSendAt(utcDate: Date, timeZone: string): string {
  // Uses sv-SE locale to get "YYYY-MM-DD HH:mm:ss", then replaces space with T
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(utcDate).replace(' ', 'T')
}
// Example: "2026-04-10T11:30:00" (no trailing Z)
```

### 3.3 Tag Resolution (Name → GHL UUID)

Before scheduling, tag names from `NewsletterSettings.languageConfig[].tag` must be resolved to GHL tag IDs:

```
GET https://services.leadconnectorhq.com/locations/{locationId}/tags
```

Returns: `{ tags: [{ id: "uuid", name: "Tag Name" }, ...] }`

**`resolveTagIds(apiKey, locationId, tagNames[])`** builds a case-insensitive map of name → id and returns UUIDs for the requested names. Tags not found in GHL are skipped with a console warning (non-fatal for that language, but that language's campaign won't be sent).

### 3.4 Article Newsletter Generation Flow

**File:** `lib/newsletter/generate-newsletter.ts` → `generateArticleNewsletter()`

**Triggered by:** `POST /api/newsletter/generate` (Clerk-authenticated admin action)

**Request body:**
```json
{ "sitePageId": "...", "scheduledFor": "2026-04-10T11:30:00.000Z" }
```

**Full flow (8 steps):**

1. Load `SitePage` from DB (including first `ArticleSectionEnrichment` for diagram URL, translation slugs)
2. Check for existing active newsletter for the same article — reject if found
3. Load `NewsletterSettings` (branding, fromName, fromEmail, ghlUserId, languageConfig), `LeadGenOperatorSettings` (GHL credentials), `SiteSettings` (company details), site timezone
4. Extract H2 headings from `enrichedBodyHtml` for LLM context
5. **Generate teaser via LLM** — calls `PromptTemplate` step 27 with variables:
   - `{{title}}` — article title
   - `{{excerpt}}` — article SEO excerpt
   - `{{headings}}` — comma-separated H2 headings (up to 6)
6. Create `Newsletter` record in DB with `status: 'generating'`
7. **For each enabled language in `languageConfig`:**
   a. Resolve language tag name → GHL tag UUID
   b. Build full HTML email via `buildArticleNewsletterHtml()` (see Section 3.6)
   c. Create GHL campaign draft (Step 1 above)
   d. Schedule GHL campaign (Step 2 above)
   e. Store `campaignId` in `ghlCampaignIds[languageCode]`
8. Update `Newsletter` record to `status: 'scheduled'`, store `ghlCampaignIds` as JSON, store final `htmlBody`

**On failure:** Updates `Newsletter.status = 'failed'`, stores `error` message, re-throws.

### 3.5 Weekly Digest Generation Flow

**File:** `lib/newsletter/generate-newsletter.ts` → `generateWeeklyDigest()`

**Triggered by:** `POST /api/cron/newsletter` cron job when:
- Today's day of week matches `NewsletterSettings.digestDay`
- No digest newsletter exists for the current week
- At least 1 article published in the past 7 days

**Flow (7 steps):**

1. Query `SitePage` for articles published in the last 7 days (up to 10), ordered newest-first
2. Load `NewsletterSettings`, GHL credentials, `SiteSettings`, timezone
3. **Generate digest intro + per-article teasers via LLM** — calls `PromptTemplate` step 28 with:
   - `{{articleList}}` — formatted as `"Title: ...\nExcerpt: ...\n\n"` for each article
   - LLM returns JSON: `{ "intro": "...", "teasers": { "article-slug": "teaser text", ... } }`
   - Falls back to raw text as intro if JSON parsing fails
4. Create `Newsletter` record (`type: 'digest'`, `subject: 'What You Might Have Missed This Week'`)
5. **For each enabled language:**
   a. Resolve tag → GHL UUID
   b. Build digest HTML via `buildDigestNewsletterHtml()` with per-language article slugs + UTM params
   c. Create + schedule GHL campaign
6. Update `Newsletter` record to `status: 'scheduled'`, store `ghlCampaignIds`
7. Mark as `status: 'sent'` via the newsletter cron when `scheduledFor` time passes (DB-only marker — GHL actually sends)

**Weekly digest campaign name format:** `"Weekly Digest — {YYYY-MM-DD} [EN]"`

### 3.6 Email HTML Templates

**File:** `lib/newsletter/email-templates.ts`

Two builder functions:

#### `buildArticleNewsletterHtml(opts)` — Single article

**Parameters:**

```typescript
{
  logoUrl: string               // header logo URL
  greeting?: string             // e.g. "Hi {{contact.first_name | \"there\"}},"
  teaserText: string            // LLM-generated teaser (plain text)
  diagramUrl?: string           // first article diagram image URL (optional)
  diagramAlt: string            // alt text for diagram image
  articleTitle: string
  articleUrl: string            // with UTM params: ?utm_source=newsletter&utm_medium=email&utm_campaign={slug}
  signOffHtml?: string          // WYSIWYG HTML sign-off block
  headerColor: string           // hex color for header background
  footerOpts: EmailFooterOpts   // company details + disclaimer
}
```

**Layout (table-based HTML email):**
1. Header bar with logo (background: `headerColor`)
2. Greeting line (if configured) — supports GHL merge tag syntax like `{{contact.first_name | "there"}}`
3. Teaser text block (plain text, line breaks preserved)
4. Diagram image (if available) — centered, max-width 600px, with border-radius
5. "Click here to read the full article" CTA button (links to `articleUrl`)
6. Sign-off block (raw HTML from WYSIWYG editor)
7. 70px padding spacer above footer
8. `<hr>` separator above disclaimer
9. Footer: logo, company name/address/phone/email (rendered as HTML, `<br>` tags supported), social icons, disclaimer HTML, unsubscribe HTML

UTM URL structure:
```
{baseUrl}/{langPrefix}/{slug}?utm_source=newsletter&utm_medium=email&utm_campaign={slug}
```
Language prefix: `/{languageCode}` for non-English, no prefix for English.

#### `buildDigestNewsletterHtml(opts)` — Weekly digest

Same structure but with `introText` instead of a single `teaserText`, and multiple `articles[]` each with their own title, teaser, diagram, and article URL.

UTM campaign for digest: `weekly-digest-{YYYY-MM-DD}`.

### 3.7 NewsletterSettings Configuration

**Prisma model:**

```prisma
model NewsletterSettings {
  id              String  @id @default(cuid())
  fromName        String?               // Email sender display name
  fromEmail       String?               // Email sender address
  masterTag       String?               // Applied to all lead-gen captures
  preferredSendTime String @default("09:00")  // HH:mm local time
  digestDay       Int    @default(6)    // 0=Sun, 1=Mon ... 6=Sat
  languageConfig  Json   @default("[]") // [{languageCode, tag, enabled}]
  ghlUserId       String?               // GHL team member who owns campaigns
  headerLogoUrl   String?               // URL of logo in email header
  footerLogoUrl   String?               // URL of logo in email footer
  headerColor     String?               // Header background color (hex)
  footerColor     String?               // Footer background color (hex)
  footerTextColor String?               // Footer text color (hex)
  greetingTemplate String?             // Greeting line with GHL merge tags
  signOffHtml     String? @db.Text     // HTML sign-off above footer
  disclaimerHtml  String?              // HTML disclaimer below footer divider
  unsubscribeHtml String?              // HTML unsubscribe block
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

**`languageConfig` JSON structure:**

```json
[
  { "languageCode": "en", "tag": "Newsletter EN", "enabled": true },
  { "languageCode": "es", "tag": "Newsletter ES", "enabled": true }
]
```

The `tag` values are GHL tag names (not IDs). They are resolved to IDs at campaign schedule time.

### 3.8 GHL User Selection

The `ghlUserId` in `NewsletterSettings` is the GHL team member who "owns" created campaigns.

**To list available GHL users:** `GET /api/newsletter/ghl-users` → calls:

```
GET https://services.leadconnectorhq.com/users/?locationId={locationId}
```

Returns `{ users: [{ id, name, email, role }] }`. The response shape can vary (array, `{users:[]}`, `{user:{}}`, or single object at root) — normalize all shapes.

### 3.9 Newsletter Database Model

```prisma
model Newsletter {
  id               String    @id @default(cuid())
  sitePageId       String?                     // null for weekly digests
  type             String                      // "article" | "digest"
  subject          String
  content          String    @db.Text          // LLM-generated teaser/intro (plain text)
  htmlBody         String?   @db.Text          // Full rendered HTML (last language)
  ghlCampaignIds   Json?                       // {"en":"campaign-id","es":"campaign-id"}
  status           String    @default("pending") // pending|generating|scheduled|sent|failed
  error            String?   @db.Text
  scheduledFor     DateTime?
  sentAt           DateTime?
  recipientCount   Int?
  digestArticleIds Json?                       // string[] of SitePage IDs (digest only)
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
}
```

**Status lifecycle:**
- `pending` → initial state
- `generating` → LLM call and GHL API calls in progress
- `scheduled` → GHL campaigns created and scheduled successfully
- `sent` → `scheduledFor` time passed (marked by newsletter cron, no GHL confirmation)
- `failed` → error occurred, `error` field set

---

## 4. Lead Generation (Google Drive → GHL)

This feature monitors Google Drive files for "access proposal" notifications (users who request view access). When someone requests access, the system approves it and upserts them as a GHL contact.

### 4.1 Architecture

```
User requests Google Drive file access
  → Google Drive API: access proposal created
  → Cron job (every 1 minute): listAccessProposals()
  → resolveAccessProposal() — approve with reader role
  → upsertGhlContact() — create/update contact in GHL
  → LeadGenCapture record stored in DB
```

### 4.2 Database Models

#### `LeadGenOperatorSettings`

Stores both Google OAuth tokens and GHL credentials for the operator.

```prisma
model LeadGenOperatorSettings {
  id                   String    @id @default(cuid())
  userId               String    @unique            // Clerk user ID
  googleAccessToken    String?   @db.Text           // encrypted
  googleRefreshToken   String?   @db.Text           // encrypted
  googleTokenExpiresAt DateTime?
  googleEmail          String?
  googleDriveFolderId  String?                      // optional: folder to scan for re-uploaded docs
  ghlApiKey            String?   @db.Text           // encrypted
  ghlLocationId        String?
  documents            LeadGenDocument[]
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  @@index([userId])
}
```

#### `LeadGenDocument`

A Google Drive file registered as a lead magnet.

```prisma
model LeadGenDocument {
  id                 String   @id @default(cuid())
  operatorSettingsId String
  googleFileId       String   @unique    // Google Drive file ID
  title              String              // Filename as shown in Drive
  googleUrl          String              // webViewLink for the file
  ghlTag             String              // GHL tag to apply to leads from this doc
  baseName           String?             // e.g. "01-Beyond_the_Hype" (filename without extension/lang)
  languageCode       String?             // null=English, "es"=Spanish, etc.
  parentDocId        String?             // Self-relation: translated variants → English parent
  isActive           Boolean  @default(true)
  lastPolledAt       DateTime?
  totalCaptures      Int      @default(0)
  captures           LeadGenCapture[]
  ctaVersions        CtaAuthorVersion[]
  slideInVersions    SlideInOfferVersion[]
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}
```

#### `LeadGenCapture`

A record of one person requesting access to one document.

```prisma
model LeadGenCapture {
  id               String   @id @default(cuid())
  documentId       String
  requesterEmail   String
  requesterName    String?
  googleProposalId String   @unique      // Google Drive proposal ID (dedup key)
  ghlContactId     String?               // GHL contact ID after upsert
  ghlTag           String                // tag applied
  status           String   @default("approved") // "approved" | "failed"
  error            String?  @db.Text     // error message if GHL upsert failed
  createdAt        DateTime @default(now())
}
```

### 4.3 Cron Job Flow

**Route:** `POST /api/cron/lead-gen-process`  
**Schedule:** Every 1 minute  
**Auth:** `Authorization: Bearer {CRON_SECRET}`

**Orchestrator:** `processLeadGenProposals()` in `lib/lead-gen/process-proposals.ts`

```
For each LeadGenOperatorSettings with Google tokens + GHL configured:
  1. Get valid Google access token (auto-refresh if expiring in <5 min)
  2. If googleDriveFolderId: sync file IDs (detect re-uploaded files by baseName pattern)
  3. For each active LeadGenDocument:
     a. listAccessProposals(accessToken, googleFileId)
     b. Update doc.lastPolledAt
     c. For each proposal:
        - Check LeadGenCapture by googleProposalId
        - If status='approved': SKIP (already processed)
        - If status='failed' or not found: RETRY
        d. resolveAccessProposal(accessToken, fileId, proposalId) → ACCEPT with reader role
        e. Load extra tags: masterTag from NewsletterSettings + language tag for doc.languageCode
        f. upsertGhlContact(ghlKey, ghlLoc, email, name, doc.ghlTag, extraTags)
        g. Upsert LeadGenCapture (status='approved', ghlContactId)
        h. Increment doc.totalCaptures
        i. Increment conversions on linked SlideInOfferVersion + CtaAuthorVersion records
```

**Returns summary:**

```typescript
{
  totalOperators: number,
  totalProposals: number,
  totalApproved: number,
  totalFailed: number,
  errors: string[]
}
```

### 4.4 Tags Applied to Lead Gen Contacts

All three tag types are applied in a single upsert call:

```typescript
const allTags = [
  doc.ghlTag,           // e.g. "DR Investment Guide" — the document's tag
  masterTag,            // e.g. "Newsletter Subscriber" — newsletter eligibility
  languageTag,          // e.g. "Newsletter EN" — language segmentation
]
```

- `doc.ghlTag`: set when registering the document in the Lead Gen admin UI
- `masterTag`: from `NewsletterSettings.masterTag` (optional; allows sending newsletters to all lead captures regardless of language)
- Language tag: from `NewsletterSettings.languageConfig[]` matching `doc.languageCode`

### 4.5 Google Drive API Integration

**File:** `lib/lead-gen/google-drive.ts`

Base URL: `https://www.googleapis.com/drive/v3`

All calls use `Authorization: Bearer {accessToken}`.

#### List Files in Folder

```
GET /files?q={folderId} in parents and trashed = false&fields=files(id,name,webViewLink,mimeType,modifiedTime)&pageSize=200
```

Used for detecting re-uploaded files (same `baseName`, new `googleFileId`).

#### List Access Proposals

```
GET /files/{fileId}/accessproposals
```

Returns:
```json
{
  "accessProposals": [
    {
      "proposalId": "...",
      "fileId": "...",
      "requesterEmailAddress": "user@example.com",
      "requesterDisplayName": "User Name"
    }
  ]
}
```

Filters to proposals where `proposalId` and `requesterEmailAddress` are present.

#### Resolve (Approve) Access Proposal

```
POST /files/{fileId}/accessproposals/{proposalId}:resolve
Content-Type: application/json

{
  "action": "ACCEPT",
  "role": ["reader"],
  "sendNotification": true
}
```

### 4.6 Google OAuth for Drive

**File:** `lib/lead-gen/google-oauth.ts`

**Scopes required:**
```
https://www.googleapis.com/auth/drive
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
```

**Note:** The `drive` scope (not `drive.readonly`) is required to resolve access proposals.

**Auth URL parameters:**
```
access_type: 'offline'
prompt: 'consent'    ← forces refresh_token to be returned
```

**Token exchange:** `POST https://oauth2.googleapis.com/token`

**Token refresh:** `POST https://oauth2.googleapis.com/token` with `grant_type=refresh_token`

**Auto-refresh logic:** `getValidAccessToken(userId)` refreshes the token if `expiresAt < now + 5 minutes`. Refreshed tokens are saved back to `LeadGenOperatorSettings`.

**OAuth routes:**
- `GET /api/lead-gen/google/auth` → redirects to Google OAuth consent page
- `GET /api/lead-gen/google/auth/callback` → exchanges code for tokens, saves to DB
- `POST /api/lead-gen/google/disconnect` → clears tokens from DB

**Environment variables for Google OAuth:**
```bash
GOOGLE_LEAD_GEN_CLIENT_ID
GOOGLE_LEAD_GEN_CLIENT_SECRET
GOOGLE_LEAD_GEN_REDIRECT_URI    # e.g. https://app.medicigroup.com.do/api/lead-gen/google/auth/callback
```

**Token disconnection cause:** Google tokens can expire or be revoked if the user revokes app access at `myaccount.google.com/permissions`. The `drive` scope must be included in the original OAuth consent — if the user reconnects without it, proposals won't resolve. Always use `prompt: 'consent'` to force full consent each time.

### 4.7 Admin UI Routes for Lead Gen

| Method | Route | Purpose |
|--------|-------|---------|
| `GET/PUT` | `/api/lead-gen/settings` | Get/save operator settings (Google folder ID, GHL key) |
| `GET/POST` | `/api/lead-gen/documents` | List / create `LeadGenDocument` records |
| `GET/PUT/DELETE` | `/api/lead-gen/documents/[id]` | CRUD on a single document |
| `GET` | `/api/lead-gen/documents/list-for-select` | Lightweight list for dropdowns |
| `GET` | `/api/lead-gen/leads` | List `LeadGenCapture` records |
| `GET` | `/api/lead-gen/google/files` | List files in the configured Google Drive folder |
| `GET` | `/api/lead-gen/google/auth` | Start Google OAuth flow |
| `GET` | `/api/lead-gen/google/auth/callback` | Google OAuth callback |
| `POST` | `/api/lead-gen/google/disconnect` | Disconnect Google Drive |

---

## 5. Contact Form & WhatsApp Lead Capture

### 5.1 Overview

When a visitor submits the "Contact Us" form on the homepage, the app:
1. Validates the input
2. Upserts the contact to GHL
3. Creates an inbound conversation message in GHL (if a message was provided)
4. Returns `{ success: true }`

### 5.2 Route

**File:** `app/api/contact-form/route.ts`  
**Endpoint:** `POST /api/contact-form`  
**Auth:** None (public route)

### 5.3 Request Body

```typescript
{
  name: string       // required always
  phone?: string     // required if channel === 'whatsapp'
  email?: string     // required if channel !== 'whatsapp'
  message?: string   // optional; if provided, creates GHL inbound message
  channel?: string   // 'whatsapp' | undefined (default: email)
}
```

### 5.4 Validation

```
Always required: name
WhatsApp (channel === 'whatsapp'): phone required; email optional
Email (default): email required; phone optional
```

### 5.5 Step 1: Upsert Contact

```
POST https://services.leadconnectorhq.com/contacts/upsert
```

```json
{
  "locationId": "{locationId}",
  "email": "{optional}",
  "phone": "{optional}",
  "firstName": "{first token of name}",
  "lastName": "{rest of name}",
  "tags": ["Homepage Contact Form"] | ["Homepage Contact Form", "WhatsApp"]
}
```

**Match logic:** GHL upserts by `email` when present; by `phone` when email is absent (WhatsApp path). If both are provided, email takes precedence.

### 5.6 Step 2: Create Inbound Conversation Message

After successful upsert, if `message` is non-empty and a `contactId` was returned:

```
POST https://services.leadconnectorhq.com/conversations/messages/inbound
```

```json
{
  "type": "Email",
  "contactId": "{ghlContactId}",
  "direction": "inbound",
  "subject": "Homepage Contact Form Submission" | "Homepage WhatsApp Contact",
  "message": "{plain text message}",
  "html": "<p>{message with \\n replaced by <br>}</p>",
  "emailTo": "letstalk@medicigroup.com.do",
  "emailFrom": "{email if provided}"
}
```

**Error handling:** If the inbound message call fails, the error is logged but `{ success: true }` is still returned. The contact upsert is the critical step; the message is best-effort.

---

## 6. GHL API Endpoint Summary

All endpoints use base URL `https://services.leadconnectorhq.com` and require headers:
```
Authorization: Bearer {apiKey}
Content-Type: application/json
Version: 2021-07-28
```

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/contacts/upsert` | Create or update a contact (dedup by email or phone) |
| `POST` | `/conversations/messages/inbound` | Add inbound message to a contact's conversation thread |
| `POST` | `/emails/public/v2/locations/{locationId}/campaigns/email-campaign` | Create email campaign draft |
| `POST` | `/emails/public/v2/locations/{locationId}/campaigns/{campaignId}/schedule` | Schedule campaign with recipients + send time |
| `GET` | `/locations/{locationId}/tags` | List all tags in location (for name→ID resolution) |
| `GET` | `/users/?locationId={locationId}` | List team members (for campaign owner selection) |

---

## 7. LLM Integration for Newsletter Content

### 7.1 Prompt Step 27 — Article Teaser

Used by `generateArticleNewsletter()`.

Loaded from `PromptTemplate` DB table where `stepNumber = 27`.

**Variables passed:**

| Variable | Value |
|----------|-------|
| `{{title}}` | Article title |
| `{{excerpt}}` | Article SEO meta description |
| `{{headings}}` | Comma-separated H2 headings (up to 6) |

**Expected output:** Plain text teaser (50-150 words) summarizing the article to entice newsletter subscribers to click through.

### 7.2 Prompt Step 28 — Digest Intro & Teasers

Used by `generateWeeklyDigest()`.

Loaded from `PromptTemplate` DB table where `stepNumber = 28`.

**Variables passed:**

| Variable | Value |
|----------|-------|
| `{{articleList}}` | Formatted list: `"Title: {title}\nExcerpt: {excerpt}\n\n"` per article |

**Expected output:** JSON with `intro` and `teasers`:

```json
{
  "intro": "Here's what was published this week...",
  "teasers": {
    "article-slug-1": "Short teaser for this article...",
    "article-slug-2": "Short teaser for this article..."
  }
}
```

If the LLM returns non-JSON, the raw text is used as the `intro` and `teasers` defaults to `{}` (article `excerpt` fields are used as fallback teasers).

---

## 8. Newsletter Cron Job

**Route:** `POST /api/cron/newsletter`  
**File:** `lib/cron/run-newsletter-cron.ts`  
**Auth:** `Authorization: Bearer {CRON_SECRET}`

**Cron schedule:** Not on a fixed timer — called from the general scheduling cron.

**Logic:**

1. Load `NewsletterSettings`
2. Get current local time in site timezone
3. Check if current time matches `preferredSendTime` (HH:mm, within a 5-minute window)
4. **If today is `digestDay`** and no digest scheduled this week → call `generateWeeklyDigest()`
5. **For each article** with status `'published'` and no existing scheduled newsletter → call `generateArticleNewsletter()`
6. Mark newsletters where `scheduledFor < now` as `status: 'sent'` (DB only — GHL has already sent)

---

## 9. Error Handling

### 9.1 Per-Function Behavior

| Function | On Failure | Effect |
|----------|-----------|--------|
| `upsertGhlContact()` | `console.error`, return `null` | Non-fatal: `LeadGenCapture` saved as `approved` with `error: 'GHL upsert returned no contact id'` |
| `createGhlEmailCampaign()` | `console.error`, throw `Error` | Fatal for that newsletter: `Newsletter.status = 'failed'`, error stored |
| `scheduleGhlCampaign()` | `console.error` + raw body, throw `Error` | Fatal for that newsletter |
| `resolveTagIds()` | Missing tag: `console.warn`, skip that language | Non-fatal: that language's campaign is not created |
| Inbound message (contact-form) | `console.error`, continue | Non-fatal: `{ success: true }` still returned |
| Contact upsert (contact-form) | `console.error`, return HTTP 500 | Fatal: caller sees error |

### 9.2 Newsletter Failure Recovery

Failed newsletters can be retried by triggering `POST /api/newsletter/generate` again — the system checks for existing `pending/generating/scheduled` newsletters and rejects duplicates, so delete the failed record first or let the cron retry.

### 9.3 Lead Gen Retry Logic

`LeadGenCapture` records with `status: 'failed'` are retried on the next cron run — only `status: 'approved'` records are skipped. This means if GHL is temporarily down, captures automatically retry every minute.

### 9.4 No Rate Limiting

There is no retry logic or rate limiting for any GHL API call. If GHL returns `429`, the request fails immediately. For high-volume use cases, add exponential backoff with retry around all GHL `fetch()` calls.

---

## 10. Key File Index

```
GHL API Clients
├── lib/lead-gen/ghl-client.ts              upsertGhlContact() — lead gen + contact form
├── lib/newsletter/ghl-email-client.ts      createGhlEmailCampaign(), scheduleGhlCampaign(),
│                                           getGhlLocationTags(), resolveTagIds()
└── app/api/newsletter/ghl-users/route.ts   GET /users/?locationId= — list GHL team members

Newsletter
├── lib/newsletter/generate-newsletter.ts   generateArticleNewsletter(), generateWeeklyDigest()
├── lib/newsletter/email-templates.ts       buildArticleNewsletterHtml(), buildDigestNewsletterHtml()
└── lib/cron/run-newsletter-cron.ts         Newsletter cron orchestrator

Contact Form
└── app/api/contact-form/route.ts           POST /api/contact-form — upsert + inbound message

Lead Gen
├── lib/lead-gen/process-proposals.ts       processLeadGenProposals() — cron orchestrator
├── lib/lead-gen/ghl-client.ts              upsertGhlContact()
├── lib/lead-gen/google-drive.ts            Google Drive API helpers
├── lib/lead-gen/google-oauth.ts            Google OAuth flow + token refresh
└── lib/lead-gen/filename-utils.ts          parseDocFilename() — baseName + languageCode extraction

Encryption
└── lib/social-media/oauth/encryption.ts    encrypt() / decrypt() — AES-256-GCM

Admin API Routes
├── app/api/lead-gen/settings/route.ts      GET/PUT LeadGenOperatorSettings
├── app/api/lead-gen/documents/route.ts     GET/POST LeadGenDocument
├── app/api/lead-gen/documents/[id]/route.ts  CRUD individual document
├── app/api/lead-gen/leads/route.ts         GET LeadGenCapture list
├── app/api/lead-gen/google/auth/route.ts   Start Google OAuth
├── app/api/lead-gen/google/auth/callback/route.ts  Google OAuth callback
├── app/api/lead-gen/google/disconnect/route.ts     Disconnect Google
├── app/api/lead-gen/google/files/route.ts  List Drive files
└── app/api/newsletter/settings/route.ts    GET/PUT NewsletterSettings

Cron Routes
├── app/api/cron/lead-gen-process/route.ts  POST — run processLeadGenProposals()
└── app/api/cron/newsletter/route.ts        POST — run newsletter cron
```

---

## 11. Complete Environment Variable Reference

```bash
# Encryption (shared with social media token encryption)
ENCRYPTION_KEY                      # AES-256-GCM key — encrypts ghlApiKey in DB

# Google OAuth for Drive Lead Gen
GOOGLE_LEAD_GEN_CLIENT_ID           # Google OAuth client ID
GOOGLE_LEAD_GEN_CLIENT_SECRET       # Google OAuth client secret
GOOGLE_LEAD_GEN_REDIRECT_URI        # e.g. https://app.example.com/api/lead-gen/google/auth/callback

# Cron auth (also used for internal API calls)
CRON_SECRET                         # Bearer token for cron endpoints
```

**Note:** `GHL_API_KEY` and `GHL_LOCATION_ID` are **not used** by any TypeScript code. The GHL credentials are entered via the admin UI, encrypted with `ENCRYPTION_KEY`, and stored in `LeadGenOperatorSettings`. The same encrypted record serves all three integrations: lead gen, newsletter, and contact form.

---

## 12. End-to-End Data Flow Diagrams

### Newsletter Flow

```
Admin triggers POST /api/newsletter/generate
  → generateArticleNewsletter(sitePageId, scheduledFor)
  → PromptTemplate step 27 (LLM) → teaserText
  → Newsletter record created (status: generating)
  → For each enabled language in NewsletterSettings.languageConfig:
      → GET /locations/{locationId}/tags → resolve tag name → GHL tag UUID
      → buildArticleNewsletterHtml() → full HTML string
      → POST /emails/public/v2/locations/{locationId}/campaigns/email-campaign
          body: { name, subject, editorType:"html", editorContent: html, ... }
          → returns campaignId
      → POST /emails/public/v2/locations/{locationId}/campaigns/{campaignId}/schedule
          body: { recipients:{type:"tag",tagIds:[uuid]}, scheduleConfig:{sendAt: local ISO} }
  → Newsletter record updated (status: scheduled, ghlCampaignIds: {en: id, es: id})
  → At scheduledFor time: GHL sends email to all contacts with matching tag
  → Newsletter cron marks status: sent
```

### Lead Gen Flow

```
Visitor requests Google Drive file access (in-Drive UI)
  ↓
Cron every 1 min: POST /api/cron/lead-gen-process
  → getValidAccessToken(userId) [auto-refresh if expiring]
  → For each LeadGenDocument:
      → GET /drive/v3/files/{fileId}/accessproposals
      → For each new proposal:
          → POST /drive/v3/files/{fileId}/accessproposals/{proposalId}:resolve
              body: { action:"ACCEPT", role:["reader"], sendNotification:true }
          → POST /contacts/upsert
              body: { locationId, email, tags:[docTag, masterTag, langTag], firstName, lastName }
              → returns contactId
          → LeadGenCapture.upsert(googleProposalId, status:"approved", ghlContactId)
          → doc.totalCaptures++
          → slideInVersion.conversions++ / ctaVersion.conversions++
```

### Contact Form Flow

```
Visitor submits contact form (homepage modal)
  → POST /api/contact-form
  → Validate: name + (phone for WhatsApp | email for email)
  → Load LeadGenOperatorSettings → decrypt ghlApiKey
  → POST /contacts/upsert
      body: { locationId, email?, phone?, firstName, lastName, tags }
      → returns contactId
  → POST /conversations/messages/inbound
      body: { type:"Email", contactId, direction:"inbound", subject, message, html, emailTo, emailFrom? }
  → return { success: true }
```

---

## 13. GHL Account Setup Checklist

To set up GHL integration from scratch:

1. **Create a GHL Private Integration API key**
   - GHL → Settings → Integrations → API → Create New Integration
   - Scope: Contacts Read/Write, Conversations, Email Campaigns, Locations, Users
   - Copy the API key

2. **Get your Location ID**
   - GHL → Settings → Business Profile → Location ID

3. **Enter credentials in app**
   - Admin → Lead Gen Settings → GHL API Key + Location ID → Save

4. **Create subscriber tags in GHL** (for newsletter targeting)
   - GHL → Marketing → Tags → Create tags like "Newsletter EN", "Newsletter ES"
   - These must exactly match the tag names in `NewsletterSettings.languageConfig`

5. **Set newsletter settings**
   - Admin → Newsletter Settings → set `fromName`, `fromEmail`, select GHL user, configure language tags

6. **Register lead magnet documents**
   - Admin → Lead Gen → Connect Google Drive → Register documents with `ghlTag` values
   - The `ghlTag` values are applied to contacts who request access; they do NOT need to pre-exist in GHL (they are created on first upsert)

7. **Configure `masterTag`** (optional)
   - In Newsletter Settings, set a `masterTag` (e.g. "Newsletter Subscriber")
   - This tag is applied to ALL lead captures regardless of document language, enabling full-list emails

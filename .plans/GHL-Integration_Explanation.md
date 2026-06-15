GoHighLevel (GHL) Email Scheduling — Complete Technical Reference
1. High-level architecture
This system does not send email itself. It uses GHL's Email Campaigns V2 API in a strict two-step flow per campaign:

Create a draft email campaign (with full custom HTML body).
Schedule that campaign — set recipients (by tag) and the send time.
After scheduling, GHL performs the actual delivery. The app only tracks status in its own database and flips a row from scheduled → sent once the scheduled time passes (it does not poll GHL for real delivery confirmation).

One newsletter produces one GHL campaign per enabled language. Recipients are targeted by GHL tag IDs, and the contacts were previously tagged during lead capture.

2. Global API constants
All GHL calls share these (defined in lib/newsletter/ghl-email-client.ts):

Property	Value
Base URL
https://services.leadconnectorhq.com
Version header
2021-07-28
Auth header
Authorization: Bearer {apiKey}
Content-Type
application/json

ghl-email-client.ts
Lines 13-22
const GHL_BASE = 'https://services.leadconnectorhq.com'
const GHL_VERSION = '2021-07-28'
function ghlHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    Version: GHL_VERSION,
  }
}
3. The three GHL endpoints used for email
3.1 Create campaign (draft)
Method: POST
URL: https://services.leadconnectorhq.com/emails/public/v2/locations/{locationId}/campaigns/email-campaign
Request body:

Field	Type	Notes
name
string
Internal campaign name
subject
string
Email subject
previewText
string
Preheader text
fromName
string
Sender display name
fromEmail
string
Sender email
editorType
string
Always "html"
editorContent
string
The full HTML email body
timeZone
string
IANA tz, e.g. "America/Santo_Domingo"
userId
string
GHL user ID (campaign owner)
emailMeta
object
{ subject, fromName, fromEmail, previewText } — duplicates the top-level meta

ghl-email-client.ts
Lines 72-117
  const body = {
    name: opts.name,
    subject: opts.subject,
    previewText: opts.previewText,
    fromName: opts.fromName,
    fromEmail: opts.fromEmail,
    editorType: 'html',
    editorContent: opts.htmlBody,
    timeZone: opts.timeZone,
    userId: opts.userId,
    emailMeta: {
      subject: opts.subject,
      fromName: opts.fromName,
      fromEmail: opts.fromEmail,
      previewText: opts.previewText,
    },
  }
  // ...
  const res = await fetch(url, {
    method: 'POST',
    headers: ghlHeaders(opts.apiKey),
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as { id?: string; campaignId?: string; message?: string; errors?: unknown }
  // ...
  const campaignId = data.id ?? data.campaignId
Response handling: Reads JSON; campaign ID is taken from data.id or data.campaignId (whichever is present). Throws on non-2xx or if no ID is returned.

3.2 Schedule campaign
Method: POST
URL: https://services.leadconnectorhq.com/emails/public/v2/locations/{locationId}/campaigns/{campaignId}/schedule
Request body:

Field	Type	Notes
scheduleType
string
Always "scheduled"
timeZone
string
IANA tz
userId
string
GHL user ID
emailMeta
object
{ subject, fromName, fromEmail, previewText }
recipients
object
{ type: "tag", tagIds: string[] } — tag IDs, not names
scheduleConfig
object
{ sendAt: string }

ghl-email-client.ts
Lines 124-152
  const body = {
    scheduleType: 'scheduled',
    timeZone: opts.timeZone,
    userId: opts.userId,
    emailMeta: {
      subject: opts.emailMeta.subject,
      fromName: opts.emailMeta.fromName,
      fromEmail: opts.emailMeta.fromEmail,
      previewText: opts.emailMeta.previewText,
    },
    recipients: {
      type: 'tag',
      tagIds: opts.tagIds,
    },
    scheduleConfig: {
      sendAt: opts.scheduledDate,
    },
  }
  // ...
  const res = await fetch(url, {
    method: 'POST',
    headers: ghlHeaders(opts.apiKey),
    body: JSON.stringify(body),
  })
Response handling: Returns void. On failure, reads raw text, attempts to parse message, throws. Nothing is read from the success body.

CRITICAL NUANCE — sendAt format. Despite the stale JSDoc on the type (ScheduleCampaignOpts.scheduledDate says "ISO 8601 UTC datetime string"), the actual value passed at runtime is a local wall-clock datetime string with no timezone suffix, e.g. "2026-04-10T11:30:00". GHL interprets scheduleConfig.sendAt in the timeZone field, not as UTC. Passing a UTC Z ISO string here would schedule at the wrong time. See §5 for how this string is built.

3.3 Resolve tag names → tag IDs
Scheduling needs tag IDs, but the rest of the app stores tag names. So before scheduling, names are resolved to IDs.

Method: GET
URL: https://services.leadconnectorhq.com/locations/{locationId}/tags
Response shape: { tags?: { id: string; name: string }[] }

ghl-email-client.ts
Lines 194-212
export async function resolveTagIds(
  apiKey: string,
  locationId: string,
  tagNames: string[],
): Promise<string[]> {
  const allTags = await getGhlLocationTags(apiKey, locationId)
  const tagMap = new Map(allTags.map((t) => [t.name.toLowerCase(), t.id]))
  const ids: string[] = []
  for (const name of tagNames) {
    const id = tagMap.get(name.toLowerCase())
    if (id) {
      ids.push(id)
    } else {
      console.warn(`[newsletter/ghl] Tag not found in GHL: "${name}"`)
    }
  }
  return ids
}
Matching is case-insensitive. Tags that don't exist in GHL are silently skipped (warned, not thrown). If a language's tag can't be resolved, that whole language is skipped (see §4).

4. Orchestration flow
File: lib/newsletter/generate-newsletter.ts. Two entry points: generateArticleNewsletter() and generateWeeklyDigest(). Both follow the same shape:

Load newsletter settings (prisma.newsletterSettings.findFirst()) — requires fromName + fromEmail.
Load GHL credentials (prisma.leadGenOperatorSettings.findFirst()) — decrypt ghlApiKey, read ghlLocationId.
Load site settings (siteSettings key website_settings) for footer/branding.
Load timezone via getWebsiteTimezone() (default America/Santo_Domingo).
Require ghlUserId from newsletter settings (throws if missing).
Filter enabled languages from settings.languageConfig ([{ languageCode, tag, enabled }]).
Generate content via LLM (article teaser = prompt step 27; digest intro+teasers = step 28).
Create a Newsletter DB row with status: 'generating'.
Loop over each enabled language, sequentially:
resolveTagIds(apiKey, locationId, [tag]) → skip language if empty.
Build HTML (buildArticleNewsletterHtml / buildDigestNewsletterHtml).
createGhlEmailCampaign(...) → get campaignId.
Compute sendAt = toLocalSendAt(scheduledFor, timeZone).
scheduleGhlCampaign(...).
Record ghlCampaignIds[languageCode] = campaignId.
Update DB row to status: 'scheduled', store ghlCampaignIds map and last rendered htmlBody.
On any error: update row to status: 'failed' with the error message, then rethrow.
The per-language create+schedule core:


generate-newsletter.ts
Lines 286-323
      // Create GHL campaign
      console.log(`${LOG}   [lang=${languageCode}] Creating GHL campaign draft…`)
      const { campaignId } = await createGhlEmailCampaign({
        apiKey,
        locationId,
        name: `Article Newsletter — ${page.title} [${languageCode.toUpperCase()}]`,
        subject: `New Article: ${page.title}`,
        previewText: teaserText.slice(0, 100).replace(/\n/g, ' '),
        fromName: settings.fromName!,
        fromEmail: settings.fromEmail!,
        htmlBody,
        timeZone,
        userId: ghlUserId,
      })
      console.log(`${LOG}   [lang=${languageCode}] Campaign created: campaignId=${campaignId}`)
      // Schedule campaign — GHL sendAt must be local time in the given timezone, not UTC
      const sendAt = toLocalSendAt(scheduledFor, timeZone)
      console.log(`${LOG}   [lang=${languageCode}] Scheduling campaign: UTC=${scheduledFor.toISOString()} → local sendAt="${sendAt}" (${timeZone})`)
      await scheduleGhlCampaign({
        apiKey,
        locationId,
        campaignId,
        scheduledDate: sendAt,
        tagIds,
        timeZone,
        userId: ghlUserId,
        emailMeta: {
          subject: `New Article: ${page.title}`,
          fromName: settings.fromName!,
          fromEmail: settings.fromEmail!,
          previewText: teaserText.slice(0, 100).replace(/\n/g, ' '),
        },
      })
Preview text is always derived as content.slice(0, 100).replace(/\n/g, ' ').

Campaign names:

Article: Article Newsletter — {page.title} [{LANG}]
Digest: Weekly Digest — {YYYY-MM-DD} [{LANG}] (date = scheduledFor.toISOString().slice(0,10))
Partial-failure behavior (important): languages are processed in order. If language #1 succeeds (campaign already created+scheduled in GHL) and language #2 throws, the whole function jumps to the catch, marks the newsletter failed, and rethrows — but the already-created GHL campaign for language #1 remains in GHL. There's no rollback. Also there's no rate limiting, no batching, and no retry anywhere.

5. Scheduling time computation (the key nuance)
GHL's scheduleConfig.sendAt + timeZone expects local wall-clock time in that timezone, not a UTC ISO string. The app stores scheduledFor as a real UTC Date, then converts:


generate-newsletter.ts
Lines 79-91
function toLocalSendAt(utcDate: Date, timeZone: string): string {
  const local = new Intl.DateTimeFormat('sv-SE', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(utcDate)
  // sv-SE produces "2026-04-10 11:30:00" → "2026-04-10T11:30:00"
  return local.replace(' ', 'T')
}
The sv-SE locale is used because it natively formats as YYYY-MM-DD HH:mm:ss; the space is swapped for T. Result example: "2026-04-10T11:30:00" (no Z, no offset).

Timezone source (lib/utils/website-timezone.ts): reads siteSettings.website_settings.timezone; falls back to America/Santo_Domingo.


website-timezone.ts
Lines 5-25
/** Default IANA timezone for scheduling (Dominican Republic). */
export const DEFAULT_WEBSITE_TIMEZONE = 'America/Santo_Domingo'
export async function getWebsiteTimezone(): Promise<string> {
  try {
    const record = await prisma.siteSettings.findUnique({
      where: { key: WEBSITE_SETTINGS_KEY },
    })
    const value = record?.value as Record<string, unknown> | null | undefined
    const tz = value?.timezone
    if (typeof tz === 'string' && tz.length > 0) {
      return tz
    }
  } catch {
    // fall through
  }
  return DEFAULT_WEBSITE_TIMEZONE
}
6. Triggers
6.1 Article newsletter (manual, from UI)
POST /api/newsletter/generate with body { sitePageId: string, scheduledFor: string (ISO) }. The UI (content page modal) converts the user's local date+time in the website tz to a UTC ISO string before sending. Calls generateArticleNewsletter.

6.2 Weekly digest (cron-driven)
lib/cron/run-newsletter-cron.ts → runNewsletterCronJob(), invoked by POST/GET /api/cron/newsletter. Two jobs:

Mark-sent: flips Newsletter rows from scheduled → sent once scheduledFor <= now. This is purely DB bookkeeping; GHL already owns delivery.

run-newsletter-cron.ts
Lines 35-49
    const due = await prisma.newsletter.findMany({
      where: {
        status: 'scheduled',
        scheduledFor: { lte: now },
      },
      select: { id: true },
    })
    if (due.length > 0) {
      await prisma.newsletter.updateMany({
        where: { id: { in: due.map((d) => d.id) } },
        data: { status: 'sent', sentAt: now },
      })
      result.markedSent = due.length
    }
Auto-generate digest: only on the configured digestDay (0=Sun…6=Sat), once per week (Mon–Sun guard window), at preferredSendTime (HH:mm). If that time already passed today, it schedules for now + 5 minutes.

run-newsletter-cron.ts
Lines 78-91
    // Build the scheduled send datetime for today at preferredSendTime
    const [sendHour, sendMinute] = settings.preferredSendTime.split(':').map(Number)
    const scheduledFor = new Date(nowInTz)
    scheduledFor.setHours(sendHour, sendMinute, 0, 0)
    // If preferred time has already passed today, schedule for 5 minutes from now
    const sendTime = scheduledFor <= nowInTz ? new Date(now.getTime() + 5 * 60 * 1000) : scheduledFor
    try {
      const digestId = await generateWeeklyDigest({ scheduledFor: sendTime })
Two deployment gotchas worth flagging to whoever re-implements:

/api/cron/newsletter is not present in scripts/setup-cron.sh, so it must be wired into crontab manually.
/api/cron/weekly-digest is a different feature (Resend email to admins summarizing social posts) — not the GHL newsletter digest. Don't conflate them.
7. Authentication & credential storage
GHL API key + location ID: stored on LeadGenOperatorSettings (ghlApiKey encrypted, ghlLocationId plain). Loaded with findFirst() → effectively single-tenant (first operator row).
GHL user ID: stored separately on NewsletterSettings.ghlUserId. Required for both create and schedule (it's the campaign owner). Selected in the UI from GET /api/newsletter/ghl-users which calls GET /users/?locationId={locationId}.
Encryption (lib/social-media/oauth/encryption.ts): AES-256-GCM; key = SHA-256 of process.env.ENCRYPTION_KEY; stored as {iv}:{authTag}:{ciphertext} in base64. Without a key it falls back to plain base64 (dev only).

generate-newsletter.ts
Lines 47-55
async function loadGhlCredentials() {
  console.log(`${LOG} Loading GHL credentials from Lead Gen settings…`)
  const ops = await prisma.leadGenOperatorSettings.findFirst()
  if (!ops?.ghlApiKey || !ops?.ghlLocationId) {
    throw new Error('GHL credentials (API key + location ID) not configured in Lead Gen Settings.')
  }
  console.log(`${LOG} GHL credentials loaded: locationId=${ops.ghlLocationId}`)
  return { apiKey: decrypt(ops.ghlApiKey), locationId: ops.ghlLocationId }
}
Note: The GHL_API_KEY / GHL_LOCATION_ID env vars in env.example are not read at runtime — credentials live only in the DB. UserSettings.ghlApiKey/ghlLocationId also exist but are not used for email sending.

8. How recipients get tagged (the prerequisite)
Campaigns target tags, so contacts must already carry those tags. Tagging happens at lead capture via contacts/upsert (this is the only "write contact" path; it is not an email-send call):

Method: POST
URL: https://services.leadconnectorhq.com/contacts/upsert
Body: { locationId, email, tags: string[] (NAMES), firstName?, lastName? }

ghl-client.ts
Lines 23-39
  const body: Record<string, unknown> = {
    locationId,
    email,
    tags: allTags,
  }
  if (firstName) body.firstName = firstName
  if (lastName) body.lastName = lastName
  const res = await fetch('https://services.leadconnectorhq.com/contacts/upsert', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Version: '2021-07-28',
    },
    body: JSON.stringify(body),
  })
On lead capture (lib/lead-gen/process-proposals.ts), each contact gets: the document tag, the newsletter masterTag, and the matching language tag (newsletter-{lang} by convention). Those same language tags are what languageConfig references and what gets resolved to IDs at schedule time.

Key distinction: contact upsert uses tag NAMES (strings); campaign scheduling uses tag IDs. That's why resolveTagIds exists.

9. Database models
Newsletter:

type: "article" | "digest"
status: pending | generating | scheduled | sent | failed
ghlCampaignIds: JSON map, e.g. { "en": "<id>", "de": "<id>" }
scheduledFor: DateTime (UTC) — when GHL should send
sentAt: DateTime — set by cron when scheduledFor passes
htmlBody: last rendered HTML
digestArticleIds: JSON (digest only)
NewsletterSettings: fromName, fromEmail, ghlUserId, masterTag, preferredSendTime (default "09:00"), digestDay (default 6), languageConfig ([{languageCode, tag, enabled}]), plus branding (logos, colors, greeting, sign-off, disclaimer, unsubscribe).

LeadGenOperatorSettings: ghlApiKey (encrypted), ghlLocationId.

10. Complete endpoint inventory
Method	Endpoint	Purpose
POST
/emails/public/v2/locations/{locationId}/campaigns/email-campaign
Create draft campaign
POST
/emails/public/v2/locations/{locationId}/campaigns/{campaignId}/schedule
Schedule send by tag
GET
/locations/{locationId}/tags
Resolve tag names → IDs
GET
/users/?locationId={locationId}
List GHL users (pick campaign owner)
POST
/contacts/upsert
Tag contacts (recipient prerequisite, not sending)
11. Re-implementation checklist (for the other LLM)
Store GHL API key (encrypted) + location ID + user ID.
Tag contacts at capture with stable tag names (e.g. newsletter-{lang}).
Before scheduling, resolve tag names → IDs via GET /locations/{id}/tags (case-insensitive).
Create campaign: POST .../campaigns/email-campaign with editorType: "html", full editorContent, plus duplicated emailMeta. Read campaign ID from id or campaignId.
Schedule campaign: POST .../campaigns/{id}/schedule with scheduleType: "scheduled", recipients: { type: "tag", tagIds }, and scheduleConfig.sendAt.
sendAt must be local wall-clock time (YYYY-MM-DDTHH:mm:ss, no Z) matching the timeZone field — never a UTC ISO string. Convert from UTC using Intl.DateTimeFormat('sv-SE', { timeZone, ... }).
All requests need the Version: 2021-07-28 header and Authorization: Bearer {apiKey}.
Create one campaign per language; persist a {lang: campaignId} map.
Track status locally; mark sent after the scheduled time — do not expect/poll a GHL delivery callback.
Be aware: no retry, no batching, no rate-limit handling, and partial multi-language failures leave already-created GHL campaigns orphaned.
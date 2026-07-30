/**
 * Google Drive client for the central lead-gen Drive (leadgen plan Phase 1).
 *
 * Auth (2026-07-30, two branches — OAuth preferred):
 * 1. OAUTH REFRESH TOKEN — Google zeroed service-account storage quotas
 *    (uploads 403), so the platform acts as the operator's own Google account
 *    via a one-time consent (drive.file scope: only app-created files, no
 *    restricted-scope verification; Production consent status = token never
 *    auto-expires). Env: GOOGLE_DRIVE_OAUTH_CLIENT_ID / _CLIENT_SECRET /
 *    _REFRESH_TOKEN.
 * 2. SERVICE-ACCOUNT JWT (legacy fallback; folders work, uploads 403) —
 *    Env: GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON (raw or base64).
 * Optional: GOOGLE_DRIVE_ROOT_FOLDER_ID — parent for all account folders.
 * No googleapis dependency; RS256 via node:crypto.
 */
import { createSign } from 'node:crypto'
import { logger } from '../logger'
import { instrumentCall } from '../net/instrument'
import { withTimeout } from '../net/with-timeout'

const DRIVE = 'https://www.googleapis.com/drive/v3'
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3'
const SCOPE = 'https://www.googleapis.com/auth/drive'

interface ServiceAccountKey {
  client_email: string
  private_key: string
  token_uri?: string
}

let cachedToken: { token: string; expiresAt: number } | null = null

function serviceAccount(): ServiceAccountKey {
  const raw = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON
  if (!raw) throw new Error('GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON not configured')
  const json = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8')
  return JSON.parse(json) as ServiceAccountKey
}

function oauthConfigured(): boolean {
  return !!(
    process.env.GOOGLE_DRIVE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET &&
    process.env.GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN
  )
}

export function driveConfigured(): boolean {
  return oauthConfigured() || !!process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON
}

async function accessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token

  // Preferred: operator OAuth (files owned by a real account with quota).
  if (oauthConfigured()) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.GOOGLE_DRIVE_OAUTH_CLIENT_ID!,
        client_secret: process.env.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET!,
        refresh_token: process.env.GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN!,
      }),
    })
    if (!res.ok) throw new Error(`Drive OAuth refresh failed: ${res.status} ${(await res.text()).slice(0, 200)}`)
    const data = (await res.json()) as { access_token: string; expires_in: number }
    cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
    return data.access_token
  }

  const sa = serviceAccount()
  const now = Math.floor(Date.now() / 1000)
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const claims = Buffer.from(
    JSON.stringify({
      iss: sa.client_email,
      scope: SCOPE,
      aud: sa.token_uri ?? 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  ).toString('base64url')
  const signer = createSign('RSA-SHA256')
  signer.update(`${header}.${claims}`)
  const signature = signer.sign(sa.private_key).toString('base64url')
  const assertion = `${header}.${claims}.${signature}`

  const res = await fetch(sa.token_uri ?? 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })
  if (!res.ok) throw new Error(`Drive token exchange failed: ${res.status} ${(await res.text()).slice(0, 200)}`)
  const data = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
  return data.access_token
}

async function driveRequest<T>(path: string, init: RequestInit = {}, base = DRIVE): Promise<T> {
  const token = await accessToken()
  const res = await instrumentCall({ provider: 'gdrive', op: `${init.method ?? 'GET'} ${path.split('?')[0]}` }, () =>
    withTimeout(
      (signal) =>
        fetch(`${base}${path}`, {
          ...init,
          headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
          signal,
        }),
      30_000,
      `gdrive ${path.split('?')[0]}`,
    ),
  )
  if (!res.ok) {
    throw new Error(`Drive ${init.method ?? 'GET'} ${path.split('?')[0]} → ${res.status}: ${(await res.text()).slice(0, 300)}`)
  }
  return (res.status === 204 ? ({} as T) : ((await res.json()) as T))
}

/** Query params helper honoring an optional Shared Drive context. */
function sd(params: Record<string, string> = {}): string {
  return new URLSearchParams({ supportsAllDrives: 'true', ...params }).toString()
}

// ── Folders & files ───────────────────────────────────────────────────────────

export async function ensureAccountFolder(accountId: string, accountName: string): Promise<string> {
  const name = `client-${accountName.replace(/[^\w\s-]/g, '').slice(0, 40)}-${accountId.slice(0, 8)}`
  const root = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID
  const q = encodeURIComponent(
    `name = '${name.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
  )
  const found = await driveRequest<{ files: { id: string }[] }>(
    `/files?${sd({ q: decodeURIComponent(q), includeItemsFromAllDrives: 'true' })}`,
  )
  if (found.files?.[0]) return found.files[0].id
  const created = await driveRequest<{ id: string }>(`/files?${sd()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      ...(root ? { parents: [root] } : {}),
    }),
  })
  logger.info({ accountId, folderId: created.id }, '[gdrive] account folder created')
  return created.id
}

export async function uploadPdf(folderId: string, name: string, pdf: Buffer): Promise<{ fileId: string; webViewLink: string }> {
  const metadata = JSON.stringify({ name, parents: [folderId], mimeType: 'application/pdf' })
  const boundary = `socioply${Date.now()}`
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`),
    pdf,
    Buffer.from(`\r\n--${boundary}--`),
  ])
  const created = await driveRequest<{ id: string }>(
    `/files?${sd({ uploadType: 'multipart' })}`,
    {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    },
    UPLOAD,
  )
  const meta = await driveRequest<{ webViewLink: string }>(`/files/${created.id}?${sd({ fields: 'webViewLink' })}`)
  return { fileId: created.id, webViewLink: meta.webViewLink }
}

export async function deleteFile(fileId: string): Promise<void> {
  await driveRequest(`/files/${fileId}?${sd()}`, { method: 'DELETE' }).catch((err) =>
    logger.warn({ fileId, err }, '[gdrive] delete failed (continuing)'),
  )
}

// ── Permissions & access proposals ────────────────────────────────────────────

export async function grantReader(fileId: string, email: string, notify = true): Promise<void> {
  await driveRequest(`/files/${fileId}/permissions?${sd({ sendNotificationEmail: notify ? 'true' : 'false' })}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'reader', type: 'user', emailAddress: email }),
  })
}

export async function shareFolderReadOnly(folderId: string, email: string): Promise<void> {
  await grantReader(folderId, email)
}

export interface AccessProposal {
  proposalId: string
  requesterEmailAddress?: string
  recipientEmailAddress?: string
  fileId?: string
  createTime?: string
  rolesAndViews?: { role?: string; view?: string }[]
}

export async function listAccessProposals(fileId: string): Promise<AccessProposal[]> {
  const data = await driveRequest<{ accessProposals?: AccessProposal[] }>(`/files/${fileId}/accessproposals`)
  return data.accessProposals ?? []
}

export async function resolveAccessProposal(fileId: string, proposalId: string): Promise<void> {
  await driveRequest(`/files/${fileId}/accessproposals/${proposalId}:resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'ACCEPT', role: ['reader'], sendNotification: true }),
  })
}

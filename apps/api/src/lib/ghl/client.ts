import {
  GHL_API_VERSION,
  GHL_BASE_URL,
  type GhlMediaItem,
  type GhlPostStatus,
  type GhlPostType,
  type GhlSocialAccount,
} from './types'
import { logger } from '../logger'

export interface GhlRequestOptions {
  method?: string
  body?: unknown
}

async function ghlRequest<T>(
  apiKey: string,
  path: string,
  options: GhlRequestOptions = {},
): Promise<T> {
  const url = `${GHL_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
  const method = options.method ?? 'GET'

  logger.debug({ method, url }, '[ghl] request')

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Version: GHL_API_VERSION,
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  const text = await response.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text }
    }
  }

  const topLevelKeys =
    data && typeof data === 'object' && !Array.isArray(data)
      ? Object.keys(data as object)
      : Array.isArray(data)
        ? ['<array>']
        : []

  logger.debug(
    { method, url, status: response.status, topLevelKeys },
    '[ghl] response',
  )

  if (!response.ok) {
    const message =
      typeof data === 'object' && data !== null && 'message' in data
        ? String((data as { message?: unknown }).message)
        : `GHL API error (${response.status})`
    logger.error({ method, url, status: response.status, topLevelKeys, message }, '[ghl] request failed')
    throw new Error(message)
  }

  return data as T
}

/**
 * Extract an array of social accounts from whatever shape GHL returns.
 * GHL has returned accounts under several different keys across API versions:
 *   - data.results.accounts  (documented v1 shape)
 *   - data.accounts          (alternative v1)
 *   - data.data              (common v2 / LeadConnector pattern)
 *   - data itself as an array
 */
function extractAccountsFromResponse(data: unknown): GhlSocialAccount[] {
  if (!data || typeof data !== 'object') return []

  if (Array.isArray(data)) return data as GhlSocialAccount[]

  const d = data as Record<string, unknown>

  // Try known nested shapes first
  const candidates: unknown[] = [
    d.results && typeof d.results === 'object'
      ? (d.results as Record<string, unknown>).accounts
      : undefined,
    d.accounts,
    d.data,
    d.socialMediaAccounts,
    d.items,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate as GhlSocialAccount[]
    }
  }

  // Return any non-empty array found under any key
  for (const val of Object.values(d)) {
    if (Array.isArray(val) && val.length > 0) {
      logger.warn(
        { foundUnderKeys: Object.keys(d).filter((k) => Array.isArray(d[k] as unknown)) },
        '[ghl] accounts found under unexpected key — parser needs updating',
      )
      return val as GhlSocialAccount[]
    }
  }

  return []
}

export async function listGhlAccounts(
  apiKey: string,
  locationId: string,
): Promise<GhlSocialAccount[]> {
  const data = await ghlRequest<unknown>(
    apiKey,
    `/social-media-posting/${locationId}/accounts`,
  )

  const accounts = extractAccountsFromResponse(data)

  if (accounts.length === 0) {
    const topLevelKeys =
      data && typeof data === 'object' && !Array.isArray(data)
        ? Object.keys(data as object)
        : Array.isArray(data)
          ? ['<array>']
          : ['<empty>']
    logger.warn(
      { locationId, topLevelKeys, rawDataType: typeof data },
      '[ghl] listGhlAccounts returned 0 accounts — check locationId and API key scopes',
    )
  } else {
    logger.info(
      {
        locationId,
        count: accounts.length,
        platforms: [...new Set(accounts.map((a) => a.platform).filter(Boolean))],
      },
      '[ghl] accounts loaded',
    )
  }

  return accounts
}

export interface CreateGhlPostInput {
  apiKey: string
  locationId: string
  userId: string
  accountIds: string[]
  summary: string
  type?: GhlPostType
  media?: GhlMediaItem[]
  status?: GhlPostStatus
  scheduleDate?: string
}

export interface CreateGhlPostResult {
  ghlPostId: string
  platformPostId?: string
  postUrl?: string
  status?: string
}

function extractPostId(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const root = payload as Record<string, unknown>
  const results = root.results as Record<string, unknown> | undefined
  const post = (results?.post ?? root.post ?? root) as Record<string, unknown> | undefined
  if (!post) return null
  const id = post._id ?? post.id ?? post.postId
  return typeof id === 'string' ? id : null
}

export async function createGhlPost(input: CreateGhlPostInput): Promise<CreateGhlPostResult> {
  const body: Record<string, unknown> = {
    accountIds: input.accountIds,
    type: input.type ?? 'post',
    userId: input.userId,
    summary: input.summary,
    status: input.status ?? 'scheduled',
  }

  if (input.media?.length) {
    body.media = input.media
  }
  if (input.scheduleDate) {
    body.scheduleDate = input.scheduleDate
  }

  const data = await ghlRequest<Record<string, unknown>>(
    input.apiKey,
    `/social-media-posting/${input.locationId}/posts`,
    { method: 'POST', body },
  )

  const ghlPostId = extractPostId(data)
  if (!ghlPostId) {
    throw new Error('GHL did not return a post id')
  }

  const results = data.results as Record<string, unknown> | undefined
  const post = (results?.post ?? {}) as Record<string, unknown>

  return {
    ghlPostId,
    platformPostId: typeof post.postId === 'string' ? post.postId : undefined,
    postUrl: typeof post.postId === 'string' ? String(post.postId) : undefined,
    status: typeof post.status === 'string' ? post.status : undefined,
  }
}

export async function getGhlPost(
  apiKey: string,
  locationId: string,
  postId: string,
): Promise<Record<string, unknown>> {
  return ghlRequest<Record<string, unknown>>(
    apiKey,
    `/social-media-posting/${locationId}/posts/${postId}`,
  )
}

export interface EditGhlPostInput {
  apiKey: string
  locationId: string
  postId: string
  summary?: string
  media?: GhlMediaItem[]
  status?: GhlPostStatus
  scheduleDate?: string
}

export async function editGhlPost(input: EditGhlPostInput): Promise<Record<string, unknown>> {
  const body: Record<string, unknown> = {}
  if (input.summary !== undefined) body.summary = input.summary
  if (input.media !== undefined) body.media = input.media
  if (input.status !== undefined) body.status = input.status
  if (input.scheduleDate !== undefined) body.scheduleDate = input.scheduleDate

  return ghlRequest<Record<string, unknown>>(
    input.apiKey,
    `/social-media-posting/${input.locationId}/posts/${input.postId}`,
    { method: 'PUT', body },
  )
}

export function getGhlOAuthStartUrl(platform: string): string {
  return `${GHL_BASE_URL}/social-media-posting/oauth/${platform}/start`
}

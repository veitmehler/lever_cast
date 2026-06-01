import {
  GHL_API_VERSION,
  GHL_BASE_URL,
  type GhlMediaItem,
  type GhlPostStatus,
  type GhlPostType,
  type GhlSocialAccount,
} from './types'

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
  const response = await fetch(url, {
    method: options.method ?? 'GET',
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

  if (!response.ok) {
    const message =
      typeof data === 'object' && data !== null && 'message' in data
        ? String((data as { message?: unknown }).message)
        : `GHL API error (${response.status})`
    throw new Error(message)
  }

  return data as T
}

export async function listGhlAccounts(
  apiKey: string,
  locationId: string,
): Promise<GhlSocialAccount[]> {
  const data = await ghlRequest<{
    results?: { accounts?: GhlSocialAccount[] }
    accounts?: GhlSocialAccount[]
  }>(apiKey, `/social-media-posting/${locationId}/accounts`)

  return data.results?.accounts ?? data.accounts ?? []
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

export function getGhlOAuthStartUrl(platform: string): string {
  return `${GHL_BASE_URL}/social-media-posting/oauth/${platform}/start`
}

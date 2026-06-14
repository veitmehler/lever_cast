import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the data/crypto/storage boundaries so postToTelegram is exercised with no
// real DB, key, or network.
const apiKeyFindFirst = vi.fn()
vi.mock('../prisma', () => ({
  prisma: {
    apiKey: { findFirst: (...a: unknown[]) => apiKeyFindFirst(...a) },
  },
}))
vi.mock('../encryption', () => ({
  decrypt: (v: string) => `tok-${v}`,
}))
const downloadImageFromStorage = vi.fn()
vi.mock('../storage', () => ({
  downloadImageFromStorage: (...a: unknown[]) => downloadImageFromStorage(...a),
}))

import { postToTelegram } from '../telegramApi'

// Helper to build a fetch Response stub with a json() body.
function jsonResponse(ok: boolean, body: unknown, status = ok ? 200 : 400) {
  return { ok, status, json: async () => body } as unknown as Response
}

const fetchMock = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', fetchMock)
  apiKeyFindFirst.mockResolvedValue({ encryptedKey: 'enc' })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('postToTelegram — validation (no network)', () => {
  it('rejects content over the 1,000 character limit before any token lookup', async () => {
    const res = await postToTelegram('user_A', 'x'.repeat(1001), '@chan')
    expect(res).toEqual({
      success: false,
      error: expect.stringContaining('1,000 character limit'),
    })
    expect(apiKeyFindFirst).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects an empty chat id', async () => {
    const res = await postToTelegram('user_A', 'hello', '')
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error).toContain('chat/channel ID is required')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fails when the user has no telegram bot token', async () => {
    apiKeyFindFirst.mockResolvedValue(null)
    const res = await postToTelegram('user_A', 'hello', '@chan')
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error).toContain('Telegram bot token not found')
  })
})

describe('postToTelegram — text message', () => {
  it('sends to the decrypted bot token endpoint and returns the message id', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(true, { ok: true, result: { message_id: 42, chat: { id: -100123 } } }),
    )

    const res = await postToTelegram('user_A', 'hello world', '@chan')

    expect(res).toEqual({ success: true, messageId: 42, chatId: '-100123' })
    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toBe('https://api.telegram.org/bottok-enc/sendMessage')
    const init = fetchMock.mock.calls[0][1] as { method: string; body: string }
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toMatchObject({ chat_id: '@chan', text: 'hello world', parse_mode: 'HTML' })
  })

  it('maps a 401 to an invalid-token message', async () => {
    fetchMock.mockResolvedValue(jsonResponse(false, { ok: false, description: 'Unauthorized', error_code: 401 }, 401))
    const res = await postToTelegram('user_A', 'hi', '@chan')
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error).toContain('bot token is invalid')
  })

  it('maps a 403 to a not-an-admin message', async () => {
    fetchMock.mockResolvedValue(jsonResponse(false, { ok: false, description: 'Forbidden', error_code: 403 }, 403))
    const res = await postToTelegram('user_A', 'hi', '@chan')
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error).toContain('admin to the channel')
  })

  it('maps a 400 to an invalid-chat message that includes the api description', async () => {
    fetchMock.mockResolvedValue(jsonResponse(false, { ok: false, description: 'chat not found', error_code: 400 }, 400))
    const res = await postToTelegram('user_A', 'hi', '@chan')
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error).toContain('chat not found')
  })

  it('returns a generic error for an unmapped error code', async () => {
    fetchMock.mockResolvedValue(jsonResponse(false, { ok: false, description: 'flood wait', error_code: 429 }, 429))
    const res = await postToTelegram('user_A', 'hi', '@chan')
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error).toContain('flood wait')
  })
})

describe('postToTelegram — photo with fallback', () => {
  it('sends a photo via sendPhoto when an image url is supplied', async () => {
    downloadImageFromStorage.mockResolvedValue(Buffer.from('img'))
    fetchMock.mockResolvedValue(
      jsonResponse(true, { ok: true, result: { message_id: 7, chat: { id: 1 } } }),
    )

    const res = await postToTelegram('user_A', 'cap', '@chan', 'https://cdn/img.png')

    expect(res).toEqual({ success: true, messageId: 7, chatId: '@chan' })
    expect(downloadImageFromStorage).toHaveBeenCalledWith('https://cdn/img.png')
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.telegram.org/bottok-enc/sendPhoto')
  })

  it('falls back to a text message when the photo send fails', async () => {
    downloadImageFromStorage.mockResolvedValue(Buffer.from('img'))
    fetchMock
      // first call: sendPhoto fails
      .mockResolvedValueOnce(jsonResponse(false, { ok: false, description: 'bad photo', error_code: 400 }, 400))
      // second call: text sendMessage succeeds
      .mockResolvedValueOnce(jsonResponse(true, { ok: true, result: { message_id: 9, chat: { id: 2 } } }))

    const res = await postToTelegram('user_A', 'cap', '@chan', 'https://cdn/img.png')

    expect(res).toEqual({ success: true, messageId: 9, chatId: '2' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0][0]).toContain('/sendPhoto')
    expect(fetchMock.mock.calls[1][0]).toContain('/sendMessage')
  })
})

describe('postToTelegram — unexpected errors', () => {
  it('returns a failure result when fetch throws', async () => {
    fetchMock.mockRejectedValue(new Error('network down'))
    const res = await postToTelegram('user_A', 'hi', '@chan')
    expect(res).toEqual({ success: false, error: 'network down' })
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const lookupMock = vi.fn()
vi.mock('node:dns/promises', () => ({ lookup: (...a: unknown[]) => lookupMock(...a) }))

import { isBlockedIp, assertSafeWpUrl, SsrfError } from '../ssrf'

describe('isBlockedIp', () => {
  it('blocks private / loopback / link-local IPv4', () => {
    for (const ip of [
      '0.0.0.0',
      '10.1.2.3',
      '127.0.0.1',
      '169.254.169.254', // cloud metadata
      '172.16.0.1',
      '172.31.255.255',
      '192.168.1.1',
      '100.64.0.1', // CGNAT
      '255.255.255.255',
      '224.0.0.1',
    ]) {
      expect(isBlockedIp(ip), ip).toBe(true)
    }
  })

  it('allows normal public IPv4', () => {
    for (const ip of ['8.8.8.8', '1.1.1.1', '172.32.0.1', '93.184.216.34']) {
      expect(isBlockedIp(ip), ip).toBe(false)
    }
  })

  it('blocks private / loopback IPv6 and IPv4-mapped', () => {
    for (const ip of ['::1', '::', 'fe80::1', 'fc00::1', 'fd12::34', '::ffff:127.0.0.1']) {
      expect(isBlockedIp(ip), ip).toBe(true)
    }
  })

  it('allows public IPv6', () => {
    expect(isBlockedIp('2606:4700:4700::1111')).toBe(false)
  })

  it('treats non-IP strings as blocked', () => {
    expect(isBlockedIp('not-an-ip')).toBe(true)
  })
})

describe('assertSafeWpUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.WP_ALLOW_HTTP
    delete process.env.WP_SSRF_ALLOWLIST
  })
  afterEach(() => {
    delete process.env.WP_ALLOW_HTTP
    delete process.env.WP_SSRF_ALLOWLIST
  })

  it('allows a public https host', async () => {
    lookupMock.mockResolvedValue([{ address: '93.184.216.34', family: 4 }])
    await expect(assertSafeWpUrl('https://example.com/wp')).resolves.toBeUndefined()
  })

  it('rejects http by default', async () => {
    await expect(assertSafeWpUrl('http://example.com')).rejects.toBeInstanceOf(SsrfError)
  })

  it('allows http when WP_ALLOW_HTTP=true', async () => {
    process.env.WP_ALLOW_HTTP = 'true'
    lookupMock.mockResolvedValue([{ address: '93.184.216.34', family: 4 }])
    await expect(assertSafeWpUrl('http://example.com')).resolves.toBeUndefined()
  })

  it('rejects non-http(s) schemes', async () => {
    await expect(assertSafeWpUrl('file:///etc/passwd')).rejects.toBeInstanceOf(SsrfError)
    await expect(assertSafeWpUrl('gopher://x')).rejects.toBeInstanceOf(SsrfError)
  })

  it('rejects an IP-literal pointing at the metadata endpoint', async () => {
    await expect(assertSafeWpUrl('https://169.254.169.254/latest/meta-data/')).rejects.toBeInstanceOf(
      SsrfError,
    )
    expect(lookupMock).not.toHaveBeenCalled() // IP literal → no DNS needed
  })

  it('rejects a hostname that resolves to a private IP', async () => {
    lookupMock.mockResolvedValue([{ address: '10.0.0.5', family: 4 }])
    await expect(assertSafeWpUrl('https://internal.attacker.com')).rejects.toBeInstanceOf(SsrfError)
  })

  it('rejects if ANY resolved address is private (DNS-rebinding style)', async () => {
    lookupMock.mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
      { address: '127.0.0.1', family: 4 },
    ])
    await expect(assertSafeWpUrl('https://mixed.example.com')).rejects.toBeInstanceOf(SsrfError)
  })

  it('honors the allowlist for an internal host', async () => {
    process.env.WP_SSRF_ALLOWLIST = 'wp.internal.local'
    await expect(assertSafeWpUrl('https://wp.internal.local/wp')).resolves.toBeUndefined()
    expect(lookupMock).not.toHaveBeenCalled()
  })

  it('rejects an unresolvable host', async () => {
    lookupMock.mockRejectedValue(new Error('ENOTFOUND'))
    await expect(assertSafeWpUrl('https://does-not-exist.example')).rejects.toBeInstanceOf(SsrfError)
  })
})

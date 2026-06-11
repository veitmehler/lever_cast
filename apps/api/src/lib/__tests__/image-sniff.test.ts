import { describe, it, expect } from 'vitest'
import { sniffImageMime, extForImageMime } from '../image-sniff'

function pad(bytes: number[]): Buffer {
  // Pad to >= 12 bytes so the length guard passes.
  const arr = [...bytes]
  while (arr.length < 12) arr.push(0)
  return Buffer.from(arr)
}

describe('sniffImageMime', () => {
  it('detects JPEG', () => {
    expect(sniffImageMime(pad([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg')
  })

  it('detects PNG', () => {
    expect(sniffImageMime(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('image/png')
  })

  it('detects GIF87a and GIF89a', () => {
    expect(sniffImageMime(Buffer.from('GIF87a' + '\0'.repeat(6)))).toBe('image/gif')
    expect(sniffImageMime(Buffer.from('GIF89a' + '\0'.repeat(6)))).toBe('image/gif')
  })

  it('detects WEBP', () => {
    const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0, 0, 0, 0]), Buffer.from('WEBP')])
    expect(sniffImageMime(webp)).toBe('image/webp')
  })

  it('rejects non-image payloads (e.g. HTML/script mislabeled as an image)', () => {
    expect(sniffImageMime(Buffer.from('<html><script>alert(1)</script>'))).toBeNull()
    expect(sniffImageMime(Buffer.from('<svg onload=alert(1)>'))).toBeNull()
  })

  it('rejects buffers too short to identify', () => {
    expect(sniffImageMime(Buffer.from([0xff, 0xd8]))).toBeNull()
  })
})

describe('extForImageMime', () => {
  it('maps mimes to extensions', () => {
    expect(extForImageMime('image/jpeg')).toBe('jpg')
    expect(extForImageMime('image/png')).toBe('png')
    expect(extForImageMime('image/gif')).toBe('gif')
    expect(extForImageMime('image/webp')).toBe('webp')
  })
})

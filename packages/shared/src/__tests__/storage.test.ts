import { describe, it, expect } from 'vitest'
import { extractFilePathFromUrl } from '../storage'

// Pins the behavior of the (formerly duplicated) URL helper after consolidation.
describe('extractFilePathFromUrl', () => {
  it('returns the key from a CloudFront/CDN URL', () => {
    expect(extractFilePathFromUrl('https://cdn.socioply.com/user_1/123-abc.png')).toBe(
      'user_1/123-abc.png',
    )
  })

  it('returns null for the CDN root', () => {
    expect(extractFilePathFromUrl('https://cdn.socioply.com/')).toBeNull()
  })

  it('extracts the object path from a legacy Supabase storage URL', () => {
    const out = extractFilePathFromUrl(
      'https://proj.supabase.co/storage/v1/object/public/post-images/user_1/pic.jpg',
    )
    expect(out).toBe('user_1/pic.jpg')
  })

  it('returns null for a non-URL string', () => {
    expect(extractFilePathFromUrl('not a url')).toBeNull()
  })
})

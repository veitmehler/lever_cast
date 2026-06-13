import { describe, it, expect } from 'vitest'
import { buildGhlMediaArray } from '../dispatcher'

describe('buildGhlMediaArray', () => {
  it('sends ONLY the video when a post carries both videoUrl and mediaUrls (hook_video / F6)', () => {
    const media = buildGhlMediaArray({
      videoUrl: 'https://cdn.example.com/hook.mp4',
      mediaUrls: [
        'https://cdn.example.com/slide-1.png',
        'https://cdn.example.com/slide-2.png',
      ],
      imageUrl: 'https://cdn.example.com/slide-1.png',
    })
    expect(media).toEqual([
      { url: 'https://cdn.example.com/hook.mp4', type: 'video/mp4' },
    ])
  })

  it('sends all carousel images when there is no video', () => {
    const media = buildGhlMediaArray({
      mediaUrls: [
        'https://cdn.example.com/slide-1.png',
        'https://cdn.example.com/slide-2.jpg',
      ],
    })
    expect(media).toEqual([
      { url: 'https://cdn.example.com/slide-1.png', type: 'image/png' },
      { url: 'https://cdn.example.com/slide-2.jpg', type: 'image/jpeg' },
    ])
  })

  it('falls back to imageUrl when no video and no mediaUrls', () => {
    const media = buildGhlMediaArray({ imageUrl: 'https://cdn.example.com/cover.jpg' })
    expect(media).toEqual([
      { url: 'https://cdn.example.com/cover.jpg', type: 'image/jpeg' },
    ])
  })

  it('returns an empty array when no media is provided', () => {
    expect(buildGhlMediaArray({})).toEqual([])
  })
})

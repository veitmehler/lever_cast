import { describe, it, expect, vi } from 'vitest'

// buildHtmlBody doesn't use it, but the module imports it from the shared package.
vi.mock('@socioply/shared', () => ({ uploadBufferWithKey: vi.fn() }))

import { buildHtmlBody } from '../html-target'
import type { OutputPayload } from '../types'

function makePayload(over: Partial<OutputPayload> = {}): OutputPayload {
  return {
    jobId: 'job_1',
    userId: 'user_A',
    title: 'My Title',
    slug: 'my-title',
    bodyHtml: '<p>Body content</p>',
    bodyMarkdown: '',
    excerpt: '',
    seoTitle: 'SEO Title',
    seoDescription: 'SEO description',
    primaryKeyword: '',
    disclaimer: '',
    schemaJson: '{}',
    citations: [],
    featuredImage: null,
    diagrams: [],
    meta: {},
    articleTypography: null,
    ...over,
  } as OutputPayload
}

describe('buildHtmlBody — document shell', () => {
  it('embeds the SEO title/description in the head and the body content', () => {
    const html = buildHtmlBody(makePayload())
    expect(html.startsWith('<!doctype html>')).toBe(true)
    expect(html).toContain('<title>SEO Title</title>')
    expect(html).toContain('<meta name="description" content="SEO description" />')
    expect(html).toContain('<link rel="canonical" href="my-title" />')
    expect(html).toContain('<p>Body content</p>')
    // snippet preview always rendered
    expect(html).toContain('<div class="seo-title">SEO Title</div>')
  })

  it('escapes HTML-significant characters in the title', () => {
    const html = buildHtmlBody(makePayload({ title: 'A <b> & "X"', seoTitle: 'T & <i>' }))
    expect(html).toContain('<title>T &amp; &lt;i&gt;</title>')
    expect(html).toContain('<h1>A &lt;b&gt; &amp; &quot;X&quot;</h1>')
  })
})

describe('buildHtmlBody — hero vs standalone h1', () => {
  it('renders a standalone h1 and no og:image when there is no featured image', () => {
    const html = buildHtmlBody(makePayload())
    expect(html).toContain('<h1>My Title</h1>')
    expect(html).not.toContain('class="hero-wrapper"')
    expect(html).not.toContain('og:image')
  })

  it('renders the hero overlay (no standalone h1) and og:image when a featured image exists', () => {
    const html = buildHtmlBody(makePayload({
      featuredImage: { s3Key: 'k', cdnUrl: 'https://cdn/featured.jpg', alt: 'Alt text' },
      meta: { readingTime: 6 },
    }))
    expect(html).toContain('class="hero-wrapper"')
    expect(html).toContain('src="https://cdn/featured.jpg"')
    expect(html).toContain('⏱ 6 min read')
    expect(html).toContain('<meta property="og:image" content="https://cdn/featured.jpg" />')
    // standalone h1 is suppressed; the only h1 is inside the overlay
    expect(html.match(/<h1>My Title<\/h1>/g) ?? []).toHaveLength(1)
  })
})

describe('buildHtmlBody — meta bar', () => {
  it('shows reading time (no hero), keyword, and a formatted published date', () => {
    const html = buildHtmlBody(makePayload({
      primaryKeyword: 'widgets',
      meta: { readingTime: 4, publishedAt: new Date('2026-01-15T00:00:00Z') },
    }))
    expect(html).toContain('<span>4 min read</span>')
    expect(html).toContain('<span>widgets</span>')
    expect(html).toContain('January')
  })
})

describe('buildHtmlBody — references', () => {
  it('lists only non-inline citations with a url', () => {
    const html = buildHtmlBody(makePayload({
      citations: [
        { link_title: 'Reference One', link_url: 'https://ref.com', source_type: 'reference' },
        { link_title: 'Inline', link_url: 'https://inline.com', source_type: 'inline' },
        { link_title: 'No URL', link_url: '', source_type: 'reference' },
      ],
    }))
    expect(html).toContain('<section class="citations">')
    expect(html).toContain('href="https://ref.com"')
    expect(html).toContain('Reference One')
    expect(html).not.toContain('https://inline.com')
  })

  it('omits the references section when there are no reference citations', () => {
    const html = buildHtmlBody(makePayload({
      citations: [{ link_title: 'Inline', link_url: 'https://inline.com', source_type: 'inline' }],
    }))
    expect(html).not.toContain('class="citations"')
  })
})

describe('buildHtmlBody — excerpt, disclaimer, typography', () => {
  it('renders the excerpt and disclaimer when present', () => {
    const html = buildHtmlBody(makePayload({ excerpt: 'A short excerpt', disclaimer: 'Not advice' }))
    expect(html).toContain('<p class="excerpt">A short excerpt</p>')
    expect(html).toContain('<footer class="disclaimer">Not advice</footer>')
  })

  it('injects a typography style block built from articleTypography', () => {
    const html = buildHtmlBody(makePayload({
      articleTypography: { fontFamily: 'Inter', fontWeight: '600', fontSizeBase: '17px' },
    }))
    expect(html).toContain('.page{font-family:Inter;font-weight:600;font-size:17px}')
  })
})

describe('buildHtmlBody — relativeImages (bundle mode)', () => {
  it('rewrites the featured image and diagram urls to relative bundle paths', () => {
    const html = buildHtmlBody(makePayload({
      bodyHtml: '<img src="https://cdn/diag1.svg" />',
      featuredImage: { s3Key: 'k', cdnUrl: 'https://cdn/featured.jpg', alt: 'a' },
      diagrams: [{
        position: 1, sectionAnchor: 's', sectionTitle: 'S', cdnUrl: 'https://cdn/d1.png',
        svgCdnUrl: 'https://cdn/diag1.svg', svgContent: '<svg/>', pngS3Key: 'p', svgS3Key: 'sv',
      }],
    }), { relativeImages: true })
    expect(html).toContain('src="images/featured.jpg"')
    expect(html).toContain('images/diagrams/1.svg')
    expect(html).not.toContain('https://cdn/diag1.svg')
  })
})

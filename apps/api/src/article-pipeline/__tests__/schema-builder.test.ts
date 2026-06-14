import { describe, it, expect } from 'vitest'
import type { BrandSettings } from '@prisma/client'
import { buildArticleSchema, type BuildSchemaOpts, type SchemaTypeRule } from '../schema-builder'

function brand(over: Partial<BrandSettings> = {}): BrandSettings {
  // Only the fields buildArticleSchema reads matter; the rest are nulled.
  return {
    schemaArticleType: null,
    industry: null,
    defaultAuthorName: null,
    defaultAuthorWebsite: null,
    defaultAuthorLinkedIn: null,
    defaultAuthorJobTitle: null,
    defaultAuthorAlumniOf: null,
    addressLine1: null,
    addressLocality: null,
    addressRegion: null,
    postalCode: null,
    organizationCountryCode: null,
    organizationName: null,
    organizationWebsite: null,
    organizationLogoUrl: null,
    organizationEmail: null,
    organizationPhone: null,
    googleBusinessProfileUrl: null,
    ...over,
  } as unknown as BrandSettings
}

function opts(over: Partial<BuildSchemaOpts> = {}): BuildSchemaOpts {
  return {
    brand: brand(),
    schemaTypeRules: [],
    title: 'My Title',
    description: 'My description',
    articleUrl: 'https://site.com/post',
    featuredImageUrl: null,
    featuredImageWidth: null,
    featuredImageHeight: null,
    citationUrls: [],
    publishedDate: '2026-01-01T00:00:00Z',
    modifiedDate: '2026-01-02T00:00:00Z',
    ...over,
  }
}

function parse(o: BuildSchemaOpts) {
  return JSON.parse(buildArticleSchema(o)) as Record<string, any>
}

describe('buildArticleSchema — type resolution', () => {
  it('defaults to Article / Organization with no override or rule match', () => {
    const s = parse(opts())
    expect(s['@type']).toBe('Article')
    expect(s.publisher['@type']).toBe('Organization')
  })

  it('honours an explicit brand.schemaArticleType override', () => {
    const s = parse(opts({ brand: brand({ schemaArticleType: 'NewsArticle', industry: 'medical' }) }))
    expect(s['@type']).toBe('NewsArticle')
  })

  it('matches a rule by case-insensitive industry substring', () => {
    const rules: SchemaTypeRule[] = [
      { keyword: 'medical', articleType: 'MedicalScholarlyArticle', publisherType: 'MedicalOrganization' },
    ]
    const s = parse(opts({ brand: brand({ industry: 'Medical Devices' }), schemaTypeRules: rules }))
    expect(s['@type']).toBe('MedicalScholarlyArticle')
    expect(s.publisher['@type']).toBe('MedicalOrganization')
  })
})

describe('buildArticleSchema — assembly', () => {
  it('always includes the core fields', () => {
    const s = parse(opts())
    expect(s['@context']).toBe('https://schema.org')
    expect(s.headline).toBe('My Title')
    expect(s.description).toBe('My description')
    expect(s.url).toBe('https://site.com/post')
    expect(s.datePublished).toBe('2026-01-01T00:00:00Z')
    expect(s.dateModified).toBe('2026-01-02T00:00:00Z')
    expect(s.mainEntityOfPage).toEqual({ '@type': 'WebPage', '@id': 'https://site.com/post' })
  })

  it('assembles the author with present fields and alumniOf as an EducationalOrganization', () => {
    const s = parse(
      opts({
        brand: brand({
          defaultAuthorName: 'Jane Doe',
          defaultAuthorLinkedIn: 'https://linkedin.com/in/jane',
          defaultAuthorAlumniOf: 'MIT',
        }),
      }),
    )
    expect(s.author).toMatchObject({
      '@type': 'Person',
      name: 'Jane Doe',
      sameAs: ['https://linkedin.com/in/jane'],
      alumniOf: { '@type': 'EducationalOrganization', name: 'MIT' },
    })
    expect(s.author.url).toBeUndefined()
  })

  it('omits the publisher address unless an address field is set', () => {
    expect(parse(opts()).publisher.address).toBeUndefined()
    const s = parse(opts({ brand: brand({ addressLocality: 'Austin', addressRegion: 'TX' }) }))
    expect(s.publisher.address).toMatchObject({
      '@type': 'PostalAddress',
      addressLocality: 'Austin',
      addressRegion: 'TX',
    })
  })

  it('includes the image only when a featured image url is present, with optional dimensions', () => {
    expect(parse(opts()).image).toBeUndefined()
    const s = parse(opts({ featuredImageUrl: 'https://cdn/img.jpg', featuredImageWidth: 1200, featuredImageHeight: 630 }))
    expect(s.image).toEqual({ '@type': 'ImageObject', url: 'https://cdn/img.jpg', width: 1200, height: 630 })
  })

  it('includes citations only when there are any', () => {
    expect(parse(opts()).citation).toBeUndefined()
    const s = parse(opts({ citationUrls: ['https://a.com', 'https://b.com'] }))
    expect(s.citation).toEqual(['https://a.com', 'https://b.com'])
  })
})

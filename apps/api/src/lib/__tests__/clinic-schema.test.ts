import { describe, it, expect } from 'vitest'
import {
  buildClinicEntity,
  buildFaqSchema,
  buildFencedBlock,
  upsertFencedBlock,
  looksLikeBuilderPage,
  SCHEMA_FENCE_START,
  SCHEMA_FENCE_END,
} from '../clinic-schema'

const BRAND = {
  organizationName: 'Coast Chiropractic Kawana',
  organizationWebsite: 'https://coastchiropractic.com.au',
  organizationPhone: '(07) 5444 3499',
  organizationLogoUrl: 'https://cdn.omniply.io/logo.png',
  addressLine1: '5/134a Point Cartwright Dr',
  addressLine2: null,
  addressLocality: 'Buddina',
  addressRegion: 'QLD',
  postalCode: '4575',
  organizationCountryCode: 'AU',
  openingHours: 'Mo-Fr 08:00-18:00\nSa 08:00-12:00',
  googleBusinessProfileUrl: 'https://maps.app.goo.gl/xyz',
  primarySpecialization: 'Chiropractic Care',
  bookingUrl: 'https://coastchiropractic.com.au/book',
  clinicFaqs: null,
} as unknown as Parameters<typeof buildClinicEntity>[0]

describe('buildClinicEntity', () => {
  const e = buildClinicEntity(BRAND)

  it('is a MedicalClinic with identity, address, hours and GBP sameAs', () => {
    expect(e['@type']).toBe('MedicalClinic')
    expect(e.name).toBe('Coast Chiropractic Kawana')
    expect(e['@id']).toBe('https://coastchiropractic.com.au/#clinic')
    expect((e.address as { addressLocality?: string }).addressLocality).toBe('Buddina')
    expect(e.openingHours).toEqual(['Mo-Fr 08:00-18:00', 'Sa 08:00-12:00'])
    expect(e.sameAs).toEqual(['https://maps.app.goo.gl/xyz'])
  })

  it('carries the ReserveAction pointing at bookingUrl', () => {
    const action = e.potentialAction as { '@type': string; target: { urlTemplate: string } }
    expect(action['@type']).toBe('ReserveAction')
    expect(action.target.urlTemplate).toBe('https://coastchiropractic.com.au/book')
  })

  it('omits absent fields instead of emitting nulls', () => {
    const minimal = buildClinicEntity({ organizationName: 'X' } as never)
    expect(minimal).not.toHaveProperty('address')
    expect(minimal).not.toHaveProperty('potentialAction')
    expect(minimal).not.toHaveProperty('openingHours')
  })
})

describe('buildFaqSchema', () => {
  it('builds FAQPage from q/a pairs and skips empties', () => {
    const s = buildFaqSchema([
      { q: 'Where do I park?', a: 'Free parking behind the clinic.' },
      { q: '', a: 'orphan' },
    ])!
    expect(s['@type']).toBe('FAQPage')
    expect((s.mainEntity as unknown[]).length).toBe(1)
  })

  it('returns null with nothing valid', () => {
    expect(buildFaqSchema([])).toBeNull()
  })
})

describe('fenced block upsert', () => {
  const block = buildFencedBlock([{ '@type': 'Thing' }])

  it('appends when absent and replaces when present (idempotent)', () => {
    const once = upsertFencedBlock('<p>their content</p>', block)
    expect(once).toContain(SCHEMA_FENCE_START)
    expect(once.indexOf('their content')).toBeLessThan(once.indexOf(SCHEMA_FENCE_START))
    const newBlock = buildFencedBlock([{ '@type': 'MedicalClinic', name: 'Updated' }])
    const twice = upsertFencedBlock(once, newBlock)
    expect(twice.match(new RegExp(SCHEMA_FENCE_START, 'g'))!.length).toBe(1)
    expect(twice).toContain('Updated')
    expect(twice).not.toContain('"Thing"')
    expect(twice).toContain('their content')
  })

  it('fence markers survive round trips', () => {
    expect(block.startsWith(SCHEMA_FENCE_START)).toBe(true)
    expect(block.endsWith(SCHEMA_FENCE_END)).toBe(true)
  })
})

describe('looksLikeBuilderPage', () => {
  it('detects Elementor/Divi/WPBakery signatures', () => {
    expect(looksLikeBuilderPage('<div class="elementor-section">')).toBe(true)
    expect(looksLikeBuilderPage('[et_pb_section admin_label="x"]')).toBe(true)
    expect(looksLikeBuilderPage('[vc_row][vc_column]')).toBe(true)
  })

  it('passes normal Gutenberg/classic content', () => {
    expect(looksLikeBuilderPage('<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->')).toBe(false)
    expect(looksLikeBuilderPage('<h1>Welcome</h1><p>plain</p>')).toBe(false)
  })
})

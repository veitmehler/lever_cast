import { describe, it, expect } from 'vitest'
import { buildCoverHtml } from '../cover'

const colors = { headerBg: '#011328', sections: ['#fa00bb', '#00bbf9', '#00142b', '#00dd81'] }

describe('buildCoverHtml', () => {
  it('renders the title, date, and one tile per item with cycling accents', () => {
    const tiles = [
      { headline: 'Back Pain Myths', iconDataUri: 'data:image/jpeg;base64,AAA' },
      { headline: 'Better Sleep', iconDataUri: null },
    ]
    const html = buildCoverHtml('Spine & Shine', 'Jul 1, 2026', tiles, colors)
    expect(html).toContain('Spine &amp; Shine')
    expect(html).toContain('Jul 1, 2026')
    expect(html).toContain('Back Pain Myths')
    expect(html).toContain('Better Sleep')
    expect(html).toContain('#011328') // navy bg + caption (2-color scheme)
    expect(html).not.toContain('#00dd81') // no 4-color cycling on the cover
    expect(html).toContain('data:image/jpeg;base64,AAA') // embedded icon
    expect(html).toContain('ico-empty') // tile with no icon
  })

  it('escapes headline markup', () => {
    const html = buildCoverHtml('T', 'D', [{ headline: 'A & B <x>', iconDataUri: null }], colors)
    expect(html).toContain('A &amp; B &lt;x&gt;')
  })
})

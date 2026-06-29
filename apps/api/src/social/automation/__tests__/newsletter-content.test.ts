import { describe, it, expect } from 'vitest'
import type { Newsletter } from '@prisma/client'
import {
  buildNewsletterContentContext,
  resolveNewsletterSlotContent,
} from '../newsletter-content'

function nl(overrides: Partial<Newsletter>): Newsletter {
  return {
    featureArticle: { title: 'Back Pain Myths', tldr: 'Short summary.', body: 'Long body text.', teaser: 'Teaser.' },
    secondaryArticle: { title: 'Better Sleep' },
    teasers: [{ title: 'Hydration tips' }, { title: 'Desk posture' }],
    quickHits: { tips: ['Stretch hourly', 'Walk after meals', '  ', 'Hydrate'] },
    subjectLine: 'Your weekly spine health digest',
    summaryTitle: 'Spine & Shine',
    ...overrides,
  } as unknown as Newsletter
}

describe('buildNewsletterContentContext', () => {
  it('extracts overview topics, tips, and the feature article', () => {
    const ctx = buildNewsletterContentContext(nl({}))
    expect(ctx.overviewTopics).toEqual(['Back Pain Myths', 'Better Sleep', 'Hydration tips', 'Desk posture'])
    expect(ctx.tips).toEqual(['Stretch hourly', 'Walk after meals', 'Hydrate']) // blanks dropped
    expect(ctx.feature.title).toBe('Back Pain Myths')
    expect(ctx.feature.body).toContain('Long body text.')
  })

  it('falls back to subject/summary when the feature title is missing', () => {
    const ctx = buildNewsletterContentContext(nl({ featureArticle: null }))
    expect(ctx.feature.title).toBe('Your weekly spine health digest')
    expect(ctx.feature.body).toBe('')
  })
})

describe('resolveNewsletterSlotContent', () => {
  const ctx = buildNewsletterContentContext(nl({}))

  it('nl_overview lists the topics as bullet text', () => {
    const slot = resolveNewsletterSlotContent('nl_overview', ctx)
    expect(slot.text).toContain('Back Pain Myths')
    expect(slot.text).toContain('Desk posture')
  })

  it('nl_tips picks one of the tips as the quote', () => {
    const slot = resolveNewsletterSlotContent('nl_tips', ctx)
    expect(ctx.tips).toContain(slot.quoteText)
  })

  it('nl_feature uses the feature article', () => {
    const slot = resolveNewsletterSlotContent('nl_feature', ctx)
    expect(slot.title).toBe('Back Pain Myths')
    expect(slot.text).toContain('Long body text.')
  })
})

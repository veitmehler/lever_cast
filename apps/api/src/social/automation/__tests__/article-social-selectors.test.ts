import { describe, it, expect, vi, beforeEach } from 'vitest'

const findMany = vi.fn()
vi.mock('@socioply/shared', () => ({
  prisma: { articleDiagram: { findMany: (...a: unknown[]) => findMany(...a) } },
  readS3Object: vi.fn(),
}))
vi.mock('../../../lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

import { resolveArticleSlot } from '../article-social-selectors'
import type { ArticleContentContext } from '../content'

const ctx: ArticleContentContext = {
  title: 'Winter posture',
  introText: 'Intro text.',
  keyTakeawaysText: 'The 3 big takeaways.',
  h2Sections: [
    { heading: 'Key Takeaways', text: 'kt body' }, // non-content, must be skipped
    { heading: 'Why posture matters', text: 'section A body' },
    { heading: 'Daily stretches', text: 'section B body' },
    { heading: 'FAQ', text: 'faq body' }, // non-content
  ],
  h2Title: 'Key Takeaways',
  h2SectionText: 'kt body',
}

beforeEach(() => {
  vi.clearAllMocks()
  findMany.mockResolvedValue([]) // no stylized diagrams
})

describe('resolveArticleSlot section selection', () => {
  it('art_keytakeaways uses the key-takeaways text', async () => {
    const r = await resolveArticleSlot('art_keytakeaways', 'job1', ctx)
    expect(r.slot.text).toBe('The 3 big takeaways.')
    expect(r.diagramBackground).toBeNull()
  })

  it('art_hook_other never picks "Key Takeaways" (or FAQ) — uses a real content section', async () => {
    const r = await resolveArticleSlot('art_hook_other', 'job1', ctx)
    expect(r.slot.title).toBe('Why posture matters')
    expect(r.slot.title).not.toBe('Key Takeaways')
  })

  it('art_diagram_0 fallback (no diagrams) is a content section, not Key Takeaways', async () => {
    const r = await resolveArticleSlot('art_diagram_0', 'job1', ctx)
    expect(r.diagramBackground).toBeNull() // fell back to image carousel
    expect(r.slot.title).toBe('Why posture matters')
  })

  it('art_hook_diagram0 fallback (no diagrams) is a content section', async () => {
    const r = await resolveArticleSlot('art_hook_diagram0', 'job1', ctx)
    expect(r.slot.title).toBe('Why posture matters')
  })
})

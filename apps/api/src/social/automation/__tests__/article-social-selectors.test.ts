import { describe, it, expect, vi, beforeEach } from 'vitest'

const findMany = vi.fn()
vi.mock('@omniply/shared', () => ({
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

describe('art_hook_unused (azavea day-2 companion)', () => {
  const richCtx: ArticleContentContext = {
    ...ctx,
    h2Sections: [
      { heading: 'Key Takeaways', text: 'kt body' },
      { heading: 'Why posture matters', text: 'section A body' }, // diagram[0] section
      { heading: 'Daily stretches', text: 'section B body' }, // art_hook_other pick
      { heading: 'The compounding cost', text: 'section C body' }, // diagram[1] section
      { heading: 'What good looks like', text: 'section D body' }, // the unused one
      { heading: 'FAQ', text: 'faq body' },
    ],
  }
  const diagrams = [
    { sectionTitle: 'Why posture matters', stylizedPngS3Key: 'k0' },
    { sectionTitle: 'The compounding cost', stylizedPngS3Key: 'k1' },
  ]

  it('picks a section untouched by diagram_0, diagram_1 and hook_other', async () => {
    findMany.mockResolvedValue(diagrams)
    const r = await resolveArticleSlot('art_hook_unused', 'job1', richCtx)
    expect(r.slot.title).toBe('What good looks like')
    expect(r.diagramBackground).toBeNull()
  })

  it('3 content sections, 1 diagram: picks the truly unused third section', async () => {
    findMany.mockResolvedValue([diagrams[0]])
    const midCtx = { ...richCtx, h2Sections: richCtx.h2Sections.slice(0, 4) } // KT + A, B, C
    const r = await resolveArticleSlot('art_hook_unused', 'job1', midCtx)
    expect(r.slot.title).toBe('The compounding cost') // ≠ diagram0 (A), ≠ hook_other (B)
  })

  it('short article (2 content sections): deterministic rotation, never non-content', async () => {
    findMany.mockResolvedValue([diagrams[0]])
    const shortCtx = { ...richCtx, h2Sections: richCtx.h2Sections.slice(0, 3) } // KT + A, B only
    const r = await resolveArticleSlot('art_hook_unused', 'job1', shortCtx)
    expect(['Why posture matters', 'Daily stretches']).toContain(r.slot.title)
    expect(r.slot.title).not.toBe('Key Takeaways')
  })
})

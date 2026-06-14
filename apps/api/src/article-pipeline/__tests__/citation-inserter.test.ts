import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PipelineContext } from '../variable-resolver'
import type { ValidatedCitation } from '../citation-validator'

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

// Mock the LLM step runner: insertInlineCitations is exercised for its
// post-processing safety guarantees, not the LLM call itself.
const execute = vi.fn()
vi.mock('../step-runner', () => ({
  StepRunner: vi.fn().mockImplementation(() => ({ execute })),
}))

import { insertInlineCitations } from '../citation-inserter'

function ctx(): PipelineContext {
  return { completedSteps: new Map() } as unknown as PipelineContext
}
function cite(url: string): ValidatedCitation {
  return { title: url, url, status: 'valid' }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('insertInlineCitations', () => {
  it('short-circuits (no LLM call) when there are no citations', async () => {
    const html = '<h2>Title</h2><p>body</p>'
    const out = await insertInlineCitations(html, [], 'job1', ctx())
    expect(out).toEqual({ linkedHtml: html, insertedCount: 0 })
    expect(execute).not.toHaveBeenCalled()
  })

  it('strips a ```html code fence the LLM wrapped its output in', async () => {
    execute.mockResolvedValue({
      output: '```html\n<h2>T</h2><p>see <a href="https://a.com">a</a></p>\n```',
    })
    const out = await insertInlineCitations('<h2>T</h2><p>see this</p>', [cite('https://a.com')], 'job1', ctx())
    expect(out.linkedHtml.startsWith('<h2>T</h2>')).toBe(true)
    expect(out.linkedHtml).not.toContain('```')
    expect(out.insertedCount).toBe(1)
  })

  it('discards LLM output that dropped H2 headings and returns the original HTML', async () => {
    const original = '<h2>One</h2><p>x</p><h2>Two</h2><p>y</p>'
    execute.mockResolvedValue({ output: '<p>x</p><p>y</p>' }) // no h2s
    const out = await insertInlineCitations(original, [cite('https://a.com')], 'job1', ctx())
    expect(out).toEqual({ linkedHtml: original, insertedCount: 0 })
  })

  it('deduplicates a citation URL that appears more than once, keeping the first link', async () => {
    execute.mockResolvedValue({
      output:
        '<h2>T</h2><p><a href="https://a.com">first</a> and <a href="https://a.com">second</a></p>',
    })
    const out = await insertInlineCitations('<h2>T</h2><p>x</p>', [cite('https://a.com')], 'job1', ctx())
    // The URL should now appear in exactly one anchor; the second is unwrapped to plain text.
    const anchorCount = (out.linkedHtml.match(/<a\b[^>]*href=["']?https:\/\/a\.com/gi) ?? []).length
    expect(anchorCount).toBe(1)
    expect(out.linkedHtml).toContain('second') // inner text preserved
  })

  it('forces target=_blank and rel=noopener noreferrer on external links', async () => {
    execute.mockResolvedValue({
      output: '<h2>T</h2><p><a href="https://a.com">a</a></p>',
    })
    const out = await insertInlineCitations('<h2>T</h2><p>x</p>', [cite('https://a.com')], 'job1', ctx())
    expect(out.linkedHtml).toContain('target="_blank"')
    expect(out.linkedHtml).toMatch(/rel="[^"]*noopener[^"]*noreferrer|rel="[^"]*noreferrer[^"]*noopener/)
  })

  it('leaves internal anchor links untouched', async () => {
    execute.mockResolvedValue({
      output: '<h2>T</h2><p><a href="#section">jump</a></p>',
    })
    const out = await insertInlineCitations('<h2>T</h2><p>x</p>', [cite('https://a.com')], 'job1', ctx())
    expect(out.linkedHtml).toContain('<a href="#section">jump</a>')
    expect(out.linkedHtml).not.toContain('target="_blank"')
  })

  it('counts only the citation URLs that actually appear in the final HTML', async () => {
    execute.mockResolvedValue({
      output: '<h2>T</h2><p>see <a href="https://a.com">a</a></p>',
    })
    const out = await insertInlineCitations(
      '<h2>T</h2><p>x</p>',
      [cite('https://a.com'), cite('https://b.com')],
      'job1',
      ctx(),
    )
    expect(out.insertedCount).toBe(1)
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

const generateWithGeminiImage = vi.fn()
const llmUsageCreate = vi.fn()
vi.mock('@socioply/shared', () => ({
  generateWithGeminiImage: (...a: unknown[]) => generateWithGeminiImage(...a),
  prisma: { lLMUsage: { create: (...a: unknown[]) => llmUsageCreate(...a) } },
  DEFAULT_DIAGRAM_STYLE_GUIDE: 'DEFAULT-GUIDE-BODY',
}))
vi.mock('../../../lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

import sharp from 'sharp'
import { buildRestylePrompt, restyleDiagram, RESTYLE_MODEL, RESTYLE_COST_USD } from '../diagram-restyle'

// A tiny valid PNG so sharp can decode the "result".
async function tinyPng(): Promise<Buffer> {
  return sharp({ create: { width: 8, height: 8, channels: 3, background: '#ffffff' } }).png().toBuffer()
}

beforeEach(() => vi.clearAllMocks())

describe('buildRestylePrompt', () => {
  it('interpolates industry + specialization and appends the style guide', () => {
    const p = buildRestylePrompt({ industry: 'Chiropractic', specialization: 'Family Care', styleGuide: 'MY-GUIDE' })
    expect(p).toContain('Chiropractic business specializing in: Family Care')
    expect(p).toContain('MY-GUIDE')
    expect(p).toContain('1:1 square')
    expect(p).toMatch(/verbatim/i)
  })

  it('drops the specialization clause when missing', () => {
    const p = buildRestylePrompt({ industry: 'Accounting', specialization: null, styleGuide: 'G' })
    expect(p).toContain('for a Accounting business.')
    expect(p).not.toContain('specializing in:')
  })

  it('falls back to a generic business when industry is missing', () => {
    const p = buildRestylePrompt({ industry: null, specialization: null })
    expect(p).toContain('for a business.')
  })

  it('uses the default style guide when none provided', () => {
    const p = buildRestylePrompt({ industry: 'X' })
    expect(p).toContain('DEFAULT-GUIDE-BODY')
  })

  it('treats blank/whitespace style guide as default', () => {
    const p = buildRestylePrompt({ industry: 'X', styleGuide: '   ' })
    expect(p).toContain('DEFAULT-GUIDE-BODY')
  })
})

describe('restyleDiagram', () => {
  const base = { squarePng: Buffer.from('src-png'), prompt: 'P', geminiKey: 'k', userId: 'user_A', jobId: 'job_1' }

  it('returns the stylized png and logs cost on success', async () => {
    const out = await tinyPng()
    generateWithGeminiImage.mockResolvedValue(out)

    const res = await restyleDiagram(base)
    expect(res?.png).toBe(out)
    // Called as (key, prompt, model, '1:1', { mimeType, data })
    const call = generateWithGeminiImage.mock.calls[0]
    expect(call[0]).toBe('k')
    expect(call[2]).toBe(RESTYLE_MODEL)
    expect(call[3]).toBe('1:1')
    expect((call[4] as { mimeType: string }).mimeType).toBe('image/png')
    expect(llmUsageCreate).toHaveBeenCalledOnce()
    expect((llmUsageCreate.mock.calls[0][0] as { data: { cost: number } }).data.cost).toBe(RESTYLE_COST_USD)
  })

  it('returns null (no cost logged) when the model throws', async () => {
    generateWithGeminiImage.mockRejectedValue(new Error('safety block'))
    const res = await restyleDiagram(base)
    expect(res).toBeNull()
    expect(llmUsageCreate).not.toHaveBeenCalled()
  })

  it('returns null when the result is empty', async () => {
    generateWithGeminiImage.mockResolvedValue(Buffer.alloc(0))
    const res = await restyleDiagram(base)
    expect(res).toBeNull()
    expect(llmUsageCreate).not.toHaveBeenCalled()
  })

  it('returns null when the result is undecodable', async () => {
    generateWithGeminiImage.mockResolvedValue(Buffer.from('not-an-image'))
    const res = await restyleDiagram(base)
    expect(res).toBeNull()
  })

  it('still returns the png when the usage write fails', async () => {
    generateWithGeminiImage.mockResolvedValue(await tinyPng())
    llmUsageCreate.mockRejectedValue(new Error('db down'))
    const res = await restyleDiagram(base)
    expect(res).not.toBeNull()
  })
})

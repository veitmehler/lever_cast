import { describe, it, expect, vi, beforeEach } from 'vitest'

const campaignFindUnique = vi.fn()
const campaignUpdate = vi.fn()
const campaignUpsert = vi.fn()
const sitePageFindUnique = vi.fn()
const promptFindUnique = vi.fn()

vi.mock('@socioply/shared', () => ({
  prisma: {
    articleEmailCampaign: {
      findUnique: (...a: unknown[]) => campaignFindUnique(...a),
      update: (...a: unknown[]) => campaignUpdate(...a),
      upsert: (...a: unknown[]) => campaignUpsert(...a),
    },
    sitePage: { findUnique: (...a: unknown[]) => sitePageFindUnique(...a) },
    brandSettings: { findUnique: vi.fn().mockResolvedValue(null) },
    promptTemplate: { findUnique: (...a: unknown[]) => promptFindUnique(...a) },
  },
}))

const adapterCall = vi.fn()
vi.mock('../../llm/factory', () => ({ getLLMAdapter: () => ({ call: adapterCall }) }))
vi.mock('../../../lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

import { generatePromoEmail } from '../generate'

beforeEach(() => vi.clearAllMocks())

describe('generatePromoEmail — idempotency on retry', () => {
  it('reuses a prior generated email without calling the LLM', async () => {
    campaignFindUnique.mockResolvedValue({
      subject: 'Saved subject',
      bodyHtml: '<p>saved</p>',
      inputTokens: 11,
      outputTokens: 22,
      cost: 0.5,
      provider: 'anthropic',
      model: 'claude',
    })

    const result = await generatePromoEmail('job1', 'user1')

    expect(result.subject).toBe('Saved subject')
    expect(result.bodyHtml).toBe('<p>saved</p>')
    expect(result.inputTokens).toBe(11)
    // No LLM call, no SitePage/template load on the reuse path
    expect(adapterCall).not.toHaveBeenCalled()
    expect(sitePageFindUnique).not.toHaveBeenCalled()
    // Marks the row generated again
    expect(campaignUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { jobId: 'job1' }, data: { status: 'generated', errorMessage: null } }),
    )
  })

  it('generates fresh when the prior row has no email yet (empty placeholder)', async () => {
    campaignFindUnique.mockResolvedValue({ subject: '', bodyHtml: '', inputTokens: 0, outputTokens: 0, cost: 0, provider: null, model: null })
    sitePageFindUnique.mockResolvedValue({ title: 'T', seoTitle: 'T', bodyHtml: '<p>b</p>', excerpt: 'e', primaryKeyword: 'k', slug: 's' })
    promptFindUnique.mockResolvedValue({ systemPrompt: 'sys', userPrompt: 'user {{title}}', defaultProvider: 'anthropic', defaultModel: 'claude', maxTokens: 2000, isActive: true })
    adapterCall.mockResolvedValue({ content: '{"subject":"New","bodyHtml":"<p>new</p>"}', tokens: { input: 1, output: 2 }, cost: 0.1, provider: 'anthropic', model: 'claude' })
    campaignUpdate.mockResolvedValue({})
    campaignUpsert.mockResolvedValue({})

    const result = await generatePromoEmail('job2', 'user1')

    expect(adapterCall).toHaveBeenCalledOnce()
    expect(result.subject).toBe('New')
  })
})

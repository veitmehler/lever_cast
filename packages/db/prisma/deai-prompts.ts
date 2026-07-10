/**
 * De-AI writing prompt templates (`st_*` = style).
 * See .plans/de-ai-writing.implementation-plan.md.
 *
 * `st_dash_fix` is the Tier-2 sentence micro-editor used by
 * apps/api/src/lib/text/dash-sanitizer.ts — its output is code-verified by a
 * token-diff guard (only punctuation + a couple of allowlisted function words
 * may change), so the prompt's job is precision, not creativity.
 *
 * NOTE: the storytelling-hook prompt texts themselves live in their canonical
 * source files (newsletter-prompts.ts for 305/309/310, seed.ts for 203,
 * plain-language-prompts.ts for 411/412 + exemplars). The signed-off overwrite
 * of the existing DB rows happens via scripts/reseed-deai-prompts.ts, which
 * imports from those sources — this file only adds the NEW template.
 */
import type { NewsletterPromptTemplate } from './newsletter-prompts'

const GEMINI_FLASH_LITE = 'gemini-3.1-flash-lite'

export const DEAI_TEMPLATES: NewsletterPromptTemplate[] = [
  {
    stepNumber: 420,
    key: 'st_dash_fix',
    stepName: 'style_dash_fix_sentence',
    defaultProvider: 'gemini',
    defaultModel: GEMINI_FLASH_LITE,
    maxTokens: 256,
    systemPrompt:
      'You are a precision copy editor. You receive ONE sentence that contains an em-dash (—) ' +
      'joining words or clauses. Rewrite it with correct conventional punctuation instead of the ' +
      'dash: a comma, a colon, a semicolon, or splitting into two sentences, whichever grammar ' +
      'genuinely calls for. CHANGE NOTHING ELSE: keep every word, in the same order, with the ' +
      'same meaning. You may add at most one small connective word (like "and" or "because") if ' +
      'a comma alone would create a comma splice. Output ONLY the rewritten sentence, nothing else.',
    userPrompt: `SENTENCE:
{{sentence}}

Rewrite it now.`,
    isActive: true,
  },
]

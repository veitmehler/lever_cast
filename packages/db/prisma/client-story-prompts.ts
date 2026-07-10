/**
 * Client-story review-mining prompt templates (`cs_*`).
 *
 * DB-backed PromptTemplate rows looked up by string `key` (not `stepNumber`),
 * same convention as the newsletter `nl_*` prompts (see newsletter-prompts.ts) —
 * `stepNumber` only exists because the column is required+unique; this range
 * (400+) avoids colliding with enrichment's 100s, social's 200s, and
 * newsletter's 300+. See
 * .plans/client-story-review-mining.implementation-plan.md Phase 4.
 *
 * Imported by prisma/seed.ts (prod auto-seeds) and scripts/seed-client-story-
 * prompts.ts (staging, which does not run the seed step).
 */
import type { NewsletterPromptTemplate } from './newsletter-prompts'

const GEMINI_FLASH_LITE = 'gemini-3.1-flash-lite'

export const CLIENT_STORY_TEMPLATES: NewsletterPromptTemplate[] = [
  {
    stepNumber: 400,
    key: 'cs_story_triage',
    stepName: 'client_story_triage',
    defaultProvider: 'gemini',
    defaultModel: GEMINI_FLASH_LITE,
    maxTokens: 512,
    systemPrompt:
      'You review a single Google review for a local business and decide whether it describes a ' +
      'specific client experience (a real story: a problem, what was done, an outcome) versus ' +
      'generic praise ("great service, 5 stars", "friendly staff"). If it is a real story, you ' +
      'rewrite it as a short, de-identified case example suitable for a marketing article — this ' +
      'is a strict requirement, not a style preference: NEVER include the reviewer\'s name or any ' +
      'identifying detail, NEVER mention star ratings or that this came from a review, NEVER ' +
      'write "a reviewer said" or similar attribution framing. Write it as a clean narrative case ' +
      'example a business could reference directly. Soften outcome language — describe ' +
      'improvement, not cures or guarantees; avoid absolute claims.',
    userPrompt: `REVIEW TEXT:
{{reviewText}}

INDUSTRY: {{industry}}

Decide: is this a specific client story (problem → what was done → outcome), or generic praise?

If it is generic praise, or too vague to form a real narrative, return:
{"isStory": false}

If it is a real story, return:
{"isStory": true, "storyText": "a 2-4 sentence de-identified narrative case example — no names, no stars, no review framing, softened outcome language", "topicTags": ["2-4 short keyword tags describing what the story is about, e.g. lower back pain, pediatric, sports injury"]}

Output STRICT JSON only (no markdown, no commentary).`,
    isActive: true,
  },
]

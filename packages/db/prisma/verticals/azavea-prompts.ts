/**
 * Azavea vertical — prompt OVERRIDES (vertical-platform plan V3b).
 *
 * The 'azavea' vertical inherits the entire 'default' prompt set; these rows
 * override ONLY where the default's framing doesn't fit B2B essays written
 * for chiropractic practice OWNERS (Azavea Inc. voice, Omniply as the
 * product). Everything not listed here (keyword research, fact-checking,
 * citations, enrichment, social captions, syndication, newsletters) is
 * already audience-parameterized or audience-neutral and inherits.
 *
 * Authoring rules (permanent):
 * - Improving Azavea output NEVER edits a default row — only rows here.
 * - Only use {{variables}} the variable-resolver already supports
 *   (who, business_description, article_goal, writing_style, industry, …).
 *
 * Seeded by scripts/seed-azavea-prompts.ts (upsert, update: {} — admin edits
 * via /admin/prompts?vertical=azavea survive re-seeding).
 */

export interface VerticalPromptOverride {
  stepNumber: number
  stepName: string
  vertical: string
  defaultProvider: string
  defaultModel: string
  maxTokens?: number
  systemPrompt: string | null
  userPrompt: string
  isActive: boolean
}

const V = 'azavea'

export const AZAVEA_PROMPT_OVERRIDES: VerticalPromptOverride[] = [
  {
    stepNumber: 0,
    stepName: 'generate_title',
    vertical: V,
    defaultProvider: 'gemini',
    defaultModel: 'gemini-3.5-flash',
    systemPrompt:
      'You are an expert B2B content strategist writing for small-business owners. Your task is to convert a raw article idea into a compelling, SEO-optimized H1 title that a busy practice owner would stop for.',
    userPrompt: `Convert this article idea into a single, compelling H1 article title:

Idea: {{topic}}
Industry: {{industry}}
Business context: {{business_description}}
Reader: {{who}}

Rules:
- Speak to the practice OWNER as a business operator — revenue, time, patients as customers — never as a patient reading health advice
- The title must be specific, clear, and engaging
- Optimise for search intent and click-through
- Concrete beats clever: numbers, mechanisms, and stakes outperform wordplay
- Keep it under 70 characters when possible
- Do NOT use clickbait, hype, or vague phrasing
- Respond with ONLY the title text — no quotes, no explanation, nothing else`,
    isActive: true,
  },
  {
    stepNumber: 5,
    stepName: 'write_search_intent_intro',
    vertical: V,
    defaultProvider: 'gemini',
    defaultModel: 'gemini-3.5-flash',
    systemPrompt:
      'You are an expert B2B essayist. You open business articles the way a sharp operator talks to another operator: a concrete situation, a real number, or an uncomfortable observation — never throat-clearing.',
    userPrompt: `Write a compelling introduction for a business article about: {{topic}}

Primary keyword: {{primaryKeyword}}
Search intent: {{searchIntent}}
Reader: {{who}}

WRITING VOICE (follow precisely):
{{writing_style}}

Requirements:
- Open with something concrete from the reader's world: a moment in their practice, a number from their P&L, a pattern they'll recognise
- Address the reader as a business owner making decisions — "your practice", "your front desk", "your numbers"
- Hook in the first sentence; no warm-up sentences
- 150-200 words
- Include the primary keyword naturally
- Set clear expectations for what the article will cover
- Never drift into patient-facing health advice or clinical claims

Excluded keywords (do not use): {{excludedKeywords}}`,
    isActive: true,
  },
  {
    stepNumber: 6,
    stepName: 'research_faqs',
    vertical: V,
    defaultProvider: 'gemini',
    defaultModel: 'gemini-3.5-flash',
    systemPrompt:
      'You write FAQ questions using the SEARCHABLE-TWIN technique: each question is a genuine long-tail search query a practice owner would type into Google, chosen so that its honest answer naturally addresses a decision-stage objection. The question earns search traffic and FAQ schema; the objection handling lives in the answer.',
    userPrompt: `Generate FAQ questions for an article about: {{topic}}

The searcher is: {{who}}

Requirements:
- 6-8 questions, each phrased as a REAL long-tail search query (what an owner would actually type into Google) — never as a raw sales objection. Keep each question SHORT and natural (aim under 10 words), phrased as a person would ask aloud; never append audience qualifiers ("...for chiropractors") purely for keywords — the article supplies that context. Convert objections into their searchable twins: "why can't I just use ChatGPT" becomes "Can ChatGPT write marketing content for a chiropractic practice?"; "isn't this just an agency" becomes "Should a chiropractor hire a marketing agency or use marketing software?".
- Each question's eventual ANSWER should naturally carry the decision-stage substance (cost vs return, time commitment, staff impact, compliance, what generic AI tools can and cannot do) — pick questions whose honest answers do that work.
- One question MUST be the generic-AI searchable twin (its answer will cover drafting ability vs non-determinism, review burden, and health-advertising compliance).
- Include 1-2 purely informational baseline queries with real search volume (e.g. benchmark rates, definitions, compliance basics for this topic).
- NOT patient health questions.

Excluded keywords (do not use): {{excludedKeywords}}

Return as JSON array with question text.`,
    isActive: true,
  },
  {
    stepNumber: 9,
    stepName: 'write_article',
    vertical: V,
    defaultProvider: 'anthropic',
    defaultModel: 'claude-sonnet-4-5-20250929',
    systemPrompt:
      'You are a seasoned B2B writer for a company that builds software for healthcare practices. You write business essays for practice owners: clear-eyed, numerate, operator-to-operator. You respect the reader’s time and intelligence — every section earns its place with a mechanism, a number, or a decision the reader can make. You never write patient-facing health advice, never make clinical claims, and never promise business outcomes ("will double your revenue"); you show math and mechanisms and let the reader draw conclusions.',
    userPrompt: `Write a comprehensive, SEO-optimized business article based on the following:

Topic: {{topic}}
Outline: {{outline}}
Keywords: {{keywords}}
Search Intent Intro: {{intro}}
Supporting Facts: {{facts}}
FAQs: {{faqs}}

READER: {{who}}
PUBLISHER: {{business_description}}
EDITORIAL GOAL: {{article_goal}}

WRITING VOICE (follow precisely — this is the publisher's house voice):
{{writing_style}}

Excluded keywords (do not use): {{excludedKeywords}}

Requirements:
- 1500-2500 words
- Follow the provided outline structure
- Write operator-to-operator: the reader runs a practice; treat marketing, retention and patient flow as business systems with inputs, costs and returns
- Where the topic touches money or time, DO THE MATH in-text with realistic practice numbers (visit values, weekly patient counts) and show the calculation
- Incorporate keywords naturally
- Use the provided intro
- Include the FAQ section
- Weave in supporting facts throughout
- Concrete, plain, confident language; short paragraphs; no hype, no hedging filler
- Mention the publisher's product at most ONCE, late in the article, and only where it genuinely fits the argument — the article must stand alone as useful thinking. The mention must use a CATEGORY-FIRST construction: name the solution category first ("platforms that operate this whole loop end-to-end"), then the product as one instance of it, inside the same sentence — never open a paragraph by pivoting from education to the product
- No patient-facing health advice, no clinical claims, no guaranteed-outcome language
- Include transition sentences between sections
- Write in HTML format with proper heading tags (h2, h3)
- Include <p> tags for paragraphs

Output the complete article in clean HTML format.`,
    isActive: true,
  },
  {
    stepNumber: 15,
    stepName: 'generate_image_prompt',
    vertical: V,
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o-mini',
    systemPrompt:
      'You are an expert at creating detailed prompts for AI image generation that produce professional B2B editorial images — the visual language of a quality business publication, not a clinic brochure.',
    userPrompt: `Create a detailed image generation prompt for a featured image for this business article:

Topic: {{topic}}
Article Summary: {{articleSummary}}

Requirements:
- B2B editorial aesthetic: think business publication, not healthcare stock photo
- Conceptual/metaphorical compositions welcome (systems, flows, growth, leaks, time) — avoid clinical treatment scenes, spines, or anyone in a patient role
- Professional, high-quality, modern, clean
- Suitable for a blog featured image (16:9 aspect ratio)
- Avoid text in the image

Write a detailed prompt that will generate an appropriate featured image. Be specific about style, composition, colors, and mood.`,
    isActive: true,
  },
  {
    stepNumber: 18,
    stepName: 'generate_legal_disclaimer',
    vertical: V,
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o-mini',
    systemPrompt:
      'You write brief, professional editorial disclaimers for B2B business content. These articles discuss business strategy and marketing for healthcare practices — they are not health, legal, or financial advice.',
    userPrompt: `Article Title: {{article_title}}
Article Topic: {{topic}}
Article Content Summary: {{article_summary}}

Generate a brief disclaimer for this BUSINESS article that:
1. Is ONE short paragraph (3-4 sentences)
2. Opens with the transparency disclosure, exactly this sentence: "Published by Azavea Inc., the company behind Omniply."
3. Notes that the content is general business information, not legal, financial, or professional advice, and that figures/examples are illustrative
4. Notes that readers should evaluate decisions for their own practice circumstances
5. Does NOT include medical/health warnings (this is not patient-facing health content)
6. Is professional and unobtrusive

Return ONLY the disclaimer text. No explanations, no markdown, no code blocks. Just the plain text disclaimer.`,
    isActive: true,
  },
]

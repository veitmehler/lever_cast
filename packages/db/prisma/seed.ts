import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PROMPT_TEMPLATES = [
  {
    stepNumber: 1,
    stepName: 'generate_outline',
    defaultProvider: 'gemini',
    defaultModel: 'gemini-2.5-flash',
    systemPrompt:
      'You are an expert content strategist and SEO specialist. Your task is to create comprehensive, well-structured article outlines that follow SEO best practices and engage readers.',
    userPrompt: `Create a detailed article outline for the following topic: {{topic}}

Excluded keywords (do not use): {{excludedKeywords}}

Requirements:
- Create a logical, engaging structure
- Include H2 and H3 headings
- Ensure the outline covers the topic comprehensively
- Make it SEO-friendly
- Include introduction and conclusion sections

Return the outline in a structured format.`,
  },
  {
    stepNumber: 2,
    stepName: 'keyword_research',
    defaultProvider: 'gemini',
    defaultModel: 'gemini-2.5-flash',
    systemPrompt: 'You are an expert SEO specialist focusing on keyword research and search intent analysis.',
    userPrompt: `Perform comprehensive keyword research for the topic: {{topic}}

Excluded keywords (do not use): {{excludedKeywords}}

Provide:
1. Primary keyword
2. 5-10 secondary keywords
3. Long-tail keyword variations
4. Search intent for each keyword
5. Estimated difficulty level

Format as JSON.`,
  },
  {
    stepNumber: 3,
    stepName: 'find_supporting_keywords',
    defaultProvider: 'gemini',
    defaultModel: 'gemini-2.5-flash',
    systemPrompt: 'You are an SEO expert specializing in semantic keyword research and LSI keywords.',
    userPrompt: `Based on the topic "{{topic}}" and the primary keywords: {{primary_keyword}}

Find additional supporting keywords including:
1. LSI (Latent Semantic Indexing) keywords
2. Related terms and phrases
3. Question-based keywords
4. Semantic variations

Excluded keywords (do not use): {{excludedKeywords}}

Return as a JSON array with relevance scores.`,
  },
  {
    stepNumber: 4,
    stepName: 'optimize_outline_seo',
    defaultProvider: 'gemini',
    defaultModel: 'gemini-2.5-flash',
    systemPrompt: 'You are an expert in Google SEO best practices and content optimization.',
    userPrompt: `Take this article outline and optimize it according to Google's latest SEO best practices:

{{outline}}

Keywords to incorporate: {{keywords}}
Excluded keywords (do not use): {{excludedKeywords}}

Optimize for:
- Keyword placement in headings
- Search intent alignment
- E-E-A-T principles (Experience, Expertise, Authoritativeness, Trustworthiness)
- User engagement
- Featured snippet potential

Return the optimized outline with SEO annotations.`,
  },
  {
    stepNumber: 5,
    stepName: 'write_search_intent_intro',
    defaultProvider: 'gemini',
    defaultModel: 'gemini-2.5-flash',
    systemPrompt:
      'You are an expert content writer specializing in creating compelling introductions that match search intent.',
    userPrompt: `Write a compelling introduction for an article about: {{topic}}

Primary keyword: {{primaryKeyword}}
Search intent: {{searchIntent}}

Requirements:
- Address the reader's search intent immediately
- Hook the reader in the first sentence
- 150-200 words
- Include the primary keyword naturally
- Set clear expectations for what the article will cover

Excluded keywords (do not use): {{excludedKeywords}}`,
  },
  {
    stepNumber: 6,
    stepName: 'research_faqs',
    defaultProvider: 'gemini',
    defaultModel: 'gemini-2.5-flash',
    systemPrompt:
      'You are an expert at understanding user questions and creating comprehensive FAQ sections.',
    userPrompt: `Research and generate frequently asked questions (FAQs) for the topic: {{topic}}

Requirements:
- Generate 8-12 highly relevant questions
- Questions should cover different aspects of the topic
- Include both beginner and advanced questions
- Format questions naturally (as real users would ask)
- Consider "People Also Ask" style questions

Excluded keywords (do not use): {{excludedKeywords}}

Return as JSON array with question text.`,
  },
  {
    stepNumber: 7,
    stepName: 'find_faq_facts',
    defaultProvider: 'gemini',
    defaultModel: 'gemini-2.5-pro',
    systemPrompt: 'You are a research expert specializing in finding accurate, verifiable facts and data.',
    userPrompt: `For each of these FAQ questions, provide detailed, factual answers with supporting data:

{{faqQuestions}}

Requirements:
- Provide accurate, well-researched answers
- Include specific facts, statistics, or data points
- Cite credible sources where possible
- Each answer should be 100-150 words
- Maintain authoritative tone

Topic context: {{topic}}

Return as JSON with question-answer pairs and source suggestions.`,
  },
  {
    stepNumber: 8,
    stepName: 'find_article_facts',
    defaultProvider: 'gemini',
    defaultModel: 'gemini-2.5-flash',
    systemPrompt:
      'You are a research specialist focusing on gathering credible facts, statistics, and data for content creation.',
    userPrompt: `Research and provide supporting facts, statistics, and data for this article:

Topic: {{topic}}
Outline: {{outline}}

Requirements:
- 10-15 specific facts, statistics, or data points
- Ensure facts are recent and verifiable
- Cover different sections of the outline
- Include numerical data where possible
- Suggest credible sources

Return as JSON array with fact, context, and suggested source.`,
  },
  {
    stepNumber: 9,
    stepName: 'write_article',
    defaultProvider: 'anthropic',
    defaultModel: 'claude-sonnet-4-5-20250929',
    systemPrompt:
      'You are a professional content writer with expertise in creating engaging, SEO-optimized long-form articles. You write in a clear, authoritative voice while maintaining reader engagement.',
    userPrompt: `Write a comprehensive, SEO-optimized article based on the following:

Topic: {{topic}}
Outline: {{outline}}
Keywords: {{keywords}}
Search Intent Intro: {{intro}}
Supporting Facts: {{facts}}
FAQs: {{faqs}}

Excluded keywords (do not use): {{excludedKeywords}}

Requirements:
- 1500-2500 words
- Follow the provided outline structure
- Incorporate keywords naturally
- Use the provided intro
- Include the FAQ section
- Weave in supporting facts throughout
- Use engaging, clear language
- Include transition sentences between sections
- Write in HTML format with proper heading tags (h2, h3)
- Include <p> tags for paragraphs

Output the complete article in clean HTML format.`,
  },
  {
    stepNumber: 10,
    stepName: 'fact_check_article',
    defaultProvider: 'gemini',
    defaultModel: 'gemini-2.5-flash',
    systemPrompt:
      'You are a professional fact-checker with expertise in verifying claims, statistics, and statements in content.',
    userPrompt: `Carefully fact-check the following article for accuracy:

{{article}}

Task:
1. Identify all factual claims and statements
2. Flag any claims that appear incorrect, outdated, or unverifiable
3. Note any statistics that need verification
4. Highlight potentially misleading information

Return as JSON array with:
- claim: the specific text
- issue: what's wrong or needs verification
- severity: low/medium/high
- suggestion: how to correct it`,
  },
  {
    stepNumber: 11,
    stepName: 'adjust_incorrect_facts',
    defaultProvider: 'anthropic',
    defaultModel: 'claude-sonnet-4-5-20250929',
    systemPrompt: 'You are a professional editor specializing in fact correction and content refinement.',
    userPrompt: `Revise this article to correct the identified factual issues:

Original Article:
{{article}}

Fact Check Issues:
{{factCheckIssues}}

Task:
- Correct all flagged inaccuracies
- Replace incorrect statistics with accurate ones (or remove if unverifiable)
- Maintain the article's flow and readability
- Keep the same HTML structure and formatting
- Preserve all correct content

Return the corrected article in HTML format.`,
  },
  {
    stepNumber: 12,
    stepName: 'find_citations',
    defaultProvider: 'gemini',
    defaultModel: 'gemini-2.5-flash',
    systemPrompt:
      'You are a research expert specializing in finding high-quality, authoritative sources for content citations.',
    userPrompt: `Find 8-12 high-quality citation sources for this article:

Article: {{article}}
Topic: {{topic}}

Requirements:
- Authoritative sources (.edu, .gov, reputable organizations)
- Recent publications (prefer last 2-3 years)
- Directly relevant to claims in the article
- Include diverse source types (studies, reports, articles)
- Provide specific URLs where possible

Return as JSON array with:
- sourceTitle: title of the source
- sourceUrl: URL (if available)
- sourceType: study/article/report/website
- relevantClaim: which claim in the article it supports
- authority: rating of source authority (1-10)`,
  },
  {
    stepNumber: 13,
    stepName: 'generate_seo_metadata',
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o-mini',
    systemPrompt:
      'You are an SEO specialist focusing on metadata optimization for maximum click-through rates and search visibility.',
    userPrompt: `Based on this search intent intro and article, create optimized SEO metadata:

Topic: {{topic}}
Search Intent Intro: {{intro}}
Primary Keyword: {{primaryKeyword}}

Generate:
1. Meta Title (50-60 characters, include primary keyword)
2. Meta Description (150-160 characters, compelling, include keyword and CTA)
3. URL Slug (SEO-friendly, lowercase, hyphens, include keyword)

Requirements:
- Optimize for click-through rate
- Include target keyword naturally
- Make meta description action-oriented
- Keep URL slug concise and descriptive

Return as JSON with metaTitle, metaDescription, and urlSlug fields.`,
  },
  {
    stepNumber: 15,
    stepName: 'generate_image_prompt',
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o-mini',
    systemPrompt:
      'You are an expert at creating detailed prompts for AI image generation that produce professional, relevant featured images.',
    userPrompt: `Create a detailed image generation prompt for a featured image for this article:

Topic: {{topic}}
Article Summary: {{articleSummary}}

Requirements:
- Professional, high-quality appearance
- Relevant to the topic
- Visually engaging
- Suitable for a blog featured image (16:9 aspect ratio)
- Modern, clean aesthetic
- Avoid text in the image

Write a detailed prompt that will generate an appropriate featured image. Be specific about style, composition, colors, and mood.`,
  },
  {
    stepNumber: 17,
    stepName: 'generate_excerpt',
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o-mini',
    systemPrompt:
      'You are an expert copywriter specializing in creating compelling, curiosity-evoking teasers for articles.',
    userPrompt: `You are an expert copywriter specializing in creating compelling, curiosity-evoking teasers for articles.

Article Title: {{article_title}}
Article Content: {{article}}

Generate a compelling excerpt/teaser for this article that:
1. Is exactly 135 characters or less (to fit within a 150 character limit)
2. Creates curiosity and makes readers want to click and read more
3. Highlights the most interesting or valuable aspect of the article
4. Is engaging and compelling
5. Does NOT include quotes, markdown formatting, or code blocks

Return ONLY the excerpt text. No explanations, no markdown, no code blocks. Just the plain text excerpt.`,
  },
  {
    stepNumber: 18,
    stepName: 'generate_legal_disclaimer',
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o-mini',
    systemPrompt:
      "You are a legal compliance expert specializing in Google's YMYL (Your Money or Your Life) content standards.",
    userPrompt: `You are a legal compliance expert specializing in Google's YMYL (Your Money or Your Life) content standards.

Article Title: {{article_title}}
Article Topic: {{topic}}
Article Content Summary: {{article_summary}}

Generate a legal disclaimer for this article that:
1. Is 2-3 paragraphs long
2. Complies with Google's YMYL standards
3. Addresses potential legal, financial, or health implications
4. Includes appropriate warnings and disclaimers
5. Is professional and clear

Return ONLY the disclaimer text. No explanations, no markdown, no code blocks. Just the plain text disclaimer.`,
  },
]

// ── Enrichment template (not a numbered pipeline step — uses stepNumber 20) ─────
const ENRICHMENT_TEMPLATES = [
  {
    stepNumber: 20,
    stepName: 'enrichment_generate_diagram',
    defaultProvider: 'anthropic',
    defaultModel: 'claude-sonnet-4-5-20250929',
    systemPrompt:
      'You generate Mermaid.js diagrams that visually summarize a section of an article. ' +
      'You output ONLY valid Mermaid syntax — no explanation, no code fences, no markdown. ' +
      'The diagram type must be appropriate to the content ' +
      '(flowchart for processes, sequenceDiagram for interactions, gantt for timelines, ' +
      'classDiagram for hierarchies, mindmap for concept maps, pie for proportions, ' +
      'timeline for chronologies). ' +
      'If no diagram type fits the section, output exactly the string SKIP.',
    userPrompt: `Article topic: {{article_topic}}
Primary keyword: {{primary_keyword}}

Section heading: {{section_title}}

Section HTML:
{{section_html}}

Output a Mermaid diagram that adds visual clarity to this section. Pick the most appropriate diagram type. Do not exceed 12 nodes. Use plain English labels. No code fences. No commentary.

If the section is purely narrative or doesn't benefit from a visual, output exactly: SKIP`,
  },
]

async function main() {
  console.log('Seeding prompt templates...')

  for (const template of [...PROMPT_TEMPLATES, ...ENRICHMENT_TEMPLATES]) {
    await prisma.promptTemplate.upsert({
      where: { stepNumber: template.stepNumber },
      create: template,
      update: {
        stepName: template.stepName,
        defaultProvider: template.defaultProvider,
        defaultModel: template.defaultModel,
        systemPrompt: template.systemPrompt,
        userPrompt: template.userPrompt,
      },
    })
    console.log(`  ✓ Step ${template.stepNumber}: ${template.stepName}`)
  }

  const total = PROMPT_TEMPLATES.length + ENRICHMENT_TEMPLATES.length
  console.log(`\nSeeded ${total} prompt templates.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

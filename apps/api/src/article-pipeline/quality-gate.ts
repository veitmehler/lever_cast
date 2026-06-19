/**
 * Automated article quality gate (replaces the manual "paste into Gemini" check).
 *
 *   1. Gemini 3.1 Pro evaluates the finished Phase A body like a senior content
 *      reviewer and states a verdict in plain prose.
 *   2. GPT-4o-mini reads that prose and returns a STRUCTURED pass/revise/fail
 *      decision. Framing favors PASS — only substantive problems fail.
 *   3. A deterministic validator checks the JSON-LD schema markup.
 *
 * Orchestration (enqueue → approve | rewrite | needs_review) lives in the
 * handler; this module holds the model calls + the pure, testable helpers.
 */
import { prisma } from '@socioply/shared'
import { getLLMAdapter } from './llm/factory'
import { logger } from '../lib/logger'

const GEMINI_MODEL = 'gemini-3.1-pro'
const JUDGE_MODEL = 'gpt-4o-mini'

export type Verdict = 'pass' | 'revise' | 'fail'

export interface QualityVerdict {
  verdict: Verdict
  severity: 'none' | 'minor' | 'major'
  reasons: string[]
  geminiSummary: string
}

const EVAL_SYSTEM = `You are a senior content-quality reviewer assessing an article the way Google's helpful-content and E-E-A-T guidelines would. Judge depth, originality, accuracy, helpfulness to a real reader, structure, and readability.

State your OVERALL verdict in the very first sentence (e.g. "This is a high-quality, helpful article." or "This article needs significant improvement before publishing."). Then briefly note key strengths and any concrete issues. Be fair: a strong article with only minor polish suggestions is still high quality. Keep it under ~200 words.`

const JUDGE_SYSTEM = `You read a senior editor's evaluation of an article and decide whether it can PASS to publishing or needs revision. The evaluation usually states the overall verdict in its FIRST sentence — weight that heavily.

Rules:
- If the reviewer is overall positive and offers only minor, optional, or "nice to have" polish suggestions, return "pass". Minor suggestions must NOT cause a failure.
- Return "revise" only for SUBSTANTIVE problems: factual errors, thin/shallow or padded content, off-topic sections, missing key information, or poor structure that hurts the reader.
- Return "fail" only for severe problems that make the article unusable as-is.

Output STRICT JSON only, no prose:
{"verdict":"pass"|"revise"|"fail","severity":"none"|"minor"|"major","reasons":["short reason", ...]}
For "pass" use severity "none" or "minor" and an empty or short reasons array.`

/** Strip HTML to readable text for the evaluator (the body is stored as HTML). */
function htmlToText(html: string): string {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Gemini 3.1 Pro evaluation — returns the reviewer's prose verdict. */
export async function evaluateArticleQuality(
  articleHtml: string,
): Promise<{ text: string; cost: number; tokens: number }> {
  const text = htmlToText(articleHtml).slice(0, 24000) // cap for token safety
  const res = await getLLMAdapter('gemini').call({
    model: GEMINI_MODEL,
    systemPrompt: EVAL_SYSTEM,
    userPrompt: `Evaluate this article:\n\n${text}`,
    temperature: 0.2,
    maxTokens: 1200,
  })
  return { text: res.content, cost: res.cost, tokens: res.tokens.total }
}

/**
 * Parse the GPT-4o-mini judge JSON into a typed verdict. Pure + defensive:
 * unparseable / unknown output is treated as "revise" (conservative — it routes
 * to a rewrite and, after retries, to human review; it never silently ships).
 */
export function parseVerdict(raw: string, geminiSummary: string): QualityVerdict {
  const fallback: QualityVerdict = {
    verdict: 'revise',
    severity: 'major',
    reasons: ['Could not parse the quality judge output.'],
    geminiSummary,
  }
  if (!raw?.trim()) return fallback

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    const m = raw.match(/\{[\s\S]*\}/)
    if (!m) return fallback
    try {
      parsed = JSON.parse(m[0])
    } catch {
      return fallback
    }
  }

  const obj = parsed as Record<string, unknown>
  const v = String(obj.verdict ?? '').toLowerCase()
  const verdict: Verdict = v === 'pass' || v === 'revise' || v === 'fail' ? (v as Verdict) : 'revise'
  const sevRaw = String(obj.severity ?? '').toLowerCase()
  const severity = sevRaw === 'none' || sevRaw === 'minor' || sevRaw === 'major'
    ? (sevRaw as QualityVerdict['severity'])
    : verdict === 'pass'
      ? 'none'
      : 'major'
  const reasons = Array.isArray(obj.reasons)
    ? obj.reasons.map((r) => String(r)).filter(Boolean).slice(0, 10)
    : []

  return { verdict, severity, reasons, geminiSummary }
}

/** GPT-4o-mini structured judgment of the Gemini evaluation. */
export async function judgeQualityVerdict(geminiText: string): Promise<QualityVerdict> {
  const res = await getLLMAdapter('openai').call({
    model: JUDGE_MODEL,
    systemPrompt: JUDGE_SYSTEM,
    userPrompt: geminiText,
    temperature: 0,
    jsonMode: true,
    maxTokens: 500,
  })
  return parseVerdict(res.content, geminiText)
}

export interface SchemaValidationResult {
  ok: boolean
  errors: string[]
}

/**
 * Deterministic JSON-LD validation for the article schema markup. Checks the
 * essentials Google needs for an Article rich result: valid JSON, schema.org
 * @context, an @type, and a non-empty headline on the article node. Lenient —
 * non-fatal in the pipeline (rebuild once, else log/flag).
 */
export function validateSchemaJsonLd(schema: unknown): SchemaValidationResult {
  const errors: string[] = []
  let obj: Record<string, unknown>
  try {
    obj = typeof schema === 'string' ? JSON.parse(schema) : (schema as Record<string, unknown>)
  } catch {
    return { ok: false, errors: ['Schema is not valid JSON.'] }
  }
  if (!obj || typeof obj !== 'object') return { ok: false, errors: ['Schema is empty or not an object.'] }

  const ctx = JSON.stringify(obj['@context'] ?? '')
  if (!ctx.toLowerCase().includes('schema.org')) errors.push('Missing or invalid @context (expected schema.org).')

  // Collect candidate nodes (single object or @graph array).
  const graph = obj['@graph']
  const nodes: Array<Record<string, unknown>> = Array.isArray(graph)
    ? (graph as Array<Record<string, unknown>>)
    : [obj]

  if (!nodes.some((n) => n && n['@type'])) errors.push('No node has an @type.')

  const ARTICLE_TYPES = ['Article', 'BlogPosting', 'NewsArticle', 'MedicalWebPage', 'WebPage']
  const articleNode = nodes.find((n) => {
    const t = JSON.stringify(n?.['@type'] ?? '')
    return ARTICLE_TYPES.some((at) => t.includes(at))
  })
  if (articleNode) {
    const headline = articleNode.headline ?? articleNode.name
    if (!headline || !String(headline).trim()) errors.push('Article node is missing a headline.')
  }

  return { ok: errors.length === 0, errors }
}

const REWRITE_SYSTEM = `You are an expert editor. Revise the article to fix the specified issues while preserving its meaning, structure, formatting, and any existing hyperlinks/citations. Return ONLY the full corrected article in the SAME format (HTML if given HTML), with no preamble or commentary.`

/**
 * Regenerate the Phase A body addressing the verdict's reasons, overwriting the
 * step-11 (body) output in place. Best-effort improvement before re-gating.
 */
export async function rewriteArticleBody(jobId: string, reasons: string[]): Promise<boolean> {
  const bodyStep =
    (await prisma.pipelineStep.findFirst({ where: { jobId, stepNumber: 11 } })) ??
    (await prisma.pipelineStep.findFirst({ where: { jobId, stepNumber: 9 } }))
  if (!bodyStep?.output) {
    logger.warn({ jobId }, '[quality-gate] no body step to rewrite')
    return false
  }

  const provider = bodyStep.provider || 'gemini'
  const model = bodyStep.model || GEMINI_MODEL

  const issues = reasons.length ? reasons.map((r) => `- ${r}`).join('\n') : '- Improve overall depth, accuracy, and helpfulness.'
  try {
    const res = await getLLMAdapter(provider).call({
      model,
      systemPrompt: REWRITE_SYSTEM,
      userPrompt: `Issues to fix:\n${issues}\n\nArticle:\n${bodyStep.output}`,
      temperature: 0.4,
      maxTokens: 8000,
    })
    const revised = res.content?.trim()
    if (!revised) return false
    await prisma.pipelineStep.update({
      where: { id: bodyStep.id },
      data: { output: revised },
    })
    logger.info({ jobId, stepNumber: bodyStep.stepNumber }, '[quality-gate] body rewritten')
    return true
  } catch (err) {
    logger.error({ jobId, err }, '[quality-gate] rewrite failed')
    return false
  }
}

/** Read the Phase A body HTML for evaluation (step 11, fallback step 9). */
export async function getArticleBodyHtml(jobId: string): Promise<string | null> {
  const step =
    (await prisma.pipelineStep.findFirst({ where: { jobId, stepNumber: 11 } })) ??
    (await prisma.pipelineStep.findFirst({ where: { jobId, stepNumber: 9 } }))
  return step?.output ?? null
}

/** Run evaluation + judgment for a job's body. Throws on LLM failure. */
export async function runQualityCheck(jobId: string): Promise<QualityVerdict> {
  const body = await getArticleBodyHtml(jobId)
  if (!body) throw new Error(`No article body found for job ${jobId}`)
  const evaluation = await evaluateArticleQuality(body)
  const verdict = await judgeQualityVerdict(evaluation.text)
  return verdict
}

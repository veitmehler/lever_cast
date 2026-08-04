/**
 * Personalized X-Ray Debrief PDF (marketing funnel, PUBLIC route).
 *
 * GET /api/xray/report?d=<base64url JSON>
 *   d = { v: 1, n: <name>, p: <practiceName|null>, c: <currency>, a: <answers> }
 *
 * STATELESS by design: the quiz page (apps/web/public/x-ray/index.html) builds
 * this URL client-side and ships it in the GHL webhook payload as reportUrl;
 * the nurture email's button is {{contact.xray_report_url}}. No DB, no tokens.
 * All numeric inputs are re-clamped to the quiz's slider ranges so a forged
 * URL can't produce absurd dollar figures, and names are HTML-escaped.
 *
 * Rendering reuses the pooled Chromium (diagram-browser-pool) — global page
 * semaphore caps concurrency; results are LRU-cached by the raw `d` param.
 */
import type { FastifyInstance } from 'fastify'
import { logger } from '../lib/logger'
import { withRasterPage } from '../article-pipeline/enrichment/diagram-browser-pool'
import { compute, scoreRead, verdictHtml, type XrayAnswers } from '../marketing/xray-math'
import { buildBarsHtml, buildDebriefHtml } from '../marketing/xray-debrief-template'

const CHOICE_PTS = new Set([0, 3, 5, 7, 10])
const SYMBOLS: Record<string, string> = { USD: '$', AUD: '$', CAD: '$', NZD: '$', GBP: '£', EUR: '€' }

interface ReportPayload {
  v: number
  n?: string
  p?: string | null
  c?: string
  a: Record<string, unknown>
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x))
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Strict-parse the payload; returns null on anything malformed. */
export function parseReportPayload(dParam: string): { answers: XrayAnswers; preparedFor: string; currency: string } | null {
  let payload: ReportPayload
  try {
    const json = Buffer.from(dParam, 'base64url').toString('utf8')
    payload = JSON.parse(json) as ReportPayload
  } catch {
    return null
  }
  if (!payload || payload.v !== 1 || typeof payload.a !== 'object' || payload.a === null) return null

  const a = payload.a as Record<string, unknown>
  const choice = (k: string): number | null => {
    const v = Number(a[k])
    return CHOICE_PTS.has(v) ? v : null
  }
  const num = (k: string): number | null => {
    const v = Number(a[k])
    return Number.isFinite(v) ? v : null
  }

  const c = {
    a1: choice('a1'), a2: choice('a2'), a3: choice('a3'),
    b1: choice('b1'), b2: choice('b2'),
    c1: choice('c1'), c2: choice('c2'),
    d1: choice('d1'), d2: choice('d2'),
  }
  if (Object.values(c).some((v) => v === null)) return null
  const inquiriesWeekly = num('inquiriesWeekly')
  const maintRate = num('maintRate')
  const activePatients = num('activePatients')
  const visitFee = num('visitFee')
  if (inquiriesWeekly === null || maintRate === null || activePatients === null || visitFee === null) return null

  const answers: XrayAnswers = {
    a1: c.a1!, a2: c.a2!, a3: c.a3!, b1: c.b1!, b2: c.b2!,
    c1: c.c1!, c2: c.c2!, d1: c.d1!, d2: c.d2!,
    inquiriesWeekly: clamp(Math.round(inquiriesWeekly), 0, 50),
    maintRate: clamp(maintRate, 0, 0.8),
    activePatients: clamp(Math.round(activePatients), 100, 5000),
    visitFee: clamp(Math.round(visitFee), 40, 150),
  }

  // Practice name wins; fall back to the lead's own name from the quiz gate.
  const rawName = (typeof payload.p === 'string' && payload.p.trim()) || (typeof payload.n === 'string' && payload.n.trim()) || 'your practice'
  const preparedFor = escapeHtml(rawName.slice(0, 60))
  const currency = SYMBOLS[payload.c ?? ''] ? (payload.c as string) : 'USD'
  return { answers, preparedFor, currency }
}

// Tiny LRU: Map preserves insertion order; delete+set refreshes recency.
const CACHE_MAX = 100
const pdfCache = new Map<string, Buffer>()

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

export async function xrayReportRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { d?: string } }>('/xray/report', async (request, reply) => {
    const dParam = request.query.d
    if (!dParam || dParam.length > 4096) {
      return reply.code(400).send({ error: 'missing or oversized report data' })
    }

    const parsed = parseReportPayload(dParam)
    if (!parsed) return reply.code(400).send({ error: 'invalid report data' })

    const cached = pdfCache.get(dParam)
    if (cached) {
      pdfCache.delete(dParam)
      pdfCache.set(dParam, cached)
      return reply.header('Content-Type', 'application/pdf').header('Content-Disposition', 'inline; filename="X-Ray-Debrief.pdf"').send(cached)
    }

    const { answers, preparedFor, currency } = parsed
    const sym = SYMBOLS[currency]
    const money = (n: number) => sym + Math.round(n).toLocaleString('en-US')
    const r = compute(answers)

    const now = new Date()
    const scanDate = `${String(now.getUTCDate()).padStart(2, '0')} ${MONTHS[now.getUTCMonth()]} ${now.getUTCFullYear()}`

    const html = buildDebriefHtml({
      preparedFor,
      scanDate,
      totalScore: r.total,
      scoreRead: scoreRead(r.total),
      barsHtml: buildBarsHtml(r.scores, r.weakest),
      verdictHtml: verdictHtml(answers, r, money),
      totalLeak: money(r.totalLeak),
      driftLeak: money(r.driftLeak),
      respLeak: money(r.responseLeak),
      mult: r.priceMultiple,
      fee: money(answers.visitFee),
      feeYear: money(answers.visitFee * 12),
    })

    try {
      const pdf = await withRasterPage(async (page) => {
        // 'load' suffices: the document is fully inline (data-URI images only).
        await page.setContent(html, { waitUntil: 'load' })
        return await page.pdf({ printBackground: true, preferCSSPageSize: true })
      })
      const buf = Buffer.from(pdf)
      pdfCache.set(dParam, buf)
      if (pdfCache.size > CACHE_MAX) {
        const oldest = pdfCache.keys().next().value
        if (oldest) pdfCache.delete(oldest)
      }
      logger.info({ preparedFor, totalLeak: r.totalLeak, weakest: r.weakest }, '[xray] personalized debrief rendered')
      return reply.header('Content-Type', 'application/pdf').header('Content-Disposition', 'inline; filename="X-Ray-Debrief.pdf"').send(buf)
    } catch (err) {
      logger.error({ err }, '[xray] debrief render failed')
      return reply.code(500).send({ error: 'report rendering failed, please retry' })
    }
  })
}

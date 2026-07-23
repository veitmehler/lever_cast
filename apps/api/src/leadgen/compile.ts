/**
 * Lead-gen branding compiler (leadgen plan Phase 4, Model B).
 *
 * Master = designed HTML with {{brand.*}} tokens and <slot name="x">neutral
 * text</slot> content slots. Per clinic: brand tokens applied, eligible slots
 * voice-rewritten under HARD guards (length ratio, numeric tokens survive
 * verbatim, dash sanitizer), rendered to PDF via the pooled Chromium, uploaded
 * to S3 + the account's Drive folder, and parked as pending_review — the
 * review gate is the AHPRA checkpoint (user decision).
 */
import { prisma, uploadBufferWithKey } from '@socioply/shared'
import { brandFooterTemplate } from './master-layout'
import { logger } from '../lib/logger'
import { getSystemApiKey } from '../lib/system-keys'
import { withRasterPage } from '../article-pipeline/enrichment/diagram-browser-pool'
import { sanitizeDashesText } from '../lib/text/dash-sanitizer'
import { instrumentCall } from '../lib/net/instrument'
import { withTimeout } from '../lib/net/with-timeout'
import { ensureAccountFolder, uploadPdf, driveConfigured, deleteFile } from '../lib/gdrive/client'

const MODEL = 'gemini-3-flash-preview'
const LENGTH_RATIO_MIN = 0.7
const LENGTH_RATIO_MAX = 1.4

interface SlotMeta {
  maxChars?: number
  rewriteEligible?: boolean
}

export interface BrandTokens {
  organizationName: string
  phone: string
  email: string
  website: string
  address: string
  bookingCta: string
  bookingUrl: string
  openingHours: string
  readerOffer: string
  logoUrl: string
  headerColor: string
  accentColor: string
  fontColor: string
}

async function brandTokensFor(userId: string): Promise<BrandTokens> {
  const [brand, offer] = await Promise.all([
    prisma.brandSettings.findUnique({ where: { userId } }),
    prisma.newsletterOffer.findFirst({ where: { userId, enabled: true }, orderBy: { createdAt: 'asc' } }),
  ])
  return {
    organizationName: brand?.organizationName ?? 'Your Practice',
    phone: brand?.organizationPhone ?? '',
    email: brand?.organizationEmail ?? '',
    website: brand?.organizationWebsite ?? '',
    address: brand?.geolocation ?? '',
    bookingCta: brand?.socialCallToAction ?? 'Book an appointment',
    bookingUrl: brand?.bookingUrl ?? '',
    openingHours: brand?.openingHours ?? '',
    // Reader offer = the account's first enabled newsletter offer (locked
    // decision 2026-07-23); neutral fallback when none exists yet.
    readerOffer: offer?.title?.trim() || 'Ask about our new-patient assessment when you book',
    logoUrl: brand?.nlLogoUrl ?? '',
    headerColor: brand?.nlHeaderBgColor ?? '#0b2545',
    accentColor: brand?.nlLinkColor ?? '#2a6f97',
    fontColor: brand?.nlFontColor ?? '#222222',
  }
}

/**
 * Elements marked data-optional="<tokenKey>" are removed entirely when that
 * brand token is empty (opening hours, booking URL, …) — a document must never
 * render an empty label. Keep optional wrappers flat (no nested same-tag).
 */
export function dropEmptyOptionalBlocks(html: string, t: BrandTokens): string {
  return html.replace(
    /<(\w+)[^>]*\bdata-optional="(\w+)"[^>]*>[\s\S]*?<\/\1>/g,
    (m, _tag, key: string) =>
      String((t as unknown as Record<string, string>)[key] ?? '').trim() ? m : '',
  )
}

/** Inline the logo as a data URI so the print render never races a network fetch. */
export async function inlineLogo(t: BrandTokens): Promise<BrandTokens> {
  if (!t.logoUrl) return t
  try {
    const res = await fetch(t.logoUrl)
    if (!res.ok) throw new Error(`logo fetch ${res.status}`)
    const mime = res.headers.get('content-type') ?? 'image/png'
    const b64 = Buffer.from(await res.arrayBuffer()).toString('base64')
    return { ...t, logoUrl: `data:${mime};base64,${b64}` }
  } catch (err) {
    logger.warn({ err, logoUrl: t.logoUrl }, '[leadgen-compile] logo inline failed — org-name fallback')
    return { ...t, logoUrl: '' }
  }
}

function applyBrandTokens(html: string, t: BrandTokens): string {
  return dropEmptyOptionalBlocks(html, t).replace(/\{\{brand\.(\w+)\}\}/g, (_m, key: string) =>
    String((t as unknown as Record<string, string>)[key] ?? ''),
  )
}

/** Numeric tokens (claims, dosages, stats) must survive a rewrite verbatim. */
export function numericTokensMatch(a: string, b: string): boolean {
  const nums = (s: string) => (s.match(/\d+(?:[.,]\d+)?%?/g) ?? []).sort()
  return JSON.stringify(nums(a)) === JSON.stringify(nums(b))
}

export function rewriteWithinGuards(original: string, rewritten: string, maxChars?: number): boolean {
  const ratio = rewritten.length / Math.max(1, original.length)
  if (ratio < LENGTH_RATIO_MIN || ratio > LENGTH_RATIO_MAX) return false
  if (maxChars && rewritten.length > maxChars) return false
  if (!numericTokensMatch(original, rewritten)) return false
  if (/—|(?<![0-9])–(?![0-9])/.test(rewritten)) return false
  return true
}

async function rewriteSlot(
  geminiKey: string,
  slotText: string,
  writingStyle: string,
  feedbackNote?: string,
): Promise<string | null> {
  try {
    const res = await instrumentCall({ provider: 'gemini', op: 'leadgen.rewrite' }, () =>
      withTimeout(
        (signal) =>
          fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Rewrite this lead-magnet passage in the practitioner's voice. HARD RULES:
- Keep ALL facts, numbers and claims EXACTLY as written (change nothing factual — this is regulated healthcare content, no new therapeutic claims, no guarantees).
- Keep the length within ±20% of the original.
- Keep any HTML tags exactly where they are.
- No em-dashes.
VOICE: ${writingStyle.slice(0, 1500)}${feedbackNote ? `\nCLIENT FEEDBACK on the previous version (honor it within the rules above): ${feedbackNote}` : ''}

PASSAGE:
${slotText}

Return ONLY the rewritten passage.`,
                    },
                  ],
                },
              ],
              generationConfig: { temperature: 0.5 },
            }),
            signal,
          }),
        60_000,
        'leadgen.rewrite',
      ),
    )
    if (!res.ok) return null
    const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
    return data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim() || null
  } catch {
    return null
  }
}

export async function compileLeadGenDocument(documentId: string, feedbackNote?: string): Promise<void> {
  const doc = await prisma.leadGenDocument.findUnique({
    where: { id: documentId },
    include: { template: true, account: { select: { name: true, driveFolderId: true } } },
  })
  if (!doc?.template) {
    logger.warn({ documentId }, '[leadgen-compile] no document/template')
    return
  }

  try {
    const tokens = await brandTokensFor(doc.userId)
    const settings = await prisma.settings.findUnique({ where: { userId: doc.userId }, select: { writingStyle: true } })
    const slotMeta = (doc.template.slotMeta as Record<string, SlotMeta>) ?? {}
    const geminiKey = await getSystemApiKey('gemini')

    // 1. Voice-rewrite eligible slots under guards; fallback = neutral master text.
    let html = doc.template.sourceHtml
    const slotRe = /<slot name="([\w-]+)">([\s\S]*?)<\/slot>/g
    const slots = [...html.matchAll(slotRe)]
    for (const m of slots) {
      const [full, name, original] = m
      const meta = slotMeta[name] ?? {}
      let finalText = original
      if (meta.rewriteEligible !== false && geminiKey && settings?.writingStyle) {
        const rewritten = await rewriteSlot(geminiKey, original, settings.writingStyle, feedbackNote)
        if (rewritten && rewriteWithinGuards(original, rewritten, meta.maxChars)) {
          finalText = await sanitizeDashesText(rewritten, { surface: 'leadgen_slot' })
        } else if (rewritten) {
          logger.info({ documentId, slot: name }, '[leadgen-compile] rewrite failed guards — neutral text kept')
        }
      }
      html = html.replace(full, finalText)
    }

    // 2. Brand tokens (logo inlined as data URI) + render to PDF. The brand
    // strip renders as a Chromium footer template inside the page's bottom
    // margin — flowed content can never overlap it.
    const inked = await inlineLogo(tokens)
    html = applyBrandTokens(html, inked)
    const pdf = await withRasterPage(async (page) => {
      await page.setContent(html, { waitUntil: 'load', timeout: 60_000 })
      return (await page.pdf({
        format: 'a4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate: brandFooterTemplate(inked),
        margin: { top: '0', bottom: '13mm', left: '0', right: '0' },
      })) as Buffer
    })

    // 3. S3 copy (source of truth) + Drive upload (when configured).
    const pdfKey = `leadgen/${doc.accountId}/${doc.slug}-${Date.now()}.pdf`
    await uploadBufferWithKey(pdfKey, pdf, 'application/pdf')

    let driveFileId: string | null = null
    let driveLink: string | null = null
    if (driveConfigured()) {
      let folderId = doc.account.driveFolderId
      if (!folderId) {
        folderId = await ensureAccountFolder(doc.accountId, doc.account.name ?? 'client')
        await prisma.account.update({ where: { id: doc.accountId }, data: { driveFolderId: folderId } })
      }
      if (doc.driveFileId) await deleteFile(doc.driveFileId) // regenerate replaces
      const uploaded = await uploadPdf(folderId, `${doc.title}.pdf`, pdf)
      driveFileId = uploaded.fileId
      driveLink = uploaded.webViewLink
    }

    await prisma.leadGenDocument.update({
      where: { id: documentId },
      data: {
        status: 'pending_review',
        pdfKey,
        driveFileId,
        driveLink,
        compiledAt: new Date(),
        lastError: null,
      },
    })
    logger.info({ documentId, driveFileId, pdfKey }, '[leadgen-compile] compiled → pending_review')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error({ documentId, err }, '[leadgen-compile] FAILED')
    await prisma.leadGenDocument.update({
      where: { id: documentId },
      data: { status: 'failed', lastError: msg },
    })
  }
}

// ── Custom uploads (Model A — leadgen plan Phase 6) ──────────────────────────

/** Minimal branded cover for a client-uploaded PDF. */
function customCoverHtml(title: string, t: BrandTokens): string {
  const esc = (s: string) => s.replace(/</g, '&lt;')
  return `<!doctype html><html><head><meta charset="utf-8"/><style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; }
  .cover { width: 210mm; height: 297mm; background: ${t.headerColor}; color: #fff; display: flex; flex-direction: column; justify-content: space-between; padding: 28mm 22mm; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
  .logo img { max-height: 22mm; max-width: 60mm; }
  .logo-fallback { font-size: 20px; font-weight: 700; }
  h1 { font-size: 40px; line-height: 1.15; max-width: 150mm; }
  .bar { width: 42mm; height: 2.5mm; background: ${t.accentColor}; margin-top: 10mm; border-radius: 2px; }
  .foot { font-size: 13px; opacity: .85; }
</style></head><body><div class="cover">
  <div class="logo">${t.logoUrl ? `<img src="${t.logoUrl}"/>` : `<div class="logo-fallback">${esc(t.organizationName)}</div>`}</div>
  <div><h1>${esc(title)}</h1><div class="bar"></div></div>
  <div class="foot">Prepared for you by ${esc(t.organizationName)} · ${esc(t.website)}</div>
</div></body></html>`
}

/**
 * Custom upload path: original PDF as-is, optionally with a branded cover page
 * merged in front (pdf-lib). NO text modification — baked layouts stay theirs.
 */
export async function compileCustomDocument(documentId: string, addCover: boolean): Promise<void> {
  const doc = await prisma.leadGenDocument.findUnique({
    where: { id: documentId },
    include: { account: { select: { name: true, driveFolderId: true } } },
  })
  if (!doc?.sourcePdfKey) {
    logger.warn({ documentId }, '[leadgen-compile] custom doc without sourcePdfKey')
    return
  }
  try {
    const cdn = (process.env.CDN_BASE ?? 'https://cdn.socioply.com').replace(/\/$/, '')
    const srcRes = await fetch(`${cdn}/${doc.sourcePdfKey}`)
    if (!srcRes.ok) throw new Error(`source PDF fetch ${srcRes.status}`)
    const original = Buffer.from(await srcRes.arrayBuffer())

    let finalPdf = original
    if (addCover) {
      const tokens = await inlineLogo(await brandTokensFor(doc.userId))
      const coverPdf = await withRasterPage(async (page) => {
        await page.setContent(customCoverHtml(doc.title, tokens), { waitUntil: 'load', timeout: 60_000 })
        return (await page.pdf({ format: 'a4', printBackground: true })) as Buffer
      })
      const { PDFDocument } = await import('pdf-lib')
      const merged = await PDFDocument.create()
      const cover = await PDFDocument.load(coverPdf)
      const body = await PDFDocument.load(original, { ignoreEncryption: true })
      for (const p of await merged.copyPages(cover, cover.getPageIndices())) merged.addPage(p)
      for (const p of await merged.copyPages(body, body.getPageIndices())) merged.addPage(p)
      finalPdf = Buffer.from(await merged.save())
    }

    const pdfKey = `leadgen/${doc.accountId}/${doc.slug}-${Date.now()}.pdf`
    await uploadBufferWithKey(pdfKey, finalPdf, 'application/pdf')

    let driveFileId: string | null = null
    let driveLink: string | null = null
    if (driveConfigured()) {
      let folderId = doc.account.driveFolderId
      if (!folderId) {
        folderId = await ensureAccountFolder(doc.accountId, doc.account.name ?? 'client')
        await prisma.account.update({ where: { id: doc.accountId }, data: { driveFolderId: folderId } })
      }
      if (doc.driveFileId) await deleteFile(doc.driveFileId)
      const uploaded = await uploadPdf(folderId, `${doc.title}.pdf`, finalPdf)
      driveFileId = uploaded.fileId
      driveLink = uploaded.webViewLink
    }

    await prisma.leadGenDocument.update({
      where: { id: documentId },
      data: { status: 'pending_review', pdfKey, driveFileId, driveLink, compiledAt: new Date(), lastError: null },
    })
    logger.info({ documentId, addCover }, '[leadgen-compile] custom upload processed → pending_review')
  } catch (err) {
    await prisma.leadGenDocument.update({
      where: { id: documentId },
      data: { status: 'failed', lastError: err instanceof Error ? err.message : String(err) },
    })
    logger.error({ documentId, err }, '[leadgen-compile] custom upload FAILED')
  }
}

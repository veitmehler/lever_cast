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
  logoUrl: string
  headerColor: string
  accentColor: string
  fontColor: string
}

async function brandTokensFor(userId: string): Promise<BrandTokens> {
  const brand = await prisma.brandSettings.findUnique({ where: { userId } })
  return {
    organizationName: brand?.organizationName ?? 'Your Practice',
    phone: brand?.organizationPhone ?? '',
    email: brand?.organizationEmail ?? '',
    website: brand?.organizationWebsite ?? '',
    address: brand?.geolocation ?? '',
    bookingCta: brand?.socialCallToAction ?? 'Book an appointment',
    logoUrl: brand?.nlLogoUrl ?? '',
    headerColor: brand?.nlHeaderBgColor ?? '#0b2545',
    accentColor: brand?.nlLinkColor ?? '#2a6f97',
    fontColor: brand?.nlFontColor ?? '#222222',
  }
}

function applyBrandTokens(html: string, t: BrandTokens): string {
  return html.replace(/\{\{brand\.(\w+)\}\}/g, (_m, key: string) =>
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
VOICE: ${writingStyle.slice(0, 1500)}

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

export async function compileLeadGenDocument(documentId: string): Promise<void> {
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
        const rewritten = await rewriteSlot(geminiKey, original, settings.writingStyle)
        if (rewritten && rewriteWithinGuards(original, rewritten, meta.maxChars)) {
          finalText = await sanitizeDashesText(rewritten, { surface: 'leadgen_slot' })
        } else if (rewritten) {
          logger.info({ documentId, slot: name }, '[leadgen-compile] rewrite failed guards — neutral text kept')
        }
      }
      html = html.replace(full, finalText)
    }

    // 2. Brand tokens + render to PDF.
    html = applyBrandTokens(html, tokens)
    const pdf = await withRasterPage(async (page) => {
      await page.setContent(html, { waitUntil: 'load', timeout: 60_000 })
      return (await page.pdf({ format: 'a4', printBackground: true })) as Buffer
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

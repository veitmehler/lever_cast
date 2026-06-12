/**
 * Build the canonical OutputPayload from the database for a given jobId.
 * Called once per export attempt — all targets receive the same payload.
 */

import TurndownService from 'turndown'
import { prisma } from '@socioply/shared'
import type { OutputPayload } from './types'

const CDN_BASE = (process.env.CDN_BASE ?? '').replace(/\/$/, '')

function cdnUrl(s3Key: string): string {
  return `${CDN_BASE}/${s3Key}`
}

const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' })

export async function buildOutputPayload(jobId: string): Promise<OutputPayload> {
  const job = await prisma.articleJob.findUniqueOrThrow({
    where: { id: jobId },
    include: {
      topic: true,
      sitePage: {
        include: {
          featuredImage: true,
          diagrams: { orderBy: { position: 'asc' } },
        },
      },
      user: {
        select: {
          brandSettings: {
            select: {
              articleFontFamily: true,
              articleFontWeight: true,
              articleFontSizeBase: true,
            },
          },
        },
      },
    },
  })

  if (!job.sitePage) throw new Error(`No SitePage for job ${jobId}`)
  if (job.status !== 'published') {
    throw new Error(
      `Job ${jobId} must be published before export (status: ${job.status}) — publish from the workflow page first`,
    )
  }

  const sp = job.sitePage
  const bodyHtml = sp.bodyHtml ?? ''
  const bodyMarkdown = td.turndown(bodyHtml)

  // Normalise citations — handles both two-tier format and legacy formats.
  // Two-tier: { inline_sources: [...], resource_links: [...] }
  // Legacy:   { resource_links: [...] } or plain array
  const rawCitations = sp.citations as Record<string, unknown> | Array<Record<string, string>> | null

  let citations: Array<{ link_title: string; link_url: string; link_date?: string; source_type?: 'inline' | 'reference' }> = []
  if (rawCitations && !Array.isArray(rawCitations)) {
    const obj = rawCitations as Record<string, unknown>
    // Tier 1 — inline sources (from research grounding)
    if (Array.isArray(obj.inline_sources)) {
      for (const s of obj.inline_sources as Array<Record<string, string>>) {
        citations.push({
          link_title: s.link_title ?? s.title ?? '',
          link_url: s.link_url ?? s.url ?? '',
          source_type: 'inline',
        })
      }
    }
    // Tier 2 — resource links (from Step 12)
    if (Array.isArray(obj.resource_links)) {
      for (const s of obj.resource_links as Array<Record<string, string>>) {
        citations.push({
          link_title: s.link_title ?? '',
          link_url: s.link_url ?? '',
          link_date: s.link_date || undefined,
          source_type: 'reference',
        })
      }
    }
    // Legacy: { citations: [...] }
    if (citations.length === 0 && Array.isArray(obj.citations)) {
      for (const s of obj.citations as Array<Record<string, string>>) {
        citations.push({
          link_title: s.link_title ?? s.title ?? '',
          link_url: s.link_url ?? s.url ?? '',
          source_type: 'reference',
        })
      }
    }
  } else if (Array.isArray(rawCitations)) {
    citations = rawCitations.map((c) => ({
      link_title: c.link_title ?? c.title ?? '',
      link_url: c.link_url ?? c.url ?? '',
      source_type: 'reference' as const,
    }))
  }

  const featuredImage = sp.featuredImage
    ? {
        s3Key: (() => {
          try {
            const u = new URL(sp.featuredImage.url)
            return u.pathname.replace(/^\//, '')
          } catch {
            return sp.featuredImage.url
          }
        })(),
        cdnUrl: sp.featuredImage.url,
        alt: sp.featuredImage.altText ?? sp.seoTitle ?? sp.title,
      }
    : null

  const diagrams = sp.diagrams
    .filter((d) => d.pngS3Key)
    .map((d) => ({
      position: d.position,
      sectionAnchor: d.sectionAnchor,
      sectionTitle: d.sectionTitle,
      caption: d.caption,
      cdnUrl: cdnUrl(d.pngS3Key!),
      svgCdnUrl: d.svgS3Key ? cdnUrl(d.svgS3Key) : cdnUrl(d.pngS3Key!),
      svgContent: d.svgContent,
      pngS3Key: d.pngS3Key!,
      svgS3Key: d.svgS3Key ?? '',
      width: d.pngWidth,
      height: d.pngHeight,
    }))

  const brand = job.user.brandSettings
  const articleTypography =
    brand && (brand.articleFontFamily ?? brand.articleFontWeight ?? brand.articleFontSizeBase)
      ? {
          fontFamily: brand.articleFontFamily ?? null,
          fontWeight: brand.articleFontWeight ?? null,
          fontSizeBase: brand.articleFontSizeBase ?? null,
        }
      : null

  return {
    jobId,
    userId: job.userId,
    title: sp.seoTitle ?? sp.title,
    slug: sp.slug,
    bodyHtml,
    bodyMarkdown,
    excerpt: sp.excerpt ?? '',
    seoTitle: sp.seoTitle ?? sp.title,
    seoDescription: sp.seoDescription ?? '',
    primaryKeyword: sp.primaryKeyword ?? '',
    disclaimer: sp.disclaimer ?? '',
    schemaJson: sp.schemaJson ?? '',
    citations,
    featuredImage,
    diagrams,
    meta: {
      readingTime: sp.readingTime,
      publishedAt: sp.publishedAt,
    },
    articleTypography,
  }
}

/**
 * Build the canonical OutputPayload from the database for a given jobId.
 * Called once per export attempt — all targets receive the same payload.
 */

import TurndownService from 'turndown'
import { prisma } from '../../lib/prisma'
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

  // Normalise citations (stored as Json — could be array or { resource_links: [] })
  const rawCitations = sp.citations as
    | Array<{ link_title?: string; link_url?: string; title?: string; url?: string }>
    | { resource_links: Array<{ link_title?: string; link_url?: string }> }
    | null

  let citations: Array<{ link_title: string; link_url: string }> = []
  if (Array.isArray(rawCitations)) {
    citations = rawCitations.map((c) => ({
      link_title: c.link_title ?? c.title ?? '',
      link_url: c.link_url ?? c.url ?? '',
    }))
  } else if (rawCitations && Array.isArray((rawCitations as { resource_links: unknown[] }).resource_links)) {
    citations = (rawCitations as { resource_links: Array<{ link_title?: string; link_url?: string }> }).resource_links.map(
      (c) => ({ link_title: c.link_title ?? '', link_url: c.link_url ?? '' }),
    )
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

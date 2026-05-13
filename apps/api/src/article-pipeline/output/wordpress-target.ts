import { prisma } from '../../lib/prisma'
import { decrypt } from '../../lib/encryption'
import { logger } from '../../lib/logger'
import type { OutputPayload, OutputTarget, OutputAttemptResult } from './types'

// ── SEO plugin meta key mappings ──────────────────────────────────────────

type SeoMetaKeys = {
  title: string
  description: string
  focusKeyword?: string
}

const SEO_META_KEYS: Record<string, SeoMetaKeys> = {
  yoast: {
    title:        '_yoast_wpseo_title',
    description:  '_yoast_wpseo_metadesc',
    focusKeyword: '_yoast_wpseo_focuskw',
  },
  rankmath: {
    title:        'rank_math_title',
    description:  'rank_math_description',
    focusKeyword: 'rank_math_focus_keyword',
  },
  aioseo: {
    title:        '_aioseo_title',
    description:  '_aioseo_description',
    focusKeyword: '_aioseo_keywords',
  },
  seopress: {
    title:        '_seopress_titles_title',
    description:  '_seopress_titles_desc',
    focusKeyword: '_seopress_analysis_target_kw',
  },
  theseoframework: {
    title:       '_genesis_title',
    description: '_genesis_description',
    // The SEO Framework has no focus keyword field
  },
}

// ── WordPress API helpers ──────────────────────────────────────────────────

function basicAuthHeader(username: string, password: string): string {
  return 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
}

async function wpFetch(
  siteUrl: string,
  authHeader: string,
  method: string,
  endpoint: string,
  body?: unknown,
): Promise<{ status: number; data: unknown }> {
  const url = `${siteUrl.replace(/\/$/, '')}${endpoint}`
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: authHeader,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

async function uploadWpMedia(
  siteUrl: string,
  authHeader: string,
  imageUrl: string,
  filename: string,
  altText: string,
): Promise<{ id: number; source_url: string }> {
  const imgRes = await fetch(imageUrl)
  if (!imgRes.ok) throw new Error(`Could not download image: ${imageUrl}`)
  const imgBuf = await imgRes.arrayBuffer()

  const ext = filename.split('.').pop() ?? 'jpg'
  const contentType = ext === 'svg' ? 'image/svg+xml' : ext === 'png' ? 'image/png' : 'image/jpeg'

  const siteBase = siteUrl.replace(/\/$/, '')
  const res = await fetch(`${siteBase}/wp-json/wp/v2/media`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
    body: imgBuf,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string }
    throw new Error(`WP media upload failed (${res.status}): ${err.message ?? res.statusText}`)
  }
  const media = await res.json() as { id: number; source_url: string; alt_text?: string }

  // Set alt text via patch
  if (altText) {
    await fetch(`${siteBase}/wp-json/wp/v2/media/${media.id}`, {
      method: 'POST',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ alt_text: altText }),
    }).catch(() => {})
  }

  return { id: media.id, source_url: media.source_url }
}

function rewriteImageSrcs(
  html: string,
  urlMap: Map<string, string>,
): string {
  let result = html
  for (const [original, replacement] of urlMap.entries()) {
    result = result.replaceAll(original, replacement)
  }
  return result
}

// ── WordPressTarget ────────────────────────────────────────────────────────

interface WpConfig {
  connectionId: string
  status?: string
  categoryId?: number
  authorId?: number
}

export class WordPressTarget implements OutputTarget {
  name = 'wordpress'

  async publish(
    payload: OutputPayload,
    config: Record<string, unknown>,
    _attemptId: string,
  ): Promise<OutputAttemptResult> {
    const start = Date.now()
    const { connectionId, status, categoryId, authorId } = config as unknown as WpConfig

    if (!connectionId) throw new Error('WordPress connectionId is required')

    const conn = await prisma.wordPressConnection.findFirstOrThrow({
      where: { id: connectionId, userId: payload.userId },
      select: {
        id: true, username: true, appPassword: true, siteUrl: true,
        defaultStatus: true, defaultCategoryId: true, defaultAuthorId: true,
        seoPlugin: true,
      },
    })

    const topicPublishing = await prisma.articleJob
      .findFirst({
        where: { id: payload.jobId },
        select: { topic: { select: { wpCategoryId: true, wpTagIds: true } } },
      })
      .then((r) => r?.topic)

    const topicCategory = topicPublishing?.wpCategoryId ?? null
    const topicTags = topicPublishing?.wpTagIds ?? []

    const plainPassword = decrypt(conn.appPassword)
    const auth = basicAuthHeader(conn.username, plainPassword)
    const siteUrl = conn.siteUrl

    // 1. Upload featured image to WP media library
    let featuredMediaId: number | undefined
    if (payload.featuredImage) {
      try {
        const { id } = await uploadWpMedia(
          siteUrl,
          auth,
          payload.featuredImage.cdnUrl,
          `${payload.slug}-featured.jpg`,
          payload.featuredImage.alt,
        )
        featuredMediaId = id
      } catch (err) {
        logger.error({ err, jobId: payload.jobId }, '[wordpress] featured image upload failed')
        throw new Error(`Featured image upload failed: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    // 2. Upload diagrams — best-effort (fall back to CDN URL on failure)
    const diagramUrlMap = new Map<string, string>()
    for (const d of payload.diagrams) {
      try {
        const { source_url } = await uploadWpMedia(
          siteUrl,
          auth,
          d.cdnUrl,
          `${payload.slug}-diagram-${d.position}.png`,
          d.caption ?? d.sectionTitle,
        )
        diagramUrlMap.set(d.cdnUrl, source_url)
      } catch (err) {
        logger.warn(
          { err, jobId: payload.jobId, position: d.position },
          '[wordpress] diagram upload failed — using CDN fallback',
        )
        // Keep original CDN URL (no replacement)
      }
    }

    const wpReadyHtml = rewriteImageSrcs(payload.bodyHtml, diagramUrlMap)

    // 3. Create the WP post
    const postStatus = status ?? conn.defaultStatus ?? 'draft'
    const categories = categoryId
      ? [categoryId]
      : topicCategory != null
        ? [topicCategory]
        : conn.defaultCategoryId
          ? [conn.defaultCategoryId]
          : []
    const author = authorId ?? conn.defaultAuthorId ?? undefined

    const seoKeys = conn.seoPlugin ? SEO_META_KEYS[conn.seoPlugin] : undefined
    const seoMeta = seoKeys
      ? {
          [seoKeys.title]: payload.seoTitle,
          [seoKeys.description]: payload.seoDescription,
          ...(seoKeys.focusKeyword ? { [seoKeys.focusKeyword]: payload.primaryKeyword } : {}),
        }
      : undefined

    const postBody: Record<string, unknown> = {
      title: payload.title,
      slug: payload.slug,
      content: wpReadyHtml,
      excerpt: payload.excerpt,
      status: postStatus,
      ...(categories.length > 0 ? { categories } : {}),
      ...(topicTags.length > 0 ? { tags: topicTags } : {}),
      ...(author ? { author } : {}),
      ...(featuredMediaId ? { featured_media: featuredMediaId } : {}),
      ...(seoMeta ? { meta: seoMeta } : {}),
    }

    const { status: wpStatus, data: post } = await wpFetch(
      siteUrl,
      auth,
      'POST',
      '/wp-json/wp/v2/posts',
      postBody,
    )

    if (wpStatus !== 201) {
      const msg = (post as { message?: string }).message ?? `WP returned ${wpStatus}`

      // Slug collision — retry with jobId suffix
      if (wpStatus === 409 || (typeof msg === 'string' && msg.includes('slug'))) {
        const fallbackSlug = `${payload.slug}-${payload.jobId.slice(0, 8)}`
        const { status: s2, data: post2 } = await wpFetch(
          siteUrl,
          auth,
          'POST',
          '/wp-json/wp/v2/posts',
          { ...postBody, slug: fallbackSlug },
        )
        if (s2 !== 201) {
          throw new Error(`WP post creation failed (${s2}): ${(post2 as { message?: string }).message ?? s2}`)
        }
        const p2 = post2 as { id: number; link: string }
        return { success: true, resultUrl: p2.link, targetRefId: String(p2.id), durationMs: Date.now() - start }
      }

      throw new Error(`WP post creation failed (${wpStatus}): ${msg}`)
    }

    const p = post as { id: number; link: string }
    return {
      success: true,
      resultUrl: p.link,
      targetRefId: String(p.id),
      durationMs: Date.now() - start,
    }
  }
}

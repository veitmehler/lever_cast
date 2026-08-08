import type { FastifyInstance } from 'fastify'
import { prisma } from '@omniply/shared'

const CDN_BASE = (process.env.CDN_BASE ?? '').replace(/\/$/, '')

/**
 * Public read API for internally published essays (omniply.io/articles).
 * Only pages the internal output target has published (internalPublishedAt
 * set) are visible — which by construction is the azavea vertical only.
 * No auth: this is the public blog's data source, served through the
 * same-origin Next.js routes with ISR on top.
 */
export async function articlesPublicRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { limit?: string; offset?: string } }>(
    '/articles-public',
    { config: { rateLimit: { max: 120, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const limit = Math.min(50, Math.max(1, parseInt(request.query.limit ?? '20', 10) || 20))
      const offset = Math.max(0, parseInt(request.query.offset ?? '0', 10) || 0)
      const pages = await prisma.sitePage.findMany({
        where: { internalPublishedAt: { not: null } },
        orderBy: { internalPublishedAt: 'desc' },
        skip: offset,
        take: limit,
        select: {
          internalSlug: true,
          title: true,
          seoTitle: true,
          excerpt: true,
          readingTime: true,
          internalPublishedAt: true,
          featuredImage: { select: { url: true } },
        },
      })
      reply.header('Cache-Control', 'public, max-age=120, s-maxage=300')
      return reply.send({
        articles: pages.map((p) => ({
          slug: p.internalSlug,
          title: p.seoTitle ?? p.title,
          excerpt: p.excerpt,
          readingTime: p.readingTime,
          publishedAt: p.internalPublishedAt,
          featuredImage: p.featuredImage?.url ?? null,
        })),
      })
    },
  )

  app.get<{ Params: { slug: string } }>(
    '/articles-public/:slug',
    { config: { rateLimit: { max: 240, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const page = await prisma.sitePage.findFirst({
        where: { internalSlug: request.params.slug, internalPublishedAt: { not: null } },
        select: {
          internalSlug: true,
          title: true,
          seoTitle: true,
          seoDescription: true,
          excerpt: true,
          bodyHtml: true,
          disclaimer: true,
          schemaJson: true,
          citations: true,
          readingTime: true,
          internalPublishedAt: true,
          primaryKeyword: true,
          featuredImage: { select: { url: true, width: true, height: true, altText: true } },
        },
      })
      if (!page) return reply.status(404).send({ error: 'Not found' })
      reply.header('Cache-Control', 'public, max-age=120, s-maxage=600')
      return reply.send({
        slug: page.internalSlug,
        title: page.title,
        seoTitle: page.seoTitle ?? page.title,
        seoDescription: page.seoDescription ?? page.excerpt ?? '',
        excerpt: page.excerpt,
        bodyHtml: page.bodyHtml ?? '',
        disclaimer: page.disclaimer,
        schemaJson: page.schemaJson,
        citations: page.citations,
        readingTime: page.readingTime,
        publishedAt: page.internalPublishedAt,
        primaryKeyword: page.primaryKeyword,
        featuredImage: page.featuredImage
          ? {
              url: page.featuredImage.url,
              width: page.featuredImage.width,
              height: page.featuredImage.height,
              alt: page.featuredImage.altText ?? '',
            }
          : null,
      })
    },
  )
}

export const __testExports = { CDN_BASE }

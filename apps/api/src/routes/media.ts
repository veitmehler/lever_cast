import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { uploadImageToStorage } from '../lib/storage'

const MEDIA_SELECT = {
  id: true,
  url: true,
  s3Key: true,
  altText: true,
  title: true,
  source: true,
  prompt: true,
  provider: true,
  jobId: true,
  width: true,
  height: true,
  mimeType: true,
  createdAt: true,
} as const

function buildSourceFilter(source?: string): { in: string[] } | string | undefined {
  if (!source || source === 'all') return undefined
  if (source === 'ai') return { in: ['ai_featured', 'ai_social'] }
  return source
}

export async function mediaRoutes(app: FastifyInstance) {
  // GET /api/media?source=&limit=&offset=&search=
  app.get('/media', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const q = request.query as {
      source?: string
      limit?: string
      offset?: string
      search?: string
    }
    const limit = Math.min(Number(q.limit) || 40, 100)
    const offset = Number(q.offset) || 0

    const where: Record<string, unknown> = {
      userId: user.id,
      deletedAt: null,
    }

    const sourceFilter = buildSourceFilter(q.source)
    if (sourceFilter) where.source = sourceFilter

    if (q.search?.trim()) {
      where.OR = [
        { title: { contains: q.search.trim(), mode: 'insensitive' } },
        { altText: { contains: q.search.trim(), mode: 'insensitive' } },
      ]
    }

    const [items, total] = await Promise.all([
      prisma.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        select: MEDIA_SELECT,
      }),
      prisma.media.count({ where }),
    ])

    return reply.send({
      items,
      total,
      hasMore: offset + items.length < total,
    })
  })

  // POST /api/media/upload  (multipart/form-data, field "file")
  app.post('/media/upload', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const data = await request.file()
    if (!data) return reply.status(400).send({ error: 'No file uploaded' })
    if (!data.mimetype.startsWith('image/')) {
      return reply.status(400).send({ error: 'File must be an image' })
    }

    const buf = await data.toBuffer()
    if (buf.length > 10 * 1024 * 1024) {
      return reply.status(400).send({ error: 'File size must be less than 10MB' })
    }

    const dataUrl = `data:${data.mimetype};base64,${buf.toString('base64')}`
    const { url, path } = await uploadImageToStorage(dataUrl, user.id, data.filename)

    const media = await prisma.media.create({
      data: {
        userId: user.id,
        s3Key: path,
        url,
        source: 'upload',
        mimeType: data.mimetype,
        title: data.filename ?? 'Uploaded image',
      },
      select: MEDIA_SELECT,
    })

    return reply.status(201).send({ media })
  })

  // PATCH /api/media/:id
  app.patch<{ Params: { id: string } }>('/media/:id', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const { title, altText } = request.body as { title?: string; altText?: string }
    const existing = await prisma.media.findFirst({
      where: { id: request.params.id, userId: user.id, deletedAt: null },
    })
    if (!existing) return reply.status(404).send({ error: 'Image not found' })

    const media = await prisma.media.update({
      where: { id: existing.id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(altText !== undefined ? { altText } : {}),
      },
      select: MEDIA_SELECT,
    })

    return reply.send({ media })
  })

  // DELETE /api/media/:id — soft delete
  app.delete<{ Params: { id: string } }>('/media/:id', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const existing = await prisma.media.findFirst({
      where: { id: request.params.id, userId: user.id, deletedAt: null },
    })
    if (!existing) return reply.status(404).send({ error: 'Image not found' })

    await prisma.media.update({
      where: { id: existing.id },
      data: { deletedAt: new Date() },
    })

    return reply.send({ success: true })
  })
}

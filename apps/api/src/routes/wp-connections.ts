import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'
import { encrypt, decrypt } from '../lib/encryption'

// ── WP REST helpers ────────────────────────────────────────────────────────

function basicAuthHeader(username: string, password: string): string {
  return 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
}

async function verifyConnection(
  siteUrl: string,
  auth: string,
): Promise<{
  ok: boolean
  error?: string
  categories?: Array<{ id: number; name: string; slug: string }>
  authors?: Array<{ id: number; name: string }>
}> {
  const base = siteUrl.replace(/\/$/, '')
  try {
    // Verify credentials
    const meRes = await fetch(`${base}/wp-json/wp/v2/users/me?context=edit`, {
      headers: { Authorization: auth },
    })
    if (!meRes.ok) {
      const body = await meRes.json().catch(() => ({})) as { message?: string; code?: string }
      return { ok: false, error: body.message ?? `HTTP ${meRes.status}` }
    }

    // Load categories
    const catRes = await fetch(`${base}/wp-json/wp/v2/categories?per_page=100`, {
      headers: { Authorization: auth },
    })
    const categories = catRes.ok
      ? ((await catRes.json()) as Array<{ id: number; name: string; slug: string }>).map(
          (c) => ({ id: c.id, name: c.name, slug: c.slug }),
        )
      : []

    // Load authors (users with relevant roles)
    const usersRes = await fetch(
      `${base}/wp-json/wp/v2/users?roles=author,editor,administrator&per_page=100`,
      { headers: { Authorization: auth } },
    )
    const authors = usersRes.ok
      ? ((await usersRes.json()) as Array<{ id: number; name: string }>).map(
          (u) => ({ id: u.id, name: u.name }),
        )
      : []

    return { ok: true, categories, authors }
  } catch (err) {
    return { ok: false, error: `Network error: ${err instanceof Error ? err.message : String(err)}` }
  }
}

// ── Routes ─────────────────────────────────────────────────────────────────

interface CreateBody {
  label: string
  siteUrl: string
  username: string
  appPassword: string
  defaultStatus?: string
  defaultCategoryId?: number
  defaultAuthorId?: number
}

interface PatchBody {
  label?: string
  siteUrl?: string
  username?: string
  appPassword?: string
  defaultStatus?: string
  defaultCategoryId?: number | null
  defaultAuthorId?: number | null
}

export async function wpConnectionRoutes(app: FastifyInstance) {
  // GET /api/wp/connections
  app.get('/wp/connections', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const connections = await prisma.wordPressConnection.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, label: true, siteUrl: true, username: true,
        defaultStatus: true, defaultCategoryId: true, defaultAuthorId: true,
        lastVerifiedAt: true, lastError: true, createdAt: true, updatedAt: true,
      },
    })
    return reply.send({ connections })
  })

  // POST /api/wp/connections
  app.post<{ Body: CreateBody }>('/wp/connections', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const { label, siteUrl, username, appPassword, defaultStatus, defaultCategoryId, defaultAuthorId } =
      request.body

    if (!label || !siteUrl || !username || !appPassword) {
      return reply.status(400).send({ error: 'label, siteUrl, username, and appPassword are required' })
    }

    // Verify before saving
    const auth = basicAuthHeader(username, appPassword)
    const verification = await verifyConnection(siteUrl, auth)
    if (!verification.ok) {
      return reply.status(400).send({
        error: `WordPress connection failed: ${verification.error}`,
      })
    }

    const conn = await prisma.wordPressConnection.create({
      data: {
        userId: user.id,
        label,
        siteUrl: siteUrl.replace(/\/$/, ''),
        username,
        appPassword: encrypt(appPassword),
        defaultStatus: defaultStatus ?? 'draft',
        defaultCategoryId: defaultCategoryId ?? null,
        defaultAuthorId: defaultAuthorId ?? null,
        lastVerifiedAt: new Date(),
        lastError: null,
      },
      select: {
        id: true, label: true, siteUrl: true, username: true,
        defaultStatus: true, defaultCategoryId: true, defaultAuthorId: true,
        lastVerifiedAt: true, lastError: true, createdAt: true, updatedAt: true,
      },
    })

    return reply.status(201).send({
      connection: conn,
      categories: verification.categories,
      authors: verification.authors,
    })
  })

  // POST /api/wp/connections/:id/verify
  app.post<{ Params: { id: string } }>('/wp/connections/:id/verify', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const conn = await prisma.wordPressConnection.findFirst({
      where: { id: request.params.id, userId: user.id },
    })
    if (!conn) return reply.status(404).send({ error: 'Connection not found' })

    const auth = basicAuthHeader(conn.username, decrypt(conn.appPassword))
    const result = await verifyConnection(conn.siteUrl, auth)

    await prisma.wordPressConnection.update({
      where: { id: conn.id },
      data: {
        lastVerifiedAt: result.ok ? new Date() : undefined,
        lastError: result.ok ? null : (result.error ?? 'Verification failed'),
      },
    })

    return reply.send(result)
  })

  // PATCH /api/wp/connections/:id
  app.patch<{ Params: { id: string }; Body: PatchBody }>('/wp/connections/:id', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const conn = await prisma.wordPressConnection.findFirst({
      where: { id: request.params.id, userId: user.id },
    })
    if (!conn) return reply.status(404).send({ error: 'Connection not found' })

    const {
      label, siteUrl, username, appPassword,
      defaultStatus, defaultCategoryId, defaultAuthorId,
    } = request.body ?? {}

    const updated = await prisma.wordPressConnection.update({
      where: { id: conn.id },
      data: {
        ...(label        !== undefined ? { label }                                : {}),
        ...(siteUrl      !== undefined ? { siteUrl: siteUrl.replace(/\/$/, '') } : {}),
        ...(username     !== undefined ? { username }                             : {}),
        ...(appPassword  !== undefined ? { appPassword: encrypt(appPassword) }   : {}),
        ...(defaultStatus      !== undefined ? { defaultStatus }      : {}),
        ...(defaultCategoryId  !== undefined ? { defaultCategoryId }  : {}),
        ...(defaultAuthorId    !== undefined ? { defaultAuthorId }    : {}),
      },
      select: {
        id: true, label: true, siteUrl: true, username: true,
        defaultStatus: true, defaultCategoryId: true, defaultAuthorId: true,
        lastVerifiedAt: true, lastError: true, createdAt: true, updatedAt: true,
      },
    })

    return reply.send({ connection: updated })
  })

  // DELETE /api/wp/connections/:id
  app.delete<{ Params: { id: string } }>('/wp/connections/:id', async (request, reply) => {
    const clerkId = await requireAuth(request, reply)
    if (!clerkId) return

    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const conn = await prisma.wordPressConnection.findFirst({
      where: { id: request.params.id, userId: user.id },
    })
    if (!conn) return reply.status(404).send({ error: 'Connection not found' })

    // Detach topics that reference this connection
    await prisma.topic.updateMany({
      where: { wordPressConnectionId: conn.id },
      data: { wordPressConnectionId: null },
    })

    await prisma.wordPressConnection.delete({ where: { id: conn.id } })
    return reply.send({ ok: true })
  })
}

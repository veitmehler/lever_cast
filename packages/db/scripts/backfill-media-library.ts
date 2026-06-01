/**
 * One-time backfill: populate the image library from existing S3-backed assets.
 * Idempotent — skips rows whose s3Key already exists for the user.
 *
 * Run after migration: pnpm --filter @socioply/db backfill:media
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const CDN_BASE = (process.env.CDN_BASE ?? 'https://cdn.socioply.com').replace(/\/$/, '')

function s3KeyFromUrl(url: string): string | null {
  try {
    return new URL(url).pathname.replace(/^\//, '') || null
  } catch {
    return null
  }
}

async function upsertByKey(row: {
  userId: string
  s3Key: string
  url: string
  source: string
  title?: string | null
  prompt?: string | null
  provider?: string | null
  jobId?: string | null
  mimeType?: string | null
  width?: number | null
  height?: number | null
  createdAt?: Date
}) {
  const existing = await prisma.media.findFirst({
    where: { userId: row.userId, s3Key: row.s3Key },
  })
  if (existing) return

  await prisma.media.create({ data: row })
}

async function main() {
  let created = 0

  // 1. Featured images already in Media — ensure source is set
  const featuredUpdated = await prisma.media.updateMany({
    where: { sitePageFeaturedImages: { some: {} } },
    data: { source: 'ai_featured' },
  })
  console.log(`  ✓ Featured images tagged: ${featuredUpdated.count} row(s)`)

  // 2. Diagrams → Media (light PNG for grid thumbnails)
  const diagrams = await prisma.articleDiagram.findMany({
    where: { pngS3Key: { not: null } },
    select: {
      pngS3Key: true,
      pngWidth: true,
      pngHeight: true,
      sectionTitle: true,
      createdAt: true,
      sitePage: { select: { userId: true, jobId: true } },
    },
  })
  for (const d of diagrams) {
    if (!d.pngS3Key || !d.sitePage) continue
    const before = await prisma.media.count({ where: { userId: d.sitePage.userId, s3Key: d.pngS3Key } })
    await upsertByKey({
      userId: d.sitePage.userId,
      s3Key: d.pngS3Key,
      url: `${CDN_BASE}/${d.pngS3Key}`,
      source: 'diagram',
      title: d.sectionTitle,
      jobId: d.sitePage.jobId,
      mimeType: 'image/png',
      width: d.pngWidth,
      height: d.pngHeight,
      createdAt: d.createdAt,
    })
    const after = await prisma.media.count({ where: { userId: d.sitePage.userId, s3Key: d.pngS3Key } })
    if (after > before) created++
  }
  console.log(`  ✓ Diagrams backfilled: ${created} new row(s) from ${diagrams.length} diagram(s)`)

  // 3. Draft attachments → upload | ai_social
  let draftCreated = 0
  const drafts = await prisma.draft.findMany({
    where: { attachedImage: { not: null } },
    select: {
      userId: true,
      attachedImage: true,
      imageGenerationPrompt: true,
      imageGenerationProvider: true,
      createdAt: true,
    },
  })
  for (const d of drafts) {
    if (!d.attachedImage) continue
    const key = s3KeyFromUrl(d.attachedImage)
    if (!key) continue
    const before = await prisma.media.count({ where: { userId: d.userId, s3Key: key } })
    await upsertByKey({
      userId: d.userId,
      s3Key: key,
      url: d.attachedImage,
      source: d.imageGenerationPrompt ? 'ai_social' : 'upload',
      title: d.imageGenerationPrompt ? 'AI social image' : 'Uploaded image',
      prompt: d.imageGenerationPrompt,
      provider: d.imageGenerationProvider,
      createdAt: d.createdAt,
    })
    const after = await prisma.media.count({ where: { userId: d.userId, s3Key: key } })
    if (after > before) draftCreated++
  }
  console.log(`  ✓ Draft images backfilled: ${draftCreated} new row(s) from ${drafts.length} draft(s)`)

  // 4. Published post images → upload
  let postCreated = 0
  const posts = await prisma.post.findMany({
    where: { imageUrl: { not: null } },
    select: { userId: true, imageUrl: true, createdAt: true },
  })
  for (const p of posts) {
    if (!p.imageUrl) continue
    const key = s3KeyFromUrl(p.imageUrl)
    if (!key) continue
    const before = await prisma.media.count({ where: { userId: p.userId, s3Key: key } })
    await upsertByKey({
      userId: p.userId,
      s3Key: key,
      url: p.imageUrl,
      source: 'upload',
      title: 'Post image',
      createdAt: p.createdAt,
    })
    const after = await prisma.media.count({ where: { userId: p.userId, s3Key: key } })
    if (after > before) postCreated++
  }
  console.log(`  ✓ Post images backfilled: ${postCreated} new row(s) from ${posts.length} post(s)`)

  console.log('\nMedia library backfill complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

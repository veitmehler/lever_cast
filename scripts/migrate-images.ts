/**
 * scripts/migrate-images.ts
 *
 * Migrates images from Supabase Storage → AWS S3 and updates posts.imageUrl
 * in the database to the new CloudFront URLs.
 *
 * Safe to run multiple times (idempotent):
 *   - Skips rows whose imageUrl already starts with CDN_BASE
 *   - Skips download if the S3 key already exists (re-uploads anyway since
 *     PutObjectCommand is idempotent on S3 — no harm, keeps logic simple)
 *
 * Run with:
 *   npx tsx scripts/migrate-images.ts
 *
 * Requires env vars: DATABASE_URL, S3_BUCKET, S3_REGION, CDN_BASE,
 *                    ACCESS_KEY_ID, SECRET_ACCESS_KEY
 */

import { PrismaClient } from '@prisma/client'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const prisma = new PrismaClient()

const bucket = process.env.S3_BUCKET!
const region = process.env.S3_REGION ?? 'us-east-1'
const cdnBase = (process.env.CDN_BASE ?? '').replace(/\/$/, '')
const accessKeyId = process.env.ACCESS_KEY_ID!
const secretAccessKey = process.env.SECRET_ACCESS_KEY!

if (!bucket || !cdnBase || !accessKeyId || !secretAccessKey) {
  console.error('❌ Missing required env vars: S3_BUCKET, CDN_BASE, ACCESS_KEY_ID, SECRET_ACCESS_KEY')
  process.exit(1)
}

const s3 = new S3Client({
  region,
  credentials: { accessKeyId, secretAccessKey },
})

const SUPABASE_PATTERN = /\/storage\/v1\/object\/public\/post-images\/(.+)$/

function extractSupabasePath(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const match = urlObj.pathname.match(SUPABASE_PATTERN)
    return match ? match[1] : null
  } catch {
    return null
  }
}

function extractContentType(url: string, buffer: Buffer): string {
  // Detect from magic bytes
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'image/jpeg'
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'image/png'
  if (buffer[0] === 0x47 && buffer[1] === 0x49) return 'image/gif'
  if (buffer[0] === 0x52 && buffer[1] === 0x49) return 'image/webp'
  // Fallback: guess from URL extension
  const ext = url.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' }
  return map[ext ?? ''] ?? 'image/jpeg'
}

async function main() {
  console.log('🖼️  Starting image migration: Supabase Storage → AWS S3\n')

  // Find all rows with Supabase Storage URLs (posts.imageUrl + drafts.attachedImage)
  const posts = await prisma.post.findMany({
    where: { imageUrl: { contains: 'supabase.co' } },
    select: { id: true, imageUrl: true },
  })
  const drafts = await prisma.draft.findMany({
    where: { attachedImage: { contains: 'supabase.co' } },
    select: { id: true, attachedImage: true },
  })

  if (posts.length === 0 && drafts.length === 0) {
    console.log('✅ No posts or drafts with Supabase URLs — nothing to migrate.')
    return
  }

  // Deduplicate across both tables so we only upload each unique image once
  const uniqueUrls = [
    ...new Set([
      ...posts.map(p => p.imageUrl!),
      ...drafts.map(d => d.attachedImage!),
    ]),
  ]
  console.log(`Found ${posts.length} post(s) and ${drafts.length} draft(s) referencing ${uniqueUrls.length} unique image(s).\n`)

  // Map: supabaseUrl → cloudFrontUrl (built during upload phase)
  const urlMap = new Map<string, string>()

  // Phase 1 — upload each unique image to S3
  for (const supabaseUrl of uniqueUrls) {
    const s3Key = extractSupabasePath(supabaseUrl)
    if (!s3Key) {
      console.warn(`  ⚠️  Could not extract path from: ${supabaseUrl} — skipping`)
      continue
    }

    process.stdout.write(`  ↑ Uploading ${s3Key} … `)
    try {
      const response = await fetch(supabaseUrl)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const contentType = extractContentType(supabaseUrl, buffer)

      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: s3Key,
        Body: buffer,
        ContentType: contentType,
      }))

      const cloudFrontUrl = `${cdnBase}/${s3Key}`
      urlMap.set(supabaseUrl, cloudFrontUrl)
      console.log(`done → ${cloudFrontUrl}`)
    } catch (err) {
      console.log(`FAILED`)
      console.error(`     Error: ${err instanceof Error ? err.message : err}`)
    }
  }

  // Phase 2 — update DB rows
  console.log('\n  Updating database URLs…')
  let postsUpdated = 0
  let postsSkipped = 0
  let draftsUpdated = 0
  let draftsSkipped = 0

  for (const post of posts) {
    const newUrl = urlMap.get(post.imageUrl!)
    if (!newUrl) { postsSkipped++; continue }
    await prisma.post.update({
      where: { id: post.id },
      data: { imageUrl: newUrl },
    })
    postsUpdated++
  }

  for (const draft of drafts) {
    const newUrl = urlMap.get(draft.attachedImage!)
    if (!newUrl) { draftsSkipped++; continue }
    await prisma.draft.update({
      where: { id: draft.id },
      data: { attachedImage: newUrl },
    })
    draftsUpdated++
  }

  console.log(`\n✅ Migration complete.`)
  console.log(`   ${postsUpdated} post(s) updated, ${postsSkipped} skipped`)
  console.log(`   ${draftsUpdated} draft(s) updated, ${draftsSkipped} skipped`)

  if (postsSkipped > 0 || draftsSkipped > 0) {
    console.log('\n⚠️  Some rows were skipped. Re-run the script after fixing errors above.')
  }
}

main()
  .catch(err => {
    console.error('\n❌ Fatal error:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

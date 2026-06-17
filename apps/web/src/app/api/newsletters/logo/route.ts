import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { prisma } from '@socioply/shared'

// Newsletter header logo upload. Separate from the article/org logo so a customer
// can use a different mark in the newsletter. Persists BrandSettings.nlLogoUrl.

function getS3Client(): S3Client {
  const accessKeyId = process.env.ACCESS_KEY_ID
  const secretAccessKey = process.env.SECRET_ACCESS_KEY
  const region = process.env.S3_REGION ?? 'us-east-1'
  if (!accessKeyId || !secretAccessKey) throw new Error('Missing S3 credentials')
  return new S3Client({ region, credentials: { accessKeyId, secretAccessKey } })
}
function getBucket(): string {
  const bucket = process.env.S3_BUCKET
  if (!bucket) throw new Error('S3_BUCKET env var is not set')
  return bucket
}
function getCdnBase(): string {
  return (process.env.CDN_BASE ?? '').replace(/\/$/, '')
}
function keyFromUrl(cdnUrl: string): string | null {
  try {
    return new URL(cdnUrl).pathname.replace(/^\//, '') || null
  } catch {
    return null
  }
}
async function getUserId(clerkId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  return user?.id ?? null
}

const ALLOWED: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = await getUserId(clerkId)
    if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const ext = ALLOWED[file.type]
    if (!ext) {
      return NextResponse.json({ error: 'Unsupported file type. Use PNG, JPG, WebP or SVG.' }, { status: 400 })
    }
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Logo must be smaller than 2 MB.' }, { status: 400 })
    }

    const newKey = `brand-assets/${userId}/nl-logo.${ext}`
    const existing = await prisma.brandSettings.findUnique({ where: { userId }, select: { nlLogoUrl: true } })
    if (existing?.nlLogoUrl) {
      const oldKey = keyFromUrl(existing.nlLogoUrl)
      if (oldKey && oldKey !== newKey) {
        try {
          await getS3Client().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: oldKey }))
        } catch {
          /* non-fatal */
        }
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    await getS3Client().send(
      new PutObjectCommand({ Bucket: getBucket(), Key: newKey, Body: buffer, ContentType: file.type }),
    )
    const url = `${getCdnBase()}/${newKey}`

    await prisma.brandSettings.upsert({
      where: { userId },
      create: { userId, nlLogoUrl: url },
      update: { nlLogoUrl: url },
    })

    return NextResponse.json({ url })
  } catch (err) {
    console.error('[newsletters/logo] POST error:', err)
    return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = await getUserId(clerkId)
    if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const existing = await prisma.brandSettings.findUnique({ where: { userId }, select: { nlLogoUrl: true } })
    if (existing?.nlLogoUrl) {
      const key = keyFromUrl(existing.nlLogoUrl)
      if (key) {
        try {
          await getS3Client().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }))
        } catch {
          /* non-fatal */
        }
      }
      await prisma.brandSettings.update({ where: { userId }, data: { nlLogoUrl: null } })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[newsletters/logo] DELETE error:', err)
    return NextResponse.json({ error: 'Failed to remove logo' }, { status: 500 })
  }
}

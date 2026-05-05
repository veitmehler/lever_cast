import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

async function getUserId(clerkId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  return user?.id ?? null
}

// GET /api/brand-settings
export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = await getUserId(clerkId)
    if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const settings = await prisma.brandSettings.findUnique({ where: { userId } })

    // Return empty-but-shaped object if no row exists yet
    return NextResponse.json(
      settings ?? {
        geolocation: null,
        who: null,
        ourExperience: null,
        articleGoal: null,
        specialInstructions: null,
        defaultAuthorName: null,
        defaultAuthorWebsite: null,
        organizationName: null,
        organizationWebsite: null,
        organizationEmail: null,
        organizationPhone: null,
        organizationAddress: null,
        socialMediaLinks: null,
        diagramPrimaryColor: null,
        diagramPrimaryTextColor: null,
        diagramSecondaryColor: null,
        diagramLineColor: null,
        diagramTextColor: null,
        diagramFontFamily: null,
      },
    )
  } catch (err) {
    console.error('[brand-settings] GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch brand settings' }, { status: 500 })
  }
}

// PATCH /api/brand-settings
export async function PATCH(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = await getUserId(clerkId)
    if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await request.json()

    const stringFields = [
      'geolocation',
      'who',
      'ourExperience',
      'articleGoal',
      'specialInstructions',
      'defaultAuthorName',
      'defaultAuthorWebsite',
      'organizationName',
      'organizationWebsite',
      'organizationEmail',
      'organizationPhone',
      'organizationAddress',
      'diagramPrimaryColor',
      'diagramPrimaryTextColor',
      'diagramSecondaryColor',
      'diagramLineColor',
      'diagramTextColor',
      'diagramFontFamily',
    ] as const

    type StringField = typeof stringFields[number]

    const data: Prisma.BrandSettingsUpdateInput = {}

    for (const field of stringFields) {
      if (field in body) {
        data[field] = body[field] ? String(body[field]).trim() : null
      }
    }

    // socialMediaLinks is a JSON array: [{ platform: string, url: string }]
    if ('socialMediaLinks' in body) {
      const raw = body.socialMediaLinks
      if (Array.isArray(raw)) {
        const sanitized = raw
          .filter((l: unknown) => l && typeof l === 'object' && (l as Record<string, unknown>).platform && (l as Record<string, unknown>).url)
          .map((l: unknown) => {
            const link = l as Record<string, unknown>
            return { platform: String(link.platform).trim(), url: String(link.url).trim() }
          })
        data.socialMediaLinks = sanitized as Prisma.InputJsonValue
      } else {
        data.socialMediaLinks = Prisma.JsonNull
      }
    }

    const settings = await prisma.brandSettings.upsert({
      where: { userId },
      create: { userId, ...data } as Prisma.BrandSettingsUncheckedCreateInput,
      update: data,
    })

    return NextResponse.json(settings)
  } catch (err) {
    console.error('[brand-settings] PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update brand settings' }, { status: 500 })
  }
}

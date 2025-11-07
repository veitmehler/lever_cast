import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// Helper function to get or create user
async function getOrCreateUser(clerkId: string) {
  let user = await prisma.user.findUnique({
    where: { clerkId },
  })

  if (!user) {
    const clerkUser = await clerkClient.users.getUser(clerkId)

    const email = clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress

    if (!email) {
      throw new Error('No email found')
    }

    const firstName = clerkUser.firstName || ''
    const lastName = clerkUser.lastName || ''
    const name = firstName
      ? `${firstName}${lastName ? ' ' + lastName : ''}`
      : email.split('@')[0]

    user = await prisma.user.create({
      data: {
        clerkId,
        name,
        email,
      },
    })
  }

  return user
}

// GET /api/drafts - Get all drafts for the authenticated user
export async function GET() {
  try {
    const authResult = await auth()
    const userId = authResult.userId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create user
    const user = await getOrCreateUser(userId)

    // Fetch all drafts for this user with published posts
    const drafts = await prisma.draft.findMany({
      where: {
        userId: user.id,
      },
      include: {
        posts: {
          where: {
            status: 'published',
          },
          select: {
            id: true,
            platform: true,
            publishedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(drafts)
  } catch (error) {
    console.error('Error fetching drafts:', error)
    return NextResponse.json({ error: 'Failed to fetch drafts' }, { status: 500 })
  }
}

// POST /api/drafts - Create a new draft
export async function POST(request: Request) {
  try {
    const authResult = await auth()
    const userId = authResult.userId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      contentRaw,
      linkedinContent,
      twitterContent,
      platforms,
      templateId,
      attachedImage,
      status = 'draft',
    } = body

    // Validate required fields
    if (!title || !contentRaw || !platforms) {
      return NextResponse.json(
        { error: 'Missing required fields: title, contentRaw, platforms' },
        { status: 400 }
      )
    }

    // Get or create user
    const user = await getOrCreateUser(userId)

    // Create the draft
    const draft = await prisma.draft.create({
      data: {
        userId: user.id,
        title,
        contentRaw,
        linkedinContent: linkedinContent || null,
        twitterContent: twitterContent || null,
        platforms,
        templateId: templateId || null,
        attachedImage: attachedImage || null,
        status,
      },
    })

    return NextResponse.json(draft, { status: 201 })
  } catch (error) {
    console.error('Error creating draft:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { 
        error: 'Failed to create draft',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}


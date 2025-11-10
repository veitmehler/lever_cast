import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// Helper function to get or create user
async function getOrCreateUser(clerkId: string) {
  let user = await prisma.user.findUnique({
    where: { clerkId },
  })

  if (!user) {
    const { clerkClient } = await import('@clerk/nextjs/server')
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

// GET /api/posts/calendar - Get posts for calendar view
export async function GET(request: Request) {
  try {
    const authResult = await auth()
    const userId = authResult.userId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Get or create user
    const user = await getOrCreateUser(userId)

    // Default to current month if no dates provided
    const now = new Date()
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1)
    const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // Fetch posts within date range
    const posts = await prisma.post.findMany({
      where: {
        userId: user.id,
        OR: [
          {
            publishedAt: {
              gte: start,
              lte: end,
            },
          },
          {
            scheduledAt: {
              gte: start,
              lte: end,
            },
          },
        ],
      },
      include: {
        draft: {
          select: {
            id: true,
            title: true,
            contentRaw: true,
          },
        },
      },
      orderBy: [
        { scheduledAt: 'asc' },
        { publishedAt: 'desc' },
      ],
    })

    // Group posts by date
    const postsByDate: Record<string, Array<{
      id: string
      platform: string
      status: string
      content: string
      publishedAt: Date | null
      scheduledAt: Date | null
      draftId: string | null
      draft: { title: string } | null
    }>> = {}

    posts.forEach((post) => {
      // Use scheduledAt for scheduled posts, publishedAt for published posts
      const dateKey = post.scheduledAt
        ? new Date(post.scheduledAt).toISOString().split('T')[0]
        : post.publishedAt
          ? new Date(post.publishedAt).toISOString().split('T')[0]
          : new Date(post.createdAt).toISOString().split('T')[0]

      if (!postsByDate[dateKey]) {
        postsByDate[dateKey] = []
      }

      postsByDate[dateKey].push({
        id: post.id,
        platform: post.platform,
        status: post.status,
        content: post.content.substring(0, 100), // Preview
        publishedAt: post.publishedAt,
        scheduledAt: post.scheduledAt,
        draftId: post.draftId,
        draft: post.draft,
      })
    })

    return NextResponse.json(postsByDate)
  } catch (error) {
    console.error('Error fetching calendar posts:', error)
    return NextResponse.json({ error: 'Failed to fetch calendar posts' }, { status: 500 })
  }
}


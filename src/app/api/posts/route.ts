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

// GET /api/posts - Get all posts for the authenticated user
export async function GET() {
  try {
    const authResult = await auth()
    const userId = authResult.userId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create user
    const user = await getOrCreateUser(userId)

    // Fetch all posts for this user
    const posts = await prisma.post.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      include: {
        draft: {
          select: {
            title: true,
            contentRaw: true,
          },
        },
      },
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

// POST /api/posts - Create a new post
export async function POST(request: Request) {
  try {
    const authResult = await auth()
    const userId = authResult.userId

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      draftId,
      platform,
      content,
      postUrl,
      status = 'published',
      errorMsg,
    } = body

    // Validate required fields
    if (!platform || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: platform, content' },
        { status: 400 }
      )
    }

    // Get or create user
    const user = await getOrCreateUser(userId)

    // Check if a post already exists for this draft and platform
    if (draftId) {
      const existingPost = await prisma.post.findFirst({
        where: {
          draftId,
          platform,
          status: 'published',
        },
      })

      if (existingPost) {
        return NextResponse.json(
          { error: `Post already published to ${platform}` },
          { status: 400 }
        )
      }
    }

    // Create the post
    const post = await prisma.post.create({
      data: {
        userId: user.id,
        draftId: draftId || null,
        platform,
        content,
        postUrl: postUrl || null,
        status,
        errorMsg: errorMsg || null,
      },
    })

    // If draftId is provided and status is published, check if all platforms are published
    if (draftId && status === 'published') {
      const draft = await prisma.draft.findUnique({
        where: { id: draftId },
      })

      if (draft) {
        // Get all published posts for this draft
        const publishedPosts = await prisma.post.findMany({
          where: {
            draftId,
            status: 'published',
          },
          select: {
            platform: true,
          },
        })

        const publishedPlatforms = publishedPosts.map(p => p.platform)
        const draftPlatforms = draft.platforms === 'both' 
          ? ['linkedin', 'twitter'] 
          : [draft.platforms]

        // Check if all platforms for this draft are published
        const allPublished = draftPlatforms.every(platform => 
          publishedPlatforms.includes(platform)
        )

        // Only mark draft as published if all platforms are published
        if (allPublished) {
          await prisma.draft.update({
            where: { id: draftId },
            data: {
              status: 'published',
              publishedAt: new Date(),
            },
          })
        }
      }
    }

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}


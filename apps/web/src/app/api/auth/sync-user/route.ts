import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma, getOrCreateUserWithAccount } from '@socioply/shared'

/**
 * Sync Clerk user to database
 * This endpoint creates or updates the user record in PostgreSQL
 */
export async function POST() {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get full user details from Clerk
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json({ error: 'User not found in Clerk' }, { status: 404 })
    }

    // Get primary email
    const email = clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId
    )?.emailAddress

    if (!email) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 })
    }

    const name = clerkUser.firstName
      ? `${clerkUser.firstName}${clerkUser.lastName ? ' ' + clerkUser.lastName : ''}`
      : email.split('@')[0]

    // Find-or-create the user together with its Account (tenant), honoring an
    // invitation's target account, then keep name/email fresh from Clerk.
    const invitedAccountId =
      typeof clerkUser.publicMetadata?.accountId === 'string'
        ? clerkUser.publicMetadata.accountId
        : undefined
    const created = await getOrCreateUserWithAccount({ clerkId, email, name }, invitedAccountId)
    const user = await prisma.user.update({
      where: { id: created.id },
      data: { name, email },
    })

    // Create default settings if they don't exist
    await prisma.settings.upsert({
      where: { userId: user.id },
      update: {
        lastLogin: new Date(),
      },
      create: {
        userId: user.id,
        theme: 'light',
        sidebarState: 'open',
      },
    })

    return NextResponse.json({
      message: 'User synced successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    console.error('Error syncing user:', error)
    return NextResponse.json(
      { error: 'Failed to sync user' },
      { status: 500 }
    )
  }
}

/**
 * Get current user (also syncs if needed)
 */
export async function GET() {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user exists in database
    let user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        settings: true,
      },
    })

    // If user doesn't exist, create them together with their Account (tenant).
    if (!user) {
      const clerkUser = await currentUser()

      if (!clerkUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const email = clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId
      )?.emailAddress

      if (!email) {
        return NextResponse.json({ error: 'No email found' }, { status: 400 })
      }

      const name = clerkUser.firstName
        ? `${clerkUser.firstName}${clerkUser.lastName ? ' ' + clerkUser.lastName : ''}`
        : email.split('@')[0]

      const invitedAccountId =
        typeof clerkUser.publicMetadata?.accountId === 'string'
          ? clerkUser.publicMetadata.accountId
          : undefined
      const created = await getOrCreateUserWithAccount({ clerkId, email, name }, invitedAccountId)
      await prisma.settings.upsert({
        where: { userId: created.id },
        update: {},
        create: { userId: created.id, theme: 'light', sidebarState: 'open' },
      })
      user = await prisma.user.findUnique({
        where: { id: created.id },
        include: { settings: true },
      })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error getting user:', error)
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    )
  }
}



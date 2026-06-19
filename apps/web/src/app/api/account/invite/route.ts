import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma, ACCOUNT_SEAT_LIMIT } from '@socioply/shared'
import { getOrCreateUser } from '@/lib/user'

// POST /api/account/invite { email } — invite a teammate to this account (cap 3)
export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const me = await getOrCreateUser(clerkId)
  if (!me.accountId) return NextResponse.json({ error: 'No account' }, { status: 500 })

  const body = await request.json().catch(() => ({}))
  const email = body?.email ? String(body.email).trim().toLowerCase() : ''
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
  }

  const client = await clerkClient()

  // Seat check: current members + pending invites for this account must be < limit.
  const [memberCount, inviteRes] = await Promise.all([
    prisma.user.count({ where: { accountId: me.accountId } }),
    client.invitations.getInvitationList({ status: 'pending' }),
  ])
  const invites = Array.isArray(inviteRes) ? inviteRes : inviteRes.data
  const pendingForAccount = invites.filter(
    (i) => (i.publicMetadata as { accountId?: string } | null)?.accountId === me.accountId,
  )
  if (memberCount + pendingForAccount.length >= ACCOUNT_SEAT_LIMIT) {
    return NextResponse.json(
      { error: `Your account is limited to ${ACCOUNT_SEAT_LIMIT} users.` },
      { status: 409 },
    )
  }

  // Already a member?
  const existingMember = await prisma.user.findFirst({
    where: { email, accountId: me.accountId },
    select: { id: true },
  })
  if (existingMember) {
    return NextResponse.json({ error: 'That person is already on your team.' }, { status: 409 })
  }
  if (pendingForAccount.some((i) => i.emailAddress.toLowerCase() === email)) {
    return NextResponse.json({ error: 'That email already has a pending invite.' }, { status: 409 })
  }

  const origin = new URL(request.url).origin
  try {
    await client.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: { accountId: me.accountId },
      redirectUrl: `${origin}/sign-up`,
      ignoreExisting: true,
    })
  } catch (err) {
    console.error('[account/invite] createInvitation failed:', err)
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 502 })
  }

  return NextResponse.json({ ok: true, email })
}

// DELETE /api/account/invite?email=... — revoke a pending invite for this account
export async function DELETE(request: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const me = await getOrCreateUser(clerkId)
  if (!me.accountId) return NextResponse.json({ error: 'No account' }, { status: 500 })

  const email = (new URL(request.url).searchParams.get('email') ?? '').trim().toLowerCase()
  if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 })

  const client = await clerkClient()
  const res = await client.invitations.getInvitationList({ status: 'pending' })
  const invites = Array.isArray(res) ? res : res.data
  const match = invites.find(
    (i) =>
      i.emailAddress.toLowerCase() === email &&
      (i.publicMetadata as { accountId?: string } | null)?.accountId === me.accountId,
  )
  if (!match) return NextResponse.json({ error: 'No matching pending invite.' }, { status: 404 })

  try {
    await client.invitations.revokeInvitation(match.id)
  } catch (err) {
    console.error('[account/invite] revoke failed:', err)
    return NextResponse.json({ error: 'Failed to revoke invitation' }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}

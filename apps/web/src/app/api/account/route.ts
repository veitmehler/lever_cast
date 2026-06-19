import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma, ACCOUNT_SEAT_LIMIT } from '@socioply/shared'
import { getOrCreateUser } from '@/lib/user'

/** Pending Clerk invitations targeting this account (by publicMetadata.accountId). */
async function pendingInvitesFor(accountId: string): Promise<string[]> {
  try {
    const client = await clerkClient()
    const res = await client.invitations.getInvitationList({ status: 'pending' })
    const list = Array.isArray(res) ? res : res.data
    return list
      .filter((i) => (i.publicMetadata as { accountId?: string } | null)?.accountId === accountId)
      .map((i) => i.emailAddress)
  } catch {
    return []
  }
}

// GET /api/account — team overview
export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const me = await getOrCreateUser(clerkId)
  if (!me.accountId) return NextResponse.json({ error: 'No account' }, { status: 500 })

  const [account, members, pending] = await Promise.all([
    prisma.account.findUnique({ where: { id: me.accountId } }),
    prisma.user.findMany({
      where: { accountId: me.accountId },
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: 'asc' },
    }),
    pendingInvitesFor(me.accountId),
  ])

  return NextResponse.json({
    account: { id: me.accountId, name: account?.name ?? null, assistantEmail: account?.assistantEmail ?? null },
    members: members.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      isOwner: m.id === account?.ownerUserId,
      isSelf: m.id === me.id,
    })),
    pendingInvites: pending,
    seatsUsed: members.length + pending.length,
    seatLimit: ACCOUNT_SEAT_LIMIT,
  })
}

// PATCH /api/account — update account name / default assistant email
export async function PATCH(request: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const me = await getOrCreateUser(clerkId)
  if (!me.accountId) return NextResponse.json({ error: 'No account' }, { status: 500 })

  const body = await request.json()
  const data: { name?: string | null; assistantEmail?: string | null } = {}
  if ('name' in body) data.name = body.name ? String(body.name).trim() : null
  if ('assistantEmail' in body) {
    const e = body.assistantEmail ? String(body.assistantEmail).trim() : null
    if (e && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) {
      return NextResponse.json({ error: 'Invalid assistant email' }, { status: 400 })
    }
    data.assistantEmail = e
  }

  const account = await prisma.account.update({ where: { id: me.accountId }, data })
  return NextResponse.json({ name: account.name, assistantEmail: account.assistantEmail })
}

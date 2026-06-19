import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@socioply/shared'
import { getOrCreateUser } from '@/lib/user'

type Ctx = { params: Promise<{ userId: string }> }

// DELETE /api/account/members/:userId — remove a teammate from this account.
// The removed user is moved to a fresh solo account (keeps the content they
// created). The account owner cannot be removed.
export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const me = await getOrCreateUser(clerkId)
  if (!me.accountId) return NextResponse.json({ error: 'No account' }, { status: 500 })

  const { userId: targetId } = await params
  const account = await prisma.account.findUnique({
    where: { id: me.accountId },
    select: { ownerUserId: true },
  })
  if (account?.ownerUserId === targetId) {
    return NextResponse.json({ error: 'The account owner cannot be removed.' }, { status: 400 })
  }

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, name: true, accountId: true },
  })
  if (!target || target.accountId !== me.accountId) {
    return NextResponse.json({ error: 'Member not found on your team.' }, { status: 404 })
  }

  const solo = await prisma.account.create({ data: { name: target.name, ownerUserId: target.id } })
  await prisma.user.update({ where: { id: target.id }, data: { accountId: solo.id } })

  return NextResponse.json({ ok: true })
}

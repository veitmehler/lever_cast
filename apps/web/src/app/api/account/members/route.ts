import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma, ACCOUNT_SEAT_LIMIT } from '@socioply/shared'
import { getOrCreateUser } from '@/lib/user'
import { sendTeamSetupEmail } from '@/lib/email'

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

// POST /api/account/members { email, name? } — add a teammate to the roster.
// No invitation: when they sign up / sign in with this email they join the account.
export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const me = await getOrCreateUser(clerkId)
  if (!me.accountId) return NextResponse.json({ error: 'No account' }, { status: 500 })

  const body = await request.json().catch(() => ({}))
  const email = body?.email ? String(body.email).trim().toLowerCase() : ''
  const name = body?.name ? String(body.name).trim() : null
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
  if (email === me.email.toLowerCase()) return NextResponse.json({ error: "That's your own email." }, { status: 400 })

  const rosterCount = await prisma.accountMember.count({ where: { accountId: me.accountId } })
  if (rosterCount >= ACCOUNT_SEAT_LIMIT - 1) {
    return NextResponse.json({ error: `Your account is limited to ${ACCOUNT_SEAT_LIMIT} users.` }, { status: 409 })
  }

  const existingRoster = await prisma.accountMember.findUnique({ where: { email } })
  if (existingRoster) {
    return NextResponse.json(
      { error: existingRoster.accountId === me.accountId ? 'Already on your team.' : 'That email is already on another team.' },
      { status: 409 },
    )
  }

  const member = await prisma.accountMember.create({ data: { accountId: me.accountId, email, name } })

  // If they already have a user, move them into this account right away.
  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true, accountId: true } })
  if (existingUser && existingUser.accountId !== me.accountId) {
    const old = existingUser.accountId
    await prisma.user.update({ where: { id: existingUser.id }, data: { accountId: me.accountId } })
    if (old) {
      const remaining = await prisma.user.count({ where: { accountId: old } })
      if (remaining === 0) await prisma.account.delete({ where: { id: old } }).catch(() => {})
    }
  } else if (!existingUser) {
    // Brand-new teammate: best-effort email with a pre-filled sign-up link.
    const origin = new URL(request.url).origin
    const signUpUrl = `${origin}/sign-up?email=${encodeURIComponent(email)}`
    await sendTeamSetupEmail({ to: email, name, inviterName: me.name, signUpUrl }).catch(() => {})
  }

  return NextResponse.json({ member })
}

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@socioply/shared'

// GET /api/specializations — enabled specializations for the Settings checkboxes
export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const specializations = await prisma.specialization.findMany({
    where: { enabled: true },
    orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    select: { key: true, label: true },
  })
  return NextResponse.json({ specializations })
}

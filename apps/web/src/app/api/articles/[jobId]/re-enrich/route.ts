import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { getToken } = await auth()
  const token = await getToken()
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { jobId } = await params
  const res = await fetch(`${API_URL}/api/articles/${jobId}/re-enrich`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

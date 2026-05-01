import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
type Ctx = { params: Promise<{ jobId: string; target: string }> }

export async function POST(request: NextRequest, { params }: Ctx) {
  const { getToken } = await auth()
  const token = await getToken()
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { jobId, target } = await params
  const body = await request.json().catch(() => ({}))
  const res = await fetch(`${API_URL}/api/articles/${jobId}/output/${target}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

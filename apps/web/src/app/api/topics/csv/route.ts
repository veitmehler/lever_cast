import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function POST(request: NextRequest) {
  const { getToken } = await auth()
  const token = await getToken()
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Forward multipart body unchanged
  const contentType = request.headers.get('content-type') ?? ''
  const body = await request.arrayBuffer()

  const res = await fetch(`${API_URL}/api/topics/csv`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'content-type': contentType,
    },
    body,
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

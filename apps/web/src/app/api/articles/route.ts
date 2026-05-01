import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function GET(request: NextRequest) {
  const { getToken } = await auth()
  const token = await getToken()
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const qs = searchParams.toString()
  const url = `${API_URL}/api/articles${qs ? `?${qs}` : ''}`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

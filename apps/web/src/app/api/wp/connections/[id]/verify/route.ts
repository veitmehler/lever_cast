import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
type Ctx = { params: Promise<{ id: string }> }

export async function POST(_request: NextRequest, { params }: Ctx) {
  const { getToken } = await auth()
  const token = await getToken()
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const res = await fetch(`${API_URL}/api/wp/connections/${id}/verify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

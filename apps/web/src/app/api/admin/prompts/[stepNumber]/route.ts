import { NextRequest } from 'next/server'
import { proxyToApi } from '@/lib/api-proxy'

type Ctx = { params: Promise<{ stepNumber: string }> }

export async function GET(request: NextRequest, { params }: Ctx) {
  const { stepNumber } = await params
  return proxyToApi(request, `/api/admin/prompts/${stepNumber}`, { method: 'GET' })
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  const { stepNumber } = await params
  return proxyToApi(request, `/api/admin/prompts/${stepNumber}`, { method: 'PUT' })
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const { stepNumber } = await params
  return proxyToApi(request, `/api/admin/prompts/${stepNumber}`, { method: 'DELETE' })
}

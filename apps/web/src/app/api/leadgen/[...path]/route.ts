import type { NextRequest } from 'next/server'
import { proxyToApi } from '@/lib/api-proxy'

// Catch-all proxy for the Lead Magnets API (leadgen plan Phase 5).
function path(params: { path: string[] }): string {
  return `/api/leadgen/${params.path.join('/')}`
}

export async function GET(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyToApi(request, path(await ctx.params), { method: 'GET' })
}
export async function POST(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyToApi(request, path(await ctx.params), { method: 'POST' })
}
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyToApi(request, path(await ctx.params), { method: 'PATCH' })
}

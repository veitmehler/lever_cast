import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'

// Edge Runtime: no 60-second Serverless Function cap, streams SSE indefinitely.
export const runtime = 'edge'

const DO_API_BASE = process.env.DO_API_BASE ?? 'https://svc.omniply.io'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  // Prefer a client-minted token passed as a query param. EventSource cannot
  // set request headers, so the browser appends `?token=<fresh JWT>` obtained
  // from `useAuth().getToken()`. This keeps the SSE connection authenticated
  // even when Clerk's cookie refresh has stalled on a backgrounded tab.
  // Fall back to the cookie-derived session token when no param is supplied.
  let token = request.nextUrl.searchParams.get('token')
  if (!token) {
    const { getToken } = await auth()
    token = await getToken()
  }
  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { jobId } = await params

  // Proxy the SSE stream from the Fastify backend.
  // Cannot use proxyToApi here because it buffers the response with arrayBuffer().
  const upstream = await fetch(`${DO_API_BASE}/api/articles/${jobId}/events`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'text/event-stream',
    },
  })

  if (!upstream.ok || !upstream.body) {
    return new Response('Failed to connect to event stream', { status: 502 })
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

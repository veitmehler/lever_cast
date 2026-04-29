import { NextResponse } from 'next/server'

/**
 * This endpoint is retired. Analytics syncing is now handled by the
 * pg-boss worker on the DigitalOcean droplet (apps/api/src/handlers/analytics.ts).
 *
 * The worker runs the `analytics-sync` queue daily at 02:00 UTC via pg-boss schedule.
 * Vercel Cron entries for this path have been removed from vercel.json.
 */
export async function GET() {
  return NextResponse.json({
    status: 'retired',
    message: 'Analytics syncing is now handled by the DO worker (pg-boss).',
  })
}

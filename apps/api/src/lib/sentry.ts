import * as Sentry from '@sentry/node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'

export function initSentry(serviceName: 'api' | 'worker') {
  if (!process.env.SENTRY_DSN) return

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    // NODE_ENV is 'production' on the staging droplet too (production builds),
    // so the deploy env must be named explicitly or staging errors page as prod.
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'production',
    release: process.env.GIT_SHA ?? undefined,
    tracesSampleRate: 0.1,
    profilesSampleRate: 0.1,
    integrations: [nodeProfilingIntegration()],
    initialScope: { tags: { service: serviceName } },
  })
}

export { Sentry }

import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { Sentry } from './sentry'

/**
 * Centralized Fastify error handler.
 *
 * Logs full detail server-side (pino + Sentry) but only returns a generic
 * message to clients for unhandled 5xx errors, so internal exception text (stack
 * traces, query fragments, upstream errors) never leaks to callers. Intentional
 * 4xx errors — validation failures, rate-limit responses — keep their message so
 * clients still get actionable feedback.
 */
export function handleError(
  err: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  request.log.error({ err }, 'unhandled error')
  Sentry.captureException(err)

  const status = err.statusCode ?? 500
  const message = status >= 500 ? 'Internal Server Error' : err.message ?? 'Error'

  reply.status(status).send({ error: message })
}

import 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    /**
     * Clerk user id, populated best-effort by the populateClerkId onRequest hook
     * when a valid Bearer token is present. Used for per-user rate limiting.
     * Not a substitute for requireAuth() in handlers.
     */
    clerkId?: string
  }
}

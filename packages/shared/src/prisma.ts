import { PrismaClient } from '@prisma/client'

// One client definition for both runtimes:
// - api/worker (long-running process): the module loads once, so this is
//   effectively a singleton.
// - web (Next.js): the globalThis cache prevents dev hot-reload from stacking
//   clients; in production each serverless invocation gets a fresh client.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

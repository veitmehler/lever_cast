import { PrismaClient } from '@prisma/client'

// In the long-running worker/API process, a module-level singleton is correct.
// No globalThis tricks needed (this is not a Next.js hot-reload environment).
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error', 'warn'],
})

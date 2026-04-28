import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// TEMP DEBUG — remove after diagnosing prod connection issue
if (!globalForPrisma.prisma) {
  const url = process.env.DATABASE_URL ?? ''
  const masked = url
    .replace(/\/\/[^:]+:[^@]+@/, '//***:***@') // mask user:pass
  console.log('[prisma-init] DATABASE_URL masked:', masked)
  console.log('[prisma-init] DATABASE_URL length:', url.length)
  console.log('[prisma-init] contains %2F:', url.includes('%2F'))
  console.log('[prisma-init] contains raw / in pass region:', /\/\/[^:]+:[^@/]*\/[^@]*@/.test(url))
  console.log('[prisma-init] all postgres-like env keys:', Object.keys(process.env).filter(k =>
    /POSTGRES|DATABASE|PRISMA|SUPABASE/i.test(k)
  ))
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

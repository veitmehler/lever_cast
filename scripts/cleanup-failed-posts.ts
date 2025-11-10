import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Finding failed posts with scheduledAt in the past...')
  
  const now = new Date()
  
  // Find all failed posts that were scheduled in the past
  const failedPosts = await prisma.post.findMany({
    where: {
      status: 'failed',
      scheduledAt: {
        lte: now,
      },
    },
    select: {
      id: true,
      platform: true,
      scheduledAt: true,
      errorMsg: true,
      draftId: true,
    },
  })

  console.log(`Found ${failedPosts.length} failed posts:`)
  failedPosts.forEach(post => {
    console.log(`  - ${post.id}: ${post.platform}, scheduledAt=${post.scheduledAt?.toISOString()}, draftId=${post.draftId || 'null'}, errorMsg=${post.errorMsg?.substring(0, 50) || 'null'}`)
  })

  if (failedPosts.length === 0) {
    console.log('No failed posts found. Exiting.')
    return
  }

  console.log('\n⚠️  WARNING: This will permanently delete all failed posts.')
  console.log('These are posts that failed to publish and are no longer needed.')
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...')
  
  await new Promise(resolve => setTimeout(resolve, 5000))

  console.log('\nDeleting failed posts...')
  
  // Delete failed posts
  const result = await prisma.post.deleteMany({
    where: {
      status: 'failed',
      scheduledAt: {
        lte: now,
      },
    },
  })

  console.log(`✅ Deleted ${result.count} failed post(s)`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


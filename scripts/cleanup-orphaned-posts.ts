import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Finding orphaned posts (posts with draftId: null)...')
  
  // Find all posts that have no draftId (orphaned posts)
  const orphanedPosts = await prisma.post.findMany({
    where: {
      draftId: null,
    },
    select: {
      id: true,
      platform: true,
      status: true,
      scheduledAt: true,
      publishedAt: true,
      createdAt: true,
    },
  })

  console.log(`Found ${orphanedPosts.length} orphaned posts:`)
  orphanedPosts.forEach(post => {
    console.log(`  - ${post.id}: ${post.platform}, status=${post.status}, scheduledAt=${post.scheduledAt?.toISOString() || 'null'}`)
  })

  if (orphanedPosts.length === 0) {
    console.log('No orphaned posts found. Exiting.')
    return
  }

  // Ask for confirmation
  console.log('\n⚠️  WARNING: This will permanently delete all orphaned posts.')
  console.log('These are posts that were left behind when drafts were deleted.')
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...')
  
  await new Promise(resolve => setTimeout(resolve, 5000))

  console.log('\nDeleting orphaned posts...')
  
  // Delete orphaned posts
  const result = await prisma.post.deleteMany({
    where: {
      draftId: null,
    },
  })

  console.log(`✅ Deleted ${result.count} orphaned post(s)`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


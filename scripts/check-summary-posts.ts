import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Check the specific parent post IDs mentioned in the logs
  const parentIds = [
    'cmht8z5ef001f9kr5463ol2hk',
    'cmht9e16g001v9kr51k6wp74d',
    'cmht9ioha002d9kr5drezw6s2',
    'cmhtbpdd300033qmf8kvhpxby',
    'cmht8q55000199kr5ue1vxhle', // The one that hit rate limit
  ]

  console.log('Checking status of parent summary posts...\n')

  for (const id of parentIds) {
    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        platform: true,
        status: true,
        threadOrder: true,
        parentPostId: true,
        scheduledAt: true,
        publishedAt: true,
        createdAt: true,
        content: true,
      },
    })

    if (post) {
      console.log(`Post ${id}:`)
      console.log(`  Platform: ${post.platform}`)
      console.log(`  Status: ${post.status}`)
      console.log(`  threadOrder: ${post.threadOrder}`)
      console.log(`  parentPostId: ${post.parentPostId}`)
      console.log(`  scheduledAt: ${post.scheduledAt?.toISOString() || 'null'}`)
      console.log(`  publishedAt: ${post.publishedAt?.toISOString() || 'null'}`)
      console.log(`  createdAt: ${post.createdAt.toISOString()}`)
      console.log(`  Content length: ${post.content?.length || 0} chars`)
      console.log(`  Is Summary: ${post.threadOrder === 0 && !post.parentPostId}`)
      console.log('')
    } else {
      console.log(`Post ${id}: NOT FOUND\n`)
    }
  }

  // Also check all scheduled posts with threadOrder 0
  const allSummaryPosts = await prisma.post.findMany({
    where: {
      threadOrder: 0,
      parentPostId: null,
      platform: 'twitter',
    },
    select: {
      id: true,
      status: true,
      scheduledAt: true,
      publishedAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  })

  console.log(`\nAll summary posts (threadOrder=0, parentPostId=null, platform=twitter): ${allSummaryPosts.length}`)
  allSummaryPosts.forEach(p => {
    console.log(`  ${p.id}: status=${p.status}, scheduledAt=${p.scheduledAt?.toISOString() || 'null'}, publishedAt=${p.publishedAt?.toISOString() || 'null'}`)
  })
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


/**
 * Add threadOrder column to posts table
 * This script adds the threadOrder field to track publishing order for Twitter threads
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Adding threadOrder column to posts table...')
  
  // Add the column using raw SQL since Prisma doesn't support adding nullable columns easily
  await prisma.$executeRaw`
    ALTER TABLE posts 
    ADD COLUMN IF NOT EXISTS "threadOrder" INTEGER;
  `
  
  console.log('✅ threadOrder column added successfully')
  
  // Create index for thread ordering
  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS "posts_draftId_threadOrder_idx" 
    ON posts("draftId", "threadOrder");
  `
  
  console.log('✅ Index created successfully')
  
  // Set threadOrder for existing posts
  // Summary posts (no parentPostId) get threadOrder = 0
  // Replies get threadOrder based on their creation order within the same draft
  console.log('Setting threadOrder for existing posts...')
  
  // Get all drafts that have posts
  const draftsWithPosts = await prisma.draft.findMany({
    where: {
      posts: {
        some: {},
      },
    },
    include: {
      posts: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  })
  
  for (const draft of draftsWithPosts) {
    const posts = draft.posts
    
    // Group by platform and parentPostId
    const twitterPosts = posts.filter(p => p.platform === 'twitter')
    
    if (twitterPosts.length > 0) {
      // Find summary posts (no parentPostId)
      const summaryPosts = twitterPosts.filter(p => !p.parentPostId)
      
      // Set threadOrder = 0 for summary posts
      for (const post of summaryPosts) {
        await prisma.post.update({
          where: { id: post.id },
          data: { threadOrder: 0 },
        })
      }
      
      // For replies, group by parentPostId and set threadOrder based on creation order
      const replies = twitterPosts.filter(p => p.parentPostId)
      const repliesByParent = new Map<string, typeof replies>()
      
      for (const reply of replies) {
        if (!reply.parentPostId) continue
        if (!repliesByParent.has(reply.parentPostId)) {
          repliesByParent.set(reply.parentPostId, [])
        }
        repliesByParent.get(reply.parentPostId)!.push(reply)
      }
      
      // Set threadOrder for replies (1, 2, 3, ...)
      for (const [parentId, parentReplies] of repliesByParent.entries()) {
        const sortedReplies = parentReplies.sort((a, b) => 
          a.createdAt.getTime() - b.createdAt.getTime()
        )
        
        for (let i = 0; i < sortedReplies.length; i++) {
          await prisma.post.update({
            where: { id: sortedReplies[i].id },
            data: { threadOrder: i + 1 },
          })
        }
      }
    }
  }
  
  console.log('✅ threadOrder set for existing posts')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


/**
 * Fix scheduled Twitter thread posts - set threadOrder for summary posts
 * This script finds scheduled Twitter posts that are missing threadOrder=0
 * and sets it correctly
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Finding scheduled Twitter posts missing threadOrder...')
  
  // Find all scheduled Twitter posts
  const scheduledTwitterPosts = await prisma.post.findMany({
    where: {
      platform: 'twitter',
      status: 'scheduled',
      scheduledAt: {
        not: null,
      },
    },
    select: {
      id: true,
      draftId: true,
      parentPostId: true,
      threadOrder: true,
      scheduledAt: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })
  
  console.log(`Found ${scheduledTwitterPosts.length} scheduled Twitter posts`)
  
  // Group by draftId to find threads
  const postsByDraft = new Map<string, typeof scheduledTwitterPosts>()
  
  for (const post of scheduledTwitterPosts) {
    if (!post.draftId) continue
    if (!postsByDraft.has(post.draftId)) {
      postsByDraft.set(post.draftId, [])
    }
    postsByDraft.get(post.draftId)!.push(post)
  }
  
  let fixed = 0
  
  // For each draft, find summary posts (no parentPostId) and set threadOrder=0
  for (const [draftId, posts] of postsByDraft.entries()) {
    const summaryPosts = posts.filter(p => !p.parentPostId)
    const replies = posts.filter(p => p.parentPostId)
    
    console.log(`\nDraft ${draftId}:`)
    console.log(`  Summary posts: ${summaryPosts.length}`)
    console.log(`  Replies: ${replies.length}`)
    
    // Fix summary posts - set threadOrder=0 if missing
    for (const post of summaryPosts) {
      console.log(`  Summary post ${post.id}: threadOrder=${post.threadOrder}, scheduledAt=${post.scheduledAt?.toISOString()}, status=scheduled`)
      if (post.threadOrder !== 0) {
        console.log(`  Fixing summary post ${post.id}: threadOrder ${post.threadOrder} -> 0`)
        await prisma.post.update({
          where: { id: post.id },
          data: { threadOrder: 0 },
        })
        fixed++
      }
    }
    
    // Fix replies - set threadOrder based on creation order
    if (replies.length > 0) {
      // Group replies by parentPostId
      const repliesByParent = new Map<string, typeof replies>()
      for (const reply of replies) {
        if (!reply.parentPostId) continue
        if (!repliesByParent.has(reply.parentPostId)) {
          repliesByParent.set(reply.parentPostId, [])
        }
        repliesByParent.get(reply.parentPostId)!.push(reply)
      }
      
      // Set threadOrder for each group of replies
      for (const [parentId, parentReplies] of repliesByParent.entries()) {
        const sortedReplies = parentReplies.sort((a, b) => 
          a.createdAt.getTime() - b.createdAt.getTime()
        )
        
        for (let i = 0; i < sortedReplies.length; i++) {
          const expectedOrder = i + 1
          if (sortedReplies[i].threadOrder !== expectedOrder) {
            console.log(`  Fixing reply ${sortedReplies[i].id}: threadOrder ${sortedReplies[i].threadOrder} -> ${expectedOrder}`)
            await prisma.post.update({
              where: { id: sortedReplies[i].id },
              data: { threadOrder: expectedOrder },
            })
            fixed++
          }
        }
      }
    }
  }
  
  console.log(`\n✅ Fixed ${fixed} posts`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


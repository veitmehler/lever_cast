/**
 * Script to add tweetId column to posts table
 * Run with: node scripts/add-tweet-id-column.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addTweetIdColumn() {
  try {
    console.log('Adding tweetId column to posts table...')
    
    // Add the tweetId column
    await prisma.$executeRaw`
      ALTER TABLE posts 
      ADD COLUMN IF NOT EXISTS "tweetId" TEXT;
    `
    
    console.log('✓ Added tweetId column')
    
    // Add index for tweetId
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "posts_tweetId_idx" ON posts("tweetId");
    `
    
    console.log('✓ Added index on tweetId')
    
    // Extract tweet IDs from existing postUrl values and populate tweetId
    console.log('Extracting tweet IDs from existing postUrl values...')
    const postsWithTwitterUrls = await prisma.$queryRaw`
      SELECT id, "postUrl"
      FROM posts
      WHERE "postUrl" LIKE '%twitter.com%status%' 
        OR "postUrl" LIKE '%x.com%status%'
        AND "tweetId" IS NULL
    `
    
    let updated = 0
    for (const post of postsWithTwitterUrls) {
      const tweetIdMatch = post.postUrl?.match(/\/status\/(\d+)/)
      if (tweetIdMatch && tweetIdMatch[1]) {
        await prisma.$executeRaw`
          UPDATE posts
          SET "tweetId" = ${tweetIdMatch[1]}
          WHERE id = ${post.id}
        `
        updated++
      }
    }
    
    console.log(`✓ Updated ${updated} existing posts with tweetId from postUrl`)
    console.log('✓ Migration complete!')
  } catch (error) {
    console.error('Error adding tweetId column:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

addTweetIdColumn()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })


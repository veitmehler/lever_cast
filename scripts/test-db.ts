/**
 * Database Connection Test Script
 * 
 * Run with: npx tsx scripts/test-db.ts
 * 
 * This script tests the Prisma database connection and displays basic stats.
 */

import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('🔌 Testing database connection...\n')
  
  try {
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connected successfully!')
    
    // Get database stats
    console.log('\n📊 Database Statistics:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    const userCount = await prisma.user.count()
    console.log(`👥 Users: ${userCount}`)
    
    const draftCount = await prisma.draft.count()
    console.log(`📝 Drafts: ${draftCount}`)
    
    const postCount = await prisma.post.count()
    console.log(`📮 Posts: ${postCount}`)
    
    const apiKeyCount = await prisma.apiKey.count()
    console.log(`🔑 API Keys: ${apiKeyCount}`)
    
    const settingsCount = await prisma.settings.count()
    console.log(`⚙️  Settings: ${settingsCount}`)
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    // Test a simple query
    const users = await prisma.user.findMany({
      take: 3,
      select: {
        id: true,
        clerkId: true,
        email: true,
        createdAt: true,
      },
    })
    
    if (users.length > 0) {
      console.log('📋 Recent Users:')
      users.forEach((user, i) => {
        console.log(`  ${i + 1}. ${user.email} (${user.clerkId})`)
      })
    } else {
      console.log('ℹ️  No users in database yet')
    }
    
    console.log('\n✨ Database test completed successfully!\n')
    
  } catch (error) {
    console.error('\n❌ Database connection failed!')
    console.error('Error:', error)
    console.error('\n💡 Troubleshooting:')
    console.error('  1. Check DATABASE_URL in .env file')
    console.error('  2. Verify Supabase project is running')
    console.error('  3. Ensure database password is correct')
    console.error('  4. Run: npx prisma migrate dev\n')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()


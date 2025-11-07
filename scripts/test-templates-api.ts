import { prisma } from '@/lib/prisma'

async function testTemplatesAPI() {
  console.log('🧪 Testing Templates API Setup...\n')
  
  try {
    await prisma.$connect()
    console.log('✅ Database connected')
    
    // Check if user exists
    console.log('\n👥 Checking for users...')
    const users = await prisma.user.findMany()
    console.log(`   Found ${users.length} user(s)`)
    
    if (users.length === 0) {
      console.log('\n⚠️  NO USERS FOUND!')
      console.log('   This is likely why the API is failing.')
      console.log('\n📋 Solution:')
      console.log('   1. Sign in to your app first')
      console.log('   2. Clerk will automatically create your user record')
      console.log('   3. Then templates will work\n')
    } else {
      users.forEach(user => {
        console.log(`   - ${user.email} (ID: ${user.id.substring(0, 8)}...)`)
      })
      
      // Check templates for each user
      console.log('\n📝 Checking templates...')
      for (const user of users) {
        const templates = await prisma.template.findMany({
          where: { userId: user.id }
        })
        console.log(`   ${user.email}: ${templates.length} template(s)`)
      }
    }
    
    // Check if template table is accessible
    console.log('\n🔍 Testing template queries...')
    const totalTemplates = await prisma.template.count()
    console.log(`   Total templates in database: ${totalTemplates}`)
    
    console.log('\n✅ Database queries work fine!')
    console.log('\nIf you\'re seeing "Failed to fetch templates", the issue is likely:')
    console.log('   1. User not logged in / authenticated')
    console.log('   2. User record doesn\'t exist in database yet')
    console.log('   3. API route not properly handling authentication\n')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testTemplatesAPI()



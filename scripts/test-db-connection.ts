// Test database connection from the app context
import { prisma } from '../src/lib/prisma'

async function testConnection() {
  try {
    console.log('Testing database connection...')
    
    // Try to query the database
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Database connection successful!')
    console.log('Result:', result)
    
    // Try to count users
    const userCount = await prisma.user.count()
    console.log(`✅ Found ${userCount} users in database`)
    
    await prisma.$disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ Database connection failed:')
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

testConnection()



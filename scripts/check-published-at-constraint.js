const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkPublishedAtConstraint() {
  console.log('🔍 Checking publishedAt column constraints...\n')

  try {
    const columnInfo = await prisma.$queryRaw`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'posts'
        AND column_name = 'publishedAt'
    `

    console.log('📋 publishedAt column info:')
    console.table(columnInfo)

    if (columnInfo.length > 0) {
      const info = columnInfo[0]
      if (info.is_nullable === 'NO') {
        console.log('\n❌ publishedAt is NOT NULL - this will cause issues with scheduled posts!')
        console.log('🔧 Need to make it nullable...')
        
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "posts" 
          ALTER COLUMN "publishedAt" DROP NOT NULL;
        `)
        
        console.log('✅ Fixed: publishedAt is now nullable')
      } else {
        console.log('\n✅ publishedAt is nullable - OK!')
      }
    }

  } catch (error) {
    console.error('❌ Error checking constraint:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkPublishedAtConstraint()


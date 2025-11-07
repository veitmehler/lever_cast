const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function removePublishedAtDefault() {
  console.log('🔧 Removing default value from publishedAt column...\n')

  try {
    // Remove default value from publishedAt
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "posts" 
      ALTER COLUMN "publishedAt" DROP DEFAULT;
    `)

    console.log('✅ Removed default value from publishedAt')

    // Verify the change
    const check = await prisma.$queryRaw`
      SELECT column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'posts'
        AND column_name = 'publishedAt'
    `

    console.log('Verified default:', check[0]?.column_default || 'NULL')
    console.log('\n🎉 publishedAt column is now properly configured!')

  } catch (error) {
    console.error('❌ Error removing default:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

removePublishedAtDefault()


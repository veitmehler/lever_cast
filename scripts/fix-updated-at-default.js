const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixUpdatedAtDefault() {
  console.log('🔧 Setting default value for updatedAt column...\n')

  try {
    // Set default value for updatedAt to CURRENT_TIMESTAMP
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "drafts" 
      ALTER COLUMN "updatedAt" 
      SET DEFAULT CURRENT_TIMESTAMP;
    `)

    console.log('✅ updatedAt default value set to CURRENT_TIMESTAMP')

    // Verify the change
    const check = await prisma.$queryRaw`
      SELECT column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'drafts'
        AND column_name = 'updatedAt'
    `

    console.log('Verified default:', check[0]?.column_default)
    console.log('\n🎉 updatedAt column is now properly configured!')

  } catch (error) {
    console.error('❌ Error fixing updatedAt:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

fixUpdatedAtDefault()


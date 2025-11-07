const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addPublishedAtColumn() {
  console.log('🚀 Ensuring drafts table has publishedAt column...\n')

  try {
    const columnCheck = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'drafts'
        AND column_name = 'publishedAt'
    `

    if (Array.isArray(columnCheck) && columnCheck.length > 0) {
      console.log('ℹ️  Column "publishedAt" already exists on drafts table. No action needed.')
      return
    }

    console.log('🛠️  Adding "publishedAt" column to drafts table...')
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "drafts"
      ADD COLUMN "publishedAt" TIMESTAMP(3)
    `)
    console.log('✅ Column added successfully')

  } catch (error) {
    console.error('❌ Failed to add publishedAt column:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }

  console.log('\n🎉 Drafts table schema is up to date!')
}

addPublishedAtColumn()



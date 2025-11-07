const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addSchedulingColumns() {
  console.log('🔧 Adding scheduling columns to posts table...\n')

  try {
    // Check if scheduledAt column exists
    const columnCheck = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'posts'
        AND column_name = 'scheduledAt'
    `

    if (columnCheck.length > 0) {
      console.log('✅ scheduledAt column already exists')
    } else {
      // Add scheduledAt column
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "posts" 
        ADD COLUMN "scheduledAt" TIMESTAMP;
      `)
      console.log('✅ Added scheduledAt column')
    }

    // Make publishedAt nullable if it isn't already
    const publishedAtCheck = await prisma.$queryRaw`
      SELECT is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'posts'
        AND column_name = 'publishedAt'
    `

    if (publishedAtCheck.length > 0 && publishedAtCheck[0].is_nullable === 'NO') {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "posts" 
        ALTER COLUMN "publishedAt" DROP NOT NULL;
      `)
      console.log('✅ Made publishedAt nullable')
    } else {
      console.log('✅ publishedAt is already nullable')
    }

    // Add index for calendar queries
    const indexCheck = await prisma.$queryRaw`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'posts'
        AND indexname = 'posts_userId_scheduledAt_status_idx'
    `

    if (indexCheck.length === 0) {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX "posts_userId_scheduledAt_status_idx" 
        ON "posts" ("userId", "scheduledAt", "status");
      `)
      console.log('✅ Created index for calendar queries')
    } else {
      console.log('✅ Index already exists')
    }

    console.log('\n🎉 Scheduling columns added successfully!')

  } catch (error) {
    console.error('❌ Error adding scheduling columns:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

addSchedulingColumns()


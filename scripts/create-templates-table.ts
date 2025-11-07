import { prisma } from '@/lib/prisma'

/**
 * This script creates the templates table using Prisma Client's raw SQL execution
 * This bypasses the SSL issues with Prisma CLI migration tools
 */

async function createTemplatesTable() {
  console.log('🚀 Creating templates table using Prisma Client...\n')
  
  try {
    // Connect to database
    await prisma.$connect()
    console.log('✅ Connected to database')
    
    // Create templates table
    console.log('\n📝 Creating templates table...')
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "templates" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "tone" TEXT NOT NULL,
          "description" TEXT NOT NULL,
          "linkedinTemplate" TEXT NOT NULL,
          "twitterTemplate" TEXT NOT NULL,
          "isDefault" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
      )
    `)
    console.log('✅ Templates table created')
    
    // Create index
    console.log('\n📝 Creating index...')
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "templates_userId_isDefault_idx" 
      ON "templates"("userId", "isDefault")
    `)
    console.log('✅ Index created')
    
    // Add foreign key
    console.log('\n📝 Adding foreign key constraint...')
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'templates_userId_fkey'
        ) THEN
          ALTER TABLE "templates" ADD CONSTRAINT "templates_userId_fkey" 
          FOREIGN KEY ("userId") REFERENCES "users"("id") 
          ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$
    `)
    console.log('✅ Foreign key constraint added')
    
    // Verify table was created
    console.log('\n🔍 Verifying table...')
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'templates'
    ` as any[]
    
    if (result.length > 0) {
      console.log('✅ Verification successful - templates table exists!')
    } else {
      console.log('⚠️  Table might not have been created')
    }
    
    console.log('\n🎉 SUCCESS! Templates table is ready.')
    console.log('\n📋 Next steps:')
    console.log('   1. Run: npx prisma generate')
    console.log('   2. Restart your dev server')
    console.log('   3. Navigate to /templates in your app\n')
    
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('ℹ️  Table already exists - skipping creation')
      console.log('\n📋 Next steps:')
      console.log('   1. Run: npx prisma generate')
      console.log('   2. Restart your dev server')
      console.log('   3. Navigate to /templates in your app\n')
    } else {
      console.error('❌ Error creating table:', error)
      process.exit(1)
    }
  } finally {
    await prisma.$disconnect()
  }
}

createTemplatesTable()



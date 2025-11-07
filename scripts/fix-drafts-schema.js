const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixDraftsSchema() {
  console.log('🔧 Fixing drafts table schema to match Prisma...\n')

  try {
    // Check if updatedAt has proper default/trigger
    const updatedAtCheck = await prisma.$queryRaw`
      SELECT column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'drafts'
        AND column_name = 'updatedAt'
    `

    console.log('Current updatedAt default:', updatedAtCheck[0]?.column_default)

    // Ensure updatedAt column has proper trigger for auto-update
    console.log('\n🛠️  Setting up updatedAt trigger...')
    
    // Drop trigger if exists
    await prisma.$executeRawUnsafe(`
      DROP TRIGGER IF EXISTS update_drafts_updated_at ON "drafts";
    `)

    // Create function if it doesn't exist
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `)

    // Create trigger
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER update_drafts_updated_at
      BEFORE UPDATE ON "drafts"
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `)

    console.log('✅ updatedAt trigger created')

    // Remove old columns that shouldn't exist
    console.log('\n🛠️  Cleaning up old columns...')
    
    // Check if contentAi exists and remove it
    const contentAiCheck = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'drafts'
        AND column_name = 'contentAi'
    `

    if (contentAiCheck.length > 0) {
      console.log('Removing old contentAi column...')
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "drafts" DROP COLUMN IF EXISTS "contentAi";
      `)
      console.log('✅ Removed contentAi column')
    }

    // Check if old platform column exists (singular) and remove it if platforms exists
    const platformCheck = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'drafts'
        AND column_name = 'platform'
    `

    if (platformCheck.length > 0) {
      console.log('Removing old platform column (keeping platforms)...')
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "drafts" DROP COLUMN IF EXISTS "platform";
      `)
      console.log('✅ Removed platform column')
    }

    console.log('\n🎉 Drafts table schema is now aligned with Prisma!')

  } catch (error) {
    console.error('❌ Error fixing schema:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

fixDraftsSchema()


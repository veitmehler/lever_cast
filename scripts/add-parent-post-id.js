const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Adding parentPostId column to posts table...')
  
  try {
    // Add the column using raw SQL
    await prisma.$executeRaw`
      ALTER TABLE posts 
      ADD COLUMN IF NOT EXISTS "parentPostId" TEXT;
    `
    
    console.log('✓ Added parentPostId column')
    
    // Add foreign key constraint
    await prisma.$executeRaw`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'posts_parentPostId_fkey'
        ) THEN
          ALTER TABLE posts 
          ADD CONSTRAINT posts_parentPostId_fkey 
          FOREIGN KEY ("parentPostId") 
          REFERENCES posts(id) 
          ON DELETE CASCADE;
        END IF;
      END $$;
    `
    
    console.log('✓ Added foreign key constraint')
    
    // Add index
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS posts_parentPostId_idx ON posts("parentPostId");
    `
    
    console.log('✓ Added index')
    
    console.log('Successfully added parentPostId column!')
  } catch (error) {
    console.error('Error adding parentPostId column:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


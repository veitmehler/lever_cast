const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function verifyDraftsSchema() {
  console.log('🔍 Checking drafts table schema...\n')

  try {
    // Get all columns from drafts table
    const columns = await prisma.$queryRaw`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'drafts'
      ORDER BY ordinal_position
    `

    console.log('📋 Current columns in drafts table:')
    console.table(columns)

    // Check for required columns from Prisma schema
    const requiredColumns = [
      'id',
      'userId',
      'title',
      'contentRaw',
      'linkedinContent',
      'twitterContent',
      'platforms',
      'templateId',
      'attachedImage',
      'status',
      'publishedAt',
      'createdAt',
      'updatedAt'
    ]

    const existingColumns = columns.map(c => c.column_name)
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col))

    if (missingColumns.length > 0) {
      console.log('\n❌ Missing columns:')
      missingColumns.forEach(col => console.log(`   - ${col}`))
    } else {
      console.log('\n✅ All required columns exist!')
    }

  } catch (error) {
    console.error('❌ Error checking schema:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyDraftsSchema()


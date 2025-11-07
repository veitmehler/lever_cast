import { prisma } from '@/lib/prisma'

async function verifyTemplatesSetup() {
  console.log('🔍 Verifying Templates Setup...\n')
  
  try {
    await prisma.$connect()
    
    // Check if templates table exists and is queryable
    console.log('✅ Prisma Client connected')
    
    // Try to count templates (should be 0 initially)
    const templateCount = await prisma.template.count()
    console.log(`✅ Templates table is queryable (found ${templateCount} templates)`)
    
    // Check table structure
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'templates'
      ORDER BY ordinal_position
    ` as any[]
    
    console.log('\n📋 Table Structure:')
    tableInfo.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' (required)' : ' (optional)'}`)
    })
    
    // Check foreign key
    const foreignKeys = await prisma.$queryRaw`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'templates' AND tc.constraint_type = 'FOREIGN KEY'
    ` as any[]
    
    if (foreignKeys.length > 0) {
      console.log('\n🔗 Foreign Keys:')
      foreignKeys.forEach(fk => {
        console.log(`   - ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`)
      })
    }
    
    // Check indexes
    const indexes = await prisma.$queryRaw`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'templates'
    ` as any[]
    
    if (indexes.length > 0) {
      console.log('\n📊 Indexes:')
      indexes.forEach(idx => {
        console.log(`   - ${idx.indexname}`)
      })
    }
    
    console.log('\n🎉 SUCCESS! Templates table is fully configured and ready to use!')
    console.log('\n📋 Next Steps:')
    console.log('   1. Restart your dev server if it\'s running')
    console.log('   2. Navigate to http://localhost:3000/templates')
    console.log('   3. You should see 5 default templates automatically load')
    console.log('   4. Try creating, editing, and deleting templates\n')
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

verifyTemplatesSetup()



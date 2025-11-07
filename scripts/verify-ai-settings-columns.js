/**
 * Script to verify and fix defaultProvider and defaultModel columns in settings table
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Checking settings table structure...')

  try {
    // Try to query the settings table to see if columns exist
    const testSettings = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'settings'
      AND column_name IN ('defaultProvider', 'defaultModel')
      ORDER BY column_name;
    `

    console.log('Current columns:', testSettings)

    // Check if columns exist
    const columns = testSettings
    const hasDefaultProvider = columns.some(c => c.column_name === 'defaultProvider')
    const hasDefaultModel = columns.some(c => c.column_name === 'defaultModel')

    if (!hasDefaultProvider || !hasDefaultModel) {
      console.log('Adding missing columns...')
      
      if (!hasDefaultProvider) {
        await prisma.$executeRaw`
          ALTER TABLE settings 
          ADD COLUMN IF NOT EXISTS "defaultProvider" TEXT;
        `
        console.log('✅ Added defaultProvider column')
      }

      if (!hasDefaultModel) {
        await prisma.$executeRaw`
          ALTER TABLE settings 
          ADD COLUMN IF NOT EXISTS "defaultModel" TEXT;
        `
        console.log('✅ Added defaultModel column')
      }
    } else {
      console.log('✅ Both columns already exist')
    }

    // Test inserting/updating settings
    console.log('\nTesting settings update...')
    const testUser = await prisma.user.findFirst()
    if (testUser) {
      const testSettings = await prisma.settings.upsert({
        where: { userId: testUser.id },
        create: {
          userId: testUser.id,
          theme: 'light',
          sidebarState: 'open',
          defaultProvider: 'openai',
          defaultModel: JSON.stringify({ openai: 'gpt-4o-mini' }),
        },
        update: {
          defaultProvider: 'openai',
          defaultModel: JSON.stringify({ openai: 'gpt-4o-mini' }),
        },
      })
      console.log('✅ Test settings update successful:', testSettings)
    } else {
      console.log('⚠️  No users found to test with')
    }

  } catch (error) {
    console.error('❌ Error:', error)
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


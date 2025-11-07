/**
 * Script to add defaultProvider and defaultModel columns to settings table
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Adding defaultProvider and defaultModel columns to settings table...')

  try {
    // Add columns using raw SQL
    await prisma.$executeRaw`
      ALTER TABLE settings 
      ADD COLUMN IF NOT EXISTS "defaultProvider" TEXT,
      ADD COLUMN IF NOT EXISTS "defaultModel" TEXT;
    `

    console.log('✅ Successfully added defaultProvider and defaultModel columns')
  } catch (error) {
    console.error('❌ Error adding columns:', error)
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


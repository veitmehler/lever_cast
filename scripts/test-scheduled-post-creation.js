const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testPostCreation() {
  console.log('🧪 Testing post creation with scheduledAt...\n')

  try {
    // First, get a user
    const user = await prisma.user.findFirst()
    if (!user) {
      console.log('❌ No users found in database')
      return
    }

    console.log('Found user:', user.id)

    // Try to create a scheduled post
    const testPost = await prisma.post.create({
      data: {
        userId: user.id,
        platform: 'twitter',
        content: 'Test scheduled post',
        status: 'scheduled',
        publishedAt: null,
        scheduledAt: new Date('2025-12-01T10:00:00.000Z'),
      },
    })

    console.log('✅ Successfully created scheduled post:', testPost.id)

    // Clean up
    await prisma.post.delete({
      where: { id: testPost.id },
    })
    console.log('✅ Test post deleted')

  } catch (error) {
    console.error('❌ Error creating test post:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      code: error.code,
    })
  } finally {
    await prisma.$disconnect()
  }
}

testPostCreation()


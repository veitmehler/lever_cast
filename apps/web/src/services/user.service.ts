import { prisma } from '@/lib/prisma'

export class UserService {
  static async createUser(data: {
    clerkId: string
    name?: string
    email: string
  }) {
    try {
      return await prisma.user.create({
        data
      })
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  static async getUserByClerkId(clerkId: string) {
    try {
      return await prisma.user.findUnique({
        where: { clerkId },
        include: {
          settings: true,
          apiKeys: true
        }
      })
    } catch (error) {
      console.error('Error fetching user by clerk ID:', error)
      throw error
    }
  }

  static async getUserById(id: string) {
    try {
      return await prisma.user.findUnique({
        where: { id },
        include: {
          settings: true,
          apiKeys: true,
          drafts: true,
          posts: true
        }
      })
    } catch (error) {
      console.error('Error fetching user by ID:', error)
      throw error
    }
  }

  static async updateUser(id: string, data: {
    name?: string
    email?: string
  }) {
    try {
      return await prisma.user.update({
        where: { id },
        data
      })
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }
}

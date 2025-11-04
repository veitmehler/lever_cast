import { prisma } from '@/lib/prisma'

export class DraftService {
  static async createDraft(data: {
    userId: string
    contentRaw: string
    contentAi?: string
    platform: string
  }) {
    try {
      return await prisma.draft.create({
        data
      })
    } catch (error) {
      console.error('Error creating draft:', error)
      throw error
    }
  }

  static async getUserDrafts(userId: string) {
    try {
      return await prisma.draft.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      console.error('Error fetching user drafts:', error)
      throw error
    }
  }

  static async updateDraft(id: string, data: {
    contentRaw?: string
    contentAi?: string
    platform?: string
    status?: string
  }) {
    try {
      return await prisma.draft.update({
        where: { id },
        data
      })
    } catch (error) {
      console.error('Error updating draft:', error)
      throw error
    }
  }

  static async deleteDraft(id: string) {
    try {
      return await prisma.draft.delete({
        where: { id }
      })
    } catch (error) {
      console.error('Error deleting draft:', error)
      throw error
    }
  }
}

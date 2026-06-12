import { prisma } from '@socioply/shared'

export interface LoadedPrompt {
  systemPrompt: string | null
  userPrompt: string
  defaultProvider: string
  defaultModel: string
}

export async function loadPromptTemplate(stepNumber: number): Promise<LoadedPrompt | null> {
  const t = await prisma.promptTemplate.findUnique({
    where: { stepNumber },
    select: {
      systemPrompt: true,
      userPrompt: true,
      defaultProvider: true,
      defaultModel: true,
      isActive: true,
    },
  })
  if (!t || !t.isActive) return null
  return {
    systemPrompt: t.systemPrompt,
    userPrompt: t.userPrompt,
    defaultProvider: t.defaultProvider,
    defaultModel: t.defaultModel,
  }
}

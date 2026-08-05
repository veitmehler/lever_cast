import { resolvePromptByStep, type ResolveOpts } from '../../lib/prompt-resolver'

export interface LoadedPrompt {
  systemPrompt: string | null
  userPrompt: string
  defaultProvider: string
  defaultModel: string
}

/**
 * Load a prompt by stepNumber, vertical-aware (V0): pass the generating
 * user's id (or an explicit vertical) so vertical override rows apply;
 * without context this resolves the 'default' set — pre-vertical behavior.
 */
export async function loadPromptTemplate(stepNumber: number, opts?: ResolveOpts): Promise<LoadedPrompt | null> {
  const t = await resolvePromptByStep(stepNumber, opts)
  if (!t || !t.isActive) return null
  return {
    systemPrompt: t.systemPrompt,
    userPrompt: t.userPrompt,
    defaultProvider: t.defaultProvider,
    defaultModel: t.defaultModel,
  }
}

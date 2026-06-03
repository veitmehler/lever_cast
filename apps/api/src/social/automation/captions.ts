import type { ArticleContentContext } from './content'
import { resolveSlotContent } from './content'

export const FEED_PLATFORMS = [
  'linkedin',
  'twitter',
  'facebook',
  'instagram',
  'threads',
  'telegram',
] as const

export const STORY_PLATFORMS = ['facebook', 'instagram'] as const

export const PLATFORM_CHAR_LIMITS: Record<string, number> = {
  twitter: 280,
  threads: 500,
  instagram: 2200,
  facebook: 63206,
  linkedin: 3000,
  telegram: 4096,
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).trim()}…`
}

export function buildPlatformCaption(
  platform: string,
  ctx: ArticleContentContext,
  slotKey: string,
): string {
  const limit = PLATFORM_CHAR_LIMITS[platform] ?? 2000
  const slot = resolveSlotContent(slotKey, ctx)
  const sectionTitle = slot.title ?? ctx.title
  const firstSentence = slot.text.split(/[.!?]/)[0]?.trim() ?? ctx.title

  const hooks: Record<string, string> = {
    F1: ctx.introText,
    F2: `Key takeaways from "${ctx.title}"`,
    F3: firstSentence,
    F4: sectionTitle,
    F5: sectionTitle,
    F6: sectionTitle,
    S1: ctx.introText,
    S2: `Watch: ${ctx.title}`,
    S3: firstSentence,
    S4: `New carousel: ${sectionTitle}`,
    S5: firstSentence,
    S6: `New video: ${sectionTitle}`,
  }

  const base = hooks[slotKey] ?? (slot.text.slice(0, 200) || ctx.title)
  const withTitle = platform === 'twitter' || platform === 'threads'
    ? base
    : `${base}\n\n${ctx.title}`

  return truncate(withTitle.trim(), limit)
}

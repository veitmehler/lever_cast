import type { ArticleContentContext } from './content'

export const FEED_PLATFORMS = [
  'linkedin',
  'twitter',
  'facebook',
  'instagram',
  'threads',
  'telegram',
] as const

export const STORY_PLATFORMS = ['facebook', 'instagram'] as const

const PLATFORM_CHAR_LIMITS: Record<string, number> = {
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
  const hooks: Record<string, string> = {
    F1: ctx.introText,
    F2: `Key takeaways from "${ctx.title}"`,
    F3: ctx.keyTakeawaysText.split(/[.!?]/)[0] ?? ctx.title,
    F4: ctx.h2Title,
    F5: ctx.h2Title,
    F6: ctx.h2Title,
    S1: ctx.introText,
    S2: `Watch: ${ctx.title}`,
    S3: ctx.keyTakeawaysText.split(/[.!?]/)[0] ?? ctx.title,
    S4: `New carousel: ${ctx.h2Title}`,
    S5: ctx.keyTakeawaysText.split(/[.!?]/)[0] ?? ctx.title,
    S6: `New video: ${ctx.h2Title}`,
  }

  const base = hooks[slotKey] ?? ctx.title
  const withTitle = platform === 'twitter' || platform === 'threads'
    ? base
    : `${base}\n\n${ctx.title}`

  return truncate(withTitle.trim(), limit)
}

/**
 * Brand + vertical config (omniply-rename plan). One Vercel project per
 * vertical, each with its own NEXT_PUBLIC_VERTICAL — the repo stays
 * vertical-agnostic; new vertical-specific strings belong HERE, not inline.
 */
export const BRAND_NAME = 'Omniply'
export const VERTICAL = process.env.NEXT_PUBLIC_VERTICAL ?? 'chiro'

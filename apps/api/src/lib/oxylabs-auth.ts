/**
 * Oxylabs credential resolution.
 *
 * Two credential pairs, both admin-managed (SystemApiKey rows, encrypted) with an
 * env fallback chain so existing deployments keep working:
 *   - SERP API   (oxylabs_serp_username  / oxylabs_serp_password)  → realtime.oxylabs.io
 *   - Residential proxy (oxylabs_proxy_username / oxylabs_proxy_password) → pr.oxylabs.io
 *
 * Resolution per value: SystemApiKey DB row → its specific env var → the legacy
 * shared OXYLABS_USERNAME / OXYLABS_PASSWORD env (so a single-cred setup still
 * powers both until split creds are entered in the admin panel).
 */
import { getSystemApiKey } from './system-keys'

export interface OxylabsCreds {
  username: string
  password: string
}

const DEFAULT_PROXY_HOST = 'pr.oxylabs.io:7777'

async function resolve(specificKey: string, legacyEnv: string): Promise<string | null> {
  // getSystemApiKey checks the provider's specific env var, then the DB row.
  const fromKeyStore = await getSystemApiKey(specificKey)
  if (fromKeyStore) return fromKeyStore
  return process.env[legacyEnv] || null
}

export async function getOxylabsSerpAuth(): Promise<OxylabsCreds | null> {
  const username = await resolve('oxylabs_serp_username', 'OXYLABS_USERNAME')
  const password = await resolve('oxylabs_serp_password', 'OXYLABS_PASSWORD')
  return username && password ? { username, password } : null
}

export async function getOxylabsProxyAuth(): Promise<OxylabsCreds | null> {
  const username = await resolve('oxylabs_proxy_username', 'OXYLABS_USERNAME')
  const password = await resolve('oxylabs_proxy_password', 'OXYLABS_PASSWORD')
  return username && password ? { username, password } : null
}

export function basicAuthHeader(creds: OxylabsCreds): string {
  return `Basic ${Buffer.from(`${creds.username}:${creds.password}`).toString('base64')}`
}

/** Build the residential-proxy URL (host overridable via OXYLABS_PROXY_HOST). */
export function buildProxyUrl(creds: OxylabsCreds): string {
  const host = process.env.OXYLABS_PROXY_HOST || DEFAULT_PROXY_HOST
  return `http://${encodeURIComponent(creds.username)}:${encodeURIComponent(creds.password)}@${host}`
}

/**
 * The proxy host alone, no embedded credentials — for Puppeteer's `--proxy-server`
 * launch arg, which (unlike undici's ProxyAgent) ignores credentials embedded in
 * the URL. Pair with `page.authenticate({ username, password })` instead.
 */
export function resolveProxyHost(): string {
  return process.env.OXYLABS_PROXY_HOST || DEFAULT_PROXY_HOST
}

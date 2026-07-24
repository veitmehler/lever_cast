/**
 * Marketplace-app OAuth (auto-provisioning).
 *
 * The agency's one-time install grant gives us an agency access/refresh token
 * (GhlAppToken). From it we mint per-location access tokens on demand — which
 * replaces per-clinic Private Integration keys entirely. Endpoint shapes are
 * per GHL marketplace docs; every call is defensive and logged because this
 * surface is empirically verified on first real use.
 */
import { prisma, encrypt, decrypt } from '@omniply/shared'
import { logger } from '../logger'

const TOKEN_URL = 'https://services.leadconnectorhq.com/oauth/token'
const LOCATION_TOKEN_URL = 'https://services.leadconnectorhq.com/oauth/locationToken'
const INSTALLED_LOCATIONS_URL = 'https://services.leadconnectorhq.com/oauth/installedLocations'
const VERSION = '2021-07-28'

function clientId(): string {
  return process.env.GHL_APP_CLIENT_ID ?? ''
}
function clientSecret(): string {
  return process.env.GHL_APP_CLIENT_SECRET ?? ''
}
/** The app id is the client id's prefix (before the dash suffix). */
export function appId(): string {
  return clientId().split('-')[0] ?? ''
}

interface TokenResponse {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  companyId?: string
  userType?: string
  locationId?: string
  userId?: string
}

/** Exchange the install code for the agency grant and persist it. */
export async function exchangeInstallCode(code: string): Promise<{ companyId: string } | null> {
  if (!clientId() || !clientSecret()) {
    logger.error('[ghl-oauth] client keys not configured')
    return null
  }
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId(),
      client_secret: clientSecret(),
      grant_type: 'authorization_code',
      code,
      user_type: 'Company',
    }),
  })
  const data = (await res.json()) as TokenResponse
  if (!res.ok || !data.access_token || !data.refresh_token || !data.companyId) {
    logger.error({ status: res.status, data }, '[ghl-oauth] code exchange failed')
    return null
  }
  await prisma.ghlAppToken.upsert({
    where: { companyId: data.companyId },
    create: {
      companyId: data.companyId,
      accessToken: encrypt(data.access_token),
      refreshToken: encrypt(data.refresh_token),
      expiresAt: new Date(Date.now() + (data.expires_in ?? 86400) * 1000),
    },
    update: {
      accessToken: encrypt(data.access_token),
      refreshToken: encrypt(data.refresh_token),
      expiresAt: new Date(Date.now() + (data.expires_in ?? 86400) * 1000),
    },
  })
  logger.info({ companyId: data.companyId }, '[ghl-oauth] agency grant stored')
  return { companyId: data.companyId }
}

/** Valid agency access token (refreshes when near expiry). */
export async function getAgencyToken(): Promise<{ token: string; companyId: string } | null> {
  const row = await prisma.ghlAppToken.findFirst({ orderBy: { updatedAt: 'desc' } })
  if (!row) return null
  if (row.expiresAt.getTime() - Date.now() > 5 * 60 * 1000) {
    return { token: decrypt(row.accessToken), companyId: row.companyId }
  }
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId(),
      client_secret: clientSecret(),
      grant_type: 'refresh_token',
      refresh_token: decrypt(row.refreshToken),
      user_type: 'Company',
    }),
  })
  const data = (await res.json()) as TokenResponse
  if (!res.ok || !data.access_token) {
    logger.error({ status: res.status }, '[ghl-oauth] agency token refresh FAILED — re-run the install link to re-grant')
    return null
  }
  await prisma.ghlAppToken.update({
    where: { id: row.id },
    data: {
      accessToken: encrypt(data.access_token),
      ...(data.refresh_token ? { refreshToken: encrypt(data.refresh_token) } : {}),
      expiresAt: new Date(Date.now() + (data.expires_in ?? 86400) * 1000),
    },
  })
  return { token: data.access_token, companyId: row.companyId }
}

/** Mint a location access token (also the natural install check — fails for foreign locations). */
export async function mintLocationToken(
  locationId: string,
): Promise<{ token: string; expiresAt: Date; userId?: string } | null> {
  const agency = await getAgencyToken()
  if (!agency) return null
  const res = await fetch(LOCATION_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${agency.token}`,
      Version: VERSION,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ companyId: agency.companyId, locationId }),
  })
  const data = (await res.json()) as TokenResponse
  if (!res.ok || !data.access_token) {
    logger.warn({ status: res.status, locationId, data }, '[ghl-oauth] location token mint failed')
    return null
  }
  return {
    token: data.access_token,
    expiresAt: new Date(Date.now() + (data.expires_in ?? 86400) * 1000),
    userId: data.userId,
  }
}

/** Locations that currently have the app installed. */
export async function listInstalledLocations(): Promise<string[]> {
  const agency = await getAgencyToken()
  if (!agency) return []
  const url = `${INSTALLED_LOCATIONS_URL}?companyId=${agency.companyId}&appId=${appId()}&isInstalled=true&limit=100`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${agency.token}`, Version: VERSION } })
  if (!res.ok) {
    logger.warn({ status: res.status }, '[ghl-oauth] installedLocations failed')
    return []
  }
  const data = (await res.json()) as { locations?: { _id?: string; id?: string }[] }
  return (data.locations ?? []).map((l) => l._id ?? l.id).filter((x): x is string => Boolean(x))
}

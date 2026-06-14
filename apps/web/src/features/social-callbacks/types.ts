import type { NextResponse } from 'next/server'

export interface TokenData {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  [key: string]: unknown
}

export interface PrismaError extends Error {
  code?: string
  message: string
}

export interface InstagramFetchParams {
  userId: string
  instagramAccountId: string
  pageAccessToken: string
  userAccessToken: string
}

export interface RequestWithInstagramParams extends Request {
  __instagramFetchParams?: InstagramFetchParams
}

// Result of a per-platform OAuth code exchange: either an early redirect
// (error/misconfig) or the resolved token + profile data for persistence.
export type PlatformTokenResult = {
  accessToken: string
  refreshToken: string | null
  tokenExpiry: Date | null
  platformUserId: string
  platformUsername: string
  tokenData?: TokenData | null
  isCompanyCallback?: boolean
}

export type CallbackOutcome =
  | { kind: 'redirect'; response: NextResponse }
  | ({ kind: 'token' } & PlatformTokenResult)

/**
 * Map an ISO 3166-1 alpha-2 country code to a hemisphere for newsletter
 * seasonality. Most countries sit clearly in one hemisphere; a handful straddle
 * the equator ("edge") — those default to the hemisphere of their majority
 * (population/landmass) but allow a manual override on the client.
 */
export type Hemisphere = 'north' | 'south'

// Countries clearly in the Southern hemisphere (no override needed).
const SOUTH_CLEAR = new Set([
  'AU', 'NZ', 'AR', 'CL', 'UY', 'PY', 'PE', 'BO', 'ZA', 'NA', 'BW', 'ZW', 'MZ',
  'ZM', 'MW', 'AO', 'MG', 'LS', 'SZ', 'FJ', 'PF', 'NC', 'WS', 'TO', 'VU', 'SB',
])

// Equator-straddling countries → majority hemisphere (override allowed).
const EDGE: Record<string, Hemisphere> = {
  BR: 'south', // Brazil — mostly south
  ID: 'south', // Indonesia — majority (Java) south
  EC: 'south', // Ecuador — capital/major cities just south
  CD: 'south', // DR Congo — majority south
  CG: 'south', // Congo
  TZ: 'south', // Tanzania — major cities south
  PG: 'south', // Papua New Guinea
  CO: 'north', // Colombia — mostly north
  KE: 'north', // Kenya — split; lean north
  UG: 'north', // Uganda
  GA: 'north', // Gabon
  SO: 'north', // Somalia
  ST: 'north', // São Tomé
  KI: 'north', // Kiribati — spread
  MV: 'north', // Maldives
}

export interface HemisphereResult {
  hemisphere: Hemisphere
  edge: boolean // true → straddles the equator; a manual override is allowed
}

export function hemisphereForCountry(code: string | null | undefined): HemisphereResult {
  const c = (code ?? '').trim().toUpperCase()
  if (c in EDGE) return { hemisphere: EDGE[c], edge: true }
  if (SOUTH_CLEAR.has(c)) return { hemisphere: 'south', edge: false }
  return { hemisphere: 'north', edge: false } // default for all clearly-northern (and unknown) codes
}

/** True if the country straddles the equator (so a manual hemisphere override applies). */
export function isEdgeCountry(code: string | null | undefined): boolean {
  return ((code ?? '').trim().toUpperCase()) in EDGE
}

/**
 * Deterministic brand-palette composition (palette-extraction v2, Phase C).
 *
 * The vision LLM supplies a brand color INVENTORY (which hues exist, where they
 * were observed, how prominent they are — perception). This module assigns
 * inventory colors to newsletter roles with hard readability rules (arithmetic):
 * same inventory in → same palette out, and a color that fails contrast can
 * never ship. Preference order lives here, not in the prompt.
 */
import type { SemanticPalette } from './site-analysis'

export type Prominence = 'main' | 'supporting' | 'ground'

export interface BrandColor {
  hex: string
  name?: string
  prominence: Prominence
  observedRoles: string[]
  /** Real pixel share 0-1 measured from the screenshot clusters (not LLM-estimated). */
  coverage?: number
  confidence?: number
}

export interface BrandInventory {
  colors: BrandColor[]
}

export interface ComposedPalette extends SemanticPalette {
  /** Per-role pre-validated alternates the user can tap in the reveal. */
  alternates?: Record<string, string[]>
  /** Per-role human-readable origin: "extracted" | "derived from #x" | "fallback". */
  provenance?: Record<string, string>
}

// ── color math ────────────────────────────────────────────────────────────────

export function normalizeHex(raw: string): string | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(raw.trim())
  if (m) return `#${m[1].toLowerCase()}`
  const s = /^#?([0-9a-f]{3})$/i.exec(raw.trim())
  if (s) return `#${s[1].toLowerCase().split('').map((c) => c + c).join('')}`
  return null
}

function channel(c: number): number {
  const v = c / 255
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

export function relLuminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16)
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
}

export function contrastRatio(a: string, b: string): number {
  const la = relLuminance(a)
  const lb = relLuminance(b)
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const n = parseInt(hex.slice(1), 16)
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return { h: h * 360, s, l }
}

export function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360 / 360
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const f = (t: number) => {
    let x = t
    if (x < 0) x += 1
    if (x > 1) x -= 1
    if (x < 1 / 6) return p + (q - p) * 6 * x
    if (x < 1 / 2) return q
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6
    return p
  }
  const to255 = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255)
  const r = s === 0 ? l : f(hue + 1 / 3)
  const g = s === 0 ? l : f(hue)
  const b = s === 0 ? l : f(hue - 1 / 3)
  return `#${((to255(r) << 16) | (to255(g) << 8) | to255(b)).toString(16).padStart(6, '0')}`
}

/**
 * Walk HSL lightness (keeping hue/saturation) toward readability against `bg`
 * until `target` contrast is met. Returns the adjusted hex and how far the
 * lightness moved (0 = usable as-is), or null if the hue cannot reach target.
 */
export function adjustForContrast(
  hex: string,
  bg: string,
  target = 4.5,
): { hex: string; deltaL: number } | null {
  if (contrastRatio(hex, bg) >= target) return { hex, deltaL: 0 }
  const { h, s, l } = hexToHsl(hex)
  const darkenDirection = relLuminance(bg) >= 0.5 ? -1 : 1
  for (let step = 0.01; step <= 0.6; step += 0.01) {
    const nl = l + darkenDirection * step
    if (nl < 0.02 || nl > 0.98) break
    const candidate = hslToHex(h, s, nl)
    if (contrastRatio(candidate, bg) >= target) return { hex: candidate, deltaL: step }
  }
  return null
}

const dist = (a: string, b: string): number => {
  const na = parseInt(a.slice(1), 16)
  const nb = parseInt(b.slice(1), 16)
  const dr = ((na >> 16) & 255) - ((nb >> 16) & 255)
  const dg = ((na >> 8) & 255) - ((nb >> 8) & 255)
  const db = (na & 255) - (nb & 255)
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

function hueDistance(a: string, b: string): number {
  const d = Math.abs(hexToHsl(a).h - hexToHsl(b).h) % 360
  return d > 180 ? 360 - d : d
}

// ── composition ───────────────────────────────────────────────────────────────

const CONTRAST_TEXT = 4.5
/** Small hue-preserving darkening we accept happily; beyond it a candidate only wins as last resort. */
const GRACEFUL_DELTA_L = 0.15

interface Candidate extends BrandColor {
  hex: string
}

function saturationOf(hex: string): number {
  return hexToHsl(hex).s
}

/** Lighten a hue into band-tint territory (lum >= 0.85) while keeping its identity. */
function toTint(hex: string): string {
  const { h, s } = hexToHsl(hex)
  for (let l = 0.9; l <= 0.97; l += 0.01) {
    const c = hslToHex(h, Math.min(s, 0.55), l)
    if (relLuminance(c) >= 0.85) return c
  }
  return hslToHex(h, Math.min(s, 0.55), 0.95)
}

export function composePalette(inventory: BrandInventory): ComposedPalette {
  const colors: Candidate[] = inventory.colors
    .map((c) => ({ ...c, hex: normalizeHex(c.hex) ?? '' }))
    .filter((c) => c.hex)
  const provenance: Record<string, string> = {}
  const alternates: Record<string, string[]> = {}

  const byRole = (role: string) => colors.filter((c) => c.observedRoles?.includes(role))
  const mains = colors.filter((c) => c.prominence === 'main')
  const nonGround = colors.filter((c) => c.prominence !== 'ground')

  // Ground / body background: the dominant light color.
  const lightGrounds = colors
    .filter((c) => relLuminance(c.hex) > 0.8)
    .sort((a, b) => (b.coverage ?? 0) - (a.coverage ?? 0))
  const ground = lightGrounds[0]?.hex ?? '#ffffff'
  provenance.bodyBackground = lightGrounds[0] ? 'extracted' : 'fallback'

  // Header background: observed nav bar, else the ground.
  const nav = byRole('nav_background')[0]
  const headerBackground = nav?.hex ?? ground
  provenance.headerBackground = nav ? 'extracted' : `derived from ${ground}`

  // Header text: best-contrast brand color on the header, else plain ink.
  const headerTextCandidate = [...mains, ...colors]
    .filter((c) => c.hex !== headerBackground)
    .sort((a, b) => contrastRatio(b.hex, headerBackground) - contrastRatio(a.hex, headerBackground))[0]
  let headerText: string
  if (headerTextCandidate && contrastRatio(headerTextCandidate.hex, headerBackground) >= CONTRAST_TEXT) {
    headerText = headerTextCandidate.hex
    provenance.headerText = 'extracted'
  } else {
    headerText = relLuminance(headerBackground) >= 0.5 ? '#1c2b33' : '#ffffff'
    provenance.headerText = 'fallback'
  }

  // Button: observed fill if its label reads, else darkest main.
  const observedButton = byRole('button_fill')[0]
  const labelReads = (fill: string) =>
    contrastRatio('#ffffff', fill) >= CONTRAST_TEXT || contrastRatio('#1c2b33', fill) >= CONTRAST_TEXT
  const darkestMain = [...mains].sort((a, b) => relLuminance(a.hex) - relLuminance(b.hex))[0]
  let button: string
  if (observedButton && labelReads(observedButton.hex)) {
    button = observedButton.hex
    provenance.button = 'extracted'
  } else if (darkestMain && labelReads(darkestMain.hex)) {
    button = darkestMain.hex
    provenance.button = observedButton ? `derived from ${observedButton.hex}` : 'extracted'
  } else {
    button = '#0b2545'
    provenance.button = 'fallback'
  }

  // Link/accent: try candidates in preference order; hue-preserving darkening;
  // graceful adjustments beat heavy ones (a gold that must fall to mud loses to
  // a blue that darkens a little).
  const distinctive = [...nonGround]
    .filter((c) => c.hex !== ground)
    .sort((a, b) => saturationOf(b.hex) - saturationOf(a.hex))
  const linkCandidates: Candidate[] = []
  for (const c of [...byRole('link_text'), ...(observedButton ? [observedButton] : []), ...distinctive]) {
    if (!linkCandidates.some((x) => x.hex === c.hex)) linkCandidates.push(c)
  }
  const adjusted = linkCandidates
    .map((c) => ({ c, adj: adjustForContrast(c.hex, ground, CONTRAST_TEXT) }))
    .filter((x): x is { c: Candidate; adj: { hex: string; deltaL: number } } => x.adj !== null)
  const graceful = adjusted.find((x) => x.adj.deltaL <= GRACEFUL_DELTA_L)
  const chosen = graceful ?? adjusted.sort((a, b) => a.adj.deltaL - b.adj.deltaL)[0]
  let accent: string
  if (chosen) {
    accent = chosen.adj.hex
    provenance.accent =
      chosen.adj.deltaL === 0 ? 'extracted' : `derived from ${chosen.c.hex} (darkened for contrast)`
  } else {
    accent = relLuminance(ground) >= 0.5 ? '#2a6f97' : '#9fd3ee'
    provenance.accent = 'fallback'
  }
  alternates.accent = adjusted
    .map((x) => x.adj.hex)
    .filter((h) => h !== accent)
    .filter((h, i, arr) => arr.indexOf(h) === i)
    .slice(0, 3)
  alternates.button = [...mains, ...byRole('button_fill')]
    .map((c) => c.hex)
    .filter((h) => h !== button && labelReads(h))
    .filter((h, i, arr) => arr.indexOf(h) === i)
    .slice(0, 3)

  // Section tints: band/supporting hues lightened into tint territory, hue-diverse.
  const tintSources = [...byRole('band'), ...colors.filter((c) => c.prominence === 'supporting'), ...mains]
  const tints: string[] = []
  for (const src of tintSources) {
    if (dist(src.hex, ground) < 24) continue
    const tint = toTint(src.hex)
    if (tints.some((t) => hueDistance(t, tint) < 30)) continue
    tints.push(tint)
    if (tints.length === 2) break
  }
  while (tints.length < 2) {
    tints.push(tints.length === 0 ? toTint(accent) : toTint(headerBackground === ground ? button : headerBackground))
  }
  provenance.sectionTints = 'derived (lightened brand hues)'

  return {
    headerBackground,
    headerText,
    accent,
    button,
    bodyBackground: ground,
    sectionTints: tints,
    confidence: Object.fromEntries(
      colors.length ? [['inventory', Math.min(1, colors.length / 5)]] : [['inventory', 0]],
    ),
    alternates,
    provenance,
  }
}

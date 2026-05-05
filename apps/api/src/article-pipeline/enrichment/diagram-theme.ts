/** Mermaid `themeVariables` + init for diagrams (brand colors). */

export interface DiagramBrandThemeInput {
  diagramPrimaryColor?: string | null
  diagramPrimaryTextColor?: string | null
  diagramSecondaryColor?: string | null
  diagramLineColor?: string | null
  diagramTextColor?: string | null
  diagramFontFamily?: string | null
}

export interface DiagramTheme {
  primaryColor: string
  primaryTextColor: string
  secondaryColor: string
  lineColor: string
  textColor: string
  fontFamily: string
}

const DEFAULTS: DiagramTheme = {
  primaryColor: '#3B82F6',
  primaryTextColor: '#FFFFFF',
  secondaryColor: '#8B5CF6',
  lineColor: '#6B7280',
  textColor: '#1F2937',
  fontFamily: 'Arial, Helvetica, sans-serif',
}

export function themeFromBrand(brand: DiagramBrandThemeInput | null | undefined): DiagramTheme {
  const b = brand ?? {}
  return {
    primaryColor: pickHex(b.diagramPrimaryColor, DEFAULTS.primaryColor),
    primaryTextColor: pickHex(b.diagramPrimaryTextColor, DEFAULTS.primaryTextColor),
    secondaryColor: pickHex(b.diagramSecondaryColor, DEFAULTS.secondaryColor),
    lineColor: pickHex(b.diagramLineColor, DEFAULTS.lineColor),
    textColor: pickHex(b.diagramTextColor, DEFAULTS.textColor),
    fontFamily: typeof b.diagramFontFamily === 'string' && b.diagramFontFamily.trim().length > 0
      ? b.diagramFontFamily.trim()
      : DEFAULTS.fontFamily,
  }
}

/** Full `%%{init: … }%%` for mmdc; uses `theme: base` so custom colors apply cleanly. tertiary = secondary */
export function buildDiagramInitDirective(theme: DiagramTheme): string {
  const primaryBorderColor = darkenHex(theme.primaryColor, 15)
  const secondaryBorderColor = darkenHex(theme.secondaryColor, 15)

  const initObj = {
    theme: 'base',
    themeVariables: {
      primaryColor: theme.primaryColor,
      primaryTextColor: theme.primaryTextColor,
      primaryBorderColor,
      secondaryColor: theme.secondaryColor,
      secondaryTextColor: theme.primaryTextColor,
      secondaryBorderColor,
      tertiaryColor: theme.secondaryColor,
      tertiaryTextColor: theme.primaryTextColor,
      lineColor: theme.lineColor,
      textColor: theme.textColor,
      fontFamily: theme.fontFamily,
    },
    flowchart: { htmlLabels: false },
    sequence: { htmlLabels: false },
    class: { htmlLabels: false },
    state: { htmlLabels: false },
  }

  return `%%{init: ${JSON.stringify(initObj)}}%%`
}

function pickHex(raw: string | null | undefined, fallback: string): string {
  if (typeof raw !== 'string' || !/^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(raw.trim())) {
    return fallback
  }
  const hex = raw.trim().startsWith('#') ? raw.trim() : `#${raw.trim()}`
  return normalizeHex(hex)
}

function normalizeHex(hex: string): string {
  if (hex.length === 4 && hex.startsWith('#')) {
    const r = hex[1]
    const g = hex[2]
    const b = hex[3]
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
  }
  return hex.length === 7 ? hex.toUpperCase() : hex
}

function darkenHex(hex: string, percentTowardBlack: number): string {
  const n = normalizeHex(hex)
  const v = /^#([0-9A-F]{6})$/i.exec(n)
  if (!v) return hex
  const num = Number.parseInt(v[1], 16)
  const step = Math.round((255 * percentTowardBlack) / 100)
  const r = Math.max(0, (num >> 16) - step)
  const g = Math.max(0, ((num >> 8) & 0xff) - step)
  const b = Math.max(0, (num & 0xff) - step)
  const out = `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
  return out.toUpperCase()
}

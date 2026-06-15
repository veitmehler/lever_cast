import { describe, it, expect } from 'vitest'
import {
  themeFromBrand,
  buildDiagramInitDirective,
  buildDarkDiagramInitDirective,
  DIAGRAM_DARK_BACKGROUND,
} from '../diagram-theme'

function parseInit(directive: string): { theme: string; themeVariables: Record<string, string> } {
  const json = directive.replace(/^%%\{init:\s*/, '').replace(/\}%%$/, '')
  return JSON.parse(json)
}

describe('themeFromBrand', () => {
  it('falls back to the default palette for null input', () => {
    expect(themeFromBrand(null)).toEqual({
      primaryColor: '#3B82F6',
      secondaryColor: '#8B5CF6',
      lineColor: '#6B7280',
      fontFamily: 'HelveticaNeue, Helvetica, Arial, sans-serif',
    })
  })

  it('normalises a valid shorthand hex and uppercases it', () => {
    expect(themeFromBrand({ diagramPrimaryColor: '#abc' }).primaryColor).toBe('#AABBCC')
  })

  it('ignores an invalid color and keeps the default', () => {
    expect(themeFromBrand({ diagramPrimaryColor: 'not-a-color' }).primaryColor).toBe('#3B82F6')
  })

  it('uses a custom font family when provided', () => {
    expect(themeFromBrand({ diagramFontFamily: '  Inter  ' }).fontFamily).toBe('Inter')
  })
})

describe('buildDiagramInitDirective', () => {
  it('emits a base-theme mermaid init carrying the brand primary color', () => {
    const theme = themeFromBrand({ diagramPrimaryColor: '#3B82F6' })
    const directive = buildDiagramInitDirective(theme)
    expect(directive.startsWith('%%{init:')).toBe(true)
    expect(directive.endsWith('}%%')).toBe(true)
    const init = parseInit(directive)
    expect(init.theme).toBe('base')
    expect(init.themeVariables.primaryColor).toBe('#3B82F6')
    expect(init.themeVariables.fontFamily).toBe(theme.fontFamily)
  })

  it('pairs a readable text color against a light primary fill', () => {
    // a very light fill should get black contrasting text
    const init = parseInit(buildDiagramInitDirective(themeFromBrand({ diagramPrimaryColor: '#FFFFFF' })))
    expect(init.themeVariables.primaryTextColor).toBe('#000000')
  })
})

describe('buildDarkDiagramInitDirective', () => {
  it('emits a dark-theme mermaid init with the dark canvas background', () => {
    const init = parseInit(buildDarkDiagramInitDirective(themeFromBrand(null)))
    expect(init.theme).toBe('dark')
    expect(init.themeVariables.background).toBe(DIAGRAM_DARK_BACKGROUND)
  })
})

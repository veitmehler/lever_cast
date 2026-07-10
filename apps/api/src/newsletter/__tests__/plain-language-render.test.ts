import { describe, it, expect } from 'vitest'
import { stylePlainLanguageBoxes } from '../render'
import { buildBoxMarker } from '../../article-pipeline/enrichment/plain-language'

type Theme = Parameters<typeof stylePlainLanguageBoxes>[1]

const theme = {
  headerBg: '#000',
  footerBg: '#000',
  sections: ['#111', '#222', '#333', '#444'],
  fontFamily: 'Open Sans',
  fontStack: "'Open Sans', Arial, sans-serif",
  fontColor: '#1a1a1a',
  headingWeight: '700',
  bodyWeight: '400',
  linkColor: '#0a7ea4',
  headerLogoUrl: null,
  headerLogoWidth: 200,
  footerLogoUrl: null,
  footerLogoWidth: 160,
  footerIconVariant: 'dark',
} as Theme

describe('stylePlainLanguageBoxes', () => {
  it('replaces a marker produced by buildBoxMarker with a themed, inline-styled block', () => {
    const body = `<p>Intro text.</p>${buildBoxMarker('Simply Put', 'Your discs feed like a sponge.')}<p>More.</p>`
    const out = stylePlainLanguageBoxes(body, theme)
    expect(out).not.toContain('data-pl-box')
    expect(out).toContain('border-left:4px solid #0a7ea4')
    expect(out).toContain('Simply Put')
    expect(out).toContain('Your discs feed like a sponge.')
    expect(out).toContain(theme.fontStack)
  })

  it('replaces multiple markers', () => {
    const body =
      buildBoxMarker('In Plain English', 'First story.') + '<p>mid</p>' + buildBoxMarker('The Simple Version', 'Second story.')
    const out = stylePlainLanguageBoxes(body, theme)
    expect(out).not.toContain('data-pl-box')
    expect(out).toContain('First story.')
    expect(out).toContain('Second story.')
  })

  it('passes bodies without markers through untouched', () => {
    const body = '<p>No markers here at all.</p>'
    expect(stylePlainLanguageBoxes(body, theme)).toBe(body)
  })

  it('keeps pre-escaped label/text entities intact', () => {
    const body = buildBoxMarker('Label & Co', 'Text with "quotes" & symbols.')
    const out = stylePlainLanguageBoxes(body, theme)
    expect(out).toContain('Label &amp; Co')
    expect(out).toContain('Text with &quot;quotes&quot; &amp; symbols.')
  })
})

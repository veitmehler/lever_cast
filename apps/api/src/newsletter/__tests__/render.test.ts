import { describe, it, expect } from 'vitest'
import { renderNewsletterHtml, type RenderInput, type RenderBrand } from '../render'

const brand: RenderBrand = {
  organizationName: 'Acme Wellness',
  organizationLogoUrl: 'https://cdn.example.com/logo.png',
  organizationAddress: '123 Main St, Springfield',
  nlHeaderBgColor: '#0d1b2a',
  nlFooterBgColor: '#eef2f7',
  nlFontFamily: 'Georgia',
  nlFontColor: '#222222',
  nlLinkColor: '#cc3344',
}

const full: RenderInput = {
  previewText: 'This month: back pain myths busted',
  featureArticle: {
    title: 'Back Pain Myths',
    teaser: 'A short teaser',
    tldr: 'The 3-sentence summary',
    body: '<h2>Section</h2><p>Body paragraph</p>',
    imageUrl: 'https://cdn.example.com/feature.jpg',
  },
  secondaryArticle: {
    title: 'Sports Recovery',
    teaser: 't',
    tldr: '',
    body: '<p>secondary body</p>',
    imageUrl: null,
  },
  teasers: [
    { title: 'Teaser A', body: '<p>blurb a</p>', cta: '<p>cta a</p>', link: 'https://a.com/x' },
    { title: 'Teaser B', body: '<p>blurb b</p>', cta: '<p>cta b</p>', link: 'https://b.com/y' },
    { title: 'Teaser C', body: '<p>blurb c</p>', cta: '<p>cta c</p>', link: 'https://c.com/z' },
  ],
  quickHits: { tips: ['tip one', 'tip two'], facts: ['fact one'] },
  fun: { triviaQuestion: 'Q?', triviaAnswer: 'A.', joke: '<p>setup</p><p>punchline</p>' },
  modules: {
    recipe: {
      intro: '<h2>Quinoa Salad</h2><p>intro</p>',
      ingredients: '<ul><li>quinoa</li></ul>',
      instructions: '<ol><li>mix</li></ol>',
      imageUrl: 'https://cdn.example.com/recipe.jpg',
    },
  },
  video: {
    url: 'https://youtu.be/abc',
    title: 'Great video',
    thumbnailUrl: 'https://img.youtube.com/abc.jpg',
    s3Url: 'https://cdn.example.com/thumb.jpg',
    manual: false,
  },
}

describe('renderNewsletterHtml', () => {
  it('renders all sections with brand theme applied', () => {
    const html = renderNewsletterHtml(full, brand)
    expect(html).toContain('<!DOCTYPE html')
    // preheader (hidden)
    expect(html).toContain('This month: back pain myths busted')
    // brand colors + font
    expect(html).toContain('#0d1b2a') // header bg
    expect(html).toContain('#eef2f7') // footer bg
    expect(html).toContain('Georgia') // font family primary
    expect(html).toContain('#cc3344') // link color
    // sections
    expect(html).toContain('Back Pain Myths')
    expect(html).toContain('Also in this issue')
    expect(html).toContain('Around the web')
    expect(html).toContain('https://a.com/x')
    expect(html).toContain('Quick tips')
    expect(html).toContain('Did you know?')
    expect(html).toContain('https://youtu.be/abc')
    expect(html).toContain('Joke of the day')
    expect(html).toContain('Recipe of the month')
    // logo + footer address
    expect(html).toContain('https://cdn.example.com/logo.png')
    expect(html).toContain('123 Main St, Springfield')
    // body HTML passed through
    expect(html).toContain('<h2>Section</h2><p>Body paragraph</p>')
  })

  it('escapes plain-text fields to avoid breaking markup', () => {
    const html = renderNewsletterHtml(
      { featureArticle: { title: 'A & B <x>', teaser: '', tldr: '', body: '<p>ok</p>', imageUrl: null } },
      {},
    )
    expect(html).toContain('A &amp; B &lt;x&gt;')
  })

  it('omits sections that have no content', () => {
    const html = renderNewsletterHtml({ featureArticle: null, teasers: [], quickHits: { tips: [], facts: [] } }, {})
    expect(html).not.toContain('Around the web')
    expect(html).not.toContain('Quick tips')
    expect(html).not.toContain('Watch this')
    expect(html).not.toContain('Recipe of the month')
  })

  it('falls back to defaults when no brand nl* fields are set', () => {
    const html = renderNewsletterHtml({ featureArticle: full.featureArticle, teasers: full.teasers }, {})
    expect(html).toContain('#1a1a1a') // default header bg
    expect(html).toContain('#f4f4f4') // default footer bg
    expect(html).toContain('#2563eb') // default link color (teaser link)
  })

  it('uses the org name when no logo is configured', () => {
    const html = renderNewsletterHtml({ featureArticle: full.featureArticle }, { organizationName: 'NoLogo Co' })
    expect(html).toContain('NoLogo Co')
  })
})

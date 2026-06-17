import { describe, it, expect } from 'vitest'
import { renderNewsletterHtml, type RenderInput, type RenderBrand } from '../render'

const brand: RenderBrand = {
  organizationName: 'Acme Wellness',
  nlLogoUrl: 'https://cdn.example.com/logo.png',
  nlLogoWidth: 280,
  organizationAddress: '123 Main St, Springfield',
  nlHeaderBgColor: '#0d1b2a',
  nlFooterBgColor: '#eef2f7',
  nlSectionColor1: '#aa0011',
  nlSectionColor2: '#0022bb',
  nlSectionColor3: '#113322',
  nlSectionColor4: '#445566',
  nlFontFamily: 'Georgia',
  nlFontColor: '#222222',
  nlLinkColor: '#cc3344',
}

const teaser = (headline: string, link: string) => ({
  headline,
  title: 't',
  body: `<p>blurb for ${headline}</p>`,
  cta: '<p>cta</p>',
  link,
})

const full: RenderInput = {
  previewText: 'This month: back pain myths busted',
  featureArticle: { title: 'Back Pain Myths', teaser: '', tldr: 'The summary', body: '<h2>Sec</h2><p>Body</p>', imageUrl: 'https://cdn.example.com/feature.jpg' },
  secondaryArticle: { title: 'Sports Recovery', teaser: 't', tldr: '', body: '<p>secondary body</p>', imageUrl: null },
  teasers: [teaser('Real Source Headline A', 'https://a.com/x'), teaser('Real Source Headline B', 'https://b.com/y'), teaser('Real Source Headline C', 'https://c.com/z')],
  quickHits: { tips: ['tip one', 'tip two'], facts: ['fact one'] },
  fun: { triviaQuestion: 'Q?', triviaAnswer: 'A.', joke: '<p>setup</p><p>punchline</p>' },
  modules: {
    recipe: { intro: '<h2>Quinoa</h2><p>intro</p>', ingredients: '<ul><li>quinoa</li></ul>', instructions: '<ol><li>mix</li></ol>', imageUrl: 'https://cdn.example.com/recipe.jpg' },
    recipe2: { intro: '<h2>Bites</h2>', ingredients: '<ul><li>oats</li></ul>', instructions: '<ol><li>roll</li></ol>', imageUrl: null },
  },
  video: { url: 'https://youtu.be/abc', title: 'Great video', thumbnailUrl: 'https://img/abc.jpg', s3Url: 'https://cdn.example.com/thumb.jpg', manual: false },
  summaryImageUrl: 'https://cdn.example.com/cover.png',
}

describe('renderNewsletterHtml', () => {
  it('renders all sections in the redesigned order with brand theme', () => {
    const html = renderNewsletterHtml(full, brand)
    expect(html).toContain('<!DOCTYPE html')
    // preheader + cover image + logo
    expect(html).toContain('This month: back pain myths busted')
    expect(html).toContain('https://cdn.example.com/cover.png')
    expect(html).toContain('https://cdn.example.com/logo.png')
    // brand colors
    expect(html).toContain('#0d1b2a') // header bg
    expect(html).toContain('#eef2f7') // footer bg
    expect(html).toContain('Georgia')
    expect(html).toContain('#cc3344') // link color
    // at least one section band color is used
    expect(html).toContain('#aa0011')
    // teaser headings use the REAL source headline, not "Around the web"
    expect(html).toContain('Real Source Headline A')
    expect(html).toContain('Real Source Headline C')
    expect(html).not.toContain('Around the web')
    // standard bands + content
    expect(html).toContain('Trivia Question')
    expect(html).toContain('Trivia Answer')
    expect(html).toContain('Did You Know?')
    expect(html).toContain('Tips Of The Day')
    expect(html).toContain('Article Of The Day')
    expect(html).toContain('Sports Recovery') // secondary band = its own title
    expect(html).not.toContain('Also In This Issue')
    expect(html).toContain('Recipe Of The Day')
    expect(html).toContain('Another Recipe')
    expect(html).toContain('https://youtu.be/abc')
  })

  it('orders the cover image after the trivia question and before the video', () => {
    const html = renderNewsletterHtml(full, brand)
    const q = html.indexOf('Trivia Question')
    const cover = html.indexOf('cover.png')
    const video = html.indexOf('youtu.be/abc')
    const answer = html.indexOf('Trivia Answer')
    expect(q).toBeGreaterThan(0)
    expect(q).toBeLessThan(cover)
    expect(cover).toBeLessThan(video)
    expect(answer).toBeGreaterThan(video) // answer is last
  })

  it('falls back to a voiced title when a teaser has no real headline', () => {
    const html = renderNewsletterHtml(
      { teasers: [{ headline: null, title: 'Voiced Fallback Title', body: '<p>x</p>', cta: '<p>y</p>', link: 'https://z.com' }] },
      {},
    )
    expect(html).toContain('Voiced Fallback Title')
  })

  it('omits sections with no data and uses example-palette defaults', () => {
    const html = renderNewsletterHtml({ featureArticle: full.featureArticle }, {})
    expect(html).not.toContain('Recipe Of The Day')
    expect(html).not.toContain('Did You Know?')
    expect(html).toContain('#fa00bb') // default header / section color 1
    expect(html).toContain('#011328') // default footer
  })

  it('escapes plain-text headings/answers', () => {
    const html = renderNewsletterHtml(
      { fun: { triviaQuestion: 'A & B <x>?', triviaAnswer: null, joke: null } },
      {},
    )
    expect(html).toContain('A &amp; B &lt;x&gt;?')
  })
})

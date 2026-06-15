import { describe, it, expect } from 'vitest'
import {
  stripTags,
  slugify,
  extractH2Sections,
  buildEnrichedHtml,
  buildFigureHtml,
  injectHeadingIds,
  extractHeadingsForToc,
  toTitleCase,
  normalizeHeadingCase,
  buildTocHtml,
  prependTakeawaysAndToc,
  findFirstH2Index,
} from '../html-parser'

describe('stripTags', () => {
  it('removes tags and trims', () => {
    expect(stripTags('<p>Hi <b>there</b></p>')).toBe('Hi there')
  })
})

describe('slugify', () => {
  it('lowercases, strips punctuation, and hyphenates whitespace', () => {
    expect(slugify('Hello, World!')).toBe('hello-world')
  })
  it('collapses repeated spaces and hyphens and trims edge hyphens', () => {
    expect(slugify('  Foo   --  Bar  ')).toBe('foo-bar')
  })
  it('falls back to "section" for empty/punctuation-only input', () => {
    expect(slugify('')).toBe('section')
    expect(slugify('---')).toBe('section')
  })
})

describe('extractH2Sections', () => {
  it('returns one section per h2 with position, anchor, and bounded html', () => {
    const body = '<h2>One</h2><p>a</p><h2>Two</h2><p>b</p>'
    const sections = extractH2Sections(body)
    expect(sections).toHaveLength(2)
    expect(sections[0]).toMatchObject({ position: 1, anchor: 'one', heading: 'One', sectionHtml: '<h2>One</h2><p>a</p>' })
    expect(sections[1]).toMatchObject({ position: 2, heading: 'Two', sectionHtml: '<h2>Two</h2><p>b</p>' })
  })
})

describe('buildEnrichedHtml', () => {
  it('inserts a figure immediately after the </h2>', () => {
    const body = '<h2>One</h2><p>a</p>'
    const { afterH2Offset } = extractH2Sections(body)[0]
    const out = buildEnrichedHtml(body, [{ afterH2Offset, figureHtml: '<figure/>' }])
    expect(out).toBe('<h2>One</h2>\n<figure/>\n<p>a</p>')
  })

  it('places the figure after a geo-summary block when one follows the heading', () => {
    const body = '<h2>Q</h2><div class="geo-summary">sum</div><p>a</p>'
    const { afterH2Offset } = extractH2Sections(body)[0]
    const out = buildEnrichedHtml(body, [{ afterH2Offset, figureHtml: '<figure/>' }])
    expect(out.indexOf('<figure/>')).toBeGreaterThan(out.indexOf('</div>'))
  })
})

describe('buildFigureHtml', () => {
  it('uses the section heading as alt when no altText is given', () => {
    const html = buildFigureHtml({ imgUrl: 'u.svg', diagramId: 'd1', alt: 'Section Heading' })
    expect(html).toContain('alt="Section Heading"')
    expect(html).not.toContain('aria-describedby')
    expect(html).not.toContain('<figcaption')
  })

  it('prefers trimmed altText and wires an escaped caption via aria-describedby', () => {
    const html = buildFigureHtml({ imgUrl: 'u.svg', diagramId: 'd1', alt: 'fallback', altText: '  Custom Alt  ', caption: 'A & B' })
    expect(html).toContain('alt="Custom Alt"')
    expect(html).toContain('aria-describedby="diagram-desc-d1"')
    expect(html).toContain('<figcaption id="diagram-desc-d1">A &amp; B</figcaption>')
  })

  it('emits width/height only when both are present', () => {
    expect(buildFigureHtml({ imgUrl: 'u', diagramId: 'd', alt: 'a', width: 800, height: 600 })).toContain('width="800" height="600"')
    expect(buildFigureHtml({ imgUrl: 'u', diagramId: 'd', alt: 'a', width: 800 })).not.toContain('width="800"')
  })
})

describe('injectHeadingIds', () => {
  it('adds slug ids to headings that lack one', () => {
    expect(injectHeadingIds('<h2>Hello World</h2>')).toBe('<h2 id="hello-world">Hello World</h2>')
  })
  it('preserves an existing id', () => {
    expect(injectHeadingIds('<h2 id="keep">Y</h2>')).toBe('<h2 id="keep">Y</h2>')
  })
  it('disambiguates colliding slugs', () => {
    const out = injectHeadingIds('<h2>Dup</h2><h3>Dup</h3>')
    expect(out).toContain('<h2 id="dup">Dup</h2>')
    expect(out).toContain('<h3 id="dup-2">Dup</h3>')
  })
})

describe('extractHeadingsForToc', () => {
  it('reads level, text, and anchor (from id when present)', () => {
    const entries = extractHeadingsForToc('<h2 id="a">A</h2><h3 id="b">B</h3>')
    expect(entries).toEqual([
      { level: 2, text: 'A', anchor: 'a' },
      { level: 3, text: 'B', anchor: 'b' },
    ])
  })
  it('slugifies the anchor when the heading has no id and skips empty headings', () => {
    const entries = extractHeadingsForToc('<h2>My Heading</h2><h2></h2>')
    expect(entries).toEqual([{ level: 2, text: 'My Heading', anchor: 'my-heading' }])
  })
})

describe('toTitleCase', () => {
  it('capitalizes words but lowercases minor words after the first', () => {
    expect(toTitleCase('a tale of two cities')).toBe('A Tale of Two Cities')
    expect(toTitleCase('the quick brown fox')).toBe('The Quick Brown Fox')
  })
})

describe('normalizeHeadingCase', () => {
  it('title-cases inner heading text while preserving attributes', () => {
    expect(normalizeHeadingCase('<h2 id="x">the rise of robots</h2>')).toBe('<h2 id="x">The Rise of Robots</h2>')
  })
})

describe('buildTocHtml', () => {
  it('returns empty string for no entries', () => {
    expect(buildTocHtml([])).toBe('')
  })
  it('renders a nav with an anchored link per h2', () => {
    const html = buildTocHtml([{ level: 2, text: 'Intro', anchor: 'intro' }])
    expect(html).toContain('<nav class="article-toc"')
    expect(html).toContain('<a href="#intro">Intro</a>')
  })
  it('nests h3 entries under the preceding h2', () => {
    const html = buildTocHtml([
      { level: 2, text: 'Main', anchor: 'main' },
      { level: 3, text: 'Sub', anchor: 'sub' },
    ])
    expect(html).toContain('<a href="#main">Main</a>')
    expect(html).toContain('<a href="#sub">Sub</a>')
    // the sub link lives inside a nested <ul> after the main link
    expect(html.indexOf('#sub')).toBeGreaterThan(html.indexOf('#main'))
  })
})

describe('prependTakeawaysAndToc', () => {
  it('prepends both blocks when the offset is non-positive', () => {
    expect(prependTakeawaysAndToc('<p>body</p>', 0, 'KT', 'TOC')).toBe('KT\nTOC\n<p>body</p>')
    expect(prependTakeawaysAndToc('<p>body</p>', -1, 'KT', 'TOC')).toBe('KT\nTOC\n<p>body</p>')
  })
  it('inserts both blocks at the given offset', () => {
    const html = '<p>intro</p><h2>Body</h2>'
    const offset = html.indexOf('<h2')
    expect(prependTakeawaysAndToc(html, offset, 'KT', 'TOC')).toBe('<p>intro</p>KT\nTOC\n<h2>Body</h2>')
  })
})

describe('findFirstH2Index', () => {
  it('returns the byte offset of the first h2', () => {
    const html = '<p>x</p><h2>Y</h2>'
    expect(findFirstH2Index(html)).toBe(html.indexOf('<h2'))
  })
  it('returns -1 when there is no h2', () => {
    expect(findFirstH2Index('<p>no headings</p>')).toBe(-1)
  })
})

import { Node, mergeAttributes } from '@tiptap/core'

export const ArticleDiagram = Node.create({
  name: 'articleDiagram',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: '',
      },
      caption: {
        default: '',
      },
    }
  },
  parseHTML() {
    return [
      {
        tag: 'figure.article-diagram',
        priority: 120,
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) return false
          const img = element.querySelector('img')
          const cap = element.querySelector('figcaption')
          return {
            src: img?.getAttribute('src') ?? null,
            alt: img?.getAttribute('alt') ?? '',
            caption: cap?.textContent?.trim() ?? '',
          }
        },
      },
    ]
  },
  renderHTML({ node }) {
    const caps = typeof node.attrs.caption === 'string' ? node.attrs.caption.trim() : ''
    return [
      'figure',
      mergeAttributes({ class: 'article-diagram' }),
      [
        'img',
        mergeAttributes({
          ...(node.attrs.src ? { src: node.attrs.src } : {}),
          alt: node.attrs.alt ?? '',
          loading: 'lazy',
        }),
      ],
      ...(caps ? [['figcaption', {}, caps] as const] : []),
    ]
  },
})

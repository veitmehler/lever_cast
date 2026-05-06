import { Node, mergeAttributes } from '@tiptap/core'

/** Placeholder for TOC / GEO / Key takeaways preserved during TipTap edits */
export const IslandMarker = Node.create({
  name: 'islandMarker',
  group: 'block',
  atom: true,
  draggable: false,
  selectable: true,
  defining: true,
  addAttributes() {
    return {
      islandId: {
        default: null,
      },
      label: {
        default: '',
      },
    }
  },
  parseHTML() {
    return [
      {
        tag: 'div[data-socioply-island]',
        priority: 130,
        getAttrs: (el) => {
          if (!(el instanceof HTMLElement)) return false
          const islandId = el.getAttribute('data-socioply-island')
          if (!islandId) return false
          return {
            islandId,
            label: el.getAttribute('data-island-label') ?? '',
          }
        },
      },
    ]
  },
  renderHTML({ node }) {
    return [
      'div',
      mergeAttributes({
        class: 'socioply-island-marker',
        'data-socioply-island': String(node.attrs.islandId ?? ''),
        'data-island-label': String(node.attrs.label ?? ''),
      }),
    ]
  },
})

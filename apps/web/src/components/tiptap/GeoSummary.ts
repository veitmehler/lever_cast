import { Node, mergeAttributes } from '@tiptap/core'

/**
 * Inline, editable "Featured Answer" block (`.geo-summary`).
 * Stays in its correct position within the article body and allows the user
 * to edit the text if it is professionally incorrect.
 */
export const GeoSummary = Node.create({
  name: 'geoSummary',
  group: 'block',
  content: 'block+',
  defining: true,
  isolating: true,

  parseHTML() {
    return [{ tag: 'div.geo-summary', priority: 130 }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'geo-summary' }), 0]
  },
})

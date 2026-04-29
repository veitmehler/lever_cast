/**
 * Cleans a string by normalizing Unicode characters and collapsing whitespace
 * within paragraphs while preserving paragraph breaks and list formatting.
 */
export function cleanText(text: string | undefined | null): string {
  if (!text) return ''

  const normalizedText = text.normalize('NFKC')
  const paragraphs = normalizedText.split(/\n\s*\n+/)

  const cleanedParagraphs = paragraphs.map((paragraph) => {
    const lines = paragraph.split('\n')
    const hasListItems =
      lines.some((line) => {
        const trimmed = line.trim()
        return (
          /^[✅❌•\-\*\d]+[\s\.\)]/.test(trimmed) ||
          /^[✅❌•\-\*]/.test(trimmed) ||
          /^\d+[\.\)]\s/.test(trimmed) ||
          /^[✅❌•\-\*]\s/.test(trimmed)
        )
      }) ||
      paragraph.includes('✅') ||
      paragraph.includes('❌')

    if (hasListItems) {
      return lines
        .map((line) => {
          const bulletPattern = /([✅❌•\-\*])\s+/g
          const matches = [...line.matchAll(bulletPattern)]
          if (matches.length > 1) {
            const parts = line
              .split(/(?=[✅❌•\-\*]\s+)/)
              .filter((part) => part.trim().length > 0)
            return parts
              .map((part) => part.replace(/[ \t]+/g, ' ').trim())
              .join('\n')
          }
          return line.replace(/[ \t]+/g, ' ').trim()
        })
        .filter((line) => line.length > 0)
        .join('\n')
    }

    return paragraph.replace(/[ \t]+/g, ' ').replace(/\n+/g, ' ').trim()
  })
  .filter((p) => p.length > 0)

  return cleanedParagraphs.join('\n\n')
}

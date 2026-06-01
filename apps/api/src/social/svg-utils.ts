/** Escape text for safe inclusion in SVG/XML. */
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Word-wrap plain text into lines that fit within maxCharsPerLine. */
export function wrapText(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length <= maxCharsPerLine) {
      current = candidate
    } else {
      if (current) lines.push(current)
      current = word
      if (lines.length >= maxLines) break
    }
  }

  if (current && lines.length < maxLines) lines.push(current)
  return lines.slice(0, maxLines)
}

/** Build SVG tspans for centered multi-line text. */
export function centeredTextLines(
  lines: string[],
  centerX: number,
  startY: number,
  lineHeight: number,
): string {
  return lines
    .map((line, i) => {
      const y = startY + i * lineHeight
      return `<tspan x="${centerX}" y="${y}">${escapeXml(line)}</tspan>`
    })
    .join('')
}

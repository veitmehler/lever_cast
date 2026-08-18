/**
 * Minimal markdown → HTML for the syndication-article subset (headings,
 * bold/italic, links, lists, blockquotes, paragraphs). Used to put rich
 * text on the clipboard so LinkedIn's / Medium's WYSIWYG editors keep the
 * formatting on paste — both ignore raw markdown. Not a general renderer;
 * the input is our own pipeline output, but everything is HTML-escaped
 * before inline markup is applied.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function inline(s: string): string {
  return escapeHtml(s)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}

export function markdownToHtml(md: string): string {
  const out: string[] = []
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  let list: 'ul' | 'ol' | null = null
  let para: string[] = []

  const flushPara = () => {
    if (para.length > 0) {
      out.push(`<p>${para.map(inline).join(' ')}</p>`)
      para = []
    }
  }
  const closeList = () => {
    if (list) {
      out.push(`</${list}>`)
      list = null
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    const heading = /^(#{1,4})\s+(.*)$/.exec(line)
    const bullet = /^[-*]\s+(.*)$/.exec(line)
    const ordered = /^\d+[.)]\s+(.*)$/.exec(line)
    const quote = /^>\s?(.*)$/.exec(line)

    if (line.trim() === '') {
      flushPara()
      closeList()
    } else if (heading) {
      flushPara()
      closeList()
      const level = heading[1].length
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`)
    } else if (bullet) {
      flushPara()
      if (list !== 'ul') {
        closeList()
        out.push('<ul>')
        list = 'ul'
      }
      out.push(`<li>${inline(bullet[1])}</li>`)
    } else if (ordered) {
      flushPara()
      if (list !== 'ol') {
        closeList()
        out.push('<ol>')
        list = 'ol'
      }
      out.push(`<li>${inline(ordered[1])}</li>`)
    } else if (quote) {
      flushPara()
      closeList()
      out.push(`<blockquote><p>${inline(quote[1])}</p></blockquote>`)
    } else {
      para.push(line)
    }
  }
  flushPara()
  closeList()
  return out.join('\n')
}

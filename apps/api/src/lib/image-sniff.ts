/**
 * Detect an image's real MIME type from its leading bytes (magic numbers),
 * independent of any client-supplied content-type, filename, or data-URL prefix.
 *
 * Returns null for anything that isn't one of the allowed raster image formats,
 * so upload handlers can reject content whose declared type doesn't match its
 * actual bytes (e.g. an HTML/SVG/script payload mislabeled as image/png).
 */
const ALLOWED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
export type AllowedImageMime = (typeof ALLOWED)[number]

export function sniffImageMime(buf: Buffer): AllowedImageMime | null {
  if (buf.length < 12) return null

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return 'image/png'
  }

  // GIF: "GIF87a" or "GIF89a"
  const head6 = buf.toString('ascii', 0, 6)
  if (head6 === 'GIF87a' || head6 === 'GIF89a') return 'image/gif'

  // WEBP: "RIFF" ........ "WEBP"
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp'
  }

  return null
}

const EXT_BY_MIME: Record<AllowedImageMime, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
}

export function extForImageMime(mime: AllowedImageMime): string {
  return EXT_BY_MIME[mime]
}

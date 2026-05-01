export interface OutputPayload {
  jobId: string
  userId: string

  title: string
  slug: string
  bodyHtml: string
  bodyMarkdown: string
  excerpt: string
  seoTitle: string
  seoDescription: string
  primaryKeyword: string
  disclaimer: string
  citations: Array<{ link_title: string; link_url: string }>

  featuredImage: {
    s3Key: string
    cdnUrl: string
    alt: string
    width?: number
    height?: number
  } | null

  diagrams: Array<{
    position: number
    sectionAnchor: string
    sectionTitle: string
    caption?: string | null
    cdnUrl: string
    svgContent: string
    pngS3Key: string
    width?: number | null
    height?: number | null
  }>

  meta: {
    readingTime?: number | null
    publishedAt?: Date | null
  }
}

export interface OutputAttemptResult {
  success: boolean
  resultUrl?: string
  targetRefId?: string
  errorMessage?: string
  durationMs: number
}

export interface OutputTarget {
  name: string
  publish(
    payload: OutputPayload,
    config: Record<string, unknown>,
    attemptId: string,
  ): Promise<OutputAttemptResult>
}

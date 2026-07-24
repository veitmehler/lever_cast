import { auth } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'
import { ArticleEditor } from '@/components/ArticleEditor'

const API_URL = process.env.DO_API_BASE ?? process.env.NEXT_PUBLIC_API_URL ?? 'https://svc.omniply.io'

type RawStep = { stepNumber: number; status: string; output?: string | null }

function resolveBodyHtml(sp: Record<string, unknown>, steps: RawStep[]): string {
  if (sp.bodyHtml && typeof sp.bodyHtml === 'string' && sp.bodyHtml.trim()) {
    return sp.bodyHtml
  }
  const completed = steps.filter((s) => s.status === 'completed')
  const step11 = completed.find((s) => s.stepNumber === 11)
  if (step11?.output?.trim()) return step11.output
  const step9 = completed.find((s) => s.stepNumber === 9)
  if (step9?.output?.trim()) return step9.output
  return ''
}

async function fetchPreview(jobId: string, token: string) {
  const res = await fetch(`${API_URL}/api/articles/${jobId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) return null
  return res.json() as Promise<{ job: Record<string, unknown> }>
}

export default async function ArticlePreviewPage({
  params,
}: {
  params: Promise<{ jobId: string }>
}) {
  const { getToken } = await auth()
  const token = await getToken()
  if (!token) redirect('/sign-in')

  const { jobId } = await params
  const data = await fetchPreview(jobId, token)
  const job = data?.job as Record<string, unknown> | undefined
  const sp = job?.sitePage as Record<string, unknown> | undefined
  if (!job || !sp) notFound()

  const steps: RawStep[] = (job.pipelineSteps as RawStep[]) ?? []
  const bodyHtml = resolveBodyHtml(sp, steps)

  const rawCitations = sp.citations
  const citations =
    rawCitations && Array.isArray(rawCitations)
      ? (rawCitations as Array<{ link_title?: string; link_url?: string; title?: string; url?: string }>).map((c) => ({
          link_title: c.link_title ?? c.title ?? '',
          link_url: c.link_url ?? c.url ?? '',
        }))
      : rawCitations &&
          typeof rawCitations === 'object' &&
          Array.isArray((rawCitations as { resource_links?: unknown }).resource_links)
        ? (
            rawCitations as { resource_links: Array<{ link_title?: string; link_url?: string }> }
          ).resource_links.map((c) => ({ link_title: c.link_title ?? '', link_url: c.link_url ?? '' }))
        : []

  const seoTitle =
    typeof sp.seoTitle === 'string'
      ? sp.seoTitle
      : typeof sp.title === 'string'
        ? sp.title
        : typeof job.topic === 'object' && job.topic && typeof (job.topic as { topic?: string }).topic === 'string'
          ? (job.topic as { topic: string }).topic
          : 'Article Preview'

  return (
    <ArticleEditor
      jobId={jobId}
      initial={{
        title: seoTitle,
        slug: typeof sp.slug === 'string' ? sp.slug : '',
        bodyHtml,
        seoTitle,
        seoDescription: typeof sp.seoDescription === 'string' ? sp.seoDescription : '',
        excerpt: typeof sp.excerpt === 'string' ? sp.excerpt : '',
        readingTime: typeof sp.readingTime === 'number' ? sp.readingTime : null,
        primaryKeyword: typeof sp.primaryKeyword === 'string' ? sp.primaryKeyword : '',
      }}
      citations={citations.filter((c) => c.link_url)}
      disclaimer={typeof sp.disclaimer === 'string' ? sp.disclaimer : ''}
      featuredImage={
        sp.featuredImage && typeof sp.featuredImage === 'object' && 'url' in (sp.featuredImage as object)
          ? (sp.featuredImage as { url: string; altText?: string | null })
          : null
      }
    />
  )
}

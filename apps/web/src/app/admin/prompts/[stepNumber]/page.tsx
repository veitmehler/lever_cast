import { notFound } from 'next/navigation'
import { PromptEditor } from './PromptEditor'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface PromptTemplate {
  id: string
  stepNumber: number
  stepName: string
  defaultProvider: string
  defaultModel: string
  systemPrompt: string | null
  userPrompt: string
  version: number
  isActive: boolean
}

async function getTemplate(stepNumber: number, token: string): Promise<PromptTemplate | null> {
  const res = await fetch(`${API_URL}/api/admin/prompts/${stepNumber}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.template ?? null
}

export default async function PromptEditorPage({
  params,
}: {
  params: Promise<{ stepNumber: string }>
}) {
  const { stepNumber: raw } = await params
  const stepNumber = parseInt(raw, 10)
  if (isNaN(stepNumber)) notFound()

  const { auth } = await import('@clerk/nextjs/server')
  const { getToken } = await auth()
  const token = await getToken()
  if (!token) notFound()

  const template = await getTemplate(stepNumber, token)
  if (!template) notFound()

  return <PromptEditor template={template} />
}

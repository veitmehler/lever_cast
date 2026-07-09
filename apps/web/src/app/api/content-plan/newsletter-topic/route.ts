import { makeProxy } from '@/lib/api-proxy'

export const { POST, DELETE } = makeProxy('/api/content-plan/newsletter-topic')

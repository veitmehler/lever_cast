import { makeProxy } from '@/lib/api-proxy'

export const { POST } = makeProxy('/api/newsletters/approve-all')

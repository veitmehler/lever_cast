import { makeProxy } from '@/lib/api-proxy'

// proxyToApi forwards the raw arrayBuffer body and content-type, which works
// for multipart uploads (the CSV file).
export const { POST } = makeProxy('/api/topics/csv')

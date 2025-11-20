import type { NextConfig } from 'next'

const remotePatterns: { protocol: 'http' | 'https'; hostname: string }[] = [
  {
    protocol: 'https',
    hostname: 'img.clerk.com',
  },
]

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
if (supabaseUrl) {
  try {
    const { hostname } = new URL(supabaseUrl)
    if (hostname) {
      remotePatterns.push({
        protocol: 'https',
        hostname,
      })
    }
  } catch (error) {
    console.warn('[next.config] Invalid NEXT_PUBLIC_SUPABASE_URL:', error)
  }
}

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  devIndicators: {
    position: 'bottom-left',
  },
  images: {
    remotePatterns,
  },
}

export default nextConfig

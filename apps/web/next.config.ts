import type { NextConfig } from 'next'

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
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        // CloudFront CDN for user-uploaded and AI-generated images
        protocol: 'https',
        hostname: 'cdn.socioply.com',
      },
      {
        // CloudFront raw domain as fallback (e.g. before custom domain DNS propagates)
        protocol: 'https',
        hostname: 'd1qg5yy88wla4h.cloudfront.net',
      },
    ],
  },
}

export default nextConfig

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workaround for Node.js v22 network interface error on macOS
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Suppress network URL detection to avoid Node.js v22 os.networkInterfaces() bug
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },
};

export default nextConfig;

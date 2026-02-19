import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // PWA via service worker (use next-pwa or manual)
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
      ],
    },
  ],
}

export default nextConfig

import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Nav } from '@/components/layout/nav'

export const metadata: Metadata = {
  title: 'Aurora Mission Control',
  description: 'Aurora AI Dashboard',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Mission Control',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="bg-[#0a0a0a] text-slate-50 font-sans antialiased">
        <div className="flex h-screen overflow-hidden">
          {/* Desktop sidebar */}
          <Nav />
          {/* Main content */}
          <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}

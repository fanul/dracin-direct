import './globals.css';
import type { Metadata, Viewport } from 'next';
import { SkipLink, BottomNav } from '@/app/components/layout';

export const metadata: Metadata = {
  title: 'dracinhub - Drama Streaming Platform',
  description: 'Multi-provider short drama streaming aggregator',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#171717',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className="bg-neutral-950 text-slate-100 antialiased">
        <SkipLink />
        <div className="relative min-h-screen">
          <main id="main-content" className="mx-auto max-w-7xl">
            {children}
          </main>
          <BottomNav />
        </div>
      </body>
    </html>
  )
}

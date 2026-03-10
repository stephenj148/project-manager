import type { Metadata, Viewport } from 'next'
import { Roboto } from 'next/font/google'
import './globals.css'
import Nav from '@/components/Nav'

const roboto = Roboto({ subsets: ['latin'], weight: ['400', '500', '700'] })

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Personal project and task tracker',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.png',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Projects',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body className={`${roboto.className} antialiased`}>
        <Nav />
        <main className="max-w-5xl mx-auto px-4 md:px-8 py-6 pb-24 md:pb-10">
          {children}
        </main>
      </body>
    </html>
  )
}

'use client'

import '@fontsource/instrument-serif'
import { LPTopBar } from '@/components/layout/lp-topbar'
import Footer from '@/components/layout/footer'

export default function LandingPageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <LPTopBar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
} 
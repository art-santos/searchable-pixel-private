'use client'

import { SplitSidebar } from '@/components/layout/split-sidebar'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useEffect } from 'react'

export default function VisibilityTestLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add('dark')
    return () => document.documentElement.classList.remove('dark')
  }, [])

  return (
    <AuthenticatedLayout>
      <SidebarProvider className="dark">
        <SplitSidebar />
        <SidebarInset className="bg-[#0c0c0c]">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </AuthenticatedLayout>
  )
}

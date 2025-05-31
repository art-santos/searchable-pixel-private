'use client'

import { SplitSidebar } from '@/components/layout/split-sidebar'
import { SplitTopbar } from '@/components/layout/split-topbar'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useEffect } from 'react'

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Add dark mode to document
  useEffect(() => {
    document.documentElement.classList.add('dark')
    return () => {
      document.documentElement.classList.remove('dark')
    }
  }, [])
  
  return (
    <AuthenticatedLayout>
      <SidebarProvider className="dark">
        <SplitSidebar />
        <SidebarInset className="flex flex-col h-screen">
          <SplitTopbar />
          <div className="flex-1 min-h-0 overflow-auto">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthenticatedLayout>
  )
} 
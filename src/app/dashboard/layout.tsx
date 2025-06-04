'use client'

import { SplitSidebar } from '@/components/layout/split-sidebar'
import { SplitTopbar } from '@/components/layout/split-topbar'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SimpleWorkspaceOnboarding } from '@/components/onboarding/simple-workspace-onboarding'
import { useEffect } from 'react'

export default function DashboardLayout({
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
      <SimpleWorkspaceOnboarding>
        <SidebarProvider className="dark">
          <SplitSidebar />
          <SidebarInset className="flex flex-col min-h-screen">
            <div className="flex-1 overflow-auto">
              <SplitTopbar />
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </SimpleWorkspaceOnboarding>
    </AuthenticatedLayout>
  )
} 
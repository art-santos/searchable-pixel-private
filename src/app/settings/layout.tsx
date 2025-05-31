'use client'

import { SplitSidebar } from '@/components/layout/split-sidebar'
import { SplitTopbar } from '@/components/layout/split-topbar'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthenticatedLayout>
      <SidebarProvider>
        <SplitSidebar />
        <SidebarInset className="flex flex-col h-screen bg-[#0c0c0c]">
          <SplitTopbar />
          <div className="flex-1 min-h-0 overflow-auto">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthenticatedLayout>
  )
} 
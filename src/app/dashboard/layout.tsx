'use client'

import { SplitSidebar } from '@/components/layout/split-sidebar'
import { SplitTopbar } from '@/components/layout/split-topbar'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {

  
  return (
    <AuthenticatedLayout>
      <SidebarProvider>
        <SplitSidebar />
        <SidebarInset className="flex flex-col min-h-screen">
          <div className="flex-1 overflow-auto">
            <SplitTopbar />
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthenticatedLayout>
  )
} 
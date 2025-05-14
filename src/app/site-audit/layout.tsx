'use client'

import { SplitSidebar } from '@/components/split-sidebar'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function SiteAuditLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthenticatedLayout>
      <SidebarProvider>
        <SplitSidebar />
        <SidebarInset className="bg-[#0c0c0c]">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </AuthenticatedLayout>
  )
} 
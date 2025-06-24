'use client'

import { SplitSidebar } from '@/components/layout/split-sidebar'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import { useState } from 'react'

export default function ApiKeysLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <AuthenticatedLayout>
      <div className="h-screen bg-[#f9f9f9] flex">
        {/* Permanent Sidebar */}
        <div className={`${sidebarCollapsed ? 'w-[72px]' : 'w-60'} flex-shrink-0 bg-white transition-all duration-300 ease-out`}>
          <SplitSidebar 
            isCollapsed={sidebarCollapsed}
            onToggle={handleSidebarToggle}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Page Content */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
} 
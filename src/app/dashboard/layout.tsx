'use client'

import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthenticatedLayout>
      <div className="h-screen bg-[#f9f9f9] flex">
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
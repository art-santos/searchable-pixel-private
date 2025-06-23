'use client'

import { SplitSidebar } from '@/components/layout/split-sidebar'
import { SplitTopbar } from '@/components/layout/split-topbar'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import { useState } from 'react'

export default function DashboardLayout({
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
      <div className="min-h-screen bg-[#f9f9f9] flex">
        {/* Permanent Sidebar */}
        <div className={`${sidebarCollapsed ? 'w-[72px]' : 'w-60'} flex-shrink-0 bg-white transition-all duration-300 ease-out`}>
          <SplitSidebar 
            isCollapsed={sidebarCollapsed}
            onToggle={handleSidebarToggle}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top Bar */}
          <SplitTopbar 
            sidebarCollapsed={sidebarCollapsed}
            onSidebarToggle={handleSidebarToggle}
          />
          
          {/* Page Content */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </div>

      {/* Styles for light theme components */}
      <style>{`
        /* Light theme for domain selector */
        .domain-selector-light > div {
          min-width: 200px;
        }
        
        .domain-selector-light button[data-state="closed"],
        .domain-selector-light button[data-state="open"] {
          background-color: transparent;
          border: none;
          padding: 0.5rem 0.75rem;
          height: auto;
          border-radius: 0;
          font-size: 0.9375rem;
          display: flex;
          align-items: center;
          width: 100%;
          justify-content: space-between;
          transition: background-color 0.15s ease;
        }
        
        .domain-selector-light button[data-state="closed"]:hover,
        .domain-selector-light button[data-state="open"]:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
        
        .domain-selector-light button > div {
          gap: 0.5rem !important;
          flex: 1;
          display: flex;
          align-items: center;
        }
        
        .domain-selector-light button svg {
          margin-left: 0.25rem !important;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }
        
        .domain-selector-light button[data-state="open"] svg {
          transform: rotate(180deg);
        }
        
        .domain-selector-light span {
          color: #000 !important;
        }
        
        .domain-selector-light span.truncate {
          overflow: visible !important;
          text-overflow: clip !important;
          white-space: nowrap !important;
          max-width: none !important;
        }
        
        .domain-selector-light svg {
          color: #666 !important;
        }
        
        /* Light theme for search bar */
        .search-bar-light input {
          color: #1f2937 !important;
          background-color: transparent !important;
        }
        
        .search-bar-light input::placeholder {
          color: #6b7280 !important;
        }
        
        .search-bar-light svg {
          color: #6b7280 !important;
        }
        
        .search-bar-light [class*="border-gray"] {
          border-color: #d1d5db !important;
          background-color: transparent !important;
        }
        
        .search-bar-light [class*="text-gray"] {
          color: #374151 !important;
        }
      `}</style>
    </AuthenticatedLayout>
  )
} 
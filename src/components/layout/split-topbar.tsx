"use client"

import * as React from "react"
import { SearchBar } from "./search-bar"
import { DomainSelector } from "@/components/custom/domain-selector"
import { Bell, PanelRight } from 'lucide-react'

interface SplitTopbarProps {
  sidebarCollapsed?: boolean
  onSidebarToggle?: () => void
}

export function SplitTopbar({ sidebarCollapsed = false, onSidebarToggle }: SplitTopbarProps) {
  return (
    <div className="w-full pb-4">
      <div className="w-full">
        <div className="h-[76px] sm:h-[76px] bg-white">
          <div className="h-full w-full flex items-center px-6">
            {/* Left Section - Expand button when collapsed */}
            {sidebarCollapsed && (
              <div className="flex items-center mr-4">
                <button
                  onClick={onSidebarToggle}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
                >
                  <PanelRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Search Section */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Search Bar */}
              <div className="max-w-xl flex-1 search-bar-light min-w-0">
                <SearchBar />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Notifications Bell */}
              <button className="p-1.5 text-gray-500 hover:text-gray-700 transition-colors">
                <Bell className="w-4 h-4" />
              </button>

              {/* Domain Selector */}
              <div className="domain-selector-light hidden sm:block">
                <DomainSelector showAddButton position="topbar" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
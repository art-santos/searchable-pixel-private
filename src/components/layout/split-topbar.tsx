"use client"

import * as React from "react"
import { SearchBar } from "./search-bar"
import { DomainSelector } from "@/components/custom/domain-selector"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export function SplitTopbar() {
  return (
    <div className="h-16 border-b border-gray-200 dark:border-[#222222] bg-white dark:bg-[#0c0c0c] flex items-center justify-between px-4">
      <SearchBar />
      <div className="flex items-center gap-3">
        <ThemeToggle size="sm" />
        <DomainSelector showAddButton position="topbar" />
      </div>
    </div>
  )
} 
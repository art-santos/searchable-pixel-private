"use client"

import * as React from "react"
import { SearchBar } from "./search-bar"
import { DomainSelector } from "@/components/custom/domain-selector"

export function SplitTopbar() {
  return (
    <div className="h-16 border-b border-[#222222] bg-[#0c0c0c] flex items-center justify-between px-4">
      <SearchBar />
      <DomainSelector showAddButton position="topbar" />
    </div>
  )
} 
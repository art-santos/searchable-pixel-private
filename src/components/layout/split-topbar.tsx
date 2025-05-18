"use client"

import * as React from "react"
import { SearchBar } from "./search-bar"

export function SplitTopbar() {
  return (
    <div className="sticky top-0 z-40 h-16 border-b border-[#222222] bg-[#0c0c0c] flex items-center ml-16 px-4">
      <SearchBar />
    </div>
  )
} 
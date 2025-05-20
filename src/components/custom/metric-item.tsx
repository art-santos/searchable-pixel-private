import React from "react"
import { cn } from "@/lib/utils"

export interface MetricChange {
  value: number
  positive: boolean
}

export interface MetricItemProps {
  rank?: number
  label: string
  change?: MetricChange
  link?: string
  leftContent?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

export function MetricItem({
  rank,
  label,
  change,
  link,
  leftContent,
  className,
  children,
}: MetricItemProps) {
  return (
    <div className={cn("flex items-center justify-between border border-[#222] bg-[#111111] px-6 py-2 w-full", className)}>
      <div className="flex items-center gap-3 min-w-0">
        {leftContent}
        {rank !== undefined && (
          <span className="text-[#666] text-lg font-mono tracking-tight w-8">#{rank}</span>
        )}
        <span className="text-white text-base truncate max-w-[220px]">{label}</span>
      </div>
      <div className="flex items-center gap-6">
        {change && (
          <span className={cn(
            "text-sm font-mono tracking-tight",
            change.positive ? "text-green-500" : "text-red-500"
          )}>
            {change.positive ? "↑" : "↓"}
            {change.value}%
          </span>
        )}
        {children}
        {link && (
          <a
            href={link}
            className="text-sm text-[#aaa] hover:text-white transition-colors font-geist tracking-tight flex items-center gap-1"
          >
            View <span className="text-lg">→</span>
          </a>
        )}
      </div>
    </div>
  )
}

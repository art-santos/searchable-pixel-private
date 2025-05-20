import React from "react"
import { cn } from "@/lib/utils"

export interface ProgressBarSegment {
  value: number
  color: string
}

export interface ProgressBarProps {
  segments: ProgressBarSegment[]
  className?: string
}

export function ProgressBar({ segments, className }: ProgressBarProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  return (
    <div className={cn("flex w-full h-4 bg-[#232323]", className)}>
      {segments.map((seg, i) => (
        <div
          key={i}
          style={{
            width: `${(seg.value / total) * 100}%`,
            background: seg.color,
          }}
          className="h-full"
        />
      ))}
    </div>
  )
}

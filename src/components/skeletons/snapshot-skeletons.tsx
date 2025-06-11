'use client'

import { Skeleton, SkeletonText, SkeletonCircle, SkeletonCard } from '@/components/ui/skeleton'
import { ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'

// Skeleton for snapshot history sidebar items
export function SnapshotHistorySkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(8)].map((_, i) => (
        <SkeletonCard 
          key={i}
          className="bg-[#1C1C1C] border border-[#333] p-3 animate-pulse"
          style={{ 
            animationDelay: `${i * 50}ms`,
            animationDuration: '1.5s' 
          }}
        >
          {/* Header with Favicon, Info, and Score */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <SkeletonCircle size="sm" className="w-4 h-4" />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-zinc-700 rounded-full animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <Skeleton className="h-3.5 w-32 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            
            {/* Score Badge */}
            <div className="flex-shrink-0">
              <Skeleton className="h-6 w-10 rounded" />
            </div>
          </div>

          {/* URL and Arrow */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 flex-1 mr-2" />
            <Skeleton className="h-3 w-3 flex-shrink-0" />
          </div>
        </SkeletonCard>
      ))}
    </div>
  )
}

// Skeleton for snapshot history sidebar when empty state would show
export function SnapshotHistoryEmptySkeleton() {
  return (
    <div className="text-center py-16">
      <SkeletonCircle size="xl" className="w-16 h-16 mx-auto mb-4 bg-[#2A2A2A]" />
      <Skeleton className="h-4 w-40 mx-auto mb-2" />
      <div className="space-y-1">
        <Skeleton className="h-3 w-48 mx-auto" />
        <Skeleton className="h-3 w-32 mx-auto" />
      </div>
    </div>
  )
}

// Skeleton for the main snapshot report page loading
export function SnapshotReportSkeleton() {
  return (
    <main className="min-h-screen bg-[#0c0c0c]">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard/snapshot"
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Return to snapshots</span>
          </Link>
        </div>

        {/* Loading State */}
        <div className="space-y-6">
          <SkeletonCard className="bg-zinc-900/20 border border-zinc-800 rounded-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 animate-spin rounded-full border border-zinc-500 border-t-transparent" />
                <span className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Loading</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <Skeleton className="w-72 h-4" />
              <Skeleton className="w-48 h-6" />
            </div>
          </SkeletonCard>

          {/* Skeleton Results */}
          <div className="py-8">
            <div className="grid grid-cols-12 gap-12 items-center">
              <div className="col-span-12 lg:col-span-4 flex items-center justify-center">
                <div className="relative w-64 h-64">
                  <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      className="text-zinc-800"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 animate-spin rounded-full border border-zinc-600 border-t-transparent" />
                  </div>
                </div>
              </div>
              
              <div className="col-span-12 lg:col-span-8 space-y-6">
                <div className="space-y-4">
                  <Skeleton className="w-48 h-4" />
                  <Skeleton className="w-3/4 h-8" />
                  <Skeleton className="w-full h-4" />
                  <Skeleton className="w-2/3 h-4" />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i}>
                      <Skeleton className="w-20 h-3 mb-2" />
                      <Skeleton className="w-12 h-6" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

// Skeleton for processing steps in snapshot report
export function SnapshotProcessingSkeleton() {
  const steps = [
    { label: 'Page content scraped', status: 'completed' },
    { label: 'Running AI visibility tests', status: 'processing' },
    { label: 'Technical health audit', status: 'pending' },
    { label: 'Generating report', status: 'pending' }
  ]

  return (
    <div className="space-y-3">
      <div className="text-zinc-400 text-sm font-medium mb-3">Processing Steps:</div>
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div 
            key={i}
            className="flex items-center gap-3"
            style={{ 
              animationDelay: `${i * 200}ms`,
            }}
          >
            {step.status === 'completed' && (
              <div className="w-4 h-4 bg-emerald-400 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-emerald-900 rounded-full" />
              </div>
            )}
            {step.status === 'processing' && (
              <div className="w-4 h-4 animate-spin rounded-full border border-zinc-500 border-t-transparent" />
            )}
            {step.status === 'pending' && (
              <SkeletonCircle size="sm" className="w-4 h-4 bg-zinc-700" />
            )}
            <span className={`text-sm ${
              step.status === 'completed' ? 'text-zinc-300' : 
              step.status === 'processing' ? 'text-zinc-300' : 
              'text-zinc-500'
            }`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Skeleton for main page loading spinner replacement
export function SnapshotPageSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0c0c0c] flex items-center justify-center">
      <div className="text-center space-y-4">
        <SkeletonCircle size="lg" className="w-12 h-12 mx-auto" />
        <div className="space-y-2">
          <Skeleton className="w-32 h-4 mx-auto" />
          <Skeleton className="w-48 h-3 mx-auto" />
        </div>
      </div>
    </div>
  )
} 
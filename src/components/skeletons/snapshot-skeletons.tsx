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
          className="bg-white border border-gray-200 p-3 animate-pulse rounded-lg shadow-sm"
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
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-gray-300 rounded-full animate-pulse" />
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
      <SkeletonCircle size="xl" className="w-16 h-16 mx-auto mb-4 bg-gray-100" />
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
    <main className="min-h-screen bg-[#f9f9f9]">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard/snapshot"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Return to snapshots</span>
          </Link>
        </div>

        {/* Loading State */}
        <div className="space-y-6">
          <SkeletonCard className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 animate-spin rounded-full border border-gray-400 border-t-transparent" />
                <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Loading</span>
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
                      className="text-gray-200"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 animate-spin rounded-full border border-gray-400 border-t-transparent" />
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
      <div className="text-gray-500 text-sm font-medium mb-3">Processing Steps:</div>
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
              <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            )}
            {step.status === 'processing' && (
              <div className="w-4 h-4 animate-spin rounded-full border border-gray-400 border-t-transparent" />
            )}
            {step.status === 'pending' && (
              <SkeletonCircle size="sm" className="w-4 h-4 bg-gray-200" />
            )}
            <span className={`text-sm ${
              step.status === 'completed' ? 'text-gray-700' : 
              step.status === 'processing' ? 'text-gray-700' : 
              'text-gray-500'
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
    <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center">
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
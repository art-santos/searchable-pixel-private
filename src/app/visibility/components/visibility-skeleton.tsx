import { motion } from 'framer-motion'

const Skeleton = ({ className = "" }: { className?: string }) => (
  <div 
    className={`relative overflow-hidden ${className}`}
    style={{
      background: 'linear-gradient(90deg, #2a2a2a 25%, #333333 50%, #2a2a2a 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 2s infinite linear'
    }}
  />
)

// Add global styles for shimmer animation
if (typeof window !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes shimmer {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
  `
  if (!document.head.querySelector('style[data-shimmer]')) {
    style.setAttribute('data-shimmer', 'true')
    document.head.appendChild(style)
  }
}

export function CitationsTabSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64 rounded-md" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-32 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>

      {/* Citations List */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-lg border border-[#222] p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-1/2 rounded-md" />
              </div>
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-5/6 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function GapsTabSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* Gaps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-[#222] p-6 space-y-4">
            <div className="flex items-start gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-1/2 rounded-md" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-5/6 rounded-md" />
              <Skeleton className="h-4 w-4/6 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function VisibilityPageSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-8">
      {/* Chart Section */}
      <div className="col-span-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-4 rounded-md" />
          <Skeleton className="h-12 w-32 rounded-md" />
        </div>
        <Skeleton className="h-[500px] w-full rounded-lg" />
      </div>

      {/* Overview Section */}
      <div className="col-span-4 space-y-6">
        <div className="rounded-lg border border-[#222] p-6 space-y-4">
          <Skeleton className="h-6 w-3/4 rounded-md" />
          <Skeleton className="h-24 w-full rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-5/6 rounded-md" />
            <Skeleton className="h-4 w-4/6 rounded-md" />
            <Skeleton className="h-4 w-3/6 rounded-md" />
          </div>
        </div>

        <div className="rounded-lg border border-[#222] p-6 space-y-4">
          <Skeleton className="h-6 w-3/4 rounded-md" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 
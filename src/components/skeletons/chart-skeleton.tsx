import { motion, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton"

interface ChartSkeletonProps {
  className?: string
  showHeader?: boolean
  headerTitle?: string
  showStats?: boolean
}

export function ChartSkeleton({ 
  className,
  showHeader = true,
  headerTitle = "Chart",
  showStats = true
}: ChartSkeletonProps) {
  const shouldReduceMotion = useReducedMotion()

  // Chart data points animation - fast & responsive per animation principles
  const chartVariants = shouldReduceMotion ? {} : {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.2,
        ease: "easeOut",
        staggerChildren: 0.02
      }
    }
  }

  const barVariants = shouldReduceMotion ? {} : {
    hidden: { scaleY: 0.8, opacity: 0 },
    visible: {
      scaleY: 1,
      opacity: 1,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    }
  }

  return (
    <SkeletonCard className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      {showHeader && (
        <div className="pb-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Skeleton className="h-6 w-32" />
                {showStats && <Skeleton className="h-5 w-16 rounded-full" />}
              </div>
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      )}

      {/* Chart Area */}
      <div className="flex-1 pt-6 relative">
        <div className="h-full relative">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full w-10 flex flex-col justify-between py-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-8" />
            ))}
          </div>

          {/* Chart bars/lines */}
          <div className="ml-12 mr-4 h-full flex items-end justify-between">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 flex-1 max-w-8"
              >
                {/* Bar */}
                <Skeleton 
                  className="w-full"
                  style={{ 
                    height: `${Math.random() * 60 + 20}%`,
                  }}
                />
                {/* X-axis label */}
                <Skeleton className="h-3 w-6" />
              </div>
            ))}
          </div>

          {/* Grid lines */}
          <div className="absolute inset-0 ml-12 mr-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton 
                key={i}
                className="absolute w-full h-px opacity-30"
                style={{ top: `${(i + 1) * 20}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </SkeletonCard>
  )
} 
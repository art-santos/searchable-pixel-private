import { motion, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Skeleton, SkeletonCard, SkeletonCircle } from "@/components/ui/skeleton"

interface ListSkeletonProps {
  className?: string
  items?: number
  showHeader?: boolean
  itemType?: 'crawler' | 'page' | 'basic'
  showProgress?: boolean
}

export function ListSkeleton({ 
  className,
  items = 5,
  showHeader = true,
  itemType = 'basic',
  showProgress = false
}: ListSkeletonProps) {
  const shouldReduceMotion = useReducedMotion()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.15,
        staggerChildren: 0.02
      }
    }
  }

  const itemVariants = shouldReduceMotion 
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, x: -10 },
        visible: {
          opacity: 1,
          x: 0,
          transition: {
            duration: 0.2,
            ease: "easeOut"
          }
        }
      }

  const progressVariants = shouldReduceMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { scaleX: 0 },
        visible: {
          scaleX: 1,
          transition: {
            duration: 0.25,
            ease: "easeOut",
            delay: 0.1
          }
        }
      }

  return (
    <SkeletonCard className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      {showHeader && (
        <div className="pb-3 pt-5 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      )}

      {/* List Items */}
      <div className="flex-1 pt-3 pb-4 overflow-hidden">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {Array.from({ length: items }).map((_, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group"
            >
              {itemType === 'crawler' && (
                <CrawlerListItem 
                  index={index} 
                  showProgress={showProgress}
                  progressVariants={progressVariants}
                />
              )}
              {itemType === 'page' && (
                <PageListItem 
                  index={index} 
                  showProgress={showProgress}
                />
              )}
              {itemType === 'basic' && (
                <BasicListItem 
                  index={index} 
                  showProgress={showProgress}
                  progressVariants={progressVariants}
                />
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </SkeletonCard>
  )
}

// Crawler attribution item skeleton
function CrawlerListItem({ 
  index, 
  showProgress, 
  progressVariants 
}: { 
  index: number
  showProgress: boolean
  progressVariants: any 
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between py-2 px-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-7 h-7 rounded-lg" />
          <div>
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-4 w-12" />
      </div>
      
      {showProgress && (
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mx-3">
          <motion.div
            className="h-full bg-gray-300 rounded-full"
            variants={progressVariants}
            style={{
              width: `${Math.random() * 60 + 20}%`,
              transformOrigin: 'left'
            }}
          />
        </div>
      )}
    </div>
  )
}

// Page attribution item skeleton  
function PageListItem({ 
  index, 
  showProgress 
}: { 
  index: number
  showProgress: boolean 
}) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg">
      <div className="flex items-center gap-3 flex-1">
        <Skeleton className="w-7 h-7 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-4 w-32 mb-1" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-2" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <Skeleton className="h-4 w-8 mb-1" />
          <Skeleton className="h-3 w-12" />
        </div>
        {showProgress && (
          <div className="w-1 h-6 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="w-full bg-gray-300 rounded-full"
              initial={{ height: 0 }}
              animate={{ height: `${Math.random() * 80 + 20}%` }}
              transition={{ 
                delay: index * 0.02 + 0.1, 
                duration: 0.25, 
                ease: "easeOut" 
              }}
              style={{ transformOrigin: 'bottom' }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Basic list item skeleton
function BasicListItem({ 
  index, 
  showProgress, 
  progressVariants 
}: { 
  index: number
  showProgress: boolean
  progressVariants: any 
}) {
  return (
    <div className="flex items-center gap-3">
      <SkeletonCircle size="sm" />
      <div className="flex-1">
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      {showProgress && (
        <Skeleton className="h-4 w-12" />
      )}
    </div>
  )
} 
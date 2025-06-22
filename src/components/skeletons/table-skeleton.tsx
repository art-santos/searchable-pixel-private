'use client'

import { Skeleton, SkeletonCircle, SkeletonCard } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'

interface TableSkeletonProps {
  rows?: number
  columns?: Array<{
    span: number
    align?: 'left' | 'center' | 'right'
  }>
  showExpandableRows?: boolean
  className?: string
}

export function TableSkeleton({ 
  rows = 8, 
  columns = [
    { span: 4, align: 'left' },
    { span: 2, align: 'center' },
    { span: 2, align: 'center' },
    { span: 2, align: 'center' },
    { span: 2, align: 'right' }
  ],
  showExpandableRows = true,
  className = ""
}: TableSkeletonProps) {
  
  const containerVariants = {
    visible: {
      transition: {
        staggerChildren: 0.05
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  }

  return (
    <SkeletonCard className={`bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm ${className}`}>
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
        {columns.map((col, index) => (
          <div key={index} className={`col-span-${col.span} ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}`}>
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Table Body */}
      <motion.div 
        className="divide-y divide-gray-200"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {[...Array(rows)].map((_, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            className="group"
          >
            {/* Main Row */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
              {columns.map((col, colIndex) => (
                <div key={colIndex} className={`col-span-${col.span} flex items-center ${col.align === 'center' ? 'justify-center' : col.align === 'right' ? 'justify-end' : ''}`}>
                  {colIndex === 0 ? (
                    // First column with icon and text
                    <div className="flex items-center gap-3 w-full">
                      {showExpandableRows && (
                        <Skeleton className="w-4 h-4" />
                      )}
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-50 border border-gray-200 rounded-lg">
                        <Skeleton className="w-4 h-4 rounded" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Skeleton className="h-3.5 w-32 mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ) : (
                    // Other columns with simple text
                    <Skeleton className={`h-3.5 ${col.align === 'center' ? 'w-16' : col.align === 'right' ? 'w-20' : 'w-24'}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Expandable Content (show for some rows) */}
            {showExpandableRows && index < 3 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.5, duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="mb-3">
                    <Skeleton className="h-3.5 w-24 mb-2" />
                  </div>
                  <div className="space-y-2 max-h-64">
                    {[...Array(3)].map((_, subIndex) => (
                      <div key={subIndex} className="flex items-center justify-between py-2 px-3 bg-white border border-gray-200 rounded">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex items-center justify-center w-6 h-6 bg-gray-100 border border-gray-200 rounded">
                            <Skeleton className="w-3 h-3 rounded" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Skeleton className="h-3 w-40 mb-1" />
                            <Skeleton className="h-2.5 w-24" />
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </SkeletonCard>
  )
} 
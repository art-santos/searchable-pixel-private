import { cn } from "@/lib/utils"
import { motion, useReducedMotion } from "framer-motion"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Animation speed: 'fast' (1s), 'normal' (2s), 'slow' (3s) */
  speed?: 'fast' | 'normal' | 'slow'
  /** Whether to show a subtle pulse animation */
  pulse?: boolean
}

const speedMap = {
  fast: 1,
  normal: 2,
  slow: 3
}

export function Skeleton({ 
  className, 
  speed = 'normal', 
  pulse = true,
  ...props 
}: SkeletonProps) {
  const shouldReduceMotion = useReducedMotion()
  const duration = speedMap[speed]

  // Respect prefers-reduced-motion
  if (shouldReduceMotion) {
    return (
      <div
        className={cn(
          "bg-gray-200 dark:bg-[#1a1a1a] rounded-md opacity-50",
          className
        )}
        {...props}
      />
    )
  }

  return (
    <motion.div
      className={cn(
        "bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-[#1a1a1a] dark:via-[#252525] dark:to-[#1a1a1a] rounded-md",
        "bg-[length:200%_100%]",
        className
      )}
      style={{
        backgroundPosition: pulse ? '-200% 0' : '0 0',
      }}
      animate={pulse ? {
        backgroundPosition: ['200% 0', '-200% 0']
      } : {}}
      transition={{
        duration,
        repeat: Infinity,
        ease: "linear"
      }}
      {...props}
    />
  )
}

// Specific skeleton shapes for common UI elements
export function SkeletonText({ 
  lines = 1, 
  className,
  ...props 
}: { 
  lines?: number 
  className?: string 
} & SkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
          )}
          {...props}
        />
      ))}
    </div>
  )
}

export function SkeletonCircle({ 
  size = 'md',
  className,
  ...props 
}: { 
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string 
} & SkeletonProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  return (
    <Skeleton
      className={cn(
        sizeClasses[size],
        "rounded-full",
        className
      )}
      {...props}
    />
  )
}

export function SkeletonCard({ 
  className,
  children,
  ...props 
}: { 
  children?: React.ReactNode
  className?: string 
} & SkeletonProps) {
  return (
    <div className={cn(
      "bg-white dark:bg-[#0c0c0c] border border-gray-200 dark:border-[#1a1a1a] rounded-lg p-6",
      className
    )}>
      {children}
    </div>
  )
}

'use client'

import { motion } from 'framer-motion'

interface ContextQualityIndicatorProps {
  contextScore: number // 0-1 score
  label?: string
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ContextQualityIndicator({ 
  contextScore, 
  label = "Context Quality",
  showPercentage = true,
  size = 'md',
  className = ""
}: ContextQualityIndicatorProps) {
  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2', 
    lg: 'w-3 h-3'
  }
  
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`${textSizes[size]} text-[#666]`}>{label}:</span>
      <div className="flex items-center gap-1">
        {[1,2,3,4,5].map(i => (
          <motion.div 
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.2 }}
            className={`${dotSizes[size]} rounded-full ${
              i <= Math.floor(contextScore * 5) ? 'bg-green-500' : 'bg-[#333]'
            }`}
          />
        ))}
      </div>
      {showPercentage && (
        <span className={`${textSizes[size]} text-white`}>
          {Math.round(contextScore * 100)}%
        </span>
      )}
    </div>
  )
} 
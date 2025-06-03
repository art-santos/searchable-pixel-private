'use client'

import { Brain } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'

interface KnowledgePoweredBadgeProps {
  className?: string
  size?: 'sm' | 'md'
  showIcon?: boolean
  animated?: boolean
}

export function KnowledgePoweredBadge({ 
  className = "",
  size = 'md',
  showIcon = true,
  animated = true
}: KnowledgePoweredBadgeProps) {
  const Component = animated ? motion.div : 'div'
  const animationProps = animated ? {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { duration: 0.2 }
  } : {}

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3 h-3'
  }

  const badgeText = {
    sm: 'text-xs',
    md: 'text-xs'
  }

  return (
    <Component {...animationProps}>
      <Badge className={`bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 ${badgeText[size]} ${className}`}>
        {showIcon && <Brain className={`${iconSizes[size]} mr-1`} />}
        Knowledge-Powered
      </Badge>
    </Component>
  )
} 
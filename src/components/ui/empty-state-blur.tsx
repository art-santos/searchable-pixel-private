import { ReactNode } from 'react'
import { LinkIcon } from 'lucide-react'
import { motion } from 'framer-motion'

interface EmptyStateBlurProps {
  children: ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  showAction?: boolean
  hasData: boolean
}

export function EmptyStateBlur({
  children,
  title,
  description,
  actionLabel = "Connect Analytics",
  onAction,
  showAction = true,
  hasData
}: EmptyStateBlurProps) {
  return (
    <div className="relative h-full flex flex-col">
      {/* Preview */}
      <motion.div 
        className={`absolute inset-0 ${hasData ? '' : 'opacity-30 blur-sm pointer-events-none'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: hasData ? 1 : 0.3 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {children}
      </motion.div>

      {/* Empty state message */}
      {!hasData && (
        <motion.div 
          className="absolute inset-0 flex items-center justify-center z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div className="text-center max-w-sm">
            <h4 className="text-black dark:text-white font-medium mb-2">{title}</h4>
            <p className="text-gray-600 dark:text-[#666] text-sm mb-6 leading-relaxed">
              {description}
            </p>
            {showAction && onAction && (
              <button 
                onClick={onAction}
                className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                <LinkIcon className="w-4 h-4" />
                {actionLabel}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
} 
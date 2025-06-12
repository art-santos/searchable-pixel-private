import { ReactNode } from 'react'
import { LinkIcon } from 'lucide-react'

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
      {/* Preview - takes full height */}
      <div className={`absolute inset-0 ${hasData ? '' : 'opacity-30 blur-sm pointer-events-none'}`}>
        {children}
      </div>

      {/* Empty state message - absolute positioned overlay */}
      {!hasData && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
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
        </div>
      )}
    </div>
  )
} 
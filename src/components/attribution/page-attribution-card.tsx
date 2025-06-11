import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { motion, useReducedMotion } from "framer-motion"
import { Eye } from "lucide-react"
import Link from "next/link"
import { PageData } from "@/types/attribution"
import { ListSkeleton } from "@/components/skeletons"

interface PageAttributionCardProps {
  pageData: PageData[]
  isLoading?: boolean
}

const getPathIcon = (path: string) => {
  if (path === '/robots.txt') return '🤖'
  if (path === '/sitemap.xml') return '🗺️'
  if (path === '/llms.txt') return '🧠'
  if (path === '/') return '🏠'
  if (path.includes('/api/')) return '⚡'
  if (path.includes('/blog/')) return '📝'
  if (path.includes('/docs/')) return '📚'
  return '📄'
}

const formatRelativeTime = (timeStr: string) => {
  const now = new Date()
  const time = new Date(timeStr)
  const diffMs = now.getTime() - time.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  
  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return time.toLocaleDateString()
}

export function PageAttributionCard({ pageData, isLoading = false }: PageAttributionCardProps) {
  const shouldReduceMotion = useReducedMotion()

  // Show skeleton while loading
  if (isLoading) {
    return (
      <ListSkeleton 
        itemType="page"
        items={6}
        showProgress={true}
        className="h-full"
      />
    )
  }

  return (
    <Card className="h-full bg-white dark:bg-[#0c0c0c] border-gray-200 dark:border-[#1a1a1a]">
      <CardHeader className="pb-4 pt-4 pl-6 pr-6 flex-shrink-0 border-b border-gray-200 dark:border-[#1a1a1a]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-1">
              Crawls by Page
            </h3>
            <p className="text-sm text-gray-500 dark:text-[#666]">
              {pageData.reduce((sum, p) => sum + p.totalCrawls, 0).toLocaleString()} total page crawls
            </p>
          </div>
          <Link 
            href="/dashboard/attribution/page"
            className="text-sm text-gray-600 dark:text-[#888] hover:text-black dark:hover:text-white transition-colors flex items-center gap-1"
          >
            <Eye className="w-4 h-4" />
            View All
          </Link>
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 pt-4 pr-6 pb-6 pl-6 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-1">
            {pageData.slice(0, 6).map((page, index) => (
              <motion.div
                key={page.path}
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { 
                    opacity: 1, 
                    y: 0, 
                    transition: { 
                      duration: 0.2, 
                      ease: 'easeOut',
                      delay: index * 0.05 
                    } 
                  }
                }}
                className="group relative"
              >
                <div className="flex items-center justify-between py-3 px-3 hover:bg-gray-50 dark:hover:bg-[#0f0f0f] rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-[#1a1a1a]">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] group-hover:bg-gray-200 dark:group-hover:bg-[#222] transition-colors">
                      <span className="text-sm">{getPathIcon(page.path)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-black dark:text-white font-mono truncate mb-1">{page.path}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-[#666]">
                        <span>{page.uniqueCrawlers} crawlers</span>
                        <span>•</span>
                        <span>{formatRelativeTime(page.lastCrawled)}</span>
                        <span>•</span>
                        <span>{page.avgResponse}ms</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-black dark:text-white">{page.totalCrawls}</div>
                      <div className="text-xs text-gray-500 dark:text-[#666]">crawls</div>
                    </div>
                    <div className="w-1 h-8 bg-gray-200 dark:bg-[#1a1a1a] rounded-full overflow-hidden">
                      <motion.div 
                        className="w-full bg-black dark:bg-white rounded-full"
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.min((page.totalCrawls / Math.max(...pageData.map(p => p.totalCrawls))) * 100, 100)}%` }}
                        transition={{ delay: index * 0.1 + 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 
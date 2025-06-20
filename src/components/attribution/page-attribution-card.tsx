import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { motion, useReducedMotion } from "framer-motion"
import { Eye } from "lucide-react"
import Link from "next/link"
import { PageData } from "@/types/attribution"
import { ListSkeleton } from "@/components/skeletons"
import { EmptyStateBlur } from "@/components/ui/empty-state-blur"

interface PageAttributionCardProps {
  pageData: PageData[]
  isLoading?: boolean
  onConnectAnalytics?: () => void
}

// Mock data for empty state preview
const mockPageData: PageData[] = [
  { path: '/', totalCrawls: 45, uniqueCrawlers: 3, lastCrawled: '2024-01-15T10:30:00Z', avgResponse: 120 },
  { path: '/blog', totalCrawls: 38, uniqueCrawlers: 3, lastCrawled: '2024-01-15T09:15:00Z', avgResponse: 95 },
  { path: '/docs', totalCrawls: 32, uniqueCrawlers: 2, lastCrawled: '2024-01-15T08:45:00Z', avgResponse: 110 },
  { path: '/api/health', totalCrawls: 28, uniqueCrawlers: 4, lastCrawled: '2024-01-15T08:00:00Z', avgResponse: 45 },
  { path: '/robots.txt', totalCrawls: 25, uniqueCrawlers: 5, lastCrawled: '2024-01-15T07:30:00Z', avgResponse: 25 },
  { path: '/sitemap.xml', totalCrawls: 22, uniqueCrawlers: 4, lastCrawled: '2024-01-15T07:00:00Z', avgResponse: 35 }
]

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

export function PageAttributionCard({ pageData, isLoading = false, onConnectAnalytics }: PageAttributionCardProps) {
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

  const hasData = pageData.length > 0 && pageData.some(page => page.totalCrawls > 0)
  const displayData = hasData ? pageData : mockPageData

  const CardComponent = () => (
    <Card className="h-full bg-white dark:bg-[#0c0c0c] border-gray-200 dark:border-[#1a1a1a]">
      <CardHeader className="pb-4 pt-4 pl-6 pr-6 flex-shrink-0 border-b border-gray-200 dark:border-[#1a1a1a]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-1">
              Crawls by Page
            </h3>
            <p className="text-sm text-gray-500 dark:text-[#666]">
              {displayData.reduce((sum, p) => sum + p.totalCrawls, 0).toLocaleString()} total page crawls
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
            {displayData.slice(0, 6).map((page, index) => (
              <motion.div
                key={page.path}
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { 
                    opacity: 1, 
                    transition: { 
                      duration: 0.2, 
                      ease: 'easeOut'
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
                      <div className="text-sm text-black dark:text-white font-medium truncate mb-1">{page.path}</div>
                      <div className="text-xs text-gray-500 dark:text-[#666]">
                        {page.uniqueCrawlers} crawlers • {formatRelativeTime(page.lastCrawled)} • {page.avgResponse}ms
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
                        animate={{ height: `${Math.min((page.totalCrawls / Math.max(...displayData.map(p => p.totalCrawls))) * 100, 100)}%` }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
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

  return (
    <EmptyStateBlur
      hasData={hasData}
      title="No data yet"
      description="See which pages on your site are being crawled by AI engines"
      onAction={onConnectAnalytics}
    >
      <CardComponent />
    </EmptyStateBlur>
  )
} 
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
    <Card className="h-full bg-white border-gray-200 shadow-sm flex flex-col">
      <CardHeader className="pb-3 pt-4 pl-6 pr-6 flex-shrink-0 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Crawls by Page
            </h3>
            <p className="text-sm text-gray-600">
              {displayData.reduce((sum, p) => sum + p.totalCrawls, 0).toLocaleString()} total page crawls
            </p>
          </div>
          <Link 
            href="/dashboard/attribution/page"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1.5 font-medium"
          >
            <Eye className="w-4 h-4" />
            View All
          </Link>
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 pt-3 pr-4 pb-3 pl-4 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <div className="space-y-1">
            {displayData.slice(0, 5).map((page, index) => (
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
                <div className="flex items-center justify-between py-2 px-2 hover:bg-gray-50 rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="flex items-center justify-center w-6 h-6 rounded bg-gray-50 border border-gray-200 group-hover:bg-gray-100 transition-colors">
                      <span className="text-xs">{getPathIcon(page.path)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-gray-900 font-medium truncate">{page.path}</div>
                      <div className="text-xs text-gray-600">
                        {page.uniqueCrawlers} crawlers • {formatRelativeTime(page.lastCrawled)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-gray-900">{page.totalCrawls}</div>
                      <div className="text-xs text-gray-600">crawls</div>
                    </div>
                    <div className="w-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        className="w-full bg-gray-900 rounded-full"
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
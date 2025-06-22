import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { motion, useReducedMotion } from "framer-motion"
import { Eye } from "lucide-react"
import Link from "next/link"
import { CrawlerData } from "@/types/attribution"
import { ListSkeleton } from "@/components/skeletons"
import { EmptyStateBlur } from "@/components/ui/empty-state-blur"

interface CrawlerAttributionCardProps {
  crawlerData: CrawlerData[]
  isLoading?: boolean
  onConnectAnalytics?: () => void
}

// Mock data for empty state preview
const mockCrawlerData: CrawlerData[] = [
  { name: 'ChatGPT', company: 'OpenAI', crawls: 234, percentage: 45.2, color: '#10B981' },
  { name: 'Claude', company: 'Anthropic', crawls: 187, percentage: 36.1, color: '#3B82F6' },
  { name: 'Perplexity', company: 'Perplexity', crawls: 92, percentage: 17.8, color: '#8B5CF6' },
  { name: 'Gemini', company: 'Google', crawls: 45, percentage: 8.7, color: '#F59E0B' },
  { name: 'Copilot', company: 'Microsoft', crawls: 23, percentage: 4.4, color: '#EF4444' }
]

const getFaviconForCrawler = (company: string) => {
  const companyDomainMap: Record<string, string> = {
    'OpenAI': 'openai.com',
    'Anthropic': 'anthropic.com',
    'Google': 'google.com',
    'Perplexity': 'perplexity.ai',
    'Microsoft': 'microsoft.com',
    'Meta': 'meta.com',
    'Twitter': 'twitter.com',
    'X': 'x.com'
  }

  const domain = companyDomainMap[company]
  if (domain) {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
  }
  
  const constructedDomain = `${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`
  return `https://www.google.com/s2/favicons?domain=${constructedDomain}&sz=128`
}

export function CrawlerAttributionCard({ crawlerData, isLoading = false, onConnectAnalytics }: CrawlerAttributionCardProps) {
  const shouldReduceMotion = useReducedMotion()

  // Show skeleton while loading
  if (isLoading) {
    return (
      <ListSkeleton 
        itemType="crawler"
        items={5}
        showProgress={true}
        className="h-full"
      />
    )
  }

  const itemVariants = shouldReduceMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            duration: 0.2,
            ease: "easeOut",
          },
        },
      }

  const progressVariants = shouldReduceMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { width: 0 },
        visible: {
          width: "var(--target-width)",
          transition: {
            duration: 0.2,
            ease: "easeOut",
          },
        },
      }

  const hasData = crawlerData.length > 0 && crawlerData.some(crawler => crawler.crawls > 0)
  const displayData = hasData ? crawlerData : mockCrawlerData

  const CardComponent = () => (
    <Card className="h-full bg-white border-gray-200 shadow-sm flex flex-col">
      <CardHeader className="pb-3 pt-4 pl-6 pr-6 flex-shrink-0 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Attribution by Source
            </h3>
            <p className="text-sm text-gray-600">
              {displayData.reduce((sum, c) => sum + c.crawls, 0).toLocaleString()} crawls tracked
            </p>
          </div>
          <Link 
            href="/dashboard/attribution/source"
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
            {displayData.slice(0, 5).map((source, index) => (
              <motion.div
                key={source.name}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="group relative"
              >
                <div className="flex items-center justify-between py-2 px-2 hover:bg-gray-50 rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="flex items-center justify-center w-6 h-6 rounded bg-gray-50 border border-gray-200 group-hover:bg-gray-100 transition-colors">
                      <div className="relative">
                        <img 
                          src={getFaviconForCrawler(source.company)}
                          alt={source.name}
                          width={12}
                          height={12}
                          className="w-3 h-3 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const fallback = target.nextElementSibling as HTMLElement
                            if (fallback) fallback.style.display = 'block'
                          }}
                        />
                        <div className="w-2 h-2 rounded-full bg-gray-400 hidden" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-gray-900 font-medium">{source.name}</div>
                      <div className="text-xs text-gray-600">
                        {source.crawls.toLocaleString()} crawls
                      </div>
                    </div>
                  </div>
                  <motion.div 
                    className="text-gray-900 font-semibold text-xs"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {source.percentage.toFixed(1)}%
                  </motion.div>
                </div>
                <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mt-0.5">
                  <motion.div 
                    className="h-full rounded-full"
                    style={{ 
                      backgroundColor: source.color,
                      "--target-width": `${source.percentage}%`
                    } as any}
                    variants={progressVariants}
                    initial="hidden"
                    animate="visible"
                  />
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
      description="Track which AI engines are viewing your content most frequently"
      onAction={onConnectAnalytics}
    >
      <CardComponent />
    </EmptyStateBlur>
  )
} 
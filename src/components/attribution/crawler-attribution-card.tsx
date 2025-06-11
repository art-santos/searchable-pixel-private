import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { motion, useReducedMotion } from "framer-motion"
import { Eye } from "lucide-react"
import Link from "next/link"
import { CrawlerData } from "@/types/attribution"
import { ListSkeleton } from "@/components/skeletons"

interface CrawlerAttributionCardProps {
  crawlerData: CrawlerData[]
  isLoading?: boolean
}

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

export function CrawlerAttributionCard({ crawlerData, isLoading = false }: CrawlerAttributionCardProps) {
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
        hidden: { opacity: 0, x: -20 },
        visible: (i: number) => ({
          opacity: 1,
          x: 0,
          transition: {
            delay: i * 0.05,
            duration: 0.3,
            ease: "easeOut",
          },
        }),
      }

  const progressVariants = shouldReduceMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { width: 0 },
        visible: (i: number) => ({
          width: "var(--target-width)",
          transition: {
            delay: i * 0.05 + 0.2,
            duration: 0.6,
            ease: [0.16, 1, 0.3, 1],
          },
        }),
      }

  return (
    <Card className="h-full bg-white dark:bg-[#0c0c0c] border-gray-200 dark:border-[#1a1a1a]">
      <CardHeader className="pb-4 pt-4 pl-6 flex-shrink-0 border-b border-gray-200 dark:border-[#1a1a1a]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-1">
              Attribution by Source
            </h3>
            <p className="text-sm text-gray-500 dark:text-[#666]">
              {crawlerData.reduce((sum, c) => sum + c.crawls, 0).toLocaleString()} crawls tracked
            </p>
          </div>
          <Link 
            href="/dashboard/attribution/source"
            className="text-sm text-gray-600 dark:text-[#888] hover:text-black dark:hover:text-white transition-colors flex items-center gap-1"
          >
            <Eye className="w-4 h-4" />
            View All
          </Link>
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 pt-6 pr-6 pb-6 pl-6 flex flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto">
          {crawlerData.slice(0, 5).map((source, index) => (
            <motion.div
              key={source.name}
              custom={index}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a]">
                    <div className="relative">
                      <img 
                        src={getFaviconForCrawler(source.company)}
                        alt={source.name}
                        width={14}
                        height={14}
                        className="w-3.5 h-3.5 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const fallback = target.nextElementSibling as HTMLElement
                          if (fallback) fallback.style.display = 'block'
                        }}
                      />
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-500 dark:bg-[#666] hidden" />
                    </div>
                  </div>
                  <div>
                    <div className="text-black dark:text-white font-medium text-sm">{source.name}</div>
                    <div className="text-gray-500 dark:text-[#666] text-xs">
                      {source.crawls.toLocaleString()} crawls
                    </div>
                  </div>
                </div>
                <motion.div 
                  className="text-black dark:text-white font-semibold text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 + 0.2, duration: 0.3 }}
                >
                  {source.percentage.toFixed(1)}%
                </motion.div>
              </div>
              <div className="w-full h-1 bg-gray-200 dark:bg-[#1a1a1a] rounded-full overflow-hidden">
                <motion.div 
                  className="h-full rounded-full"
                  style={{ 
                    "--target-width": `${source.percentage}%`,
                    backgroundColor: source.color
                  } as any}
                  variants={progressVariants}
                  initial="hidden"
                  animate="visible"
                  custom={index}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 
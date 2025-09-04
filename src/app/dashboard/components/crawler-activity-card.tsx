'use client'
import { Card, CardContent } from "@/components/ui/card"
import { motion, useReducedMotion, AnimatePresence } from "framer-motion"
import { TimeframeSelector, TimeframeOption } from "@/components/custom/timeframe-selector"
import { useState, useEffect, useCallback } from "react"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { Loader2, BarChart3 } from "lucide-react"
import { CrawlerVisitsChart } from "@/components/charts/crawler-visits-chart"
import { PlanType } from "@/lib/subscription/config"

interface CrawlerLog {
  id: number
  date: string
  time: string
  method: string
  domain: string
  path: string
  provider: string
  crawler: string
}

interface PeriodComparison {
  hasComparison: boolean
  percentChange?: number
  trend?: 'up' | 'down' | 'same'
}

const crawlerLogs: CrawlerLog[] = [
  {
    id: 1,
    date: 'DEC 04',
    time: '15:23:45',
    method: 'GET',
    domain: 'www.searchablepixel.com',
    path: '/blog/llm-traffic-analytics-guide',
    provider: 'OPENAI',
    crawler: 'ChatGPT-User'
  },
  {
    id: 2,
    date: 'DEC 04',
    time: '15:22:12',
    method: 'GET',
    domain: 'www.searchablepixel.com',
    path: '/pricing/enterprise',
    provider: 'ANTHROPIC',
    crawler: 'ClaudeBot'
  },
  {
    id: 3,
    date: 'DEC 04',
    time: '15:21:38',
    method: 'GET',
    domain: 'www.searchablepixel.com',
    path: '/features/real-time-analytics',
    provider: 'PERPLEXITY',
    crawler: 'PerplexityBot'
  },
  {
    id: 4,
    date: 'DEC 04',
    time: '15:20:56',
    method: 'GET',
    domain: 'www.searchablepixel.com',
    path: '/dashboard/demo',
    provider: 'GOOGLE',
    crawler: 'Gemini-Pro'
  },
  {
    id: 5,
    date: 'DEC 04',
    time: '15:19:42',
    method: 'GET',
    domain: 'www.searchablepixel.com',
    path: '/api/v1/analytics',
    provider: 'OPENAI',
    crawler: 'GPTBot'
  },
  {
    id: 6,
    date: 'DEC 04',
    time: '15:18:29',
    method: 'GET',
    domain: 'www.searchablepixel.com',
    path: '/docs/integration-guide',
    provider: 'ANTHROPIC',
    crawler: 'Claude-Web'
  },
  {
    id: 7,
    date: 'DEC 04',
    time: '15:17:15',
    method: 'GET',
    domain: 'www.searchablepixel.com',
    path: '/case-studies/e-commerce',
    provider: 'MICROSOFT',
    crawler: 'BingBot'
  },
  {
    id: 8,
    date: 'DEC 04',
    time: '15:16:03',
    method: 'GET',
    domain: 'www.searchablepixel.com',
    path: '/about/team',
    provider: 'PERPLEXITY',
    crawler: 'PerplexityBot'
  },
  {
    id: 9,
    date: 'DEC 04',
    time: '15:14:47',
    method: 'GET',
    domain: 'www.searchablepixel.com',
    path: '/blog/ai-vs-seo-traffic',
    provider: 'OPENAI',
    crawler: 'ChatGPT-User'
  },
  {
    id: 10,
    date: 'DEC 04',
    time: '15:13:21',
    method: 'GET',
    domain: 'www.searchablepixel.com',
    path: '/integrations/wordpress',
    provider: 'GOOGLE',
    crawler: 'Bard'
  },
  {
    id: 11,
    date: 'DEC 04',
    time: '15:12:08',
    method: 'GET',
    domain: 'www.searchablepixel.com',
    path: '/contact/sales',
    provider: 'ANTHROPIC',
    crawler: 'ClaudeBot'
  },
  {
    id: 12,
    date: 'DEC 04',
    time: '15:10:55',
    method: 'GET',
    domain: 'www.searchablepixel.com',
    path: '/features/competitor-analysis',
    provider: 'PERPLEXITY',
    crawler: 'PerplexityBot'
  },
  {
    id: 13,
    date: 'DEC 04',
    time: '15:09:32',
    method: 'GET',
    domain: 'www.searchablepixel.com',
    path: '/blog/tracking-chatgpt-referrals',
    provider: 'OPENAI',
    crawler: 'GPTBot'
  },
  {
    id: 14,
    date: 'DEC 04',
    time: '15:08:19',
    method: 'GET',
    domain: 'www.searchablepixel.com',
    path: '/dashboard/settings',
    provider: 'MICROSOFT',
    crawler: 'EdgeGPT'
  },
  {
    id: 15,
    date: 'DEC 04',
    time: '15:07:06',
    method: 'GET',
    domain: 'www.searchablepixel.com',
    path: '/privacy-policy',
    provider: 'GOOGLE',
    crawler: 'Gemini-Pro'
  },
  {
    id: 16,
    date: 'DEC 04',
    time: '15:05:43',
    method: 'GET',
    domain: 'www.searchablepixel.com',
    path: '/api/v1/webhooks',
    provider: 'ANTHROPIC',
    crawler: 'Claude-Web'
  },
  {
    id: 17,
    date: 'DEC 04',
    time: '15:04:30',
    method: 'GET',
    domain: 'www.searchablepixel.com',
    path: '/blog/llm-seo-future',
    provider: 'PERPLEXITY',
    crawler: 'PerplexityBot'
  },
  {
    id: 18,
    date: 'DEC 04',
    time: '15:03:17',
    method: 'GET',
    domain: 'www.searchablepixel.com',
    path: '/features/device-analytics',
    provider: 'OPENAI',
    crawler: 'ChatGPT-User'
  },
  {
    id: 19,
    date: 'DEC 04',
    time: '15:02:04',
    method: 'GET',
    domain: 'www.searchablepixel.com',
    path: '/testimonials',
    provider: 'YOUCOM',
    crawler: 'YouBot'
  },
  {
    id: 20,
    date: 'DEC 04',
    time: '15:00:51',
    method: 'GET',
    domain: 'www.searchablepixel.com',
    path: '/changelog',
    provider: 'GOOGLE',
    crawler: 'Bard'
  }
]



export function CrawlerActivityCard() {
  const shouldReduceMotion = useReducedMotion()
  const [timeframe, setTimeframe] = useState<TimeframeOption>('Last 24 hours')
  const { currentWorkspace, switching } = useWorkspace()
  const [showChart, setShowChart] = useState(true)
  const [userPlan, setUserPlan] = useState<PlanType>('starter')
  const [userPlanLoading, setUserPlanLoading] = useState(true)
  const [periodComparison, setPeriodComparison] = useState<PeriodComparison | null>(null)
  const [totalCrawls, setTotalCrawls] = useState(0)

  const cardVariants = shouldReduceMotion 
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.42, 0, 0.58, 1] } }
      }

  // Fetch user subscription plan
  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const response = await fetch('/api/user/subscription')
        if (response.ok) {
          const data = await response.json()
          const plan = data.subscriptionPlan || 'starter'
          console.log('🔍 [CrawlerActivityCard] Fetched user plan:', plan, 'isAdmin:', data.isAdmin)
          setUserPlan(plan as PlanType)
        } else {
          console.error('Failed to fetch user plan, response not ok')
        }
      } catch (error) {
        console.error('Error fetching user plan:', error)
      } finally {
        setUserPlanLoading(false)
      }
    }

    fetchUserPlan()
  }, [])

  // Debug log when userPlan changes
  useEffect(() => {
    console.log('🔍 [CrawlerActivityCard] userPlan state updated to:', userPlan)
  }, [userPlan])

  // Handle data updates from the shared chart component
  const handleChartDataChange = useCallback((data: { totalCrawls: number; periodComparison: PeriodComparison | null }) => {
    setTotalCrawls(data.totalCrawls)
    setPeriodComparison(data.periodComparison)
  }, [])

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ccc;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #bbb;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
      `}</style>
      <Card className="h-full bg-white dark:bg-[#0c0c0c] border-gray-200 dark:border-[#1a1a1a] flex flex-col">
        <CardContent className="p-0 h-full flex flex-col">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div className="pb-4 pt-4 pl-6 pr-4 border-b border-gray-200 dark:border-[#1a1a1a] flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-black dark:text-white mb-1">Crawler Activity</h3>
                                    {periodComparison?.hasComparison && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1, duration: 0.2, ease: [0.42, 0, 0.58, 1] }}
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        periodComparison.trend === 'up' 
                          ? 'bg-green-500/20 text-green-600 dark:bg-green-500/20 dark:text-green-400' 
                          : periodComparison.trend === 'down'
                          ? 'bg-red-500/20 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                          : 'bg-gray-500/20 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400'
                      }`}
                    >
                      {periodComparison.percentChange !== undefined 
                        ? `${periodComparison.percentChange > 0 ? '+' : ''}${Math.round(periodComparison.percentChange).toLocaleString()}%`
                        : 'NEW'
                      }
                    </motion.div>
                  )}
                  <button
                    onClick={() => setShowChart(!showChart)}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
                    title={showChart ? 'Show logs' : 'Show chart'}
                  >
                    <BarChart3 className={`h-4 w-4 ${showChart ? 'text-blue-500' : 'text-gray-400 dark:text-[#666]'}`} />
                  </button>
                </div>
                {!userPlanLoading && (
                  <TimeframeSelector 
                    key={userPlan}
                    title=""
                    timeframe={timeframe}
                    onTimeframeChange={setTimeframe}
                    titleColor="text-black dark:text-white"
                    selectorColor="text-gray-600 dark:text-[#A7A7A7]"
                  />
                )}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden bg-white dark:bg-[#0c0c0c] relative min-h-0 group">
              <AnimatePresence mode="wait">
                {switching ? (
                  <motion.div 
                    key="switching"
                    className="flex items-center justify-center h-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="text-center">
                      <div className="w-8 h-8 mx-auto mb-3">
                        <img 
                          src="/images/split-icon-black.svg" 
                          alt="Split" 
                          className="w-full h-full animate-spin dark:hidden"
                          style={{ animation: 'spin 1s linear infinite' }}
                        />
                        <img 
                          src="/images/split-icon-white.svg" 
                          alt="Split" 
                          className="w-full h-full animate-spin hidden dark:block"
                          style={{ animation: 'spin 1s linear infinite' }}
                        />
                      </div>
                      <p className="text-gray-500 dark:text-[#666] text-sm">Switching workspace...</p>
                    </div>
                  </motion.div>
                ) : showChart ? (
                  /* Chart View */
                  <motion.div
                    key="chart"
                    className="h-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CrawlerVisitsChart 
                      timeframe={timeframe}
                      onDataChange={handleChartDataChange}
                      className="h-full p-4"
                    />
                  </motion.div>
                ) : (
                  /* Log Entries View */
                  <motion.div
                    key="logs"
                    className="h-full relative"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div 
                      className="overflow-y-auto h-full px-6 py-3 custom-scrollbar"
                      style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#ccc transparent'
                      }}
                    >
                      <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                          hidden: { opacity: 0 },
                          visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
                        }}
                        className="space-y-3"
                      >
                        {crawlerLogs.map((log, index) => (
                            <motion.div 
                              key={log.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2, ease: [0.42, 0, 0.58, 1] }}
                              className="group/item"
                            >
                              <div className="flex items-center justify-between py-2 px-0 rounded-lg hover:bg-gray-50 dark:hover:bg-[#0f0f0f] transition-all duration-200">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-1.5">
                                    <span className="text-xs text-gray-500 dark:text-[#888] font-mono">{log.time}</span>
                                    <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-400/10 text-green-600 dark:text-green-400 rounded">
                                      {log.method}
                                    </span>
                                    <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 dark:bg-orange-400/10 text-orange-600 dark:text-orange-400 rounded">
                                      {log.provider}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-800 dark:text-[#ccc] truncate mb-1">
                                    {log.domain}<span className="text-gray-500 dark:text-[#777]">{log.path}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-[#777]">
                                    {log.crawler}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        }
                      </motion.div>
                    </div>
                    
                    {/* View More Section - Only on Hover */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white dark:from-[#0c0c0c] via-white/95 dark:via-[#0c0c0c]/95 to-transparent pt-6 pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="flex justify-center">
                        <button className="text-sm text-gray-600 dark:text-[#888] hover:text-black dark:hover:text-white transition-colors font-medium px-4 py-2 rounded-lg border border-gray-300 dark:border-[#2a2a2a] hover:border-gray-400 dark:hover:border-[#444] bg-white dark:bg-[#111] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                          View all activity
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </>
  )
}
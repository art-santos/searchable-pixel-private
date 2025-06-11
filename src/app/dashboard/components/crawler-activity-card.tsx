'use client'
import { Card, CardContent } from "@/components/ui/card"
import { motion, useReducedMotion } from "framer-motion"
import { TimeframeSelector, TimeframeOption } from "@/components/custom/timeframe-selector"
import { useState, useEffect } from "react"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { Loader2, BarChart3 } from "lucide-react"
import { PlanType } from "@/lib/subscription/config"
import { CrawlerVisitsChart } from "@/components/charts/crawler-visits-chart"

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
    date: 'MAY 23',
    time: '22:02:35',
    method: 'GET',
    domain: 'www.origamiagents.com',
    path: '/company',
    provider: 'OPENAI',
    crawler: 'ChatGPT-User'
  },
  {
    id: 2,
    date: 'MAY 23',
    time: '22:02:34',
    method: 'GET',
    domain: 'www.origamiagents.com',
    path: '/features/ai-research-agents',
    provider: 'PERPLEXITY',
    crawler: 'PerplexityBot'
  },
  {
    id: 3,
    date: 'MAY 23',
    time: '22:02:33',
    method: 'GET',
    domain: 'www.origamiagents.com',
    path: '/pricing',
    provider: 'GOOGLE',
    crawler: 'Google-Extended'
  },
  {
    id: 4,
    date: 'MAY 23',
    time: '22:02:32',
    method: 'GET',
    domain: 'www.origamiagents.com',
    path: '/blog/ai-sales-automation-guide',
    provider: 'OPENAI',
    crawler: 'GPTBot'
  },
  {
    id: 5,
    date: 'MAY 23',
    time: '22:02:31',
    method: 'GET',
    domain: 'www.origamiagents.com',
    path: '/use-cases',
    provider: 'ANTHROPIC',
    crawler: 'ClaudeBot'
  },
  {
    id: 6,
    date: 'MAY 23',
    time: '22:02:30',
    method: 'GET',
    domain: 'www.origamiagents.com',
    path: '/api/health',
    provider: 'PERPLEXITY',
    crawler: 'PerplexityBot'
  },
  {
    id: 7,
    date: 'MAY 23',
    time: '22:02:29',
    method: 'GET',
    domain: 'www.origamiagents.com',
    path: '/demo/request',
    provider: 'OPENAI',
    crawler: 'ChatGPT-User'
  },
  {
    id: 8,
    date: 'MAY 23',
    time: '22:02:28',
    method: 'GET',
    domain: 'www.origamiagents.com',
    path: '/about/team',
    provider: 'GOOGLE',
    crawler: 'Gemini-Pro'
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
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
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
  const handleChartDataChange = (data: { totalCrawls: number; periodComparison: PeriodComparison | null }) => {
    setTotalCrawls(data.totalCrawls)
    setPeriodComparison(data.periodComparison)
  }

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
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
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
                    userPlan={userPlan}
                  />
                )}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden bg-white dark:bg-[#0c0c0c] relative min-h-0 group">
              {switching ? (
                <div className="flex items-center justify-center h-full">
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
                </div>
              ) : showChart ? (
                /* Chart View */
                <div className="h-full p-4">
                  <CrawlerVisitsChart 
                    timeframe={timeframe}
                    onDataChange={handleChartDataChange}
                    className="h-full"
                  />
                </div>
              ) : (
                /* Log Entries View */
                <>
                  <div 
                    className="overflow-y-auto h-full px-6 py-3 custom-scrollbar"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#ccc transparent'
                    }}
                  >
                    <div className="space-y-3">
                      {crawlerLogs.map((log, index) => (
                          <div key={log.id} className="group/item">
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
                          </div>
                        ))
                      }
                    </div>
                  </div>
                  
                  {/* View More Section - Only on Hover */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white dark:from-[#0c0c0c] via-white/95 dark:via-[#0c0c0c]/95 to-transparent pt-6 pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="flex justify-center">
                      <button className="text-sm text-gray-600 dark:text-[#888] hover:text-black dark:hover:text-white transition-colors font-medium px-4 py-2 rounded-lg border border-gray-300 dark:border-[#2a2a2a] hover:border-gray-400 dark:hover:border-[#444] bg-white dark:bg-[#111] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                        View all activity
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </>
  )
} 
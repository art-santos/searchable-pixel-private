'use client'
import { Card, CardContent } from "@/components/ui/card"
import { motion, useReducedMotion } from "framer-motion"
import { TimeframeSelector, TimeframeOption } from "@/components/custom/timeframe-selector"
import { useState, useEffect } from "react"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { useAuth } from "@/contexts/AuthContext"
import { Loader2, BarChart3 } from "lucide-react"
import { PlanType } from "@/lib/subscription/config"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'

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

interface ChartDataPoint {
  date: string
  crawls: number
  isCurrentPeriod?: boolean
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

// Custom tooltip for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const isCurrentPeriod = payload[0].payload?.isCurrentPeriod
    
    return (
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333333] px-3 py-2 rounded-lg shadow-md">
        <p className="font-mono text-sm text-black dark:text-white">
          {payload[0].value} crawls
          {isCurrentPeriod && (
            <span className="ml-2 text-xs text-green-500">● LIVE</span>
          )}
        </p>
        <p className="font-mono text-xs text-gray-500 dark:text-[#666666]">{label}</p>
      </div>
    )
  }
  return null
}

// Custom dot for current period
const CustomDot = (props: any) => {
  const { cx, cy, payload } = props
  if (payload?.isCurrentPeriod) {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill="currentColor"
        stroke="var(--background)"
        strokeWidth={2}
        className="animate-pulse"
      />
    )
  }
  return null
}

export function CrawlerActivityCard() {
  const shouldReduceMotion = useReducedMotion()
  const [timeframe, setTimeframe] = useState<TimeframeOption>('Last 24 hours')
  const { currentWorkspace, switching } = useWorkspace()
  const { session } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [showChart, setShowChart] = useState(true)
  const [userPlan, setUserPlan] = useState<PlanType>('starter')
  const [userPlanLoading, setUserPlanLoading] = useState(true)

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

  // Fetch chart data
  useEffect(() => {
    const fetchChartData = async () => {
      if (!currentWorkspace) return

      setIsLoading(true)
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        const response = await fetch(`/api/dashboard/crawler-visits?timeframe=${encodeURIComponent(timeframe)}&crawler=all&timezone=${encodeURIComponent(timezone)}&workspaceId=${currentWorkspace.id}`, {
          headers: {
            'Authorization': session?.access_token ? `Bearer ${session.access_token}` : ''
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setChartData(data.chartData || [])
        } else {
          console.log('API response not ok, using fallback data')
          // Fallback sample data
          const fallbackData = [
            { date: 'Hour 1', crawls: 12 },
            { date: 'Hour 2', crawls: 19 },
            { date: 'Hour 3', crawls: 8 },
            { date: 'Hour 4', crawls: 24 },
            { date: 'Hour 5', crawls: 15 },
            { date: 'Hour 6', crawls: 31 },
            { date: 'Hour 7', crawls: 22 },
            { date: 'Hour 8', crawls: 18 },
          ]
          console.log('Setting fallback chart data:', fallbackData)
          setChartData(fallbackData)
        }
      } catch (error) {
        console.error('Error fetching chart data:', error)
        // Fallback sample data
        setChartData([
          { date: 'Hour 1', crawls: 12 },
          { date: 'Hour 2', crawls: 19 },
          { date: 'Hour 3', crawls: 8 },
          { date: 'Hour 4', crawls: 24 },
          { date: 'Hour 5', crawls: 15 },
          { date: 'Hour 6', crawls: 31 },
          { date: 'Hour 7', crawls: 22 },
          { date: 'Hour 8', crawls: 18 },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchChartData()
  }, [timeframe, currentWorkspace, session])

  // Debug log for chart data
  useEffect(() => {
    console.log('Chart data updated:', chartData)
  }, [chartData])

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
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="animate-spin h-8 w-8 text-black dark:text-white" />
                    </div>
                  ) : (
                    <div className="h-full w-full relative text-gray-800 dark:text-gray-300">
                      <div className="h-full w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={chartData}
                            margin={{ top: 30, right: 40, left: 10, bottom: 40 }}
                          >
                            <defs>
                              <linearGradient id="crawlerGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="currentColor" stopOpacity={0.15} />
                                <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              vertical={false}
                              horizontal={true}
                              strokeDasharray="4 4"
                              stroke="currentColor"
                              opacity={0.4}
                            />
                            <XAxis
                              dataKey="date"
                              axisLine={{ stroke: 'currentColor' }}
                              tickLine={{ stroke: 'currentColor' }}
                              tick={{ fill: 'currentColor', fontSize: 12 }}
                            />
                            <YAxis
                              axisLine={{ stroke: 'currentColor' }}
                              tickLine={{ stroke: 'currentColor' }}
                              tick={{ fill: 'currentColor', fontSize: 12 }}
                              width={60}
                              domain={[0, (dataMax: number) => dataMax * 1.5]}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                              type="linear"
                              dataKey="crawls"
                              stroke="currentColor"
                              strokeWidth={2}
                              fill="url(#crawlerGradient)"
                              dot={<CustomDot />}
                              activeDot={{ r: 6, stroke: 'currentColor', strokeWidth: 2, fill: 'var(--background)' }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
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
                      {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                          <Loader2 className="animate-spin h-8 w-8 text-black dark:text-white" />
                        </div>
                      ) : (
                        crawlerLogs.map((log, index) => (
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
                      )}
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
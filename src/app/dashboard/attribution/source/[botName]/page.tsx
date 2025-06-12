'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Bot } from 'lucide-react'
import Link from 'next/link'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useAuth } from '@/contexts/AuthContext'
import { TimeframeSelector, TimeframeOption } from '@/components/custom/timeframe-selector'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ChartSkeleton, ListSkeleton } from '@/components/skeletons'
import { PlanType } from '@/lib/subscription/config'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

// Fix for Recharts TypeScript issues
const RechartsArea = Area as any
const RechartsXAxis = XAxis as any
const RechartsYAxis = YAxis as any
const RechartsTooltip = Tooltip as any
import { Skeleton } from '@/components/ui/skeleton'
import { ExportDropdown } from '@/components/ui/export-dropdown'
import { ExportData, formatStatsForExport, formatChartDataForExport, formatRecentActivityForExport } from '@/lib/export-utils'

interface CrawlerActivity {
  path: string
  visits: number
  lastVisit: string
  responseTime?: number
}

interface CrawlerStats {
  totalCrawls: number
  uniquePaths: number
  avgInterval: string
  lastSeen: string
  company: string
  recentActivity: CrawlerActivity[]
}

interface ChartDataPoint {
  date: string
  crawls: number
  showLabel?: boolean
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    const date = new Date(label)
    const isHourlyData = date.getMinutes() === 0 && date.getSeconds() === 0
    
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-lg">
        <p className="text-zinc-300 text-sm mb-1">
          {isHourlyData 
            ? date.toLocaleString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                hour: 'numeric',
                hour12: true 
              })
            : date.toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric' 
              })
          }
        </p>
        <p className="text-white font-semibold">
          {payload[0].value} crawls
        </p>
      </div>
    )
  }
  return null
}

export default function CrawlerDetailPage() {
  const params = useParams()
  const botName = decodeURIComponent(params.botName as string)
  const [timeframe, setTimeframe] = useState<TimeframeOption>('Last 7 days')
  const { currentWorkspace } = useWorkspace()
  const { session } = useAuth()
  const [stats, setStats] = useState<CrawlerStats | null>(null)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userPlan, setUserPlan] = useState<PlanType>('starter')
  const [userPlanLoading, setUserPlanLoading] = useState(true)
  const shouldReduceMotion = useReducedMotion()

  const timeframeMap: Record<TimeframeOption, string> = {
    'Last 24 hours': 'last24h',
    'Last 7 days': 'last7d',
    'Last 30 days': 'last30d',
    'Last 90 days': 'last90d',
    'Last 365 days': 'last365d'
  }

  useEffect(() => {
    const fetchUserPlan = async () => {
      if (!session?.user?.id) return
      
      try {
        const response = await fetch(`/api/user/subscription`)
        if (response.ok) {
          const data = await response.json()
          setUserPlan(data.subscriptionPlan || 'starter')
        }
              } catch (error) {
          console.error('Error fetching user plan:', error)
          setUserPlan('starter')
        } finally {
        setUserPlanLoading(false)
      }
    }

    fetchUserPlan()
  }, [session])

  useEffect(() => {
    if (currentWorkspace && botName) {
      fetchCrawlerData()
    }
  }, [timeframe, currentWorkspace, botName])

  const fetchCrawlerData = async () => {
    if (!currentWorkspace) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/dashboard/crawler-detail?botName=${encodeURIComponent(botName)}&timeframe=${timeframeMap[timeframe as keyof typeof timeframeMap]}&workspaceId=${currentWorkspace.id}`, {
        headers: {
          'Authorization': session?.access_token ? `Bearer ${session.access_token}` : ''
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setChartData(data.chartData || [])
      }
    } catch (error) {
      console.error('Error fetching crawler data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getFaviconForCompany = (company: string) => {
    const companyDomainMap: Record<string, string> = {
      'OpenAI': 'openai.com',
      'Anthropic': 'anthropic.com', 
      'Google': 'google.com',
      'Perplexity': 'perplexity.ai',
      'Microsoft': 'microsoft.com',
      'Meta': 'meta.com',
      'Twitter': 'twitter.com',
      'X': 'x.com',
      'Ahrefs': 'ahrefs.com',
      'Yandex': 'yandex.com',
      'Amazon': 'amazon.com',
      'ByteDance': 'bytedance.com',
      'Apple': 'apple.com',
      'Semrush': 'semrush.com'
    }

    const domain = companyDomainMap[company]
    if (domain) {
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
    }
    
    const constructedDomain = `${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`
    return `https://www.google.com/s2/favicons?domain=${constructedDomain}&sz=128`
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

  // Chart configuration
  const isHourlyData = timeframe === 'Last 24 hours'
  let tickInterval = 0
  let labelAngle = 0
  let labelHeight = 60

  if (isHourlyData) {
    tickInterval = 2 // Show every 3rd hour
    labelAngle = -45
    labelHeight = 80
  } else if (chartData.length > 30) {
    tickInterval = Math.ceil(chartData.length / 8)
    labelAngle = -45
    labelHeight = 80
  } else if (chartData.length > 14) {
    tickInterval = 1
    labelAngle = -45
    labelHeight = 30
  }

  const cardVariants = shouldReduceMotion 
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
      }

  // Prepare export data
  const exportData: ExportData = {
    stats: formatStatsForExport(stats),
    chartData: formatChartDataForExport(chartData),
    recentActivity: formatRecentActivityForExport(stats?.recentActivity || []),
    metadata: {
      title: `Crawler Analysis - ${botName}`,
      timeframe,
      exportDate: new Date().toLocaleString(),
      domain: currentWorkspace?.domain
    }
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white">
      <div id="crawler-detail-export" className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Link 
              href="/dashboard/attribution/source" 
              className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Sources</span>
            </Link>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {isLoading ? (
                <Skeleton className="w-12 h-12 rounded-lg" />
              ) : stats && (
                <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden">
                  <img 
                    src={getFaviconForCompany(stats.company)} 
                    alt={stats.company}
                    className="w-8 h-8"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      const nextElement = e.currentTarget.nextElementSibling as HTMLElement
                      if (nextElement) {
                        nextElement.style.display = 'flex'
                      }
                    }}
                  />
                  <Bot className="w-6 h-6 text-zinc-500 hidden" />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-semibold text-white mb-2 font-mono">{botName}</h1>
                {isLoading ? (
                  <Skeleton className="h-5 w-64" />
                ) : (
                  <p className="text-zinc-400">
                    {stats ? `${stats.company} • Last seen ${formatRelativeTime(stats.lastSeen)}` : 'Crawler activity'}
                    {' '}({timeframe.toLowerCase()})
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {!userPlanLoading && (
                <TimeframeSelector 
                  key={userPlan}
                  title=""
                  timeframe={timeframe}
                  onTimeframeChange={setTimeframe}
                  titleColor="text-white"
                  selectorColor="text-zinc-400"
                  userPlan={userPlan}
                />
              )}
              <ExportDropdown 
                data={exportData}
                elementId="crawler-detail-export"
              />
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-white mb-1">
                    {stats?.totalCrawls.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-zinc-400">Total Crawls</div>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-white mb-1">
                    {stats?.uniquePaths || '0'}
                  </div>
                  <div className="text-sm text-zinc-400">Unique Pages</div>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-14" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-white mb-1">
                    {stats?.avgInterval || 'N/A'}
                  </div>
                  <div className="text-sm text-zinc-400">Avg Interval</div>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-18" />
                  <Skeleton className="h-4 w-26" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-white mb-1">
                    {stats ? formatRelativeTime(stats.lastSeen) : 'Never'}
                  </div>
                  <div className="text-sm text-zinc-400">Last Activity</div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="pb-4 pt-4 pl-6 flex-shrink-0 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Crawl Activity Over Time</h3>
                  <p className="text-sm text-zinc-400">Crawling patterns for {botName}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80 w-full">
                {isLoading ? (
                  <ChartSkeleton 
                    showHeader={false}
                    showStats={false}
                    className="h-full"
                  />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="crawlerGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.08} />
                          <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        vertical={false}
                        horizontal={true}
                        strokeDasharray="2 2"
                        stroke="#333333"
                        opacity={0.15}
                      />
                      <RechartsXAxis
                        dataKey="date"
                        axisLine={false}
                        tick={{ 
                          fill: '#555555', 
                          fontSize: 11,
                          fontFamily: 'var(--font-geist-mono)',
                          letterSpacing: '-0.025em'
                        }}
                        tickLine={false}
                        interval={tickInterval}
                        angle={labelAngle}
                        textAnchor={labelAngle !== 0 ? 'end' : 'middle'}
                        height={labelHeight}
                        tickFormatter={(value: any, index: number) => {
                          const dataPoint = chartData[index]
                          if (isHourlyData && dataPoint && !dataPoint.showLabel) {
                            return ''
                          }
                          const date = new Date(value)
                          if (isHourlyData) {
                            return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
                          }
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        }}
                      />
                      <RechartsYAxis
                        axisLine={false}
                        tick={{ 
                          fill: '#555555', 
                          fontSize: 11,
                          fontFamily: 'var(--font-geist-mono)',
                          letterSpacing: '-0.025em'
                        }}
                        tickLine={false}
                        tickFormatter={(value: any) => `${value}`}
                        tickCount={8}
                        domain={[0, (dataMax: number) => dataMax * 2]}
                        width={40}
                      />
                      <RechartsTooltip
                        content={<CustomTooltip />}
                        cursor={false}
                      />
                      <RechartsArea
                        type="monotone"
                        dataKey="crawls"
                        stroke="#ffffff"
                        strokeWidth={1.5}
                        fill="url(#crawlerGradient)"
                        dot={false}
                        activeDot={{ r: 4, stroke: '#ffffff', strokeWidth: 2, fill: '#0c0c0c' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Page Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="pb-4 pt-4 pl-6 flex-shrink-0 border-b border-zinc-800">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Recent Page Activity</h3>
                <p className="text-sm text-zinc-400">Pages crawled by {botName}</p>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {isLoading ? (
                  <ListSkeleton 
                    itemType="crawler"
                    items={6}
                    showHeader={false}
                    showProgress={false}
                    className="bg-transparent border-none shadow-none"
                  />
                ) : stats && stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((activity: CrawlerActivity, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between py-3 px-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800/70 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-lg">{getPathIcon(activity.path)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-mono truncate text-sm">{activity.path}</p>
                          <div className="flex items-center gap-4 text-xs text-zinc-500 mt-1">
                            <span>{activity.visits} visits</span>
                            {activity.responseTime && (
                              <span>{activity.responseTime}ms avg</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-zinc-500">
                        {formatRelativeTime(activity.lastVisit)}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-zinc-500">No recent activity found for this timeframe.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
} 
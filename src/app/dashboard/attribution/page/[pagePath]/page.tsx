'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useAuth } from '@/contexts/AuthContext'
import { TimeframeSelector, TimeframeOption } from '@/components/custom/timeframe-selector'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ChartSkeleton, ListSkeleton } from '@/components/skeletons'
import { PlanType } from '@/lib/subscription/config'
import { ExportDropdown } from '@/components/ui/export-dropdown'
import { ExportData, formatStatsForExport, formatChartDataForExport, formatRecentActivityForExport } from '@/lib/export-utils'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'

interface CrawlerVisit {
  botName: string
  company: string
  visits: number
  lastVisit: string
  avgResponseTime?: number
}

interface PageStats {
  totalVisits: number
  uniqueCrawlers: number
  uniqueCompanies: number
  lastCrawled: string
  path: string
  recentVisits: CrawlerVisit[]
}

interface ChartDataPoint {
  date: string
  visits: number
  isCurrentPeriod?: boolean
  showLabel?: boolean
}

// Custom tooltip matching other charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const isCurrentPeriod = payload[0].payload?.isCurrentPeriod
    
    return (
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333333] px-3 py-2 rounded-lg shadow-md">
        <p className="font-mono text-sm text-black dark:text-white">
          {payload[0].value} visits
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

export default function PageDetailPage() {
  const shouldReduceMotion = useReducedMotion()
  const params = useParams()
  const pagePath = decodeURIComponent(params.pagePath as string)
  const [timeframe, setTimeframe] = useState<TimeframeOption>('Last 7 days')
  const { currentWorkspace } = useWorkspace()
  const { session } = useAuth()
  const [stats, setStats] = useState<PageStats | null>(null)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userPlan, setUserPlan] = useState<PlanType>('starter')
  const [userPlanLoading, setUserPlanLoading] = useState(true)

  const timeframeMap: Record<TimeframeOption, string> = {
    'Last 24 hours': 'last24h',
    'Last 7 days': 'last7d',
    'Last 30 days': 'last30d',
    'Last 90 days': 'last90d',
    'Last 365 days': 'last365d'
  }

  // Fetch user subscription plan
  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const response = await fetch('/api/user/subscription')
        if (response.ok) {
          const data = await response.json()
          const plan = data.subscriptionPlan || 'starter'
          console.log('🔍 [PageDetailPage] Fetched user plan:', plan, 'isAdmin:', data.isAdmin)
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

  useEffect(() => {
    if (currentWorkspace && pagePath) {
      fetchPageData()
    }
  }, [timeframe, currentWorkspace, pagePath])

  const fetchPageData = async () => {
    if (!currentWorkspace) return
    
    setIsLoading(true)
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const response = await fetch(`/api/dashboard/page-detail?pagePath=${encodeURIComponent(pagePath)}&timeframe=${timeframeMap[timeframe]}&timezone=${encodeURIComponent(timezone)}&workspaceId=${currentWorkspace.id}`, {
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
      console.error('Error fetching page data:', error)
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
      'X': 'x.com'
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

  // Determine chart display settings based on timeframe
  const isHourlyData = timeframe === 'Last 24 hours'
  const isWeeklyData = timeframe === 'Last 7 days'
  const isMonthlyData = timeframe === 'Last 30 days'
  
  let tickInterval = 0
  let labelAngle = 0
  let labelHeight = 30
  
  if (isHourlyData) {
    tickInterval = 2 // Show every 3rd hour
    labelAngle = -45
    labelHeight = 60
  } else if (isWeeklyData) {
    tickInterval = 0 // Show all days in week
    labelAngle = 0
    labelHeight = 30
  } else if (isMonthlyData) {
    tickInterval = 0 // Show all data points (already pre-filtered by API)
    labelAngle = -45
    labelHeight = 60
  } else {
    tickInterval = 0 // Show all data points (already pre-filtered by API)
    labelAngle = 0
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
    recentActivity: formatRecentActivityForExport(stats?.recentVisits || []),
    metadata: {
      title: `Page Analysis - ${pagePath}`,
      timeframe,
      exportDate: new Date().toLocaleString(),
      domain: currentWorkspace?.domain
    }
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white">
      <div id="page-detail-export" className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Link 
              href="/dashboard/attribution/page" 
              className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Pages</span>
            </Link>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              {currentWorkspace?.domain && currentWorkspace.domain !== 'example.com' ? (
                <a 
                  href={`https://www.${currentWorkspace.domain}${pagePath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-3xl font-semibold text-white mb-2 hover:underline transition-all duration-200 inline-block font-mono"
                >
                  {pagePath}
                </a>
              ) : (
                <h1 className="text-3xl font-semibold text-white mb-2 font-mono">{pagePath}</h1>
              )}
              <p className="text-zinc-400">
                Page crawler activity ({timeframe.toLowerCase()})
              </p>
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
                elementId="page-detail-export"
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
              <div className="text-2xl font-bold text-white mb-1">
                {isLoading ? '...' : stats?.totalVisits.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-zinc-400">Total Visits</div>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-white mb-1">
                {isLoading ? '...' : stats?.uniqueCrawlers || '0'}
              </div>
              <div className="text-sm text-zinc-400">Unique Crawlers</div>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-white mb-1">
                {isLoading ? '...' : stats?.uniqueCompanies || '0'}
              </div>
              <div className="text-sm text-zinc-400">Unique Companies</div>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-white mb-1">
                {isLoading ? '...' : stats ? formatRelativeTime(stats.lastCrawled) : 'Never'}
              </div>
              <div className="text-sm text-zinc-400">Last Crawled</div>
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
                  <h3 className="text-lg font-semibold text-white mb-1">Crawler Visits Over Time</h3>
                  <p className="text-sm text-zinc-400">Visit patterns for this page</p>
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
                      margin={{ top: 20, right: 30, left: -40, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id="crawlerGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#fff" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#fff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        vertical={false}
                        horizontal={true}
                        strokeDasharray="4 4"
                        stroke="#333333"
                        opacity={0.4}
                      />
                      <XAxis
                        dataKey="date"
                        axisLine={{ stroke: '#333333' }}
                        tick={{ 
                          fill: '#666666', 
                          fontSize: 11,
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace'
                        }}
                        tickLine={false}
                        interval={tickInterval}
                        angle={labelAngle}
                        textAnchor={labelAngle !== 0 ? 'end' : 'middle'}
                        height={labelHeight}
                        tickFormatter={(value, index) => {
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
                      <YAxis
                        axisLine={{ stroke: '#333333' }}
                        tick={{ 
                          fill: '#666666', 
                          fontSize: 11,
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace'
                        }}
                        tickLine={false}
                        tickFormatter={(value) => `${value}`}
                      />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="visits"
                        stroke="#fff"
                        strokeWidth={2}
                        fill="url(#crawlerGradient)"
                        strokeOpacity={0.8}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Crawler Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader className="pb-4 pt-4 pl-6 pr-6 border-b border-zinc-800">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  Recent Crawler Activity
                </h3>
                <p className="text-sm text-zinc-400">
                  Latest crawler visits to this page
                </p>
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
                ) : stats?.recentVisits && stats.recentVisits.length > 0 ? (
                  stats.recentVisits.map((visit, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between py-3 px-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-zinc-700 border border-zinc-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                          <img 
                            src={getFaviconForCompany(visit.company)} 
                            alt={visit.company}
                            className="w-4 h-4"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.nextElementSibling!.style.display = 'flex'
                            }}
                          />
                          <div className="w-4 h-4 text-zinc-400 hidden">🤖</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{visit.botName}</p>
                          <div className="flex items-center gap-3 text-xs text-zinc-400">
                            <span>{visit.company}</span>
                            <span>{visit.visits} visits</span>
                            {visit.avgResponseTime && (
                              <span>{visit.avgResponseTime}ms</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-zinc-400 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        <span>{formatRelativeTime(visit.lastVisit)}</span>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-zinc-400">No recent crawler activity found for this timeframe.</p>
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
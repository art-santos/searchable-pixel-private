'use client'

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { motion, useReducedMotion } from "framer-motion"
import { TimeframeSelector, TimeframeOption } from "@/components/custom/timeframe-selector"
import { useState, useEffect } from "react"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { useAuth } from "@/contexts/AuthContext"
import { Loader2, Activity, FileText, Clock, ArrowRight, TrendingUp, Eye } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'

interface AttributionStats {
  totalCrawls: number
  uniqueCrawlers: number
  uniqueDomains: number
  avgResponseTime: number
  uniquePaths: number
  totalSessions: number
  avgPagesPerSession: number
}

interface CrawlerData {
  name: string
  company: string
  percentage: number
  crawls: number
  icon?: string
  color: string
}

interface PageData {
  path: string
  totalCrawls: number
  uniqueCrawlers: number
  avgResponse: number
  lastCrawled: string
  topCrawler: string
}

interface ChartDataPoint {
  date: string
  crawls: number
  isCurrentPeriod?: boolean
}

export default function AttributionPage() {
  const shouldReduceMotion = useReducedMotion()
  const [timeframe, setTimeframe] = useState<TimeframeOption>('Last 7 days')
  const { currentWorkspace, switching } = useWorkspace()
  const { session, supabase } = useAuth()
  const [stats, setStats] = useState<AttributionStats | null>(null)
  const [crawlerData, setCrawlerData] = useState<CrawlerData[]>([])
  const [pageData, setPageData] = useState<PageData[]>([])
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (currentWorkspace) {
      fetchAllData()
    }
  }, [timeframe, currentWorkspace])

  const generateChartData = async (timeframe: TimeframeOption) => {
    if (!currentWorkspace || !supabase) return
    
    const data: ChartDataPoint[] = []
    const now = new Date()
    
    try {
      if (timeframe === 'Last 24 hours') {
        // Get data for the last 24 hours from now
        const endTime = new Date()
        const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000)
        
        console.log('24h chart: Fetching data from', startTime.toISOString(), 'to', endTime.toISOString())
        
        const { data: hourlyData, error } = await supabase
          .from('crawler_visits')
          .select('created_at')
          .eq('workspace_id', currentWorkspace.id)
          .gte('created_at', startTime.toISOString())
          .lt('created_at', endTime.toISOString())
        
        if (error) throw error
        
        console.log('24h chart: Found', hourlyData?.length || 0, 'visits')
        
        // Create hourly buckets for the last 24 hours
        const hourlyBuckets: Record<string, number> = {}
        const hourLabels: Record<string, string> = {}
        const currentHour = endTime.getHours()
        
        // Initialize 24 hours going backwards from current time
        for (let i = 23; i >= 0; i--) {
          const timeSlot = new Date(endTime.getTime() - i * 60 * 60 * 1000)
          const hourKey = `hour_${23 - i}` // 0 = oldest, 23 = newest
          const displayTime = timeSlot.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }).slice(0, 5) // Get "HH:MM" format
          
          hourlyBuckets[hourKey] = 0
          hourLabels[hourKey] = displayTime
        }
        
        // Count actual data into the correct hour buckets
        hourlyData?.forEach(visit => {
          const visitTime = new Date(visit.created_at)
          const hoursFromEnd = Math.floor((endTime.getTime() - visitTime.getTime()) / (60 * 60 * 1000))
          
          // Only count visits within the last 24 hours
          if (hoursFromEnd >= 0 && hoursFromEnd < 24) {
            const hourKey = `hour_${23 - hoursFromEnd}`
            hourlyBuckets[hourKey]++
          }
        })
        
        // Convert to chart data (chronological order)
        for (let i = 0; i < 24; i++) {
          const hourKey = `hour_${i}`
          data.push({
            date: hourLabels[hourKey],
            crawls: hourlyBuckets[hourKey],
            isCurrentPeriod: i === 23 // Most recent hour is current
          })
        }
        
        console.log('24h chart: Generated', data.length, 'data points')
        
      } else if (timeframe === 'Last 7 days') {
        // Get daily data for June 1-7, 2025
        const { data: dailyData, error } = await supabase
          .from('crawler_visits')
          .select('created_at')
          .eq('workspace_id', currentWorkspace.id)
          .gte('created_at', '2025-06-01T00:00:00Z')
          .lt('created_at', '2025-06-08T00:00:00Z')
        
        if (error) throw error
        
        // Create daily buckets
        const dailyBuckets: Record<string, number> = {}
        const dates = ['2025-06-01', '2025-06-02', '2025-06-03', '2025-06-04', '2025-06-05', '2025-06-06', '2025-06-07']
        
        // Initialize all days with 0
        dates.forEach(date => {
          dailyBuckets[date] = 0
        })
        
        // Count actual data
        dailyData?.forEach(visit => {
          const date = new Date(visit.created_at).toISOString().split('T')[0]
          if (dailyBuckets.hasOwnProperty(date)) {
            dailyBuckets[date]++
          }
        })
        
        // Convert to chart data
        dates.forEach((date, index) => {
          const dayName = new Date(date + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'short' })
          data.push({
            date: dayName,
            crawls: dailyBuckets[date],
            isCurrentPeriod: index === dates.length - 1 // Last day is current
          })
        })
        
      } else if (timeframe === 'Last 30 days') {
        // For 30 days, we only have data for June 1-7, so fill the rest with 0s
        const startDate = new Date('2025-05-09') // 30 days before June 7
        const endDate = new Date('2025-06-07')
        
        const { data: monthlyData, error } = await supabase
          .from('crawler_visits')
          .select('created_at')
          .eq('workspace_id', currentWorkspace.id)
          .gte('created_at', '2025-06-01T00:00:00Z')
          .lt('created_at', '2025-06-08T00:00:00Z')
        
        if (error) throw error
        
        // Create daily buckets for 30 days
        const dailyBuckets: Record<string, number> = {}
        
        // Initialize all 30 days with 0
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateKey = d.toISOString().split('T')[0]
          dailyBuckets[dateKey] = 0
        }
        
        // Count actual data (only June 1-7 will have data)
        monthlyData?.forEach(visit => {
          const date = new Date(visit.created_at).toISOString().split('T')[0]
          if (dailyBuckets.hasOwnProperty(date)) {
            dailyBuckets[date]++
          }
        })
        
        // Convert to chart data, showing every 3rd day to avoid crowding
        const sortedDates = Object.keys(dailyBuckets).sort()
        sortedDates.forEach((date, index) => {
          if (index % 3 === 0 || index === sortedDates.length - 1) { // Show every 3rd day + last day
            const dayMonth = new Date(date + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            data.push({
              date: dayMonth,
              crawls: dailyBuckets[date],
              isCurrentPeriod: index === sortedDates.length - 1
            })
          }
        })
      }
      
    } catch (error) {
      console.error('Error fetching chart data:', error)
      // Fallback to empty data with proper time labels
      if (timeframe === 'Last 24 hours') {
        const endTime = new Date()
        
        for (let i = 0; i < 24; i++) {
          const timeSlot = new Date(endTime.getTime() - (23 - i) * 60 * 60 * 1000)
          const displayTime = timeSlot.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }).slice(0, 5)
          
          data.push({
            date: displayTime,
            crawls: 0,
            isCurrentPeriod: i === 23
          })
        }
      }
    }
    
    setChartData(data)
  }

  const fetchAllData = async () => {
    if (!currentWorkspace) return
    
    setIsLoading(true)
    try {
      const timeframeMap: Record<TimeframeOption, string> = {
        'Last 24 hours': 'last24h',
        'Last 7 days': 'last7d',
        'Last 30 days': 'last30d'
      }
      
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      
      const headers = {
        'Authorization': session?.access_token ? `Bearer ${session.access_token}` : ''
      }
      
      // Fetch all data in parallel
      const [statsResponse, crawlerResponse, pagesResponse] = await Promise.all([
        fetch(`/api/dashboard/attribution-stats?timeframe=${timeframeMap[timeframe]}&timezone=${encodeURIComponent(timezone)}&workspaceId=${currentWorkspace.id}`, { headers }),
        fetch(`/api/dashboard/crawler-stats?timeframe=${timeframeMap[timeframe]}&timezone=${encodeURIComponent(timezone)}&workspaceId=${currentWorkspace.id}`, { headers }),
        fetch(`/api/dashboard/attribution-pages?timeframe=${timeframeMap[timeframe]}&timezone=${encodeURIComponent(timezone)}&workspaceId=${currentWorkspace.id}`, { headers })
      ])
      
      if (statsResponse.ok) {
        const data = await statsResponse.json()
        setStats(data)
      }
      
      if (crawlerResponse.ok) {
        const data = await crawlerResponse.json()
        setCrawlerData(data.crawlers || [])
      }
      
      if (pagesResponse.ok) {
        const data = await pagesResponse.json()
        setPageData(data.pages || [])
      }

      // Generate chart data based on timeframe
      await generateChartData(timeframe)
    } catch (error) {
      console.error('Error fetching attribution data:', error)
    } finally {
      setIsLoading(false)
    }
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

  // Chart components
  const CustomDot = ({ cx, cy, payload, ...props }: any) => {
    if (!cx || !cy || !payload) return null
    
    const isCurrentPeriod = payload.isCurrentPeriod
    
    if (isCurrentPeriod) {
      return (
        <g>
          {/* Pulsing ring animation */}
          <motion.circle
            cx={cx}
            cy={cy}
            r={8}
            fill="none"
            stroke="#fff"
            strokeWidth={1}
            opacity={0.6}
            animate={{
              r: [6, 12, 6],
              opacity: [0.6, 0.2, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          {/* Main dot */}
          <circle
            cx={cx}
            cy={cy}
            r={4}
            fill="#fff"
            stroke="#333"
            strokeWidth={2}
          />
        </g>
      )
    }
    
    return null
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const isCurrentPeriod = payload[0].payload?.isCurrentPeriod
      
      return (
        <div className="bg-[#1a1a1a] border border-[#333333] px-3 py-2 rounded-lg">
          <p className="font-mono text-sm text-white">
            {payload[0].value} crawls
            {isCurrentPeriod && (
              <span className="ml-2 text-xs text-green-400">● LIVE</span>
            )}
          </p>
          <p className="font-mono text-xs text-[#666666]">{label}</p>
        </div>
      )
    }
    return null
  }

  const cardVariants = shouldReduceMotion 
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
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
    <div className="min-h-screen min-w-screen bg-[#0c0c0c] text-white">


      {switching ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-3">
              <img 
                src="/images/split-icon-white.svg" 
                alt="Split" 
                className="w-full h-full animate-spin"
                style={{ animation: 'spin 1s linear infinite' }}
              />
            </div>
            <p className="text-[#666] text-sm">Switching workspace...</p>
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-[#666]" />
        </div>
      ) : (
        <div className="flex h-[calc(100vh-80px)] gap-6 p-6">
          {/* Large Graph - 60% width */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="w-[60%]"
          >
            <Card className="h-full bg-[#0c0c0c] border-[#1a1a1a]">
              <CardContent className="p-0 h-full flex flex-col">
                {/* Graph Header */}
                <CardHeader className="pb-4 pt-4 pl-6 pr-6 flex-shrink-0 border-b border-[#1a1a1a]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        Total Crawls
                      </h3>
                      <p className="text-sm text-[#666]">
                        {stats?.totalCrawls.toLocaleString() || '0'} crawls tracked
                      </p>
                    </div>
                    <TimeframeSelector 
                      title=""
                      timeframe={timeframe}
                      onTimeframeChange={setTimeframe}
                      titleColor="text-white"
                      selectorColor="text-[#A7A7A7]"
                    />
                  </div>
                </CardHeader>

                {/* Graph Content */}
                <div className="flex-1 p-6">
                  <motion.div 
                    className="h-full w-full relative"
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      duration: 0.3,
                      ease: [0.16, 1, 0.3, 1],
                      type: "spring",
                      stiffness: 300,
                      damping: 30
                    }}
                  >
                    <motion.div 
                      className="h-full w-full"
                      initial={{ clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)" }}
                      animate={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
                      transition={{ 
                        duration: 1.5, 
                        ease: [0.16, 1, 0.3, 1],
                        delay: 0.4
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={chartData}
                          margin={{ top: 30, right: 40, left: 10, bottom: 40 }}
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
                            tickLine={{ stroke: '#333333' }}
                            tick={{ fill: '#666666', fontSize: 12 }}
                            interval={timeframe === 'Last 30 days' ? 4 : timeframe === 'Last 24 hours' ? 2 : 0}
                            angle={timeframe === 'Last 30 days' || timeframe === 'Last 24 hours' ? -45 : 0}
                            textAnchor={timeframe === 'Last 30 days' || timeframe === 'Last 24 hours' ? 'end' : 'middle'}
                            height={timeframe === 'Last 30 days' || timeframe === 'Last 24 hours' ? 60 : 30}
                          />
                          <YAxis
                            axisLine={{ stroke: '#333333' }}
                            tickLine={{ stroke: '#333333' }}
                            tick={{ fill: '#666666', fontSize: 12 }}
                            width={60}
                            domain={[0, (dataMax: number) => dataMax * 1.5]}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Area
                            type="linear"
                            dataKey="crawls"
                            stroke="#fff"
                            strokeWidth={2}
                            fill="url(#crawlerGradient)"
                            dot={<CustomDot />}
                            activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: '#333' }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </motion.div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Side Cards - 40% width */}
          <div className="w-[40%] flex flex-col gap-6">


            {/* Attribution by Source Card */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="flex-1"
            >
              <Card className="h-full bg-[#0c0c0c] border-[#1a1a1a]">
                <CardHeader className="pb-4 pt-4 pl-6 flex-shrink-0 border-b border-[#1a1a1a]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        Attribution by Source
                      </h3>
                      <p className="text-sm text-[#666]">
                        {crawlerData.reduce((sum, c) => sum + c.crawls, 0).toLocaleString()} crawls tracked
                      </p>
                    </div>
                    <Link 
                      href="/dashboard/attribution/source"
                      className="text-sm text-[#888] hover:text-white transition-colors flex items-center gap-1"
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
                            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
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
                                <div className="w-2.5 h-2.5 rounded-full bg-[#666] hidden" />
                              </div>
                            </div>
                            <div>
                              <div className="text-white font-medium text-sm">{source.name}</div>
                              <div className="text-[#666] text-xs">
                                {source.crawls.toLocaleString()} crawls
                              </div>
                            </div>
                          </div>
                          <motion.div 
                            className="text-white font-semibold text-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.05 + 0.2, duration: 0.3 }}
                          >
                            {source.percentage.toFixed(1)}%
                          </motion.div>
                        </div>
                        <div className="w-full h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
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
            </motion.div>

            {/* Crawls by Page Card */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="flex-1"
            >
              <Card className="h-full bg-[#0c0c0c] border-[#1a1a1a]">
                <CardHeader className="pb-4 pt-4 pl-6 pr-6 flex-shrink-0 border-b border-[#1a1a1a]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        Crawls by Page
                      </h3>
                      <p className="text-sm text-[#666]">
                        {pageData.reduce((sum, p) => sum + p.totalCrawls, 0).toLocaleString()} total page crawls
                      </p>
                    </div>
                    <Link 
                      href="/dashboard/attribution/page"
                      className="text-sm text-[#888] hover:text-white transition-colors flex items-center gap-1"
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
                          <div className="flex items-center justify-between py-3 px-3 hover:bg-[#0f0f0f] rounded-lg transition-all duration-200 border border-transparent hover:border-[#1a1a1a]">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] group-hover:bg-[#222] transition-colors">
                                <span className="text-sm">{getPathIcon(page.path)}</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm text-white font-mono truncate mb-1">{page.path}</div>
                                <div className="flex items-center gap-2 text-xs text-[#666]">
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
                                <div className="text-lg font-semibold text-white">{page.totalCrawls}</div>
                                <div className="text-xs text-[#666]">crawls</div>
                              </div>
                              <div className="w-1 h-8 bg-[#1a1a1a] rounded-full overflow-hidden">
                                <motion.div 
                                  className="w-full bg-white rounded-full"
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
            </motion.div>
          </div>
        </div>
      )}
    </div>
  )
} 
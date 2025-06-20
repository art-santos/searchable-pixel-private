'use client'
import { motion, useReducedMotion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useRef } from "react"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { useAuth } from "@/contexts/AuthContext"
import { TimeframeOption } from "@/components/custom/timeframe-selector"
import { ChartSkeleton } from "@/components/skeletons"
import { EmptyStateBlur } from "@/components/ui/empty-state-blur"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'

interface ChartDataPoint {
  date: string
  crawls: number
  isCurrentPeriod?: boolean
  showLabel?: boolean
}

interface PeriodComparison {
  hasComparison: boolean
  percentChange?: number
  trend?: 'up' | 'down' | 'same'
}

interface CrawlerVisitsChartProps {
  timeframe: TimeframeOption
  onDataChange?: (data: { totalCrawls: number; periodComparison: PeriodComparison | null }) => void
  className?: string
  onConnectAnalytics?: () => void
}

// Mock data for empty state preview
const mockChartData: ChartDataPoint[] = [
  { date: 'Jan 1', crawls: 45, showLabel: true },
  { date: 'Jan 2', crawls: 52 },
  { date: 'Jan 3', crawls: 48 },
  { date: 'Jan 4', crawls: 61 },
  { date: 'Jan 5', crawls: 55 },
  { date: 'Jan 6', crawls: 67 },
  { date: 'Jan 7', crawls: 73, isCurrentPeriod: true, showLabel: true }
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

export function CrawlerVisitsChart({ timeframe, onDataChange, className = "", onConnectAnalytics }: CrawlerVisitsChartProps) {
  const shouldReduceMotion = useReducedMotion()
  const { currentWorkspace } = useWorkspace()
  const { session } = useAuth()
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [hasData, setHasData] = useState(false)
  const [prevFetchKey, setPrevFetchKey] = useState('')
  
  // Store onDataChange in a ref to avoid it causing re-renders
  const onDataChangeRef = useRef(onDataChange)
  useEffect(() => {
    onDataChangeRef.current = onDataChange
  }, [onDataChange])
  
  // Fetch chart data
  useEffect(() => {
    const fetchChartData = async () => {
      if (!currentWorkspace) return

      // Create a unique key for this fetch
      const fetchKey = `${timeframe}-${currentWorkspace.id}-${session?.access_token ? 'auth' : 'noauth'}`
      
      // Skip if we already fetched with this key
      if (fetchKey === prevFetchKey) return
      
      setPrevFetchKey(fetchKey)

      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        const response = await fetch(`/api/dashboard/crawler-visits?timeframe=${encodeURIComponent(timeframe)}&crawler=all&timezone=${encodeURIComponent(timezone)}&workspaceId=${currentWorkspace.id}`, {
          headers: {
            'Authorization': session?.access_token ? `Bearer ${session.access_token}` : ''
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          const newChartData = data.chartData || []
          
          setChartData(newChartData)
          setHasData(newChartData.length > 0 && newChartData.some((point: ChartDataPoint) => point.crawls > 0))
          
          // Pass data back to parent component using ref
          onDataChangeRef.current?.({
            totalCrawls: data.totalCrawls || 0,
            periodComparison: data.periodComparison || null
          })
        } else {
          console.log('API response not ok, using fallback data')
          setChartData([])
          setHasData(false)
          onDataChangeRef.current?.({ totalCrawls: 0, periodComparison: null })
        }
      } catch (error) {
        console.error('Error fetching chart data:', error)
        setChartData([])
        setHasData(false)
        onDataChangeRef.current?.({ totalCrawls: 0, periodComparison: null })
      } finally {
        setIsInitialLoad(false)
      }
    }

    fetchChartData()
  }, [timeframe, currentWorkspace, session?.access_token])

  // Show skeleton only on initial load
  if (isInitialLoad) {
    return (
      <ChartSkeleton 
        className={className}
        showHeader={false}
        showStats={false}
      />
    )
  }

  const displayData = hasData ? chartData : mockChartData

  const ChartComponent = () => (
    <motion.div 
      className={`h-full w-full relative text-gray-800 dark:text-gray-300 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.3, ease: "easeOut" }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={displayData}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
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
            stroke="currentColor"
            opacity={0.15}
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ 
              fill: 'currentColor', 
              fontSize: 11,
              fontFamily: 'var(--font-geist-mono)',
              letterSpacing: '-0.025em',
              opacity: 0.6
            }}
            tickFormatter={(value, index) => {
              const dataPoint = displayData[index]
              return dataPoint?.showLabel ? value : ''
            }}
            interval={0}
            height={30}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ 
              fill: 'currentColor', 
              fontSize: 11,
              fontFamily: 'var(--font-geist-mono)',
              letterSpacing: '-0.025em',
              opacity: 0.6
            }}
            width={40}
            domain={[0, (dataMax: number) => dataMax * 2]}
            tickCount={8}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="linear"
            dataKey="crawls"
            stroke="#ffffff"
            strokeWidth={1.5}
            fill="url(#crawlerGradient)"
            dot={false}
            activeDot={{ r: 4, stroke: '#ffffff', strokeWidth: 2, fill: 'var(--background)' }}
            animationDuration={0}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  )

  return (
    <EmptyStateBlur
      hasData={hasData}
      title="No data yet"
      description="Connect your analytics to track every time an AI engine crawls your pages"
      onAction={onConnectAnalytics}
    >
      <ChartComponent />
    </EmptyStateBlur>
  )
} 
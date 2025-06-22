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
    return (
      <div className="bg-white border border-gray-200 shadow-lg px-3 py-2 rounded-lg">
        <p className="text-sm text-gray-900 font-medium">
          {payload[0].value} visits
        </p>
        <p className="text-xs text-gray-600 mt-1">{label}</p>
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
      className={`h-full w-full relative text-gray-900 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.3, ease: "easeOut" }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={displayData}
          margin={{ top: 20, right: 24, left: 24, bottom: 20 }}
        >
          <defs>
            <linearGradient id="crawlerGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6B7280" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#6B7280" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            horizontal={true}
            strokeDasharray="0"
            stroke="#E5E7EB"
            strokeOpacity={1}
          />
          <XAxis
            dataKey="date"
            axisLine={{ stroke: '#E5E7EB', strokeWidth: 1 }}
            tickLine={false}
            tick={{ 
              fill: '#6B7280', 
              fontSize: 12,
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: 400
            }}
            tickFormatter={(value, index) => {
              const dataPoint = displayData[index]
              return dataPoint?.showLabel ? value : ''
            }}
            interval={0}
            height={40}
            tickMargin={12}
          />
          <YAxis
            axisLine={{ stroke: '#E5E7EB', strokeWidth: 1 }}
            tickLine={false}
            tick={{ 
              fill: '#6B7280', 
              fontSize: 12,
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: 400
            }}
            width={40}
            domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.2)]}
            tickCount={5}
            tickFormatter={(value) => {
              if (value === 0) return '0'
              if (value >= 1000) return `${(value/1000).toFixed(1)}k`
              return value.toString()
            }}
            orientation="left"
            tickMargin={12}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="linear"
            dataKey="crawls"
            stroke="#6B7280"
            strokeWidth={2}
            fill="url(#crawlerGradient)"
            dot={(props: any) => {
              const { cx, cy, payload } = props
              // Show dot for the last data point (current/active)
              const isLastPoint = payload === displayData[displayData.length - 1]
              
              if (!isLastPoint) return <g />
              
              return (
                <g>
                  <circle cx={cx} cy={cy} r={4} fill="#6B7280" stroke="#FFFFFF" strokeWidth={2} />
                  <circle cx={cx} cy={cy} r={4} fill="#6B7280" opacity={0.3}>
                    <animate
                      attributeName="r"
                      from="4"
                      to="8"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      from="0.3"
                      to="0"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              )
            }}
            activeDot={{ r: 4, stroke: '#6B7280', strokeWidth: 2, fill: '#FFFFFF' }}
            animationDuration={800}
            animationEasing="ease-out"
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
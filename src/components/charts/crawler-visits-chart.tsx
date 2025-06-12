'use client'
import { motion, useReducedMotion } from "framer-motion"
import { useState, useEffect } from "react"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { useAuth } from "@/contexts/AuthContext"
import { TimeframeOption } from "@/components/custom/timeframe-selector"
import { ChartSkeleton } from "@/components/skeletons"
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
}

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
      <g>
        {/* Pulsing ring animation */}
        <motion.circle
          cx={cx}
          cy={cy}
          r={8}
          fill="none"
          stroke="currentColor"
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
          fill="currentColor"
          stroke="var(--background)"
          strokeWidth={2}
        />
      </g>
    )
  }
  return null
}

export function CrawlerVisitsChart({ timeframe, onDataChange, className = "" }: CrawlerVisitsChartProps) {
  const shouldReduceMotion = useReducedMotion()
  const { currentWorkspace } = useWorkspace()
  const { session } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])

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
          
          // Pass data back to parent component
          onDataChange?.({
            totalCrawls: data.totalCrawls || 0,
            periodComparison: data.periodComparison || null
          })
        } else {
          console.log('API response not ok, using fallback data')
          setChartData([])
          onDataChange?.({ totalCrawls: 0, periodComparison: null })
        }
      } catch (error) {
        console.error('Error fetching chart data:', error)
        setChartData([])
        onDataChange?.({ totalCrawls: 0, periodComparison: null })
      } finally {
        setIsLoading(false)
      }
    }

    fetchChartData()
  }, [timeframe, currentWorkspace, session?.access_token])

  if (isLoading) {
    return (
      <ChartSkeleton 
        className={className}
        showHeader={false}
        showStats={false}
      />
    )
  }

  return (
    <div className={`h-full w-full relative text-gray-800 dark:text-gray-300 ${className}`} style={{ width: '100%', height: '100%' }}>
      <motion.div 
        className="h-full w-full"
        style={{ width: '100%', height: '100%' }}
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
          style={{ width: '100%', height: '100%' }}
          initial={{ clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)" }}
          animate={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
          transition={{ 
            duration: 1.5, 
            ease: [0.16, 1, 0.3, 1],
            delay: 0.4
          }}
        >
          <ResponsiveContainer width="100%" height="100%" style={{ width: '100%', height: '100%' }}>
            <AreaChart
              data={chartData}
              width="100%"
              height="100%"
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
                  const dataPoint = chartData[index]
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
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </motion.div>
    </div>
  )
} 
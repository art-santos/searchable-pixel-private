import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { TimeframeOption } from '@/components/custom/timeframe-selector'

type TimeframeType = TimeframeOption

interface ChartDataPoint {
  date: string
  crawls: number
  isCurrentPeriod?: boolean
}

interface ViewsChartProps {
  timeframe: TimeframeType
  isVisible: boolean
  setIsVisible: (visible: boolean) => void
  data: ChartDataPoint[]
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    dataKey: string
    payload?: ChartDataPoint
  }>
  label?: string
}

interface CustomDotProps {
  cx?: number
  cy?: number
  payload?: ChartDataPoint
  fill?: string
  stroke?: string
  strokeWidth?: number
  r?: number
}

const CustomDot = ({ cx, cy, payload, ...props }: CustomDotProps) => {
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
  
  return null // Don't show dots for non-current periods
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const isCurrentPeriod = payload[0].payload?.isCurrentPeriod
    
    return (
      <div className="bg-[#1a1a1a] border border-[#333333] px-3 py-2 rounded-lg">
        <p className="font-geist-mono text-sm text-white">
          {payload[0].value} crawls
          {isCurrentPeriod && (
            <span className="ml-2 text-xs text-green-400">● LIVE</span>
          )}
        </p>
        <p className="font-geist-mono text-xs text-[#666666]">{label}</p>
      </div>
    )
  }
  return null
}

export function ViewsChart({ timeframe, isVisible, setIsVisible, data }: ViewsChartProps) {
  // Show chart after initial mount with a slight delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [setIsVisible])

  // Determine if we should show fewer X-axis labels for different timeframes
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

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key={timeframe}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full"
        >
          <motion.div 
            className="h-full w-full relative"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ 
              duration: 0.3,
              ease: [0.16, 1, 0.3, 1],
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
          >
            <motion.div 
              className="absolute inset-0"
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
                  data={data}
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
                    type="linear"
                    dataKey="crawls"
                    stroke="#fff"
                    strokeWidth={2}
                    fill="url(#crawlerGradient)"
                    dot={<CustomDot />}
                    activeDot={{ 
                      r: 6, 
                      fill: '#fff',
                      stroke: '#333',
                      strokeWidth: 2
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 
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
  showLabel?: boolean
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
            ease: [0.42, 0, 0.58, 1]
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

  // Determine chart display settings based on timeframe
  const isHourlyData = timeframe === 'Last 24 hours'
  const isLongerTimeframe = timeframe === 'Last 90 days' || timeframe === 'Last 365 days'
  
  let labelAngle = 0
  let labelHeight = 30
  
  if (isHourlyData) {
    labelAngle = -45
    labelHeight = 60
  } else if (isLongerTimeframe) {
    labelAngle = -45
    labelHeight = 60
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
              ease: [0.42, 0, 0.58, 1],
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
                ease: [0.42, 0, 0.58, 1],
                delay: 0.4
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data}
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
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tick={{ 
                      fill: '#555555', 
                      fontSize: 11,
                      fontFamily: 'var(--font-geist-mono)',
                      letterSpacing: '-0.025em'
                    }}
                    tickLine={false}
                    interval={0}
                    angle={labelAngle}
                    textAnchor={labelAngle !== 0 ? 'end' : 'middle'}
                    height={labelHeight}
                    tickFormatter={(value, index) => {
                      const dataPoint = data[index]
                      return dataPoint?.showLabel ? value : ''
                    }}
                  />
                  <YAxis
                    axisLine={false}
                    tick={{ 
                      fill: '#555555', 
                      fontSize: 11,
                      fontFamily: 'var(--font-geist-mono)',
                      letterSpacing: '-0.025em'
                    }}
                    tickLine={false}
                    tickFormatter={(value) => `${value}`}
                    tickCount={8}
                    domain={[0, (dataMax: number) => dataMax * 2]}
                    width={40}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={false}
                  />
                  <Area
                    type="linear"
                    dataKey="crawls"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                    fill="url(#crawlerGradient)"
                    dot={false}
                    activeDot={{ 
                      r: 4, 
                      fill: '#0c0c0c',
                      stroke: '#ffffff',
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
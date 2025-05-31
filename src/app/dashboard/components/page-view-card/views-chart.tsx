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
import { TimeframeType } from '.'

interface ChartDataPoint {
  date: string
  crawls: number
}

interface ViewsChartProps {
  timeframe: TimeframeType
  isVisible: boolean
  setIsVisible: (visible: boolean) => void
  data: ChartDataPoint[]
}

interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333333] px-3 py-2">
        <p className="font-geist-mono text-sm text-white">{payload[0].value} crawls</p>
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
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 15, left: -16, bottom: 10 }}
            >
              <defs>
                <linearGradient id="crawlerGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fff" stopOpacity={0.12} />
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
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 
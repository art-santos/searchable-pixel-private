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

const data = [
  { date: 'APR 1', views: 280 },
  { date: 'APR 4', views: 200 },
  { date: 'APR 7', views: 300 },
  { date: 'APR 10', views: 250 },
  { date: 'APR 13', views: 371 },
  { date: 'APR 16', views: 280 },
  { date: 'APR 19', views: 450 },
]

interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333333] px-3 py-2">
        <p className="font-geist-mono text-sm text-white">{payload[0].value}</p>
        <p className="font-geist-mono text-xs text-[#666666]">{label}</p>
      </div>
    )
  }
  return null
}

interface ViewsChartProps {
  timeframe: TimeframeType
  isVisible: boolean
  setIsVisible: (visible: boolean) => void
}

export function ViewsChart({ timeframe, isVisible, setIsVisible }: ViewsChartProps) {
  // Show chart after initial mount with a slight delay
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div 
          className="h-full w-full relative"
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ 
            duration: 0.3,
            ease: [0.16, 1, 0.3, 1], // Custom ease-out curve
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
                margin={{ top: 10, right: 15, left: -16, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
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
                  dataKey="views"
                  stroke="#fff"
                  strokeWidth={2}
                  fill="url(#viewsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 
'use client'
import { useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  ScatterChart,
  Scatter,
  Cell
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { TimeframeSelector, TimeframeOption } from '@/components/custom/timeframe-selector'

interface ChartDataPoint {
  date: string
  score: number
  isCurrentPeriod?: boolean
  time?: string
  assessmentId?: string
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

interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
}

const CustomDot = ({ cx, cy, payload, ...props }: CustomDotProps) => {
  if (!cx || !cy || !payload || cx === undefined || cy === undefined) {
    return <g />  // Return empty group instead of null
  }
  
  return (
    <g>
      {/* Pulsing ring animation */}
      <motion.circle
        cx={cx}
        cy={cy}
        r="8"
        fill="none"
        stroke="#fff"
        strokeWidth={1}
        opacity={0.6}
        animate={{
          r: ["6", "12", "6"],
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
        r="4"
        fill="#fff"
        stroke="#333"
        strokeWidth={2}
      />
    </g>
  )
}

// Custom dot for single data point scatter chart
const SingleDataPointDot = (props: any) => {
  const { cx, cy } = props;
  if (!cx || !cy || cx === undefined || cy === undefined) return <g />;
  
  return (
    <g>
      {/* Pulsing ring animation */}
      <motion.circle
        cx={cx}
        cy={cy}
        r="8"
        fill="none"
        stroke="#fff"
        strokeWidth={1}
        opacity={0.6}
        animate={{
          r: ["8", "16", "8"],
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
        r="6"
        fill="#fff"
        stroke="#333"
        strokeWidth={2}
      />
    </g>
  )
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload as ChartDataPoint
    const isCurrentPeriod = dataPoint?.isCurrentPeriod
    const time = dataPoint?.time
    const assessmentId = dataPoint?.assessmentId
    
    return (
      <div className="bg-[#1a1a1a] border border-[#333333] px-3 py-2 rounded-lg">
        <p className="font-geist-mono text-sm text-white">
          {Math.round(payload[0].value)} score
          {isCurrentPeriod && (
            <span className="ml-2 text-xs text-green-400">● LIVE</span>
          )}
        </p>
        <p className="font-geist-mono text-xs text-[#666666]">
          {label}
          {time && <span className="ml-2 text-[#888888] font-medium">at {time}</span>}
        </p>
        {assessmentId && (
          <p className="font-geist-mono text-xs text-[#555555]">
            {assessmentId.substring(0, 8)}...
          </p>
        )}
      </div>
    )
  }
  return null
}

// Custom tick component to display date and time on separate lines
const CustomXAxisTick = (props: any) => {
  const { x, y, payload, index } = props;
  const chartData = props.chartData || [];
  const dataPoint = chartData[index];
  const hasTime = dataPoint?.time;
  
  if (!hasTime) {
    // If no time, render normally
    return (
      <g transform={`translate(${x},${y})`}>
        <text 
          x={0} 
          y={0} 
          dy={16} 
          textAnchor="middle" 
          fill="#666666" 
          fontSize="11"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace"
        >
          {payload.value}
        </text>
      </g>
    );
  }
  
  // Render date and time on separate lines
  return (
    <g transform={`translate(${x},${y})`}>
      <text 
        x={0} 
        y={0} 
        dy={12} 
        textAnchor="middle" 
        fill="#666666" 
        fontSize="11"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace"
      >
        {payload.value}
      </text>
      <text 
        x={0} 
        y={0} 
        dy={26} 
        textAnchor="middle" 
        fill="#888888" 
        fontSize="10"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace"
      >
        {dataPoint.time}
      </text>
    </g>
  );
};

interface VisibilityChartProps {
  timeframe: TimeframeOption
  onTimeframeChange: (timeframe: TimeframeOption) => void
  chartData: ChartDataPoint[]
  displayScore: number
  formatScore: (score: number) => string
  isChartVisible: boolean
  onMouseMove: (data: any) => void
  onMouseLeave: () => void
}

export function VisibilityChart({
  timeframe,
  onTimeframeChange,
  chartData,
  displayScore,
  formatScore,
  isChartVisible,
  onMouseMove,
  onMouseLeave
}: VisibilityChartProps) {
  const isSingleDataPoint = chartData.length === 1;
  const hasMultipleAssessmentsPerDay = chartData.some(point => point.time);
  
  // Debug logging (reduced)
  if (chartData.length === 0) {
    console.log('📊 Chart component: No data points');
  }
  


  return (
    <div>
      <div className="mb-6">
        <TimeframeSelector 
          title="Visibility Score"
          timeframe={timeframe} 
          onTimeframeChange={onTimeframeChange}
          titleColor="text-white"
          selectorColor="text-[#A7A7A7]"
        />
        <div className="text-5xl font-bold text-white mt-4">
          {formatScore(displayScore)}
        </div>
      </div>

      <div className="h-[500px]">
        <AnimatePresence mode="wait">
          {isChartVisible && (
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
                    {isSingleDataPoint ? (
                      // Show scatter chart for single data point
                      <ScatterChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: -40, bottom: 20 }}
                        onMouseMove={onMouseMove}
                        onMouseLeave={onMouseLeave}
                      >
                        <CartesianGrid
                          vertical={false}
                          horizontal={true}
                          strokeDasharray="4 4"
                          stroke="#333333"
                          opacity={0.4}
                        />
                        <XAxis
                          dataKey="date"
                          type="category"
                          axisLine={{ stroke: '#333333' }}
                          tick={<CustomXAxisTick chartData={chartData} />}
                          tickLine={false}
                          height={hasMultipleAssessmentsPerDay ? 50 : 30}
                        />
                        <YAxis
                          type="number"
                          axisLine={{ stroke: '#333333' }}
                          tick={{ 
                            fill: '#666666', 
                            fontSize: 11,
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace'
                          }}
                          tickLine={false}
                          domain={[0, 100]}
                          tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                          content={<CustomTooltip />}
                          cursor={false}
                        />
                        <Scatter
                          dataKey="score"
                          fill="#fff"
                          shape={<SingleDataPointDot />}
                        />
                      </ScatterChart>
                    ) : (
                      // Show area chart for multiple data points
                      <AreaChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: -40, bottom: 20 }}
                        onMouseMove={onMouseMove}
                        onMouseLeave={onMouseLeave}
                      >
                        <defs>
                          <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
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
                          tick={<CustomXAxisTick chartData={chartData} />}
                          tickLine={false}
                          height={hasMultipleAssessmentsPerDay ? 50 : 30}
                        />
                        <YAxis
                          axisLine={{ stroke: '#333333' }}
                          tick={{ 
                            fill: '#666666', 
                            fontSize: 11,
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace'
                          }}
                          tickLine={false}
                          domain={[0, 100]}
                          tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                          content={<CustomTooltip />}
                          cursor={false}
                        />
                        <Area
                          type="linear"
                          dataKey="score"
                          stroke="#fff"
                          strokeWidth={2}
                          fill="url(#scoreGradient)"
                          dot={<CustomDot />}
                          activeDot={{ 
                            r: 6, 
                            fill: '#fff',
                            stroke: '#333',
                            strokeWidth: 2
                          }}
                        />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
} 
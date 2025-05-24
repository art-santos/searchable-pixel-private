'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { OverviewTab } from './components/overview-tab'
// import { CitationsTab } from './components/citations-tab'
// import { TopicMapTab } from './components/topic-map-tab'
// import { GapsTab } from './components/gaps-tab'
import { TimeframeSelector, TimeframeOption } from '@/components/custom/timeframe-selector'
import { RefreshCwIcon, TrendingUpIcon, AlertTriangleIcon } from 'lucide-react'
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

// Mock chart data - 30 days
const chartData = [
  { date: 'APR 1', score: 45.2 },
  { date: 'APR 2', score: 44.8 },
  { date: 'APR 3', score: 43.1 },
  { date: 'APR 4', score: 42.1 },
  { date: 'APR 5', score: 43.7 },
  { date: 'APR 6', score: 46.2 },
  { date: 'APR 7', score: 48.3 },
  { date: 'APR 8', score: 49.1 },
  { date: 'APR 9', score: 51.4 },
  { date: 'APR 10', score: 52.7 },
  { date: 'APR 11', score: 54.3 },
  { date: 'APR 12', score: 56.8 },
  { date: 'APR 13', score: 58.9 },
  { date: 'APR 14', score: 57.2 },
  { date: 'APR 15', score: 56.4 },
  { date: 'APR 16', score: 55.4 },
  { date: 'APR 17', score: 58.1 },
  { date: 'APR 18', score: 61.7 },
  { date: 'APR 19', score: 65.2 },
  { date: 'APR 20', score: 63.8 },
  { date: 'APR 21', score: 62.4 },
  { date: 'APR 22', score: 64.1 },
  { date: 'APR 23', score: 66.3 },
  { date: 'APR 24', score: 68.7 },
  { date: 'APR 25', score: 67.2 },
  { date: 'APR 26', score: 69.4 },
  { date: 'APR 27', score: 71.8 },
  { date: 'APR 28', score: 70.3 },
  { date: 'APR 29', score: 72.1 },
  { date: 'APR 30', score: 74.5 },
]

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'citations', label: 'Citations' },
  { id: 'map', label: 'Topic Map' },
  { id: 'gaps', label: 'Gaps & Opportunities' },
]

interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333333] px-3 py-2 rounded">
        <p className="font-mono text-sm text-white">{payload[0].value}</p>
        <p className="font-mono text-xs text-[#666666]">{label}</p>
      </div>
    )
  }
  return null
}

export default function VisibilityPage() {
  const { loading } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [isRerolling, setIsRerolling] = useState(false)
  const [isChartVisible, setIsChartVisible] = useState(false)
  const [hoveredScore, setHoveredScore] = useState<number | null>(null)
  const [timeframe, setTimeframe] = useState<TimeframeOption>('This Month')

  // Mock data - replace with real API calls
  const baseVisibilityScore = 74.5 // Latest score from chart data
  const displayScore = hoveredScore !== null ? hoveredScore : baseVisibilityScore
  const deltaScore = 6
  const directPoints = 32
  const indirectPoints = 58
  const totalCitations = 86

  const handleReroll = async () => {
    setIsRerolling(true)
    setTimeout(() => {
      setIsRerolling(false)
    }, 3000)
  }

  // Show chart after initial mount with a slight delay
  useEffect(() => {
    const timer = setTimeout(() => setIsChartVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleMouseMove = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      setHoveredScore(data.activePayload[0].value)
    }
  }

  const handleMouseLeave = () => {
    setHoveredScore(null)
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-[#0c0c0c]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-white" />
      </div>
    )
  }

  return (
    <div className="h-full bg-[#0c0c0c] overflow-y-auto">
      <main className="h-full flex flex-col p-6">
        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-6">
          {tabs.map((tab) => {
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-2 rounded-md text-sm font-mono tracking-tight transition-colors border
                  ${activeTab === tab.id 
                    ? 'bg-[#222] text-white border-[#444]' 
                    : 'text-[#666] hover:text-white hover:bg-[#1a1a1a] border-[#333]'
                  }
                `}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Main Chart Area */}
        <div className="flex-1 grid grid-cols-12 gap-8 min-h-0">
          {/* Chart Section */}
          <div className="col-span-8 flex flex-col min-h-0">
            {/* Score Header */}
            <div className="mb-6">
              <TimeframeSelector 
                title="Visibility Score"
                timeframe={timeframe} 
                onTimeframeChange={setTimeframe}
                titleColor="text-white"
                selectorColor="text-[#A7A7A7]"
              />
              <div className="text-5xl font-bold text-white transition-all duration-200 mt-4">
                {displayScore.toFixed(1)}
              </div>
            </div>

            {/* Chart Container */}
            <div className="flex-1 rounded-lg p-0 min-h-0">
              <AnimatePresence mode="wait">
                {isChartVisible && (
                  <motion.div 
                    className="h-full w-full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ 
                      duration: 0.2,
                      ease: [0.16, 1, 0.3, 1], // Custom ease-out curve
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: -40, bottom: 20 }}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                      >
                        <defs>
                          <linearGradient id="visibilityGradient" x1="0" y1="0" x2="0" y2="1">
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
                          interval={2}
                        />
                        <YAxis
                          domain={[0, 100]}
                          ticks={[0, 20, 40, 60, 80, 100]}
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
                          dataKey="score"
                          stroke="#fff"
                          strokeWidth={2}
                          fill="url(#visibilityGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="col-span-4 pl-8 space-y-8">
            {/* Citation Metrics */}
            <div>
              <div className="text-[#666] text-sm mb-4 font-mono tracking-tight">Citation Breakdown</div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-white text-sm font-mono tracking-tight">Direct Points</span>
                  </div>
                  <span className="text-white font-semibold font-mono">{directPoints}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-white text-sm font-mono tracking-tight">Indirect Points</span>
                  </div>
                  <span className="text-white font-semibold font-mono">{indirectPoints}</span>
                </div>
                <div className="pt-3 border-t border-[#222]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#666] text-sm font-mono tracking-tight">Total Citations</span>
                    <span className="text-white font-semibold font-mono">{totalCitations}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <div className="text-[#666] text-sm mb-4 font-mono tracking-tight">Quick Actions</div>
              <div className="space-y-3">
                <Button 
                  onClick={handleReroll}
                  disabled={isRerolling}
                  className="w-full bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-white justify-start font-mono tracking-tight"
                >
                  <RefreshCwIcon className={`h-4 w-4 mr-2 ${isRerolling ? 'animate-spin' : ''}`} />
                  {isRerolling ? 'Rerolling...' : 'Reroll Score'}
                </Button>
                <Button 
                  onClick={() => setActiveTab('citations')}
                  className="w-full bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-white justify-start font-mono tracking-tight"
                >
                  <TrendingUpIcon className="h-4 w-4 mr-2" />
                  View All Citations
                </Button>
                <Button 
                  onClick={() => setActiveTab('gaps')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start font-mono tracking-tight"
                >
                  <AlertTriangleIcon className="h-4 w-4 mr-2" />
                  Fill Content Gaps
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 
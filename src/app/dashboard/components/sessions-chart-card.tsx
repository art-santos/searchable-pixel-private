'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Calendar, Filter, TrendingUp } from "lucide-react"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { useEffect, useState } from "react"

interface ChartData {
  date: string
  ChatGPT: number
  Claude: number
  Perplexity: number
  Gemini: number
  'Other LLMs': number
}

interface FilterState {
  dateRange: 'today' | '7days' | '30days' | 'custom'
  platforms: {
    ChatGPT: boolean
    Claude: boolean
    Perplexity: boolean
    Gemini: boolean
    'Other LLMs': boolean
  }
}

export function SessionsChartCard() {
  const { currentWorkspace } = useWorkspace()
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>({
    dateRange: '7days',
    platforms: {
      ChatGPT: true,
      Claude: true,
      Perplexity: true,
      Gemini: true,
      'Other LLMs': true
    }
  })

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.42, 0, 0.58, 1] } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.42, 0, 0.58, 1] } }
  }

  useEffect(() => {
    const fetchChartData = async () => {
      if (!currentWorkspace) {
        setLoading(false)
        return
      }

      try {
        // Mock data - replace with actual API call
        setTimeout(() => {
          const mockData: ChartData[] = [
            { date: '2024-01-01', ChatGPT: 450, Claude: 320, Perplexity: 180, Gemini: 120, 'Other LLMs': 80 },
            { date: '2024-01-02', ChatGPT: 520, Claude: 380, Perplexity: 220, Gemini: 140, 'Other LLMs': 95 },
            { date: '2024-01-03', ChatGPT: 480, Claude: 350, Perplexity: 200, Gemini: 130, 'Other LLMs': 90 },
            { date: '2024-01-04', ChatGPT: 620, Claude: 420, Perplexity: 280, Gemini: 170, 'Other LLMs': 110 },
            { date: '2024-01-05', ChatGPT: 580, Claude: 390, Perplexity: 260, Gemini: 160, 'Other LLMs': 105 },
            { date: '2024-01-06', ChatGPT: 710, Claude: 480, Perplexity: 320, Gemini: 200, 'Other LLMs': 130 },
            { date: '2024-01-07', ChatGPT: 650, Claude: 440, Perplexity: 300, Gemini: 180, 'Other LLMs': 120 }
          ]
          setData(mockData)
          setLoading(false)
        }, 800)
      } catch (error) {
        console.error('Error fetching chart data:', error)
        setLoading(false)
      }
    }

    fetchChartData()
  }, [currentWorkspace, filters.dateRange])

  const platformColors = {
    ChatGPT: '#10b981',
    Claude: '#6366f1', 
    Perplexity: '#f59e0b',
    Gemini: '#ec4899',
    'Other LLMs': '#6b7280'
  }

  const togglePlatform = (platform: keyof FilterState['platforms']) => {
    setFilters(prev => ({
      ...prev,
      platforms: {
        ...prev.platforms,
        [platform]: !prev.platforms[platform]
      }
    }))
  }

  const setDateRange = (range: FilterState['dateRange']) => {
    setFilters(prev => ({ ...prev, dateRange: range }))
  }

  const getMaxValue = () => {
    if (!data.length) return 1000
    const maxValues = data.map(d => 
      Object.entries(d)
        .filter(([key]) => key !== 'date' && filters.platforms[key as keyof FilterState['platforms']])
        .reduce((sum, [_, value]) => sum + (value as number), 0)
    )
    return Math.max(...maxValues)
  }

  const maxValue = getMaxValue()

  if (loading) {
    return (
      <motion.div
        key="loading-skeleton"
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="h-full"
      >
        <Card className="bg-white border border-gray-200 shadow-sm h-full">
          <CardContent className="p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="h-6 w-48 bg-gray-200 animate-pulse rounded"></div>
              <div className="flex gap-2">
                <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
              </div>
            </div>
            <div className="h-64 bg-gray-100 animate-pulse rounded"></div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      className="h-full"
    >
      <Card className="bg-white border border-gray-200 shadow-sm h-full">
        <CardContent className="p-6 h-full flex flex-col">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
            className="flex items-center justify-between mb-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 flex items-center justify-center rounded">
                <TrendingUp className="w-4 h-4 text-gray-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Session Volume by LLM Source</h2>
            </div>
            
            {/* Filters */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.3 } }
              }}
              className="flex gap-2"
            >
              <div className="flex gap-1">
                {(['today', '7days', '30days'] as const).map((range, index) => (
                  <motion.div key={range} variants={itemVariants}>
                    <Button
                      variant={filters.dateRange === range ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDateRange(range)}
                      className="text-xs"
                    >
                      {range === 'today' ? 'Today' : range === '7days' ? '7d' : '30d'}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Chart Area */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4, ease: [0.42, 0, 0.58, 1] }}
            className="flex-1 mb-4"
          >
            <div className="h-64 relative">
              <svg width="100%" height="100%" viewBox="0 0 800 200" className="overflow-visible">
                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <line
                    key={i}
                    x1="50"
                    y1={50 + (i * 30)}
                    x2="750"
                    y2={50 + (i * 30)}
                    stroke="#f3f4f6"
                    strokeWidth="1"
                  />
                ))}
                
                {/* Data lines */}
                {Object.entries(platformColors).map(([platform, color]) => {
                  if (!filters.platforms[platform as keyof FilterState['platforms']]) return null
                  
                  const points = data.map((d, i) => {
                    const x = 50 + (i * (700 / (data.length - 1)))
                    const y = 170 - ((d[platform as keyof ChartData] as number) / maxValue) * 120
                    return `${x},${y}`
                  }).join(' ')

                  return (
                    <motion.polyline
                      key={platform}
                      points={points}
                      fill="none"
                      stroke={color}
                      strokeWidth="2"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 1.5, delay: 0.8, ease: [0.42, 0, 0.58, 1] }}
                      className="transition-all duration-200"
                    />
                  )
                })}
                
                {/* Data points */}
                {Object.entries(platformColors).map(([platform, color]) => {
                  if (!filters.platforms[platform as keyof FilterState['platforms']]) return null
                  
                  return data.map((d, i) => {
                    const x = 50 + (i * (700 / (data.length - 1)))
                    const y = 170 - ((d[platform as keyof ChartData] as number) / maxValue) * 120
                    
                    return (
                      <motion.circle
                        key={`${platform}-${i}`}
                        cx={x}
                        cy={y}
                        r="3"
                        fill={color}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.5 + (i * 0.05), duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
                        className="hover:r-4 transition-all duration-200"
                      />
                    )
                  })
                })}
              </svg>
            </div>
          </motion.div>

          {/* Legend */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 1.8 } }
            }}
            className="flex flex-wrap gap-4 text-sm"
          >
            {Object.entries(platformColors).map(([platform, color]) => (
              <motion.button
                key={platform}
                onClick={() => togglePlatform(platform as keyof FilterState['platforms'])}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
                className={`flex items-center gap-2 transition-all duration-200 ${
                  filters.platforms[platform as keyof FilterState['platforms']] 
                    ? 'opacity-100' 
                    : 'opacity-50'
                }`}
              >
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: color }}
                ></div>
                <span className="text-gray-700">{platform}</span>
              </motion.button>
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
'use client'

import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Minus, Bot } from "lucide-react"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { useEffect, useState } from "react"

interface LLMData {
  rank: number
  platform: string
  sessions: number
  percentage: number
  avgDuration: string
  growth: number
  growthType: 'up' | 'down' | 'flat'
}

export function TopLLMsTableCard() {
  const { currentWorkspace } = useWorkspace()
  const [data, setData] = useState<LLMData[]>([])
  const [loading, setLoading] = useState(true)

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.42, 0, 0.58, 1] } }
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.42, 0, 0.58, 1] } }
  }

  useEffect(() => {
    const fetchLLMData = async () => {
      if (!currentWorkspace) {
        setLoading(false)
        return
      }

      try {
        // Mock data - replace with actual API call
        setTimeout(() => {
          const mockData: LLMData[] = [
            {
              rank: 1,
              platform: 'ChatGPT',
              sessions: 5632,
              percentage: 43.8,
              avgDuration: '4m 32s',
              growth: 23.5,
              growthType: 'up'
            },
            {
              rank: 2,
              platform: 'Claude',
              sessions: 3847,
              percentage: 29.9,
              avgDuration: '5m 18s',
              growth: 15.2,
              growthType: 'up'
            },
            {
              rank: 3,
              platform: 'Perplexity',
              sessions: 1923,
              percentage: 15.0,
              avgDuration: '3m 45s',
              growth: -2.3,
              growthType: 'down'
            },
            {
              rank: 4,
              platform: 'Gemini',
              sessions: 897,
              percentage: 7.0,
              avgDuration: '3m 12s',
              growth: 8.7,
              growthType: 'up'
            },
            {
              rank: 5,
              platform: 'Microsoft Copilot',
              sessions: 445,
              percentage: 3.5,
              avgDuration: '2m 58s',
              growth: 0.0,
              growthType: 'flat'
            },
            {
              rank: 6,
              platform: 'Other LLMs',
              sessions: 103,
              percentage: 0.8,
              avgDuration: '2m 15s',
              growth: 12.1,
              growthType: 'up'
            }
          ]
          setData(mockData)
          setLoading(false)
        }, 600)
      } catch (error) {
        console.error('Error fetching LLM data:', error)
        setLoading(false)
      }
    }

    fetchLLMData()
  }, [currentWorkspace])

  const getGrowthIcon = (growthType: LLMData['growthType']) => {
    switch (growthType) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />
      default: return <Minus className="w-4 h-4 text-gray-400" />
    }
  }

  const getGrowthColor = (growthType: LLMData['growthType']) => {
    switch (growthType) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      default: return 'text-gray-500'
    }
  }

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      'ChatGPT': 'bg-green-100 text-green-700',
      'Claude': 'bg-indigo-100 text-indigo-700',
      'Perplexity': 'bg-amber-100 text-amber-700',
      'Gemini': 'bg-pink-100 text-pink-700',
      'Microsoft Copilot': 'bg-blue-100 text-blue-700',
      'Other LLMs': 'bg-gray-100 text-gray-700'
    }
    return colors[platform] || 'bg-gray-100 text-gray-700'
  }

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
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-6 w-48 bg-gray-200 animate-pulse rounded"></div>
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-6 h-6 bg-gray-200 animate-pulse rounded"></div>
                    <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                  <div className="flex gap-8">
                    <div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div>
                    <div className="h-4 w-12 bg-gray-200 animate-pulse rounded"></div>
                    <div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                </div>
              ))}
            </div>
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
            className="flex items-center gap-3 mb-6"
          >
            <div className="w-8 h-8 bg-gray-100 flex items-center justify-center rounded">
              <Bot className="w-4 h-4 text-gray-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Top LLMs by Sessions</h2>
          </motion.div>

          {/* Table Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
            className="grid grid-cols-12 gap-4 pb-3 mb-4 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide"
          >
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">Platform</div>
            <div className="col-span-2">Sessions</div>
            <div className="col-span-2">% Traffic</div>
            <div className="col-span-2">Avg Duration</div>
            <div className="col-span-1">Growth</div>
          </motion.div>

          {/* Table Body */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.4 } }
            }}
            className="flex-1 space-y-2"
          >
            {data.map((llm, index) => (
              <motion.div
                key={llm.platform}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
                className="grid grid-cols-12 gap-4 items-center py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {/* Rank */}
                <div className="col-span-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    llm.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                    llm.rank === 2 ? 'bg-gray-100 text-gray-700' :
                    llm.rank === 3 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-50 text-gray-600'
                  }`}>
                    {llm.rank}
                  </div>
                </div>

                {/* Platform */}
                <div className="col-span-4">
                  <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPlatformColor(llm.platform)}`}>
                    {llm.platform}
                  </div>
                </div>

                {/* Sessions */}
                <div className="col-span-2">
                  <div className="text-sm font-semibold text-gray-900">
                    {llm.sessions.toLocaleString()}
                  </div>
                </div>

                {/* Percentage */}
                <div className="col-span-2">
                  <div className="text-sm text-gray-600">
                    {llm.percentage.toFixed(1)}%
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                      style={{ width: `${llm.percentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Average Duration */}
                <div className="col-span-2">
                  <div className="text-sm text-gray-600">
                    {llm.avgDuration}
                  </div>
                </div>

                {/* Growth */}
                <div className="col-span-1">
                  <div className="flex items-center gap-1">
                    {getGrowthIcon(llm.growthType)}
                    <span className={`text-xs font-medium ${getGrowthColor(llm.growthType)}`}>
                      {llm.growth > 0 ? '+' : ''}{llm.growth.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Footer Insights */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
            className="mt-4 pt-4 border-t border-gray-100"
          >
            <p className="text-xs text-gray-500">
              💡 <strong>Insight:</strong> ChatGPT leads with highest session count and strong growth. 
              Claude shows excellent engagement with longest average duration.
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
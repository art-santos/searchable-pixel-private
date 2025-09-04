'use client'

import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Bot, Users, TrendingUp, Eye } from "lucide-react"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { useEffect, useState } from "react"

interface KPIData {
  totalAISessions: number
  uniqueAIVisitors: number
  topPlatform: string
  topPlatformSessions: number
  growthRate: number
}

interface KPICardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: React.ElementType
  loading?: boolean
}

function KPICard({ title, value, change, changeType = 'neutral', icon: Icon, loading = false }: KPICardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive': return 'text-green-600'
      case 'negative': return 'text-red-600'
      default: return 'text-gray-500'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
      className="h-full"
    >
      <Card className="bg-white border border-gray-200 shadow-sm h-full">
        <CardContent className="p-4 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between flex-1">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
              {loading ? (
                <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <motion.p
                  key={value}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: [0.42, 0, 0.58, 1] }}
                  className="text-2xl font-bold text-gray-900"
                >
                  {value.toLocaleString()}
                </motion.p>
              )}
              {change && !loading && (
                <motion.p
                  key={change}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.2, ease: [0.42, 0, 0.58, 1] }}
                  className={`text-xs mt-1 ${getChangeColor()}`}
                >
                  {change}
                </motion.p>
              )}
            </div>
            <div className="w-10 h-10 bg-gray-50 flex items-center justify-center rounded-lg">
              <Icon className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function TopKPIsCard() {
  const { currentWorkspace } = useWorkspace()
  const [data, setData] = useState<KPIData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchKPIData = async () => {
      if (!currentWorkspace) {
        setLoading(false)
        return
      }

      try {
        // Mock data - replace with actual API call
        setTimeout(() => {
          setData({
            totalAISessions: 12847,
            uniqueAIVisitors: 8342,
            topPlatform: 'ChatGPT',
            topPlatformSessions: 5632,
            growthRate: 23.5
          })
          setLoading(false)
        }, 1000)
      } catch (error) {
        console.error('Error fetching KPI data:', error)
        setLoading(false)
      }
    }

    fetchKPIData()
  }, [currentWorkspace])

  const kpiCards = [
    {
      title: 'Total AI-driven Sessions',
      value: data?.totalAISessions || 0,
      change: loading ? undefined : `+${data?.growthRate}% vs last period`,
      changeType: 'positive' as const,
      icon: Bot
    },
    {
      title: 'Unique AI Visitors',
      value: data?.uniqueAIVisitors || 0,
      change: loading ? undefined : '+15.2% vs last period',
      changeType: 'positive' as const,
      icon: Users
    },
    {
      title: 'Top Referring Platform',
      value: loading ? 0 : data?.topPlatform || 'ChatGPT',
      change: loading ? undefined : `${data?.topPlatformSessions?.toLocaleString()} sessions`,
      changeType: 'neutral' as const,
      icon: TrendingUp
    },
    {
      title: 'Platform Diversity',
      value: loading ? 0 : '8',
      change: loading ? undefined : '3 new this week',
      changeType: 'positive' as const,
      icon: Eye
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiCards.map((kpi, index) => (
        <motion.div
          key={kpi.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
        >
          <KPICard
            title={kpi.title}
            value={kpi.value}
            change={kpi.change}
            changeType={kpi.changeType}
            icon={kpi.icon}
            loading={loading}
          />
        </motion.div>
      ))}
    </div>
  )
}
'use client'

import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Activity, ExternalLink, Clock } from "lucide-react"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { useEffect, useState } from "react"
import { AnimatePresence } from "framer-motion"

interface ReferralData {
  id: string
  timestamp: string
  platform: string
  pageUrl: string
  sessionId: string
  deviceType: 'desktop' | 'mobile' | 'tablet'
  location?: string
}

export function RecentReferralsCard() {
  const { currentWorkspace } = useWorkspace()
  const [data, setData] = useState<ReferralData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReferralsData = async () => {
      if (!currentWorkspace) {
        setLoading(false)
        return
      }

      try {
        // Mock data - replace with actual API call
        setTimeout(() => {
          const mockData: ReferralData[] = [
            {
              id: '1',
              timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 min ago
              platform: 'ChatGPT',
              pageUrl: '/blog/ai-vs-seo',
              sessionId: 'sess_abc123',
              deviceType: 'desktop',
              location: 'San Francisco, CA'
            },
            {
              id: '2', 
              timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
              platform: 'Claude',
              pageUrl: '/pricing',
              sessionId: 'sess_def456',
              deviceType: 'mobile',
              location: 'New York, NY'
            },
            {
              id: '3',
              timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(), // 8 min ago
              platform: 'Perplexity',
              pageUrl: '/docs/searchable-api',
              sessionId: 'sess_ghi789',
              deviceType: 'desktop',
              location: 'London, UK'
            },
            {
              id: '4',
              timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(), // 12 min ago
              platform: 'Gemini',
              pageUrl: '/features',
              sessionId: 'sess_jkl012',
              deviceType: 'tablet',
              location: 'Toronto, CA'
            },
            {
              id: '5',
              timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 min ago
              platform: 'ChatGPT',
              pageUrl: '/about',
              sessionId: 'sess_mno345',
              deviceType: 'desktop',
              location: 'Berlin, DE'
            },
            {
              id: '6',
              timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(), // 18 min ago
              platform: 'Claude',
              pageUrl: '/blog/llm-tracking-guide',
              sessionId: 'sess_pqr678',
              deviceType: 'mobile',
              location: 'Sydney, AU'
            },
            {
              id: '7',
              timestamp: new Date(Date.now() - 22 * 60 * 1000).toISOString(), // 22 min ago
              platform: 'Perplexity',
              pageUrl: '/integrations',
              sessionId: 'sess_stu901',
              deviceType: 'desktop',
              location: 'Tokyo, JP'
            },
            {
              id: '8',
              timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 min ago
              platform: 'ChatGPT',
              pageUrl: '/contact',
              sessionId: 'sess_vwx234',
              deviceType: 'mobile',
              location: 'Paris, FR'
            }
          ]
          setData(mockData)
          setLoading(false)
        }, 400)
      } catch (error) {
        console.error('Error fetching referrals data:', error)
        setLoading(false)
      }
    }

    fetchReferralsData()

    // Set up real-time updates (mock)
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance of new referral every 10 seconds
        const newReferral: ReferralData = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          platform: ['ChatGPT', 'Claude', 'Perplexity', 'Gemini'][Math.floor(Math.random() * 4)],
          pageUrl: ['/blog/ai-vs-seo', '/pricing', '/docs/searchable-api', '/features'][Math.floor(Math.random() * 4)],
          sessionId: `sess_${Math.random().toString(36).substr(2, 9)}`,
          deviceType: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)] as 'desktop' | 'mobile' | 'tablet',
          location: ['San Francisco, CA', 'New York, NY', 'London, UK', 'Berlin, DE'][Math.floor(Math.random() * 4)]
        }
        
        setData(prev => [newReferral, ...prev.slice(0, 9)]) // Keep only latest 10
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [currentWorkspace])

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      'ChatGPT': 'bg-green-100 text-green-700 border-green-200',
      'Claude': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'Perplexity': 'bg-amber-100 text-amber-700 border-amber-200',
      'Gemini': 'bg-pink-100 text-pink-700 border-pink-200'
    }
    return colors[platform] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'desktop': return '💻'
      case 'mobile': return '📱'
      case 'tablet': return '📟'
      default: return '💻'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    return time.toLocaleDateString()
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.42, 0, 0.58, 1] } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.42, 0, 0.58, 1] } }
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
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="w-2 h-2 bg-gray-200 animate-pulse rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-gray-200 animate-pulse rounded mb-2"></div>
                    <div className="h-3 w-48 bg-gray-200 animate-pulse rounded"></div>
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
            className="flex items-center justify-between mb-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 flex items-center justify-center rounded">
                <Activity className="w-4 h-4 text-gray-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Recent LLM Referrals</h2>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live</span>
            </div>
          </motion.div>

          {/* Activity Feed */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.3 } }
            }}
            className="flex-1 space-y-3 overflow-y-auto"
          >
            {data.map((referral, index) => (
              <motion.div
                key={referral.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.2, ease: [0.42, 0, 0.58, 1] }}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
              >
                {/* Timeline dot */}
                <div className="flex flex-col items-center mt-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  {index < data.length - 1 && <div className="w-px h-8 bg-gray-200 mt-2"></div>}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getPlatformColor(referral.platform)}`}>
                      {referral.platform}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(referral.timestamp)}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <span>{getDeviceIcon(referral.deviceType)}</span>
                      {referral.location}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 truncate" title={referral.pageUrl}>
                      {referral.pageUrl}
                    </span>
                    <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>Session: {referral.sessionId}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(referral.timestamp)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Footer Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
            className="mt-4 pt-4 border-t border-gray-100"
          >
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {data.length} referrals in the last hour
              </span>
              <span>
                Auto-refreshing every 10s
              </span>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
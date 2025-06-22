'use client'

import { motion, useReducedMotion, AnimatePresence } from "framer-motion"
import { TimeframeSelector, TimeframeOption } from "@/components/custom/timeframe-selector"
import { useState, useEffect } from "react"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { useAuth } from "@/contexts/AuthContext"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { TableSkeleton } from '@/components/skeletons'
import { PlanType } from "@/lib/subscription/config"
import { ExportDropdown } from '@/components/ui/export-dropdown'
import { ExportData, formatStatsForExport, formatChartDataForExport, formatRecentActivityForExport } from '@/lib/export-utils'

interface CrawlerBot {
  botName: string
  company: string
  totalCrawls: number
  pathsVisited: number
  avgInterval: string
  crawlerCount: number
  lastSeen: string
  pages: Array<{
    path: string
    visits: number
    lastVisit: string
  }>
}

export default function AttributionBySourcePage() {
  const shouldReduceMotion = useReducedMotion()
  const [timeframe, setTimeframe] = useState<TimeframeOption>('Last 7 days')
  const { currentWorkspace, switching } = useWorkspace()
  const { supabase, session } = useAuth()
  const [bots, setBots] = useState<CrawlerBot[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [userPlan, setUserPlan] = useState<PlanType>('starter')
  const [userPlanLoading, setUserPlanLoading] = useState(true)

  // Map timeframe options to API parameters
  const timeframeMap: Record<TimeframeOption, string> = {
    'Last 24 hours': 'last24h',
    'Last 7 days': 'last7d',
    'Last 30 days': 'last30d',
    'Last 90 days': 'last90d',
    'Last 365 days': 'last365d'
  }

  // Fetch user subscription plan
  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const response = await fetch('/api/user/subscription')
        if (response.ok) {
          const data = await response.json()
          const plan = data.subscriptionPlan || 'starter'
          console.log('🔍 [AttributionBySourcePage] Fetched user plan:', plan, 'isAdmin:', data.isAdmin)
          setUserPlan(plan as PlanType)
        } else {
          console.error('Failed to fetch user plan, response not ok')
        }
      } catch (error) {
        console.error('Error fetching user plan:', error)
      } finally {
        setUserPlanLoading(false)
      }
    }

    fetchUserPlan()
  }, [])

  useEffect(() => {
    if (currentWorkspace) {
      fetchBots()
    }
  }, [timeframe, currentWorkspace])

  const fetchBots = async () => {
    if (!currentWorkspace) return
    
    setIsLoading(true)
    try {
      // Auto-detect user's timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      
      const response = await fetch(`/api/dashboard/attribution-bots?timeframe=${timeframeMap[timeframe]}&workspaceId=${currentWorkspace.id}`, {
        headers: {
          'Authorization': session?.access_token ? `Bearer ${session.access_token}` : ''
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setBots(data.bots || [])
      }
    } catch (error) {
      console.error('Error fetching bots:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getFaviconForCompany = (company: string) => {
    const companyDomainMap: Record<string, string> = {
      'OpenAI': 'openai.com',
      'Anthropic': 'anthropic.com', 
      'Google': 'google.com',
      'Perplexity': 'perplexity.ai',
      'Microsoft': 'microsoft.com',
      'Meta': 'meta.com',
      'Twitter': 'twitter.com',
      'X': 'x.com'
    }

    const domain = companyDomainMap[company]
    if (domain) {
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
    }
    
    const constructedDomain = `${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`
    return `https://www.google.com/s2/favicons?domain=${constructedDomain}&sz=128`
  }



  const formatRelativeTime = (timeStr: string) => {
    const now = new Date()
    const time = new Date(timeStr)
    const diffMs = now.getTime() - time.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return time.toLocaleDateString()
  }

  // Prepare export data
  const exportData: ExportData = {
    stats: {
      totalBots: bots.length,
      totalCrawls: bots.reduce((sum, bot) => sum + bot.totalCrawls, 0),
      totalPaths: bots.reduce((sum, bot) => sum + bot.pathsVisited, 0),
      timeframe: timeframe
    },
    chartData: [], // No chart data for list view
    recentActivity: bots.map(bot => ({
      botName: bot.botName,
      company: bot.company,
      totalCrawls: bot.totalCrawls,
      pathsVisited: bot.pathsVisited,
      avgInterval: bot.avgInterval,
      lastSeen: bot.lastSeen
    })),
    metadata: {
      title: 'Attribution by Source',
      timeframe,
      exportDate: new Date().toLocaleString(),
      domain: currentWorkspace?.domain
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div id="source-list-export" className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Link 
              href="/dashboard/attribution" 
              className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Overview</span>
            </Link>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">Attribution by Source</h1>
              <p className="text-gray-600">Crawler bots ({timeframe.toLowerCase()})</p>
            </div>
            <div className="flex items-center gap-4">
              {!userPlanLoading && (
                <TimeframeSelector 
                  key={userPlan}
                  title=""
                  timeframe={timeframe}
                  onTimeframeChange={setTimeframe}
                  titleColor="text-gray-900"
                  selectorColor="text-gray-600"
                  userPlan={userPlan}
                />
              )}
              <ExportDropdown 
                data={exportData}
                elementId="source-list-export"
              />
            </div>
          </div>
        </motion.div>

        {switching ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          </div>
        ) : isLoading ? (
          <TableSkeleton 
            rows={8}
            columns={[
              { span: 4, align: 'left' },
              { span: 2, align: 'center' },
              { span: 2, align: 'center' },
              { span: 2, align: 'center' },
              { span: 2, align: 'right' }
            ]}
            showExpandableRows={false}
          />
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <div className="col-span-4">Bot Name</div>
              <div className="col-span-2 text-center">Total Crawls</div>
              <div className="col-span-2 text-center">Paths Visited</div>
              <div className="col-span-2 text-center">Avg Interval</div>
              <div className="col-span-2 text-right">Last Seen</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {bots.map((bot, index) => (
                <motion.div
                  key={bot.botName}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Link 
                    href={`/dashboard/attribution/source/${encodeURIComponent(bot.botName)}`}
                    className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors block"
                  >
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-50 border border-gray-200 rounded-lg">
                        <img 
                          src={getFaviconForCompany(bot.company)}
                          alt={bot.company}
                          width={16}
                          height={16}
                          className="w-4 h-4 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      </div>
                      <div>
                        <div className="text-gray-900 text-sm font-medium hover:text-blue-600 transition-colors">
                          {bot.botName}
                        </div>
                        <div className="text-gray-500 text-xs">{bot.company}</div>
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <div className="text-gray-900 text-sm font-mono font-medium">{bot.totalCrawls.toLocaleString()}</div>
                    </div>
                    <div className="col-span-2 text-center">
                      <div className="text-gray-900 text-sm font-mono font-medium">{bot.pathsVisited}</div>
                    </div>
                    <div className="col-span-2 text-center">
                      <div className="text-gray-700 text-sm">{bot.avgInterval}</div>
                    </div>
                    <div className="col-span-2 text-right">
                      <div className="text-gray-600 text-sm">{formatRelativeTime(bot.lastSeen)}</div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {bots.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-sm">No crawler bots found for this timeframe.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 
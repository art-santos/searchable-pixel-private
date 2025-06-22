'use client'

import { motion, AnimatePresence } from "framer-motion"
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

interface CrawledPage {
  path: string
  totalVisits: number
  lastVisit: string
  bots: Array<{
    botName: string
    company: string
    visits: number
    lastVisit: string
    icon?: string
  }>
}

export default function AttributionByPagePage() {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('Last 7 days')
  const { currentWorkspace, switching } = useWorkspace()
  const { session } = useAuth()
  const [pages, setPages] = useState<CrawledPage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [userPlan, setUserPlan] = useState<PlanType>('starter')
  const [userPlanLoading, setUserPlanLoading] = useState(true)

  // Fetch user subscription plan
  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const response = await fetch('/api/user/subscription')
        if (response.ok) {
          const data = await response.json()
          const plan = data.subscriptionPlan || 'starter'
          console.log('🔍 [AttributionByPagePage] Fetched user plan:', plan, 'isAdmin:', data.isAdmin)
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
      fetchPages()
    }
  }, [timeframe, currentWorkspace])

  const fetchPages = async () => {
    if (!currentWorkspace) return
    
    setIsLoading(true)
    try {
      const timeframeMap: Record<TimeframeOption, string> = {
        'Last 24 hours': 'last24h',
        'Last 7 days': 'last7d',
        'Last 30 days': 'last30d',
        'Last 90 days': 'last90d',
        'Last 365 days': 'last365d'
      }
      
      // Auto-detect user's timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      
      const response = await fetch(`/api/dashboard/attribution-pages-detailed?timeframe=${timeframeMap[timeframe as keyof typeof timeframeMap]}&workspaceId=${currentWorkspace.id}`, {
        headers: {
          'Authorization': session?.access_token ? `Bearer ${session.access_token}` : ''
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPages(data.pages || [])
      }
    } catch (error) {
      console.error('Error fetching pages:', error)
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

  const getPathIcon = (path: string) => {
    if (path === '/robots.txt') return '🤖'
    if (path === '/sitemap.xml') return '🗺️'
    if (path === '/llms.txt') return '🧠'
    if (path === '/') return '🏠'
    if (path.includes('/api/')) return '⚡'
    if (path.includes('/blog/')) return '📝'
    if (path.includes('/docs/')) return '📚'
    return '📄'
  }

  // Prepare export data
  const exportData: ExportData = {
    stats: {
      totalPages: pages.length,
      totalVisits: pages.reduce((sum: number, page: CrawledPage) => sum + page.totalVisits, 0),
      totalBots: pages.reduce((sum: number, page: CrawledPage) => sum + page.bots.length, 0),
      timeframe: timeframe
    },
    chartData: [], // No chart data for list view
    recentActivity: pages.map((page: CrawledPage) => ({
      path: page.path,
      totalVisits: page.totalVisits,
      lastVisit: page.lastVisit,
      botCount: page.bots.length,
      topBot: page.bots[0]?.botName || 'N/A'
    })),
    metadata: {
      title: 'Crawls by Page',
      timeframe,
      exportDate: new Date().toLocaleString(),
      domain: currentWorkspace?.domain
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div id="page-list-export" className="max-w-7xl mx-auto px-6 py-8">
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
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">Crawls by Page</h1>
              <p className="text-gray-600">Most crawled pages ({timeframe.toLowerCase()})</p>
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
                elementId="page-list-export"
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
              { span: 6, align: 'left' },
              { span: 3, align: 'center' },
              { span: 3, align: 'right' }
            ]}
            showExpandableRows={false}
          />
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <div className="col-span-6">Page URL</div>
              <div className="col-span-3 text-center">Total Visits</div>
              <div className="col-span-3 text-right">Last Visit</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {pages.map((page: CrawledPage, index: number) => (
                <motion.div
                  key={page.path}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Link 
                    href={`/dashboard/attribution/page/${encodeURIComponent(page.path)}`}
                    className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors block"
                  >
                    <div className="col-span-6 flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-50 border border-gray-200 rounded-lg">
                        <span className="text-sm">{getPathIcon(page.path)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-gray-900 text-sm font-mono truncate hover:text-blue-600 transition-colors font-medium">
                          {page.path}
                        </div>
                        <div className="text-gray-500 text-xs">{page.bots.length} crawler{page.bots.length !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    <div className="col-span-3 text-center">
                      <div className="text-gray-900 text-sm font-mono font-medium">{page.totalVisits.toLocaleString()}</div>
                    </div>
                    <div className="col-span-3 text-right">
                      <div className="text-gray-600 text-sm">{formatRelativeTime(page.lastVisit)}</div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {pages.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-sm">No pages found for this timeframe.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 
'use client'

import { motion, AnimatePresence } from "framer-motion"
import { TimeframeSelector, TimeframeOption } from "@/components/custom/timeframe-selector"
import { useState, useEffect } from "react"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { useAuth } from "@/contexts/AuthContext"
import { Loader2, ArrowLeft, ChevronDown, Clock, Bot } from "lucide-react"
import Link from "next/link"

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
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set())

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
      
      const response = await fetch(`/api/dashboard/attribution-pages-detailed?timeframe=${timeframeMap[timeframe]}&workspaceId=${currentWorkspace.id}`, {
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

  const togglePageExpansion = (path: string) => {
    setExpandedPages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
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

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Link 
              href="/dashboard/attribution" 
              className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Overview</span>
            </Link>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-1">BY PAGE</h1>
              <p className="text-sm text-zinc-500">Most crawled pages ({timeframe.toLowerCase()})</p>
            </div>
            <div className="flex items-center gap-4">
              <TimeframeSelector 
                title=""
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
                titleColor="text-white"
                selectorColor="text-zinc-400"
              />
              <button className="text-sm text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50">
                Export
              </button>
            </div>
          </div>
        </motion.div>

        {switching ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        ) : (
          <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-zinc-900/30 border-b border-zinc-800/50 text-xs font-medium text-zinc-400 uppercase tracking-wider">
              <div className="col-span-6">Page URL</div>
              <div className="col-span-3 text-center">Total Visits</div>
              <div className="col-span-3 text-right">Last Visit</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-zinc-800/30">
              {pages.map((page, index) => {
                const isExpanded = expandedPages.has(page.path)
                
                return (
                  <motion.div
                    key={page.path}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    {/* Main Row */}
                    <div 
                      className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-zinc-900/20 cursor-pointer transition-colors"
                      onClick={() => togglePageExpansion(page.path)}
                    >
                      <div className="col-span-6 flex items-center gap-3">
                        <ChevronDown 
                          className={`w-4 h-4 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                        <span className="text-lg">{getPathIcon(page.path)}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-white text-sm font-mono truncate">{page.path}</div>
                          <div className="text-zinc-500 text-xs">{page.bots.length} crawler{page.bots.length !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                      <div className="col-span-3 text-center">
                        <div className="text-white text-sm font-mono">{page.totalVisits.toLocaleString()}</div>
                      </div>
                      <div className="col-span-3 text-right">
                        <div className="text-zinc-400 text-sm">{formatRelativeTime(page.lastVisit)}</div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 py-4 bg-zinc-900/10 border-t border-zinc-800/30">
                            <div className="mb-3">
                              <h4 className="text-white text-sm font-medium mb-2">Crawler Bots</h4>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {page.bots.map((bot, botIndex) => (
                                <div key={botIndex} className="flex items-center justify-between py-2 px-3 bg-zinc-900/30 rounded text-sm">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <img 
                                      src={getFaviconForCompany(bot.company)}
                                      alt={bot.company}
                                      width={16}
                                      height={16}
                                      className="w-4 h-4 object-contain flex-shrink-0"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.style.display = 'none'
                                        const fallback = target.nextElementSibling as HTMLElement
                                        if (fallback) fallback.style.display = 'block'
                                      }}
                                    />
                                    <Bot className="w-4 h-4 text-zinc-500 hidden" />
                                    <div className="min-w-0 flex-1">
                                      <div className="text-zinc-300 font-medium truncate">{bot.botName}</div>
                                      <div className="text-zinc-500 text-xs">{bot.company}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 text-zinc-500">
                                    <span>{bot.visits} visits</span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatRelativeTime(bot.lastVisit)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>

            {pages.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <p className="text-zinc-500 text-sm">No pages found for this timeframe.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 
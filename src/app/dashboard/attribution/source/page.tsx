'use client'

import { motion, useReducedMotion, AnimatePresence } from "framer-motion"
import { TimeframeSelector, TimeframeOption } from "@/components/custom/timeframe-selector"
import { useState, useEffect } from "react"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { useAuth } from "@/contexts/AuthContext"
import { Loader2, ArrowLeft, ChevronDown, ExternalLink, Clock } from "lucide-react"
import Link from "next/link"

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
  const { supabase } = useAuth()
  const [bots, setBots] = useState<CrawlerBot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedBots, setExpandedBots] = useState<Set<string>>(new Set())

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

  const toggleBotExpansion = (botName: string) => {
    setExpandedBots(prev => {
      const newSet = new Set(prev)
      if (newSet.has(botName)) {
        newSet.delete(botName)
      } else {
        newSet.add(botName)
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
              <h1 className="text-2xl font-semibold text-white mb-1">BY SOURCE</h1>
              <p className="text-sm text-zinc-500">Crawler bots ({timeframe.toLowerCase()})</p>
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
              <div className="col-span-4">Bot Name</div>
              <div className="col-span-2 text-center">Total Crawls</div>
              <div className="col-span-2 text-center">Paths Visited</div>
              <div className="col-span-2 text-center">Avg Interval</div>
              <div className="col-span-2 text-right">Last Seen</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-zinc-800/30">
              {bots.map((bot, index) => {
                const isExpanded = expandedBots.has(bot.botName)
                
                return (
                  <motion.div
                    key={bot.botName}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    {/* Main Row */}
                    <div 
                      className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-zinc-900/20 cursor-pointer transition-colors"
                      onClick={() => toggleBotExpansion(bot.botName)}
                    >
                      <div className="col-span-4 flex items-center gap-3">
                        <ChevronDown 
                          className={`w-4 h-4 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
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
                        <div>
                          <div className="text-white text-sm font-medium">{bot.botName}</div>
                          <div className="text-zinc-500 text-xs">{bot.company}</div>
                        </div>
                      </div>
                      <div className="col-span-2 text-center">
                        <div className="text-white text-sm font-mono">{bot.totalCrawls.toLocaleString()}</div>
                      </div>
                      <div className="col-span-2 text-center">
                        <div className="text-white text-sm font-mono">{bot.pathsVisited}</div>
                      </div>
                      <div className="col-span-2 text-center">
                        <div className="text-zinc-300 text-sm">{bot.avgInterval}</div>
                      </div>
                      <div className="col-span-2 text-right">
                        <div className="text-zinc-400 text-sm">{formatRelativeTime(bot.lastSeen)}</div>
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
                              <h4 className="text-white text-sm font-medium mb-2">Pages Visited</h4>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {bot.pages.map((page, pageIndex) => (
                                <div key={pageIndex} className="flex items-center justify-between py-2 px-3 bg-zinc-900/30 rounded text-sm">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <ExternalLink className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                                    <span className="text-zinc-300 font-mono truncate">{page.path}</span>
                                  </div>
                                  <div className="flex items-center gap-4 text-zinc-500">
                                    <span>{page.visits} visits</span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatRelativeTime(page.lastVisit)}
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

            {bots.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <p className="text-zinc-500 text-sm">No crawler bots found for this timeframe.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 
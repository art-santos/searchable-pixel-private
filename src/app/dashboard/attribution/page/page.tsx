'use client'

import { Card, CardContent } from "@/components/ui/card"
import { motion, useReducedMotion } from "framer-motion"
import { TimeframeSelector, TimeframeOption } from "@/components/custom/timeframe-selector"
import { useState, useEffect } from "react"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { useAuth } from "@/contexts/AuthContext"
import { Loader2, ArrowLeft, ArrowRight, FileText } from "lucide-react"
import Link from "next/link"

interface CrawledPage {
  path: string
  totalCrawls: number
  uniqueCrawlers: number
  avgResponse: number
  lastCrawled: string
  topCrawler: string
}

export default function AttributionByPagePage() {
  const shouldReduceMotion = useReducedMotion()
  const [timeframe, setTimeframe] = useState<TimeframeOption>('Last 7 days')
  const { currentWorkspace, switching } = useWorkspace()
  const { supabase } = useAuth()
  const [pages, setPages] = useState<CrawledPage[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
        'Last 30 days': 'last30d'
      }
      
      const sessionResult = await supabase?.auth.getSession()
      const session = sessionResult?.data?.session
      
      const response = await fetch(`/api/dashboard/attribution-pages?timeframe=${timeframeMap[timeframe]}&workspaceId=${currentWorkspace.id}`, {
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

  const cardVariants = shouldReduceMotion 
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
      }

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header with Breadcrumb */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Link 
              href="/dashboard/attribution" 
              className="flex items-center gap-2 text-[#888] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Overview</span>
            </Link>
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <nav className="text-sm text-[#666] mb-2">
                <Link href="/dashboard/attribution" className="hover:text-white transition-colors">Attribution</Link>
                <span className="mx-2">></span>
                <span className="text-white">By Page</span>
              </nav>
              <h1 className="text-2xl font-semibold text-white mb-2">BY PAGE</h1>
              <p className="text-sm text-[#666]">Most Crawled Pages ({timeframe.toLowerCase()})</p>
            </div>
            <div className="flex items-center gap-4">
              <TimeframeSelector 
                title=""
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
                titleColor="text-white"
                selectorColor="text-[#A7A7A7]"
              />
              <button className="text-sm text-[#888] hover:text-white transition-colors font-medium px-4 py-2 rounded-lg border border-[#2a2a2a] hover:border-[#444] bg-[#111] hover:bg-[#1a1a1a]">
                Export
              </button>
            </div>
          </div>
        </motion.div>

        {switching ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-3">
                <img 
                  src="/images/split-icon-white.svg" 
                  alt="Split" 
                  className="w-full h-full animate-spin"
                  style={{ animation: 'spin 1s linear infinite' }}
                />
              </div>
              <p className="text-[#666] text-sm">Switching workspace...</p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-[#666]" />
          </div>
        ) : (
          /* Page List */
          <div className="space-y-4">
            {pages.map((page, index) => (
              <motion.div
                key={page.path}
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { 
                    opacity: 1, 
                    y: 0, 
                    transition: { 
                      duration: 0.3, 
                      ease: 'easeOut',
                      delay: index * 0.05 
                    } 
                  }
                }}
              >
                <Link href={`/dashboard/attribution/page${encodeURIComponent(page.path)}`}>
                  <Card className="bg-[#0c0c0c] border-[#1a1a1a] hover:border-[#2a2a2a] transition-all duration-200 cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] group-hover:border-[#333] transition-colors">
                            <span className="text-lg">{getPathIcon(page.path)}</span>
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-1 font-mono">{page.path}</h3>
                            <div className="flex items-center gap-6 text-sm text-[#666]">
                              <span>{page.totalCrawls} crawls</span>
                              <span>•</span>
                              <span>{page.uniqueCrawlers} crawlers</span>
                              <span>•</span>
                              <span>{page.avgResponse}ms avg</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm text-[#888] mb-1">
                              Top: {page.topCrawler}
                            </div>
                            <div className="text-xs text-[#666]">
                              Last crawled: {formatRelativeTime(page.lastCrawled)}
                            </div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-[#666] group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
            
            {pages.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-[#333] mx-auto mb-4" />
                <p className="text-[#666] text-sm">No pages found for this timeframe.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 
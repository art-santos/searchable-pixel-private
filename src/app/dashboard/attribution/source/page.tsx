'use client'

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { motion, useReducedMotion } from "framer-motion"
import { TimeframeSelector, TimeframeOption } from "@/components/custom/timeframe-selector"
import { useState, useEffect } from "react"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { useAuth } from "@/contexts/AuthContext"
import { Loader2, ArrowLeft, Search, TrendingUp, Activity, Clock, ExternalLink, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface CrawlerCompany {
  company: string
  totalCrawls: number
  uniquePaths: number
  avgInterval: string
  crawlers: string[]
  lastSeen: string
  icon?: string
}

export default function AttributionBySourcePage() {
  const shouldReduceMotion = useReducedMotion()
  const [timeframe, setTimeframe] = useState<TimeframeOption>('Last 7 days')
  const { currentWorkspace, switching } = useWorkspace()
  const { session } = useAuth()
  const [companies, setCompanies] = useState<CrawlerCompany[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (currentWorkspace) {
      fetchCompanies()
    }
  }, [timeframe, currentWorkspace])

  const fetchCompanies = async () => {
    if (!currentWorkspace) return
    
    setIsLoading(true)
    try {
      // Auto-detect user's timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      
      const response = await fetch(`/api/dashboard/attribution-companies?timeframe=last7d&timezone=${encodeURIComponent(timezone)}&workspaceId=${currentWorkspace.id}`, {
        headers: {
          'Authorization': session?.access_token ? `Bearer ${session.access_token}` : ''
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCompanies(data.companies || [])
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
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
                <span className="text-white">By Source</span>
              </nav>
              <h1 className="text-2xl font-semibold text-white mb-2">BY SOURCE</h1>
              <p className="text-sm text-[#666]">Top Crawler Companies ({timeframe.toLowerCase()})</p>
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
          /* Company List */
          <div className="space-y-4">
            {companies.map((company, index) => (
              <motion.div
                key={company.company}
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
                <Link href={`/dashboard/attribution/source/${company.company.toLowerCase()}`}>
                  <Card className="bg-[#0c0c0c] border-[#1a1a1a] hover:border-[#2a2a2a] transition-all duration-200 cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] group-hover:border-[#333] transition-colors">
                            <div className="relative">
                              <img 
                                src={getFaviconForCompany(company.company)}
                                alt={company.company}
                                width={20}
                                height={20}
                                className="w-5 h-5 object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  const fallback = target.nextElementSibling as HTMLElement
                                  if (fallback) fallback.style.display = 'block'
                                }}
                              />
                              <div className="w-3 h-3 rounded-full bg-[#666] hidden" />
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-1">{company.company}</h3>
                            <div className="flex items-center gap-6 text-sm text-[#666]">
                              <span>{company.totalCrawls.toLocaleString()} crawls</span>
                              <span>•</span>
                              <span>{company.uniquePaths} paths</span>
                              <span>•</span>
                              <span>{company.avgInterval} avg interval</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm text-[#888] mb-1">
                              {company.crawlers.length} crawler{company.crawlers.length !== 1 ? 's' : ''}
                            </div>
                            <div className="text-xs text-[#666]">
                              Last seen: {company.lastSeen}
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
            
            {companies.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <p className="text-[#666] text-sm">No crawler companies found for this timeframe.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 
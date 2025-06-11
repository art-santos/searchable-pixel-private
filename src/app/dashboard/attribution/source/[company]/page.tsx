'use client'

import { Card, CardContent } from "@/components/ui/card"
import { motion, useReducedMotion } from "framer-motion"
import { TimeframeSelector, TimeframeOption } from "@/components/custom/timeframe-selector"
import { useState, useEffect } from "react"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { useAuth } from "@/contexts/AuthContext"
import { Loader2, ArrowLeft, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { PlanType } from "@/lib/subscription/config"

interface CrawlerPage {
  path: string
  crawls: number
  lastVisit: string
  avgResponse: number
  status: number
}

interface CompanyData {
  company: string
  totalCrawls: number
  uniquePaths: number
  avgInterval: string
  lastSeen: string
  pages: CrawlerPage[]
}

export default function CompanyCrawlerPage() {
  const shouldReduceMotion = useReducedMotion()
  const [timeframe, setTimeframe] = useState<TimeframeOption>('Last 7 days')
  const { currentWorkspace, switching } = useWorkspace()
  const { session, supabase } = useAuth()
  const [companyData, setCompanyData] = useState<CompanyData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const params = useParams()
  const company = params.company as string
  const [error, setError] = useState<string | null>(null)
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
          console.log('🔍 [CompanyCrawlerPage] Fetched user plan:', plan, 'isAdmin:', data.isAdmin)
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
    if (currentWorkspace && company) {
      fetchCompanyData()
    }
  }, [timeframe, currentWorkspace, company])

  const fetchCompanyData = async () => {
    if (!currentWorkspace) return
    
    setIsLoading(true)
    try {
      const headers = {
        'Authorization': session?.access_token ? `Bearer ${session.access_token}` : ''
      }
      
      const response = await fetch(`/api/dashboard/attribution/company?company=${encodeURIComponent(company)}&workspaceId=${currentWorkspace.id}`, {
        headers
      })
      
      if (response.ok) {
        const data = await response.json()
        setCompanyData(data)
        setError(null)
      } else if (response.status === 404) {
        setError('No data found for this company')
        setCompanyData(null)
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (err) {
      console.error('Error fetching company data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load company data')
      setCompanyData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const getFaviconForCompany = (company: string) => {
    const companyDomainMap: Record<string, string> = {
      'openai': 'openai.com',
      'anthropic': 'anthropic.com', 
      'google': 'google.com',
      'perplexity': 'perplexity.ai',
      'microsoft': 'microsoft.com',
      'meta': 'meta.com',
      'twitter': 'twitter.com',
      'x': 'x.com'
    }

    const domain = companyDomainMap[company.toLowerCase()]
    if (domain) {
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
    }
    
    const constructedDomain = `${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`
    return `https://www.google.com/s2/favicons?domain=${constructedDomain}&sz=128`
  }

  const formatRelativeTime = (timeStr: string) => {
    // Simple relative time formatting - you might want to use a library like date-fns
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

  const cardVariants = shouldReduceMotion 
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
      }

  const companyDisplayName = company.charAt(0).toUpperCase() + company.slice(1)

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
              href="/dashboard/attribution/source" 
              className="flex items-center gap-2 text-[#888] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Sources</span>
            </Link>
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <nav className="text-sm text-[#666] mb-2">
                <Link href="/dashboard/attribution" className="hover:text-white transition-colors">Attribution</Link>
                <span className="mx-2">&gt;</span>
                <Link href="/dashboard/attribution/source" className="hover:text-white transition-colors">By Source</Link>
                <span className="mx-2">&gt;</span>
                <span className="text-white">{companyDisplayName}</span>
              </nav>
              
              <div className="flex items-center gap-4 mb-2">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                  <div className="relative">
                    <img 
                      src={getFaviconForCompany(company)}
                      alt={companyDisplayName}
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
                <h1 className="text-2xl font-semibold text-white">{companyDisplayName}</h1>
              </div>
              
              {companyData && (
                <div className="flex items-center gap-6 text-sm text-[#666]">
                  <span>{companyData.totalCrawls.toLocaleString()} total crawls</span>
                  <span>•</span>
                  <span>{companyData.uniquePaths} unique paths</span>
                  <span>•</span>
                  <span>{companyData.avgInterval} avg interval</span>
                  <span>•</span>
                  <span>Last seen: {formatRelativeTime(companyData.lastSeen)}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              {!userPlanLoading && (
                <TimeframeSelector 
                  key={userPlan}
                  title=""
                  timeframe={timeframe}
                  onTimeframeChange={setTimeframe}
                  titleColor="text-white"
                  selectorColor="text-[#A7A7A7]"
                  userPlan={userPlan}
                />
              )}
              <button className="text-sm text-[#888] hover:text-white transition-colors font-medium px-4 py-2 rounded-lg border border-[#2a2a2a] hover:border-[#444] bg-[#111] hover:bg-[#1a1a1a]">
                Export Data
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
        ) : companyData ? (
          <div>
            {/* Quick Actions */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="mb-8"
            >
              <div className="flex items-center gap-4">
                <button className="text-sm text-[#888] hover:text-white transition-colors font-medium px-4 py-2 rounded-lg border border-[#2a2a2a] hover:border-[#444] bg-[#111] hover:bg-[#1a1a1a]">
                  View {companyDisplayName} Sessions
                </button>
                <button className="text-sm text-[#888] hover:text-white transition-colors font-medium px-4 py-2 rounded-lg border border-[#2a2a2a] hover:border-[#444] bg-[#111] hover:bg-[#1a1a1a]">
                  Compare with Other Crawlers
                </button>
              </div>
            </motion.div>

            {/* Pages Visited Table */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={cardVariants}
            >
              <Card className="bg-[#0c0c0c] border-[#1a1a1a]">
                <CardContent className="p-0">
                  <div className="p-6 border-b border-[#1a1a1a]">
                    <h3 className="text-lg font-semibold text-white">Pages Visited by {companyDisplayName}</h3>
                    <p className="text-sm text-[#666] mt-1">All pages crawled during the selected timeframe</p>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#1a1a1a]">
                          <th className="text-left py-4 px-6 text-sm font-medium text-[#888]">Path</th>
                          <th className="text-left py-4 px-6 text-sm font-medium text-[#888]">Crawls</th>
                          <th className="text-left py-4 px-6 text-sm font-medium text-[#888]">Last Visit</th>
                          <th className="text-left py-4 px-6 text-sm font-medium text-[#888]">Avg Response</th>
                          <th className="text-left py-4 px-6 text-sm font-medium text-[#888]">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companyData.pages.map((page, index) => (
                          <motion.tr
                            key={page.path}
                            initial="hidden"
                            animate="visible"
                            variants={{
                              hidden: { opacity: 0, y: 10 },
                              visible: { 
                                opacity: 1, 
                                y: 0, 
                                transition: { 
                                  duration: 0.2, 
                                  ease: 'easeOut',
                                  delay: index * 0.03 
                                } 
                              }
                            }}
                            className="border-b border-[#1a1a1a] hover:bg-[#0f0f0f] transition-colors"
                          >
                            <td className="py-4 px-6">
                              <div className="font-mono text-sm text-white">{page.path}</div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-sm text-white">{page.crawls}</span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-sm text-[#888]">{formatRelativeTime(page.lastVisit)}</span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-sm text-[#888]">{page.avgResponse}ms</span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                {page.status === 200 ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                )}
                                <span className="text-sm text-[#888]">{page.status}</span>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {companyData.pages.length > 10 && (
                    <div className="p-6 border-t border-[#1a1a1a] text-center">
                      <button className="text-sm text-[#888] hover:text-white transition-colors font-medium">
                        View All {companyData.pages.length} Pages
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-[#666] text-sm">No data found for {companyDisplayName} in this timeframe.</p>
          </div>
        )}
      </div>
    </div>
  )
} 
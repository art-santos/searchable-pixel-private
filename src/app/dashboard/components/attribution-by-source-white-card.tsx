'use client'
import { Card, CardContent } from "@/components/ui/card"
import { motion, useReducedMotion } from "framer-motion"
import { useState, useEffect } from "react"
import {
  TimeframeSelector,
  TimeframeOption,
} from "@/components/custom/timeframe-selector"
import { useAuth } from "@/contexts/AuthContext"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { PlanType } from "@/lib/subscription/config"

interface CrawlerData {
  name: string
  company: string
  percentage: number
  crawls: number
  icon: string
  color: string
}

// Crawler Icon Component
function CrawlerIcon({ name, company }: { name: string; company?: string }) {
  const getIconInfo = (crawlerName: string) => {
    // Map crawler names to their appropriate logos
    if (crawlerName.toLowerCase().includes('chatgpt') || crawlerName.toLowerCase().includes('gpt')) {
      return { type: 'svg', path: '/images/chatgpt.svg' }
    }
    if (crawlerName.toLowerCase().includes('claude')) {
      return { type: 'svg', path: '/images/claude.svg' }
    }
    if (crawlerName.toLowerCase().includes('google') || crawlerName.toLowerCase().includes('gemini')) {
      return { type: 'svg', path: '/images/gemini.svg' }
    }
    if (crawlerName.toLowerCase().includes('perplexity')) {
      return { type: 'svg', path: '/images/perplexity.svg' }
    }
    
    // Default fallback based on exact matches
    const iconMap: Record<string, { type: 'svg', path: string }> = {
      'ChatGPT-User': { type: 'svg', path: '/images/chatgpt.svg' },
      'ClaudeBot': { type: 'svg', path: '/images/claude.svg' },
      'GPTBot': { type: 'svg', path: '/images/chatgpt.svg' },
      'GoogleBot': { type: 'svg', path: '/images/gemini.svg' },
      'PerplexityBot': { type: 'svg', path: '/images/perplexity.svg' },
      'Bard': { type: 'svg', path: '/images/gemini.svg' },
      'Bing': { type: 'svg', path: '/images/chatgpt.svg' },
    }
    
    if (iconMap[crawlerName]) {
      return iconMap[crawlerName]
    }
    
    // Fallback to favicon
    return { type: 'favicon', path: getFaviconForCrawler(crawlerName, company) }
  }

  const getFaviconForCrawler = (crawlerName: string, companyName?: string) => {
    // Try to extract domain from crawler name or use company name
    const name = companyName || crawlerName
    
    const companyDomainMap: Record<string, string> = {
      'OpenAI': 'openai.com',
      'Anthropic': 'anthropic.com',
      'Google': 'google.com',
      'Perplexity': 'perplexity.ai',
      'Microsoft': 'microsoft.com',
      'Meta': 'meta.com',
      'X': 'x.com',
      'Twitter': 'twitter.com',
      'Apple': 'apple.com',
      'Facebook': 'facebook.com',
      'Amazon': 'amazon.com',
      'ByteDance': 'bytedance.com',
      'TikTok': 'tiktok.com',
    }

    const domain = companyDomainMap[name]
    if (domain) {
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    }
    
    // Try to construct domain from name
    const constructedDomain = `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`
    return `https://www.google.com/s2/favicons?domain=${constructedDomain}&sz=32`
  }

  const iconInfo = getIconInfo(name)

  return (
    <div className="w-7 h-7 bg-gray-50 rounded-sm flex items-center justify-center border border-gray-200">
      <img 
        src={iconInfo.path}
        alt={name}
        className={`w-4 h-4 object-contain ${iconInfo.type === 'svg' ? 'opacity-60' : ''}`}
        style={iconInfo.type === 'svg' ? { 
          filter: 'brightness(0) saturate(100%) invert(40%) sepia(0%) saturate(1%) hue-rotate(162deg) brightness(94%) contrast(87%)' 
        } : {}}
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
          const fallback = target.nextElementSibling as HTMLElement
          if (fallback) fallback.style.display = 'flex'
        }}
      />
      <div className="w-2.5 h-2.5 bg-gray-400 rounded-full hidden items-center justify-center">
        <div className="w-1 h-1 bg-white rounded-full" />
      </div>
    </div>
  )
}

// White Attribution Skeleton Component
function WhiteAttributionSkeleton() {
  const shouldReduceMotion = useReducedMotion()

  const containerVariants = shouldReduceMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            duration: 0.15,
            staggerChildren: 0.02
          }
        }
      }

  const itemVariants = shouldReduceMotion 
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, y: 10 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.2,
            ease: "easeOut"
          }
        }
      }

  // Skeleton component with white theme colors
  const WhiteSkeleton = ({ className }: { className?: string }) => (
    <motion.div
      className={`bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-sm bg-[length:200%_100%] ${className}`}
      style={{ backgroundPosition: '-200% 0' }}
      animate={shouldReduceMotion ? {} : {
        backgroundPosition: ['200% 0', '-200% 0']
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  )

  const WhiteSkeletonCircle = ({ className }: { className?: string }) => (
    <motion.div
      className={`bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-sm bg-[length:200%_100%] ${className}`}
      style={{ backgroundPosition: '-200% 0' }}
      animate={shouldReduceMotion ? {} : {
        backgroundPosition: ['200% 0', '-200% 0']
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  )

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-gray-500 font-medium uppercase tracking-wider pb-1">
        <WhiteSkeleton className="h-3 w-16" />
        <WhiteSkeleton className="h-3 w-12" />
      </div>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        {Array.from({ length: 5 }).map((_, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            className="flex items-center justify-between py-1.5"
          >
            <div className="flex items-center gap-2.5">
              <WhiteSkeletonCircle className="w-7 h-7" />
              <div className="flex items-center gap-2">
                <WhiteSkeleton className="h-4 w-5" />
                <WhiteSkeleton className="h-4 w-20" />
              </div>
            </div>
            <WhiteSkeleton className="h-4 w-10" />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

export function AttributionBySourceWhiteCard() {
  const shouldReduceMotion = useReducedMotion()
  const { session, supabase } = useAuth()
  const { currentWorkspace, switching } = useWorkspace()
  const [timeframe, setTimeframe] = useState<TimeframeOption>('Last 24 hours')
  const [isConnected, setIsConnected] = useState(false)
  const [crawlerData, setCrawlerData] = useState<CrawlerData[]>([])
  const [totalCrawls, setTotalCrawls] = useState(0)
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
          setUserPlan(plan as PlanType)
        }
      } catch (error) {
        console.error('Error fetching user plan:', error)
      } finally {
        setUserPlanLoading(false)
      }
    }

    fetchUserPlan()
  }, [])

  // Fetch crawler data
  useEffect(() => {
    if (currentWorkspace) {
      fetchCrawlerData()
    }
  }, [timeframe, currentWorkspace])

  const fetchCrawlerData = async () => {
    if (!currentWorkspace) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    
    try {
      // Check if there's any crawler data for this workspace
      const crawlerCheckResult = await supabase
        ?.from('crawler_visits')
        .select('id')
        .eq('workspace_id', currentWorkspace.id)
        .limit(1)
        .single()
      
      if (!crawlerCheckResult?.data) {
        setIsConnected(false)
        setIsLoading(false)
        return
      }
      
      // Map timeframe to API parameter
      const timeframeMap: Record<TimeframeOption, string> = {
        'Last 24 hours': 'last24h',
        'Last 7 days': 'last7d',
        'Last 30 days': 'last30d',
        'Last 90 days': 'last90d',
        'Last 365 days': 'last365d'
      }
      
      const apiUrl = `/api/dashboard/crawler-stats?timeframe=${timeframeMap[timeframe]}&workspaceId=${currentWorkspace.id}`
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': session?.access_token ? `Bearer ${session.access_token}` : ''
        }
      })
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.totalCrawls > 0) {
        setIsConnected(true)
        setCrawlerData(data.crawlers)
        setTotalCrawls(data.totalCrawls)
      } else {
        setIsConnected(false)
      }
    } catch (err) {
      console.error('Error fetching crawler data:', err)
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }

  const cardVariants = shouldReduceMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } }
      }

  return (
    <Card className="h-full bg-white border-0">
      <CardContent className="p-0 h-full flex flex-col">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="flex flex-col h-full"
        >
          {/* Header */}
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-lg font-medium text-black">Attribution by Source</h3>
              </div>
              {!userPlanLoading && (
                <div className="text-xs sm:text-sm flex-shrink-0">
                  <TimeframeSelector
                    key={userPlan}
                    title=""
                    timeframe={timeframe}
                    onTimeframeChange={setTimeframe}
                    titleColor="text-black"
                    selectorColor="text-gray-600"
                    userPlan={userPlan}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 px-3 sm:px-6 py-3 sm:py-4 min-h-0">
            {switching ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto mb-3">
                    <img 
                      src="/images/split-icon-black.svg" 
                      alt="Split" 
                      className="w-full h-full animate-spin"
                      style={{ animation: 'spin 1s linear infinite' }}
                    />
                  </div>
                  <p className="text-gray-500 text-sm">Switching workspace...</p>
                </div>
              </div>
            ) : isLoading ? (
              <WhiteAttributionSkeleton />
                        ) : isConnected && crawlerData.length > 0 ? (
              <div className="h-full flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-gray-500 font-medium uppercase tracking-wider pb-2 flex-shrink-0">
                  <span>Crawler</span>
                  <span>Crawls</span>
                </div>
                <div className="flex-1 flex flex-col justify-around min-h-0">
                  {crawlerData.slice(0, 5).map((crawler, index) => (
                    <motion.div
                      key={crawler.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                      className="flex items-center justify-between py-1 sm:py-2"
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
                        <CrawlerIcon name={crawler.name} company={crawler.company} />
                        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                          <span className="text-xs sm:text-sm font-semibold text-gray-800 w-4 sm:w-5 flex-shrink-0">#{index + 1}</span>
                          <span className="text-gray-900 text-xs sm:text-sm font-medium truncate">{crawler.name}</span>
                        </div>
                      </div>
                      <div className="text-gray-600 text-xs sm:text-sm font-medium flex-shrink-0">
                        {crawler.percentage.toFixed(1)}%
                      </div>
                                        </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-gray-500 text-sm">No crawler data available</p>
                  <p className="text-gray-400 text-xs mt-1">Set up tracking to see attribution data</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </CardContent>
    </Card>
  )
} 
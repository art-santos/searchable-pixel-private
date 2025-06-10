'use client'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { motion, useReducedMotion } from "framer-motion"
import { Sparkles, LinkIcon, BarChart3, Loader2 } from "lucide-react"
import Image from "next/image"
import { useState, useEffect } from "react"
import {
  TimeframeSelector,
  TimeframeOption,
} from "@/components/custom/timeframe-selector"
import { ConnectAnalyticsDialog } from "./connect-analytics-dialog"
import { useAuth } from "@/contexts/AuthContext"
import { useWorkspace } from "@/contexts/WorkspaceContext"

interface CrawlerData {
  name: string
  company: string
  percentage: number
  crawls: number
  icon: string
  color: string
}

export function AttributionBySourceCard() {
  const shouldReduceMotion = useReducedMotion()
  const { session, supabase } = useAuth()
  const { currentWorkspace, switching } = useWorkspace()
  const [timeframe, setTimeframe] = useState<TimeframeOption>('Last 24 hours')
  const [isConnected, setIsConnected] = useState(false)
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const [crawlerData, setCrawlerData] = useState<CrawlerData[]>([])
  const [totalCrawls, setTotalCrawls] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper to get favicon URL for unknown crawlers
  const getFaviconForCrawler = (company: string) => {
    // Try to extract a domain from the company name
    const companyDomainMap: Record<string, string> = {
      'OpenAI': 'openai.com',
      'Anthropic': 'anthropic.com',
      'Google': 'google.com',
      'Perplexity': 'perplexity.ai',
      'Microsoft': 'microsoft.com',
      'Meta': 'meta.com',
      'X': 'x.com',
      'Twitter': 'twitter.com',
      'LinkedIn': 'linkedin.com',
      'Apple': 'apple.com',
      'Amazon': 'amazon.com',
      'TikTok': 'tiktok.com',
      'ByteDance': 'bytedance.com',
      'Slack': 'slack.com',
      'Discord': 'discord.com',
      'Reddit': 'reddit.com',
      'Pinterest': 'pinterest.com',
      'Snapchat': 'snapchat.com',
      'WhatsApp': 'whatsapp.com',
      'Telegram': 'telegram.org',
      'Shopify': 'shopify.com',
      'Salesforce': 'salesforce.com',
      'Adobe': 'adobe.com',
      'Atlassian': 'atlassian.com',
      'Zoom': 'zoom.us',
      'Dropbox': 'dropbox.com',
      'Spotify': 'spotify.com',
      'Netflix': 'netflix.com',
      'Uber': 'uber.com',
      'Airbnb': 'airbnb.com',
      'Stripe': 'stripe.com',
      'Square': 'squareup.com',
      'PayPal': 'paypal.com',
    }

    const domain = companyDomainMap[company]
    if (domain) {
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
    }
    
    // Fallback: try to construct domain from company name
    const constructedDomain = `${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`
    return `https://www.google.com/s2/favicons?domain=${constructedDomain}&sz=128`
  }

  // Fetch crawler data when component mounts, timeframe changes, or workspace changes
  useEffect(() => {
    if (currentWorkspace) {
      fetchCrawlerData()
    }
  }, [timeframe, currentWorkspace])

  // Listen for workspace changes
  useEffect(() => {
    const handleWorkspaceChange = () => {
      if (currentWorkspace) {
        fetchCrawlerData()
      }
    }

    window.addEventListener('workspaceChanged', handleWorkspaceChange)
    return () => window.removeEventListener('workspaceChanged', handleWorkspaceChange)
  }, [timeframe])

  const fetchCrawlerData = async () => {
    if (!currentWorkspace) {
      console.log('🔍 [fetchCrawlerData] No currentWorkspace available')
      setIsLoading(false)
      return
    }

    console.log('🔍 [fetchCrawlerData] Starting fetch with:', {
      workspaceId: currentWorkspace.id,
      timeframe: timeframe
    })

    setIsLoading(true)
    setError(null)
    
    try {
      // Check if there's any crawler data for this workspace
      const crawlerCheckResult = await supabase
        ?.from('crawler_visits')
        .select('id')
        .eq('workspace_id', currentWorkspace.id)
        .limit(1)
        .single()
      
      if (!crawlerCheckResult?.data) {
        // No crawler data found - user hasn't set up tracking yet
        console.log('🔍 [fetchCrawlerData] No crawler data found - showing setup state')
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
      console.log('🔍 [fetchCrawlerData] Making API call to:', apiUrl)
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': session?.access_token ? `Bearer ${session.access_token}` : ''
        }
      })
      
      console.log('🔍 [fetchCrawlerData] API response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('🔍 [fetchCrawlerData] API error response:', errorText)
        throw new Error(`API request failed: ${response.status} - ${errorText}`)
      }
      
      const data = await response.json()
      console.log('🔍 [fetchCrawlerData] API response data:', {
        totalCrawls: data.totalCrawls,
        crawlersCount: data.crawlers?.length,
        crawlers: data.crawlers?.map((c: any) => ({ name: c.name, company: c.company, crawls: c.crawls }))
      })
      
      // Check if user has any data
      if (data.totalCrawls > 0) {
        console.log('🔍 [fetchCrawlerData] Setting connected state with data')
        setIsConnected(true)
        setCrawlerData(data.crawlers)
        setTotalCrawls(data.totalCrawls)
      } else {
        console.log('🔍 [fetchCrawlerData] No data found, showing empty state')
        setIsConnected(false)
        // Use placeholder data for empty state preview
        setCrawlerData([
          { 
            name: 'GPTBot', 
            company: 'OpenAI',
            percentage: 34.8, 
            crawls: 0,
            icon: '/images/chatgpt.svg',
            color: '#555'
          },
          { 
            name: 'ChatGPT-User', 
            company: 'OpenAI',
            percentage: 26.2, 
            crawls: 0,
            icon: '/images/chatgpt.svg',
            color: '#555'
          },
          { 
            name: 'PerplexityBot', 
            company: 'Perplexity',
            percentage: 19.5, 
            crawls: 0,
            icon: '/images/perplexity.svg',
            color: '#555'
          },
          { 
            name: 'Google-Extended', 
            company: 'Google',
            percentage: 12.3, 
            crawls: 0,
            icon: '/images/gemini.svg',
            color: '#555'
          },
          { 
            name: 'Claude-Web', 
            company: 'Anthropic',
            percentage: 7.2, 
            crawls: 0,
            icon: '/images/claude.svg',
            color: '#555'
          }
        ])
      }
    } catch (err) {
      console.error('🔍 [fetchCrawlerData] Error:', err)
      setError('Failed to load crawler data')
      setIsConnected(false)
    } finally {
      setIsLoading(false)
      console.log('🔍 [fetchCrawlerData] Fetch completed')
    }
  }

  const cardVariants = shouldReduceMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.4, ease: "easeOut" },
        },
      }

  const itemVariants = shouldReduceMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, x: -20 },
        visible: (i: number) => ({
          opacity: 1,
          x: 0,
          transition: {
            delay: i * 0.05,
            duration: 0.3,
            ease: "easeOut",
          },
        }),
      }

  const progressVariants = shouldReduceMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { width: 0 },
        visible: (i: number) => ({
          width: "var(--target-width)",
          transition: {
            delay: i * 0.05 + 0.2,
            duration: 0.6,
            ease: [0.16, 1, 0.3, 1],
          },
        }),
      }

  return (
    <Card className="h-full flex flex-col">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="h-full flex flex-col"
      >
        <CardHeader className="pb-4 pt-4 pl-6 flex-shrink-0 border-b border-[#1a1a1a]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Attribution by Source
              </h3>
              {isConnected && totalCrawls > 0 && (
                <p className="text-sm text-[#666]">
                  {totalCrawls.toLocaleString()} crawls tracked
                </p>
              )}
            </div>
            <TimeframeSelector
              title=""
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
              titleColor="text-white"
              selectorColor="text-[#A7A7A7]"
            />
          </div>
        </CardHeader>

        <CardContent className="flex-1 min-h-0 pt-6 pr-6 pb-8 pl-6 flex flex-col relative">
          {switching ? (
            <div className="flex items-center justify-center h-full">
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
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-[#666]" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-[#666] text-sm">{error}</p>
                <button 
                  onClick={fetchCrawlerData}
                  className="mt-2 text-sm text-white hover:underline"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : isConnected ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Crawler List */}
              <div className="flex-1 space-y-5 overflow-y-auto pr-2">
                {crawlerData.slice(0, 5).map((source, index) => (
                  <motion.div
                    key={source.name}
                    custom={index}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                          {source.icon === 'sparkles' ? (
                            <Sparkles className="w-3.5 h-3.5 text-[#888]" />
                          ) : source.icon ? (
                            <Image 
                              src={source.icon} 
                              alt={source.name}
                              width={14}
                              height={14}
                            />
                          ) : (
                            <div className="relative">
                              <img 
                                src={getFaviconForCrawler(source.company)}
                                alt={source.name}
                                width={14}
                                height={14}
                                className="w-3.5 h-3.5 object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  // Show fallback dot instead
                                  const fallback = target.nextElementSibling as HTMLElement
                                  if (fallback) fallback.style.display = 'block'
                                }}
                              />
                              <div className="w-2.5 h-2.5 rounded-full bg-[#666] hidden" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">{source.name}</div>
                          <div className="text-[#666] text-xs">
                            {source.crawls.toLocaleString()} crawls
                          </div>
                        </div>
                      </div>
                      <motion.div 
                        className="text-white font-semibold text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 + 0.2, duration: 0.3 }}
                      >
                        {source.percentage.toFixed(1)}%
                      </motion.div>
                    </div>
                    <div className="w-full h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full rounded-full"
                        style={{ 
                          "--target-width": `${source.percentage}%`,
                          backgroundColor: source.color
                        } as any}
                        variants={progressVariants}
                        initial="hidden"
                        animate="visible"
                        custom={index}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Total */}
              <div className="pt-4 border-t border-[#2a2a2a] mt-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-[#666] text-sm font-medium">Total Crawls</span>
                  <motion.span 
                    className="text-white font-semibold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.3 }}
                  >
                    {totalCrawls.toLocaleString()}
                  </motion.span>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="relative h-full flex flex-col">
              {/* Preview - takes full height */}
              <div className="absolute inset-0 opacity-30 blur-sm pointer-events-none">
                <div className="flex-1 space-y-5 overflow-hidden">
                  {crawlerData.slice(0, 5).map((source, index) => (
                    <div key={source.name} className="group">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                            {source.icon === 'sparkles' ? (
                              <Sparkles className="w-3.5 h-3.5 text-[#888]" />
                            ) : source.icon ? (
                              <Image 
                                src={source.icon} 
                                alt={source.name}
                                width={14}
                                height={14}
                              />
                            ) : (
                              <div className="relative">
                                <img 
                                  src={getFaviconForCrawler(source.company)}
                                  alt={source.name}
                                  width={14}
                                  height={14}
                                  className="w-3.5 h-3.5 object-contain"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                    // Show fallback dot instead
                                    const fallback = target.nextElementSibling as HTMLElement
                                    if (fallback) fallback.style.display = 'block'
                                  }}
                                />
                                <div className="w-2.5 h-2.5 rounded-full bg-[#666] hidden" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-white font-medium text-sm">{source.name}</div>
                            <div className="text-[#666] text-xs">
                              {source.crawls.toLocaleString()} crawls
                            </div>
                          </div>
                        </div>
                        <div className="text-white font-semibold text-sm">
                          {source.percentage.toFixed(1)}%
                        </div>
                      </div>
                      <div className="w-full h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            width: `${source.percentage}%`,
                            backgroundColor: source.color
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="pt-4 border-t border-[#2a2a2a] mt-4 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[#666] text-sm font-medium">Total Crawls</span>
                    <span className="text-white font-semibold">
                      {totalCrawls.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Empty state message - absolute positioned overlay */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-center max-w-sm">
                  <h4 className="text-white font-medium mb-2">No data yet</h4>
                  <p className="text-[#666] text-sm mb-6 leading-relaxed">
                    Track which AI engines are viewing your content most frequently
                  </p>
                  <button 
                    onClick={() => setShowConnectDialog(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Connect Analytics
                  </button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </motion.div>
      
      <ConnectAnalyticsDialog 
        open={showConnectDialog}
        onOpenChange={setShowConnectDialog}
      />
    </Card>
  )
} 
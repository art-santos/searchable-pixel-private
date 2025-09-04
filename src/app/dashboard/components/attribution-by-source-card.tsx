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
import { ListSkeleton } from "@/components/skeletons"

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

    setIsLoading(true)
    setError(null)
    
    try {
      // Mock data - simulate realistic crawler attribution
      setTimeout(() => {
        const mockCrawlerData = [
          { 
            name: 'GPTBot', 
            company: 'OpenAI',
            percentage: 34.8, 
            crawls: 2847,
            icon: '/images/chatgpt.svg',
            color: '#10a37f'
          },
          { 
            name: 'ChatGPT-User', 
            company: 'OpenAI',
            percentage: 26.2, 
            crawls: 2143,
            icon: '/images/chatgpt.svg',
            color: '#19c37d'
          },
          { 
            name: 'PerplexityBot', 
            company: 'Perplexity',
            percentage: 19.5, 
            crawls: 1595,
            icon: '/images/perplexity.svg',
            color: '#2563eb'
          },
          { 
            name: 'Google-Extended', 
            company: 'Google',
            percentage: 12.3, 
            crawls: 1006,
            icon: '/images/gemini.svg',
            color: '#ea4335'
          },
          { 
            name: 'Claude-Web', 
            company: 'Anthropic',
            percentage: 7.2, 
            crawls: 589,
            icon: '/images/claude.svg',
            color: '#d97706'
          }
        ]
        
        const totalMockCrawls = mockCrawlerData.reduce((sum, item) => sum + item.crawls, 0)
        
        setIsConnected(true)
        setCrawlerData(mockCrawlerData)
        setTotalCrawls(totalMockCrawls)
        setIsLoading(false)
      }, 800)
    } catch (err) {
      console.error('🔍 [fetchCrawlerData] Error:', err)
      setError('Failed to load crawler data')
      setIsConnected(false)
      setIsLoading(false)
    }
  }

  const cardVariants = shouldReduceMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.4, ease: [0.42, 0, 0.58, 1] },
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
            ease: [0.42, 0, 0.58, 1],
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
            ease: [0.42, 0, 0.58, 1],
          },
        }),
      }

  return (
    <Card className="h-full flex flex-col bg-white border-gray-200 shadow-sm">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="h-full flex flex-col"
      >
        <CardHeader className="pb-4 pt-4 pl-6 flex-shrink-0 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Attribution by Source
              </h3>
              {isConnected && totalCrawls > 0 && (
                <p className="text-sm text-gray-600">
                  {totalCrawls.toLocaleString()} crawls tracked
                </p>
              )}
            </div>
            <TimeframeSelector
              key={timeframe}
              title=""
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
              titleColor="text-gray-900"
              selectorColor="text-gray-600"
            />
          </div>
        </CardHeader>

        <CardContent className="flex-1 min-h-0 pt-6 pr-6 pb-8 pl-6 flex flex-col relative">
          {switching ? (
            <motion.div 
              key="switching"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center h-full"
            >
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-3">
                  <img 
                    src="/images/split-icon-black.svg" 
                    alt="Split" 
                    className="w-full h-full animate-spin"
                    style={{ animation: 'spin 1s linear infinite' }}
                  />
                </div>
                <p className="text-gray-600 text-sm">Switching workspace...</p>
              </div>
            </motion.div>
          ) : isLoading ? (
            <motion.div
              key="loading-skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <ListSkeleton 
                itemType="crawler"
                items={5}
                showProgress={true}
                showHeader={false}
                className="bg-transparent border-none shadow-none h-full"
              />
            </motion.div>
          ) : error ? (
            <motion.div
              key="error-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center h-full"
            >
              <div className="text-center">
                <p className="text-gray-600 text-sm">{error}</p>
                <button 
                  onClick={fetchCrawlerData}
                  className="mt-2 text-sm text-gray-900 hover:underline"
                >
                  Try again
                </button>
              </div>
            </motion.div>
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
                        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 border border-gray-200">
                          {source.icon === 'sparkles' ? (
                            <Sparkles className="w-3.5 h-3.5 text-gray-600" />
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
                              <div className="w-2.5 h-2.5 rounded-full bg-gray-400 hidden" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-gray-900 font-medium text-sm">{source.name}</div>
                          <div className="text-gray-600 text-xs">
                            {source.crawls.toLocaleString()} crawls
                          </div>
                        </div>
                      </div>
                      <motion.div 
                        className="text-gray-900 font-semibold text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 + 0.2, duration: 0.3 }}
                      >
                        {source.percentage.toFixed(1)}%
                      </motion.div>
                    </div>
                    <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
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
              <div className="pt-4 border-t border-gray-200 mt-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm font-medium">Total Crawls</span>
                  <motion.span 
                    className="text-gray-900 font-semibold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
                  >
                    {totalCrawls.toLocaleString()}
                  </motion.span>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
              className="relative h-full flex flex-col"
            >
              {/* Preview - takes full height */}
              <div className="absolute inset-0 opacity-30 blur-sm pointer-events-none">
                <div className="flex-1 space-y-5 overflow-hidden">
                  {crawlerData.slice(0, 5).map((source, index) => (
                    <div key={source.name} className="group">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 border border-gray-200">
                            {source.icon === 'sparkles' ? (
                              <Sparkles className="w-3.5 h-3.5 text-gray-600" />
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
                                <div className="w-2.5 h-2.5 rounded-full bg-gray-400 hidden" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-gray-900 font-medium text-sm">{source.name}</div>
                            <div className="text-gray-600 text-xs">
                              {source.crawls.toLocaleString()} crawls
                            </div>
                          </div>
                        </div>
                        <div className="text-gray-900 font-semibold text-sm">
                          {source.percentage.toFixed(1)}%
                        </div>
                      </div>
                      <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
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
                <div className="pt-4 border-t border-gray-200 mt-4 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm font-medium">Total Crawls</span>
                    <span className="text-gray-900 font-semibold">
                      {totalCrawls.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Empty state message - absolute positioned overlay */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
                className="absolute inset-0 flex items-center justify-center z-10"
              >
                <div className="text-center max-w-sm">
                  <h4 className="text-gray-900 font-medium mb-2">No data yet</h4>
                  <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                    Track which AI engines are viewing your content most frequently
                  </p>
                  <button 
                    onClick={() => setShowConnectDialog(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Connect Analytics
                  </button>
                </div>
              </motion.div>
            </motion.div>
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
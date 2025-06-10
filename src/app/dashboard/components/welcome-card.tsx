'use client'
import { Card, CardContent } from "@/components/ui/card"
import { motion, useAnimation, useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { BarChart3, FileText, Bot, HelpCircle, Rocket, ArrowRight, Activity, Settings } from "lucide-react"
import Link from "next/link"
import { ConnectAnalyticsDialog } from "./connect-analytics-dialog"

interface UserProfile {
  first_name: string | null
  workspace_name: string | null
}

interface CrawlerStats {
  total_visits: number
  unique_crawlers: number
  last_crawl_date: string | null
}

interface LatestCrawl {
  crawler_name: string
  company: string
  timestamp: string
}

export function WelcomeCard() {
  const { user } = useAuth()
  const { currentWorkspace } = useWorkspace()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [crawlerStats, setCrawlerStats] = useState<CrawlerStats | null>(null)
  const [latestCrawl, setLatestCrawl] = useState<LatestCrawl | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const shouldReduceMotion = useReducedMotion()
  const controls = useAnimation()
  
  const supabase = createClient()

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user || !supabase) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, workspace_name')
          .eq('id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error)
        }

        setProfile(data || null)
      } catch (err) {
        console.error('Error in profile fetch:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user, supabase])

  // Fetch crawler attribution stats
  useEffect(() => {
    const fetchCrawlerStats = async () => {
      if (!user || !supabase || !currentWorkspace) {
        setLoadingStats(false)
        return
      }

      try {
        // Get crawler stats from last 24 hours
        const twentyFourHoursAgo = new Date()
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

        const { data, error } = await supabase
          .from('crawler_visits')
          .select('crawler_name, crawler_company, timestamp, created_at')
          .eq('workspace_id', currentWorkspace.id)
          .gte('created_at', twentyFourHoursAgo.toISOString())
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching crawler stats:', error)
          console.error('Query details:', {
            workspace_id: currentWorkspace.id,
            time_filter: twentyFourHoursAgo.toISOString()
          })
          setCrawlerStats(null)
          setLatestCrawl(null)
        } else {
          console.log('Crawler data fetched successfully:', data?.length || 0, 'visits')
          if (data && data.length > 0) {
            const uniqueCrawlers = new Set(data.map(visit => visit.crawler_name)).size
            const lastCrawlDate = data[0].created_at // Most recent since ordered by created_at desc

            setCrawlerStats({
              total_visits: data.length,
              unique_crawlers: uniqueCrawlers,
              last_crawl_date: lastCrawlDate
            })

            // Set latest crawl info
            setLatestCrawl({
              crawler_name: data[0].crawler_name,
              company: data[0].crawler_company || 'Unknown',
              timestamp: data[0].created_at
            })
          } else {
            setCrawlerStats({
              total_visits: 0,
              unique_crawlers: 0,
              last_crawl_date: null
            })
            setLatestCrawl(null)
          }
        }
      } catch (err) {
        console.error('Error in crawler stats fetch:', err)
        setCrawlerStats(null)
        setLatestCrawl(null)
      } finally {
        setLoadingStats(false)
      }
    }

    fetchCrawlerStats()
  }, [user, supabase, currentWorkspace])

  useEffect(() => {
    if (shouldReduceMotion) {
      controls.start({ opacity: 1, y: 0 })
      return
    }
    controls.start({
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.4,
        ease: "easeOut"
      },
    })
  }, [controls, shouldReduceMotion])

  // Generate welcome message based on crawler activity
  const getWelcomeMessage = (stats: CrawlerStats | null) => {
    if (!stats || stats.total_visits === 0) {
      return "Ready to track AI crawler activity? Your attribution insights will appear here once crawlers visit your site."
    }
    
    if (stats.total_visits < 10) {
      return "Great start! You're seeing initial AI crawler activity. More data will improve your attribution insights."
    } else if (stats.total_visits < 50) {
      return "Building momentum! Your site is attracting regular AI crawler attention across multiple platforms."
    } else if (stats.total_visits < 200) {
      return "Strong AI crawler engagement! You're getting consistent attention from various AI platforms."
    } else {
      return "Excellent AI crawler attribution! Your content is being heavily referenced by AI systems."
    }
  }

  // Get user's display name
  const getDisplayName = () => {
    if (loading) return "..."
    return profile?.first_name || "there"
  }

  // Format the last crawl date
  const getLastCrawlDate = () => {
    if (!crawlerStats?.last_crawl_date) return null
    return new Date(crawlerStats.last_crawl_date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Get favicon for a company
  const getFaviconForCompany = (company: string) => {
    const companyDomainMap: Record<string, string> = {
      'OpenAI': 'openai.com',
      'Anthropic': 'anthropic.com', 
      'Google': 'google.com',
      'Perplexity': 'perplexity.ai',
      'Microsoft': 'microsoft.com',
      'Meta': 'meta.com',
      'Twitter': 'twitter.com',
      'X': 'x.com',
      'ByteDance': 'bytedance.com'
    }

    const domain = companyDomainMap[company]
    if (domain) {
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    }
    
    const constructedDomain = `${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`
    return `https://www.google.com/s2/favicons?domain=${constructedDomain}&sz=32`
  }

  // Format time since last crawl
  const getTimeSinceLastCrawl = (timestamp: string) => {
    const now = new Date()
    const crawlTime = new Date(timestamp)
    const diffMs = now.getTime() - crawlTime.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes !== 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    return crawlTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const quickActions = [
    { 
      icon: Activity, 
      label: "Crawler Attribution", 
      desc: crawlerStats?.total_visits ? "View detailed attribution insights" : "Monitor AI crawler activity", 
      href: "/dashboard",
      primary: true
    },
    { 
      icon: BarChart3, 
      label: "Analytics Dashboard", 
      desc: "View crawler trends and stats", 
      href: "/dashboard",
      primary: false
    },
    { 
      icon: Settings, 
      label: "Account Settings", 
      desc: "Manage billing, workspaces & preferences", 
      href: "/settings",
      primary: false
    },
  ]

  return (
    <Card className="bg-transparent border-[#1a1a1a] h-full">
      <CardContent className="p-8 h-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={controls}
          className="h-full flex flex-col"
        >
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-medium text-white mb-3 font-mono tracking-tight">
              Welcome back, {getDisplayName()}
            </h1>
            <p className="text-[#888] text-lg leading-relaxed mb-4 max-w-2xl">
              {getWelcomeMessage(crawlerStats)}
            </p>
            
            {/* Crawler Stats Badge or Empty State */}
            <div className="flex items-center gap-3 mb-6">
              {loadingStats ? (
                <div className="flex items-center gap-2 bg-[#111] border border-[#1a1a1a] rounded-sm px-3 py-2">
                  <div className="w-2 h-2 bg-[#333] rounded-full animate-pulse"></div>
                  <span className="text-sm text-[#666] font-mono tracking-tight">
                    Loading activity...
                  </span>
                </div>
              ) : crawlerStats && crawlerStats.total_visits > 0 ? (
                <>
                  {/* Latest crawl in card */}
                  {latestCrawl && (
                    <div className="flex items-center gap-2 bg-[#111] border border-[#1a1a1a] rounded-sm px-3 py-2">
                      <img 
                        src={getFaviconForCompany(latestCrawl.company)}
                        alt={latestCrawl.company}
                        width={16}
                        height={16}
                        className="w-4 h-4 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const fallback = target.nextElementSibling as HTMLElement
                          if (fallback) fallback.style.display = 'block'
                        }}
                      />
                      <Bot className="w-4 h-4 text-[#666] hidden" />
                      <span className="text-sm text-white font-mono tracking-tight">
                        {latestCrawl.crawler_name}
                      </span>
                      <span className="text-xs text-[#666] font-mono tracking-tight">
                        • {getTimeSinceLastCrawl(latestCrawl.timestamp)}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 bg-[#111] border border-[#1a1a1a] border-dashed rounded-sm px-3 py-2">
                    <Bot className="w-4 h-4 text-[#666]" />
                    <span className="text-sm text-[#666] font-mono tracking-tight">
                      No crawler activity yet
                    </span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-transparent border-[#333] text-[#888] hover:text-white hover:border-[#444] h-8 px-3 text-xs font-mono tracking-tight"
                    onClick={() => setShowConnectDialog(true)}
                  >
                    <div className="flex items-center gap-1">
                      Set Up Tracking
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex-1">
            <div className="mb-4">
              <h2 className="text-sm text-[#666] font-mono tracking-tight uppercase">Quick Actions</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <Link
                    href={action.href}
                    className={`group block p-4 bg-[#111] border border-[#1a1a1a] hover:border-[#333] hover:bg-[#151515] transition-all duration-200 rounded-sm ${
                      action.primary ? 'md:col-span-2' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-[#1a1a1a] rounded-sm flex items-center justify-center group-hover:bg-[#222] transition-colors">
                        <action.icon className="w-4 h-4 text-[#666] group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-white group-hover:text-white transition-colors font-mono tracking-tight mb-1">
                          {action.label}
                        </h3>
                        <p className="text-xs text-[#666] group-hover:text-[#888] transition-colors">
                          {action.desc}
                        </p>
                      </div>
                      <ArrowRight className="w-3 h-3 text-[#444] group-hover:text-[#666] transition-colors mt-0.5" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-8 pt-6 border-t border-[#1a1a1a]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link 
                  href="/changelog" 
                  className="text-xs text-[#666] hover:text-white transition-colors font-mono tracking-tight flex items-center gap-1"
                >
                  <Rocket className="w-3 h-3" />
                  What's New
                </Link>
                <Link 
                  href="/support" 
                  className="text-xs text-[#666] hover:text-white transition-colors font-mono tracking-tight flex items-center gap-1"
                >
                  <HelpCircle className="w-3 h-3" />
                  Get Support
                </Link>
              </div>
              <div className="text-xs text-[#666] font-mono tracking-tight">
                {crawlerStats?.total_visits ? `${crawlerStats.total_visits} AI crawler visits (24h)` : 'Ready to track AI crawlers'}
              </div>
            </div>
          </div>
        </motion.div>
      </CardContent>

      <ConnectAnalyticsDialog 
        open={showConnectDialog}
        onOpenChange={setShowConnectDialog}
      />
    </Card>
  )
} 
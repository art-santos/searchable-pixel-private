'use client'
import { Card, CardContent } from "@/components/ui/card"
import { motion, useAnimation, useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { BarChart3, FileText, Bot, HelpCircle, Rocket, ArrowRight, Activity, Settings, Users, UserCircle } from "lucide-react"
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
      return "You've got excellent crawler traction, keep posting great content."
    }
    
    return "You've got excellent crawler traction, keep posting great content."
  }

  // Get user's display name
  const getDisplayName = () => {
    if (loading) return "..."
    const fullName = profile?.first_name || "there"
    // Get only the first name (before any space)
    return fullName.split(' ')[0]
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
      label: "View Crawler Attribution", 
      href: "/dashboard/attribution",
    },
    { 
      icon: Users, 
      label: "View your leads", 
      href: "/dashboard/leads",
    },
    { 
      icon: UserCircle, 
      label: "Get Help/Support", 
      href: "mailto:sam@split.dev",
    },
  ]

  return (
    <Card className="bg-white border border-gray-200 shadow-sm h-full">
      <CardContent className="p-6 h-full flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={controls}
          className="h-full flex flex-col justify-between"
        >
          {/* Welcome Section */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-light text-gray-900 mb-2 sm:mb-3">
              Welcome back, <span className="font-['Instrument_Serif'] italic tracking-tight">{getDisplayName()}</span>
            </h1>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              {getWelcomeMessage(crawlerStats)}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex-shrink-0">
            <div className="mb-1 sm:mb-2">
              <h2 className="text-xs text-gray-500 uppercase tracking-wider font-mono">QUICK ACTIONS</h2>
            </div>
            
            <div className="space-y-1 sm:space-y-2">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <Link
                    href={action.href}
                    className="group block py-1.5 sm:py-2 pl-2 sm:pl-3 pr-3 sm:pr-4 bg-transparent border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2 sm:gap-4">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <action.icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-gray-700 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs sm:text-sm text-gray-600 group-hover:text-gray-700 transition-colors font-mono tracking-tight truncate">
                          {action.label}
                        </h3>
                      </div>
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                    </div>
                  </Link>
                </motion.div>
              ))}
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
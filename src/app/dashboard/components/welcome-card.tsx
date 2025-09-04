'use client'
import { Card, CardContent } from "@/components/ui/card"
import { motion, useAnimation, useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Activity, Database, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
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
  const [isPopulating, setIsPopulating] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const shouldReduceMotion = useReducedMotion()
  const controls = useAnimation()
  const { toast } = useToast()
  
  const supabase = createClient()

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.42, 0, 0.58, 1] } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.42, 0, 0.58, 1] } }
  }

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
        ease: [0.42, 0, 0.58, 1]
      },
    })
  }, [controls, shouldReduceMotion])

  // Generate welcome message based on crawler activity
  const getWelcomeMessage = (stats: CrawlerStats | null) => {
    if (!stats || stats.total_visits === 0) {
      return ""
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

  // Handle populate test data
  const handlePopulateTestData = async () => {
    if (!currentWorkspace || isPopulating) return

    setIsPopulating(true)
    try {
      const response = await fetch('/api/test/populate-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspaceId: currentWorkspace.id,
          count: 50
        }) 
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Test Data Populated",
          description: `Successfully added ${result.details.total_visits} crawler visits with ${result.details.unique_crawlers} different crawlers`
        })
        // Refresh the page data
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        throw new Error(result.error || 'Failed to populate test data')
      }
    } catch (error) {
      console.error('Error populating test data:', error)
      toast({
        title: "Error",
        description: "Failed to populate test data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsPopulating(false)
    }
  }

  // Handle simulate events
  const handleSimulateEvents = async () => {
    if (!currentWorkspace || isSimulating) return

    setIsSimulating(true)
    try {
      const response = await fetch('/api/test/simulate-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspaceId: currentWorkspace.id,
          duration: 10
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Event Simulation Started",
          description: "Simulating crawler events for 10 seconds. Watch the dashboard for real-time updates!"
        })
        // Stop simulating state after 10 seconds
        setTimeout(() => {
          setIsSimulating(false)
          toast({
            title: "Simulation Complete",
            description: "Event simulation finished. Check your dashboard data!"
          })
        }, 10000)
      } else {
        throw new Error(result.error || 'Failed to start event simulation')
      }
    } catch (error) {
      console.error('Error simulating events:', error)
      toast({
        title: "Error",
        description: "Failed to start event simulation. Please try again.",
        variant: "destructive"
      })
      setIsSimulating(false)
    }
  }


  const quickActions = [
    { 
      icon: Activity, 
      label: "Simulate Events",
      action: handleSimulateEvents,
      loading: isSimulating,
      disabled: !currentWorkspace
    },
    { 
      icon: Database,
      label: "Populate with Test Data",
      action: handlePopulateTestData,
      loading: isPopulating,
      disabled: !currentWorkspace
    }
  ]

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      className="h-full"
    >
      <Card className="bg-white border border-gray-200 shadow-sm h-full">
        <CardContent className="p-6 h-full">
          {loading || loadingStats ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
                  className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-gray-400 mx-auto mb-4"
                />
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
                  className="text-gray-500 text-sm"
                >
                  Loading workspace...
                </motion.p>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.42, 0, 0.58, 1] }}
              className="h-full flex items-center justify-between gap-6"
            >
              {/* Left: Welcome Section */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-light text-gray-900 mb-2 truncate">
                  Welcome back, <span className="font-['Instrument_Serif'] italic tracking-tight">{getDisplayName()}</span>
                </h1>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  {getWelcomeMessage(crawlerStats)}
                </p>
              </div>

              {/* Right: Quick Actions */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
                }}
                className="flex gap-3"
              >
                {quickActions.map((action, index) => (
                  <motion.div
                    key={action.label}
                    variants={itemVariants}
                  >
                    <Button
                      variant="outline"
                      onClick={action.action}
                      disabled={action.disabled || action.loading}
                      className="flex items-center gap-2 bg-transparent border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 px-4 py-2"
                    >
                      {action.loading ? (
                        <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />
                      ) : (
                        <action.icon className="w-4 h-4 text-gray-600" />
                      )}
                      <span className="text-sm font-mono text-gray-600">
                        {action.loading ? (
                          action.label === "Simulate Events" ? "Simulating..." : "Populating..."
                        ) : (
                          action.label
                        )}
                      </span>
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </CardContent>

        <ConnectAnalyticsDialog 
          open={showConnectDialog}
          onOpenChange={setShowConnectDialog}
        />
      </Card>
    </motion.div>
  )
} 
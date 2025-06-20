import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  TimeframeSelector,
  TimeframeOption as TimeframeType,
} from "@/components/custom/timeframe-selector"
import { CrawlerVisitsChart } from "@/components/charts/crawler-visits-chart"
import { useState, useEffect, useCallback } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { LinkIcon, TrendingUp, Loader2 } from "lucide-react"
import { ConnectAnalyticsDialog } from "../connect-analytics-dialog"
import { useAuth } from "@/contexts/AuthContext"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { PlanType } from "@/lib/subscription/config"




export function PageViewCard() {
  const { session } = useAuth()
  const { currentWorkspace, switching } = useWorkspace()
  const [timeframe, setTimeframe] = useState<TimeframeType>('Last 24 hours')
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const [totalCrawls, setTotalCrawls] = useState(0)
  const [isConnected, setIsConnected] = useState<boolean | null>(null) // null = loading, true = has data, false = no data
  const [userPlan, setUserPlan] = useState<PlanType>('starter')
  const [userPlanLoading, setUserPlanLoading] = useState(true)
  const shouldReduceMotion = useReducedMotion()

  // Fetch user subscription plan
  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const response = await fetch('/api/user/subscription')
        if (response.ok) {
          const data = await response.json()
          const plan = data.subscriptionPlan || 'starter'
          console.log('🔍 [PageViewCard] Fetched user plan:', plan, 'isAdmin:', data.isAdmin)
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



  const handleTimeframeChange = (newTimeframe: TimeframeType) => {
    setTimeframe(newTimeframe)
  }

  const handleDataChange = (data: { totalCrawls: number; periodComparison: any }) => {
    setTotalCrawls(data.totalCrawls)
    setIsConnected(data.totalCrawls > 0)
  }

  const cardVariants = shouldReduceMotion ? {
    hidden: { opacity: 1 },
    visible: { opacity: 1 }
  } : {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  }

  return (
    <Card className="h-full flex flex-col bg-white dark:bg-transparent border-gray-200 dark:border-[#1a1a1a]">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="h-full flex flex-col"
      >
        <CardHeader className="pb-4 pt-4 pl-6 flex-shrink-0 border-b border-gray-200 dark:border-[#1a1a1a]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-black dark:text-white mb-1">Crawler Visits</h3>
              {isConnected === true && totalCrawls > 0 && (
                <p className="text-sm text-gray-500 dark:text-[#666]">{totalCrawls.toLocaleString()} total visits</p>
              )}
            </div>
            {!userPlanLoading && (
              <TimeframeSelector 
                key={userPlan}
                title=""
                timeframe={timeframe} 
                onTimeframeChange={handleTimeframeChange}
                titleColor="text-white"
                selectorColor="text-[#A7A7A7]"
                userPlan={userPlan}
              />
            )}
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 min-h-0 pt-4 pr-6 pb-8 pl-6 flex flex-col relative">
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
          ) : (
            <CrawlerVisitsChart 
              timeframe={timeframe}
              onDataChange={handleDataChange}
              className="h-full"
              onConnectAnalytics={() => setShowConnectDialog(true)}
            />
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
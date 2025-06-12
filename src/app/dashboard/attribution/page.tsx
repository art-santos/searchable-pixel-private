'use client'

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { motion, useReducedMotion } from "framer-motion"
import { TimeframeSelector, TimeframeOption } from "@/components/custom/timeframe-selector"
import { useState, useEffect } from "react"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { Loader2 } from "lucide-react"
import { PlanType } from "@/lib/subscription/config"
import { CrawlerVisitsChart } from "@/components/charts/crawler-visits-chart"
import { CrawlerAttributionCard } from "@/components/attribution/crawler-attribution-card"
import { PageAttributionCard } from "@/components/attribution/page-attribution-card"
import { useAttributionData } from "@/hooks/use-attribution-data"
import { AttributionPageSkeleton } from "@/components/skeletons"
import { ConnectAnalyticsDialog } from "@/app/dashboard/components/connect-analytics-dialog"



export default function AttributionPage() {
  const shouldReduceMotion = useReducedMotion()
  const [timeframe, setTimeframe] = useState<TimeframeOption>('Last 7 days')
  const { switching } = useWorkspace()
  const [userPlan, setUserPlan] = useState<PlanType>('starter')
  const [userPlanLoading, setUserPlanLoading] = useState(true)
  const [showConnectDialog, setShowConnectDialog] = useState(false)

  // Use the custom hook for data fetching
  const { 
    stats, 
    crawlerData, 
    pageData, 
    periodComparison, 
    isLoading, 
    error,
    handleChartDataChange 
  } = useAttributionData(timeframe)

  // Fetch user subscription plan
  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const response = await fetch('/api/user/subscription')
        if (response.ok) {
          const data = await response.json()
          const plan = data.subscriptionPlan || 'starter'
          console.log('🔍 [AttributionPage] Fetched user plan:', plan, 'isAdmin:', data.isAdmin)
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



  const cardVariants = shouldReduceMotion 
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
      }

  if (switching) {
  return (
    <div className="min-h-screen min-w-screen bg-white dark:bg-[#0c0c0c] text-black dark:text-white">
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
      </div>
    )
  }

  if (isLoading) {
    return <AttributionPageSkeleton />
  }

  if (error) {
    return (
      <div className="min-h-screen min-w-screen bg-white dark:bg-[#0c0c0c] text-black dark:text-white">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-red-500 mb-2">Error loading attribution data</p>
            <p className="text-sm text-[#666]">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen min-w-screen bg-white dark:bg-[#0c0c0c] text-black dark:text-white">
        <div className="flex h-[calc(100vh-80px)] gap-6 p-6">
          {/* Large Graph - 60% width */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="w-[60%]"
          >
            <Card className="h-full bg-white dark:bg-[#0c0c0c] border-gray-200 dark:border-[#1a1a1a]">
              <CardContent className="p-0 h-full flex flex-col">
                {/* Graph Header */}
                <CardHeader className="pb-4 pt-4 pl-6 pr-6 flex-shrink-0 border-b border-gray-200 dark:border-[#1a1a1a]">
                  <div className="flex items-center justify-between">
                    <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-black dark:text-white">
                        Total Crawls
                      </h3>
                      {periodComparison?.hasComparison && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3, duration: 0.3 }}
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            periodComparison.trend === 'up' 
                              ? 'bg-green-500/20 text-green-600 dark:bg-green-500/20 dark:text-green-400' 
                              : periodComparison.trend === 'down'
                              ? 'bg-red-500/20 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                              : 'bg-gray-500/20 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400'
                          }`}
                        >
                          {periodComparison.percentChange !== undefined 
                            ? `${periodComparison.percentChange > 0 ? '+' : ''}${Math.round(periodComparison.percentChange).toLocaleString()}%`
                            : 'NEW'
                          }
                        </motion.div>
                      )}
                    </div>
                      <p className="text-sm text-gray-500 dark:text-[#666]">
                        {stats?.totalCrawls.toLocaleString() || '0'} crawls tracked
                      </p>
                    </div>
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
                  </div>
                </CardHeader>

                {/* Graph Content */}
                <div className="flex-1 p-6">
                <CrawlerVisitsChart 
                  timeframe={timeframe}
                  onDataChange={handleChartDataChange}
                  className="h-full"
                  onConnectAnalytics={() => setShowConnectDialog(true)}
                />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Side Cards - 40% width */}
          <div className="w-[40%] flex flex-col gap-6">
            {/* Attribution by Source Card */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="flex-1"
            >
            <CrawlerAttributionCard 
              crawlerData={crawlerData}
              isLoading={isLoading}
              onConnectAnalytics={() => setShowConnectDialog(true)}
            />
            </motion.div>

            {/* Crawls by Page Card */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="flex-1"
            >
            <PageAttributionCard 
              pageData={pageData}
              isLoading={isLoading}
              onConnectAnalytics={() => setShowConnectDialog(true)}
            />
            </motion.div>
          </div>
        </div>

        <ConnectAnalyticsDialog 
          open={showConnectDialog}
          onOpenChange={setShowConnectDialog}
        />
    </div>
  )
} 
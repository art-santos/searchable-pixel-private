'use client'

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { motion, useReducedMotion } from "framer-motion"
import { TimeframeSelector, TimeframeOption } from "@/components/custom/timeframe-selector"
import { useState, useEffect, useCallback } from "react"
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

  // Memoize the callback to prevent unnecessary re-renders
  const handleConnectAnalytics = useCallback(() => {
    setShowConnectDialog(true)
  }, [])

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
    <div className="min-h-screen min-w-screen bg-gray-50 text-gray-900">
        <div className="flex items-center justify-center h-96">
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
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <AttributionPageSkeleton />
  }

  if (error) {
    return (
      <div className="min-h-screen min-w-screen bg-gray-50 text-gray-900">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-red-600 mb-2 font-medium">Error loading attribution data</p>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen min-w-screen bg-[#f9f9f9] text-gray-900">
        <div className="flex h-[calc(100vh-80px)] gap-6 p-6">
          {/* Large Graph - 60% width */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="w-[60%] h-[calc(100vh-72px)]"
          >
            <Card className="h-full bg-white border-gray-200 shadow-sm">
              <CardContent className="p-0 h-full flex flex-col">
                {/* Graph Header */}
                <CardHeader className="pb-4 pt-6 pl-6 pr-6 flex-shrink-0 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Total Crawls
                      </h3>
                      {periodComparison?.hasComparison && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3, duration: 0.3 }}
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            periodComparison.trend === 'up' 
                              ? 'bg-green-50 text-green-700 border border-green-200' 
                              : periodComparison.trend === 'down'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-gray-50 text-gray-700 border border-gray-200'
                          }`}
                        >
                          {periodComparison.percentChange !== undefined 
                            ? `${periodComparison.percentChange > 0 ? '+' : ''}${Math.round(periodComparison.percentChange).toLocaleString()}%`
                            : 'NEW'
                          }
                        </motion.div>
                      )}
                    </div>
                      <p className="text-sm text-gray-600">
                        {stats?.totalCrawls.toLocaleString() || '0'} crawls tracked
                      </p>
                    </div>
                  {!userPlanLoading && (
                    <TimeframeSelector 
                      key={userPlan}
                      title=""
                      timeframe={timeframe}
                      onTimeframeChange={setTimeframe}
                      titleColor="text-gray-900"
                      selectorColor="text-gray-600"
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
                  onConnectAnalytics={handleConnectAnalytics}
                />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Side Cards - 40% width */}
          <div className="w-[40%] h-[calc(100vh-72px)] flex flex-col gap-6">
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
              onConnectAnalytics={handleConnectAnalytics}
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
              onConnectAnalytics={handleConnectAnalytics}
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
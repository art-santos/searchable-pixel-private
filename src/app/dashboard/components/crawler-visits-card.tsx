'use client'
import { Card, CardContent } from "@/components/ui/card"
import { motion, useReducedMotion } from "framer-motion"
import { TimeframeSelector, TimeframeOption } from "@/components/custom/timeframe-selector"
import { useState, useEffect, useCallback } from "react"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { PlanType } from "@/lib/subscription/config"
import { CrawlerVisitsChart } from "@/components/charts/crawler-visits-chart"
import { ChartSkeleton } from "@/components/skeletons"

export function CrawlerVisitsCard() {
  const shouldReduceMotion = useReducedMotion()
  const [timeframe, setTimeframe] = useState<TimeframeOption>('Last 24 hours')
  const { currentWorkspace, switching } = useWorkspace()
  const [userPlan, setUserPlan] = useState<PlanType>('starter')
  const [userPlanLoading, setUserPlanLoading] = useState(true)
  const [totalCrawls, setTotalCrawls] = useState(0)
  const [periodComparison, setPeriodComparison] = useState<any | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const cardVariants = shouldReduceMotion 
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } }
      }

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
        // Set initial load to false when user plan loading is complete
        setTimeout(() => setIsInitialLoad(false), 100)
      }
    }

    fetchUserPlan()
  }, [])

  // Handle data updates from the shared chart component
  const handleChartDataChange = useCallback((data: { totalCrawls: number; periodComparison: any | null }) => {
    setTotalCrawls(data.totalCrawls)
    setPeriodComparison(data.periodComparison)
  }, [])

  // Show full card skeleton during initial load
  if (isInitialLoad) {
    return (
      <Card className="h-full bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-0 h-full">
          <ChartSkeleton 
            className="h-full"
            showHeader={true}
            showStats={false}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full bg-white border border-gray-200 shadow-sm">
      <CardContent className="p-0 h-full flex flex-col">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="flex flex-col h-full"
        >
          {/* Header */}
          <div className="px-3 sm:px-6 py-4 sm:py-6 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 sm:gap-3">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-light text-gray-900 tracking-tight">Site Crawls</h3>
                {periodComparison?.hasComparison && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.2, ease: "easeOut" }}
                    className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded border text-xs font-medium ${
                      periodComparison.trend === 'up' 
                        ? 'bg-green-50 border-green-200 text-green-700' 
                        : periodComparison.trend === 'down'
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700'
                    }`}
                  >
                    {periodComparison.percentChange !== undefined 
                      ? `${periodComparison.percentChange > 0 ? '+' : ''}${Math.round(periodComparison.percentChange).toLocaleString()}%`
                      : 'NEW'
                    }
                  </motion.div>
                )}
              </div>
              {totalCrawls > 0 && (
                <p className="text-xs text-gray-500 mt-0.5">{totalCrawls.toLocaleString()} total visits</p>
              )}
            </div>
            <div className="timeframe-selector-light flex-shrink-0">
              <TimeframeSelector 
                key={userPlan}
                title=""
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
                titleColor="text-gray-900"
                selectorColor="text-gray-600"
                userPlan={userPlan}
              />
            </div>
          </div>

          {/* Chart Area */}
          <div className="flex-1 overflow-hidden relative px-0 pb-1 sm:pb-2">
            {switching ? (
              <motion.div 
                className="flex items-center justify-center h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
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
                  <p className="text-gray-500 text-sm">Switching workspace...</p>
                </div>
              </motion.div>
            ) : (
              <div className="h-full">
                <CrawlerVisitsChart 
                  timeframe={timeframe}
                  onDataChange={handleChartDataChange}
                  className="h-full"
                />
              </div>
            )}
          </div>
        </motion.div>
      </CardContent>
      
      <style jsx global>{`
        /* Light theme for timeframe selector in crawler card */
        .timeframe-selector-light button {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          color: #6b7280;
        }
        
        .timeframe-selector-light button:hover {
          color: #374151;
        }
        
        .timeframe-selector-light svg {
          width: 0.875rem;
          height: 0.875rem;
        }
      `}</style>
    </Card>
  )
} 
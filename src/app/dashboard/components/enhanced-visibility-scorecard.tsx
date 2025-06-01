'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TimeframeSelector, TimeframeOption } from "@/components/custom/timeframe-selector"
import { motion, useReducedMotion } from "framer-motion"
import { Sparkles, TrendingUp, TrendingDown, AlertCircle, Zap, ArrowUpRight, RefreshCw, ChevronRight } from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

interface VisibilityData {
  lite_score?: number
  max_score?: number
  combined_score: number
  score_confidence: number
  data_source: 'lite_only' | 'max_only' | 'max_with_lite_fallback'
  trend: {
    direction: 'up' | 'down' | 'stable'
    change_percentage: number
    timeframe: string
  }
  last_updated: string
  next_scan_estimated?: string
}

interface UpgradeInsights {
  current_plan: 'lite' | 'max'
  potential_improvements: {
    metric: string
    lite_value?: number
    estimated_max_value: number
    improvement_percentage: number
  }[]
  upgrade_value_proposition: string
}

export function EnhancedVisibilityScorecard() {
  const { user } = useAuth()
  const { subscription } = useSubscription()
  const shouldReduceMotion = useReducedMotion()
  const supabase = createClient()

  const [timeframe, setTimeframe] = useState<TimeframeOption>('Last 30 days')
  const [visibilityData, setVisibilityData] = useState<VisibilityData | null>(null)
  const [upgradeInsights, setUpgradeInsights] = useState<UpgradeInsights | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Determine user's current plan capabilities
  const hasMaxAccess = subscription?.plan === 'plus' || subscription?.plan === 'pro'
  const isPro = subscription?.plan === 'pro'

  // Mock data for development - replace with real API calls
  const mockData: VisibilityData = {
    lite_score: hasMaxAccess ? 65.2 : undefined,
    max_score: hasMaxAccess ? 78.4 : undefined,
    combined_score: hasMaxAccess ? 78.4 : 65.2,
    score_confidence: hasMaxAccess ? 0.92 : 0.75,
    data_source: hasMaxAccess ? 'max_with_lite_fallback' : 'lite_only',
    trend: {
      direction: 'up',
      change_percentage: 12.3,
      timeframe: '30 days'
    },
    last_updated: new Date().toISOString(),
    next_scan_estimated: hasMaxAccess ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  }

  const mockUpgradeInsights: UpgradeInsights = {
    current_plan: hasMaxAccess ? 'max' : 'lite',
    potential_improvements: [
      {
        metric: 'Analysis Depth',
        lite_value: 10,
        estimated_max_value: 50,
        improvement_percentage: 400
      },
      {
        metric: 'Competitive Intelligence',
        estimated_max_value: 85,
        improvement_percentage: 85
      },
      {
        metric: 'AI Conversation Coverage',
        estimated_max_value: 95,
        improvement_percentage: 95
      }
    ],
    upgrade_value_proposition: 'Unlock comprehensive AI visibility analysis with 5x more insights and competitive intelligence'
  }

  // Load visibility data
  useEffect(() => {
    const loadVisibilityData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        if (!user) {
          setVisibilityData(null)
          setUpgradeInsights(null)
          return
        }

        // For now, use mock data
        // TODO: Replace with actual API call to unified data API
        // const response = await fetch(`/api/max-visibility/data?company_id=${user.id}&request_type=visibility_data`)
        
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
        setVisibilityData(mockData)
        
        if (!hasMaxAccess) {
          setUpgradeInsights(mockUpgradeInsights)
        }

      } catch (err) {
        console.error('Failed to load visibility data:', err)
        setError('Failed to load visibility data')
        setVisibilityData(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadVisibilityData()
  }, [user, hasMaxAccess])

  // Handle manual refresh
  const handleRefresh = async () => {
    if (!user) return

    setIsRefreshing(true)
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      setVisibilityData({ ...mockData, last_updated: new Date().toISOString() })
    } catch (err) {
      console.error('Failed to refresh data:', err)
      setError('Failed to refresh data')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Animation variants
  const cardVariants = shouldReduceMotion ? {
    hidden: { opacity: 1 },
    visible: { opacity: 1 }
  } : {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
    }
  }

  const scoreVariants = shouldReduceMotion ? {
    hidden: { opacity: 1 },
    visible: { opacity: 1 }
  } : {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { delay: 0.2, duration: 0.3, ease: [0.16, 1, 0.3, 1] }
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-[#111111] border-[#222222] h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin text-[#666]" />
            <span className="text-[#666] text-sm">Loading visibility data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !visibilityData) {
    return (
      <Card className="bg-[#111111] border-[#222222] h-full">
        <CardContent className="flex flex-col items-center justify-center h-full space-y-4">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <div className="text-center">
            <p className="text-white font-medium">No visibility data available</p>
            <p className="text-[#666] text-sm mt-1">
              {error || 'Run your first assessment to see your AI visibility score'}
            </p>
          </div>
          <Button 
            onClick={handleRefresh}
            variant="outline"
            className="border-[#333] bg-transparent hover:bg-[#1a1a1a] text-white"
          >
            Start Assessment
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants}
    >
      <Card className="bg-[#111111] border-[#222222] h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <TimeframeSelector 
              title="AI Visibility Score" 
              timeframe={timeframe} 
              onTimeframeChange={setTimeframe}
              titleColor="text-white"
              selectorColor="text-[#A7A7A7]"
            />
            <div className="flex items-center space-x-2">
              {hasMaxAccess && (
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                  <Sparkles className="h-3 w-3 mr-1" />
                  MAX
                </Badge>
              )}
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-[#1a1a1a]"
              >
                <RefreshCw className={`h-4 w-4 text-[#666] ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Main Score Display */}
          <motion.div 
            variants={scoreVariants}
            className="text-center space-y-2"
          >
            <div className="flex items-center justify-center space-x-4">
              {/* Combined/Main Score */}
              <div className="text-center">
                <div className="text-4xl font-bold text-white">
                  {visibilityData.combined_score.toFixed(1)}
                </div>
                <div className="text-[#666] text-xs font-medium uppercase tracking-wider">
                  {hasMaxAccess ? 'Combined Score' : 'Visibility Score'}
                </div>
              </div>

              {/* Lite vs MAX Comparison */}
              {hasMaxAccess && visibilityData.lite_score && visibilityData.max_score && (
                <div className="flex space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-[#888]">
                      {visibilityData.lite_score.toFixed(1)}
                    </div>
                    <div className="text-[#666] text-xs font-medium uppercase tracking-wider">
                      Lite
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-yellow-500">
                      {visibilityData.max_score.toFixed(1)}
                    </div>
                    <div className="text-yellow-500 text-xs font-medium uppercase tracking-wider">
                      MAX
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Trend Indicator */}
            <div className="flex items-center justify-center space-x-2">
              {visibilityData.trend.direction === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : visibilityData.trend.direction === 'down' ? (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ) : (
                <div className="h-4 w-4 rounded-full bg-[#666]" />
              )}
              <span className={`text-sm font-medium ${
                visibilityData.trend.direction === 'up' ? 'text-green-500' : 
                visibilityData.trend.direction === 'down' ? 'text-red-500' : 
                'text-[#666]'
              }`}>
                {visibilityData.trend.direction === 'stable' ? 'No change' : 
                 `${visibilityData.trend.change_percentage > 0 ? '+' : ''}${visibilityData.trend.change_percentage.toFixed(1)}%`}
              </span>
              <span className="text-[#666] text-sm">
                vs {visibilityData.trend.timeframe}
              </span>
            </div>

            {/* Confidence Score */}
            <div className="flex items-center justify-center space-x-2">
              <div className="w-24 h-1 bg-[#333] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-500 to-green-500 transition-all duration-500"
                  style={{ width: `${visibilityData.score_confidence * 100}%` }}
                />
              </div>
              <span className="text-[#666] text-xs">
                {(visibilityData.score_confidence * 100).toFixed(0)}% confidence
              </span>
            </div>
          </motion.div>

          {/* Data Source & Schedule Info */}
          <div className="border-t border-[#222] pt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  visibilityData.data_source === 'max_only' ? 'bg-yellow-500' :
                  visibilityData.data_source === 'max_with_lite_fallback' ? 'bg-green-500' :
                  'bg-blue-500'
                }`} />
                <span className="text-[#666]">
                  {visibilityData.data_source === 'max_only' ? 'MAX Analysis' :
                   visibilityData.data_source === 'max_with_lite_fallback' ? 'MAX + Lite Data' :
                   'Lite Analysis'}
                </span>
              </div>
              <span className="text-[#666]">
                Updated {new Date(visibilityData.last_updated).toLocaleTimeString()}
              </span>
            </div>

            {visibilityData.next_scan_estimated && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#666]">Next scan</span>
                <span className="text-[#888]">
                  {new Date(visibilityData.next_scan_estimated).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Upgrade Prompt for Lite Users */}
          {!hasMaxAccess && upgradeInsights && (
            <div className="border border-yellow-500/20 bg-yellow-500/5 rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-yellow-500 font-medium text-sm">Unlock MAX Insights</span>
              </div>
              
              <p className="text-[#ccc] text-sm">
                {upgradeInsights.upgrade_value_proposition}
              </p>

              <div className="space-y-2">
                {upgradeInsights.potential_improvements.slice(0, 2).map((improvement, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-[#888]">{improvement.metric}</span>
                    <span className="text-yellow-500 font-medium">
                      +{improvement.improvement_percentage}%
                    </span>
                  </div>
                ))}
              </div>

              <Button 
                size="sm" 
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
              >
                Upgrade to MAX
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 border-[#333] bg-transparent hover:bg-[#1a1a1a] text-white"
            >
              View Details
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            {isPro && (
              <Button 
                size="sm" 
                className="bg-[#222] hover:bg-[#333] text-white border-[#333]"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-1" />
                    Scan Now
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion, useReducedMotion, AnimatePresence } from "framer-motion"
import { Sparkles, Zap, Target, Brain, TrendingUp, ArrowUpRight, ChevronRight, Lock, Unlock, Star, Lightbulb, Rocket, Trophy, AlertTriangle } from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

interface MaxInsight {
  id: string
  type: 'trend' | 'opportunity' | 'competitive' | 'recommendation' | 'alert'
  title: string
  description: string
  impact_level: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  action_required: boolean
  quick_action?: string
  data_sources: string[]
  created_at: string
}

interface UpgradeFeature {
  feature_name: string
  description: string
  value_prop: string
  lite_limitation: string
  max_capability: string
  icon: string
}

interface MaxInsightsData {
  current_plan: 'lite' | 'max'
  insights: MaxInsight[]
  upgrade_features: UpgradeFeature[]
  usage_stats: {
    insights_generated: number
    data_sources_analyzed: number
    competitive_alerts: number
    trend_predictions: number
  }
  upgrade_value: {
    potential_score_improvement: number
    additional_insights_per_month: number
    competitive_advantage_gain: number
    roi_estimate: string
  }
}

export function MaxInsightsCard() {
  const { user } = useAuth()
  const { subscription } = useSubscription()
  const shouldReduceMotion = useReducedMotion()
  const supabase = createClient()

  const [insightsData, setInsightsData] = useState<MaxInsightsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null)
  const [showUpgradeDetails, setShowUpgradeDetails] = useState(false)

  const hasMaxAccess = subscription?.plan === 'plus' || subscription?.plan === 'pro'

  // Mock MAX insights data
  const mockInsightsData: MaxInsightsData = {
    current_plan: hasMaxAccess ? 'max' : 'lite',
    insights: hasMaxAccess ? [
      {
        id: '1',
        type: 'opportunity',
        title: 'High-value keyword gap identified',
        description: 'You\'re missing mentions in 73% of "AI sales automation" conversations, while competitors dominate this $2.4B market segment.',
        impact_level: 'high',
        confidence: 0.89,
        action_required: true,
        quick_action: 'Create content targeting "AI sales automation" keywords',
        data_sources: ['Reddit', 'LinkedIn', 'Industry Forums', 'Product Hunt'],
        created_at: '2025-01-20T10:30:00Z'
      },
      {
        id: '2',
        type: 'competitive',
        title: 'Competitor vulnerability detected',
        description: 'HubSpot showing negative sentiment trend (-12%) in startup discussions. Opportunity to position as the startup-friendly alternative.',
        impact_level: 'medium',
        confidence: 0.76,
        action_required: true,
        quick_action: 'Launch startup-focused comparison content',
        data_sources: ['Twitter', 'Reddit', 'Y Combinator', 'Indie Hackers'],
        created_at: '2025-01-19T15:45:00Z'
      },
      {
        id: '3',
        type: 'trend',
        title: 'Emerging market trend spotted',
        description: 'AI SDR discussions increased 340% in the last 30 days. Early positioning opportunity before market saturation.',
        impact_level: 'critical',
        confidence: 0.92,
        action_required: false,
        data_sources: ['Google Trends', 'Social Media', 'Industry Reports'],
        created_at: '2025-01-18T09:15:00Z'
      }
    ] : [],
    upgrade_features: [
      {
        feature_name: 'AI-Powered Insights',
        description: 'Advanced pattern recognition and predictive analysis',
        value_prop: 'Predict market trends 30-60 days before competitors',
        lite_limitation: 'Basic mentions tracking only',
        max_capability: 'Predictive trend analysis with 90%+ accuracy',
        icon: 'brain'
      },
      {
        feature_name: 'Competitive Intelligence',
        description: 'Real-time competitor monitoring and gap analysis',
        value_prop: 'Identify competitor vulnerabilities and market opportunities',
        lite_limitation: 'Limited competitor data',
        max_capability: 'Comprehensive competitor analysis across 50+ sources',
        icon: 'target'
      },
      {
        feature_name: 'Conversation Context',
        description: 'Deep dive into actual conversations and sentiment',
        value_prop: 'Understand the why behind your visibility scores',
        lite_limitation: 'Surface-level mention counting',
        max_capability: 'Full conversation context and sentiment analysis',
        icon: 'sparkles'
      }
    ],
    usage_stats: {
      insights_generated: hasMaxAccess ? 127 : 0,
      data_sources_analyzed: hasMaxAccess ? 43 : 8,
      competitive_alerts: hasMaxAccess ? 23 : 0,
      trend_predictions: hasMaxAccess ? 8 : 0
    },
    upgrade_value: {
      potential_score_improvement: 23.7,
      additional_insights_per_month: 45,
      competitive_advantage_gain: 67,
      roi_estimate: '340%'
    }
  }

  // Load insights data
  useEffect(() => {
    const loadInsightsData = async () => {
      setIsLoading(true)

      try {
        if (!user) {
          setInsightsData(null)
          return
        }

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800))
        
        // For now, use mock data
        // TODO: Replace with actual API call
        setInsightsData(mockInsightsData)

      } catch (err) {
        console.error('Failed to load insights data:', err)
        setInsightsData(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadInsightsData()
  }, [user, hasMaxAccess])

  // Animation variants
  const cardVariants = shouldReduceMotion ? {
    hidden: { opacity: 1 },
    visible: { opacity: 1 }
  } : {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: [0.42, 0, 0.58, 1] }
    }
  }

  const insightVariants = shouldReduceMotion ? {
    hidden: { opacity: 1 },
    visible: { opacity: 1 }
  } : {
    hidden: { opacity: 0, x: -10 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.3 }
    }
  }

  if (isLoading) {
    return (
      <motion.div
        key="loading-state"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        <Card className="bg-[#111111] border-[#222222] h-full">
          <CardContent className="flex items-center justify-center h-full">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 animate-pulse text-yellow-500" />
              <span className="text-[#666] text-sm">Loading MAX insights...</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (!insightsData) {
    return (
      <motion.div
        key="error-state"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        <Card className="bg-[#111111] border-[#222222] h-full">
          <CardContent className="flex flex-col items-center justify-center h-full space-y-4">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <div className="text-center">
              <p className="text-white font-medium">MAX Insights</p>
              <p className="text-[#666] text-sm mt-1">Unable to load insights data</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const getInsightIcon = (type: MaxInsight['type']) => {
    switch (type) {
      case 'opportunity': return Target
      case 'competitive': return Trophy
      case 'trend': return TrendingUp
      case 'recommendation': return Lightbulb
      case 'alert': return AlertTriangle
      default: return Sparkles
    }
  }

  const getImpactColor = (level: MaxInsight['impact_level']) => {
    switch (level) {
      case 'critical': return 'text-red-400 border-red-500/20 bg-red-500/5'
      case 'high': return 'text-orange-400 border-orange-500/20 bg-orange-500/5'
      case 'medium': return 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5'
      case 'low': return 'text-green-400 border-green-500/20 bg-green-500/5'
    }
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
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
              className="flex items-center space-x-2"
            >
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <h2 className="text-white font-semibold">MAX Insights</h2>
              {hasMaxAccess && (
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                  ACTIVE
                </Badge>
              )}
            </motion.div>
            {!hasMaxAccess && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
              >
                <Button
                  size="sm"
                  onClick={() => setShowUpgradeDetails(!showUpgradeDetails)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
                >
                  <Unlock className="h-3 w-3 mr-1" />
                  Unlock
                </Button>
              </motion.div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* MAX Users: Show Insights */}
          {hasMaxAccess && insightsData.insights.length > 0 && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
              }}
              className="space-y-3"
            >
              <h3 className="text-white font-semibold text-sm">Recent Insights</h3>
              <div className="space-y-2">
                {insightsData.insights.slice(0, 3).map((insight, index) => {
                  const IconComponent = getInsightIcon(insight.type)
                  return (
                    <motion.div 
                      key={insight.id}
                      variants={insightVariants}
                      custom={index}
                      className={`border rounded-lg p-3 transition-all cursor-pointer ${
                        expandedInsight === insight.id 
                          ? 'border-yellow-500/50 bg-yellow-500/5' 
                          : 'border-[#222] hover:border-[#333] bg-[#0a0a0a]'
                      }`}
                      onClick={() => setExpandedInsight(expandedInsight === insight.id ? null : insight.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <IconComponent className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center space-x-2 flex-wrap">
                              <h4 className="text-white font-medium text-sm">{insight.title}</h4>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getImpactColor(insight.impact_level)}`}
                              >
                                {insight.impact_level.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-[#ccc] text-sm">{insight.description}</p>
                            
                            <AnimatePresence>
                              {expandedInsight === insight.id && (
                                <motion.div 
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2, ease: [0.42, 0, 0.58, 1] }}
                                  className="space-y-2 pt-2 border-t border-[#333]"
                                >
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-[#666]">Confidence</span>
                                    <span className="text-green-400 font-medium">
                                      {(insight.confidence * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-[#666]">Sources</span>
                                    <span className="text-[#888]">{insight.data_sources.length} sources</span>
                                  </div>
                                  {insight.quick_action && (
                                    <div className="mt-2">
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        className="w-full border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/10"
                                      >
                                        <Zap className="h-3 w-3 mr-1" />
                                        {insight.quick_action}
                                      </Button>
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                        <ChevronRight className={`h-4 w-4 text-[#666] transition-transform ${ (expandedInsight === insight.id ? 'rotate-90' : '' ) }`} />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* MAX Users: Usage Stats */}
          {hasMaxAccess && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4, ease: [0.42, 0, 0.58, 1] }}
              className="space-y-3"
            >
              <h3 className="text-white font-semibold text-sm">MAX Impact</h3>
              <div className="grid grid-cols-2 gap-3">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
                  className="bg-[#0a0a0a] border border-[#222] rounded-lg p-3 text-center"
                >
                  <div className="text-xl font-bold text-yellow-500">
                    {insightsData.usage_stats.insights_generated}
                  </div>
                  <div className="text-[#666] text-xs">Insights Generated</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
                  className="bg-[#0a0a0a] border border-[#222] rounded-lg p-3 text-center"
                >
                  <div className="text-xl font-bold text-blue-400">
                    {insightsData.usage_stats.data_sources_analyzed}
                  </div>
                  <div className="text-[#666] text-xs">Data Sources</div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Lite Users: Upgrade Promotion */}
          {!hasMaxAccess && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4, ease: [0.42, 0, 0.58, 1] }}
              className="space-y-4"
            >
              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Rocket className="h-5 w-5 text-yellow-500" />
                  <h3 className="text-yellow-500 font-semibold">Unlock MAX Intelligence</h3>
                </div>
                
                <p className="text-[#ccc] text-sm">
                  Get AI-powered insights that predict market trends and identify competitive opportunities before your competitors do.
                </p>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#888]">Potential Score Improvement</span>
                    <span className="text-green-400 font-bold">
                      +{insightsData.upgrade_value.potential_score_improvement}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#888]">Additional Insights/Month</span>
                    <span className="text-yellow-400 font-bold">
                      +{insightsData.upgrade_value.additional_insights_per_month}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#888]">Estimated ROI</span>
                    <span className="text-green-400 font-bold">
                      {insightsData.upgrade_value.roi_estimate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Feature Highlights */}
              <AnimatePresence>
                {showUpgradeDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
                    className="space-y-3"
                  >
                    <h4 className="text-white font-semibold text-sm">What You'll Get</h4>
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
                      }}
                      className="space-y-2"
                    >
                      {insightsData.upgrade_features.map((feature, index) => (
                        <motion.div 
                          key={feature.feature_name}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.2, ease: [0.42, 0, 0.58, 1] }}
                          className="bg-[#0a0a0a] border border-[#222] rounded-lg p-3"
                        >
                          <div className="flex items-center space-x-2 mb-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="text-white font-medium text-sm">{feature.feature_name}</span>
                          </div>
                          <p className="text-[#ccc] text-xs mb-2">{feature.description}</p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#666]">Current:</span>
                            <span className="text-red-400">{feature.lite_limitation}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#666]">With MAX:</span>
                            <span className="text-green-400">{feature.max_capability}</span>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (insightsData.upgrade_features.length * 0.05) + 0.5, duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
              >
                <Button 
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
                >
                  Upgrade to MAX
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* MAX Users: No Insights State */}
          {hasMaxAccess && insightsData.insights.length === 0 && (
            <motion.div
              key="no-insights-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="text-center space-y-3 py-6"
            >
              <Brain className="h-12 w-12 text-[#666] mx-auto" />
              <div>
                <p className="text-white font-medium">AI Analysis in Progress</p>
                <p className="text-[#666] text-sm mt-1">
                  Your first MAX insights will appear within 24 hours
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="border-[#333] bg-transparent hover:bg-[#1a1a1a] text-white"
              >
                View Analysis Status
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
} 
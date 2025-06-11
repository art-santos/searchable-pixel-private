'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TimeframeSelector, TimeframeOption } from "@/components/custom/timeframe-selector"
import { motion, useReducedMotion, AnimatePresence } from "framer-motion"
import { Trophy, TrendingUp, TrendingDown, Target, AlertTriangle, Sparkles, ChevronDown, ExternalLink, ArrowUpRight, RefreshCw } from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface CompetitorData {
  id: string
  name: string
  domain: string
  logo_url?: string
  current_rank: number
  previous_rank: number
  visibility_score: number
  mention_rate: number
  sentiment_score: number
  ai_coverage_score: number
  market_share_estimate: number
  is_user_company: boolean
}

interface CompetitiveGap {
  gap_type: 'visibility' | 'content' | 'sentiment' | 'coverage'
  gap_title: string
  impact_level: 'low' | 'medium' | 'high' | 'critical'
  opportunity_score: number
  quick_action?: string
}

interface MarketPosition {
  category: string
  user_rank: number
  total_competitors: number
  percentile: number
  market_leader: CompetitorData
  closest_competitor: CompetitorData
  improvement_potential: number
}

interface CompetitiveIntelligence {
  market_position: MarketPosition
  top_competitors: CompetitorData[]
  competitive_gaps: CompetitiveGap[]
  trend_analysis: {
    gaining_ground: CompetitorData[]
    losing_ground: CompetitorData[]
    stable_performers: CompetitorData[]
  }
  opportunity_insights: {
    quick_wins: string[]
    strategic_moves: string[]
    market_threats: string[]
  }
  last_updated: string
}

const competitiveCategories = [
  'AI Sales Tools',
  'Sales Automation',
  'Lead Generation',
  'CRM Platforms',
  'Cold Outreach'
]

export function EnhancedCompetitiveIntelligenceCard() {
  const { user } = useAuth()
  const { subscription } = useSubscription()
  const shouldReduceMotion = useReducedMotion()
  const supabase = createClient()

  const [timeframe, setTimeframe] = useState<TimeframeOption>('Last 30 days')
  const [selectedCategory, setSelectedCategory] = useState(competitiveCategories[0])
  const [competitiveData, setCompetitiveData] = useState<CompetitiveIntelligence | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showGaps, setShowGaps] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasMaxAccess = subscription?.plan === 'plus' || subscription?.plan === 'pro'

  // Mock competitive data
  const mockCompetitiveData: CompetitiveIntelligence = {
    market_position: {
      category: selectedCategory,
      user_rank: 8,
      total_competitors: 24,
      percentile: 67,
      market_leader: {
        id: 'salesforce',
        name: 'Salesforce',
        domain: 'salesforce.com',
        current_rank: 1,
        previous_rank: 1,
        visibility_score: 94.2,
        mention_rate: 0.85,
        sentiment_score: 0.78,
        ai_coverage_score: 0.92,
        market_share_estimate: 0.31,
        is_user_company: false
      },
      closest_competitor: {
        id: 'hubspot',
        name: 'HubSpot',
        domain: 'hubspot.com',
        current_rank: 7,
        previous_rank: 8,
        visibility_score: 74.8,
        mention_rate: 0.68,
        sentiment_score: 0.72,
        ai_coverage_score: 0.71,
        market_share_estimate: 0.15,
        is_user_company: false
      },
      improvement_potential: 23.4
    },
    top_competitors: [
      {
        id: 'salesforce',
        name: 'Salesforce',
        domain: 'salesforce.com',
        current_rank: 1,
        previous_rank: 1,
        visibility_score: 94.2,
        mention_rate: 0.85,
        sentiment_score: 0.78,
        ai_coverage_score: 0.92,
        market_share_estimate: 0.31,
        is_user_company: false
      },
      {
        id: 'hubspot',
        name: 'HubSpot',
        domain: 'hubspot.com',
        current_rank: 2,
        previous_rank: 3,
        visibility_score: 87.6,
        mention_rate: 0.78,
        sentiment_score: 0.82,
        ai_coverage_score: 0.75,
        market_share_estimate: 0.22,
        is_user_company: false
      },
      {
        id: 'gong',
        name: 'Gong',
        domain: 'gong.io',
        current_rank: 3,
        previous_rank: 2,
        visibility_score: 82.1,
        mention_rate: 0.71,
        sentiment_score: 0.76,
        ai_coverage_score: 0.68,
        market_share_estimate: 0.18,
        is_user_company: false
      },
      {
        id: 'user-company',
        name: 'Your Company',
        domain: 'your-domain.com',
        current_rank: 8,
        previous_rank: 9,
        visibility_score: 73.2,
        mention_rate: 0.52,
        sentiment_score: 0.69,
        ai_coverage_score: 0.58,
        market_share_estimate: 0.08,
        is_user_company: true
      }
    ],
    competitive_gaps: [
      {
        gap_type: 'visibility',
        gap_title: 'AI conversation coverage gap vs Salesforce',
        impact_level: 'high',
        opportunity_score: 0.87,
        quick_action: 'Increase content frequency targeting AI sales tools'
      },
      {
        gap_type: 'sentiment',
        gap_title: 'Brand sentiment lagging HubSpot',
        impact_level: 'medium',
        opportunity_score: 0.65,
        quick_action: 'Improve customer success story visibility'
      },
      {
        gap_type: 'coverage',
        gap_title: 'Missing from 40% of relevant AI discussions',
        impact_level: 'critical',
        opportunity_score: 0.92,
        quick_action: 'Expand thought leadership content'
      }
    ],
    trend_analysis: {
      gaining_ground: [
        {
          id: 'apollo',
          name: 'Apollo',
          domain: 'apollo.io',
          current_rank: 4,
          previous_rank: 6,
          visibility_score: 79.4,
          mention_rate: 0.64,
          sentiment_score: 0.73,
          ai_coverage_score: 0.61,
          market_share_estimate: 0.12,
          is_user_company: false
        }
      ],
      losing_ground: [
        {
          id: 'outreach',
          name: 'Outreach',
          domain: 'outreach.io',
          current_rank: 6,
          previous_rank: 4,
          visibility_score: 76.8,
          mention_rate: 0.59,
          sentiment_score: 0.67,
          ai_coverage_score: 0.55,
          market_share_estimate: 0.10,
          is_user_company: false
        }
      ],
      stable_performers: []
    },
    opportunity_insights: {
      quick_wins: [
        'Target "AI sales automation" keywords where you rank #12',
        'Improve presence in G2 and Capterra conversations',
        'Leverage customer success stories in AI discussions'
      ],
      strategic_moves: [
        'Partner with AI influencers for thought leadership',
        'Develop comparative content vs top 3 competitors',
        'Build authority in emerging AI sales topics'
      ],
      market_threats: [
        'Apollo gaining market share rapidly (+15% mentions)',
        'New AI-first competitors entering space',
        'Salesforce expanding AI capabilities'
      ]
    },
    last_updated: new Date().toISOString()
  }

  // Load competitive intelligence data
  useEffect(() => {
    const loadCompetitiveData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        if (!user) {
          setCompetitiveData(null)
          return
        }

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1200))
        
        // For now, use mock data
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/max-visibility/data?company_id=${user.id}&request_type=competitive_analysis`)
        
        setCompetitiveData(mockCompetitiveData)

      } catch (err) {
        console.error('Failed to load competitive data:', err)
        setError('Failed to load competitive intelligence')
        setCompetitiveData(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadCompetitiveData()
  }, [user, selectedCategory])

  // Handle manual refresh
  const handleRefresh = async () => {
    if (!user) return

    setIsRefreshing(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      setCompetitiveData({ ...mockCompetitiveData, last_updated: new Date().toISOString() })
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

  const itemVariants = shouldReduceMotion ? {
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
      <Card className="bg-[#111111] border-[#222222] h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin text-[#666]" />
            <span className="text-[#666] text-sm">Loading competitive intelligence...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !competitiveData) {
    return (
      <Card className="bg-[#111111] border-[#222222] h-full">
        <CardContent className="flex flex-col items-center justify-center h-full space-y-4">
          <AlertTriangle className="h-8 w-8 text-yellow-500" />
          <div className="text-center">
            <p className="text-white font-medium">
              {hasMaxAccess ? 'Competitive data unavailable' : 'Competitive Intelligence'}
            </p>
            <p className="text-[#666] text-sm mt-1">
              {hasMaxAccess 
                ? (error || 'Unable to load competitive analysis')
                : 'Upgrade to MAX for comprehensive competitive insights'
              }
            </p>
          </div>
          {hasMaxAccess ? (
            <Button 
              onClick={handleRefresh}
              variant="outline"
              className="border-[#333] bg-transparent hover:bg-[#1a1a1a] text-white"
            >
              Retry
            </Button>
          ) : (
            <Button 
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
            >
              Upgrade to MAX
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  const userCompany = competitiveData.top_competitors.find(c => c.is_user_company)
  const topCompetitors = competitiveData.top_competitors.filter(c => !c.is_user_company).slice(0, 3)

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
              title="Competitive Intelligence" 
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

          {/* Category Selector */}
          <div className="mt-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-fit min-w-[160px] border border-gray-300 dark:border-[#333] bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-[#1a1a1a] text-black dark:text-white"
                >
                  <span className="font-medium">{selectedCategory}</span>
                  <ChevronDown className="h-4 w-4 ml-2 text-gray-500 dark:text-[#666]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-black dark:text-white">
                {competitiveCategories.map((category) => (
                  <DropdownMenuItem
                    key={category}
                    className="hover:bg-gray-100 dark:hover:bg-[#222]"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Market Position Summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm">Market Position</h3>
              <div className="flex items-center space-x-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-white font-bold">#{competitiveData.market_position.user_rank}</span>
                <span className="text-[#666] text-sm">of {competitiveData.market_position.total_competitors}</span>
              </div>
            </div>
            
            <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#888]">Market Percentile</span>
                <span className="text-white font-medium">{competitiveData.market_position.percentile}th</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#888]">Improvement Potential</span>
                <span className="text-green-400 font-medium">+{competitiveData.market_position.improvement_potential.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Top Competitors */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm">Top Competitors</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowGaps(!showGaps)}
                className="text-[#666] hover:text-white hover:bg-[#1a1a1a] h-6 px-2 text-xs"
              >
                {showGaps ? 'Hide Gaps' : 'Show Gaps'}
              </Button>
            </div>

            <div className="space-y-2">
              {/* User Company */}
              {userCompany && (
                <motion.div 
                  variants={itemVariants}
                  className="bg-[#0a0a0a] border border-yellow-500/20 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-yellow-500 font-bold text-sm">#{userCompany.current_rank}</span>
                        {userCompany.current_rank < userCompany.previous_rank ? (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        ) : userCompany.current_rank > userCompany.previous_rank ? (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        ) : null}
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">{userCompany.name}</div>
                        <div className="text-[#666] text-xs">{userCompany.domain}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold text-sm">{userCompany.visibility_score.toFixed(1)}</div>
                      <div className="text-[#666] text-xs">Visibility Score</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Top 3 Competitors */}
              {topCompetitors.map((competitor, index) => (
                <motion.div 
                  key={competitor.id}
                  variants={itemVariants}
                  custom={index}
                  className="bg-[#0a0a0a] border border-[#222] rounded-lg p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-[#888] font-bold text-sm">#{competitor.current_rank}</span>
                        {competitor.current_rank < competitor.previous_rank ? (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        ) : competitor.current_rank > competitor.previous_rank ? (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        ) : null}
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">{competitor.name}</div>
                        <div className="text-[#666] text-xs">{competitor.domain}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold text-sm">{competitor.visibility_score.toFixed(1)}</div>
                      <div className="text-[#666] text-xs">
                        {userCompany && (
                          <span className="text-red-400">
                            +{(competitor.visibility_score - userCompany.visibility_score).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Competitive Gaps */}
          <AnimatePresence>
            {showGaps && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <h3 className="text-white font-semibold text-sm">Critical Gaps</h3>
                <div className="space-y-2">
                  {competitiveData.competitive_gaps.slice(0, 3).map((gap, index) => (
                    <div 
                      key={index}
                      className="bg-[#0a0a0a] border border-[#222] rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            gap.impact_level === 'critical' ? 'border-red-500 text-red-400' :
                            gap.impact_level === 'high' ? 'border-orange-500 text-orange-400' :
                            gap.impact_level === 'medium' ? 'border-yellow-500 text-yellow-400' :
                            'border-green-500 text-green-400'
                          }`}
                        >
                          {gap.impact_level.toUpperCase()}
                        </Badge>
                        <div className="text-[#666] text-xs">
                          {(gap.opportunity_score * 100).toFixed(0)}% opportunity
                        </div>
                      </div>
                      <div className="text-white text-sm">{gap.gap_title}</div>
                      {gap.quick_action && (
                        <div className="text-[#888] text-xs">
                          💡 {gap.quick_action}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Insights */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold text-sm">Key Insights</h3>
            <div className="space-y-2">
              {competitiveData.opportunity_insights.quick_wins.slice(0, 2).map((insight, index) => (
                <div key={index} className="flex items-start space-x-2 text-sm">
                  <Target className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-[#ccc]">{insight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full border-[#333] bg-transparent hover:bg-[#1a1a1a] text-white"
          >
            View Full Analysis
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
} 
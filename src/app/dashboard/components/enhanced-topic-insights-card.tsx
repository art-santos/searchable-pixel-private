'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TimeframeSelector, TimeframeOption } from "@/components/custom/timeframe-selector"
import { motion, useReducedMotion, AnimatePresence } from "framer-motion"
import { MessageCircle, TrendingUp, TrendingDown, Heart, AlertCircle, Sparkles, ChevronDown, ExternalLink, ArrowUpRight, RefreshCw, Eye, ThumbsUp, MessageSquare } from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface TopicMetrics {
  topic_id: string
  topic_name: string
  mention_count: number
  mention_trend: 'up' | 'down' | 'stable'
  sentiment_score: number
  visibility_score: number
  conversation_volume: number
  ai_coverage_percentage: number
  competitor_mentions: number
  opportunity_score: number
}

interface ConversationContext {
  context_id: string
  conversation_type: 'question' | 'comparison' | 'recommendation' | 'discussion'
  snippet: string
  source: string
  sentiment: 'positive' | 'neutral' | 'negative'
  mention_quality: 'direct' | 'indirect' | 'competitive'
  engagement_score: number
  date: string
}

interface TopicInsights {
  timeframe: string
  top_topics: TopicMetrics[]
  conversation_contexts: ConversationContext[]
  sentiment_analysis: {
    overall_sentiment: number
    positive_percentage: number
    neutral_percentage: number
    negative_percentage: number
    sentiment_trend: 'improving' | 'declining' | 'stable'
  }
  ai_coverage_insights: {
    total_conversations: number
    company_mentioned: number
    coverage_percentage: number
    missed_opportunities: number
  }
  competitive_context: {
    head_to_head_mentions: number
    competitive_advantage_topics: string[]
    vulnerability_topics: string[]
  }
  last_updated: string
}

const topicCategories = [
  'All Topics',
  'AI Sales Tools',
  'Sales Automation',
  'Lead Generation',
  'CRM Integration',
  'Cold Outreach'
]

export function EnhancedTopicInsightsCard() {
  const { user } = useAuth()
  const { subscription } = useSubscription()
  const shouldReduceMotion = useReducedMotion()
  const supabase = createClient()

  const [timeframe, setTimeframe] = useState<TimeframeOption>('Last 30 days')
  const [selectedCategory, setSelectedCategory] = useState(topicCategories[0])
  const [topicData, setTopicData] = useState<TopicInsights | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showContexts, setShowContexts] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hasMaxAccess = subscription?.plan === 'plus' || subscription?.plan === 'pro'

  // Mock topic insights data
  const mockTopicData: TopicInsights = {
    timeframe: timeframe,
    top_topics: [
      {
        topic_id: 'ai-sales-tools',
        topic_name: 'AI Sales Tools',
        mention_count: 342,
        mention_trend: 'up',
        sentiment_score: 0.74,
        visibility_score: 0.68,
        conversation_volume: 1250,
        ai_coverage_percentage: 68,
        competitor_mentions: 89,
        opportunity_score: 0.84
      },
      {
        topic_id: 'cold-outreach',
        topic_name: 'Cold Outreach',
        mention_count: 198,
        mention_trend: 'up',
        sentiment_score: 0.71,
        visibility_score: 0.72,
        conversation_volume: 890,
        ai_coverage_percentage: 72,
        competitor_mentions: 45,
        opportunity_score: 0.76
      },
      {
        topic_id: 'lead-generation',
        topic_name: 'Lead Generation',
        mention_count: 156,
        mention_trend: 'stable',
        sentiment_score: 0.69,
        visibility_score: 0.65,
        conversation_volume: 720,
        ai_coverage_percentage: 65,
        competitor_mentions: 67,
        opportunity_score: 0.71
      },
      {
        topic_id: 'sales-automation',
        topic_name: 'Sales Automation',
        mention_count: 89,
        mention_trend: 'down',
        sentiment_score: 0.66,
        visibility_score: 0.58,
        conversation_volume: 560,
        ai_coverage_percentage: 58,
        competitor_mentions: 78,
        opportunity_score: 0.63
      }
    ],
    conversation_contexts: [
      {
        context_id: '1',
        conversation_type: 'question',
        snippet: 'Looking for the best AI sales tool for startups. Any recommendations?',
        source: 'Reddit r/startups',
        sentiment: 'neutral',
        mention_quality: 'indirect',
        engagement_score: 0.82,
        date: '2025-01-20'
      },
      {
        context_id: '2',
        conversation_type: 'comparison',
        snippet: 'Comparing Salesforce vs HubSpot vs newer AI-powered sales tools...',
        source: 'TechCrunch Comments',
        sentiment: 'positive',
        mention_quality: 'direct',
        engagement_score: 0.75,
        date: '2025-01-19'
      },
      {
        context_id: '3',
        conversation_type: 'recommendation',
        snippet: 'Our team switched to an AI sales agent and saw 40% increase in qualified leads',
        source: 'LinkedIn Discussion',
        sentiment: 'positive',
        mention_quality: 'direct',
        engagement_score: 0.89,
        date: '2025-01-18'
      }
    ],
    sentiment_analysis: {
      overall_sentiment: 0.72,
      positive_percentage: 48,
      neutral_percentage: 35,
      negative_percentage: 17,
      sentiment_trend: 'improving'
    },
    ai_coverage_insights: {
      total_conversations: 2840,
      company_mentioned: 342,
      coverage_percentage: 12,
      missed_opportunities: 285
    },
    competitive_context: {
      head_to_head_mentions: 45,
      competitive_advantage_topics: ['AI Automation', 'Startup-Friendly'],
      vulnerability_topics: ['Enterprise Features', 'Integration Depth']
    },
    last_updated: new Date().toISOString()
  }

  // Load topic insights data
  useEffect(() => {
    const loadTopicData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        if (!user) {
          setTopicData(null)
          return
        }

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // For now, use mock data
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/max-visibility/data?company_id=${user.id}&request_type=visibility_data`)
        
        setTopicData(mockTopicData)

      } catch (err) {
        console.error('Failed to load topic data:', err)
        setError('Failed to load topic insights')
        setTopicData(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadTopicData()
  }, [user, selectedCategory, timeframe])

  // Handle manual refresh
  const handleRefresh = async () => {
    if (!user) return

    setIsRefreshing(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      setTopicData({ ...mockTopicData, last_updated: new Date().toISOString() })
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
            <span className="text-[#666] text-sm">Loading topic insights...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !topicData) {
    return (
      <Card className="bg-[#111111] border-[#222222] h-full">
        <CardContent className="flex flex-col items-center justify-center h-full space-y-4">
          <AlertCircle className="h-8 w-8 text-yellow-500" />
          <div className="text-center">
            <p className="text-white font-medium">
              {hasMaxAccess ? 'Topic data unavailable' : 'Topic Insights'}
            </p>
            <p className="text-[#666] text-sm mt-1">
              {hasMaxAccess 
                ? (error || 'Unable to load topic analysis')
                : 'Upgrade to MAX for detailed conversation insights'
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
              title="Topic Insights" 
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
                className="w-fit min-w-[120px] border border-gray-300 dark:border-[#333] bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-[#1a1a1a] text-black dark:text-white"
              >
                <span className="font-medium">{selectedCategory}</span>
                <ChevronDown className="h-4 w-4 ml-2 text-gray-500 dark:text-[#666]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-black dark:text-white">
              {topicCategories.map((category) => (
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
          {/* AI Coverage Overview */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold text-sm">AI Coverage Summary</h3>
            <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-3 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-blue-400" />
                  <span className="text-[#888] text-sm">Coverage Rate</span>
                </div>
                <div className="text-right">
                  <span className="text-white font-bold">{topicData.ai_coverage_insights.coverage_percentage}%</span>
                  <span className="text-[#666] text-xs ml-1">
                    ({topicData.ai_coverage_insights.company_mentioned}/{topicData.ai_coverage_insights.total_conversations})
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <ThumbsUp className="h-4 w-4 text-green-400" />
                  <span className="text-[#888] text-sm">Sentiment</span>
                </div>
                <div className="text-right">
                  <span className="text-green-400 font-bold">{(topicData.sentiment_analysis.overall_sentiment * 100).toFixed(0)}%</span>
                  <span className="text-[#666] text-xs ml-1">positive</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-yellow-400" />
                  <span className="text-[#888] text-sm">Missed Opportunities</span>
                </div>
                <span className="text-yellow-400 font-bold">{topicData.ai_coverage_insights.missed_opportunities}</span>
              </div>
            </div>
          </div>

          {/* Top Topics */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm">Top Topics</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowContexts(!showContexts)}
                className="text-[#666] hover:text-white hover:bg-[#1a1a1a] h-6 px-2 text-xs"
              >
                {showContexts ? 'Hide Context' : 'Show Context'}
              </Button>
            </div>

            <div className="space-y-2">
              {topicData.top_topics.slice(0, 4).map((topic, index) => (
                <motion.div 
                  key={topic.topic_id}
                  variants={itemVariants}
                  custom={index}
                  className={`bg-[#0a0a0a] border rounded-lg p-3 transition-colors cursor-pointer ${
                    selectedTopic === topic.topic_id 
                      ? 'border-yellow-500/50 bg-yellow-500/5' 
                      : 'border-[#222] hover:border-[#333]'
                  }`}
                  onClick={() => setSelectedTopic(selectedTopic === topic.topic_id ? null : topic.topic_id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium text-sm">{topic.topic_name}</span>
                      {topic.mention_trend === 'up' ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : topic.mention_trend === 'down' ? (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      ) : null}
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${
                        topic.opportunity_score > 0.8 ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        topic.opportunity_score > 0.6 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}
                    >
                      {(topic.opportunity_score * 100).toFixed(0)}% opp
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <div className="text-[#666]">Mentions</div>
                      <div className="text-white font-semibold">{topic.mention_count}</div>
                    </div>
                    <div>
                      <div className="text-[#666]">Visibility</div>
                      <div className="text-white font-semibold">{(topic.visibility_score * 100).toFixed(0)}%</div>
                    </div>
                    <div>
                      <div className="text-[#666]">Coverage</div>
                      <div className="text-white font-semibold">{topic.ai_coverage_percentage}%</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Conversation Contexts */}
          <AnimatePresence>
            {showContexts && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <h3 className="text-white font-semibold text-sm">Recent Conversations</h3>
                <div className="space-y-2">
                  {topicData.conversation_contexts.slice(0, 3).map((context, index) => (
                    <div 
                      key={context.context_id}
                      className="bg-[#0a0a0a] border border-[#222] rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant="outline" 
                            className="text-xs border-[#333] text-[#888]"
                          >
                            {context.conversation_type}
                          </Badge>
                          <span className="text-[#666] text-xs">{context.source}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            context.sentiment === 'positive' ? 'bg-green-500' :
                            context.sentiment === 'negative' ? 'bg-red-500' :
                            'bg-yellow-500'
                          }`} />
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              context.mention_quality === 'direct' ? 'border-green-500 text-green-400' :
                              context.mention_quality === 'indirect' ? 'border-yellow-500 text-yellow-400' :
                              'border-red-500 text-red-400'
                            }`}
                          >
                            {context.mention_quality}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-[#ccc] text-sm italic">"{context.snippet}"</p>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#666]">{new Date(context.date).toLocaleDateString()}</span>
                        <span className="text-[#888]">
                          Engagement: {(context.engagement_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Button */}
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full border-[#333] bg-transparent hover:bg-[#1a1a1a] text-white"
          >
            Explore Topic Map
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
} 
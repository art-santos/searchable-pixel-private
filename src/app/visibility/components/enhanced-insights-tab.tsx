'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, Target, Lightbulb, Sparkles, ArrowUpRight, Zap } from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'

interface EnhancedInsightsTabProps {
  hasVisibilityData: boolean
  isRefreshing: boolean
  onRefreshScore: () => void
  data?: any // Real visibility data from API
}

export function EnhancedInsightsTab({ hasVisibilityData, data }: EnhancedInsightsTabProps) {
  const { subscription } = useSubscription()
  const hasMaxAccess = subscription?.plan === 'plus' || subscription?.plan === 'pro'

  // Only render if we have data - empty state handled centrally
  if (!hasVisibilityData || !data) {
    return null
  }

  // Generate insights from real data
  const mentionRate = data.score?.mention_rate || 0
  const sentimentScore = data.score?.sentiment_score || 0
  const competitiveScore = data.score?.competitive_score || 0
  const overallScore = data.score?.overall_score || 0
  
  // Generate trends from real data
  const trendChange = data.score?.trend_change || 0
  const competitorCount = data.competitive?.total_competitors || 0
  const currentRank = data.competitive?.current_rank || 0
  
  const insights = {
    trends: [
      {
        id: 1,
        title: 'Visibility Score Trend',
        description: `Your visibility score ${trendChange >= 0 ? 'improved' : 'decreased'} by ${Math.abs(trendChange)}% recently`,
        trend: trendChange >= 0 ? 'up' : 'down',
        impact: Math.abs(trendChange) > 10 ? 'high' : Math.abs(trendChange) > 5 ? 'medium' : 'low',
        change: `${trendChange >= 0 ? '+' : ''}${trendChange}%`,
        period: data.score?.trend_period || '30 days'
      },
      {
        id: 2,
        title: 'Mention Rate Performance',
        description: `${Math.round(mentionRate * 100)}% of AI queries mention your brand`,
        trend: mentionRate > 0.5 ? 'up' : 'down',
        impact: mentionRate > 0.7 ? 'high' : mentionRate > 0.4 ? 'medium' : 'low',
        change: `${Math.round(mentionRate * 100)}%`,
        period: 'Current'
      },
      {
        id: 3,
        title: 'Competitive Position',
        description: `Ranking #${currentRank} among ${competitorCount} competitors`,
        trend: currentRank <= 3 ? 'up' : 'down',
        impact: currentRank <= 3 ? 'high' : currentRank <= 5 ? 'medium' : 'low',
        change: `#${currentRank}`,
        period: 'Current'
      }
    ],
    recommendations: data.topics?.slice(0, 3).map((topic: any, index: number) => ({
      id: index + 1,
      category: topic.category,
      title: `Improve ${topic.name} Content`,
      description: `${topic.mention_count === 0 ? 'Create new' : 'Enhance existing'} content for "${topic.name}" queries`,
      priority: topic.mention_count === 0 ? 'high' : 'medium',
      effort: topic.category === 'Comparison' ? 'high' : 'medium',
      impact: Math.round((1 - (topic.mention_percentage || 0) / 100) * 90),
      timeframe: topic.mention_count === 0 ? '2-3 weeks' : '1-2 weeks'
    })) || [],
    quickWins: [
      {
        id: 1,
        title: 'Optimize Meta Tags',
        description: 'Update meta descriptions with trending keywords',
        effort: 20,
        impact: Math.round(60 + (1 - mentionRate) * 20),
        timeframe: '1-2 days'
      },
      {
        id: 2,
        title: 'Add FAQ Section',
        description: 'Quick content for common AI platform queries',
        effort: 30,
        impact: Math.round(70 + (1 - mentionRate) * 15),
        timeframe: '3-4 days'
      },
      {
        id: 3,
        title: 'Competitor Comparison',
        description: 'Visual comparison chart with top competitors',
        effort: 40,
        impact: Math.round(75 + (1 - competitiveScore) * 15),
        timeframe: '1 week'
      }
    ]
  }

  return (
    <div className="space-y-6">
      {/* Trends Section */}
      <div className="bg-[#111] border border-[#333] rounded p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium">Trending Insights</h3>
          {hasMaxAccess && (
            <div className="flex items-center gap-1 px-2 py-1 bg-[#222] border border-[#444] rounded text-xs text-[#888]">
              <Sparkles className="w-3 h-3" />
              <span>AI-Powered</span>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          {insights.trends.map((trend) => (
            <div key={trend.id} className="bg-[#0a0a0a] border border-[#222] rounded p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {trend.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-white font-medium">{trend.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    trend.trend === 'up' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {trend.change}
                  </span>
                  <span className="text-[#666] text-xs">{trend.period}</span>
                </div>
              </div>
              <p className="text-[#ccc] text-sm">{trend.description}</p>
              <div className="mt-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  trend.impact === 'high' ? 'bg-white/10 text-white' :
                  trend.impact === 'medium' ? 'bg-[#333]/50 text-[#ccc]' :
                  'bg-[#333]/30 text-[#888]'
                }`}>
                  {trend.impact} impact
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations Section */}
      <div className="bg-[#111] border border-[#333] rounded p-6">
        <h3 className="text-white font-medium mb-4">Strategic Recommendations</h3>
        
        <div className="space-y-4">
          {insights.recommendations.map((rec) => (
            <div key={rec.id} className="bg-[#0a0a0a] border border-[#222] rounded p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#666]" />
                  <span className="text-white font-medium">{rec.title}</span>
                  <span className="px-2 py-1 bg-[#333] text-[#888] rounded text-xs">
                    {rec.category}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400 text-sm font-medium">
                    {rec.impact}%
                  </span>
                  <span className="text-[#666] text-xs">{rec.timeframe}</span>
                </div>
              </div>
              <p className="text-[#ccc] text-sm mb-3">{rec.description}</p>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  rec.priority === 'high' ? 'bg-white/10 text-white' :
                  rec.priority === 'medium' ? 'bg-[#333]/50 text-[#ccc]' :
                  'bg-[#333]/30 text-[#888]'
                }`}>
                  {rec.priority} priority
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  rec.effort === 'low' ? 'bg-[#333]/30 text-[#888]' :
                  rec.effort === 'medium' ? 'bg-[#333]/50 text-[#ccc]' :
                  'bg-white/10 text-white'
                }`}>
                  {rec.effort} effort
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Wins Section */}
      <div className="bg-[#111] border border-[#333] rounded p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium">Quick Wins</h3>
          <span className="text-[#666] text-sm">Low effort, high impact</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.quickWins.map((win) => (
            <div key={win.id} className="bg-[#0a0a0a] border border-[#222] rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-white font-medium text-sm">{win.title}</span>
              </div>
              <p className="text-[#ccc] text-sm mb-3 leading-relaxed">{win.description}</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#666]">Effort</span>
                  <span className="text-white">{win.effort}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#666]">Impact</span>
                  <span className="text-green-400">{win.impact}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#666]">Timeline</span>
                  <span className="text-[#888]">{win.timeframe}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Summary */}
      <div className="bg-[#111] border border-[#333] rounded p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-[#888] text-sm">{insights.trends.filter(t => t.trend === 'up').length} positive trends</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#666]" />
              <span className="text-[#888] text-sm">{insights.recommendations.filter(r => r.priority === 'high').length} high priority</span>
            </div>
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              <span className="text-[#888] text-sm">{insights.quickWins.length} quick wins</span>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded text-sm font-medium hover:bg-[#f5f5f5] transition-colors">
            <ArrowUpRight className="w-4 h-4" />
            View Full Report
          </button>
        </div>
      </div>
    </div>
  )
} 
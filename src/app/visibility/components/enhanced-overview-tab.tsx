'use client'

import { useState } from 'react'
import { motion } from "framer-motion"
import { Sparkles, TrendingUp, Users, Target } from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'

interface EnhancedOverviewTabProps {
  hasVisibilityData: boolean
  isRefreshing: boolean
  onRefreshScore: () => void
  data?: any // Real visibility data from API
}

export function EnhancedOverviewTab({ hasVisibilityData, data }: EnhancedOverviewTabProps) {
  const { subscription } = useSubscription()
  const hasMaxAccess = subscription?.plan === 'plus' || subscription?.plan === 'pro'

  // Only render if we have data - empty state handled centrally
  if (!hasVisibilityData || !data) {
    return null
  }

  // Use real data from props
  const overviewData = {
    directCitations: data.citations?.direct_count || 0,
    indirectCitations: data.citations?.indirect_count || 0,
    totalCitations: data.citations?.total_count || 0,
    sentimentScore: data.score?.sentiment_score || 0,
    coverageRate: Math.round((data.citations?.coverage_rate || 0) * 100),
    competitiveRank: data.competitive?.current_rank || 1,
    totalCompetitors: data.competitive?.total_competitors || 0,
    percentile: data.competitive?.percentile || 0,
    recentMentions: data.citations?.recent_mentions || []
  }

  return (
    <div className="space-y-6">
      {/* Citation Summary */}
      <div className="bg-[#111] border border-[#333] rounded p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-white font-medium">Citations</h4>
          {hasMaxAccess && (
            <div className="flex items-center gap-1 px-2 py-1 bg-[#222] border border-[#444] rounded text-xs text-[#888]">
              <Sparkles className="w-3 h-3" />
              <span>Enhanced</span>
            </div>
          )}
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[#888] text-sm">Direct</span>
            <span className="text-white font-medium">{overviewData.directCitations}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#888] text-sm">Indirect</span>
            <span className="text-white font-medium">{overviewData.indirectCitations}</span>
          </div>
          <div className="pt-3 border-t border-[#333]">
            <div className="flex items-center justify-between">
              <span className="text-[#888] text-sm">Total</span>
              <span className="text-white font-semibold">{overviewData.totalCitations}</span>
            </div>
          </div>
          
          {hasMaxAccess && (
            <div className="pt-3 border-t border-[#333] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#888] text-sm">Sentiment</span>
                <span className="text-green-400 text-sm font-medium">{(overviewData.sentimentScore * 100).toFixed(0)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#888] text-sm">Coverage</span>
                <span className="text-white text-sm font-medium">{overviewData.coverageRate}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Competitive Position */}
      <div className="bg-[#111] border border-[#333] rounded p-6">
        <h4 className="text-white font-medium mb-4">Competitive Position</h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#666]" />
              <span className="text-[#888] text-sm">Current Rank</span>
            </div>
            <span className="text-white font-semibold">#{overviewData.competitiveRank}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#666]" />
              <span className="text-[#888] text-sm">Total Competitors</span>
            </div>
            <span className="text-[#888] text-sm">{overviewData.totalCompetitors}</span>
          </div>
          
          {hasMaxAccess && (
            <div className="pt-3 border-t border-[#333]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-[#888] text-sm">Percentile</span>
                </div>
                <span className="text-green-400 text-sm font-medium">{overviewData.percentile}th</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Mentions */}
      <div className="bg-[#111] border border-[#333] rounded p-6">
        <h4 className="text-white font-medium mb-4">Recent Mentions</h4>
        
        <div className="space-y-3">
          {overviewData.recentMentions.map((mention) => (
            <div key={mention.id} className="bg-[#0a0a0a] border border-[#222] rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded text-xs font-medium border ${
                    mention.source === 'ChatGPT' ? 'border-green-500/20 text-green-400 bg-green-500/5' :
                    mention.source === 'Perplexity' ? 'border-purple-500/20 text-purple-400 bg-purple-500/5' :
                    'border-orange-500/20 text-orange-400 bg-orange-500/5'
                  }`}>
                    {mention.source}
                  </div>
                  <div className={`px-2 py-1 rounded text-xs border ${
                    mention.type === 'direct' 
                      ? 'border-white/20 text-white' 
                      : 'border-[#333] text-[#888]'
                  }`}>
                    {mention.type}
                  </div>
                  {hasMaxAccess && (
                    <div className={`w-2 h-2 rounded-full ${
                      mention.sentiment === 'positive' ? 'bg-green-500' :
                      mention.sentiment === 'neutral' ? 'bg-yellow-500' :
                      'bg-[#666]'
                    }`} />
                  )}
                </div>
                <span className="text-xs text-[#666]">{mention.date}</span>
              </div>
              <p className="text-sm text-[#ccc] leading-relaxed">"{mention.snippet}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 
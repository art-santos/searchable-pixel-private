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
          {overviewData.recentMentions.map((mention: any, index: number) => (
            <div key={index} className="bg-[#0a0a0a] border border-[#222] rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded text-xs font-medium border border-purple-500/20 text-purple-400 bg-purple-500/5`}>
                    {mention.type || 'AI Platform'}
                  </div>
                  <div className={`px-2 py-1 rounded text-xs border ${
                    mention.position === 'primary' 
                      ? 'border-white/20 text-white' 
                      : 'border-[#333] text-[#888]'
                  }`}>
                    {mention.position || 'mention'}
                  </div>
                  {hasMaxAccess && (
                    <div className={`w-2 h-2 rounded-full ${
                      mention.sentiment === 'positive' || mention.sentiment === 'very_positive' ? 'bg-green-500' :
                      mention.sentiment === 'negative' || mention.sentiment === 'very_negative' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`} />
                  )}
                </div>
              </div>
              <p className="text-sm text-[#ccc] leading-relaxed">"{mention.question}"</p>
            </div>
          ))}
          
          {overviewData.recentMentions.length === 0 && (
            <p className="text-sm text-[#666] text-center py-4">No recent mentions found</p>
          )}
        </div>
      </div>
    </div>
  )
} 
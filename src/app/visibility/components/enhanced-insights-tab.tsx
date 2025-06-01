'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, Target, Lightbulb, Sparkles, ArrowUpRight, Zap } from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'

interface EnhancedInsightsTabProps {
  hasVisibilityData: boolean
  isRefreshing: boolean
  onRefreshScore: () => void
}

export function EnhancedInsightsTab({ hasVisibilityData }: EnhancedInsightsTabProps) {
  const { subscription } = useSubscription()
  const hasMaxAccess = subscription?.plan === 'plus' || subscription?.plan === 'pro'

  // Only render if we have data - empty state handled centrally
  if (!hasVisibilityData) {
    return null
  }

  const insights = {
    trends: [
      {
        id: 1,
        title: 'AI SDR Query Volume Rising',
        description: 'Mentions of "AI SDR" increased 47% this month',
        trend: 'up' as const,
        impact: 'high' as const,
        change: '+47%',
        period: '30 days'
      },
      {
        id: 2,
        title: 'Sales Automation Interest Peaks',
        description: 'Peak search times align with business quarters',
        trend: 'up' as const,
        impact: 'medium' as const,
        change: '+23%',
        period: '7 days'
      },
      {
        id: 3,
        title: 'Cold Email Mentions Declining',
        description: 'Traditional cold email tools losing ground',
        trend: 'down' as const,
        impact: 'medium' as const,
        change: '-15%',
        period: '14 days'
      }
    ],
    recommendations: [
      {
        id: 1,
        category: 'Content',
        title: 'Create AI SDR Comparison Guide',
        description: 'Build comprehensive comparison content for high-volume queries',
        priority: 'high' as const,
        effort: 'medium' as const,
        impact: 85,
        timeframe: '2-3 weeks'
      },
      {
        id: 2,
        category: 'SEO',
        title: 'Optimize for Sales Automation',
        description: 'Target emerging sales automation keywords',
        priority: 'high' as const,
        effort: 'low' as const,
        impact: 72,
        timeframe: '1 week'
      },
      {
        id: 3,
        category: 'Product',
        title: 'Develop ROI Calculator',
        description: 'Interactive tool for sales automation ROI',
        priority: 'medium' as const,
        effort: 'high' as const,
        impact: 90,
        timeframe: '4-6 weeks'
      }
    ],
    quickWins: [
      {
        id: 1,
        title: 'Add AI SDR FAQ Section',
        description: 'Quick content addition for trending queries',
        effort: 20,
        impact: 75,
        timeframe: '2 days'
      },
      {
        id: 2,
        title: 'Update Homepage Meta Tags',
        description: 'Include trending keywords in meta descriptions',
        effort: 15,
        impact: 60,
        timeframe: '1 day'
      },
      {
        id: 3,
        title: 'Create Comparison Chart',
        description: 'Visual comparison with key competitors',
        effort: 40,
        impact: 80,
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
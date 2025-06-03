'use client'

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

  // Use real data from props - now with CUMULATIVE metrics
  const overviewData = {
    directCitations: data.citations?.direct_count || 0,
    indirectCitations: data.citations?.indirect_count || 0,
    totalCitations: data.citations?.total_count || 0,
    sentimentScore: data.score?.sentiment_score || 0,
    coverageRate: Math.round((data.citations?.coverage_rate || 0) * 100),
    competitiveRank: data.competitive?.current_rank || 1,
    totalCompetitors: data.competitive?.total_competitors || 0,
    percentile: data.competitive?.percentile || 0,
    shareOfVoice: data.competitive?.share_of_voice || 0, // CUMULATIVE share of voice
    // Use ONLY real competitor data - top 10 competitors mentioned
    competitors: data.competitive?.top10_competitors || data.competitive?.competitors || [],
    userCompany: {
      name: data.company?.name || 'Your Company',
      domain: data.company?.domain || '',
      score: data.score?.overall_score || 0,
      rank: data.competitive?.current_rank || 1
    },
    // Add cumulative metrics
    cumulativeData: data.cumulative_data || {
      total_assessments: 1,
      user_cumulative_mentions: 0,
      total_market_mentions: 0,
      cumulative_share_of_voice: 0
    }
  }

  // The competitors data is the smart top 10 from the API - NO FALLBACKS
  const top10Competitors = overviewData.competitors.slice(0, 10).map((competitor: any) => ({
    ...competitor,
    favicon: competitor.favicon || `https://www.google.com/s2/favicons?domain=${competitor.domain}&sz=128`,
    // Show cumulative mention rate instead of single assessment
    displayMentionRate: competitor.cumulative_mentions || competitor.mention_rate || 0,
    assessmentCount: competitor.assessment_count || 1
  }))

  return (
    <div className="space-y-6">
      {/* Cumulative Performance Summary */}
      {overviewData.cumulativeData.total_assessments > 1 && (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <h4 className="text-white font-medium mb-2">Cumulative Performance</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className="text-xs text-[#666]">Total Scans</span>
              <div className="text-lg font-semibold text-white">{overviewData.cumulativeData.total_assessments}</div>
            </div>
            <div>
              <span className="text-xs text-[#666]">Your Total Mentions</span>
              <div className="text-lg font-semibold text-white">{overviewData.cumulativeData.user_cumulative_mentions.toFixed(1)}</div>
            </div>
            <div>
              <span className="text-xs text-[#666]">Market Total Mentions</span>
              <div className="text-lg font-semibold text-white">{overviewData.cumulativeData.total_market_mentions.toFixed(1)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Competitive Position - Top 10 Ranking */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-white font-medium">Top 10 Competitors Mentioned</h4>
          {top10Competitors.length > 0 ? (
            <div className="text-right">
              <span className="text-xs text-[#666]">{top10Competitors.length} competitors found</span>
              {overviewData.cumulativeData.total_assessments > 1 && (
                <div className="text-xs text-[#888]">Cumulative across {overviewData.cumulativeData.total_assessments} scans</div>
              )}
            </div>
          ) : (
            <span className="text-xs text-red-400">No competitor data available</span>
          )}
        </div>
        
        <div className="space-y-3">
          {top10Competitors.length > 0 ? (
            top10Competitors.map((competitor: any, index: number) => (
              <div 
                key={`competitor-${competitor.domain}-${index}`} 
                className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-colors ${
                  competitor.isUser 
                    ? 'bg-white/5 border border-white/10' 
                    : 'hover:bg-white/5'
                }`}
              >
                {/* Rank */}
                <div className={`flex items-center justify-center w-6 h-6 rounded text-xs font-medium ${
                  competitor.isUser
                    ? 'bg-white/10 text-white'
                    : competitor.rank <= 3
                      ? 'bg-white/10 text-white'
                      : 'bg-[#333] text-[#888]'
                }`}>
                  {competitor.rank || index + 1}
                </div>
            
                {/* Favicon */}
                <div className="flex-shrink-0">
                  <img 
                    src={competitor.favicon} 
                    alt={`${competitor.name} favicon`}
                    className="w-5 h-5 rounded"
                    onError={(e) => {
                      // Fallback to a default icon
                      e.currentTarget.src = `data:image/svg+xml;base64,${btoa(`
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M8 12h8"/>
                          <path d="M12 8v8"/>
                        </svg>
                      `)}`
                    }}
                  />
                </div>
                
                {/* Company Info */}
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-sm truncate ${
                    competitor.isUser ? 'text-white' : 'text-white'
                  }`}>
                    {competitor.name}
                    {competitor.isUser && <span className="text-xs text-[#888] ml-2">(You)</span>}
                  </div>
                  <div className="text-xs text-[#666] truncate">
                    {competitor.domain}
                    {competitor.assessmentCount > 1 && (
                      <span className="ml-2 text-[#555]">• {competitor.assessmentCount} scans</span>
                    )}
                  </div>
                </div>
                
                {/* Cumulative Share of Voice */}
                <div className="text-right flex-shrink-0">
                  <div className={`text-sm font-medium ${
                    competitor.isUser ? 'text-white' : 'text-white'
                  }`}>
                    {competitor.isUser 
                      ? `${overviewData.shareOfVoice.toFixed(1)}%` 
                      : `${((competitor.displayMentionRate / (overviewData.cumulativeData.total_market_mentions || 1)) * 100).toFixed(1)}%`
                    }
                  </div>
                  <div className="text-xs text-[#666]">
                    {overviewData.cumulativeData.total_assessments > 1 ? 'cumulative share' : 'share of voice'}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-red-400 mb-2">❌ No competitor data found</p>
              <p className="text-xs text-[#666]">Run a MAX visibility scan to analyze competitors</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
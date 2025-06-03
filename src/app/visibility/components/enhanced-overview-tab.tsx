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
    shareOfVoice: data.competitive?.share_of_voice || 0,
    recentMentions: data.citations?.recent_mentions || [],
    // Enhanced competitive data - use smart top 5 if available, fallback to regular competitors
    competitors: data.competitive?.top5_competitors || data.competitive?.competitors || [],
    userCompany: {
      name: data.company?.name || 'Your Company',
      domain: data.company?.domain || '',
      score: data.score?.overall_score || 0,
      rank: data.competitive?.current_rank || 1
    }
  }

  // The competitors data is already the smart top 5 from the API
  const top5Competitors = overviewData.competitors.slice(0, 5).map((competitor: any) => ({
    ...competitor,
    favicon: competitor.favicon || `https://www.google.com/s2/favicons?domain=${competitor.domain}&sz=128`
  }))

  return (
    <div className="space-y-6">
      {/* Competitive Position - Top 5 Ranking */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-white font-medium">Competitive Position</h4>
          <span className="text-xs text-[#666]">Top 5 Ranking</span>
        </div>
        
        <div className="space-y-3">
          {top5Competitors.map((competitor: any, index: number) => (
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
                <div className="text-xs text-[#666] truncate">{competitor.domain}</div>
              </div>
              
              {/* Share of Voice instead of Score */}
              <div className="text-right flex-shrink-0">
                <div className={`text-sm font-medium ${
                  competitor.isUser ? 'text-white' : 'text-white'
                }`}>
                  {competitor.isUser 
                    ? `${overviewData.shareOfVoice.toFixed(1)}%` 
                    : `${((competitor.mention_rate || 0) * 100).toFixed(1)}%`
                  }
                </div>
                <div className="text-xs text-[#666]">
                  share of voice
                </div>
              </div>
            </div>
          ))}
          
          {top5Competitors.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-sm text-[#666]">No competitive data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Mentions - Enhanced with Favicons and URLs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-white font-medium">Recent Mentions</h4>
          <span className="text-xs text-[#666]">{overviewData.recentMentions.length} found</span>
        </div>
        
        <div className="space-y-3">
          {overviewData.recentMentions.slice(0, 3).map((mention: any, index: number) => (
            <div key={mention.id || `mention-${index}-${mention.question?.substring(0, 20) || 'unknown'}`} className="group">
              <div className="flex items-start gap-3 py-3">
                {/* Favicon instead of status badges */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {mention.favicon ? (
                    <img 
                      src={mention.favicon} 
                      alt={`${mention.domain} favicon`}
                      className="w-4 h-4 rounded"
                      onError={(e) => {
                        // Fallback to sentiment dot if favicon fails
                        e.currentTarget.style.display = 'none'
                        const dot = e.currentTarget.nextElementSibling as HTMLElement
                        if (dot) dot.style.display = 'block'
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-1.5 h-1.5 rounded-full ${mention.favicon ? 'hidden' : 'block'} ${
                      mention.sentiment === 'positive' || mention.sentiment === 'very_positive' ? 'bg-green-500' :
                      mention.sentiment === 'negative' || mention.sentiment === 'very_negative' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`} 
                  />
                  <span className={`text-xs px-2 py-0.5 rounded border ${
                    mention.position === 'primary' 
                      ? 'border-white/20 text-white bg-white/5' 
                      : 'border-[#333] text-[#666] bg-[#111]'
                  }`}>
                    {mention.position || 'mentioned'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  {/* Show actual mention quote */}
                  <p className="text-sm text-[#ccc] leading-relaxed line-clamp-2 mb-1">
                    "{mention.mention_quote || mention.context || mention.ai_response?.substring(0, 120) + '...' || `"${mention.question}"`}"
                  </p>
                  {/* Show source URL if available */}
                  {mention.citation_url && mention.citation_url !== '#' && (
                    <a 
                      href={mention.citation_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 underline truncate block"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Source: {mention.domain || mention.citation_url}
                    </a>
                  )}
                </div>
              </div>
              <div className="border-b border-[#222] mt-2"></div>
            </div>
          ))}
          
          {overviewData.recentMentions.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-sm text-[#666]">No recent mentions found</p>
            </div>
          )}
          
          {overviewData.recentMentions.length > 3 && (
            <div className="pt-2">
              <p className="text-xs text-[#666] text-center">
                +{overviewData.recentMentions.length - 3} more in Citations tab
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
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
    recentMentions: data.citations?.recent_mentions || [],
    // Enhanced competitive data
    competitors: data.competitive?.competitors || [],
    userCompany: {
      name: data.company?.name || 'Your Company',
      domain: data.company?.domain || '',
      score: data.score?.overall_score || 0,
      rank: data.competitive?.current_rank || 1
    }
  }

  // Create top 5 ranking ensuring user company appears
  const createTop5Ranking = () => {
    const allCompetitors = [...overviewData.competitors]
    
    // Add user company if not already in competitors list
    const userInList = allCompetitors.find(c => c.rank === overviewData.userCompany.rank)
    if (!userInList) {
      allCompetitors.push({
        name: overviewData.userCompany.name,
        domain: overviewData.userCompany.domain,
        visibility_score: overviewData.userCompany.score,
        rank: overviewData.userCompany.rank,
        isUser: true
      })
    } else {
      // Mark the user's company
      userInList.isUser = true
    }
    
    // Sort by rank and take top 5, but ensure user appears even if ranked lower
    const sortedCompetitors = allCompetitors.sort((a, b) => (a.rank || 999) - (b.rank || 999))
    let top5 = sortedCompetitors.slice(0, 5)
    
    // If user isn't in top 5, replace #5 with user (but show correct rank)
    const userInTop5 = top5.find(c => c.isUser)
    if (!userInTop5) {
      const userCompetitor = sortedCompetitors.find(c => c.isUser)
      if (userCompetitor) {
        top5[4] = userCompetitor // Replace 5th position with user
      }
    }
    
    return top5.map(competitor => ({
      ...competitor,
      favicon: `https://www.google.com/s2/favicons?domain=${competitor.domain}&sz=128`
    }))
  }

  const top5Competitors = createTop5Ranking()

  return (
    <div className="space-y-6">
      {/* Competitive Position - Top 5 Ranking */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-white font-medium">Competitive Position</h4>
          <span className="text-xs text-[#666]">Top 5 Ranking</span>
        </div>
        
        <div className="space-y-3">
          {top5Competitors.map((competitor, index) => (
            <div 
              key={competitor.domain} 
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
              
              {/* Score */}
              <div className="text-right flex-shrink-0">
                <div className={`text-sm font-medium ${
                  competitor.isUser ? 'text-white' : 'text-white'
                }`}>
                  {competitor.visibility_score?.toFixed(1) || '0.0'}
            </div>
                <div className="text-xs text-[#666]">
                  {Math.round((competitor.mention_rate || 0) * 100)}% mention
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

      {/* Recent Mentions - Minimal Teaser Design */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-white font-medium">Recent Mentions</h4>
          <span className="text-xs text-[#666]">{overviewData.recentMentions.length} found</span>
        </div>
        
        <div className="space-y-3">
          {overviewData.recentMentions.slice(0, 3).map((mention: any, index: number) => (
            <div key={index} className="group">
              <div className="flex items-start gap-3 py-2">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    mention.sentiment === 'positive' || mention.sentiment === 'very_positive' ? 'bg-green-500' :
                    mention.sentiment === 'negative' || mention.sentiment === 'very_negative' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`} />
                  <span className={`text-xs px-2 py-0.5 rounded border ${
                    mention.position === 'primary' 
                      ? 'border-white/20 text-white bg-white/5' 
                      : 'border-[#333] text-[#666] bg-[#111]'
                  }`}>
                    {mention.position || 'mentioned'}
                  </span>
                  </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#ccc] leading-relaxed line-clamp-2">
                    {mention.context || mention.ai_response?.substring(0, 120) + '...' || `"${mention.question}"`}
                  </p>
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
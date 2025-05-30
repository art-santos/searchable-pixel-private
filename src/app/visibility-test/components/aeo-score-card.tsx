'use client'

import { ShareOfVoiceInfo } from './share-of-voice-info'

interface AEOData {
  aeo_score: number
  coverage_owned: number
  coverage_operated: number
  coverage_total: number
  share_of_voice: number
  metrics?: {
    questions_analyzed: number
    total_results: number
    owned_appearances: number
    operated_appearances: number
    earned_appearances: number
    avg_owned_position: number
    avg_operated_position: number
    top_3_presence: number
  }
}

interface AEOScoreCardProps {
  data: AEOData
}

export function AEOScoreCard({ data }: AEOScoreCardProps) {
  const getScoreGrade = (score: number) => {
    if (score >= 80) return { grade: 'A', label: 'Excellent', color: 'text-green-400' }
    if (score >= 65) return { grade: 'B', label: 'Strong', color: 'text-blue-400' }
    if (score >= 50) return { grade: 'C', label: 'Growing', color: 'text-yellow-400' }
    if (score >= 35) return { grade: 'D', label: 'Emerging', color: 'text-orange-400' }
    return { grade: 'E', label: 'Early Stage', color: 'text-[#888]' } // More constructive than 'F'
  }

  const scoreInfo = getScoreGrade(data.aeo_score)
  
  // More encouraging messaging
  const getInsight = (score: number) => {
    if (score >= 80) return "You're in the top tier of AI visibility. Keep optimizing to maintain your position."
    if (score >= 65) return "Great foundation! You're ahead of most competitors with room to grow."
    if (score >= 50) return "You're building solid visibility. Focus on owned content to accelerate growth."
    if (score >= 35) return "You're on the right track. Consistent optimization will improve your score."
    return "This is where most brands start. You have significant opportunity to improve visibility."
  }

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-white font-medium text-base sm:text-lg mb-1">AI Visibility Score</h3>
          <p className="text-[#666] text-xs sm:text-sm">
            How visible your brand is across AI search engines
          </p>
        </div>
        <div className="text-left sm:text-right">
          <div className={`text-2xl sm:text-3xl font-bold ${scoreInfo.color}`}>
            {scoreInfo.grade}
          </div>
          <div className="text-[#666] text-xs">{scoreInfo.label}</div>
        </div>
      </div>

      {/* Main Score */}
      <div className="text-center py-6 sm:py-8 border-y border-[#1a1a1a]">
        <div className="text-5xl sm:text-6xl font-bold text-white mb-2">
          {data.aeo_score}
            </div>
        <div className="text-[#666] text-xs sm:text-sm mb-3 sm:mb-4">out of 100</div>
        <p className="text-[#888] text-xs sm:text-sm max-w-md mx-auto px-2">
          {getInsight(data.aeo_score)}
        </p>
            </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#666] text-xs">Owned Coverage</span>
            <span className="text-white font-medium text-sm">
              {Math.round(data.coverage_owned * 100)}%
            </span>
          </div>
          <div className="w-full h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div 
              className="h-full bg-white/60 rounded-full transition-all duration-300"
              style={{ width: `${data.coverage_owned * 100}%` }}
              />
            </div>
            </div>

        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#666] text-xs">Share of Voice</span>
            <span className="text-white font-medium text-sm">
              {Math.round(data.share_of_voice * 100)}%
            </span>
          </div>
          <div className="w-full h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div 
              className="h-full bg-white/60 rounded-full transition-all duration-300"
              style={{ width: `${data.share_of_voice * 100}%` }}
              />
          </div>
        </div>
      </div>

      {/* Context Note */}
      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-[#0f0f0f] border border-[#1a1a1a] rounded">
        <p className="text-[#666] text-xs leading-relaxed">
          <span className="text-[#888]">Industry Context:</span> Most established brands score between 30-60. 
          Scores above 70 are exceptional and typically require dedicated AI optimization efforts.
        </p>
      </div>

      {/* Analysis Stats */}
      {data.metrics && (
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-[#444]">
          <span>{data.metrics.questions_analyzed} questions analyzed</span>
          <span className="hidden sm:inline">•</span>
          <span>{data.metrics.total_results} results reviewed</span>
          <span className="hidden sm:inline">•</span>
          <span>{data.metrics.owned_appearances} owned citations</span>
      </div>
      )}
    </div>
  )
} 
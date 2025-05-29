'use client'

import { ShareOfVoiceInfo } from './share-of-voice-info'

interface AEOScoreData {
  aeo_score: number
  coverage_owned: number
  coverage_operated: number
  coverage_total: number
  share_of_voice: number
  metrics: {
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
  data: AEOScoreData
}

export function AEOScoreCard({ data }: AEOScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    if (score >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  const getScoreGrade = (score: number) => {
    if (score >= 90) return 'A+'
    if (score >= 80) return 'A'
    if (score >= 70) return 'B+'
    if (score >= 60) return 'B'
    if (score >= 50) return 'C+'
    if (score >= 40) return 'C'
    if (score >= 30) return 'D'
    return 'F'
  }

  // Calculate component scores for breakdown
  const coverageScore = (data.coverage_owned * 0.35 + data.coverage_operated * 0.15) * 100
  const voiceScore = data.share_of_voice * 100
  const consistencyScore = Math.min(20, (data.metrics.top_3_presence / data.metrics.questions_analyzed) * 20)

  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-white text-xl font-bold mb-2">AEO Visibility Score</h2>
          <p className="text-[#999] text-sm">Answer Engine Optimization effectiveness</p>
        </div>
        <div className="text-right">
          <div className={`text-4xl font-bold ${getScoreColor(data.aeo_score)}`}>
            {data.aeo_score}
            <span className="text-2xl text-[#666]">/100</span>
          </div>
          <div className={`text-lg font-semibold ${getScoreColor(data.aeo_score)}`}>
            Grade {getScoreGrade(data.aeo_score)}
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="mb-6">
        <h3 className="text-white font-semibold mb-3">Score Breakdown</h3>
        <div className="space-y-3">
          {/* Coverage Score (50% weight) */}
          <div className="bg-[#222] p-3 rounded">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[#ccc] text-sm">Coverage Score (50% weight)</span>
              <span className="text-white font-semibold">{Math.round(coverageScore)}/50</span>
            </div>
            <div className="w-full bg-[#333] rounded-full h-2 mb-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (coverageScore / 50) * 100)}%` }}
              />
            </div>
            <div className="text-xs text-[#999] space-y-1">
              <div>• Owned Coverage: {Math.round(data.coverage_owned * 100)}% (35% weight)</div>
              <div>• Operated Coverage: {Math.round(data.coverage_operated * 100)}% (15% weight)</div>
            </div>
          </div>

          {/* Share of Voice (30% weight) */}
          <div className="bg-[#222] p-3 rounded">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[#ccc] text-sm flex items-center">
                Share of Voice (30% weight)
                <ShareOfVoiceInfo />
              </span>
              <span className="text-white font-semibold">{Math.round(voiceScore * 0.3)}/30</span>
            </div>
            <div className="w-full bg-[#333] rounded-full h-2 mb-2">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, voiceScore)}%` }}
              />
            </div>
            <div className="text-xs text-[#999]">
              Position-weighted visibility: Pos 1 = 1.0pt, Pos 2 = 0.5pt, Pos 3 = 0.33pt, etc.
            </div>
          </div>

          {/* Consistency Bonus (20% weight) */}
          <div className="bg-[#222] p-3 rounded">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[#ccc] text-sm">Consistency Bonus (20% weight)</span>
              <span className="text-white font-semibold">{Math.round(consistencyScore)}/20</span>
            </div>
            <div className="w-full bg-[#333] rounded-full h-2 mb-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(consistencyScore / 20) * 100}%` }}
              />
            </div>
            <div className="text-xs text-[#999]">
              Broad presence across {data.metrics.top_3_presence}/{data.metrics.questions_analyzed} questions
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#222] p-3 rounded text-center">
          <div className="text-2xl font-bold text-blue-400">{data.metrics.questions_analyzed}</div>
          <div className="text-xs text-[#999]">Questions Analyzed</div>
        </div>
        <div className="bg-[#222] p-3 rounded text-center">
          <div className="text-2xl font-bold text-green-400">{data.metrics.owned_appearances}</div>
          <div className="text-xs text-[#999]">Owned Results</div>
        </div>
        <div className="bg-[#222] p-3 rounded text-center">
          <div className="text-2xl font-bold text-yellow-400">{data.metrics.operated_appearances}</div>
          <div className="text-xs text-[#999]">Operated Results</div>
        </div>
        <div className="bg-[#222] p-3 rounded text-center">
          <div className="text-2xl font-bold text-purple-400">
            {data.metrics.avg_owned_position > 0 ? data.metrics.avg_owned_position.toFixed(1) : '--'}
          </div>
          <div className="text-xs text-[#999]">Avg Position</div>
        </div>
      </div>

      {/* Methodology Note */}
      <div className="mt-4 p-3 bg-[#111] border border-[#333] rounded text-xs text-[#999]">
        <strong className="text-[#ccc]">Methodology:</strong> AEO Score = (Coverage × 50%) + (Share of Voice × 30%) + (Consistency × 20%). 
        Coverage measures top-3 presence, Share of Voice uses position-weighted ranking (1/rank), 
        and Consistency rewards broad visibility across questions.
      </div>
    </div>
  )
} 
'use client'
import { ScoreHistoryChart } from './score-history-chart'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface Point { date: string; score: number }

export function OverallAEOCard({ history }: { history: Point[] }) {
  const [displayScore, setDisplayScore] = useState(0)
  const currentScore = history.length > 0 ? history[history.length - 1].score : 0

  // Animate score counting up
  useEffect(() => {
    if (currentScore === 0) return
    
    let start = 0
    const duration = 1000
    const increment = currentScore / (duration / 16)
    
    const timer = setInterval(() => {
      start += increment
      if (start >= currentScore) {
        setDisplayScore(currentScore)
        clearInterval(timer)
      } else {
        setDisplayScore(Math.floor(start))
      }
    }, 16)
    
    return () => clearInterval(timer)
  }, [currentScore])

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400'
    if (score >= 40) return 'text-yellow-400'
    return 'text-orange-400'
  }

  const getScoreGrade = (score: number) => {
    if (score >= 80) return 'A'
    if (score >= 65) return 'B'
    if (score >= 50) return 'C'
    if (score >= 35) return 'D'
    return 'E'
  }

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 sm:p-6 h-full flex flex-col">
      <h3 className="text-white font-medium text-base sm:text-lg mb-4">Score History</h3>
      
      <div className="flex flex-col gap-4 sm:gap-6 flex-1">
        {/* Real Score Display */}
        <div className="flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0"
          >
            <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="#1a1a1a"
                strokeWidth="8"
              />
              <motion.circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${(currentScore * 351.86) / 100} 351.86`}
                className={getScoreColor(currentScore)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-xl sm:text-2xl font-bold ${getScoreColor(currentScore)}`}>
                {displayScore}
              </span>
              <span className="text-xs text-[#666]">
                Grade: {getScoreGrade(currentScore)}
              </span>
            </div>
          </motion.div>
        </div>
        
        {/* Score interpretation */}
        <div className="text-center text-xs sm:text-sm text-[#888] px-2">
          {currentScore >= 70 && "Excellent AI visibility! Your content is well-optimized for AI search engines."}
          {currentScore >= 40 && currentScore < 70 && "Good foundation, but there's room for improvement in AI optimization."}
          {currentScore < 40 && "Significant opportunities to improve your AI visibility and citations."}
        </div>
        
        <div className="mt-auto">
        <ScoreHistoryChart data={history} />
        </div>
      </div>
    </div>
  )
}

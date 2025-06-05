'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Sparkles, 
  Eye,
  Target,
  BarChart3
} from 'lucide-react'

interface ScanResultsModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  newScore: number
  previousScore?: number
  scanType: 'lite' | 'max'
  assessmentId?: string
  additionalMetrics?: {
    mentionRate?: number
    sentimentScore?: number
    citationScore?: number
    competitiveScore?: number
  }
}

export function ScanResultsModal({
  isOpen,
  onOpenChange,
  newScore,
  previousScore,
  scanType,
  assessmentId,
  additionalMetrics
}: ScanResultsModalProps) {
  const scoreDifference = previousScore ? newScore - previousScore : null
  const hasImproved = scoreDifference !== null && scoreDifference > 0
  const hasDeclined = scoreDifference !== null && scoreDifference < 0
  
  const formatScore = (score: number): string => {
    return Math.floor(score * 10) / 10 + ''
  }

  const getTrendIcon = () => {
    if (hasImproved) return TrendingUp
    if (hasDeclined) return TrendingDown
    return Minus
  }

  const getTrendColor = () => {
    if (hasImproved) return 'text-green-400'
    if (hasDeclined) return 'text-red-400'
    return 'text-gray-400'
  }

  const TrendIcon = getTrendIcon()

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[#1a1a1a] border-[#333333] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            Scan Complete!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Main Score Display */}
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <div className="text-sm text-gray-400 uppercase tracking-wide">
                Your new {scanType.toUpperCase()} visibility score is
              </div>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "backOut" }}
                className="text-6xl font-bold text-white"
              >
                {formatScore(newScore)}
              </motion.div>
            </div>

            {/* Score Change */}
            {scoreDifference !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`flex items-center justify-center gap-2 ${getTrendColor()}`}
              >
                <TrendIcon className="h-4 w-4" />
                <span className="font-medium">
                  {scoreDifference > 0 ? '+' : ''}{formatScore(scoreDifference)} from last scan
                </span>
              </motion.div>
            )}
          </div>

          {/* Additional Metrics for MAX scans */}
          {scanType === 'max' && additionalMetrics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 gap-4"
            >
              {additionalMetrics.mentionRate !== undefined && (
                <div className="bg-[#2a2a2a] p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-gray-400">Mention Rate</span>
                  </div>
                  <div className="text-lg font-semibold">
                    {(additionalMetrics.mentionRate * 100).toFixed(1)}%
                  </div>
                </div>
              )}

              {additionalMetrics.sentimentScore !== undefined && (
                <div className="bg-[#2a2a2a] p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm text-gray-400">Sentiment</span>
                  </div>
                  <div className="text-lg font-semibold">
                    {(additionalMetrics.sentimentScore * 100).toFixed(0)}%
                  </div>
                </div>
              )}

              {additionalMetrics.citationScore !== undefined && (
                <div className="bg-[#2a2a2a] p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="h-4 w-4 text-purple-400" />
                    <span className="text-sm text-gray-400">Source Quality</span>
                  </div>
                  <div className="text-lg font-semibold">
                    {(additionalMetrics.citationScore * 100).toFixed(0)}%
                  </div>
                </div>
              )}

              {additionalMetrics.competitiveScore !== undefined && (
                <div className="bg-[#2a2a2a] p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4 text-orange-400" />
                    <span className="text-sm text-gray-400">Competitive</span>
                  </div>
                  <div className="text-lg font-semibold">
                    {(additionalMetrics.competitiveScore * 100).toFixed(0)}%
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center text-sm text-gray-400"
          >
            {hasImproved && "Great progress! Your visibility is improving."}
            {hasDeclined && "Your score has decreased, but that's normal as AI algorithms evolve."}
            {scoreDifference === null && "Your new baseline score has been established."}
          </motion.div>

          {/* Assessment ID */}
          {assessmentId && (
            <div className="text-xs text-gray-500 font-mono text-center">
              Assessment ID: {assessmentId.substring(0, 8)}...
            </div>
          )}

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex justify-center"
          >
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              View Dashboard
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
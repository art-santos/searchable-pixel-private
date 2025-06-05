'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Sparkles, BarChart3, Search, Brain, Target, CheckCircle, TrendingUp } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'

interface ScanProgressModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  progress: number
  stage?: string
  message?: string
  assessmentId?: string | null
  status: 'pending' | 'running' | 'completed' | 'failed' | null
  finalScore?: number
  previousScore?: number
}

const stageIcons = {
  setup: Search,
  questions: Brain,
  analysis: BarChart3,
  scoring: Target,
  complete: Sparkles
}

const stageLabels = {
  setup: 'Initializing',
  questions: 'Generating',
  analysis: 'Analyzing',
  scoring: 'Calculating',
  complete: 'Finalizing'
}

const stageDescriptions = {
  setup: 'Initializing Assessment',
  questions: 'Generating Questions',
  analysis: 'Analyzing Responses',
  scoring: 'Calculating Scores',
  complete: 'Finalizing Results'
}

const stageProgressThresholds = {
  setup: 0,
  questions: 0,
  analysis: 0,
  scoring: 0,
  complete: 100
}

export function ScanProgressModal({
  isOpen,
  onOpenChange,
  progress,
  stage,
  message,
  assessmentId,
  status,
  finalScore,
  previousScore
}: ScanProgressModalProps) {
  const [displayProgress, setDisplayProgress] = useState(0)
  const [smoothProgress, setSmoothProgress] = useState(0)
  const progressAnimationRef = useRef<number>()
  const progressIntervalRef = useRef<NodeJS.Timeout>()
  
  useEffect(() => {
    const targetProgress = progress || 0
    
    console.log('🎯 Progress update:', { 
      backendProgress: progress, 
      currentSmooth: smoothProgress,
      targetProgress,
      stage,
      status 
    })
    
    if (progressAnimationRef.current) {
      cancelAnimationFrame(progressAnimationRef.current)
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }

    const progressDiff = Math.abs(targetProgress - smoothProgress)
    
    if (progressDiff > 5 || targetProgress === 100 || targetProgress === 0) {
      const startProgress = smoothProgress
      const duration = targetProgress === 100 ? 1000 : 1500
      const startTime = Date.now()

      const animate = () => {
        const elapsed = Date.now() - startTime
        const animationProgress = Math.min(elapsed / duration, 1)
        
        const easeOut = 1 - Math.pow(1 - animationProgress, 3)
        const currentProgress = startProgress + ((targetProgress - startProgress) * easeOut)
        
        setSmoothProgress(currentProgress)
        setDisplayProgress(currentProgress)

        if (animationProgress < 1) {
          progressAnimationRef.current = requestAnimationFrame(animate)
        } else {
          setSmoothProgress(targetProgress)
          setDisplayProgress(targetProgress)
        }
      }

      animate()
    } else if (targetProgress > smoothProgress) {
      progressIntervalRef.current = setInterval(() => {
        setSmoothProgress(prev => {
          const nextProgress = Math.min(prev + 1, targetProgress)
          setDisplayProgress(nextProgress)
          
          if (nextProgress >= targetProgress) {
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current)
            }
          }
          
          return nextProgress
        })
      }, 150)
    } else if (targetProgress < smoothProgress) {
      setSmoothProgress(targetProgress)
      setDisplayProgress(targetProgress)
    } else {
      setSmoothProgress(targetProgress)
      setDisplayProgress(targetProgress)
    }

    return () => {
      if (progressAnimationRef.current) {
        cancelAnimationFrame(progressAnimationRef.current)
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [progress, stage, status, smoothProgress])

  const currentStage = stage || 'setup'
  const StageIcon = stageIcons[currentStage as keyof typeof stageIcons] || Search
  const stageLabel = stageLabels[currentStage as keyof typeof stageLabels] || 'Processing'
  const stageDescription = stageDescriptions[currentStage as keyof typeof stageDescriptions] || 'Processing...'

  const getStatusMessage = () => {
    if (status === 'failed') return 'Assessment failed'
    if (status === 'completed') return 'Assessment completed successfully!'
    if (message) return message
    
    switch (currentStage) {
      case 'setup':
        return 'Generating intelligent questions from company context...'
      case 'questions':
        return 'Processing company analysis and market research...'
      case 'analysis':
        return 'Analyzing competitive landscape and citations...'
      case 'scoring':
        return 'Calculating visibility scores and rankings...'
      case 'complete':
        return 'Finalizing results and updating data...'
      default:
        return stageDescription
    }
  }

  const getProgressColor = () => {
    if (status === 'failed') return 'bg-red-500'
    if (status === 'completed') return 'bg-green-500'
    if (displayProgress < 30) return 'bg-blue-500'
    if (displayProgress < 70) return 'bg-purple-500'
    return 'bg-emerald-500'
  }

  const getCurrentStageIndex = () => {
    return Object.keys(stageLabels).indexOf(currentStage)
  }

  // Calculate score change for display
  const scoreChange = finalScore && previousScore ? finalScore - previousScore : null
  const hasImproved = scoreChange && scoreChange > 0
  const hasDeclined = scoreChange && scoreChange < 0

  // Show completion state when status is completed
  const showCompletionState = status === 'completed'
  
  console.log('🎯 ScanProgressModal render:', {
    status,
    progress,
    finalScore,
    previousScore,
    showCompletionState,
    displayProgress
  })

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[#1a1a1a] border-[#333333] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="relative">
              {showCompletionState ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <>
                  <Zap className="h-5 w-5 text-blue-400" />
                  <AnimatePresence>
                    {status === 'running' && (
                      <motion.div
                        className="absolute inset-0"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        exit={{ opacity: 0 }}
                      >
                        <Sparkles className="h-5 w-5 text-blue-400 opacity-60" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
            {showCompletionState ? 'Scan Complete!' : 'Running Visibility Scan'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <AnimatePresence mode="wait">
            {showCompletionState ? (
              <motion.div
                key="completion"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center space-y-6"
              >
                <div className="bg-[#2a2a2a] rounded-xl p-6">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <Sparkles className="h-6 w-6 text-yellow-400" />
                    <h3 className="text-xl font-semibold">Your Visibility Score</h3>
                  </div>
                  
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="text-5xl font-bold text-green-400 mb-2"
                  >
                    {finalScore ? Math.round(finalScore) : 0}
                  </motion.div>
                  
                  <div className="text-gray-400 text-sm">out of 100</div>
                  
                  {/* Score Change Indicator */}
                  {scoreChange !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className={`flex items-center justify-center gap-2 mt-4 px-3 py-2 rounded-lg ${
                        hasImproved ? 'bg-green-900/30 text-green-400' : 
                        hasDeclined ? 'bg-red-900/30 text-red-400' : 
                        'bg-gray-900/30 text-gray-400'
                      }`}
                    >
                      {hasImproved && <TrendingUp className="h-4 w-4" />}
                      {hasDeclined && <TrendingUp className="h-4 w-4 rotate-180" />}
                      <span className="text-sm font-medium">
                        {scoreChange > 0 ? '+' : ''}{Math.round(scoreChange)} from last scan
                      </span>
                    </motion.div>
                  )}

                  {/* Show message when score is not available */}
                  {!finalScore && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="mt-4 px-3 py-2 rounded-lg bg-blue-900/30 text-blue-400 text-sm text-center"
                    >
                      Assessment completed! Your updated score will appear shortly.
                    </motion.div>
                  )}
                </div>

                {/* Success Message */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-center text-sm text-gray-400"
                >
                  {finalScore ? (
                    <>
                      {hasImproved && "🎉 Great progress! Your visibility is improving."}
                      {hasDeclined && "Your score has decreased, but that's normal as AI algorithms evolve."}
                      {scoreChange === null && "Your new baseline score has been established."}
                    </>
                  ) : (
                    "Your visibility data is being updated. Please check your dashboard in a moment."
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex justify-center"
                >
                  <Button
                    onClick={() => onOpenChange(false)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
                    size="lg"
                  >
                    View Dashboard
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="progress"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <motion.div 
                  className="flex items-center gap-3"
                  key={currentStage}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="p-2 bg-[#2a2a2a] rounded-lg">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <StageIcon className="h-5 w-5 text-blue-400" />
                    </motion.div>
                  </div>
                  <div>
                    <div className="font-medium">{stageDescription}</div>
                    <div className="text-sm text-gray-400">{getStatusMessage()}</div>
                  </div>
                </motion.div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <motion.span
                      key={Math.floor(displayProgress)}
                      initial={{ scale: 1.2, opacity: 0.7 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {Math.round(displayProgress)}%
                    </motion.span>
                  </div>
                  <div className="relative">
                    <Progress 
                      value={displayProgress} 
                      className="h-3 transition-all duration-300 ease-out" 
                      style={{
                        '--progress-background': getProgressColor()
                      } as React.CSSProperties}
                    />
                    {status === 'running' && (
                      <motion.div
                        className="absolute inset-0 rounded-full opacity-30"
                        style={{ background: `linear-gradient(90deg, transparent, ${getProgressColor().replace('bg-', '')}, transparent)` }}
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />
                    )}
                  </div>
                </div>

                {assessmentId && (
                  <div className="text-xs text-gray-500 font-mono">
                    ID: {assessmentId.substring(0, 8)}...
                  </div>
                )}

                <div className="flex justify-between items-center">
                  {Object.entries(stageLabels).map(([key, label], index) => {
                    const Icon = stageIcons[key as keyof typeof stageIcons]
                    const isActive = key === currentStage
                    const isCompleted = getCurrentStageIndex() > index
                    const isUpcoming = getCurrentStageIndex() < index
                    
                    return (
                      <motion.div 
                        key={key} 
                        className="flex flex-col items-center space-y-1"
                        animate={{
                          scale: isActive ? 1.1 : 1,
                          opacity: isUpcoming ? 0.5 : 1
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.div 
                          className={`p-1.5 rounded-full transition-colors duration-300 ${
                            isCompleted ? 'bg-green-500' : 
                            isActive ? 'bg-blue-500' : 
                            'bg-gray-600'
                          }`}
                          animate={isActive ? {
                            boxShadow: ['0 0 0 0 rgba(59, 130, 246, 0.4)', '0 0 0 8px rgba(59, 130, 246, 0)', '0 0 0 0 rgba(59, 130, 246, 0)']
                          } : {}}
                          transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
                        >
                          <Icon className="h-3 w-3 text-white" />
                        </motion.div>
                        <div className={`text-xs text-center max-w-[60px] transition-colors duration-300 ${
                          isActive ? 'text-white font-medium' : 
                          isCompleted ? 'text-green-400' :
                          'text-gray-400'
                        }`}>
                          {label}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                <AnimatePresence mode="wait">
                  {status === 'running' && (
                    <motion.div 
                      className="text-center text-sm text-gray-400"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      This usually takes 2-3 minutes...
                    </motion.div>
                  )}

                  {status === 'failed' && (
                    <motion.div 
                      className="text-center text-sm text-red-400"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      Something went wrong. Please try again.
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
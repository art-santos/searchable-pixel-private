'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface AEOPipelineProps {
  isOpen: boolean
  crawlUrl: string
  onClose: () => void
  onAnalysisComplete: (data: any) => void
}

interface ProgressEvent {
  step: string
  progress: number
  total: number
  message: string
  data?: any
  error?: string
}

const STEP_NAMES = {
  crawl: 'Website Crawling',
  questions: 'Question Generation',
  search: 'SERP Analysis',
  classify: 'URL Classification',
  score: 'Score Calculation',
  complete: 'Complete'
}

export function AEOPipeline({ isOpen, crawlUrl, onClose, onAnalysisComplete }: AEOPipelineProps) {
  const { session } = useAuth()
  const [currentStep, setCurrentStep] = useState<string>('idle')
  const [progress, setProgress] = useState<number>(0)
  const [totalSteps, setTotalSteps] = useState<number>(5)
  const [log, setLog] = useState<string[]>([])
  const [finalResults, setFinalResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  
  // Use ref to track if analysis has been run for this URL
  const analyzedUrlRef = useRef<string>('')
  const eventSourceRef = useRef<EventSource | null>(null)

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : '🔄'
    setLog((prev) => [...prev, `[${timestamp}] ${emoji} ${message}`])
  }

  // Clean up EventSource on unmount or close
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [])

  // Reset the component when closed
  useEffect(() => {
    if (!isOpen) {
      const timeout = setTimeout(() => {
        if (!isOpen) {
          setLog([])
          setCurrentStep('idle')
          setProgress(0)
          setError(null)
          setFinalResults(null)
          setIsRunning(false)
          
          // Close EventSource if running
          if (eventSourceRef.current) {
            eventSourceRef.current.close()
            eventSourceRef.current = null
          }
        }
      }, 300)
      
      return () => clearTimeout(timeout)
    }
  }, [isOpen])

  useEffect(() => {
    // Only run if modal is open, URL exists, and analysis isn't already running for this URL
    if (!isOpen || !crawlUrl || analyzedUrlRef.current === crawlUrl || isRunning) {
      console.log('🔄 AEO Pipeline conditions check:')
      console.log('  - isOpen:', isOpen)
      console.log('  - crawlUrl:', crawlUrl)
      console.log('  - already analyzed:', analyzedUrlRef.current === crawlUrl)
      console.log('  - isRunning:', isRunning)
      console.log('  - Should run:', isOpen && crawlUrl && analyzedUrlRef.current !== crawlUrl && !isRunning)
      return
    }

    // Also make sure we have an auth session
    if (!session) {
      console.log('❌ AEO Pipeline: No session found')
      setError('Authentication required. Please log in.')
      setCurrentStep('error')
      return
    }

    console.log('🚀 AEO PIPELINE: Starting analysis')
    console.log('👤 Session user:', session.user?.email)
    console.log('🌐 Target URL:', crawlUrl)

    const runAEOPipeline = async () => {
      try {
        setIsRunning(true)
        analyzedUrlRef.current = crawlUrl
        
        // Reset state
        setError(null)
        setCurrentStep('crawl')
        setProgress(0)
        setLog([])
        setFinalResults(null)
        
        addLog(`Starting AEO Visibility Pipeline for: ${crawlUrl}`, 'info')
        addLog('Initializing 5-step analysis...', 'info')

        // Debug: Log session info
        console.log('🔍 AEO Pipeline Debug Info:')
        console.log('- Session exists:', !!session)
        console.log('- Session access_token exists:', !!session?.access_token)
        console.log('- Session access_token preview:', session?.access_token?.substring(0, 20) + '...')
        console.log('- CrawlUrl:', crawlUrl)

        // Create EventSource for SSE with auth token as query param
        const eventSourceUrl = `/api/aeo/start?token=${encodeURIComponent(session.access_token)}&url=${encodeURIComponent(crawlUrl)}`
        console.log('🔗 EventSource URL:', eventSourceUrl.replace(session.access_token, '[REDACTED]'))
        
        const eventSource = new EventSource(eventSourceUrl)
        eventSourceRef.current = eventSource

        // Handle progress events
        eventSource.onmessage = (event) => {
          console.log('📨 EventSource message received:', event.data)
          console.log('📨 Event data length:', event.data.length)
          console.log('📨 Event data preview:', event.data.substring(0, 200))
          
          try {
            const progressData: ProgressEvent = JSON.parse(event.data)
            console.log('✅ Successfully parsed progress data:', {
              step: progressData.step,
              progress: progressData.progress,
              total: progressData.total,
              hasData: !!progressData.data,
              hasError: !!progressData.error
            })
            
            setCurrentStep(progressData.step)
            setProgress(progressData.progress)
            setTotalSteps(progressData.total)
            
            if (progressData.error) {
              console.log('❌ Progress data contains error:', progressData.error)
              addLog(`Error in ${progressData.step}: ${progressData.error}`, 'error')
              setError(progressData.error)
              setCurrentStep('error')
              setIsRunning(false)
              eventSource.close()
              return
            }
            
            // Add progress log
            const stepName = STEP_NAMES[progressData.step as keyof typeof STEP_NAMES] || progressData.step
            addLog(`[${stepName}] ${progressData.message}`, 'info')
            
            // Handle completion
            if (progressData.step === 'complete' && progressData.data) {
              console.log('🎯 AEO Pipeline: COMPLETION EVENT DETECTED')
              console.log('📊 Raw completion data keys:', Object.keys(progressData.data))
              console.log('📊 Raw completion data sample:', JSON.stringify(progressData.data, null, 2).substring(0, 500))
              
              setFinalResults(progressData.data)
              addLog('AEO Pipeline completed successfully!', 'success')
              addLog(`Final AEO Score: ${progressData.data.aeo_score}/100`, 'success')
              
              // Transform data for the dashboard UI
              console.log('🔄 Transforming data for dashboard...')
              const dashboardData = transformToVisibilityData(progressData.data)
              console.log('✅ Dashboard data transformed:', Object.keys(dashboardData))
              
              // Include raw AEO data for database saving
              const completeData = {
                ...dashboardData,
                // Add raw pipeline data for database extraction
                rawPipelineData: progressData.data,
                questions: progressData.data.questions,
                serpResults: progressData.data.serpResults,
                classifiedResults: progressData.data.classifiedResults,
                targetDomain: progressData.data.targetDomain,
                breakdown: progressData.data.breakdown
              }
              
              console.log('📊 Complete data structure:', {
                hasDashboardData: !!dashboardData,
                hasRawData: !!progressData.data,
                hasQuestions: !!progressData.data.questions,
                hasSerpResults: !!progressData.data.serpResults,
                questionCount: progressData.data.questions?.length || 0,
                serpResultCount: Object.keys(progressData.data.serpResults || {}).length || 0,
                completeDataKeys: Object.keys(completeData)
              })
              
              console.log('🚨 CALLING onAnalysisComplete callback...')
              try {
                onAnalysisComplete(completeData)
                console.log('✅ onAnalysisComplete callback completed successfully')
              } catch (callbackError) {
                console.error('❌ Error in onAnalysisComplete callback:', callbackError)
                console.error('❌ Callback error stack:', callbackError instanceof Error ? callbackError.stack : callbackError)
              }
              
              setIsRunning(false)
              eventSource.close()
            } else if (progressData.step === 'complete') {
              console.log('⚠️ Completion event detected but no data:', progressData)
            }
          } catch (parseError) {
            console.error('❌ Failed to parse SSE event:', parseError)
            console.error('❌ Raw event data:', event.data)
            addLog('Failed to parse progress update', 'error')
          }
        }

        eventSource.onerror = (error) => {
          console.error('🚨 EventSource error:', error)
          console.log('EventSource readyState:', eventSource.readyState)
          console.log('EventSource readyState meaning:', {
            0: 'CONNECTING',
            1: 'OPEN', 
            2: 'CLOSED'
          }[eventSource.readyState])
          addLog('Connection error during analysis', 'error')
          setError('Connection lost during analysis')
          setCurrentStep('error')
          setIsRunning(false)
          eventSource.close()
        }

        eventSource.onopen = (event) => {
          console.log('✅ EventSource connection opened', event)
          console.log('EventSource readyState after open:', eventSource.readyState)
          addLog('Connected to analysis server', 'info')
        }

        // Pipeline will start automatically via EventSource GET request
        
      } catch (err) {
        console.error('Pipeline error:', err)
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
        setError(errorMessage)
        addLog(`Pipeline failed: ${errorMessage}`, 'error')
        setCurrentStep('error')
        setIsRunning(false)
        
        if (eventSourceRef.current) {
          eventSourceRef.current.close()
          eventSourceRef.current = null
        }
      }
    }

    runAEOPipeline()
  }, [isOpen, crawlUrl, onAnalysisComplete, session])

  // Generate actionable suggestions based on AEO data
  const generateAEOSuggestions = (aeoData: any) => {
    const suggestions = []
    
    // Overall score assessment
    if (aeoData.aeo_score >= 80) {
      suggestions.push({
        topic: 'Excellent Performance',
        suggestion: `Outstanding AEO score of ${aeoData.aeo_score}/100! Focus on maintaining current optimization strategies.`
      })
    } else if (aeoData.aeo_score >= 60) {
      suggestions.push({
        topic: 'Good Foundation',
        suggestion: `Solid AEO score of ${aeoData.aeo_score}/100. Target higher-volume questions to improve coverage.`
      })
    } else {
      suggestions.push({
        topic: 'Optimization Needed',
        suggestion: `AEO score of ${aeoData.aeo_score}/100 indicates room for improvement. Prioritize content optimization.`
      })
    }
    
    // Coverage-specific suggestions
    if (aeoData.coverage_owned < 0.3) {
      suggestions.push({
        topic: 'Owned Content',
        suggestion: `Only ${Math.round(aeoData.coverage_owned * 100)}% owned coverage. Create more targeted content for key search questions.`
      })
    }
    
    if (aeoData.coverage_operated < 0.1) {
      suggestions.push({
        topic: 'Operated Channels',
        suggestion: `Low operated presence (${Math.round(aeoData.coverage_operated * 100)}%). Optimize social profiles and directory listings.`
      })
    }
    
    // Share of voice suggestions
    if (aeoData.share_of_voice < 0.2) {
      suggestions.push({
        topic: 'Search Rankings',
        suggestion: `${Math.round(aeoData.share_of_voice * 100)}% share of voice. Focus on improving content quality and SEO to rank higher.`
      })
    }
    
    // Position-specific advice
    if (aeoData.metrics?.avg_owned_position > 5) {
      suggestions.push({
        topic: 'Position Improvement',
        suggestion: `Average position of ${aeoData.metrics.avg_owned_position.toFixed(1)} needs improvement. Optimize for featured snippets and direct answers.`
      })
    }
    
    return suggestions
  }

  // Transform AEO results to match existing dashboard format
  const transformToVisibilityData = (aeoData: any) => {
    return {
      overallScore: aeoData.aeo_score,
      scoreHistory: [
        { date: new Date().toISOString().split('T')[0], score: aeoData.aeo_score }
      ],
      topics: [
        { topic: 'Owned Content', score: Math.round(aeoData.coverage_owned * 100) },
        { topic: 'Operated Channels', score: Math.round(aeoData.coverage_operated * 100) },
        { topic: 'Share of Voice', score: Math.round(aeoData.share_of_voice * 100) }
      ],
      citations: {
        owned: aeoData.metrics?.owned_appearances || 0,
        operated: aeoData.metrics?.operated_appearances || 0,
        earned: aeoData.metrics?.earned_appearances || 0
      },
      competitors: [], // Not implemented yet
      suggestions: generateAEOSuggestions(aeoData),
      // Include raw AEO data for detailed breakdown
      aeoData: {
        aeo_score: aeoData.aeo_score,
        coverage_owned: aeoData.coverage_owned,
        coverage_operated: aeoData.coverage_operated,
        coverage_total: aeoData.coverage_total,
        share_of_voice: aeoData.share_of_voice,
        metrics: aeoData.metrics
      }
    }
  }

  const getProgressPercentage = () => {
    return totalSteps > 0 ? Math.round((progress / totalSteps) * 100) : 0
  }

  const getCurrentStepName = () => {
    return STEP_NAMES[currentStep as keyof typeof STEP_NAMES] || currentStep
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="relative w-full max-w-md my-auto">
        {/* Simple, minimal loading card */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6 sm:p-8">
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-[#666] hover:text-white transition-colors p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Content */}
          <div className="text-center">
            {/* Icon */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center mx-auto mb-4 sm:mb-6">
              {currentStep === 'error' ? (
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : currentStep === 'complete' ? (
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-[#333] border-t-white rounded-full animate-spin" />
              )}
        </div>
        
            {/* Status Text */}
            <h3 className="text-white font-medium text-base sm:text-lg mb-2">
              {currentStep === 'error' ? 'Analysis Failed' : 
               currentStep === 'complete' ? 'Analysis Complete' :
               'Analyzing Visibility'}
            </h3>
            
            {/* Current Step */}
            <p className="text-[#666] text-xs sm:text-sm mb-4 sm:mb-6 px-2">
              {currentStep === 'error' && error ? error :
               currentStep === 'complete' ? 'Your results are ready' :
               getCurrentStepName()}
            </p>
            
            {/* Progress */}
            {currentStep !== 'error' && currentStep !== 'complete' && (
              <div className="px-4">
                {/* Simple progress bar */}
                <div className="w-full h-1 bg-[#1a1a1a] rounded-full overflow-hidden mb-2">
            <div 
                    className="h-full bg-white rounded-full transition-all duration-500 ease-out"
              style={{ width: `${getProgressPercentage()}%` }}
            />
                </div>
                <p className="text-[#444] text-xs">
                  {getProgressPercentage()}% complete
                </p>
              </div>
            )}
          
            {/* Results Preview (Complete State) */}
          {finalResults && currentStep === 'complete' && (
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-[#1a1a1a]">
                <div className="grid grid-cols-2 gap-2 sm:gap-3 text-left">
                  <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded p-2.5 sm:p-3">
                    <div className="text-[#666] text-xs mb-1">Visibility Score</div>
                    <div className="text-white font-medium text-sm sm:text-base">{finalResults.aeo_score}/100</div>
                  </div>
                  <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded p-2.5 sm:p-3">
                    <div className="text-[#666] text-xs mb-1">Coverage</div>
                    <div className="text-white font-medium text-sm sm:text-base">
                      {Math.round(finalResults.coverage_total * 100)}%
                  </div>
                </div>
              </div>
            </div>
          )}
            </div>
        </div>
        
        {/* Minimal activity log (collapsed by default) */}
        {log.length > 0 && currentStep !== 'complete' && (
          <div className="mt-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-2.5 sm:p-3 max-h-24 sm:max-h-32 overflow-y-auto">
            <div className="text-[#444] text-xs space-y-1">
              {log.slice(-3).map((logEntry, index) => (
                <div key={index} className="truncate">
                  {logEntry}
                </div>
              ))}
            </div>
        </div>
        )}
      </div>
    </div>
  )
} 
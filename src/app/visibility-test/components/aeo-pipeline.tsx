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
          try {
            const progressData: ProgressEvent = JSON.parse(event.data)
            
            setCurrentStep(progressData.step)
            setProgress(progressData.progress)
            setTotalSteps(progressData.total)
            
            if (progressData.error) {
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
              setFinalResults(progressData.data)
              addLog('AEO Pipeline completed successfully!', 'success')
              addLog(`Final AEO Score: ${progressData.data.aeo_score}/100`, 'success')
              
              // Transform data for the dashboard
              const dashboardData = transformToVisibilityData(progressData.data)
              onAnalysisComplete(dashboardData)
              
              setIsRunning(false)
              eventSource.close()
            }
          } catch (parseError) {
            console.error('Failed to parse SSE event:', parseError)
            addLog('Failed to parse progress update', 'error')
          }
        }

        eventSource.onerror = (error) => {
          console.error('🚨 EventSource error:', error)
          console.log('EventSource readyState:', eventSource.readyState)
          addLog('Connection error during analysis', 'error')
          setError('Connection lost during analysis')
          setCurrentStep('error')
          setIsRunning(false)
          eventSource.close()
        }

        eventSource.onopen = (event) => {
          console.log('✅ EventSource connection opened', event)
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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg w-full max-w-3xl max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center border-b border-[#333] p-4">
          <div>
            <h2 className="text-white font-bold text-lg">AEO Visibility Pipeline</h2>
            <p className="text-[#999] text-sm">{getCurrentStepName()}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-[#999] hover:text-white text-xl"
          >
            ✕
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="p-4 border-b border-[#333]">
          <div className="flex justify-between text-sm text-[#999] mb-2">
            <span>Step {Math.min(progress + 1, totalSteps)} of {totalSteps}</span>
            <span>{getProgressPercentage()}%</span>
          </div>
          <div className="w-full bg-[#333] rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
          
          {/* Step indicators */}
          <div className="flex justify-between mt-3 text-xs">
            {Object.entries(STEP_NAMES).map(([key, name], index) => (
              <div 
                key={key}
                className={`flex flex-col items-center ${
                  index <= progress ? 'text-blue-400' : 'text-[#666]'
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mb-1 ${
                  index <= progress 
                    ? 'border-blue-400 bg-blue-400 text-black' 
                    : 'border-[#666]'
                }`}>
                  {index <= progress ? '✓' : index + 1}
                </div>
                <span className="text-center">{name}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          {/* Real-time Log */}
          <div className="bg-[#111] border border-[#333] p-3 rounded h-64 overflow-y-auto font-mono text-sm">
            {log.map((entry, i) => (
              <div key={i} className="mb-1">
                <span className="text-[#ccc]">{entry}</span>
              </div>
            ))}
            
            {isRunning && currentStep !== 'error' && (
              <div className="text-blue-400 animate-pulse mt-2">
                ▶ {getCurrentStepName()} in progress...
              </div>
            )}
          </div>
          
          {/* Status Display */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-[#222] p-3 rounded">
              <div className="text-[#999] text-sm mb-1">Status</div>
              <div className={`font-semibold ${
                currentStep === 'complete' ? 'text-green-400' : 
                currentStep === 'error' ? 'text-red-400' : 
                'text-blue-400'
              }`}>
                {isRunning && currentStep !== 'error' && currentStep !== 'complete' ? 'Running' :
                 currentStep === 'complete' ? 'Complete' :
                 currentStep === 'error' ? 'Failed' : 'Ready'}
              </div>
            </div>
            
            <div className="bg-[#222] p-3 rounded">
              <div className="text-[#999] text-sm mb-1">Target URL</div>
              <div className="text-white text-sm truncate">{crawlUrl}</div>
            </div>
          </div>
          
          {/* Final Results */}
          {finalResults && currentStep === 'complete' && (
            <div className="mt-4 bg-[#222] p-4 rounded">
              <h3 className="text-white mb-3 font-semibold">Final Results</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#333] p-3 rounded">
                  <div className="text-[#999] text-sm">AEO Score</div>
                  <div className="text-2xl font-bold text-green-400">
                    {finalResults.aeo_score}/100
                  </div>
                </div>
                <div className="bg-[#333] p-3 rounded">
                  <div className="text-[#999] text-sm">Owned Coverage</div>
                  <div className="text-xl font-bold text-blue-400">
                    {Math.round(finalResults.coverage_owned * 100)}%
                  </div>
                </div>
                <div className="bg-[#333] p-3 rounded">
                  <div className="text-[#999] text-sm">Share of Voice</div>
                  <div className="text-xl font-bold text-purple-400">
                    {Math.round(finalResults.share_of_voice * 100)}%
                  </div>
                </div>
                <div className="bg-[#333] p-3 rounded">
                  <div className="text-[#999] text-sm">Total Results</div>
                  <div className="text-xl font-bold text-yellow-400">
                    {finalResults.metrics?.total_results || 0}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Error details */}
          {currentStep === 'error' && error && (
            <div className="mt-4 bg-red-900/20 border border-red-900 p-3 rounded text-red-400">
              <div className="font-semibold mb-1">Analysis Failed</div>
              <div className="text-sm">{error}</div>
            </div>
          )}
        </div>
        
        <div className="border-t border-[#333] p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#333] hover:bg-[#444] text-white rounded transition-colors"
          >
            {currentStep === 'complete' ? 'View Dashboard' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  )
} 
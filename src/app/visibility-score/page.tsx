'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { AEOPipeline } from '../visibility-test/components/aeo-pipeline'
import { AEOScoreCard } from '@/app/visibility-test/components/aeo-score-card'
import { OverallAEOCard } from '@/app/visibility-test/components/overall-aeo-card'
import { DirectCitationCard } from '@/app/visibility-test/components/direct-citation-card'
import { SuggestionsCard } from '@/app/visibility-test/components/suggestions-card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

interface OnboardingData {
  email: string
  siteUrl: string
  keywords: string[]
  businessOffering: string
  knownFor: string
  competitors: string[]
}

interface VisibilityData {
  overallScore: number
  scoreHistory: { date: string; score: number }[]
  topics: { topic: string; score: number }[]
  citations: { owned: number; operated: number; earned: number }
  competitors: any[]
  suggestions: { topic: string; suggestion: string }[]
  aeoData?: {
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
}

export default function VisibilityScorePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null)
  const [visibilityData, setVisibilityData] = useState<VisibilityData | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isAnalyzerOpen, setIsAnalyzerOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState<'welcome' | 'analyzing' | 'results'>('welcome')
  const [isLoading, setIsLoading] = useState(true)
  const [isPipelineOpen, setIsPipelineOpen] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [analysisResults, setAnalysisResults] = useState(null)

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Load onboarding data on mount
  useEffect(() => {
    console.log('🚀 VISIBILITY SCORE PAGE: Component mounted')
    
    const initializePage = async () => {
      try {
        // Check authentication
        const supabase = createClient()
        if (!supabase) {
          console.log('❌ Failed to initialize Supabase client')
          setIsLoading(false)
          return
        }
        
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.log('❌ Auth error:', error)
          setIsLoading(false)
          return
        }
        
        if (!user) {
          console.log('⚠️ No authenticated user found')
          setIsLoading(false)
          return
        }
        
        console.log('✅ User authenticated:')
        console.log('👤 User email:', user.email)
        console.log('🆔 User ID:', user.id)
        
        // Get onboarding data from localStorage
        const storedData = localStorage.getItem('onboardingData')
        if (storedData) {
          try {
            const parsed = JSON.parse(storedData)
            console.log('📦 ONBOARDING DATA FOUND:')
            console.log('👤 Email:', parsed.email)
            console.log('🌐 Website:', parsed.siteUrl)
            console.log('🔍 Keywords:', parsed.keywords)
            console.log('🏢 Business Offering:', parsed.businessOffering)
            console.log('⭐ Known For:', parsed.knownFor)
            console.log('🥊 Competitors:', parsed.competitors)
            setOnboardingData(parsed)
          } catch (e) {
            console.log('❌ Failed to parse onboarding data:', e)
          }
        } else {
          console.log('⚠️ No onboarding data found in localStorage')
        }
      } catch (error) {
        console.log('❌ Page initialization error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializePage()
  }, [])

  const startAnalysis = () => {
    if (!onboardingData?.siteUrl) return
    
    console.log('🚀 Starting analysis manually from welcome screen')
    setCurrentStep('analyzing')
    setIsAnalyzing(true)
    setIsAnalyzerOpen(true)
  }

  const handleAnalysisComplete = (results: any) => {
    console.log('🎉 Analysis completed with results:', results)
    setAnalysisResults(results)
    setAnalysisComplete(true)
    setIsPipelineOpen(false)
    setCurrentStep('results')
    setIsAnalyzing(false)
    
    // Store the results as visibility data for the existing UI
    setVisibilityData(results)
    
    // Clear onboarding data now that we've used it
    localStorage.removeItem('onboardingData')
  }

  const handlePipelineClose = () => {
    console.log('🔒 Pipeline closed')
    setIsPipelineOpen(false)
    setIsAnalyzerOpen(false)
  }

  if (isLoading) {
    console.log('⏳ Page still loading...')
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) {
    console.log('🔒 Redirecting to login - no user found')
    // In a real app, redirect to login
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
        <div className="text-white">Please log in to view your visibility score.</div>
      </div>
    )
  }

  if (!onboardingData) {
    console.log('⚠️ No onboarding data - showing error state')
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
        <div className="text-white">No website data found. Please restart the onboarding process.</div>
      </div>
    )
  }

  console.log('🎯 About to render AEO Pipeline with website:', onboardingData.siteUrl)

  // Auto-start analysis when page loads
  useEffect(() => {
    if (onboardingData && !isPipelineOpen && !analysisComplete) {
      console.log('🎬 Auto-starting analysis for:', onboardingData.siteUrl)
      setIsPipelineOpen(true)
    }
  }, [onboardingData, isPipelineOpen, analysisComplete])

  return (
    <div className="min-h-screen bg-[#0c0c0c] flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-6 sm:py-8 overflow-y-auto">
        <div className="w-full max-w-4xl">
          {currentStep === 'welcome' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 px-2">
                  Welcome to Split! 🎉
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-4 sm:mb-6 px-4">
                  Your account has been created successfully. Now let's analyze your AI visibility.
                </p>
                <div className="bg-[#1a1a1a] border border-[#333] p-4 sm:p-6 rounded-lg mb-6 sm:mb-8 mx-2 sm:mx-0">
                  <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">We'll analyze:</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-left">
                    <div>
                      <span className="text-gray-400 text-sm">Website:</span>
                      <div className="text-white font-mono text-sm sm:text-base break-all">{onboardingData.siteUrl}</div>
                    </div>
                    {onboardingData.keywords.length > 0 && (
                      <div>
                        <span className="text-gray-400 text-sm">Keywords:</span>
                        <div className="text-white text-sm sm:text-base">{onboardingData.keywords.join(', ')}</div>
                      </div>
                    )}
                    {onboardingData.businessOffering && (
                      <div className="sm:col-span-2">
                        <span className="text-gray-400 text-sm">Business:</span>
                        <div className="text-white text-sm sm:text-base">{onboardingData.businessOffering}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Button
                onClick={startAnalysis}
                className="bg-white text-black hover:bg-gray-100 h-10 sm:h-11 md:h-12 px-6 sm:px-8 text-sm sm:text-base md:text-lg font-medium"
                disabled={isAnalyzing}
              >
                {isAnalyzing ? 'Starting Analysis...' : 'Get My AI Visibility Score'}
              </Button>

              <p className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4 px-4">
                This will take 2-3 minutes to analyze your website's AI visibility across major search engines.
              </p>
            </motion.div>
          )}

          {currentStep === 'analyzing' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center px-4"
            >
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4">
                Analyzing Your AI Visibility...
              </h1>
              <p className="text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base">
                Our AI is crawling your website and testing how it appears in AI search results.
              </p>
              <div className="animate-pulse text-blue-400 text-sm sm:text-base">
                Analysis in progress...
              </div>
            </motion.div>
          )}

          {currentStep === 'results' && visibilityData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 sm:space-y-6 px-2 sm:px-0"
            >
              <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 px-2">
                  Your AI Visibility Score
                </h1>
                <p className="text-gray-300 text-sm sm:text-base px-4">
                  Here's how your website performs in AI search results
                </p>
              </div>

              {/* AEO Score Card - Full width when available */}
              {visibilityData.aeoData && (
                <div className="mb-4 sm:mb-6">
                  <AEOScoreCard data={visibilityData.aeoData} />
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                <OverallAEOCard history={visibilityData.scoreHistory} />
                <DirectCitationCard data={visibilityData.citations} />
              </div>

              <SuggestionsCard suggestions={visibilityData.suggestions} />

              <div className="text-center pt-4 sm:pt-6 pb-4">
                <Button
                  onClick={() => router.push('/dashboard')}
                  className="bg-white text-black hover:bg-gray-100 h-10 sm:h-11 md:h-12 px-6 sm:px-8 text-sm sm:text-base md:text-lg font-medium"
                >
                  Continue to Dashboard
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* AEO Pipeline Modal */}
      <AEOPipeline 
        isOpen={isPipelineOpen || isAnalyzerOpen}
        crawlUrl={onboardingData?.siteUrl || ''}
        onClose={handlePipelineClose}
        onAnalysisComplete={handleAnalysisComplete}
      />
    </div>
  )
} 
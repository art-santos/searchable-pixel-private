'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { AEOPipeline } from '@/app/visibility-test/components/aeo-pipeline'
import { AEOScoreCard } from '@/app/visibility-test/components/aeo-score-card'
import { OverallAEOCard } from '@/app/visibility-test/components/overall-aeo-card'
import { DirectCitationCard } from '@/app/visibility-test/components/direct-citation-card'
import { SuggestionsCard } from '@/app/visibility-test/components/suggestions-card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

interface OnboardingData {
  siteUrl: string
  email: string
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

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Load onboarding data on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('onboardingData')
      if (data) {
        setOnboardingData(JSON.parse(data))
      } else {
        // No onboarding data, redirect to start
        router.push('/start')
      }
    }
  }, [router])

  const startAnalysis = () => {
    if (!onboardingData?.siteUrl) return
    
    setCurrentStep('analyzing')
    setIsAnalyzing(true)
    setIsAnalyzerOpen(true)
  }

  const handleAnalysisComplete = (data: VisibilityData) => {
    setVisibilityData(data)
    setCurrentStep('results')
    setIsAnalyzing(false)
    
    // Clear onboarding data now that we've used it
    localStorage.removeItem('onboardingData')
  }

  const closeAnalyzer = () => {
    setIsAnalyzerOpen(false)
  }

  const goToDashboard = () => {
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0c0c0c]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-white" />
      </div>
    )
  }

  if (!onboardingData) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0c0c0c]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-white" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl">
          {currentStep === 'welcome' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-4">
                  Welcome to Split! 🎉
                </h1>
                <p className="text-xl text-gray-300 mb-6">
                  Your account has been created successfully. Now let's analyze your AI visibility.
                </p>
                <div className="bg-[#1a1a1a] border border-[#333] p-6 rounded-lg mb-8">
                  <h2 className="text-lg font-semibold text-white mb-4">We'll analyze:</h2>
                  <div className="grid md:grid-cols-2 gap-4 text-left">
                    <div>
                      <span className="text-gray-400">Website:</span>
                      <div className="text-white font-mono">{onboardingData.siteUrl}</div>
                    </div>
                    {onboardingData.keywords.length > 0 && (
                      <div>
                        <span className="text-gray-400">Keywords:</span>
                        <div className="text-white">{onboardingData.keywords.join(', ')}</div>
                      </div>
                    )}
                    {onboardingData.businessOffering && (
                      <div className="md:col-span-2">
                        <span className="text-gray-400">Business:</span>
                        <div className="text-white">{onboardingData.businessOffering}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Button
                onClick={startAnalysis}
                className="bg-white text-black hover:bg-gray-100 h-12 px-8 text-lg font-medium"
                disabled={isAnalyzing}
              >
                {isAnalyzing ? 'Starting Analysis...' : 'Get My AI Visibility Score'}
              </Button>

              <p className="text-sm text-gray-500 mt-4">
                This will take 2-3 minutes to analyze your website's AI visibility across major search engines.
              </p>
            </motion.div>
          )}

          {currentStep === 'analyzing' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-3xl font-bold text-white mb-4">
                Analyzing Your AI Visibility...
              </h1>
              <p className="text-gray-300 mb-8">
                Our AI is crawling your website and testing how it appears in AI search results.
              </p>
              <div className="animate-pulse text-blue-400">
                Analysis in progress...
              </div>
            </motion.div>
          )}

          {currentStep === 'results' && visibilityData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                  Your AI Visibility Score
                </h1>
                <p className="text-gray-300">
                  Here's how your website performs in AI search results
                </p>
              </div>

              {/* AEO Score Card - Full width when available */}
              {visibilityData.aeoData && (
                <div className="mb-6">
                  <AEOScoreCard data={visibilityData.aeoData} />
                </div>
              )}

              <div className="grid xl:grid-cols-2 grid-cols-1 gap-6">
                <OverallAEOCard history={visibilityData.scoreHistory} />
                <DirectCitationCard data={visibilityData.citations} />
              </div>

              <SuggestionsCard suggestions={visibilityData.suggestions} />

              <div className="text-center pt-6">
                <Button
                  onClick={goToDashboard}
                  className="bg-white text-black hover:bg-gray-100 h-12 px-8 text-lg font-medium"
                >
                  Continue to Dashboard
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* AEO Pipeline Modal */}
      {onboardingData && (
        <AEOPipeline 
          isOpen={isAnalyzerOpen}
          crawlUrl={onboardingData.siteUrl}
          onClose={closeAnalyzer}
          onAnalysisComplete={handleAnalysisComplete}
        />
      )}
    </div>
  )
} 
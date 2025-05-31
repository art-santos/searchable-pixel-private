'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AEOPipeline } from '@/app/visibility-test/components/aeo-pipeline'
import { AEOScoreCard } from '@/app/visibility-test/components/aeo-score-card'
import { OverallAEOCard } from '@/app/visibility-test/components/overall-aeo-card'
import { DirectCitationCard } from '@/app/visibility-test/components/direct-citation-card'
import { SuggestionsCard } from '@/app/visibility-test/components/suggestions-card'
import { saveOnboardingData, saveAeoQuestions, saveAeoResults, updateAeoScore, saveCompleteAeoAnalysis } from '@/lib/onboarding/database'
import type { OnboardingData } from '@/lib/onboarding/database'
import { debugOnboardingState } from '@/lib/debug/onboarding-debug'
import '@/lib/debug/aeo-debug' // Import AEO debug utilities
import { 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Copy,
  Check,
  X,
  Plus,
  Zap,
  AlertTriangle,
  ExternalLink
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface OnboardingOverlayProps {
  children: React.ReactNode
  onComplete?: () => void
}

type OnboardingStep = 'workspace' | 'analytics' | 'content' | 'confirm' | 'cms' | 'scanning' | 'results' | 'paywall'

interface WorkspaceData {
  name: string
  workspaceName: string
}

interface AnalyticsData {
  provider: 'vercel' | 'ga4' | 'plausible' | null
  domain: string
  isConnected: boolean
  isSkipped: boolean
}

interface ContentData {
  keywords: string[]
  businessOffering: string
  knownFor: string
  competitors: string[]
}

interface CmsData {
  cms: string
}

const providers = [
  { 
    id: 'vercel', 
    name: 'Vercel Analytics', 
    description: 'Web vitals & traffic data',
    setupUrl: 'https://vercel.com/analytics',
    instructions: 'Go to your Vercel dashboard → Analytics → Enable for your project'
  },
  { 
    id: 'ga4', 
    name: 'Google Analytics 4', 
    description: 'Comprehensive user insights',
    setupUrl: 'https://analytics.google.com',
    instructions: 'Create a GA4 property → Get your Measurement ID → Add tracking code'
  },
  { 
    id: 'plausible', 
    name: 'Plausible Analytics', 
    description: 'Privacy-focused analytics',
    setupUrl: 'https://plausible.io',
    instructions: 'Add your domain → Get tracking script → Install on your site'
  }
]

const cmsOptions = [
  { id: 'nextjs', name: 'Next.js Pages' },
  { id: 'notion', name: 'Notion' },
  { id: 'contentful', name: 'Contentful' },
  { id: 'wordpress', name: 'WordPress' },
  { id: 'webflow', name: 'Webflow' },
  { id: 'ghost', name: 'Ghost' },
  { id: 'custom', name: 'Custom/Other' }
]

export function OnboardingOverlay({ children, onComplete }: OnboardingOverlayProps) {
  const { user } = useAuth()
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('workspace')
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showSkipWarning, setShowSkipWarning] = useState(false)
  const [visibilityScore, setVisibilityScore] = useState(0)
  const [isAnnual, setIsAnnual] = useState(false)
  const [isPipelineOpen, setIsPipelineOpen] = useState(false)
  const [visibilityData, setVisibilityData] = useState<any | null>(null)

  // Database tracking
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [runId, setRunId] = useState<string | null>(null)

  // Form data
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData>({
    name: '',
    workspaceName: ''
  })
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    provider: null,
    domain: '',
    isConnected: false,
    isSkipped: false
  })
  
  const [contentData, setContentData] = useState<ContentData>({
    keywords: [],
    businessOffering: '',
    knownFor: '',
    competitors: [],
  })

  const [cmsData, setCmsData] = useState<CmsData>({
    cms: ''
  })

  const [newKeyword, setNewKeyword] = useState('')
  const [newCompetitor, setNewCompetitor] = useState('')

  // Check if user just signed up and load their onboarding data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Debug onboarding state
      console.log('🔍 Onboarding Overlay useEffect triggered')
      debugOnboardingState()
      
      // MIGRATION: Clear old simple onboarding completion flag
      // This ensures users who completed the simple onboarding get the full experience
      const hasSimpleOnboardingFlag = localStorage.getItem('onboardingCompleted')
      if (hasSimpleOnboardingFlag) {
        // Check if this is from the simple onboarding by seeing if there's no onboarding data
        // If there's no proper onboarding data, they likely only did the simple workspace setup
        const hasProperOnboardingData = localStorage.getItem('onboardingData')
        if (!hasProperOnboardingData) {
          console.log('🔄 Clearing simple onboarding flag - user needs full onboarding experience')
          localStorage.removeItem('onboardingCompleted')
        }
      }
      
      const justSignedUp = sessionStorage.getItem('justSignedUp')
      const justVerified = document.cookie.includes('justVerified=true')
      const onboardingData = localStorage.getItem('onboardingData')
      const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted') // Check again after potential clearing
      const onboardingInProgress = sessionStorage.getItem('onboardingInProgress')
      
      console.log('🎯 Onboarding Flow Decision Variables:', {
        justSignedUp,
        justVerified,
        hasOnboardingData: !!onboardingData,
        hasCompletedOnboarding,
        onboardingInProgress,
        user: !!user
      })
      
      // If user has already completed onboarding, don't show overlay
      if (hasCompletedOnboarding) {
        console.log('✅ User has completed onboarding - hiding overlay')
        setShowOnboarding(false)
        return
      }
      
      // If user is resuming an interrupted onboarding session and has data
      if (onboardingInProgress && onboardingData) {
        console.log('🔄 Resuming interrupted onboarding session...')
        const data = JSON.parse(onboardingData)
        
        // Pre-populate the form data
        setWorkspaceData({
          name: data.email?.split('@')[0] || '',
          workspaceName: data.siteUrl?.replace(/^https?:\/\//, '').replace(/^www\./, '') || ''
        })
        
        setAnalyticsData({
          provider: data.analyticsProvider || null,
          domain: data.siteUrl || '',
          isConnected: data.isAnalyticsConnected || false,
          isSkipped: data.isAnalyticsSkipped || true
        })
        
        setContentData({
          keywords: data.keywords || [],
          businessOffering: data.businessOffering || '',
          knownFor: data.knownFor || '',
          competitors: data.competitors || []
        })
        
        setCmsData({
          cms: data.cms || 'nextjs'
        })
        
        // Resume at scanning step only if all required data is present
        if (data.workspaceName && data.siteUrl && (data.keywords?.length > 0 || data.businessOffering)) {
          console.log('📊 Resuming at scanning step with complete data')
          setCurrentStep('scanning')
        } else {
          // Start from beginning if data is incomplete
          console.log('⚠️ Incomplete data - starting from workspace step')
          setCurrentStep('workspace')
        }
        
        // Clear resumption flag
        sessionStorage.removeItem('onboardingInProgress')
      } else if (justSignedUp || justVerified) {
        // User just signed up or verified email - start fresh onboarding
        console.log('🚀 Starting fresh onboarding for new user...')
        setCurrentStep('workspace')
        setShowOnboarding(true) // Explicitly show onboarding
        
        // Clear any existing onboarding data for fresh start
        localStorage.removeItem('onboardingData')
        sessionStorage.removeItem('onboardingInProgress')
        
        // Clear the signup flags
        sessionStorage.removeItem('justSignedUp')
        if (justVerified) {
          document.cookie = 'justVerified=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        }
      } else {
        // Default case - start fresh onboarding
        console.log('🎯 Starting default onboarding flow...')
        setCurrentStep('workspace')
        setShowOnboarding(true) // Explicitly show onboarding
      }
      
      console.log('🎬 Final onboarding state:', {
        showOnboarding,
        currentStep
      })
    }
  }, [])

  // Progress calculation
  useEffect(() => {
    switch (currentStep) {
      case 'workspace':
        setProgress(16)
        break
      case 'analytics':
        setProgress(32)
        break
      case 'content':
        setProgress(48)
        break
      case 'confirm':
        setProgress(64)
        break
      case 'cms':
        setProgress(80)
        break
      case 'scanning':
        setProgress(100)
        break
    }
  }, [currentStep])

  // Trigger real AEO pipeline when entering the scanning step
  useEffect(() => {
    if (currentStep === 'scanning') {
      setIsPipelineOpen(true)
    }
  }, [currentStep])

  // Dev mode: Exit onboarding with middle mouse button
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1) { // Middle mouse button
        e.preventDefault()
        setShowOnboarding(false)
        onComplete?.()
      }
    }

    if (showOnboarding) {
      document.addEventListener('mousedown', handleMouseDown)
      return () => document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [showOnboarding, onComplete])

  const handleNext = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Save current progress for resumption
    const progressData = {
      workspaceName: workspaceData.workspaceName,
      name: workspaceData.name,
      analyticsProvider: analyticsData.provider,
      siteUrl: analyticsData.domain,
      isAnalyticsConnected: analyticsData.isConnected,
      isAnalyticsSkipped: analyticsData.isSkipped,
      keywords: contentData.keywords,
      businessOffering: contentData.businessOffering,
      knownFor: contentData.knownFor,
      competitors: contentData.competitors,
      cms: cmsData.cms,
      currentStep: currentStep
    }
    
    switch (currentStep) {
      case 'workspace':
        // Save progress and move to analytics
        localStorage.setItem('onboardingData', JSON.stringify(progressData))
        sessionStorage.setItem('onboardingInProgress', 'true')
        setCurrentStep('analytics')
        break
      case 'analytics':
        // Save progress and move to content
        localStorage.setItem('onboardingData', JSON.stringify(progressData))
        setCurrentStep('content')
        break
      case 'content':
        // Save progress and move to confirm
        localStorage.setItem('onboardingData', JSON.stringify(progressData))
        setCurrentStep('confirm')
        break
      case 'confirm':
        // Save progress and move to CMS
        localStorage.setItem('onboardingData', JSON.stringify(progressData))
        setCurrentStep('cms')
        break
      case 'cms':
        // Save data to database before starting the scan
        if (user) {
          try {
            const onboardingData: OnboardingData = {
              workspaceName: workspaceData.workspaceName,
              userEmail: user.email || '',
              analyticsProvider: analyticsData.provider,
              domain: analyticsData.domain,
              isAnalyticsConnected: analyticsData.isConnected,
              keywords: contentData.keywords,
              businessOffering: contentData.businessOffering,
              knownFor: contentData.knownFor,
              competitors: contentData.competitors,
              cms: cmsData.cms,
            }

            console.log('💾 Saving onboarding data to database...')
            const result = await saveOnboardingData(user, onboardingData)
            
            if (result.success) {
              console.log('✅ Onboarding data saved successfully')
              setCompanyId(result.companyId || null)
              setRunId(result.runId || null)
            } else {
              console.error('❌ Failed to save onboarding data:', result.error)
              // Continue with scan even if database save fails
            }
          } catch (error) {
            console.error('❌ Error saving onboarding data:', error)
            // Continue with scan even if database save fails
          }
        }
        
        // Mark that we're starting the analysis phase
        sessionStorage.setItem('onboardingInProgress', 'scanning')
        setCurrentStep('scanning')
        break
    }
    
    setIsLoading(false)
  }

  const handleBack = () => {
    switch (currentStep) {
      case 'analytics':
        setCurrentStep('workspace')
        break
      case 'content':
        setCurrentStep('analytics')
        break
      case 'confirm':
        setCurrentStep('content')
        break
      case 'cms':
        setCurrentStep('confirm')
        break
    }
  }

  const handleAnalyticsConnect = (provider: 'vercel' | 'ga4' | 'plausible') => {
    setAnalyticsData(prev => ({ ...prev, provider }))
  }

  const handleDomainCheck = () => {
    if (analyticsData.domain) {
      setTimeout(() => {
        setAnalyticsData(prev => ({ ...prev, isConnected: true }))
      }, 1000)
    }
  }

  const handleSkipAnalytics = () => {
    if (showSkipWarning) {
      setAnalyticsData(prev => ({ ...prev, isSkipped: true }))
      setShowSkipWarning(false)
    } else {
      setShowSkipWarning(true)
    }
  }

  const addKeyword = () => {
    if (newKeyword.trim()) {
      setContentData(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }))
      setNewKeyword('')
    }
  }

  const removeKeyword = (index: number) => {
    setContentData(prev => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index)
    }))
  }

  const addCompetitor = () => {
    if (newCompetitor.trim()) {
      setContentData(prev => ({
        ...prev,
        competitors: [...prev.competitors, newCompetitor.trim()]
      }))
      setNewCompetitor('')
    }
  }

  const handlePipelineComplete = async (data: any) => {
    console.log('🎯 Pipeline completed with data:', data)
    console.log('🔍 Pipeline data structure:', {
      hasAeoData: !!data.aeoData,
      hasBreakdown: !!data.aeoData?.breakdown,
      hasQuestions: !!data.aeoData?.breakdown?.by_question,
      hasResults: !!data.results,
      hasQuestionsProp: !!data.questions,
      overallScore: data.overallScore,
      aeoScore: data.aeoData?.aeo_score,
      questionCount: data.aeoData?.breakdown?.by_question?.length || 0,
      resultsCount: data.results?.length || 0,
      dataKeys: Object.keys(data),
      aeoDataKeys: data.aeoData ? Object.keys(data.aeoData) : []
    })
    
    // 🚨 CRITICAL DEBUG: Check if we have the required data for saving
    console.log('🔍 CRITICAL DEBUG - Required Data Check:')
    console.log('  - runId exists:', !!runId)
    console.log('  - runId value:', runId)
    console.log('  - user exists:', !!user)
    console.log('  - user.id:', user?.id)
    console.log('  - data exists:', !!data)
    console.log('  - Will attempt database save:', !!(runId && user))
    
    // Save the complete AEO analysis to database if we have the run ID
    if (runId && user) {
      try {
        console.log('💾 🚨 ATTEMPTING COMPLETE AEO ANALYSIS SAVE 🚨')
        console.log('📊 Save parameters:', {
          runId,
          userId: user.id,
          dataType: typeof data,
          dataKeys: Object.keys(data)
        })
        
        const analysisResult = await saveCompleteAeoAnalysis(runId, data, user.id)
        
        console.log('📋 Save result received:', analysisResult)
        
        if (analysisResult.success) {
          console.log('✅ 🎉 Complete AEO analysis saved successfully! 🎉')
        } else {
          console.error('❌ 🚨 Failed to save AEO analysis:', analysisResult.error)
          console.error('🔍 Save failure details:', {
            success: analysisResult.success,
            error: analysisResult.error,
            runId,
            userId: user.id
          })
        }
      } catch (error) {
        console.error('❌ 🚨 EXCEPTION during AEO analysis save:', error)
        console.error('🔍 Exception details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          runId,
          userId: user.id
        })
      }
    } else {
      console.error('❌ 🚨 MISSING REQUIRED DATA for saving AEO analysis:')
      console.error('🔍 Missing data analysis:', {
        hasRunId: !!runId,
        hasUser: !!user,
        runId,
        userId: user?.id,
        userEmail: user?.email,
        reason: !runId ? 'No runId' : !user ? 'No user' : 'Unknown'
      })
    }
    
    // Clear onboarding progress tracking since analysis is complete
    sessionStorage.removeItem('onboardingInProgress')
    localStorage.removeItem('onboardingData')
    
    // Set results data and move to results step
    setVisibilityData(data)
    setVisibilityScore(data.overallScore ?? data.aeoData?.aeo_score ?? 0)
    setIsPipelineOpen(false)
    setCurrentStep('results')
  }

  const handlePipelineClose = () => {
    setIsPipelineOpen(false)
  }

  const removeCompetitor = (index: number) => {
    setContentData(prev => ({
      ...prev,
      competitors: prev.competitors.filter((_, i) => i !== index)
    }))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 'workspace':
        return workspaceData.name && workspaceData.workspaceName
      case 'analytics':
        return (analyticsData.provider && analyticsData.domain && analyticsData.isConnected) || analyticsData.isSkipped
      case 'content':
        return contentData.keywords.length > 0 || contentData.businessOffering || contentData.knownFor
      case 'confirm':
        return true // Always can proceed from confirmation
      case 'cms':
        return cmsData.cms
      case 'results':
        return true // Always can proceed from results to plans
      default:
        return false
    }
  }

  if (!showOnboarding) {
    return <>{children}</>
  }

  const selectedProvider = providers.find(p => p.id === analyticsData.provider)
  const isContentStep = currentStep === 'content'
  const isWideStep = currentStep === 'paywall'

  return (
    <div className="fixed inset-0 z-50">
      {/* Dashboard Content (normal) */}
      <div className="absolute inset-0">
        {children}
      </div>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/95 backdrop-blur-sm z-40" />

      {/* Onboarding Modal */}
      <div className="relative z-50 flex items-center justify-center min-h-screen p-6">
        <div className={`w-full ${isWideStep ? 'max-w-6xl' : isContentStep ? 'max-w-2xl' : 'max-w-md'}`}>
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-white" />
                <span className="text-sm text-white font-medium">Setup</span>
              </div>
              <span className="text-xs text-[#666] font-mono">{progress}%</span>
            </div>
            <div className="w-full h-px bg-[#1a1a1a]">
              <motion.div 
                className="h-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {/* Step 1: Workspace */}
            {currentStep === 'workspace' && (
              <motion.div
                key="workspace"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-[#0c0c0c] border border-[#1a1a1a] p-6"
              >
                <div className="mb-6">
                  <h2 className="text-lg font-medium text-white mb-1">Create workspace</h2>
                  <p className="text-sm text-[#666]">Set up your account and workspace</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-[#888] mb-2">Your name</label>
                    <Input
                      value={workspaceData.name}
                      onChange={(e) => setWorkspaceData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="John Doe"
                      className="bg-[#1a1a1a] border-[#333] text-white h-9 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-[#888] mb-2">Workspace name</label>
                    <Input
                      value={workspaceData.workspaceName}
                      onChange={(e) => setWorkspaceData(prev => ({ ...prev, workspaceName: e.target.value }))}
                      placeholder="My Company"
                      className="bg-[#1a1a1a] border-[#333] text-white h-9 text-sm"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Analytics */}
            {currentStep === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-[#0c0c0c] border border-[#1a1a1a] p-6"
              >
                <div className="mb-6">
                  <h2 className="text-lg font-medium text-white mb-1">Connect analytics</h2>
                  <p className="text-sm text-[#666]">Connect your analytics to track visibility</p>
                </div>

                {!analyticsData.isSkipped && (
                  <>
                    <div className="space-y-2 mb-6">
                      {providers.map((provider) => (
                        <button
                          key={provider.id}
                          onClick={() => handleAnalyticsConnect(provider.id as any)}
                          className={`w-full p-3 border text-left text-sm transition-colors ${
                            analyticsData.provider === provider.id
                              ? 'border-white bg-[#1a1a1a] text-white'
                              : 'border-[#333] hover:border-[#444] text-[#ccc]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{provider.name}</div>
                              <div className="text-xs text-[#666]">{provider.description}</div>
                            </div>
                            {analyticsData.provider === provider.id && analyticsData.isConnected && (
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>

                    {analyticsData.provider && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4"
                      >
                        <div>
                          <label className="block text-xs text-[#888] mb-2">Domain</label>
                          <div className="flex gap-2">
                            <Input
                              value={analyticsData.domain}
                              onChange={(e) => setAnalyticsData(prev => ({ ...prev, domain: e.target.value }))}
                              placeholder="yoursite.com"
                              className="bg-[#1a1a1a] border-[#333] text-white h-9 text-sm flex-1"
                            />
                            <Button
                              onClick={handleDomainCheck}
                              variant="outline"
                              className="border-[#333] hover:border-[#444] h-9 px-3 text-xs"
                              disabled={!analyticsData.domain}
                            >
                              {analyticsData.isConnected ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : (
                                'Verify'
                              )}
                            </Button>
                          </div>
                        </div>

                        {selectedProvider && (
                          <div className="bg-[#1a1a1a] border border-[#333] p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-[#888]">Setup guide</span>
                              <a 
                                href={selectedProvider.setupUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-white hover:text-[#ccc] flex items-center gap-1"
                              >
                                Open {selectedProvider.name}
                                <ExternalLink className="w-2 h-2" />
                              </a>
                            </div>
                            <p className="text-xs text-[#ccc] leading-relaxed">
                              {selectedProvider.instructions}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Skip Warning */}
                    {showSkipWarning && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-[#1a1a1a] border border-[#333] p-3 mb-4"
                      >
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-[#888] mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-xs text-white font-medium mb-1">Are you sure?</div>
                            <div className="text-xs text-[#666] leading-relaxed mb-3">
                              Without analytics, you'll have limited visibility insights. You can add this later in settings.
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={handleSkipAnalytics}
                                className="bg-[#333] hover:bg-[#444] text-white h-7 px-2 text-xs"
                              >
                                Skip anyway
                              </Button>
                              <Button
                                onClick={() => setShowSkipWarning(false)}
                                variant="ghost"
                                className="text-[#666] hover:text-white h-7 px-2 text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}

                {analyticsData.isSkipped && (
                  <div className="bg-[#1a1a1a] border border-[#333] p-4 text-center">
                    <div className="text-sm text-[#888] mb-1">Analytics skipped</div>
                    <div className="text-xs text-[#666]">You can connect analytics later in settings</div>
                  </div>
                )}

                {/* Skip Button */}
                {!analyticsData.isSkipped && !showSkipWarning && (
                  <div className="mt-6 pt-4 border-t border-[#1a1a1a]">
                    <button 
                      onClick={handleSkipAnalytics}
                      className="text-[#666] text-xs hover:text-white transition-colors"
                    >
                      Skip for now
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Content (Enhanced) */}
            {currentStep === 'content' && (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-[#0c0c0c] border border-[#1a1a1a] p-8"
              >
                <div className="mb-8">
                  <h2 className="text-xl font-medium text-white mb-2">Describe your content strategy</h2>
                  <p className="text-sm text-[#666]">Help our AI understand your business and content goals</p>
                </div>

                <div className="space-y-6">
                  {/* Keywords & Terms */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Keywords & terms you want to rank for
                    </label>
                    <p className="text-xs text-[#888] mb-3">What search terms should your business appear for?</p>
                    <div className="flex gap-2 mb-3">
                      <Input
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        placeholder="e.g., AI automation, sales tools..."
                        className="bg-[#1a1a1a] border-[#333] text-white h-9 text-sm flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                      />
                      <Button
                        onClick={addKeyword}
                        size="sm"
                        variant="outline"
                        className="border-[#333] hover:border-[#444] h-9 px-3"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {contentData.keywords.map((keyword, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 bg-[#1a1a1a] border border-[#333] px-2 py-1"
                        >
                          <span className="text-white text-sm">{keyword}</span>
                          <button
                            onClick={() => removeKeyword(index)}
                            className="text-[#666] hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Business Offering */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      What does your business offer/provide?
                    </label>
                    <p className="text-xs text-[#888] mb-3">Describe your main products, services, or solutions</p>
                    <Textarea
                      value={contentData.businessOffering}
                      onChange={(e) => setContentData(prev => ({ ...prev, businessOffering: e.target.value }))}
                      placeholder="We provide AI-powered sales automation tools that help B2B companies scale their outbound efforts..."
                      className="bg-[#1a1a1a] border-[#333] text-white text-sm min-h-[80px] resize-none"
                    />
                  </div>

                  {/* What to be known for */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      What do you want to be known for?
                    </label>
                    <p className="text-xs text-[#888] mb-3">Your unique value proposition or market positioning</p>
                    <Textarea
                      value={contentData.knownFor}
                      onChange={(e) => setContentData(prev => ({ ...prev, knownFor: e.target.value }))}
                      placeholder="The most intuitive AI sales platform that actually works for small teams..."
                      className="bg-[#1a1a1a] border-[#333] text-white text-sm min-h-[60px] resize-none"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3.5: Confirm & Launch Visibility Scan */}
            {currentStep === 'confirm' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-[#0c0c0c] border border-[#1a1a1a] p-6"
              >
                <div className="mb-6">
                  <h2 className="text-lg font-medium text-white mb-1">Launch Visibility Scan</h2>
                  <p className="text-sm text-[#666]">Confirm your details before we analyze your AI visibility</p>
                </div>

                <div className="space-y-6">
                  {/* Primary URL */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Primary URL</label>
                    <Input
                      value={analyticsData.domain || 'yoursite.com'}
                      onChange={(e) => setAnalyticsData(prev => ({ ...prev, domain: e.target.value }))}
                      className="bg-[#1a1a1a] border-[#333] text-white h-9 text-sm"
                      placeholder="yoursite.com"
                    />
                  </div>

                  {/* Content Focus */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Content Focus</label>
                    <div className="bg-[#1a1a1a] border border-[#333] p-3 text-sm text-[#ccc]">
                      {contentData.keywords.length > 0 && (
                        <div className="mb-2">
                          <span className="text-white">Keywords: </span>
                          {contentData.keywords.slice(0, 3).join(', ')}
                          {contentData.keywords.length > 3 && ` +${contentData.keywords.length - 3} more`}
                        </div>
                      )}
                      {contentData.businessOffering && (
                        <div className="text-[#888] text-xs">
                          {contentData.businessOffering.slice(0, 100)}
                          {contentData.businessOffering.length > 100 && '...'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Competitors */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Competitors (optional)</label>
                    <div className="flex gap-2 mb-3">
                      <Input
                        value={newCompetitor}
                        onChange={(e) => setNewCompetitor(e.target.value)}
                        placeholder="competitor.com"
                        className="bg-[#1a1a1a] border-[#333] text-white h-9 text-sm flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && addCompetitor()}
                      />
                      <Button
                        onClick={addCompetitor}
                        size="sm"
                        variant="outline"
                        className="border-[#333] hover:border-[#444] h-9 px-3"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {contentData.competitors.map((competitor, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 bg-[#1a1a1a] border border-[#333] px-2 py-1"
                        >
                          <span className="text-white text-sm">{competitor}</span>
                          <button
                            onClick={() => removeCompetitor(index)}
                            className="text-[#666] hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: CMS */}
            {currentStep === 'cms' && (
              <motion.div
                key="cms"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-[#0c0c0c] border border-[#1a1a1a] p-6"
              >
                <div className="mb-6">
                  <h2 className="text-lg font-medium text-white mb-1">Content management</h2>
                  <p className="text-sm text-[#666]">What do you use to manage your content?</p>
                </div>

                <div>
                  <label className="block text-xs text-[#888] mb-3">Content Management System</label>
                  <div className="grid grid-cols-2 gap-2">
                    {cmsOptions.map((cms) => (
                      <button
                        key={cms.id}
                        onClick={() => setCmsData({ cms: cms.id })}
                        className={`p-3 border text-sm transition-colors ${
                          cmsData.cms === cms.id
                            ? 'border-white bg-[#1a1a1a] text-white'
                            : 'border-[#333] hover:border-[#444] text-[#ccc]'
                        }`}
                      >
                        {cms.name}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-[#666] mt-2">This helps us set up content export and publishing workflows.</p>
                </div>
              </motion.div>
            )}

            {/* Step 5: Scanning - real pipeline runs in background */}
            {currentStep === 'scanning' && (
              <motion.div
                key="scanning"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-[#0c0c0c] border border-[#1a1a1a] p-6 text-center"
              >
                <h2 className="text-lg font-medium text-white mb-2">Launching Visibility Scan...</h2>
                <p className="text-sm text-[#666]">Connecting to analysis pipeline</p>
              </motion.div>
            )}

            {/* Step 6: Results with real data */}
            {currentStep === 'results' && visibilityData && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-[#0c0c0c] border border-[#1a1a1a] p-6"
              >
                <div className="mb-8 text-center">
                  <h2 className="text-xl font-medium text-white mb-2">Your AI Visibility Score</h2>
                  <p className="text-sm text-[#666]">Based on analysis across 100+ AI queries</p>
                </div>

                <div className="mb-8">
                  <AEOScoreCard data={visibilityData.aeoData} />
                </div>

                <div className="text-center mb-6">
                  <p className="text-sm text-[#ccc] mb-4">
                    Upgrade to <span className="text-white">Visibility</span>, <span className="text-white">Plus</span>, or <span className="text-white">Pro</span> to unlock your full breakdown, see your citations, view competitive benchmarking and autonomously raise your site visibility in LLMs.
                  </p>
                </div>

              </motion.div>
            )}

            {/* Step 7: Paywall */}
            {currentStep === 'paywall' && (
              <motion.div
                key="paywall"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-[#0c0c0c] border border-[#1a1a1a] p-8"
              >
                <div className="mb-8 text-center">
                  <h2 className="text-2xl font-medium text-white mb-2">
                    Your baseline score is {visibilityScore} / 100 — nice start!
                  </h2>
                  <p className="text-sm text-[#666]">
                    See why you scored that, spy on competitors, and auto-generate content to climb the rankings.
                  </p>
                </div>

                {/* Pricing Toggle */}
                <div className="flex items-center justify-center mb-8">
                  <span className={`text-sm mr-3 ${!isAnnual ? 'text-white' : 'text-[#666]'}`}>Monthly</span>
                  <button
                    onClick={() => setIsAnnual(!isAnnual)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      isAnnual ? 'bg-white' : 'bg-[#333]'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-black rounded-full transition-transform ${
                        isAnnual ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-sm ml-3 ${isAnnual ? 'text-white' : 'text-[#666]'}`}>
                    Annual
                    <span className="text-xs text-[#888] ml-1">(save 20%)</span>
                  </span>
                </div>

                {/* Pricing Plans */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                  {/* Visibility Plan */}
                  <div className="bg-[#1a1a1a] border border-[#333] p-6">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-medium text-white mb-1">Visibility</h3>
                      <p className="text-xs text-[#888] mb-3">Track your AI presence</p>
                      <div className="text-3xl font-bold text-white mb-1">
                        ${isAnnual ? '32' : '40'}
                      </div>
                      <div className="text-xs text-[#666]">per month</div>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span className="text-sm text-white">Daily visibility scans</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span className="text-sm text-white">Citation analysis</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span className="text-sm text-white">Single domain tracking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span className="text-sm text-white">Email alerts</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => {
                        localStorage.setItem('onboardingCompleted', 'true')
                        setShowOnboarding(false)
                        onComplete?.()
                      }}
                      className="w-full bg-[#333] hover:bg-[#444] text-white h-10 text-sm"
                    >
                      Start Visibility
                    </Button>
                  </div>

                  {/* Plus Plan - Featured */}
                  <div className="bg-[#1a1a1a] border-2 border-white p-6 relative">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-white text-black px-3 py-1 text-xs font-medium">
                        RECOMMENDED
                      </div>
                    </div>
                    
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-medium text-white mb-1">Plus</h3>
                      <p className="text-xs text-[#888] mb-3">Scale your AI visibility</p>
                      <div className="text-3xl font-bold text-white mb-1">
                        ${isAnnual ? '160' : '200'}
                      </div>
                      <div className="text-xs text-[#666]">per month</div>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span className="text-sm text-white">Daily MAX visibility scans</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span className="text-sm text-white">10 monthly AI articles</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span className="text-sm text-white">Competitor benchmarking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span className="text-sm text-white">Keyword trend analysis</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span className="text-sm text-white">Priority support</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => {
                        localStorage.setItem('onboardingCompleted', 'true')
                        setShowOnboarding(false)
                        onComplete?.()
                      }}
                      className="w-full bg-white text-black hover:bg-[#f5f5f5] h-10 text-sm font-medium"
                    >
                      Start Plus
                    </Button>
                  </div>

                  {/* Pro Plan */}
                  <div className="bg-[#1a1a1a] border border-[#333] p-6">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-medium text-white mb-1">Pro</h3>
                      <p className="text-xs text-[#888] mb-3">Full-stack AEO powerhouse</p>
                      <div className="text-3xl font-bold text-white mb-1">
                        ${isAnnual ? '800' : '1,000'}
                      </div>
                      <div className="text-xs text-[#666]">per month</div>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span className="text-sm text-white">Everything in Plus</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span className="text-sm text-white">30 premium articles</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span className="text-sm text-white">Unlimited MAX scans</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span className="text-sm text-white">Multi-brand tracking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span className="text-sm text-white">Up to 3 domains</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => {
                        localStorage.setItem('onboardingCompleted', 'true')
                        setShowOnboarding(false)
                        onComplete?.()
                      }}
                      className="w-full bg-[#333] hover:bg-[#444] text-white h-10 text-sm"
                    >
                      Start Pro
                    </Button>
                  </div>
                </div>

                {/* Skip Option */}
                <div className="text-center">
                  <button
                    onClick={() => {
                      localStorage.setItem('onboardingCompleted', 'true')
                      setShowOnboarding(false)
                      onComplete?.()
                    }}
                    className="text-[#666] text-sm hover:text-white transition-colors"
                  >
                    Continue with free tier (limited features)
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          {currentStep !== 'scanning' && currentStep !== 'paywall' && (
            <div className="flex items-center justify-between mt-6">
              <Button
                onClick={handleBack}
                variant="ghost"
                className="text-[#666] hover:text-white h-8 px-3 text-xs"
                disabled={currentStep === 'workspace'}
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                Back
              </Button>

                              <Button
                  onClick={currentStep === 'results' ? () => {
                    setIsLoading(true)
                    setTimeout(() => {
                      setCurrentStep('paywall')
                      setIsLoading(false)
                    }, 300)
                  } : handleNext}
                  disabled={!canProceed() || isLoading}
                  className="bg-white text-black hover:bg-[#f5f5f5] h-8 px-3 text-xs font-medium"
                >
                  {isLoading ? (
                    <div className="w-3 h-3 animate-spin rounded-full border border-current border-t-transparent mr-1" />
                  ) : (
                    <>
                      {currentStep === 'confirm' ? 'Run Scan' : currentStep === 'cms' ? 'Start scan' : 'Continue'}
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </>
                  )}
                </Button>
            </div>
          )}
        </div>
      </div>
      <AEOPipeline
        isOpen={isPipelineOpen}
        crawlUrl={analyticsData.domain || ''}
        onClose={handlePipelineClose}
        onAnalysisComplete={handlePipelineComplete}
      />
    </div>
  )
}

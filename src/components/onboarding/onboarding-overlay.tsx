'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AEOScoreCard } from '@/app/visibility-test/components/aeo-score-card'
import { OverallAEOCard } from '@/app/visibility-test/components/overall-aeo-card'
import { DirectCitationCard } from '@/app/visibility-test/components/direct-citation-card'
import { SuggestionsCard } from '@/app/visibility-test/components/suggestions-card'
import { saveOnboardingData, saveAeoQuestions, saveAeoResults, updateAeoScore, saveCompleteAeoAnalysis } from '@/lib/onboarding/database'
import type { OnboardingData } from '@/lib/onboarding/database'
import { debugOnboardingState } from '@/lib/debug/onboarding-debug'
import '@/lib/debug/aeo-debug' // Import AEO debug utilities
import type { TablesInsert } from '../../../supabase/supabase'
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

type OnboardingStep = 'workspace' | 'analytics' | 'content' | 'cms' | 'scanning' | 'results' | 'paywall'

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
  const { user, session } = useAuth()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('workspace')
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showSkipWarning, setShowSkipWarning] = useState(false)
  const [visibilityScore, setVisibilityScore] = useState(0)
  const [isAnnual, setIsAnnual] = useState(false)
  const [visibilityData, setVisibilityData] = useState<any | null>(null)

  // Background analysis state
  const [backgroundAnalysisStarted, setBackgroundAnalysisStarted] = useState(false)
  const [analysisEventSource, setAnalysisEventSource] = useState<EventSource | null>(null)
  
  // Real-time progress tracking
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisMessage, setAnalysisMessage] = useState('Starting analysis...')
  const [analysisStep, setAnalysisStep] = useState('')

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
        const onboardingInProgress = sessionStorage.getItem('onboardingInProgress')
        
        // Only clear if user is in the middle of onboarding or has incomplete data
        // Don't clear if onboarding is genuinely completed (no data = completion cleanup)
        if (!hasProperOnboardingData && !onboardingInProgress) {
          // This could be either:
          // 1. A completed onboarding (data was cleaned up) - DON'T clear
          // 2. A simple onboarding that needs full experience - we can't distinguish
          // To be safe, we'll only clear for new signups or if explicitly in progress
          console.log('🔍 Onboarding completion flag exists but no data - assuming completed onboarding')
        }
      }
      
      const justSignedUp = sessionStorage.getItem('justSignedUp')
      const justVerified = document.cookie.includes('justVerified=true')
      const onboardingData = localStorage.getItem('onboardingData')
      const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted')
      const onboardingInProgress = sessionStorage.getItem('onboardingInProgress')
      const analysisComplete = localStorage.getItem('onboardingAnalysisComplete')
      
      console.log('🎯 Onboarding Flow Decision Variables:', {
        justSignedUp,
        justVerified,
        hasOnboardingData: !!onboardingData,
        hasCompletedOnboarding,
        onboardingInProgress,
        analysisComplete,
        user: !!user
      })
      
      // If user has completed full onboarding (not just analysis), don't show overlay
      if (hasCompletedOnboarding && !analysisComplete) {
        console.log('✅ User has completed full onboarding - hiding overlay')
        setShowOnboarding(false)
        return
      }
      
      // If analysis is complete, show results screen
      if (analysisComplete && user) {
        console.log('📊 Analysis complete - showing results screen')
        setCurrentStep('results')
        setShowOnboarding(true)
        
        // Try to restore visibility data from localStorage if available
        const savedVisibilityData = localStorage.getItem('visibilityData')
        const savedVisibilityScore = localStorage.getItem('visibilityScore')
        if (savedVisibilityData && savedVisibilityScore) {
          console.log('📊 Restoring visibility data from localStorage')
          setVisibilityData(JSON.parse(savedVisibilityData))
          setVisibilityScore(parseInt(savedVisibilityScore))
        }
        
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
        setShowOnboarding(true) // Show onboarding for resumption
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
      } else if (user && !hasCompletedOnboarding) {
        // User is logged in but hasn't completed onboarding - show onboarding
        console.log('🎯 User logged in but no onboarding completed - starting onboarding...')
        setCurrentStep('workspace')
        setShowOnboarding(true)
      } else {
        // Default case - don't show onboarding
        console.log('🎯 Default case - hiding onboarding')
        setShowOnboarding(false)
      }
      
      console.log('🎬 Final onboarding state:', {
        showOnboarding,
        currentStep
      })
    }
  }, [user])

  // Progress calculation
  useEffect(() => {
    switch (currentStep) {
      case 'workspace':
        setProgress(20)
        break
      case 'analytics':
        setProgress(40)
        break
      case 'content':
        setProgress(60)
        break
      case 'cms':
        setProgress(80)
        break
      case 'scanning':
        setProgress(95)
        break
      case 'results':
        setProgress(100)
        break
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
    console.log('🔄 handleNext called with currentStep:', currentStep)
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
        // Save progress and move to analytics (URL entry)
        localStorage.setItem('onboardingData', JSON.stringify(progressData))
        sessionStorage.setItem('onboardingInProgress', 'true')
        setCurrentStep('analytics')
        break
      case 'analytics':
        console.log('📊 Analytics case - starting background scanning')
        console.log('📊 Analytics data:', analyticsData)
        console.log('📊 User:', !!user, 'Session:', !!session)
        
        // Start scanning in background and move to content step
        console.log('🚀 Starting background scanning and moving to content step')
        
        // Start the background analysis (non-blocking)
        startBackgroundAnalysis(analyticsData.domain).catch(error => {
          console.error('❌ Failed to start background analysis:', error)
          // Continue with flow even if background analysis fails
        })
        
        console.log('📊 About to save onboarding data...')
        
        // Save data to database and WAIT for companyId
        if (user) {
          try {
            console.log('💾 Saving onboarding data to database...')
            
            // Get supabase client
            const { createClient } = await import('@/lib/supabase/client')
            const supabase = createClient()
            
            if (!supabase) {
              console.error('❌ Supabase client not available')
              throw new Error('Database connection failed')
            }
            
            // Try to find existing company first instead of upsert
            let domainUrl = analyticsData.domain
            if (!domainUrl.startsWith('http')) {
              domainUrl = `https://${domainUrl}`
            }
            try {
              const url = new URL(domainUrl)
              domainUrl = `${url.protocol}//${url.hostname}`
            } catch (e) {
              // If URL parsing fails, use as-is
            }

            console.log('🔍 Checking for existing company with URL:', domainUrl)
            const { data: existingCompanies, error: findError } = await supabase
              .from('companies')
              .select('id')
              .eq('root_url', domainUrl)
              .limit(1)

            let companyId: string

            if (findError || !existingCompanies || existingCompanies.length === 0) {
              // No existing company found, create new one
              console.log('🆕 No existing company found, creating new one...')
              const { data: companyResult, error: companyError } = await supabase
                .from('companies')
                .insert([{
                  company_name: workspaceData.workspaceName,
                  root_url: domainUrl,
                  submitted_by: user.id,
                }])
                .select('id')
                .single()

              if (companyError) {
                console.error('❌ Error creating company:', companyError)
                throw new Error(`Failed to create company: ${companyError.message}`)
              }
              
              companyId = companyResult.id
              console.log('✅ New company created with ID:', companyId)
            } else {
              // Use existing company
              const company = Array.isArray(existingCompanies) ? existingCompanies[0] : existingCompanies
              companyId = company.id
              console.log('✅ Using existing company with ID:', companyId)
            }

            setCompanyId(companyId)
            console.log('🎯 CompanyId set in state:', companyId)

            const onboardingData: OnboardingData = {
              workspaceName: workspaceData.workspaceName,
              userEmail: user.email || '',
              analyticsProvider: null, // No analytics provider needed
              domain: analyticsData.domain,
              isAnalyticsConnected: false,
              keywords: [], // Will be filled in content step
              businessOffering: '', // Will be filled in content step
              knownFor: '', // Will be filled in content step
              competitors: [], // Will be filled in content step
              cms: 'nextjs', // Will be filled in cms step
            }

            const result = await saveOnboardingData(user, onboardingData)
            console.log('💾 Database save result:', result)
            
            if (result.success && result.companyId) {
              console.log('✅ Onboarding data saved successfully, companyId:', result.companyId)
              // Update companyId if it was different from what we found/created
              if (result.companyId !== companyId) {
                setCompanyId(result.companyId)
                console.log('🎯 CompanyId updated from database result:', result.companyId)
              }
            } else {
              console.error('❌ Failed to save onboarding data or missing companyId:', result.error)
              // Continue with flow even if database save fails, but log the issue
            }
          } catch (error) {
            console.error('❌ Error saving onboarding data:', error)
            // Continue with flow even if database save fails
          }
        } else {
          console.log('⚠️ No user found, skipping database save')
        }
        
        console.log('📊 About to move to content step...')
        // Move to content step while scanning happens in background
        setCurrentStep('content')
        console.log('📊 Moved to content step')
        break
      case 'content':
        // Save progress and move directly to CMS (skip confirm step)
        localStorage.setItem('onboardingData', JSON.stringify(progressData))
        setCurrentStep('cms')
        break
      case 'cms':
        // Check if we have visibility results yet
        if (visibilityData) {
          // Scanning completed, show results
          console.log('✅ Scanning already completed, showing results')
          setCurrentStep('results')
        } else {
          // Scanning still in progress, show scanning status
          console.log('⏳ Scanning still in progress, showing status')
          setCurrentStep('scanning')
        }
        
        // Mark that we're waiting for results
        sessionStorage.setItem('onboardingInProgress', 'waiting-results')
        break
    }
    
    console.log('🔄 handleNext completed, setting isLoading to false')
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
      case 'cms':
        setCurrentStep('content')
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
    console.log('🚨🚨🚨 HANDLE PIPELINE COMPLETE - FUNCTION ENTRY 🚨🚨🚨')
    console.log('🎯🎯🎯 === HANDLE PIPELINE COMPLETE FUNCTION CALLED === 🎯🎯🎯')
    console.log('🔍 Function entry debug:', {
      functionCalled: true,
      timestamp: new Date().toISOString(),
      dataExists: !!data,
      companyIdExists: !!companyId,
      userExists: !!user,
      currentCompanyId: companyId,
      currentUserId: user?.id,
      currentStep: currentStep
    })
    
    console.log('🎯 Pipeline completed with data:', data)
    console.log('🔍 Pipeline data structure:', {
      hasAeoData: !!data.aeoData,
      hasRawPipelineData: !!data.rawPipelineData,
      hasQuestions: !!data.questions,
      hasSerpResults: !!data.serpResults,
      hasResults: !!data.results,
      overallScore: data.overallScore,
      aeoScore: data.aeoData?.aeo_score,
      questionCount: data.questions?.length || 0,
      resultsCount: data.results?.length || 0,
      dataKeys: Object.keys(data),
      aeoDataKeys: data.aeoData ? Object.keys(data.aeoData) : []
    })
    
    // 🚨 CRITICAL DEBUG: Check if we have the required data for saving
    console.log('🔍 CRITICAL DEBUG - Required Data Check:')
    console.log('  - companyId exists:', !!companyId)
    console.log('  - companyId value:', companyId)
    console.log('  - user exists:', !!user)
    console.log('  - user.id:', user?.id)
    console.log('  - data exists:', !!data)
    console.log('  - currentStep:', currentStep)
    console.log('  - Will attempt database save:', !!(companyId && user))
    
    // 🚨 EMERGENCY FALLBACK: If companyId is missing, try to get it from the database
    let workingCompanyId = companyId
    if (!workingCompanyId && user && analyticsData.domain) {
      console.log('🚨 EMERGENCY: CompanyId missing, attempting to find existing company...')
      try {
        // Just try to find existing company, don't create new one
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        
        if (!supabase) {
          console.error('❌ Emergency: Supabase client not available')
          return
        }
        
        let domainUrl = analyticsData.domain
        if (!domainUrl.startsWith('http')) {
          domainUrl = `https://${domainUrl}`
        }
        try {
          const url = new URL(domainUrl)
          domainUrl = `${url.protocol}//${url.hostname}`
        } catch (e) {
          // If URL parsing fails, use as-is
        }
        
        const companyData: TablesInsert<'companies'> = {
          company_name: workspaceData.workspaceName,
          root_url: domainUrl,
          submitted_by: user.id,
        }

        console.log('🏢 Creating company:', workspaceData.workspaceName)
        // Try to find existing company first instead of upsert
        console.log('🔍 Checking for existing company with URL:', domainUrl)
        const { data: existingCompanies, error: findError } = await supabase
          .from('companies')
          .select('id')
          .eq('root_url', domainUrl)
          .limit(1)

        if (findError || !existingCompanies || existingCompanies.length === 0) {
          // No existing company found, create new one
          console.log('🆕 No existing company found, creating new one...')
          const { data: companyResult, error: companyError } = await supabase
            .from('companies')
            .insert([companyData])
            .select('id')
            .single()

          if (companyError) {
            console.error('❌ Error creating company:', companyError)
            throw new Error(`Failed to create company: ${companyError.message}`)
          }
          
          workingCompanyId = companyResult.id
          console.log('✅ New company created with ID:', workingCompanyId)
        } else {
          // Use existing company
          const company = Array.isArray(existingCompanies) ? existingCompanies[0] : existingCompanies
          workingCompanyId = company.id
          console.log('✅ Using existing company with ID:', workingCompanyId)
        }
      } catch (error) {
        console.error('❌ Emergency companyId lookup exception:', error)
      }
    }
    
    // Save the complete AEO analysis to database if we have the company ID
    if (workingCompanyId && user) {
      try {
        console.log('🚨 ATTEMPTING COMPLETE AEO ANALYSIS SAVE 🚨')
        console.log('📊 Save parameters:', {
          companyId: workingCompanyId,
          userId: user.id,
          dataType: typeof data,
          dataKeys: Object.keys(data),
          hasRawPipelineData: !!data.rawPipelineData
        })
        
        // Use rawPipelineData if available, otherwise use the transformed data
        const pipelineData = data.rawPipelineData || data
        const analysisResult = await saveCompleteAeoAnalysis(workingCompanyId, pipelineData, user.id)
        
        console.log('📋 Save result received:', analysisResult)
        
        if (analysisResult.success) {
          console.log('✅ 🎉 Complete AEO analysis saved successfully! 🎉')
        } else {
          console.error('❌ 🚨 Failed to save AEO analysis:', analysisResult.error)
          console.error('🔍 Save failure details:', {
            success: analysisResult.success,
            error: analysisResult.error,
            companyId: workingCompanyId,
            userId: user.id
          })
        }
      } catch (error) {
        console.error('❌ 🚨 EXCEPTION during AEO analysis save:', error)
        console.error('🔍 Exception details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          companyId: workingCompanyId,
          userId: user.id
        })
      }
    } else {
      console.error('❌ 🚨 MISSING REQUIRED DATA for saving AEO analysis:')
      console.error('🔍 Missing data analysis:', {
        hasCompanyId: !!workingCompanyId,
        hasUser: !!user,
        companyId: workingCompanyId,
        userId: user?.id,
        userEmail: user?.email,
        reason: !workingCompanyId ? 'No companyId' : !user ? 'No user' : 'Unknown'
      })
    }
    
    // Clear onboarding progress tracking since analysis is complete
    sessionStorage.removeItem('onboardingInProgress')
    localStorage.removeItem('onboardingData')
    
    // Mark onboarding analysis as completed (for refresh protection)
    // But use a special flag to indicate we're still in the flow
    localStorage.setItem('onboardingAnalysisComplete', 'true')
    console.log('✅ Onboarding analysis marked as completed (but continuing flow)')
    
    // Set results data
    setVisibilityData(data)
    setVisibilityScore(data.aeo_score ?? data.overallScore ?? 0)
    
    // Save visibility data to localStorage for refresh recovery
    localStorage.setItem('visibilityData', JSON.stringify(data))
    localStorage.setItem('visibilityScore', String(data.aeo_score ?? data.overallScore ?? 0))
    
    console.log('🎯 TRANSITION LOGIC DEBUG:')
    console.log('  - Current step before transition:', currentStep)
    console.log('  - Visibility data will be set to:', !!data)
    console.log('  - Visibility score will be set to:', data.aeo_score ?? data.overallScore ?? 0)
    console.log('  - Raw data structure:', {
      hasAeoScore: !!data.aeo_score,
      hasOverallScore: !!data.overallScore,
      aeoScoreValue: data.aeo_score,
      overallScoreValue: data.overallScore,
      dataKeys: Object.keys(data)
    })
    
    // Only move to results if user is currently on the scanning screen waiting for results
    // Don't interrupt them if they're still filling out other onboarding steps
    if (currentStep === 'scanning') {
      console.log('🎉 Analysis completed! User was waiting on scanning screen, moving to results')
      setCurrentStep('results')
    } else {
      console.log('🎉 Analysis completed! User is still on step:', currentStep, '- letting them continue')
      console.log('🎯 Note: Visibility data is now available, useEffect should handle transition if needed')
    }
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
        return analyticsData.domain.trim().length > 0
      case 'content':
        return true // Content is optional - user can skip if they want
      case 'cms':
        return cmsData.cms
      case 'results':
        return true // Always can proceed from results to plans
      default:
        return false
    }
  }

  // Start background analysis without modal
  const startBackgroundAnalysis = async (domain: string) => {
    if (!user || !session || backgroundAnalysisStarted) {
      console.log('⚠️ Cannot start background analysis:', {
        hasUser: !!user,
        hasSession: !!session,
        alreadyStarted: backgroundAnalysisStarted
      })
      return
    }
    
    console.log('🚀 Starting background AEO analysis for:', domain)
    setBackgroundAnalysisStarted(true)
    
    // Initialize progress tracking
    setAnalysisProgress(0)
    setAnalysisMessage('Starting analysis...')
    setAnalysisStep('')

    try {
      // Format URL
      let formattedUrl = domain
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = 'https://' + formattedUrl
      }
      
      // Check if we have access token
      if (!session?.access_token) {
        console.error('❌ No access token available')
        setBackgroundAnalysisStarted(false)
        return
      }
      
      // Create EventSource for SSE with auth token
      const eventSourceUrl = `/api/aeo/start?token=${encodeURIComponent(session.access_token)}&url=${encodeURIComponent(formattedUrl)}`
      console.log('🔗 Background analysis EventSource URL created')
      
      const eventSource = new EventSource(eventSourceUrl)
      setAnalysisEventSource(eventSource)
      
      // Handle progress events
      eventSource.onmessage = (event) => {
        try {
          const progressData = JSON.parse(event.data)
          console.log('📨 Background analysis progress:', progressData.step, progressData.message)
          
          // Update progress state
          setAnalysisStep(progressData.step)
          setAnalysisMessage(progressData.message)
          setAnalysisProgress((progressData.progress / progressData.total) * 100)
          
          if (progressData.error) {
            console.error('❌ Background analysis error:', progressData.error)
            eventSource.close()
            setAnalysisEventSource(null)
            setBackgroundAnalysisStarted(false)
            return
          }
          
          // Handle completion
          if (progressData.step === 'complete' && progressData.data) {
            console.log('🎉 Background analysis completed!')
            handlePipelineComplete(progressData.data)
            eventSource.close()
            setAnalysisEventSource(null)
          }
        } catch (error) {
          console.error('❌ Error parsing background analysis data:', error)
        }
      }
      
      eventSource.onerror = (error) => {
        console.error('❌ Background analysis EventSource error:', error)
        eventSource.close()
        setAnalysisEventSource(null)
        setBackgroundAnalysisStarted(false)
      }
      
    } catch (error) {
      console.error('❌ Error starting background analysis:', error)
      setBackgroundAnalysisStarted(false)
    }
  }

  // Clean up EventSource on unmount
  useEffect(() => {
    return () => {
      if (analysisEventSource) {
        analysisEventSource.close()
      }
    }
  }, [analysisEventSource])

  // Monitor visibility data changes while on scanning screen
  useEffect(() => {
    if (currentStep === 'scanning' && visibilityData) {
      console.log('🎯 SCANNING SCREEN MONITOR: Visibility data became available!')
      console.log('🎯 Current step:', currentStep)
      console.log('🎯 Visibility data:', !!visibilityData)
      console.log('🎯 Transitioning to results...')
      setCurrentStep('results')
    }
  }, [currentStep, visibilityData])

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
                  <h2 className="text-lg font-medium text-white mb-1">Lets get started with some basic info...</h2>
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
                    <label className="block text-xs text-[#888] mb-2">Company name</label>
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
                  <h2 className="text-lg font-medium text-white mb-1">Enter your website URL</h2>
                  <p className="text-sm text-[#666]">We'll analyze this website for AI visibility</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-[#888] mb-2">Website URL</label>
                    <Input
                      value={analyticsData.domain}
                      onChange={(e) => setAnalyticsData(prev => ({ ...prev, domain: e.target.value }))}
                      placeholder="yoursite.com"
                      className="bg-[#1a1a1a] border-[#333] text-white h-9 text-sm"
                    />
                  </div>
                </div>
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
                  <h2 className="text-xl font-medium text-white mb-2">Help us get to know you better while your free visibility score is calculated</h2>
                  <p className="text-sm text-[#666]">This helps our AI understand your business and improve your results</p>
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
                <div className="mb-6">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  <h2 className="text-lg font-medium text-white mb-2">Calculating your AI visibility score...</h2>
                  <p className="text-sm text-[#666]">This usually takes 2-3 minutes. We're analyzing your website across 100+ AI queries.</p>
                </div>
                
                <div className="bg-[#1a1a1a] border border-[#333] rounded p-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-[#888]">Progress</span>
                    <span className="text-white">{Math.round(analysisProgress)}%</span>
                  </div>
                  <div className="w-full bg-[#333] rounded-full h-2 mt-2 mb-3">
                    <div 
                      className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${analysisProgress}%` }}
                    ></div>
                  </div>
                  
                  {/* Step indicator */}
                  <div className="flex justify-between text-xs mb-3">
                    {[
                      { key: 'crawl', label: 'Crawl' },
                      { key: 'questions', label: 'Questions' },
                      { key: 'search', label: 'Search' },
                      { key: 'classify', label: 'Classify' },
                      { key: 'score', label: 'Score' }
                    ].map((step, index) => (
                      <div key={step.key} className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full mb-1 transition-colors duration-300 ${
                          analysisStep === step.key 
                            ? 'bg-white' 
                            : analysisProgress > (index / 5) * 100 
                              ? 'bg-[#666]' 
                              : 'bg-[#333]'
                        }`} />
                        <span className={`text-xs transition-colors duration-300 ${
                          analysisStep === step.key ? 'text-white' : 'text-[#666]'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-xs text-[#888] text-left">
                    {analysisStep && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="capitalize font-medium text-[#ccc]">{analysisStep}:</span>
                        <span>{analysisMessage}</span>
                      </div>
                    )}
                    {!analysisStep && (
                      <span>{analysisMessage}</span>
                    )}
                  </div>
                </div>
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
                  <AEOScoreCard data={visibilityData} />
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
                        localStorage.removeItem('onboardingAnalysisComplete') // Clear analysis flag
                        localStorage.removeItem('visibilityData') // Clean up visibility data
                        localStorage.removeItem('visibilityScore') // Clean up visibility score
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
                        localStorage.removeItem('onboardingAnalysisComplete') // Clear analysis flag
                        localStorage.removeItem('visibilityData') // Clean up visibility data
                        localStorage.removeItem('visibilityScore') // Clean up visibility score
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
                        localStorage.removeItem('onboardingAnalysisComplete') // Clear analysis flag
                        localStorage.removeItem('visibilityData') // Clean up visibility data
                        localStorage.removeItem('visibilityScore') // Clean up visibility score
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
                      localStorage.removeItem('onboardingAnalysisComplete') // Clear analysis flag
                      localStorage.removeItem('visibilityData') // Clean up visibility data
                      localStorage.removeItem('visibilityScore') // Clean up visibility score
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
                    {currentStep === 'cms' ? 'Complete Setup' : currentStep === 'analytics' ? 'Start Analysis' : 'Continue'}
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

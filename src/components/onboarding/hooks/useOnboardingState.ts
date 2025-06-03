import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { debugOnboardingState } from '@/lib/debug/onboarding-debug'
import { 
  OnboardingStep, 
  WorkspaceData, 
  AnalyticsData, 
  ContentData, 
  CmsData 
} from '../types/onboarding-types'
import { ONBOARDING_STEPS, STEP_PROGRESS } from '../utils/onboarding-constants'

export function useOnboardingState() {
  const { user } = useAuth()
  
  // Core state
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(ONBOARDING_STEPS.WORKSPACE)
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showSkipWarning, setShowSkipWarning] = useState(false)
  const [visibilityScore, setVisibilityScore] = useState(0)
  const [isAnnual, setIsAnnual] = useState(false)
  const [visibilityData, setVisibilityData] = useState<any | null>(null)

  // Background analysis state
  const [backgroundAnalysisStarted, setBackgroundAnalysisStarted] = useState(false)
  const [analysisEventSource, setAnalysisEventSource] = useState<EventSource | null>(null)
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

  // Initialize onboarding state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('🔍 Onboarding State Hook useEffect triggered')
      debugOnboardingState()
      
      const justSignedUp = sessionStorage.getItem('justSignedUp')
      const justVerified = document.cookie.includes('justVerified=true')
      const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted')
      
      console.log('🎯 Onboarding Flow Decision Variables:', {
        justSignedUp,
        justVerified,
        hasCompletedOnboarding,
        user: !!user
      })
      
      // Primary check: If user has completed onboarding, never show it again
      if (hasCompletedOnboarding) {
        console.log('✅ User has completed onboarding - permanently hiding overlay')
        setShowOnboarding(false)
        
        // Clean up any residual onboarding data
        localStorage.removeItem('onboardingAnalysisComplete')
        localStorage.removeItem('visibilityData')
        localStorage.removeItem('visibilityScore')
        localStorage.removeItem('onboardingData')
        sessionStorage.removeItem('onboardingInProgress')
        
        return
      }
      
      // Secondary check: Only show onboarding for new users or users explicitly resuming
      const onboardingData = localStorage.getItem('onboardingData')
      const onboardingInProgress = sessionStorage.getItem('onboardingInProgress')
      const analysisComplete = localStorage.getItem('onboardingAnalysisComplete')
      
      if (justSignedUp || justVerified) {
        // User just signed up or verified email - start fresh onboarding
        console.log('🚀 Starting fresh onboarding for new user...')
        setCurrentStep(ONBOARDING_STEPS.WORKSPACE)
        setShowOnboarding(true)
        
        // Clear any existing onboarding data for fresh start
        localStorage.removeItem('onboardingData')
        localStorage.removeItem('onboardingAnalysisComplete')
        localStorage.removeItem('visibilityData')
        localStorage.removeItem('visibilityScore')
        sessionStorage.removeItem('onboardingInProgress')
        
        // Clear the signup flags
        sessionStorage.removeItem('justSignedUp')
        document.cookie = 'justVerified=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        
        // Mark onboarding as in progress
        sessionStorage.setItem('onboardingInProgress', 'true')
        
      } else if (onboardingInProgress && onboardingData) {
        // User is resuming an interrupted onboarding session
        console.log('🔄 Resuming interrupted onboarding session...')
        
        try {
          const parsedData = JSON.parse(onboardingData)
          
          // Restore form data
          if (parsedData.workspaceData) setWorkspaceData(parsedData.workspaceData)
          if (parsedData.analyticsData) setAnalyticsData(parsedData.analyticsData)
          if (parsedData.contentData) setContentData(parsedData.contentData)
          if (parsedData.cmsData) setCmsData(parsedData.cmsData)
          if (parsedData.companyId) setCompanyId(parsedData.companyId)
          if (parsedData.runId) setRunId(parsedData.runId)
          
          // Determine which step to resume from
          if (analysisComplete) {
            console.log('📊 Analysis complete - showing results')
            setCurrentStep(ONBOARDING_STEPS.RESULTS)
            
            // Load visibility data
            const savedVisibilityData = localStorage.getItem('visibilityData')
            const savedVisibilityScore = localStorage.getItem('visibilityScore')
            
            if (savedVisibilityData) {
              setVisibilityData(JSON.parse(savedVisibilityData))
            }
            if (savedVisibilityScore) {
              setVisibilityScore(parseInt(savedVisibilityScore))
            }
          } else if (parsedData.currentStep) {
            console.log(`📍 Resuming from step: ${parsedData.currentStep}`)
            setCurrentStep(parsedData.currentStep)
          }
          
          setShowOnboarding(true)
          
        } catch (error) {
          console.error('❌ Failed to parse onboarding data:', error)
          // Start fresh if data is corrupted
          setCurrentStep(ONBOARDING_STEPS.WORKSPACE)
          setShowOnboarding(true)
        }
        
      } else {
        // No onboarding needed for existing users
        console.log('👤 Existing user - no onboarding needed')
        setShowOnboarding(false)
      }
    }
  }, [user])

  // Update progress when step changes
  useEffect(() => {
    setProgress(STEP_PROGRESS[currentStep] || 0)
  }, [currentStep])

  // Navigation functions
  const goToNextStep = () => {
    const steps = Object.values(ONBOARDING_STEPS)
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
    }
  }

  const goToPreviousStep = () => {
    const steps = Object.values(ONBOARDING_STEPS)
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }

  const goToStep = (step: OnboardingStep) => {
    setCurrentStep(step)
  }

  // Validation functions
  const canProceed = () => {
    switch (currentStep) {
      case ONBOARDING_STEPS.WORKSPACE:
        return workspaceData.name.trim() !== '' && workspaceData.workspaceName.trim() !== ''
      case ONBOARDING_STEPS.ANALYTICS:
        return analyticsData.isSkipped || (analyticsData.provider && analyticsData.domain.trim() !== '')
      case ONBOARDING_STEPS.CONTENT:
        return contentData.businessOffering.trim() !== '' && contentData.knownFor.trim() !== ''
      case ONBOARDING_STEPS.CMS:
        return cmsData.cms !== ''
      default:
        return true
    }
  }

  // Utility functions
  const addKeyword = () => {
    if (newKeyword.trim() && !contentData.keywords.includes(newKeyword.trim())) {
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
    if (newCompetitor.trim() && !contentData.competitors.includes(newCompetitor.trim())) {
      setContentData(prev => ({
        ...prev,
        competitors: [...prev.competitors, newCompetitor.trim()]
      }))
      setNewCompetitor('')
    }
  }

  const removeCompetitor = (index: number) => {
    setContentData(prev => ({
      ...prev,
      competitors: prev.competitors.filter((_, i) => i !== index)
    }))
  }

  const completeOnboarding = () => {
    console.log('✅ Completing onboarding...')
    
    // Mark onboarding as completed permanently
    localStorage.setItem('onboardingCompleted', 'true')
    
    // Clean up all onboarding-related data
    localStorage.removeItem('onboardingData')
    localStorage.removeItem('onboardingAnalysisComplete')
    localStorage.removeItem('visibilityData')
    localStorage.removeItem('visibilityScore')
    sessionStorage.removeItem('onboardingInProgress')
    sessionStorage.removeItem('justSignedUp')
    document.cookie = 'justVerified=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    
    setShowOnboarding(false)
    
    // Reload to ensure clean state
    window.location.reload()
  }

  return {
    // State
    showOnboarding,
    currentStep,
    progress,
    isLoading,
    showSkipWarning,
    visibilityScore,
    isAnnual,
    visibilityData,
    backgroundAnalysisStarted,
    analysisEventSource,
    analysisProgress,
    analysisMessage,
    analysisStep,
    companyId,
    runId,
    workspaceData,
    analyticsData,
    contentData,
    cmsData,
    newKeyword,
    newCompetitor,

    // Setters
    setShowOnboarding,
    setCurrentStep,
    setProgress,
    setIsLoading,
    setShowSkipWarning,
    setVisibilityScore,
    setIsAnnual,
    setVisibilityData,
    setBackgroundAnalysisStarted,
    setAnalysisEventSource,
    setAnalysisProgress,
    setAnalysisMessage,
    setAnalysisStep,
    setCompanyId,
    setRunId,
    setWorkspaceData,
    setAnalyticsData,
    setContentData,
    setCmsData,
    setNewKeyword,
    setNewCompetitor,

    // Actions
    goToNextStep,
    goToPreviousStep,
    goToStep,
    canProceed,
    addKeyword,
    removeKeyword,
    addCompetitor,
    removeCompetitor,
    completeOnboarding
  }
} 
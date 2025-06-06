import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  maxVisibilityApi, 
  VisibilityData, 
  CitationData, 
  GapData, 
  InsightData,
  CompetitorData,
  handleApiError 
} from '@/lib/max-visibility/api-client'
import { useSubscription } from '@/hooks/useSubscription'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { toast } from '@/components/ui/use-toast'

interface UseMaxVisibilityState {
  // Main visibility data
  data: VisibilityData | null
  
  // Individual section data for detailed views
  citations: CitationData[]
  gaps: GapData[]
  insights: InsightData | null
  competitors: CompetitorData[]
  
  // Loading states
  isLoading: boolean
  isInitialLoading: boolean
  isRefreshing: boolean
  isLoadingCitations: boolean
  isLoadingGaps: boolean
  isLoadingInsights: boolean
  
  // Error states
  error: string | null
  citationsError: string | null
  gapsError: string | null
  insightsError: string | null
  
  // Meta information
  lastUpdated: string | null
  hasData: boolean
  scanType: 'lite' | 'max' | null
  featureAccess: {
    hasMaxAccess: boolean
    features: Record<string, boolean>
  }
  
  // Assessment tracking
  currentAssessment: {
    id: string | null
    status: 'pending' | 'running' | 'completed' | 'failed' | null
    progress: number
    stage?: string
    message?: string
    error?: string
    company?: string
  }
}

interface UseMaxVisibilityActions {
  // Main actions
  refresh: () => Promise<void>
  triggerScan: (type?: 'lite' | 'max') => Promise<void>
  
  // Section-specific refreshes
  refreshCitations: (filters?: Record<string, any>) => Promise<void>
  refreshGaps: (filters?: Record<string, any>) => Promise<void>
  refreshInsights: () => Promise<void>
  
  // Utility actions
  clearError: () => void
  clearCache: () => void
  exportData: (format: 'csv' | 'json', type: 'citations' | 'gaps' | 'insights') => Promise<string | null>
}

export interface UseMaxVisibilityReturn extends UseMaxVisibilityState, UseMaxVisibilityActions {
  // Additional properties that should be exposed in the return type
  isInitialLoading: boolean
}

// Cache key for localStorage - make it workspace-specific
const getVisibilityCacheKey = (workspaceId?: string) => 
  `visibility_data_cache_${workspaceId || 'default'}`
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds

interface CacheEntry {
  data: any
  timestamp: number
}

export function useMaxVisibility(): UseMaxVisibilityReturn {
  const { subscription } = useSubscription()
  const { currentWorkspace } = useWorkspace()
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollCountRef = useRef<number>(0)
  const maxPollAttempts = 150 // 5 minutes at 2-second intervals
  
  // State management
  const [state, setState] = useState<UseMaxVisibilityState>({
    data: null,
    citations: [],
    gaps: [],
    insights: null,
    competitors: [],
    isLoading: false,
    isInitialLoading: true,
    isRefreshing: false,
    isLoadingCitations: false,
    isLoadingGaps: false,
    isLoadingInsights: false,
    error: null,
    citationsError: null,
    gapsError: null,
    insightsError: null,
    lastUpdated: null,
    hasData: false,
    scanType: null,
    featureAccess: {
      hasMaxAccess: false,
      features: {}
    },
    currentAssessment: {
      id: null,
      status: null,
      progress: 0,
      stage: undefined,
      message: undefined,
      error: undefined,
      company: undefined
    }
  })

  // Separate state for smooth progress animation
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const animatedProgressRef = useRef(0)
  const animationFrameRef = useRef<number>()

  // Check if user has MAX access
  const hasMaxAccess = subscription?.plan === 'plus' || subscription?.plan === 'pro'

  // Load feature access information
  const loadFeatureAccess = useCallback(async () => {
    try {
      const response = await maxVisibilityApi.getFeatureAccess()
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          featureAccess: {
            hasMaxAccess: response.data!.has_max_access,
            features: response.data!.features
          }
        }))
      }
    } catch (error) {
      console.error('Failed to load feature access:', error)
    }
  }, [])

  // Load data from cache
  const loadFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(getVisibilityCacheKey(currentWorkspace?.id))
      if (cached) {
        const { data, timestamp }: CacheEntry = JSON.parse(cached)
        const age = Date.now() - timestamp
        if (age < CACHE_TTL) {
          console.log('📦 Using cached visibility data')
          setState(prev => ({
            ...prev,
            data: data.visibility,
            citations: data.citations || [],
            gaps: data.gaps || [],
            insights: data.insights || null,
            competitors: data.competitors || [],
            hasData: true,
            lastUpdated: data.lastUpdated,
            scanType: data.scanType,
            isInitialLoading: false
          }))
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Failed to load from cache:', error)
      return false
    }
  }, [currentWorkspace?.id])

  // Save data to cache
  const saveToCache = useCallback((data: any) => {
    try {
      const cacheEntry: CacheEntry = {
        data,
        timestamp: Date.now()
      }
      localStorage.setItem(getVisibilityCacheKey(currentWorkspace?.id), JSON.stringify(cacheEntry))
    } catch (error) {
      console.error('Failed to save to cache:', error)
    }
  }, [currentWorkspace?.id])

  // Load all data in parallel
  const loadAllData = useCallback(async (showLoading = true, useCache = false) => {
    console.log('📊 Loading all visibility data...', { showLoading, useCache, workspaceId: currentWorkspace?.id })
    
    // Guard: Don't load if no workspace is selected
    if (!currentWorkspace?.id) {
      console.log('⏸️ No workspace selected, skipping data load')
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isInitialLoading: false,
        error: null 
      }))
      return
    }
    
    if (showLoading) {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
    }

    try {
      // Only try cache on initial load
      if (useCache) {
        console.log('🔍 Checking cache first...')
        if (loadFromCache()) {
          console.log('✅ Using cached data')
          return
        }
        console.log('❌ No valid cache found, loading fresh data')
      } else {
        // Clear all caches to ensure fresh data
        console.log('🧹 Clearing all caches before loading...')
        maxVisibilityApi.clearCache()
        localStorage.removeItem(getVisibilityCacheKey(currentWorkspace?.id))
      }
      
      // Load all data in parallel
      const [
        visibilityResponse,
        citationsResponse,
        gapsResponse,
        insightsResponse,
        featureAccessResponse
      ] = await Promise.all([
        maxVisibilityApi.getVisibilityData(),
        maxVisibilityApi.getCitations(),
        maxVisibilityApi.getContentGaps(),
        maxVisibilityApi.getInsights(),
        maxVisibilityApi.getFeatureAccess()
      ])

      // Check responses

      // Process all responses
      if (visibilityResponse.success) {
        if (visibilityResponse.data) {
          // Has data - normal flow
          const newData = {
            visibility: visibilityResponse.data,
            citations: citationsResponse.success && citationsResponse.data ? citationsResponse.data.citations : [],
            gaps: gapsResponse.success && gapsResponse.data ? gapsResponse.data.gaps : [],
            insights: insightsResponse.success ? insightsResponse.data : null,
            competitors: visibilityResponse.data.competitive.competitors || [],
            lastUpdated: visibilityResponse.data.last_updated,
            scanType: visibilityResponse.data.scan_type
          }

          // Update state
          setState(prev => ({
            ...prev,
            data: newData.visibility,
            citations: newData.citations,
            gaps: newData.gaps,
            insights: newData.insights,
            competitors: newData.competitors,
            hasData: true,
            lastUpdated: newData.lastUpdated,
            scanType: newData.scanType,
            isLoading: false,
            isInitialLoading: false,
            error: null,
            featureAccess: featureAccessResponse.success && featureAccessResponse.data ? {
              hasMaxAccess: featureAccessResponse.data.has_max_access,
              features: featureAccessResponse.data.features
            } : prev.featureAccess
          }))

          // Save to cache
          saveToCache(newData)
          console.log('✅ Data loaded and cached successfully')
        } else {
          // No data - empty workspace (not an error)
          console.log('📭 No visibility data found for this workspace - showing empty state')
          setState(prev => ({
            ...prev,
            data: null,
            citations: [],
            gaps: [],
            insights: null,
            competitors: [],
            hasData: false,
            lastUpdated: null,
            scanType: null,
            isLoading: false,
            isInitialLoading: false,
            error: null, // Important: no error for empty state
            featureAccess: featureAccessResponse.success && featureAccessResponse.data ? {
              hasMaxAccess: featureAccessResponse.data.has_max_access,
              features: featureAccessResponse.data.features
            } : prev.featureAccess
          }))
          console.log('✅ Empty state set successfully')
        }
      } else {
        console.error('❌ Failed to load visibility data:', visibilityResponse.error)
        setState(prev => ({
          ...prev,
          isLoading: false,
          isInitialLoading: false,
          error: handleApiError(visibilityResponse.error)
        }))
      }
    } catch (error) {
      console.error('💥 Error loading visibility data:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        isInitialLoading: false,
        error: 'Failed to load visibility data'
      }))
    }
  }, [currentWorkspace?.id, loadFromCache, saveToCache])

  // Load initial data (can use cache)
  const loadInitialData = useCallback(async () => {
    await loadAllData(true, true) // showLoading=true, useCache=true
  }, [loadAllData])

  // Refresh data (always fresh)
  const refresh = useCallback(async () => {
    await loadAllData(true, false) // showLoading=true, useCache=false
  }, [loadAllData])

  // Load citations data
  const loadCitations = useCallback(async (filters?: Record<string, any>) => {
    if (!currentWorkspace?.id) {
      console.log('⏸️ No workspace selected, skipping citations load')
      return
    }

    setState(prev => ({ ...prev, isLoadingCitations: true, citationsError: null }))

    try {
      const response = await maxVisibilityApi.getCitations(filters)
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          citations: response.data!.citations,
          isLoadingCitations: false,
          citationsError: null
        }))
      } else {
        setState(prev => ({
          ...prev,
          isLoadingCitations: false,
          citationsError: handleApiError(response.error)
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoadingCitations: false,
        citationsError: 'Failed to load citations'
      }))
    }
  }, [currentWorkspace?.id])

  // Load gaps data
  const loadGaps = useCallback(async (filters?: Record<string, any>) => {
    if (!currentWorkspace?.id) {
      console.log('⏸️ No workspace selected, skipping gaps load')
      return
    }

    setState(prev => ({ ...prev, isLoadingGaps: true, gapsError: null }))

    try {
      const response = await maxVisibilityApi.getContentGaps(filters)
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          gaps: response.data!.gaps,
          isLoadingGaps: false,
          gapsError: null
        }))
      } else {
        setState(prev => ({
          ...prev,
          isLoadingGaps: false,
          gapsError: handleApiError(response.error)
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoadingGaps: false,
        gapsError: 'Failed to load gaps analysis'
      }))
    }
  }, [currentWorkspace?.id])

  // Load insights data
  const loadInsights = useCallback(async () => {
    if (!currentWorkspace?.id) {
      console.log('⏸️ No workspace selected, skipping insights load')
      return
    }

    setState(prev => ({ ...prev, isLoadingInsights: true, insightsError: null }))

    try {
      const response = await maxVisibilityApi.getInsights()
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          insights: response.data!,
          isLoadingInsights: false,
          insightsError: null
        }))
      } else {
        setState(prev => ({
          ...prev,
          isLoadingInsights: false,
          insightsError: handleApiError(response.error)
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoadingInsights: false,
        insightsError: 'Failed to load insights'
      }))
    }
  }, [currentWorkspace?.id])

  // Smooth progress animation function
  const animateProgressTo = useCallback((targetProgress: number) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    const startProgress = animatedProgressRef.current
    const difference = targetProgress - startProgress
    const duration = 1000 // 1 second animation
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Use ease-out animation for smoother feel
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentProgress = startProgress + (difference * easeOut)
      
      animatedProgressRef.current = currentProgress
      setAnimatedProgress(currentProgress)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      }
    }

    animate()
  }, [])

  // Poll assessment status
  const pollAssessmentStatus = useCallback(async (assessmentId: string) => {
    try {
      pollCountRef.current += 1
      console.log(`🔄 Polling status for assessment: ${assessmentId.slice(-8)} (attempt ${pollCountRef.current}/${maxPollAttempts})`)
      
      // Safety timeout - stop polling after max attempts
      if (pollCountRef.current > maxPollAttempts) {
        console.warn('⏰ Polling timeout reached, stopping polling')
        
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        
        setState(prev => ({
          ...prev,
          isRefreshing: false,
          currentAssessment: { 
            id: null, 
            status: null, 
            progress: 0,
            stage: undefined,
            message: undefined,
            error: undefined,
            company: undefined
          },
          error: 'Scan timed out - please try refreshing the page'
        }))
        
        toast({
          title: "Scan timed out",
          description: "Please refresh the page and try again.",
          variant: "destructive",
        })
        return
      }
      
      const response = await maxVisibilityApi.getAssessmentStatus(assessmentId)
      
      if (response.success && response.data) {
        const { status, progress, stage, message, error, company } = response.data
        
        console.log('🔄 Poll status update:', { 
          assessmentId: assessmentId.slice(-8), 
          status, 
          progress, 
          stage, 
          message: message?.substring(0, 50) 
        })
        
        // Update state with new progress
        setState(prev => ({
          ...prev,
          currentAssessment: {
            id: assessmentId,
            status,
            progress: progress || prev.currentAssessment.progress,
            stage,
            message,
            error,
            company
          }
        }))

        // Animate progress smoothly to new value
        if (progress !== undefined && progress !== animatedProgressRef.current) {
          animateProgressTo(progress)
        }

        // If completed successfully, refresh data
        if (status === 'completed') {
          console.log('✅ Assessment completed, stopping polling and refreshing data...')
          
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
          
          // Animate to 100% before closing
          animateProgressTo(100)
          
          // Small delay to show 100% completion before closing modal
          setTimeout(async () => {
            setState(prev => ({
              ...prev,
              isRefreshing: false,
              currentAssessment: { 
                id: null, 
                status: null, 
                progress: 0,
                stage: undefined,
                message: undefined,
                error: undefined,
                company: undefined
              }
            }))
            
            console.log('🧹 Clearing all caches to ensure fresh data after assessment completion...')
            // Clear ALL visibility cache entries
            const keysToRemove: string[] = []
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i)
              if (key && key.startsWith('visibility_data_cache_')) {
                keysToRemove.push(key)
              }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key))
            maxVisibilityApi.clearCache()
            
            console.log('🔄 Calling loadAllData to refresh after completion...')
            // Force fresh data load
            await loadAllData(false, false) // no loading state, no cache
            console.log('✅ Data refresh completed after assessment')
            
            toast({
              title: "Scan completed",
              description: "Your visibility data has been updated.",
            })
          }, 1500) // 1.5 second delay to show completion

        } else if (status === 'failed') {
          console.log('❌ Assessment failed, stopping polling')
          
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
          
          setState(prev => ({
            ...prev,
            isRefreshing: false,
            currentAssessment: { 
              id: null, 
              status: null, 
              progress: 0,
              stage: undefined,
              message: undefined,
              error: undefined,
              company: undefined
            },
            error: error || 'Scan failed'
          }))
          
          toast({
            title: "Scan failed",
            description: error || "Something went wrong. Please try again.",
            variant: "destructive",
          })
        }
      } else {
        console.warn('❌ Failed to poll assessment status:', response.error)
        // Don't stop polling on API errors, might be temporary
        // But log more details for debugging
        console.warn('Poll response details:', {
          success: response.success,
          error: response.error,
          hasData: !!response.data
        })
      }
          } catch (error) {
        console.error('❌ Failed to poll assessment status:', error)
        // Don't stop polling on network errors, might be temporary
        // But log error details for debugging
        console.error('Poll error details:', {
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
          errorMessage: error instanceof Error ? error.message : String(error)
        })
    }
  }, [loadAllData, animateProgressTo])

  // Trigger a new scan/assessment
  const triggerScan = useCallback(async (type: 'lite' | 'max' = hasMaxAccess ? 'max' : 'lite') => {
    if (!subscription) {
      toast({
        title: "Subscription required",
        description: "Please upgrade your plan to run visibility scans.",
        variant: "destructive",
      })
      return
    }

    console.log('🚀 triggerScan called with type:', type)

    // Set up initial state - make sure progress modal shows
    setState(prev => ({ 
      ...prev, 
      isRefreshing: true, 
      error: null,
      currentAssessment: {
        id: null,
        status: 'pending',
        progress: 0,
        stage: 'setup',
        message: 'Preparing scan...',
        error: undefined,
        company: undefined
      }
    }))

    try {
      console.log('📡 Making API call to trigger assessment...')
      const response = await maxVisibilityApi.triggerAssessment(type)
      
      console.log('📋 API Response received:', {
        success: response.success,
        hasData: !!response.data,
        hasError: !!response.error,
        responseKeys: Object.keys(response),
        data: response.data,
        error: response.error
      })
      
      if (response.success && response.data) {
        const assessmentId = response.data.assessment_id
        console.log('✅ Assessment started with ID:', assessmentId)
        
        setState(prev => ({
          ...prev,
          currentAssessment: {
            id: assessmentId,
            status: 'pending',
            progress: 0,
            stage: 'setup',
            message: 'Assessment initialized...',
            error: undefined,
            company: undefined
          }
        }))

        // Initialize animated progress to match the starting progress
        animatedProgressRef.current = 0
        setAnimatedProgress(0)

        // Reset poll counter for new assessment
        pollCountRef.current = 0

        // Start polling for status updates with a slight delay to ensure modal shows
        setTimeout(() => {
          console.log('⏰ Starting status polling...')
          pollIntervalRef.current = setInterval(() => {
            pollAssessmentStatus(assessmentId)
          }, 2000) // Poll every 2 seconds
        }, 1000) // 1 second delay to ensure UI updates

        toast({
          title: "Scan started",
          description: `${type.toUpperCase()} visibility scan is now running.`,
        })
      } else {
        console.error('❌ Failed to start assessment:', {
          success: response.success,
          error: response.error,
          fullResponse: response
        })
        setState(prev => ({
          ...prev,
          isRefreshing: false,
          currentAssessment: {
            id: null,
            status: null,
            progress: 0,
            stage: undefined,
            message: undefined,
            error: undefined,
            company: undefined
          },
          error: handleApiError(response.error) || 'Unknown error occurred'
        }))
        
        toast({
          title: "Failed to start scan",
          description: handleApiError(response.error) || 'Unknown error occurred',
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('💥 triggerScan error:', error)
      setState(prev => ({
        ...prev,
        isRefreshing: false,
        currentAssessment: {
          id: null,
          status: null,
          progress: 0,
          stage: undefined,
          message: undefined,
          error: undefined,
          company: undefined
        },
        error: 'Failed to start scan'
      }))
      
      toast({
        title: "Failed to start scan",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }, [subscription, hasMaxAccess, pollAssessmentStatus])

  // Section-specific refresh functions
  const refreshCitations = useCallback(async (filters?: Record<string, any>) => {
    await loadCitations(filters)
  }, [loadCitations])

  const refreshGaps = useCallback(async (filters?: Record<string, any>) => {
    await loadGaps(filters)
  }, [loadGaps])

  const refreshInsights = useCallback(async () => {
    await loadInsights()
  }, [loadInsights])

  // Export data function
  const exportData = useCallback(async (
    format: 'csv' | 'json', 
    type: 'citations' | 'gaps' | 'insights'
  ): Promise<string | null> => {
    try {
      const response = await maxVisibilityApi.exportData(format, type)
      
      if (response.success && response.data) {
        return response.data.download_url
      } else {
        toast({
          title: "Export failed",
          description: handleApiError(response.error),
          variant: "destructive",
        })
        return null
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      })
      return null
    }
  }, [])

  // Clear error function
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      citationsError: null,
      gapsError: null,
      insightsError: null
    }))
  }, [])

  // Clear cache function
  const clearCache = useCallback(() => {
    console.log('🧹 Clearing all visibility cache...')
    
    // Clear ALL localStorage entries that start with 'visibility_data_cache_'
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('visibility_data_cache_')) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => {
      console.log(`🗑️ Removing cache key: ${key}`)
      localStorage.removeItem(key)
    })
    
    // Clear API client cache
    maxVisibilityApi.clearCache()
    
    setState(prev => ({
      ...prev,
      data: null,
      citations: [],
      gaps: [],
      insights: null,
      competitors: [],
      hasData: false
    }))
  }, [currentWorkspace?.id])



  // Single effect to handle workspace changes and data loading
  useEffect(() => {
    console.log('🔄 Workspace effect triggered:', { workspaceId: currentWorkspace?.id, subscription: !!subscription })
    
    if (!subscription) {
      console.log('⏳ No subscription yet, skipping data load')
      return
    }

    if (!currentWorkspace) {
      console.log('🧹 No workspace selected, clearing data')
      // Clear data when no workspace is selected
      setState(prev => ({
        ...prev,
        data: null,
        citations: [],
        gaps: [],
        insights: null,
        competitors: [],
        hasData: false,
        isInitialLoading: false
      }))
      return
    }

    // Handle workspace change
    console.log('🔄 Workspace changed, switching to:', currentWorkspace.id)
    
    // IMPORTANT: Set the workspace ID on the API client FIRST
    maxVisibilityApi.setWorkspaceId(currentWorkspace.id)
    
    // Clear all state immediately
    setState(prevState => ({
      ...prevState,
      data: null,
      citations: [],
      gaps: [],
      insights: null,
      competitors: [],
      hasData: false,
      lastUpdated: null,
      scanType: null,
      isInitialLoading: true,
      isLoading: false,
      isRefreshing: false,
      error: null,
      currentAssessment: {
        id: null,
        status: null,
        progress: 0,
        stage: undefined,
        message: undefined,
        error: undefined,
        company: undefined
      }
    }))
    
    // Clear ALL visibility cache entries to prevent cross-workspace contamination
    console.log('🧹 Clearing ALL visibility cache entries to prevent cross-workspace data...')
    
    // Clear all localStorage entries that start with 'visibility_data_cache_'
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('visibility_data_cache_')) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => {
      console.log(`🗑️ Removing cache key: ${key}`)
      localStorage.removeItem(key)
    })
    
    // Clear API client cache (this also clears based on the NEW workspace ID)
    maxVisibilityApi.clearCache()
    
    // Clear any active polling
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    pollCountRef.current = 0
    
    // Reset animated progress
    animatedProgressRef.current = 0
    setAnimatedProgress(0)
    
    // Cancel any pending animation frames
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = undefined
    }

    // Load feature access and initial data for new workspace
    const loadWorkspaceData = async () => {
      try {
        // Small delay to ensure cache clearing completes
        await new Promise(resolve => setTimeout(resolve, 100))
        
        console.log('📊 Loading fresh data for workspace:', currentWorkspace.id)
        await loadFeatureAccess()
        await loadInitialData()
        console.log('✅ Workspace data loaded successfully')
      } catch (error) {
        console.error('❌ Error loading workspace data:', error)
      }
    }

    loadWorkspaceData()
  }, [currentWorkspace?.id, subscription, loadFeatureAccess, loadInitialData])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return {
    // State
    ...state,
    
    // Replace progress with animated version for smoother UX
    currentAssessment: {
      ...state.currentAssessment,
      progress: animatedProgress
    },
    
    // Actions
    refresh,
    triggerScan,
    refreshCitations,
    refreshGaps,
    refreshInsights,
    clearError,
    clearCache,
    exportData,
    
    // Additional properties
    isInitialLoading: state.isInitialLoading
  }
} 
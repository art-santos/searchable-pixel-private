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

export interface UseMaxVisibilityReturn extends UseMaxVisibilityState, UseMaxVisibilityActions {}

export function useMaxVisibility(): UseMaxVisibilityReturn {
  const { subscription } = useSubscription()
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // State management
  const [state, setState] = useState<UseMaxVisibilityState>({
    data: null,
    citations: [],
    gaps: [],
    insights: null,
    competitors: [],
    isLoading: true,
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
      progress: 0
    }
  })

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

  // Load main visibility data
  const loadVisibilityData = useCallback(async (showLoading = true) => {
    console.log('📊 LoadVisibilityData called, showLoading:', showLoading)
    
    if (showLoading) {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
    }

    try {
      console.log('🌐 Calling maxVisibilityApi.getVisibilityData()...')
      const response = await maxVisibilityApi.getVisibilityData()
      console.log('📋 API Response:', { success: response.success, hasData: !!response.data, error: response.error })
      
      if (response.success && response.data) {
        console.log('✅ Found visibility data:', {
          score: response.data.score.overall_score,
          lastUpdated: response.data.last_updated,
          scanType: response.data.scan_type
        })
        
        setState(prev => ({
          ...prev,
          data: response.data!,
          hasData: true,
          lastUpdated: response.data!.last_updated,
          scanType: response.data!.scan_type,
          competitors: response.data!.competitive.competitors,
          isLoading: false,
          error: null
        }))
        
        console.log('✅ State updated with new visibility data')
      } else {
        console.log('ℹ️ No visibility data found or API error')
        setState(prev => ({
          ...prev,
          data: null,
          hasData: false,
          isLoading: false,
          error: handleApiError(response.error)
        }))
      }
    } catch (error) {
      console.error('❌ Error in loadVisibilityData:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load visibility data'
      }))
    }
  }, [])

  // Load citations data
  const loadCitations = useCallback(async (filters?: Record<string, any>) => {
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
  }, [])

  // Load gaps data
  const loadGaps = useCallback(async (filters?: Record<string, any>) => {
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
  }, [])

  // Load insights data
  const loadInsights = useCallback(async () => {
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
  }, [])

  // Poll assessment status
  const pollAssessmentStatus = useCallback(async (assessmentId: string) => {
    try {
      const response = await maxVisibilityApi.getAssessmentStatus(assessmentId)
      
      if (response.success && response.data) {
        const { status, progress, error } = response.data
        
        console.log('🔄 Poll status update:', { assessmentId: assessmentId.slice(-8), status, progress })
        
        setState(prev => ({
          ...prev,
          currentAssessment: {
            id: assessmentId,
            status,
            progress: progress || prev.currentAssessment.progress
          }
        }))

        // If completed successfully, refresh data
        if (status === 'completed') {
          console.log('✅ Assessment completed, stopping polling and refreshing data...')
          
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
          
          setState(prev => ({
            ...prev,
            isRefreshing: false,
            currentAssessment: { id: null, status: null, progress: 0 }
          }))
          
          console.log('🧹 Clearing API cache to ensure fresh data...')
          maxVisibilityApi.clearCache()
          
          console.log('🔄 Calling loadVisibilityData to refresh after completion...')
          await loadVisibilityData(false)
          console.log('✅ Data refresh completed after assessment')
          
          toast({
            title: "Scan completed",
            description: "Your visibility data has been updated.",
          })
        } else if (status === 'failed') {
          console.log('❌ Assessment failed, stopping polling')
          
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
          
          setState(prev => ({
            ...prev,
            isRefreshing: false,
            currentAssessment: { id: null, status: null, progress: 0 },
            error: error || 'Scan failed'
          }))
          
          toast({
            title: "Scan failed",
            description: error || "Something went wrong. Please try again.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error('Failed to poll assessment status:', error)
    }
  }, [loadVisibilityData])

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

    setState(prev => ({ ...prev, isRefreshing: true, error: null }))

    try {
      const response = await maxVisibilityApi.triggerAssessment(type)
      
      if (response.success && response.data) {
        const assessmentId = response.data.assessment_id
        
        setState(prev => ({
          ...prev,
          currentAssessment: {
            id: assessmentId,
            status: 'pending',
            progress: 0
          }
        }))

        // Start polling for status updates
        pollIntervalRef.current = setInterval(() => {
          pollAssessmentStatus(assessmentId)
        }, 2000) // Poll every 2 seconds

        toast({
          title: "Scan started",
          description: `${type.toUpperCase()} visibility scan is now running.`,
        })
      } else {
        setState(prev => ({
          ...prev,
          isRefreshing: false,
          error: handleApiError(response.error)
        }))
        
        toast({
          title: "Failed to start scan",
          description: handleApiError(response.error),
          variant: "destructive",
        })
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isRefreshing: false,
        error: 'Failed to start scan'
      }))
      
      toast({
        title: "Failed to start scan",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }, [subscription, hasMaxAccess, pollAssessmentStatus])

  // Main refresh function
  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, isRefreshing: true }))
    await loadVisibilityData(false)
    setState(prev => ({ ...prev, isRefreshing: false }))
  }, [loadVisibilityData])

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
    maxVisibilityApi.clearCache()
    toast({
      title: "Cache cleared",
      description: "Data cache has been cleared. Fresh data will be loaded on next request.",
    })
  }, [])

  // Initial data loading
  useEffect(() => {
    if (subscription) {
      loadFeatureAccess()
      loadVisibilityData()
    }
  }, [subscription, loadFeatureAccess, loadVisibilityData])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  return {
    // State
    ...state,
    
    // Actions
    refresh,
    triggerScan,
    refreshCitations,
    refreshGaps,
    refreshInsights,
    clearError,
    clearCache,
    exportData
  }
} 
import { useState, useEffect, useCallback, useRef } from 'react'
import { crawlerAttributionApi, handleApiError } from '@/lib/crawler-attribution/api-client'
import { 
  DashboardData, 
  CrawlerStats, 
  CompanyAttribution, 
  ContentHit, 
  CrawlerVisit,
  AttributionReport,
  CrawlerDetectionRule
} from '@/lib/crawler-attribution/types'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useSubscription } from '@/hooks/useSubscription'
import { toast } from '@/components/ui/use-toast'

interface UseCrawlerAttributionState {
  // Main dashboard data
  dashboardData: DashboardData | null
  
  // Individual section data
  crawlerStats: CrawlerStats[]
  companyAttributions: CompanyAttribution[]
  contentHits: ContentHit[]
  recentVisits: CrawlerVisit[]
  reports: AttributionReport[]
  detectionRules: CrawlerDetectionRule[]
  
  // Loading states
  isLoading: boolean
  isInitialLoading: boolean
  isRefreshing: boolean
  isLoadingStats: boolean
  isLoadingCompanies: boolean
  isLoadingContent: boolean
  isGeneratingReport: boolean
  
  // Error states
  error: string | null
  statsError: string | null
  companiesError: string | null
  contentError: string | null
  
  // Meta information
  lastUpdated: string | null
  hasData: boolean
  currentTimeframe: string
  
  // Real-time tracking
  isTracking: boolean
  visitCount24h: number
  lastVisitTimestamp: string | null
}

interface UseCrawlerAttributionActions {
  // Main actions
  refresh: () => Promise<void>
  setTimeframe: (timeframe: string) => void
  
  // Section-specific refreshes
  refreshStats: () => Promise<void>
  refreshCompanies: (filters?: Record<string, any>) => Promise<void>
  refreshContent: (filters?: Record<string, any>) => Promise<void>
  refreshRecentVisits: () => Promise<void>
  
  // Report generation
  generateReport: (timeframe?: string) => Promise<AttributionReport | null>
  
  // Setup and configuration
  getTrackingSnippet: (domain: string) => Promise<string | null>
  updateDetectionRule: (id: string, updates: Partial<CrawlerDetectionRule>) => Promise<boolean>
  
  // Export functionality
  exportData: (type: 'visits' | 'companies' | 'content' | 'reports', format: 'csv' | 'json') => Promise<string | null>
  
  // Utility actions
  clearError: () => void
  clearCache: () => void
}

export interface UseCrawlerAttributionReturn extends UseCrawlerAttributionState, UseCrawlerAttributionActions {}

// Cache management
const CACHE_KEY_PREFIX = 'crawler_attribution_'
const CACHE_TTL = 2 * 60 * 1000 // 2 minutes

interface CacheEntry {
  data: any
  timestamp: number
}

export function useCrawlerAttribution(): UseCrawlerAttributionReturn {
  const { currentWorkspace } = useWorkspace()
  const { subscription } = useSubscription()
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // State management
  const [state, setState] = useState<UseCrawlerAttributionState>({
    dashboardData: null,
    crawlerStats: [],
    companyAttributions: [],
    contentHits: [],
    recentVisits: [],
    reports: [],
    detectionRules: [],
    isLoading: false,
    isInitialLoading: true,
    isRefreshing: false,
    isLoadingStats: false,
    isLoadingCompanies: false,
    isLoadingContent: false,
    isGeneratingReport: false,
    error: null,
    statsError: null,
    companiesError: null,
    contentError: null,
    lastUpdated: null,
    hasData: false,
    currentTimeframe: '30d',
    isTracking: false,
    visitCount24h: 0,
    lastVisitTimestamp: null
  })

  // Cache utilities
  const getCacheKey = useCallback((key: string) => 
    `${CACHE_KEY_PREFIX}${currentWorkspace?.id || 'default'}_${key}`
  , [currentWorkspace?.id])

  const loadFromCache = useCallback((key: string): any | null => {
    try {
      const cached = localStorage.getItem(getCacheKey(key))
      if (cached) {
        const { data, timestamp }: CacheEntry = JSON.parse(cached)
        const age = Date.now() - timestamp
        if (age < CACHE_TTL) {
          return data
        }
        localStorage.removeItem(getCacheKey(key))
      }
    } catch (error) {
      console.error('Failed to load from cache:', error)
    }
    return null
  }, [getCacheKey])

  const saveToCache = useCallback((key: string, data: any) => {
    try {
      const cacheEntry: CacheEntry = { data, timestamp: Date.now() }
      localStorage.setItem(getCacheKey(key), JSON.stringify(cacheEntry))
    } catch (error) {
      console.error('Failed to save to cache:', error)
    }
  }, [getCacheKey])

  // Load dashboard data
  const loadDashboardData = useCallback(async (useCache = true) => {
    if (!currentWorkspace?.id) {
      console.log('⏸️ No workspace selected, skipping dashboard load')
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isInitialLoading: false,
        error: null 
      }))
      return
    }

    // Try cache first if requested
    if (useCache) {
      const cached = loadFromCache(`dashboard_${state.currentTimeframe}`)
      if (cached) {
        console.log('📦 Using cached dashboard data')
        setState(prev => ({
          ...prev,
          dashboardData: cached,
          hasData: !!cached,
          lastUpdated: cached?.chart_data?.[cached.chart_data.length - 1]?.date || null,
          isInitialLoading: false
        }))
        return
      }
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await crawlerAttributionApi.getDashboardData(state.currentTimeframe)
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          dashboardData: response.data!,
          hasData: true,
          lastUpdated: response.timestamp,
          isLoading: false,
          isInitialLoading: false,
          error: null,
          visitCount24h: response.data!.recent_visits?.length || 0,
          lastVisitTimestamp: response.data!.recent_visits?.[0]?.timestamp || null
        }))
        
        // Cache the data
        saveToCache(`dashboard_${state.currentTimeframe}`, response.data)
        console.log('✅ Dashboard data loaded successfully')
      } else {
        // No data available - not an error
        setState(prev => ({
          ...prev,
          dashboardData: null,
          hasData: false,
          isLoading: false,
          isInitialLoading: false,
          error: null // Important: no error for empty state
        }))
        console.log('📭 No attribution data found - showing empty state')
      }
    } catch (error) {
      console.error('❌ Failed to load dashboard data:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        isInitialLoading: false,
        error: handleApiError(error)
      }))
    }
  }, [currentWorkspace?.id, state.currentTimeframe, loadFromCache, saveToCache])

  // Load crawler statistics
  const loadCrawlerStats = useCallback(async () => {
    if (!currentWorkspace?.id) return

    setState(prev => ({ ...prev, isLoadingStats: true, statsError: null }))

    try {
      const response = await crawlerAttributionApi.getCrawlerStats(state.currentTimeframe)
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          crawlerStats: response.data || [],
          isLoadingStats: false,
          statsError: null
        }))
      } else {
        setState(prev => ({
          ...prev,
          isLoadingStats: false,
          statsError: handleApiError(response.error)
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoadingStats: false,
        statsError: handleApiError(error)
      }))
    }
  }, [currentWorkspace?.id, state.currentTimeframe])

  // Load company attributions
  const loadCompanyAttributions = useCallback(async (filters?: Record<string, any>) => {
    if (!currentWorkspace?.id) return

    setState(prev => ({ ...prev, isLoadingCompanies: true, companiesError: null }))

    try {
      const response = await crawlerAttributionApi.getCompanyAttributions(state.currentTimeframe, filters)
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          companyAttributions: response.data || [],
          isLoadingCompanies: false,
          companiesError: null
        }))
      } else {
        setState(prev => ({
          ...prev,
          isLoadingCompanies: false,
          companiesError: handleApiError(response.error)
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoadingCompanies: false,
        companiesError: handleApiError(error)
      }))
    }
  }, [currentWorkspace?.id, state.currentTimeframe])

  // Load content hits
  const loadContentHits = useCallback(async (filters?: Record<string, any>) => {
    if (!currentWorkspace?.id) return

    setState(prev => ({ ...prev, isLoadingContent: true, contentError: null }))

    try {
      const response = await crawlerAttributionApi.getContentHits(state.currentTimeframe, filters)
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          contentHits: response.data || [],
          isLoadingContent: false,
          contentError: null
        }))
      } else {
        setState(prev => ({
          ...prev,
          isLoadingContent: false,
          contentError: handleApiError(response.error)
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoadingContent: false,
        contentError: handleApiError(error)
      }))
    }
  }, [currentWorkspace?.id, state.currentTimeframe])

  // Load recent visits
  const loadRecentVisits = useCallback(async () => {
    if (!currentWorkspace?.id) return

    try {
      const response = await crawlerAttributionApi.getRecentVisits(50)
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          recentVisits: response.data || []
        }))
      }
    } catch (error) {
      console.error('Failed to load recent visits:', error)
    }
  }, [currentWorkspace?.id])

  // Start real-time polling for recent visits
  const startRealTimeTracking = useCallback(() => {
    if (pollIntervalRef.current) return

    setState(prev => ({ ...prev, isTracking: true }))
    
    // Poll every 30 seconds for new visits
    pollIntervalRef.current = setInterval(() => {
      loadRecentVisits()
    }, 30000)

    console.log('🔄 Started real-time tracking')
  }, [loadRecentVisits])

  // Stop real-time polling
  const stopRealTimeTracking = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    setState(prev => ({ ...prev, isTracking: false }))
    console.log('⏹️ Stopped real-time tracking')
  }, [])

  // Public actions
  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, isRefreshing: true }))
    crawlerAttributionApi.clearCache()
    
    await Promise.all([
      loadDashboardData(false), // force fresh data
      loadCrawlerStats(),
      loadCompanyAttributions(),
      loadContentHits(),
      loadRecentVisits()
    ])
    
    setState(prev => ({ ...prev, isRefreshing: false }))
  }, [loadDashboardData, loadCrawlerStats, loadCompanyAttributions, loadContentHits, loadRecentVisits])

  const setTimeframe = useCallback((timeframe: string) => {
    setState(prev => ({ ...prev, currentTimeframe: timeframe }))
  }, [])

  const generateReport = useCallback(async (timeframe?: string): Promise<AttributionReport | null> => {
    setState(prev => ({ ...prev, isGeneratingReport: true }))

    try {
      const response = await crawlerAttributionApi.generateReport(
        timeframe || state.currentTimeframe,
        true
      )
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          reports: [response.data!, ...prev.reports],
          isGeneratingReport: false
        }))
        
        toast({
          title: 'Report generated',
          description: 'Your attribution report has been generated successfully'
        })
        
        return response.data
      } else {
        throw new Error(response.error || 'Failed to generate report')
      }
    } catch (error) {
      setState(prev => ({ ...prev, isGeneratingReport: false }))
      toast({
        title: 'Report generation failed',
        description: handleApiError(error),
        variant: 'destructive'
      })
      return null
    }
  }, [state.currentTimeframe])

  const getTrackingSnippet = useCallback(async (domain: string): Promise<string | null> => {
    try {
      const response = await crawlerAttributionApi.getTrackingSnippet(domain)
      
      if (response.success && response.data) {
        return response.data
      } else {
        toast({
          title: 'Failed to generate tracking snippet',
          description: handleApiError(response.error),
          variant: 'destructive'
        })
        return null
      }
    } catch (error) {
      toast({
        title: 'Failed to generate tracking snippet',
        description: handleApiError(error),
        variant: 'destructive'
      })
      return null
    }
  }, [])

  const updateDetectionRule = useCallback(async (
    id: string, 
    updates: Partial<CrawlerDetectionRule>
  ): Promise<boolean> => {
    try {
      const response = await crawlerAttributionApi.updateDetectionRule(id, updates)
      
      if (response.success) {
        toast({
          title: 'Detection rule updated',
          description: 'The crawler detection rule has been updated successfully'
        })
        return true
      } else {
        throw new Error(response.error || 'Failed to update detection rule')
      }
    } catch (error) {
      toast({
        title: 'Update failed',
        description: handleApiError(error),
        variant: 'destructive'
      })
      return false
    }
  }, [])

  const exportData = useCallback(async (
    type: 'visits' | 'companies' | 'content' | 'reports',
    format: 'csv' | 'json'
  ): Promise<string | null> => {
    try {
      const response = await crawlerAttributionApi.exportData(type, format, state.currentTimeframe)
      
      if (response.success && response.data) {
        // Create and trigger download
        const blob = new Blob([response.data], { 
          type: format === 'csv' ? 'text/csv' : 'application/json' 
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `split-attribution-${type}-${Date.now()}.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        toast({
          title: 'Export successful',
          description: `Your ${type} data has been exported as ${format.toUpperCase()}`
        })
        
        return response.data
      } else {
        throw new Error(response.error || 'Failed to export data')
      }
    } catch (error) {
      toast({
        title: 'Export failed',
        description: handleApiError(error),
        variant: 'destructive'
      })
      return null
    }
  }, [state.currentTimeframe])

  const clearError = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      error: null, 
      statsError: null, 
      companiesError: null, 
      contentError: null 
    }))
  }, [])

  const clearCache = useCallback(() => {
    crawlerAttributionApi.clearCache()
    // Clear localStorage cache
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  }, [])

  // Initial data load
  useEffect(() => {
    if (currentWorkspace?.id) {
      loadDashboardData(true) // use cache on initial load
      startRealTimeTracking()
    }

    return () => {
      stopRealTimeTracking()
    }
  }, [currentWorkspace?.id, loadDashboardData, startRealTimeTracking, stopRealTimeTracking])

  // Reload data when timeframe changes
  useEffect(() => {
    if (currentWorkspace?.id && !state.isInitialLoading) {
      loadDashboardData(false) // force fresh data when timeframe changes
    }
  }, [state.currentTimeframe, currentWorkspace?.id, loadDashboardData, state.isInitialLoading])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRealTimeTracking()
    }
  }, [stopRealTimeTracking])

  return {
    // State
    ...state,
    
    // Actions
    refresh,
    setTimeframe,
    refreshStats: loadCrawlerStats,
    refreshCompanies: loadCompanyAttributions,
    refreshContent: loadContentHits,
    refreshRecentVisits: loadRecentVisits,
    generateReport,
    getTrackingSnippet,
    updateDetectionRule,
    exportData,
    clearError,
    clearCache
  }
} 
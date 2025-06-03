import { createClient } from '@/lib/supabase/client'

// Base interfaces for API responses
export interface VisibilityScore {
  overall_score: number
  lite_score?: number
  max_score?: number
  trend_change?: number
  trend_period?: string
}

export interface CitationData {
  id: string
  engine: string
  query: string
  match_type: 'direct' | 'indirect'
  snippet: string
  date: string
  url?: string
  sentiment?: 'positive' | 'negative' | 'neutral'
  confidence?: number
  sources?: string[]
  engagement_score?: number
}

export interface CompetitorData {
  id: string
  name: string
  url: string
  score: number
  rank: number
  market_position?: string
  trend?: 'up' | 'down' | 'stable'
}

export interface GapData {
  id: string
  prompt: string
  status: 'missing' | 'weak' | 'covered'
  search_volume: 'high' | 'medium' | 'low'
  difficulty: 'high' | 'medium' | 'low'
  suggestion: string
  priority: 'high' | 'medium' | 'low'
  opportunity_score?: number
  competitor_coverage?: string[]
  estimated_traffic?: number
  content_gap_type?: string
}

export interface InsightData {
  trends: Array<{
    id: string
    title: string
    description: string
    trend: 'up' | 'down'
    impact: 'high' | 'medium' | 'low'
    change: string
    period: string
  }>
  recommendations: Array<{
    id: string
    category: string
    title: string
    description: string
    priority: 'high' | 'medium' | 'low'
    effort: 'high' | 'medium' | 'low'
    impact: number
    timeframe: string
  }>
  quick_wins: Array<{
    id: string
    title: string
    description: string
    effort: number
    impact: number
    timeframe: string
  }>
  competitive_alerts?: Array<{
    id: string
    type: 'opportunity' | 'threat'
    title: string
    description: string
    action: string
  }>
}

export interface VisibilityData {
  score: VisibilityScore
  citations: {
    direct_count: number
    indirect_count: number
    total_count: number
    sentiment_score?: number
    coverage_rate?: number
    recent_mentions: CitationData[]
  }
  competitive: {
    current_rank: number
    total_competitors: number
    competitors: CompetitorData[]
    percentile?: number
    improvement_potential?: number
  }
  last_updated: string
  scan_type: 'lite' | 'max'
  chartData?: Array<{
    date: string
    score: number
    fullDate: string
  }>
}

export interface MaxVisibilityApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
  cached?: boolean
  fresh_until?: string
}

class MaxVisibilityApiClient {
  private supabase = createClient()
  private cache = new Map<string, { data: any; expires: number }>()
  private readonly cacheDuration = 5 * 60 * 1000 // 5 minutes

  private getCacheKey(endpoint: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : ''
    return `${endpoint}:${paramString}`
  }

  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (cached && cached.expires > Date.now()) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + this.cacheDuration
    })
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    params?: Record<string, any>
  ): Promise<MaxVisibilityApiResponse<T>> {
    try {
      const cacheKey = this.getCacheKey(endpoint, params)
      const cached = this.getCached<T>(cacheKey)
      
      if (cached) {
        return {
          data: cached,
          error: null,
          success: true,
          cached: true
        }
      }

      const url = new URL(`/api/max-visibility${endpoint}`, window.location.origin)
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, String(value))
        })
      }

      const { data: { session } } = await this.supabase.auth.getSession()
      
      const response = await fetch(url.toString(), {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
          ...options.headers,
        },
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success && result.data) {
        this.setCache(cacheKey, result.data)
      }

      return result
    } catch (error) {
      console.error(`Max Visibility API Error (${endpoint}):`, error)
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false
      }
    }
  }

  // Main visibility data endpoint
  async getVisibilityData(timeframe?: string): Promise<MaxVisibilityApiResponse<VisibilityData>> {
    return this.makeRequest<VisibilityData>('/data', { method: 'GET' }, 
      timeframe ? { timeframe } : undefined
    )
  }

  // Trigger a new assessment/scan
  async triggerAssessment(type: 'lite' | 'max' = 'lite'): Promise<MaxVisibilityApiResponse<{ assessment_id: string }>> {
    return this.makeRequest<{ assessment_id: string }>('/assessments', {
      method: 'POST',
      body: JSON.stringify({ type })
    })
  }

  // Get assessment status
  async getAssessmentStatus(assessmentId: string): Promise<MaxVisibilityApiResponse<{ 
    status: 'pending' | 'running' | 'completed' | 'failed'
    progress?: number
    stage?: string
    message?: string
    error?: string
    company?: string
  }>> {
    return this.makeRequest(`/assessments/${assessmentId}/status`)
  }

  // Get detailed citations data
  async getCitations(params?: {
    engine?: string
    match_type?: string
    limit?: number
    offset?: number
  }): Promise<MaxVisibilityApiResponse<{
    citations: CitationData[]
    total: number
    filters: {
      engines: string[]
      match_types: string[]
    }
  }>> {
    return this.makeRequest<{
      citations: CitationData[]
      total: number
      filters: { engines: string[]; match_types: string[] }
    }>('/citations', { method: 'GET' }, params)
  }

  // Get competitive analysis
  async getCompetitiveAnalysis(): Promise<MaxVisibilityApiResponse<{
    user_rank: number
    total_competitors: number
    competitors: CompetitorData[]
    market_insights: any
  }>> {
    return this.makeRequest('/competitive')
  }

  // Get content gaps analysis
  async getContentGaps(params?: {
    priority?: string
    status?: string
    type?: string
  }): Promise<MaxVisibilityApiResponse<{
    gaps: GapData[]
    summary: {
      missing: number
      weak: number
      high_priority: number
      estimated_traffic: number
    }
  }>> {
    return this.makeRequest('/gaps', { method: 'GET' }, params)
  }

  // Get AI-powered insights
  async getInsights(): Promise<MaxVisibilityApiResponse<InsightData>> {
    return this.makeRequest<InsightData>('/insights')
  }

  // Get trend analysis
  async getTrends(timeframe?: string): Promise<MaxVisibilityApiResponse<{
    trends: Array<{
      metric: string
      current_value: number
      previous_value: number
      change_percentage: number
      trend_direction: 'up' | 'down' | 'stable'
      significance: 'high' | 'medium' | 'low'
    }>
    predictions: Array<{
      metric: string
      predicted_value: number
      confidence: number
      timeframe: string
    }>
  }>> {
    return this.makeRequest('/trends', { method: 'GET' }, 
      timeframe ? { timeframe } : undefined
    )
  }

  // Get recommendations
  async getRecommendations(): Promise<MaxVisibilityApiResponse<{
    recommendations: Array<{
      id: string
      type: string
      title: string
      description: string
      priority: 'high' | 'medium' | 'low'
      effort: 'high' | 'medium' | 'low'
      impact_score: number
      implementation: {
        steps: string[]
        timeframe: string
        resources: string[]
      }
    }>
    quick_wins: Array<{
      id: string
      title: string
      description: string
      effort: number
      impact: number
      timeframe: string
    }>
  }>> {
    return this.makeRequest('/recommendations')
  }

  // Export data functionality
  async exportData(format: 'csv' | 'json', type: 'citations' | 'gaps' | 'insights'): Promise<MaxVisibilityApiResponse<{
    download_url: string
    expires_at: string
  }>> {
    return this.makeRequest('/export', {
      method: 'POST',
      body: JSON.stringify({ format, type })
    })
  }

  // Check subscription and feature access
  async getFeatureAccess(): Promise<MaxVisibilityApiResponse<{
    plan: string
    has_max_access: boolean
    features: {
      citations: boolean
      competitive: boolean
      gaps: boolean
      insights: boolean
      trends: boolean
      recommendations: boolean
      export: boolean
    }
    usage: {
      scans_used: number
      scans_limit: number
      last_scan: string | null
    }
  }>> {
    return this.makeRequest('/features')
  }

  // Clear cache (useful for forcing fresh data)
  clearCache(): void {
    this.cache.clear()
  }

  // Clear specific cache entry
  clearCacheEntry(endpoint: string, params?: Record<string, any>): void {
    const key = this.getCacheKey(endpoint, params)
    this.cache.delete(key)
  }
}

// Export singleton instance
export const maxVisibilityApi = new MaxVisibilityApiClient()

// Helper function to handle common error cases
export function handleApiError(error: string | null): string {
  if (!error) return ''
  
  if (error.includes('401') || error.includes('unauthorized')) {
    return 'Please log in to access visibility data'
  }
  
  if (error.includes('403') || error.includes('forbidden')) {
    return 'Upgrade your plan to access this feature'
  }
  
  if (error.includes('429') || error.includes('rate limit')) {
    return 'Too many requests. Please try again in a moment'
  }
  
  if (error.includes('500') || error.includes('internal server')) {
    return 'Server error. Please try again later'
  }
  
  return error
} 
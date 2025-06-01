// Unified Data API for MAX Visibility System
// Intelligent API that serves both Lite and MAX data with fallback and caching

import { 
  MaxAssessmentResult,
  MaxQuestionAnalysis,
  CompetitiveLandscape,
  ScoringBreakdown
} from '@/types/max-visibility'
import { TrendSummary } from './trend-analysis'
import { RecommendationSuite } from './recommendation-engine'
import { DataTransformer, UnifiedVisibilityData, LegacyAEOData } from './transformers'
import { createClient } from '@/lib/supabase/client'

export interface DataRequest {
  company_id: string
  user_id?: string
  request_type: 'visibility_data' | 'competitive_analysis' | 'trends' | 'recommendations' | 'full_suite'
  preferences?: {
    include_historical?: boolean
    include_predictions?: boolean
    include_competitors?: boolean
    max_cache_age_minutes?: number
    fallback_to_lite?: boolean
    lite_only?: boolean
  }
  filters?: {
    date_range?: {
      start_date: string
      end_date: string
    }
    metrics?: string[]
    competitors?: string[]
  }
}

export interface DataResponse {
  success: boolean
  data_source: 'max_only' | 'lite_only' | 'max_with_lite_fallback' | 'lite_with_max_enhancement'
  cache_status: 'hit' | 'miss' | 'partial' | 'refreshed'
  data_freshness: 'fresh' | 'recent' | 'stale'
  confidence_score: number
  
  // Core data
  visibility_data?: UnifiedVisibilityData
  competitive_data?: CompetitiveLandscape
  trend_data?: TrendSummary
  recommendations?: RecommendationSuite
  
  // Metadata
  meta: {
    generated_at: string
    processing_time_ms: number
    data_sources_used: string[]
    fallback_reasons?: string[]
    cache_info: {
      cached_components: string[]
      cache_age_minutes: number
      cache_expires_at: string
    }
    usage_info: {
      api_calls_made: number
      rate_limit_remaining: number
      cost_estimate: string
    }
  }
  
  // Lite vs MAX comparison
  upgrade_insights?: {
    current_plan: 'lite' | 'max'
    max_advantages: string[]
    potential_improvements: {
      metric: string
      lite_value?: number
      estimated_max_value: number
      improvement_percentage: number
    }[]
    upgrade_value_proposition: string
  }
}

export interface CacheEntry {
  cache_key: string
  data: any
  created_at: string
  expires_at: string
  data_type: string
  company_id: string
  confidence_score: number
  source: 'max' | 'lite' | 'combined'
}

export interface UsageMetrics {
  company_id: string
  user_id?: string
  request_type: string
  data_source: string
  processing_time_ms: number
  cache_hit: boolean
  api_calls_made: number
  timestamp: string
  cost_estimate: number
}

export class UnifiedDataAPI {
  private supabase: ReturnType<typeof createClient>
  private cache: Map<string, CacheEntry> = new Map()
  private usageMetrics: UsageMetrics[] = []
  
  // Cache configuration
  private cacheConfig = {
    visibility_data: { ttl_minutes: 60, max_age_minutes: 240 },
    competitive_data: { ttl_minutes: 120, max_age_minutes: 480 },
    trend_data: { ttl_minutes: 30, max_age_minutes: 120 },
    recommendations: { ttl_minutes: 240, max_age_minutes: 1440 } // 24 hours
  }

  constructor() {
    this.supabase = createClient()
    this.initializeCache()
  }

  /**
   * Main unified data retrieval method
   */
  async getData(request: DataRequest): Promise<DataResponse> {
    const startTime = Date.now()
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      // Validate request
      this.validateRequest(request)
      
      // Check cache first
      const cacheResult = await this.checkCache(request)
      if (cacheResult.hit) {
        return this.buildResponse(cacheResult.data, {
          cache_status: 'hit',
          processing_time_ms: Date.now() - startTime,
          data_sources_used: [cacheResult.source],
          request
        })
      }

      // Determine data strategy
      const strategy = await this.determineDataStrategy(request)
      
      // Execute data retrieval based on strategy
      let responseData: any = {}
      let dataSource: DataResponse['data_source'] = 'max_only'
      let fallbackReasons: string[] = []
      let apiCallsCount = 0
      
      switch (strategy.primary) {
        case 'max_only':
          const maxResult = await this.getMaxData(request)
          responseData = maxResult.data
          dataSource = 'max_only'
          apiCallsCount = maxResult.api_calls
          break
          
        case 'lite_only':
          const liteResult = await this.getLiteData(request)
          responseData = liteResult.data
          dataSource = 'lite_only'
          apiCallsCount = liteResult.api_calls
          break
          
        case 'max_with_lite_fallback':
          try {
            const maxResult = await this.getMaxData(request)
            responseData = maxResult.data
            dataSource = 'max_only'
            apiCallsCount = maxResult.api_calls
          } catch (error) {
            console.warn('MAX data retrieval failed, falling back to Lite:', error)
            const liteResult = await this.getLiteData(request)
            responseData = liteResult.data
            dataSource = 'lite_only'
            apiCallsCount = liteResult.api_calls
            fallbackReasons.push('MAX data unavailable')
          }
          break
          
        case 'combined':
          const combinedResult = await this.getCombinedData(request)
          responseData = combinedResult.data
          dataSource = 'max_with_lite_fallback'
          apiCallsCount = combinedResult.api_calls
          fallbackReasons = combinedResult.fallback_reasons || []
          break
      }

      // Cache the results
      await this.cacheResults(request, responseData, dataSource)
      
      // Track usage
      this.trackUsage({
        company_id: request.company_id,
        user_id: request.user_id,
        request_type: request.request_type,
        data_source: dataSource,
        processing_time_ms: Date.now() - startTime,
        cache_hit: false,
        api_calls_made: apiCallsCount,
        timestamp: new Date().toISOString(),
        cost_estimate: this.calculateCostEstimate(apiCallsCount, request.request_type)
      })

      // Build final response
      return this.buildResponse(responseData, {
        cache_status: 'miss',
        processing_time_ms: Date.now() - startTime,
        data_sources_used: this.getDataSourcesUsed(dataSource, responseData),
        fallback_reasons,
        api_calls_made: apiCallsCount,
        request
      })

    } catch (error) {
      console.error('Unified Data API error:', error)
      
      // Attempt emergency fallback
      try {
        const emergencyData = await this.getEmergencyFallback(request)
        return this.buildErrorResponse(error as Error, emergencyData, Date.now() - startTime)
      } catch (fallbackError) {
        return this.buildErrorResponse(error as Error, null, Date.now() - startTime)
      }
    }
  }

  /**
   * Get MAX data only
   */
  private async getMaxData(request: DataRequest): Promise<{ data: any; api_calls: number }> {
    let apiCalls = 0
    const data: any = {}

    // Get latest MAX assessment
    const { data: assessment, error } = await this.supabase
      .from('max_assessments')
      .select(`
        *,
        companies!inner(id, name, domain, description, industry)
      `)
      .eq('company_id', request.company_id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !assessment) {
      throw new Error('No MAX assessment data available')
    }

    // Get question analyses
    const { data: analyses } = await this.supabase
      .from('max_question_analyses')
      .select('*')
      .eq('assessment_id', assessment.id)

    const maxResult: MaxAssessmentResult = {
      assessment_id: assessment.id,
      company: assessment.companies,
      visibility_scores: assessment.visibility_scores,
      question_analyses: analyses || [],
      completed_at: assessment.completed_at,
      processing_time_ms: assessment.processing_time_ms || 0
    }

    // Build unified visibility data
    if (request.request_type === 'visibility_data' || request.request_type === 'full_suite') {
      data.visibility_data = DataTransformer.transformMaxToUnified(maxResult)
      apiCalls += 1
    }

    // Get competitive data if requested
    if ((request.request_type === 'competitive_analysis' || request.request_type === 'full_suite') && 
        request.preferences?.include_competitors) {
      // This would call the competitive analyzer
      // For now, we'll simulate the call
      apiCalls += 2
    }

    // Get trend data if requested
    if ((request.request_type === 'trends' || request.request_type === 'full_suite') && 
        request.preferences?.include_historical) {
      // This would call the trend analyzer
      // For now, we'll simulate the call
      apiCalls += 1
    }

    // Get recommendations if requested
    if (request.request_type === 'recommendations' || request.request_type === 'full_suite') {
      // This would call the recommendation engine
      // For now, we'll simulate the call
      apiCalls += 3
    }

    return { data, api_calls: apiCalls }
  }

  /**
   * Get Lite data only (simulated - would integrate with existing AEO system)
   */
  private async getLiteData(request: DataRequest): Promise<{ data: any; api_calls: number }> {
    // This would integrate with the existing Lite AEO system
    // For now, we'll return a simulated response
    
    const data: any = {}
    let apiCalls = 1

    if (request.request_type === 'visibility_data' || request.request_type === 'full_suite') {
      // Simulate lite visibility data
      data.visibility_data = {
        lite_score: 0.65,
        combined_score: 0.65,
        score_confidence: 0.7,
        data_source: 'lite_only',
        topic_visibility: [],
        competitive_benchmarking: [],
        citation_analysis: { total_citations: 0, breakdown: {} },
        ai_recommendations: []
      }
    }

    return { data, api_calls: apiCalls }
  }

  /**
   * Get combined MAX and Lite data
   */
  private async getCombinedData(request: DataRequest): Promise<{ 
    data: any; 
    api_calls: number; 
    fallback_reasons?: string[] 
  }> {
    let totalApiCalls = 0
    let fallbackReasons: string[] = []
    const data: any = {}

    try {
      // Try to get MAX data first
      const maxResult = await this.getMaxData(request)
      data.max_data = maxResult.data
      totalApiCalls += maxResult.api_calls
    } catch (error) {
      fallbackReasons.push('MAX data unavailable, using Lite data only')
    }

    try {
      // Get Lite data for comparison/enhancement
      const liteResult = await this.getLiteData(request)
      data.lite_data = liteResult.data
      totalApiCalls += liteResult.api_calls
      
      // Combine the data if we have both
      if (data.max_data && data.lite_data) {
        data.combined_data = this.combineMaxAndLiteData(data.max_data, data.lite_data)
      }
    } catch (error) {
      if (!data.max_data) {
        throw new Error('Both MAX and Lite data unavailable')
      }
      fallbackReasons.push('Lite data unavailable, using MAX data only')
    }

    return { data, api_calls: totalApiCalls, fallback_reasons: fallbackReasons }
  }

  /**
   * Combine MAX and Lite data intelligently
   */
  private combineMaxAndLiteData(maxData: any, liteData: any): any {
    // Intelligent combination logic
    return {
      ...maxData,
      lite_comparison: liteData,
      confidence_boost: 0.1, // Higher confidence when we have both sources
      data_source: 'max_with_lite_enhancement'
    }
  }

  /**
   * Check cache for existing data
   */
  private async checkCache(request: DataRequest): Promise<{ 
    hit: boolean; 
    data?: any; 
    source?: string 
  }> {
    const cacheKey = this.generateCacheKey(request)
    const cached = this.cache.get(cacheKey)
    
    if (!cached) {
      return { hit: false }
    }

    // Check if cache is still valid
    const now = new Date()
    const expiresAt = new Date(cached.expires_at)
    
    if (now > expiresAt) {
      this.cache.delete(cacheKey)
      return { hit: false }
    }

    // Check if cache meets freshness requirements
    const maxAge = request.preferences?.max_cache_age_minutes || 60
    const cacheAge = (now.getTime() - new Date(cached.created_at).getTime()) / (1000 * 60)
    
    if (cacheAge > maxAge) {
      return { hit: false }
    }

    return { 
      hit: true, 
      data: cached.data, 
      source: cached.source 
    }
  }

  /**
   * Cache results for future use
   */
  private async cacheResults(request: DataRequest, data: any, source: string): Promise<void> {
    const cacheKey = this.generateCacheKey(request)
    const config = this.cacheConfig[request.request_type as keyof typeof this.cacheConfig] || 
                   this.cacheConfig.visibility_data
    
    const now = new Date()
    const expiresAt = new Date(now.getTime() + config.ttl_minutes * 60 * 1000)
    
    const cacheEntry: CacheEntry = {
      cache_key: cacheKey,
      data,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      data_type: request.request_type,
      company_id: request.company_id,
      confidence_score: this.calculateDataConfidence(data, source),
      source: source.includes('max') ? 'max' : source.includes('lite') ? 'lite' : 'combined'
    }
    
    this.cache.set(cacheKey, cacheEntry)
    
    // Clean up old cache entries periodically
    if (this.cache.size > 1000) {
      this.cleanupCache()
    }
  }

  /**
   * Determine the best data strategy based on request and availability
   */
  private async determineDataStrategy(request: DataRequest): Promise<{ 
    primary: 'max_only' | 'lite_only' | 'max_with_lite_fallback' | 'combined' 
  }> {
    // Check what data is available
    const hasMaxData = await this.checkMaxDataAvailability(request.company_id)
    const hasLiteData = await this.checkLiteDataAvailability(request.company_id)
    
    // User preferences
    if (request.preferences?.lite_only) {
      return { primary: 'lite_only' }
    }
    
    if (request.preferences?.fallback_to_lite === false && hasMaxData) {
      return { primary: 'max_only' }
    }
    
    // Determine best strategy
    if (hasMaxData && hasLiteData) {
      return { primary: 'combined' }
    } else if (hasMaxData) {
      return { primary: 'max_only' }
    } else if (hasLiteData) {
      return { primary: 'lite_only' }
    } else if (request.preferences?.fallback_to_lite !== false) {
      return { primary: 'max_with_lite_fallback' }
    }
    
    return { primary: 'max_only' } // Default fallback
  }

  /**
   * Build unified response object
   */
  private buildResponse(data: any, options: {
    cache_status: DataResponse['cache_status']
    processing_time_ms: number
    data_sources_used: string[]
    fallback_reasons?: string[]
    api_calls_made?: number
    request: DataRequest
  }): DataResponse {
    const confidence = this.calculateDataConfidence(data, options.data_sources_used[0])
    const freshness = this.calculateDataFreshness(data)
    
    return {
      success: true,
      data_source: this.determineDataSourceLabel(options.data_sources_used),
      cache_status: options.cache_status,
      data_freshness: freshness,
      confidence_score: confidence,
      
      ...data,
      
      meta: {
        generated_at: new Date().toISOString(),
        processing_time_ms: options.processing_time_ms,
        data_sources_used: options.data_sources_used,
        fallback_reasons: options.fallback_reasons,
        cache_info: {
          cached_components: options.cache_status === 'hit' ? [options.request.request_type] : [],
          cache_age_minutes: 0, // Would be calculated from actual cache
          cache_expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour default
        },
        usage_info: {
          api_calls_made: options.api_calls_made || 0,
          rate_limit_remaining: 100, // Would be from actual rate limiter
          cost_estimate: this.formatCostEstimate(options.api_calls_made || 0, options.request.request_type)
        }
      },
      
      upgrade_insights: this.generateUpgradeInsights(data, options.data_sources_used[0])
    }
  }

  // Helper methods

  private validateRequest(request: DataRequest): void {
    if (!request.company_id) {
      throw new Error('company_id is required')
    }
    
    const validRequestTypes = ['visibility_data', 'competitive_analysis', 'trends', 'recommendations', 'full_suite']
    if (!validRequestTypes.includes(request.request_type)) {
      throw new Error(`Invalid request_type: ${request.request_type}`)
    }
  }

  private generateCacheKey(request: DataRequest): string {
    const keyParts = [
      request.company_id,
      request.request_type,
      request.preferences?.include_historical ? 'hist' : '',
      request.preferences?.include_competitors ? 'comp' : '',
      request.filters?.date_range?.start_date || '',
      request.filters?.date_range?.end_date || ''
    ].filter(Boolean)
    
    return keyParts.join('_')
  }

  private async checkMaxDataAvailability(companyId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('max_assessments')
      .select('id')
      .eq('company_id', companyId)
      .eq('status', 'completed')
      .limit(1)
    
    return !error && data && data.length > 0
  }

  private async checkLiteDataAvailability(companyId: string): Promise<boolean> {
    // This would check the existing Lite AEO system
    // For now, assume it's always available
    return true
  }

  private calculateDataConfidence(data: any, source: string): number {
    let baseConfidence = 0.7
    
    if (source.includes('max')) baseConfidence += 0.2
    if (source.includes('combined')) baseConfidence += 0.1
    if (data.visibility_data?.score_confidence) {
      baseConfidence = Math.max(baseConfidence, data.visibility_data.score_confidence)
    }
    
    return Math.min(baseConfidence, 1.0)
  }

  private calculateDataFreshness(data: any): DataResponse['data_freshness'] {
    // Simple freshness calculation - would be more sophisticated in production
    return 'recent'
  }

  private determineDataSourceLabel(sources: string[]): DataResponse['data_source'] {
    if (sources.includes('max') && sources.includes('lite')) {
      return 'max_with_lite_fallback'
    } else if (sources.includes('max')) {
      return 'max_only'
    } else if (sources.includes('lite')) {
      return 'lite_only'
    }
    return 'max_only'
  }

  private getDataSourcesUsed(dataSource: string, data: any): string[] {
    const sources = ['api_cache']
    
    if (dataSource.includes('max')) sources.push('max_system')
    if (dataSource.includes('lite')) sources.push('lite_system')
    if (data.competitive_data) sources.push('competitive_analyzer')
    if (data.trend_data) sources.push('trend_analyzer')
    if (data.recommendations) sources.push('recommendation_engine')
    
    return sources
  }

  private calculateCostEstimate(apiCalls: number, requestType: string): number {
    const costPerCall = {
      'visibility_data': 0.1,
      'competitive_analysis': 0.25,
      'trends': 0.15,
      'recommendations': 0.3,
      'full_suite': 0.5
    }
    
    const baseCost = costPerCall[requestType as keyof typeof costPerCall] || 0.1
    return apiCalls * baseCost
  }

  private formatCostEstimate(apiCalls: number, requestType: string): string {
    const cost = this.calculateCostEstimate(apiCalls, requestType)
    return `$${cost.toFixed(3)}`
  }

  private generateUpgradeInsights(data: any, source: string): DataResponse['upgrade_insights'] {
    if (source.includes('max')) {
      return undefined // Already using MAX
    }
    
    return {
      current_plan: 'lite',
      max_advantages: [
        'Real-time AI conversation analysis',
        'Competitive positioning insights',
        'Predictive trend analysis',
        'Advanced recommendation engine'
      ],
      potential_improvements: [
        {
          metric: 'Analysis Depth',
          lite_value: 10,
          estimated_max_value: 50,
          improvement_percentage: 400
        },
        {
          metric: 'Competitive Intelligence',
          estimated_max_value: 85,
          improvement_percentage: 85
        }
      ],
      upgrade_value_proposition: 'Unlock comprehensive AI visibility analysis with 5x more insights and competitive intelligence'
    }
  }

  private trackUsage(metrics: UsageMetrics): void {
    this.usageMetrics.push(metrics)
    
    // Periodically flush metrics to database
    if (this.usageMetrics.length > 100) {
      this.flushUsageMetrics()
    }
  }

  private async flushUsageMetrics(): Promise<void> {
    // This would save usage metrics to database for analytics
    console.log(`Flushing ${this.usageMetrics.length} usage metrics`)
    this.usageMetrics = []
  }

  private cleanupCache(): void {
    const now = new Date()
    const expiredKeys: string[] = []
    
    for (const [key, entry] of this.cache.entries()) {
      if (new Date(entry.expires_at) < now) {
        expiredKeys.push(key)
      }
    }
    
    expiredKeys.forEach(key => this.cache.delete(key))
    
    // If still too many entries, remove oldest
    if (this.cache.size > 800) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => new Date(a[1].created_at).getTime() - new Date(b[1].created_at).getTime())
      
      const toRemove = entries.slice(0, this.cache.size - 800)
      toRemove.forEach(([key]) => this.cache.delete(key))
    }
  }

  private async getEmergencyFallback(request: DataRequest): Promise<any> {
    // Emergency fallback - return minimal data
    return {
      visibility_data: {
        lite_score: 0.5,
        combined_score: 0.5,
        score_confidence: 0.3,
        emergency_mode: true
      }
    }
  }

  private buildErrorResponse(error: Error, fallbackData: any, processingTime: number): DataResponse {
    return {
      success: false,
      data_source: 'lite_only',
      cache_status: 'miss',
      data_freshness: 'stale',
      confidence_score: 0.1,
      
      ...fallbackData,
      
      meta: {
        generated_at: new Date().toISOString(),
        processing_time_ms: processingTime,
        data_sources_used: ['emergency_fallback'],
        cache_info: {
          cached_components: [],
          cache_age_minutes: 0,
          cache_expires_at: new Date().toISOString()
        },
        usage_info: {
          api_calls_made: 0,
          rate_limit_remaining: 100,
          cost_estimate: '$0.000'
        }
      }
    }
  }

  private async initializeCache(): Promise<void> {
    // Initialize cache with any persistent storage if needed
    console.log('Unified Data API cache initialized')
  }
} 
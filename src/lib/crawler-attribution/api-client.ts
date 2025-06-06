import { createClient } from '@/lib/supabase/client'
import { 
  CrawlerVisit, 
  AttributionReport, 
  DashboardData, 
  CrawlerStats, 
  CompanyAttribution,
  ContentHit,
  AttributionApiResponse,
  CrawlerDetectionRule
} from './types'

class CrawlerAttributionApi {
  private supabase = createClient()
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_TTL = 2 * 60 * 1000 // 2 minutes

  private getCacheKey(endpoint: string, params?: Record<string, any>): string {
    const paramStr = params ? JSON.stringify(params) : ''
    return `${endpoint}_${paramStr}`
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  private getCache(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    const age = Date.now() - cached.timestamp
    if (age > this.CACHE_TTL) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }

  clearCache(): void {
    this.cache.clear()
  }

  // Get dashboard overview data
  async getDashboardData(timeframe = '30d'): Promise<AttributionApiResponse<DashboardData>> {
    const cacheKey = this.getCacheKey('dashboard', { timeframe })
    const cached = this.getCache(cacheKey)
    if (cached) return cached

    try {
      const { data, error } = await this.supabase.rpc('get_attribution_dashboard', {
        timeframe_param: timeframe
      })

      if (error) throw error

      const response: AttributionApiResponse<DashboardData> = {
        success: true,
        data: data || null,
        timestamp: new Date().toISOString()
      }

      this.setCache(cacheKey, response)
      return response
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard data',
        timestamp: new Date().toISOString()
      }
    }
  }

  // Get crawler statistics
  async getCrawlerStats(timeframe = '30d'): Promise<AttributionApiResponse<CrawlerStats[]>> {
    const cacheKey = this.getCacheKey('crawler_stats', { timeframe })
    const cached = this.getCache(cacheKey)
    if (cached) return cached

    try {
      const { data, error } = await this.supabase.rpc('get_crawler_stats', {
        timeframe_param: timeframe
      })

      if (error) throw error

      const response: AttributionApiResponse<CrawlerStats[]> = {
        success: true,
        data: data || [],
        timestamp: new Date().toISOString()
      }

      this.setCache(cacheKey, response)
      return response
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load crawler stats',
        timestamp: new Date().toISOString()
      }
    }
  }

  // Get company attributions
  async getCompanyAttributions(
    timeframe = '30d',
    filters?: { 
      industry?: string
      min_visits?: number
      crawler_type?: string
    }
  ): Promise<AttributionApiResponse<CompanyAttribution[]>> {
    const cacheKey = this.getCacheKey('company_attributions', { timeframe, filters })
    const cached = this.getCache(cacheKey)
    if (cached) return cached

    try {
      const { data, error } = await this.supabase.rpc('get_company_attributions', {
        timeframe_param: timeframe,
        filters_param: filters || {}
      })

      if (error) throw error

      const response: AttributionApiResponse<CompanyAttribution[]> = {
        success: true,
        data: data || [],
        timestamp: new Date().toISOString()
      }

      this.setCache(cacheKey, response)
      return response
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load company attributions',
        timestamp: new Date().toISOString()
      }
    }
  }

  // Get content performance
  async getContentHits(
    timeframe = '30d',
    filters?: {
      content_type?: string
      min_visits?: number
      url_pattern?: string
    }
  ): Promise<AttributionApiResponse<ContentHit[]>> {
    const cacheKey = this.getCacheKey('content_hits', { timeframe, filters })
    const cached = this.getCache(cacheKey)
    if (cached) return cached

    try {
      const { data, error } = await this.supabase.rpc('get_content_hits', {
        timeframe_param: timeframe,
        filters_param: filters || {}
      })

      if (error) throw error

      const response: AttributionApiResponse<ContentHit[]> = {
        success: true,
        data: data || [],
        timestamp: new Date().toISOString()
      }

      this.setCache(cacheKey, response)
      return response
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load content hits',
        timestamp: new Date().toISOString()
      }
    }
  }

  // Get recent crawler visits
  async getRecentVisits(
    limit = 50,
    filters?: {
      crawler_type?: string
      hours_back?: number
      url_pattern?: string
    }
  ): Promise<AttributionApiResponse<CrawlerVisit[]>> {
    try {
      const { data, error } = await this.supabase.rpc('get_recent_crawler_visits', {
        limit_param: limit,
        filters_param: filters || {}
      })

      if (error) throw error

      return {
        success: true,
        data: data || [],
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load recent visits',
        timestamp: new Date().toISOString()
      }
    }
  }

  // Generate attribution report
  async generateReport(
    timeframe: string,
    includeDetails = true
  ): Promise<AttributionApiResponse<AttributionReport>> {
    try {
      const { data, error } = await this.supabase.rpc('generate_attribution_report', {
        timeframe_param: timeframe,
        include_details: includeDetails
      })

      if (error) throw error

      return {
        success: true,
        data: data || null,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate report',
        timestamp: new Date().toISOString()
      }
    }
  }

  // Get crawler detection rules
  async getDetectionRules(): Promise<AttributionApiResponse<CrawlerDetectionRule[]>> {
    try {
      const { data, error } = await this.supabase
        .from('crawler_detection_rules')
        .select('*')
        .eq('active', true)
        .order('confidence_score', { ascending: false })

      if (error) throw error

      return {
        success: true,
        data: data || [],
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load detection rules',
        timestamp: new Date().toISOString()
      }
    }
  }

  // Update detection rule
  async updateDetectionRule(
    id: string,
    updates: Partial<CrawlerDetectionRule>
  ): Promise<AttributionApiResponse<boolean>> {
    try {
      const { error } = await this.supabase
        .from('crawler_detection_rules')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      // Clear relevant caches
      this.clearCache()

      return {
        success: true,
        data: true,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update detection rule',
        timestamp: new Date().toISOString()
      }
    }
  }

  // Install tracking snippet
  async getTrackingSnippet(domain: string): Promise<AttributionApiResponse<string>> {
    try {
      // Generate tracking snippet with workspace ID and domain
      const { data: workspace } = await this.supabase
        .from('workspaces')
        .select('id')
        .eq('domain', domain)
        .single()

      if (!workspace) {
        throw new Error('Workspace not found for domain')
      }

      const snippet = `
<!-- Split AI Crawler Attribution -->
<script>
(function() {
  var script = document.createElement('script');
  script.src = '${process.env.NEXT_PUBLIC_SITE_URL}/api/attribution/tracker.js';
  script.setAttribute('data-workspace', '${workspace.id}');
  script.setAttribute('data-domain', '${domain}');
  script.async = true;
  document.head.appendChild(script);
})();
</script>
<!-- End Split AI Crawler Attribution -->`

      return {
        success: true,
        data: snippet,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate tracking snippet',
        timestamp: new Date().toISOString()
      }
    }
  }

  // Export data
  async exportData(
    type: 'visits' | 'companies' | 'content' | 'reports',
    format: 'csv' | 'json',
    timeframe = '30d'
  ): Promise<AttributionApiResponse<string>> {
    try {
      const { data, error } = await this.supabase.rpc('export_attribution_data', {
        export_type: type,
        export_format: format,
        timeframe_param: timeframe
      })

      if (error) throw error

      return {
        success: true,
        data: data || '',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export data',
        timestamp: new Date().toISOString()
      }
    }
  }
}

// Export singleton instance
export const crawlerAttributionApi = new CrawlerAttributionApi()

// Export error handler
export function handleApiError(error: any): string {
  if (typeof error === 'string') return error
  if (error?.message) return error.message
  return 'An unexpected error occurred'
} 
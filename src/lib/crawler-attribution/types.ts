// Core types for AI Crawler Attribution system
// Updated to match cleaned database structure

export interface CrawlerVisit {
  id: string
  user_id: string
  workspace_id: string
  domain: string
  path: string
  timestamp: string
  created_at: string
  
  // Crawler identification (enhanced existing fields)
  crawler_name: string // Maps to crawler_type in our API
  crawler_company: string
  crawler_category: string
  crawler_confidence?: number // 0-1 confidence score
  user_agent: string
  
  // Attribution insights (new fields)
  estimated_query?: string
  query_confidence?: number
  content_type?: 'article' | 'homepage' | 'product' | 'about' | 'other'
  
  // Request details (enhanced)
  ip_address?: string
  referrer?: string
  session_id?: string
  request_headers?: Record<string, string>
  status_code?: number
  response_time_ms?: number
  country?: string
  metadata?: Record<string, any>
  
  // Company enrichment (rb2b style)
  company_info?: {
    name?: string
    domain?: string
    industry?: string
    size?: string
    location?: string
    confidence: number
  }
}

export interface CrawlerStats {
  crawler_type: string
  display_name: string
  total_visits: number
  unique_sessions: number
  top_pages: Array<{
    url: string
    visits: number
    last_visit: string
  }>
  trend_change: number // percentage change from previous period
  avg_session_duration?: number
}

export interface AttributionScore {
  overall_score: number // 0-100 based on crawler activity and attribution quality
  crawler_diversity: number // How many different AI models are crawling
  content_coverage: number // Percentage of site being crawled
  attribution_quality: number // How well we can attribute visits to companies/queries
  trend_change: number
}

export interface CompanyAttribution {
  company_name: string
  domain: string
  industry?: string
  total_visits: number
  crawlers_used: string[]
  top_content: Array<{
    url: string
    title?: string
    visits: number
  }>
  estimated_queries: string[]
  first_seen: string
  last_seen: string
}

export interface ContentHit {
  url: string
  title?: string
  total_visits: number
  unique_crawlers: number
  crawler_breakdown: Array<{
    crawler_type: string
    visits: number
  }>
  estimated_queries: string[]
  companies_interested: CompanyAttribution[]
}

export interface AttributionReport {
  id: string
  workspace_id: string
  timeframe: {
    start: string
    end: string
    label: string // "Last 30 days", "This week", etc.
  }
  
  // Summary stats
  total_visits: number
  unique_crawlers: number
  unique_companies: number
  attribution_score: AttributionScore
  
  // Detailed breakdowns
  crawler_stats: CrawlerStats[]
  top_content: ContentHit[]
  company_attributions: CompanyAttribution[]
  
  // Insights
  trending_queries: string[]
  new_companies: CompanyAttribution[]
  crawler_patterns: Array<{
    pattern: string
    description: string
    impact: 'high' | 'medium' | 'low'
  }>
  
  generated_at: string
}

export interface CrawlerDetectionRule {
  id: string
  name: string
  user_agent_pattern: string
  ip_ranges?: string[]
  additional_headers?: Record<string, string>
  crawler_type: string
  confidence_score: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface ContentAttribution {
  id: string
  workspace_id: string
  url_path: string
  url_title?: string
  total_visits: number
  unique_crawlers: number
  last_crawled_at?: string
  estimated_queries: string[]
  interested_companies: CompanyAttribution[]
  crawler_breakdown: Record<string, number>
  content_type?: string
  created_at: string
  updated_at: string
}

// API Response types
export interface AttributionApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}

export interface DashboardData {
  attribution_score: AttributionScore
  recent_visits: CrawlerVisit[]
  crawler_stats: CrawlerStats[]
  top_content: ContentHit[]
  company_attributions: CompanyAttribution[]
  chart_data: Array<{
    date: string
    visits: number
    crawlers: number
    companies: number
  }>
}

// Database function return types
export interface AttributionScoreResult {
  overall_score: number
  crawler_diversity: number
  content_coverage: number
  attribution_quality: number
  total_visits: number
  unique_crawlers: number
  unique_companies: number
}

// Filter types for API calls
export interface CrawlerVisitFilters {
  crawler_type?: string
  hours_back?: number
  url_pattern?: string
  content_type?: string
  min_confidence?: number
}

export interface CompanyAttributionFilters {
  industry?: string
  min_visits?: number
  crawler_type?: string
  timeframe?: string
}

export interface ContentHitFilters {
  content_type?: string
  min_visits?: number
  url_pattern?: string
  timeframe?: string
} 
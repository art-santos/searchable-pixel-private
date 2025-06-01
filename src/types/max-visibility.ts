// MAX Visibility System TypeScript Types
// Auto-generated from database schema: 20241205000000_max_visibility_schema.sql

// Database Enums
export type MaxQuestionType = 
  | 'direct_conversational'      // "Help me choose between X and competitors"
  | 'indirect_conversational'    // "What should I know about AI platforms?"
  | 'comparison_query'           // "Compare X vs Y for my use case"
  | 'recommendation_request'     // "Recommend the best tool for Z"
  | 'explanatory_query'          // "Explain the differences between..."

export type MentionPosition = 
  | 'primary'      // First/main mention in response
  | 'secondary'    // Supporting mention
  | 'passing'      // Brief/casual mention
  | 'none'         // Not mentioned

export type SentimentType = 
  | 'very_positive'
  | 'positive'
  | 'neutral'
  | 'negative'
  | 'very_negative'

export type CitationBucket = 
  | 'owned'        // Company's own content
  | 'operated'     // Company's social/profiles
  | 'earned'       // Third-party mentions
  | 'competitor'   // Competitor content

export type RunStatus = 'pending' | 'running' | 'completed' | 'failed'

// Core Database Tables

export interface MaxVisibilityRun {
  id: string
  company_id: string
  triggered_by: string
  
  // Run configuration
  question_count: number
  status: RunStatus
  started_at: string | null
  completed_at: string | null
  
  // Results summary
  total_score: number | null
  mention_rate: number | null           // 0-1
  sentiment_score: number | null        // -1 to 1
  citation_score: number | null         // 0-100
  competitive_score: number | null      // 0-100
  consistency_score: number | null      // 0-100
  
  // Metadata
  computed_at: string
  raw_json_path: string | null
  error_message: string | null
  
  // Timestamps
  created_at: string
  updated_at: string
}

export interface MaxVisibilityQuestion {
  id: string
  run_id: string
  
  // Question details
  question: string
  question_type: MaxQuestionType
  position: number
  
  // Question metadata
  template_used: string | null
  customization_context: Record<string, any> | null
  
  // Timestamps
  created_at: string
}

export interface MaxVisibilityResponse {
  id: string
  question_id: string
  
  // Perplexity response data
  perplexity_response_id: string | null
  full_response: string
  response_length: number | null
  
  // Mention analysis
  mention_detected: boolean
  mention_position: MentionPosition
  mention_sentiment: SentimentType
  mention_context: string | null
  mention_confidence: number | null     // 0-1
  
  // Response metadata
  citation_count: number
  response_quality_score: number | null // 0-100
  processing_time_ms: number | null
  
  // Timestamps
  created_at: string
  analyzed_at: string | null
}

export interface MaxVisibilityCitation {
  id: string
  response_id: string
  
  // Citation details
  citation_url: string
  citation_title: string | null
  citation_domain: string | null
  citation_excerpt: string | null
  
  // Classification
  bucket: CitationBucket
  influence_score: number | null        // 0-1
  position_in_citations: number | null
  
  // Authority metrics
  domain_authority: number | null       // 0-100
  relevance_score: number | null        // 0-1
  
  // Timestamps
  created_at: string
}

export interface MaxVisibilityCompetitor {
  id: string
  run_id: string
  
  // Competitor details
  competitor_name: string
  competitor_domain: string
  competitor_description: string | null
  
  // Mention metrics
  mention_count: number
  mention_rate: number | null           // 0-1
  sentiment_average: number | null      // -1 to 1
  
  // Positioning metrics
  ai_visibility_score: number | null    // 0-100
  rank_position: number | null
  share_of_voice: number | null         // 0-1
  
  // Citation metrics
  citation_count: number
  owned_citations: number
  operated_citations: number
  earned_citations: number
  
  // Timestamps
  created_at: string
}

export interface MaxVisibilityTopic {
  id: string
  run_id: string
  
  // Topic details
  topic_name: string
  topic_category: string | null
  topic_description: string | null
  
  // Mention metrics
  mention_count: number
  mention_percentage: number | null     // 0-100
  sentiment_score: number | null        // -1 to 1
  
  // Positioning metrics
  rank_position: number | null
  change_vs_previous: number | null
  competitive_strength: number | null   // 0-100
  
  // Context analysis
  question_types: string[] | null
  conversation_contexts: string[] | null
  
  // Timestamps
  created_at: string
}

export interface MaxVisibilityMetric {
  id: string
  run_id: string
  
  // Metric details
  metric_name: string
  metric_value: number | null
  metric_unit: string | null
  metric_category: string | null
  
  // Context and metadata
  metric_description: string | null
  metric_metadata: Record<string, any> | null
  
  // Timestamps
  created_at: string
}

// Aggregate and Analysis Types

export interface MaxVisibilityRunSummary {
  id: string
  company_id: string
  triggered_by: string
  status: RunStatus
  question_count: number
  total_score: number | null
  mention_rate: number | null
  sentiment_score: number | null
  citation_score: number | null
  competitive_score: number | null
  consistency_score: number | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  company_domain: string | null
  company_name: string | null
  triggered_by_name: string | null
  actual_question_count: number
  mentions_found: number
  total_citations: number
}

export interface MaxAnalysisResult {
  // Run overview
  run: MaxVisibilityRun
  
  // Core data
  questions: MaxVisibilityQuestion[]
  responses: MaxVisibilityResponse[]
  citations: MaxVisibilityCitation[]
  competitors: MaxVisibilityCompetitor[]
  topics: MaxVisibilityTopic[]
  metrics: MaxVisibilityMetric[]
  
  // Computed insights
  ai_visibility_score: number
  mention_rate: number
  sentiment_average: number
  citation_influence_score: number
  competitive_positioning_score: number
  factual_consistency_score: number
  
  // Conversation analysis
  conversation_topics: {
    name: string
    mention_count: number
    mention_percentage: number
    sentiment_score: number
    rank: number
    change_vs_previous: number
    ai_score: number
  }[]
  
  // Citations breakdown
  citations_summary: {
    owned_sources_cited: number
    operated_sources_cited: number
    earned_sources_cited: number
    competitor_sources_cited: number
  }
  
  // Competitive analysis
  competitive_analysis: {
    name: string
    domain: string
    ai_visibility_score: number
    rank: number
    mention_rate: number
    sentiment_average: number
    is_target_company: boolean
    search_score?: number  // For comparison with Lite mode
    ai_score: number
  }[]
  
  // AI recommendations
  ai_recommendations: {
    category: string
    recommendation: string
    priority_level: 'high' | 'medium' | 'low'
    action_type: 'content' | 'optimization' | 'technical'
  }[]
  
  // MAX-specific metrics
  max_specific_metrics: {
    mention_rate: number
    sentiment_average: number
    citation_influence_score: number
    factual_consistency_score: number
    competitive_positioning_score: number
    conversation_types: {
      direct: { mentions: number; sentiment: number }
      indirect: { mentions: number; sentiment: number }
      comparison: { mentions: number; sentiment: number }
    }
  }
  
  // Historical comparison
  score_history: Array<{ date: string; score: number }>
  questions_analyzed: number
  total_responses: number
  owned_mentions: number
  operated_mentions: number
  earned_mentions: number
  avg_mention_position: number
  avg_operated_position: number
  primary_mentions: number
  ai_share_of_voice: number
  total_coverage: number
  operated_mention_rate: number
  direct_mentions: number
  direct_sentiment: number
  indirect_mentions: number
  indirect_sentiment: number
  comparison_mentions: number
  comparison_sentiment: number
}

// API Request/Response Types

export interface StartMaxAnalysisRequest {
  company_id: string
  question_count?: number  // Default 50
}

export interface StartMaxAnalysisResponse {
  run_id: string
  status: 'started'
  estimated_completion_time: number // minutes
}

export interface MaxAnalysisProgressResponse {
  run_id: string
  status: RunStatus
  progress: number         // 0-100
  current_step: string
  steps_completed: number
  total_steps: number
  estimated_time_remaining: number // minutes
  current_question?: string
  error_message?: string
}

export interface MaxAnalysisResultsResponse {
  run_id: string
  status: RunStatus
  results: MaxAnalysisResult | null
  error_message?: string
}

// Question Generation Types

export interface QuestionTemplate {
  id: string
  template: string
  type: MaxQuestionType
  variables: string[]      // Variables to replace in template
  weight: number          // Selection probability weight
  category: string        // Grouping category
}

export interface QuestionGenerationRequest {
  company: {
    name: string
    domain: string
    description?: string
    industry?: string
  }
  question_count: number
  question_types?: MaxQuestionType[] // Filter to specific types
}

export interface GeneratedQuestion {
  question: string
  type: MaxQuestionType
  template_used: string
  customization_context: Record<string, any>
  confidence_score: number  // 0-1, quality of customization
}

// Perplexity Integration Types

export interface PerplexityQueryRequest {
  query: string
  sources?: string[]
  search_domain_filter?: string[]
  return_citations: boolean
  return_related_questions: boolean
}

export interface PerplexityQueryResponse {
  id: string
  choices: Array<{
    message: {
      content: string
      role: 'assistant'
    }
    finish_reason: string
  }>
  citations: string[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
  }
}

export interface MentionAnalysisRequest {
  response: string
  target_company: {
    name: string
    domain: string
    aliases?: string[]  // Alternative names/brands
  }
}

export interface MentionAnalysisResult {
  mention_detected: boolean
  mention_position: MentionPosition
  mention_sentiment: SentimentType
  mention_context: string | null
  confidence_score: number  // 0-1
  reasoning: string        // AI explanation of the decision
}

// Citation Analysis Types

export interface CitationAnalysisRequest {
  citations: string[]
  target_company: {
    name: string
    domain: string
    owned_domains?: string[]
    operated_domains?: string[]
  }
}

export interface CitationClassificationResult {
  citation_url: string
  bucket: CitationBucket
  influence_score: number  // 0-1
  relevance_score: number  // 0-1
  reasoning: string
}

// Scoring Algorithm Types

export interface ScoringWeights {
  mention_rate: number      // Default: 0.40
  mention_quality: number   // Default: 0.25
  source_influence: number  // Default: 0.20
  competitive_positioning: number // Default: 0.10
  response_consistency: number    // Default: 0.05
}

export interface ScoringInputs {
  total_questions: number
  mentions_detected: number
  mention_quality_scores: number[]
  citation_influence_scores: number[]
  competitive_metrics: Record<string, number>
  consistency_metrics: Record<string, number>
}

export interface ScoringBreakdown {
  overall_score: number      // 0-100
  mention_rate_score: number
  mention_quality_score: number
  source_influence_score: number
  competitive_positioning_score: number
  response_consistency_score: number
  weights_used: ScoringWeights
  explanation: string[]      // Human-readable score explanation
}

// Usage Tracking Types

export interface MaxVisibilityUsage {
  user_id: string
  company_id: string
  analyses_this_month: number
  analyses_total: number
  last_analysis_date: string | null
  plan_tier: string
  monthly_limit: number
  can_run_analysis: boolean
  days_until_reset: number
}

// Error Types

export interface MaxVisibilityError {
  code: string
  message: string
  details?: Record<string, any>
  retry_after?: number  // Seconds to wait before retry
}

// Event Types for Real-time Updates

export interface MaxAnalysisProgressEvent {
  type: 'progress'
  run_id: string
  progress: number
  current_step: string
  message: string
}

export interface MaxAnalysisCompleteEvent {
  type: 'complete'
  run_id: string
  results: MaxAnalysisResult
}

export interface MaxAnalysisErrorEvent {
  type: 'error'
  run_id: string
  error: MaxVisibilityError
}

export type MaxAnalysisEvent = 
  | MaxAnalysisProgressEvent 
  | MaxAnalysisCompleteEvent 
  | MaxAnalysisErrorEvent

// Additional Pipeline Types for New Implementation

export type AssessmentStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface MaxAssessmentRequest {
  company: {
    id: string
    name: string
    domain: string
    description?: string
    industry?: string
    aliases?: string[]
    owned_domains?: string[]
    operated_domains?: string[]
  }
  assessment_type?: 'lite' | 'full'
  question_count?: number
  question_types?: MaxQuestionType[]
  include_competitor_analysis?: boolean
}

export interface MaxAssessmentResult {
  assessment_id: string
  company: MaxAssessmentRequest['company']
  question_analyses: MaxQuestionAnalysis[]
  visibility_scores: MaxVisibilityScore
  processing_time_ms: number
  completed_at: string
}

export interface MaxQuestionAnalysis {
  question_id: string
  question_text: string
  question_type: MaxQuestionType
  ai_response: string
  response_citations: Array<{
    url: string
    text: string
    title: string
  }>
  mention_analysis: MentionAnalysisResult
  citation_analysis: CitationClassificationResult[]
  question_score: number
  processed_at: string
}

export interface MaxVisibilityScore {
  overall_score: number
  mention_rate: number
  mention_quality: number
  source_influence: number
  competitive_positioning: number
  response_consistency: number
  total_questions: number
  mentioned_questions: number
  citation_breakdown: Record<string, number>
  calculated_at: string
}

// Legacy type alias for compatibility
export type QuestionType = MaxQuestionType

// Configuration Types

export interface MaxVisibilityConfig {
  perplexity_api_key: string
  openai_api_key: string
  default_question_count: number
  max_question_count: number
  rate_limit_per_hour: number
  timeout_minutes: number
  scoring_weights: ScoringWeights
  question_templates: QuestionTemplate[]
} 
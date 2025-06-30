// Database types for the project-based AI visibility platform

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: Project;
        Insert: ProjectInsert;
        Update: ProjectUpdate;
      };
      project_urls: {
        Row: ProjectUrl;
        Insert: ProjectUrlInsert;
        Update: ProjectUrlUpdate;
      };
      visibility_tracking: {
        Row: VisibilityTracking;
        Insert: VisibilityTrackingInsert;
        Update: VisibilityTrackingUpdate;
      };
      technical_audits: {
        Row: TechnicalAudit;
        Insert: TechnicalAuditInsert;
        Update: TechnicalAuditUpdate;
      };
      project_settings: {
        Row: ProjectSettings;
        Insert: ProjectSettingsInsert;
        Update: ProjectSettingsUpdate;
      };
      project_alerts: {
        Row: ProjectAlert;
        Insert: ProjectAlertInsert;
        Update: ProjectAlertUpdate;
      };
    };
  };
}

// Core Project Types
export interface Project {
  id: string;
  user_id: string;
  root_domain: string;
  name: string;
  description?: string;
  settings: ProjectConfiguration;
  status: 'active' | 'paused' | 'archived';
  created_at: string;
  updated_at: string;
  last_analyzed_at?: string;
}

export interface ProjectInsert {
  user_id: string;
  root_domain: string;
  name: string;
  description?: string;
  settings?: ProjectConfiguration;
  status?: 'active' | 'paused' | 'archived';
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  settings?: ProjectConfiguration;
  status?: 'active' | 'paused' | 'archived';
  last_analyzed_at?: string;
}

export interface ProjectConfiguration {
  keywords?: string[];
  topics?: string[];
  competitors?: string[];
  analysis_frequency?: 'daily' | 'weekly' | 'monthly';
  notifications?: {
    email: boolean;
    alerts: boolean;
    webhook_url?: string;
  };
  tracked_ai_systems?: AISystem[];
  custom_settings?: Record<string, any>;
}

// Project URL Types
export interface ProjectUrl {
  id: string;
  project_id: string;
  url: string;
  is_primary: boolean;
  status: 'pending' | 'processing' | 'analyzed' | 'failed';
  priority: number;
  tags: string[];
  added_at: string;
  last_analyzed?: string;
  next_analysis_at?: string;
  
  // Snapshot integration fields
  snapshot_id?: string;
  visibility_score?: number;
  technical_score?: number;
  combined_score?: number;
  issues_count?: number;
  topic?: string;
}

export interface ProjectUrlInsert {
  project_id: string;
  url: string;
  is_primary?: boolean;
  priority?: number;
  tags?: string[];
  next_analysis_at?: string;
  status?: 'pending' | 'processing' | 'analyzed' | 'failed';
  snapshot_id?: string;
  topic?: string;
}

export interface ProjectUrlUpdate {
  is_primary?: boolean;
  status?: 'pending' | 'processing' | 'analyzed' | 'failed';
  priority?: number;
  tags?: string[];
  last_analyzed?: string;
  next_analysis_at?: string;
  snapshot_id?: string;
  visibility_score?: number;
  technical_score?: number;
  combined_score?: number;
  issues_count?: number;
  topic?: string;
}

// AI System Types
export type AISystem = 'perplexity' | 'chatgpt' | 'claude' | 'google_ai' | 'bing_copilot';

// Visibility Tracking Types
export interface VisibilityTracking {
  id: string;
  project_id: string;
  query: string;
  ai_system: AISystem;
  visibility_score?: number;
  position?: number;
  cited_urls: string[];
  competitors: CompetitorData[];
  response_data: AIResponseData;
  checked_at: string;
}

export interface VisibilityTrackingInsert {
  project_id: string;
  query: string;
  ai_system: AISystem;
  visibility_score?: number;
  position?: number;
  cited_urls?: string[];
  competitors?: CompetitorData[];
  response_data?: AIResponseData;
}

export interface VisibilityTrackingUpdate {
  visibility_score?: number;
  position?: number;
  cited_urls?: string[];
  competitors?: CompetitorData[];
  response_data?: AIResponseData;
}

export interface CompetitorData {
  domain: string;
  position?: number;
  visibility_score?: number;
  cited_urls?: string[];
  market_share?: number;
}

export interface AIResponseData {
  raw_response?: string;
  citations?: Citation[];
  confidence?: number;
  response_time_ms?: number;
  model_version?: string;
  query_intent?: string;
  additional_metadata?: Record<string, any>;
}

export interface Citation {
  url: string;
  title?: string;
  snippet?: string;
  position?: number;
  relevance_score?: number;
}

// Technical Audit Types
export interface TechnicalAudit {
  id: string;
  project_url_id: string;
  overall_score?: number;
  technical_score?: number;
  content_score?: number;
  rendering_mode?: 'SSR' | 'CSR' | 'HYBRID';
  ssr_score_penalty?: number;
  issues: TechnicalIssue[];
  recommendations: TechnicalRecommendation[];
  metrics: AuditMetrics;
  
  // H1 and heading analysis
  h1_detected: boolean;
  h1_text?: string;
  h1_detection_method?: string;
  h1_confidence?: number;
  heading_structure: HeadingStructure;
  
  // Enhanced metadata
  eeat_links: EEATLink[];
  schema_types: string[];
  meta_tags: Record<string, any>;
  
  // Analysis metadata
  analysis_duration_ms?: number;
  firecrawl_method?: 'firecrawl' | 'puppeteer' | 'fetch';
  analyzed_at: string;
}

export interface TechnicalAuditInsert {
  project_url_id: string;
  overall_score?: number;
  technical_score?: number;
  content_score?: number;
  rendering_mode?: 'SSR' | 'CSR' | 'HYBRID';
  ssr_score_penalty?: number;
  issues?: TechnicalIssue[];
  recommendations?: TechnicalRecommendation[];
  metrics?: AuditMetrics;
  h1_detected?: boolean;
  h1_text?: string;
  h1_detection_method?: string;
  h1_confidence?: number;
  heading_structure?: HeadingStructure;
  eeat_links?: EEATLink[];
  schema_types?: string[];
  meta_tags?: Record<string, any>;
  analysis_duration_ms?: number;
  firecrawl_method?: 'firecrawl' | 'puppeteer' | 'fetch';
}

export interface TechnicalAuditUpdate {
  overall_score?: number;
  technical_score?: number;
  content_score?: number;
  rendering_mode?: 'SSR' | 'CSR' | 'HYBRID';
  ssr_score_penalty?: number;
  issues?: TechnicalIssue[];
  recommendations?: TechnicalRecommendation[];
  metrics?: AuditMetrics;
  h1_detected?: boolean;
  h1_text?: string;
  h1_detection_method?: string;
  h1_confidence?: number;
  heading_structure?: HeadingStructure;
  eeat_links?: EEATLink[];
  schema_types?: string[];
  meta_tags?: Record<string, any>;
}

export interface TechnicalIssue {
  severity: 'critical' | 'warning' | 'info';
  category: 'seo' | 'performance' | 'accessibility' | 'content' | 'schema' | 'metadata';
  title: string;
  description: string;
  impact: string;
  fix_priority: number; // 1-10
  html_snippet?: string;
  rule_parameters?: Record<string, any>;
  diagnostic?: string;
  fix_suggestion?: string;
}

export interface TechnicalRecommendation {
  category: 'content' | 'technical' | 'seo' | 'accessibility' | 'performance';
  title: string;
  description: string;
  implementation: string;
  expected_impact: string;
  effort_level: 'low' | 'medium' | 'high';
  priority_score: number; // 1-10
  estimated_impact_score?: number;
}

export interface AuditMetrics {
  word_count?: number;
  content_density?: number;
  load_time_ms?: number;
  first_contentful_paint?: number;
  largest_contentful_paint?: number;
  cumulative_layout_shift?: number;
  image_count?: number;
  link_count?: number;
  script_count?: number;
  stylesheet_count?: number;
  content_to_html_ratio?: number;
  semantic_elements_count?: number;
  accessibility_score?: number;
}

export interface HeadingStructure {
  h1: string[];
  h2: string[];
  h3: string[];
  h4: string[];
  h5: string[];
  h6: string[];
  hierarchy_issues?: string[];
  recommendations?: string[];
}

export interface EEATLink {
  url: string;
  anchor_text: string;
  type: 'internal' | 'external';
  authority_score?: number;
  relevance_score?: number;
  eeat_category: 'experience' | 'expertise' | 'authoritativeness' | 'trustworthiness';
}

// Project Settings Types
export interface ProjectSettings {
  project_id: string;
  target_keywords: string[];
  target_topics: string[];
  competitors: CompetitorConfig[];
  analysis_frequency: 'daily' | 'weekly' | 'monthly';
  notifications: NotificationSettings;
  tracked_ai_systems: AISystem[];
  updated_at: string;
}

export interface ProjectSettingsInsert {
  project_id: string;
  target_keywords?: string[];
  target_topics?: string[];
  competitors?: CompetitorConfig[];
  analysis_frequency?: 'daily' | 'weekly' | 'monthly';
  notifications?: NotificationSettings;
  tracked_ai_systems?: AISystem[];
}

export interface ProjectSettingsUpdate {
  target_keywords?: string[];
  target_topics?: string[];
  competitors?: CompetitorConfig[];
  analysis_frequency?: 'daily' | 'weekly' | 'monthly';
  notifications?: NotificationSettings;
  tracked_ai_systems?: AISystem[];
}

export interface CompetitorConfig {
  domain: string;
  name: string;
  priority: number;
  track_keywords?: string[];
  notes?: string;
}

export interface NotificationSettings {
  email: boolean;
  alerts: boolean;
  webhook_url?: string;
  slack_webhook?: string;
  alert_thresholds?: {
    visibility_drop_percentage?: number;
    score_drop_points?: number;
    new_issues_count?: number;
  };
}

// Project Alert Types
export interface ProjectAlert {
  id: string;
  project_id: string;
  alert_type: 'visibility_drop' | 'technical_issue' | 'competitor_gain' | 'new_opportunity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  data: AlertData;
  is_read: boolean;
  created_at: string;
}

export interface ProjectAlertInsert {
  project_id: string;
  alert_type: 'visibility_drop' | 'technical_issue' | 'competitor_gain' | 'new_opportunity';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  data?: AlertData;
}

export interface ProjectAlertUpdate {
  is_read?: boolean;
  data?: AlertData;
}

export interface AlertData {
  url?: string;
  query?: string;
  ai_system?: AISystem;
  previous_score?: number;
  current_score?: number;
  competitor_domain?: string;
  issue_details?: TechnicalIssue;
  opportunity_details?: {
    type: string;
    potential_impact: string;
    recommended_action: string;
  };
  additional_context?: Record<string, any>;
}

// Utility Types
export interface ProjectSummary {
  project: Project;
  url_count: number;
  latest_audit?: TechnicalAudit;
  avg_visibility_score?: number;
  critical_issues_count: number;
  last_analysis_date?: string;
  status_counts: {
    pending: number;
    analyzing: number;
    complete: number;
    error: number;
  };
}

export interface VisibilityTrend {
  query: string;
  ai_system: AISystem;
  trend_data: Array<{
    date: string;
    visibility_score: number;
    position?: number;
  }>;
  change_percentage: number;
  trend_direction: 'up' | 'down' | 'stable';
}

export interface CompetitiveAnalysis {
  query: string;
  ai_system: AISystem;
  your_position?: number;
  your_visibility_score?: number;
  competitors: Array<{
    domain: string;
    position?: number;
    visibility_score?: number;
    gap_analysis?: string;
  }>;
  opportunities: string[];
  threats: string[];
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Analytics Types for Dashboard
export interface ProjectAnalytics {
  project_id: string;
  date_range: {
    start: string;
    end: string;
  };
  visibility_metrics: {
    avg_score: number;
    score_change: number;
    top_queries: Array<{
      query: string;
      avg_score: number;
      trend: 'up' | 'down' | 'stable';
    }>;
  };
  technical_metrics: {
    avg_overall_score: number;
    score_change: number;
    critical_issues: number;
    fixed_issues: number;
  };
  competitive_metrics: {
    market_share: number;
    position_improvements: number;
    threats: number;
    opportunities: number;
  };
} 
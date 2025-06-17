/**
 * Enhanced Snapshots API
 * Integrates AI visibility testing + technical audit results
 */

import { createClient } from '@/lib/supabase/client';

export interface EnhancedSnapshotResult {
  id: string;
  url: string;
  topic: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  
  // Visibility Results
  visibility_score: number;
  mentions_count: number;
  total_questions: number;
  top_competitors: string[];
  insights: string[];
  
  // Technical Audit Results  
  aeo_score?: number;
  weighted_aeo_score?: number;
  rendering_mode?: 'SSR' | 'CSR' | 'HYBRID';
  ssr_score_penalty?: number;
  
  // Category Scores
  content_quality_score?: number;
  technical_health_score?: number;
  media_accessibility_score?: number;
  schema_markup_score?: number;
  ai_optimization_score?: number;
  
  // Calculated technical score from checklist
  calculated_technical_score?: number;
  
  // Issues & Recommendations
  critical_issues_count?: number;
  total_issues_count?: number;
  recommendations_count?: number;
  
  // Scraping Status
  scrape_success?: boolean;
  scrape_error?: string;
  
  // Page Metadata
  site_title?: string;
  meta_description?: string;
}

export interface TechnicalIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'seo' | 'performance' | 'accessibility' | 'content' | 'schema' | 'metadata';
  title: string;
  description: string;
  impact: string;
  fix_priority: number;
  diagnostic?: string;
  html_snippet?: string;
}

export interface TechnicalRecommendation {
  id: string;
  category: 'content' | 'technical' | 'seo' | 'accessibility' | 'performance';
  title: string;
  description: string;
  implementation: string;
  expected_impact: string;
  effort_level: 'low' | 'medium' | 'high';
  priority_score: number;
}

export interface VisibilityResult {
  id: string;
  question_text: string;
  question_number: number;
  target_found: boolean;
  position?: number;
  citation_snippet?: string;
  competitor_names: string[];
  reasoning_summary: string;
  top_citations: Array<{
    url: string;
    title: string;
    rank?: number;
  }>;
}

export interface TechnicalChecklistItem {
  id: string;
  check_id: string;
  check_name: string;
  category: string;
  weight: number;
  passed: boolean;
  details: string;
  rule_parameters?: Record<string, any>;
}

const supabase = createClient()!;

/**
 * Clean up page titles by removing redundant site names and separators
 */
function cleanTitle(title?: string): string | undefined {
  if (!title) return undefined;
  
  // Split by common separators
  const parts = title.split(/[\|\-\–\—]/).map(part => part.trim());
  
  // Remove duplicate parts (case insensitive)
  const uniqueParts = [];
  const seen = new Set();
  
  for (const part of parts) {
    const normalizedPart = part.toLowerCase();
    if (!seen.has(normalizedPart) && part.length > 0) {
      seen.add(normalizedPart);
      uniqueParts.push(part);
    }
  }
  
  // Join with " | " and limit length
  const cleanedTitle = uniqueParts.join(' | ');
  
  // Truncate if too long (keep under 100 characters)
  return cleanedTitle.length > 100 
    ? cleanedTitle.substring(0, 97) + '...'
    : cleanedTitle;
}

/**
 * Get enhanced snapshot results with combined visibility + technical data
 */
export async function getEnhancedSnapshots(userId: string): Promise<EnhancedSnapshotResult[]> {
  console.log('🔍 Fetching enhanced snapshots for user:', userId);
  
  // First, let's see if any snapshots exist at all for debugging
  const { data: allSnapshots } = await supabase
    .from('snapshot_requests')
    .select('id, user_id, topic, status')
    .order('created_at', { ascending: false })
    .limit(5);
  
  console.log('📋 Recent snapshots in DB:', allSnapshots);
  console.log('🔍 Looking for user_id:', userId);
  console.log('🎯 Matching snapshots:', allSnapshots?.filter(s => s.user_id === userId));
  
  const { data, error } = await supabase
    .from('snapshot_requests')
    .select(`
      id,
      urls,
      topic,
      status,
      created_at,
      completed_at,
      snapshot_summaries (
        url,
        visibility_score,
        mentions_count,
        total_questions,
        top_competitors,
        insights
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  console.log('📊 Query results:', { data: data?.length, error });
  
  if (error) {
    console.error('❌ Failed to fetch enhanced snapshots:', error);
    console.error('   Error details:', JSON.stringify(error, null, 2));
    console.error('   User ID:', userId);
    return [];
  }

  console.log('🔄 Processing', data?.length || 0, 'snapshots');
  
  // Process snapshots and enrich with page content data
  const enrichedSnapshots = await Promise.all(
    (data || []).map(async (snapshot: any, index: number) => {
      console.log(`📄 Processing snapshot ${index + 1}:`, {
        id: snapshot.id,
        topic: snapshot.topic,
        status: snapshot.status,
        urls: snapshot.urls
      });
      
      const summary = snapshot.snapshot_summaries?.[0];
      
      console.log(`   📋 Found summary:`, !!summary);
      
      // Fetch page content separately
      const { data: pageContent, error: pageError } = await supabase
        .from('page_content')
        .select('scrape_success, scrape_error, title, meta_description')
        .eq('request_id', snapshot.id)
        .eq('url', snapshot.urls[0])
        .single();
      
      if (pageError && pageError.code !== 'PGRST116') {
        console.warn(`   ⚠️ Page content error for ${snapshot.id}:`, pageError);
      } else {
        console.log(`   🕷️ Page content:`, { 
          found: !!pageContent, 
          scrape_success: pageContent?.scrape_success,
          has_error: !!pageContent?.scrape_error 
        });
      }
      
      // Fetch technical audit data from pages table
      const { data: technicalData, error: techError } = await supabase
        .from('pages')
        .select(`
          aeo_score,
          weighted_aeo_score,
          rendering_mode,
          ssr_score_penalty,
          content_quality_score,
          technical_health_score,
          media_accessibility_score,
          schema_markup_score,
          ai_optimization_score,
          title,
          meta_description
        `)
        .eq('url', snapshot.urls[0])
        .single();
      
      if (techError && techError.code !== 'PGRST116') {
        console.warn(`   ⚠️ Technical data error for ${snapshot.id}:`, techError);
      } else {
        console.log(`   🔧 Technical data:`, { 
          found: !!technicalData, 
          aeo_score: technicalData?.aeo_score,
          weighted_score: technicalData?.weighted_aeo_score 
        });
      }
      
      // Fetch checklist results for accurate scoring
      let checklistResults: TechnicalChecklistItem[] = [];
      if (snapshot.status === 'completed') {
        checklistResults = await getTechnicalChecklistResults(snapshot.urls[0]);
      }
      
      // Calculate real technical score from checklist if available
      let technicalScore = 0;
      if (checklistResults.length > 0) {
        technicalScore = calculateTechnicalScoreFromChecklist(checklistResults);
      } else {
        // Fallback to legacy score
        technicalScore = technicalData?.weighted_aeo_score || technicalData?.aeo_score || 0;
      }
      
      return {
        id: snapshot.id,
        url: snapshot.urls[0],
        topic: snapshot.topic,
        status: snapshot.status,
        created_at: snapshot.created_at,
        completed_at: snapshot.completed_at,
        
        // Visibility data
        visibility_score: summary?.visibility_score || 0,
        mentions_count: summary?.mentions_count || 0,
        total_questions: summary?.total_questions || 0,
        top_competitors: summary?.top_competitors || [],
        insights: summary?.insights || [],
        
        // Technical audit data
        aeo_score: technicalData?.aeo_score,
        weighted_aeo_score: technicalData?.weighted_aeo_score,
        rendering_mode: technicalData?.rendering_mode,
        ssr_score_penalty: technicalData?.ssr_score_penalty,
        content_quality_score: technicalData?.content_quality_score,
        technical_health_score: technicalData?.technical_health_score,
        media_accessibility_score: technicalData?.media_accessibility_score,
        schema_markup_score: technicalData?.schema_markup_score,
        ai_optimization_score: technicalData?.ai_optimization_score,
        
        // Store calculated technical score
        calculated_technical_score: technicalScore,
        
        // Issue counts - will be fetched separately if needed
        critical_issues_count: 0,
        total_issues_count: 0,
        recommendations_count: 0,
        
        // Scraping status
        scrape_success: pageContent?.scrape_success,
        scrape_error: pageContent?.scrape_error,
        
        // Page metadata (from page_content table) - cleaned up
        site_title: cleanTitle(pageContent?.title || technicalData?.title),
        meta_description: pageContent?.meta_description || technicalData?.meta_description
      };
    })
  );

  console.log('✅ Returning', enrichedSnapshots.length, 'enriched snapshots');
  return enrichedSnapshots;
}

/**
 * Get detailed technical issues for a specific URL
 */
export async function getTechnicalIssues(url: string): Promise<TechnicalIssue[]> {
  // First get the page ID for this URL
  const { data: pageData, error: pageError } = await supabase
    .from('pages')
    .select('id')
    .eq('url', url)
    .single();

  if (pageError || !pageData) {
    // URL not found in pages table - return empty results
    return [];
  }

  const { data, error } = await supabase
    .from('page_issues')
    .select(`
      id,
      severity,
      category,
      title,
      description,
      impact,
      fix_priority,
      diagnostic,
      html_snippet
    `)
    .eq('page_id', pageData.id)
    .order('fix_priority', { ascending: false });

  if (error) {
    console.error('Failed to fetch technical issues:', error);
    return [];
  }

  return data || [];
}

/**
 * Get technical recommendations for a specific URL
 */
export async function getTechnicalRecommendations(url: string): Promise<TechnicalRecommendation[]> {
  // First get the page ID for this URL
  const { data: pageData, error: pageError } = await supabase
    .from('pages')
    .select('id')
    .eq('url', url)
    .single();

  if (pageError || !pageData) {
    // URL not found in pages table - return empty results
    return [];
  }

  const { data, error } = await supabase
    .from('page_recommendations')
    .select(`
      id,
      category,
      title,
      description,
      implementation,
      expected_impact,
      effort_level,
      priority_score
    `)
    .eq('page_id', pageData.id)
    .order('priority_score', { ascending: false });

  if (error) {
    console.error('Failed to fetch recommendations:', error);
    return [];
  }

  return data || [];
}

/**
 * Get visibility test results for a specific snapshot
 */
export async function getVisibilityResults(snapshotId: string): Promise<VisibilityResult[]> {
  const { data, error } = await supabase
    .from('visibility_results')
    .select(`
      id,
      question_text,
      question_number,
      target_found,
      position,
      citation_snippet,
      competitor_names,
      reasoning_summary,
      search_results_metadata
    `)
    .eq('request_id', snapshotId)
    .order('question_number');

  if (error) {
    console.error('Failed to fetch visibility results:', error);
    return [];
  }

  // Transform data to include top_citations from search_results_metadata
  const results = (data || []).map((result: any) => ({
    id: result.id,
    question_text: result.question_text,
    question_number: result.question_number,
    target_found: result.target_found,
    position: result.position,
    citation_snippet: result.citation_snippet,
    competitor_names: result.competitor_names || [],
    reasoning_summary: result.reasoning_summary,
    top_citations: result.search_results_metadata?.top_citations || []
  }));

  return results;
}

/**
 * Get comprehensive 55-item checklist results for a specific URL
 */
export async function getTechnicalChecklistResults(url: string): Promise<TechnicalChecklistItem[]> {
  // First get the page ID for this URL
  const { data: pageData, error: pageError } = await supabase
    .from('pages')
    .select('id, analysis_metadata')
    .eq('url', url)
    .single();

  if (pageError || !pageData) {
    // URL not found in pages table - return empty results
    return [];
  }

  // Try to fetch from dedicated checklist table first
  const { data: checklistData, error: checklistError } = await supabase
    .from('page_checklist_results')
    .select(`
      id,
      check_id,
      check_name,
      category,
      weight,
      passed,
      details,
      rule_parameters
    `)
    .eq('page_id', pageData.id)
    .order('check_id');

  if (checklistError && checklistError.code !== '42P01') { // 42P01 = table doesn't exist
    console.error('Failed to fetch checklist results:', checklistError);
  }

  // If we have checklist data from the table, return it
  if (checklistData && checklistData.length > 0) {
    return checklistData;
  }

  // Fallback: check if checklist results are stored in metadata
  if (pageData.analysis_metadata?.checklist_results) {
    return pageData.analysis_metadata.checklist_results.map((item: any, index: number) => ({
      id: `${pageData.id}-${index}`,
      check_id: item.id,
      check_name: item.name,
      category: item.category,
      weight: item.weight,
      passed: item.passed,
      details: item.details,
      rule_parameters: item.rule_parameters
    }));
  }

  // No checklist results found for this URL (likely an older snapshot)
  return [];
}

/**
 * Create a new enhanced snapshot request
 */
export async function createEnhancedSnapshot(
  userId: string,
  urls: string[],
  topic: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('snapshot_requests')
      .insert({
        user_id: userId,
        urls,
        topic,
        status: 'pending'
      })
      .select('id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Trigger the edge function to process
    const response = await fetch('/api/process-snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });

    if (!response.ok) {
      console.warn('Failed to trigger snapshot processing');
    }

    return { success: true, id: data.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get issue counts for a specific URL (helper function)
 */
export async function getIssueCounts(url: string): Promise<{
  critical_issues_count: number;
  total_issues_count: number;
  recommendations_count: number;
}> {
  // First get the page ID for this URL
  const { data: pageData, error: pageError } = await supabase
    .from('pages')
    .select('id')
    .eq('url', url)
    .single();

  if (pageError || !pageData) {
    return {
      critical_issues_count: 0,
      total_issues_count: 0,
      recommendations_count: 0
    };
  }

  // Get issue counts
  const { data: issues } = await supabase
    .from('page_issues')
    .select('severity')
    .eq('page_id', pageData.id);

  const { data: recommendations } = await supabase
    .from('page_recommendations')
    .select('id')
    .eq('page_id', pageData.id);

  const criticalIssues = issues?.filter(issue => issue.severity === 'critical').length || 0;
  const totalIssues = issues?.length || 0;
  const totalRecommendations = recommendations?.length || 0;

  return {
    critical_issues_count: criticalIssues,
    total_issues_count: totalIssues,
    recommendations_count: totalRecommendations
  };
}

/**
 * Calculate technical score from checklist results
 */
export function calculateTechnicalScoreFromChecklist(checklistResults: TechnicalChecklistItem[]): number {
  if (checklistResults.length === 0) return 0;
  
  const totalPossiblePoints = checklistResults.reduce((sum, check) => sum + check.weight, 0);
  const earnedPoints = checklistResults.filter(check => check.passed).reduce((sum, check) => sum + check.weight, 0);
  return Math.round((earnedPoints / totalPossiblePoints) * 100);
}

/**
 * Get combined score for dashboard display - uses checklist-based scoring when available
 */
export function getCombinedScore(
  snapshot: EnhancedSnapshotResult, 
  checklistResults?: TechnicalChecklistItem[],
  customVisibilityScore?: number
): {
  score: number;
  breakdown: {
    visibility: number;
    technical: number;
  };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
} {
  const visibilityWeight = 0.6; // 60% weight on visibility
  const technicalWeight = 0.4;  // 40% weight on technical

  // Use custom visibility score if provided, otherwise use database score
  const visibilityScore = customVisibilityScore !== undefined ? customVisibilityScore : (snapshot.visibility_score || 0);
  
  // Use checklist-based scoring if available, otherwise fall back to legacy scores
  let technicalScore = 0;
  if (checklistResults && checklistResults.length > 0) {
    technicalScore = calculateTechnicalScoreFromChecklist(checklistResults);
  } else if (snapshot.calculated_technical_score !== undefined) {
    // Use pre-calculated technical score from enhanced snapshots
    technicalScore = snapshot.calculated_technical_score;
  } else {
    // Fallback to legacy scores only if no other data
    technicalScore = snapshot.weighted_aeo_score || snapshot.aeo_score || 0;
  }
  
  const combinedScore = Math.round(
    (visibilityScore * visibilityWeight) + (technicalScore * technicalWeight)
  );

  // Realistic grading scale for competitive AI visibility
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (combinedScore >= 70) grade = 'A';      // Excellent - very strong competitive AI presence
  else if (combinedScore >= 55) grade = 'B'; // Good - solid competitive AI visibility  
  else if (combinedScore >= 40) grade = 'C'; // Average - some competitive AI mentions
  else if (combinedScore >= 25) grade = 'D'; // Below average - limited competitive visibility
  else grade = 'F';                          // Poor - minimal competitive AI presence

  return {
    score: combinedScore,
    breakdown: {
      visibility: visibilityScore,
      technical: technicalScore
    },
    grade
  };
} 
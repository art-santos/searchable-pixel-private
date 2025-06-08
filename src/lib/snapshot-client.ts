import { getSupabaseClient } from './supabase-client';

export interface SnapshotRequest {
  id: string;
  urls: string[];
  topic: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'timeout';
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface SnapshotSummary {
  id: string;
  url: string;
  visibility_score: number;
  mentions_count: number;
  total_questions: number;
  top_competitors: string[];
  insights: string[];
  insights_summary: string;
  created_at: string;
}

export interface VisibilityResult {
  id: string;
  url: string;
  target_found: boolean;
  position: number | null;
  cited_domains: string[];
  reasoning_summary: string;
  citation_snippet: string | null;
  competitor_names: string[];
  api_call_duration_ms: number;
  tested_at: string;
}

/**
 * Create a new snapshot request
 */
export async function createSnapshotRequest(
  urls: string[], 
  topic: string, 
  userId?: string
): Promise<{ success: boolean; requestId?: string; error?: string }> {
  try {
    console.log('📋 Creating snapshot request:', { urls, topic, userId });
    
    const supabase = getSupabaseClient();
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
      console.error('❌ Failed to create snapshot request:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Created snapshot request:', data.id);
    return { success: true, requestId: data.id };
  } catch (error: any) {
    console.error('❌ Error creating snapshot request:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get snapshot request status and basic info
 */
export async function getSnapshotStatus(requestId: string): Promise<{
  success: boolean;
  request?: SnapshotRequest;
  error?: string;
}> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('snapshot_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, request: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get snapshot results and summaries
 */
export async function getSnapshotResults(requestId: string): Promise<{
  success: boolean;
  summaries?: SnapshotSummary[];
  results?: VisibilityResult[];
  error?: string;
}> {
  try {
    const supabase = getSupabaseClient();
    
    // Get summaries
    const { data: summaries, error: summariesError } = await supabase
      .from('snapshot_summaries')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });

    if (summariesError) {
      return { success: false, error: summariesError.message };
    }

    // Get detailed results
    const { data: results, error: resultsError } = await supabase
      .from('visibility_results')
      .select('*')
      .eq('request_id', requestId)
      .order('tested_at', { ascending: true });

    if (resultsError) {
      return { success: false, error: resultsError.message };
    }

    return { 
      success: true, 
      summaries: summaries || [], 
      results: results || [] 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get user's recent snapshot requests
 */
export async function getUserSnapshots(userId: string, limit: number = 10): Promise<{
  success: boolean;
  requests?: SnapshotRequest[];
  error?: string;
}> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('snapshot_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, requests: data || [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Check if user has available rate limit quota
 */
export async function checkUserRateLimit(userId: string): Promise<{
  success: boolean;
  allowed?: boolean;
  requestsToday?: number;
  limit?: number;
  error?: string;
}> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('user_rate_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('day', today)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is OK
      return { success: false, error: error.message };
    }

    const requestsToday = data?.requests_count || 0;
    const limit = 5; // Free tier limit

    return {
      success: true,
      allowed: requestsToday < limit,
      requestsToday,
      limit
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Trigger snapshot processing (calls processing API for specific snapshot)
 */
export async function triggerSnapshotProcessing(userId?: string, requestId?: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  console.log('🔄 triggerSnapshotProcessing called');
  console.log(`   User ID: ${userId || 'undefined'}`);
  console.log(`   Request ID: ${requestId || 'undefined (will process oldest pending)'}`);
  
  try {
    const requestBody = { 
      user_id: userId,
      request_id: requestId // Include specific request ID if provided
    };
    console.log('📋 Request body for processing trigger:', JSON.stringify(requestBody, null, 2));
    
    // Debug environment variables
    console.log('🔍 Environment variables check:');
    console.log(`   NEXT_PUBLIC_SITE_URL: ${process.env.NEXT_PUBLIC_SITE_URL || 'not set'}`);
    console.log(`   VERCEL_URL: ${process.env.VERCEL_URL || 'not set'}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    
    // Construct absolute URL for server-side fetch
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                   process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   'http://localhost:3000';
    
    const processUrl = `${baseUrl}/api/process-snapshot`;
    console.log('🌐 Making fetch request to:', processUrl);
    console.log(`   Base URL: ${baseUrl}`);
    console.log(`   Full URL: ${processUrl}`);
    
    const response = await fetch(processUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📡 Processing API response received:');
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   OK: ${response.ok}`);
    console.log(`   Headers:`, Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('📊 Response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('❌ Processing API failed:', data);
      return { 
        success: false, 
        error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        message: data.details || 'Processing API returned error'
      };
    }

    console.log('✅ Processing trigger successful');
    return { 
      success: true, 
      message: data.message || 'Processing started successfully' 
    };
  } catch (error: any) {
    console.error('❌ triggerSnapshotProcessing error:', error.message);
    console.error('   Stack:', error.stack);
    console.error('   Name:', error.name);
    console.error('   Cause:', error.cause);
    return { success: false, error: error.message };
  }
}

/**
 * Get live snapshot processing status with polling
 */
export function pollSnapshotStatus(
  requestId: string,
  onUpdate: (request: SnapshotRequest) => void,
  intervalMs: number = 2000
): () => void {
  const interval = setInterval(async () => {
    const { success, request } = await getSnapshotStatus(requestId);
    
    if (success && request) {
      onUpdate(request);
      
      // Stop polling when completed or failed
      if (['completed', 'failed'].includes(request.status)) {
        clearInterval(interval);
      }
    }
  }, intervalMs);

  // Return cleanup function
  return () => clearInterval(interval);
} 
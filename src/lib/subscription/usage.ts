import { createClient } from '@/lib/supabase/client'
import { createServiceClient } from '@/lib/supabase/service'
import { LIMITS, PlanType } from './config'

export interface UsageData {
  scansUsed: number
  scansLimit: number
  scansRemaining: number
  articlesUsed: number
  articlesLimit: number
  articlesRemaining: number
  lastScanReset: Date
  lastArticlesReset: Date
}

export interface UsageEvent {
  id?: string
  user_id: string
  event_type: 'scan' | 'article' | 'api_call'
  event_subtype?: 'basic_scan' | 'max_scan' | 'standard_article' | 'premium_article'
  metadata?: Record<string, any>
  created_at?: string
}

/**
 * Check if user can perform an action based on their limits
 */
export async function checkLimit(
  userId: string,
  feature: 'scan' | 'article',
  count: number = 1
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const supabase = createClient()
  
  if (!supabase) {
    console.error('Supabase client not initialized')
    return { allowed: false, remaining: 0, limit: 0 }
  }
  
  // Get user's profile with plan and usage
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('subscription_plan, monthly_scans_used, monthly_articles_used')
    .eq('id', userId)
    .single()
  
  if (error || !profile) {
    console.error('Error fetching user profile:', error)
    return { allowed: false, remaining: 0, limit: 0 }
  }
  
  const plan = (profile.subscription_plan || 'free') as PlanType
  const limits = LIMITS[plan]
  
  if (feature === 'scan') {
    const limit = limits.scans.max
    const used = profile.monthly_scans_used || 0
    const allowed = limit === -1 || (used + count) <= limit
    const remaining = limit === -1 ? -1 : Math.max(0, limit - used)
    
    return { allowed, remaining, limit }
  } else {
    const limit = limits.articles.max
    const used = profile.monthly_articles_used || 0
    const allowed = limit === -1 || (used + count) <= limit
    const remaining = limit === -1 ? -1 : Math.max(0, limit - used)
    
    return { allowed, remaining, limit }
  }
}

/**
 * Track usage for a feature
 * Note: This function uses the service client for secure server-side operations
 */
export async function trackUsage(
  userId: string,
  eventType: 'scan' | 'article',
  eventSubtype?: UsageEvent['event_subtype'],
  metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient()
  
  try {
    // First check if allowed using client
    const { allowed } = await checkLimit(userId, eventType)
    if (!allowed) {
      return { success: false, error: 'Usage limit exceeded' }
    }
    
    // Record the usage event
    const { error: eventError } = await supabase
      .from('usage_events')
      .insert({
        user_id: userId,
        event_type: eventType,
        event_subtype: eventSubtype,
        metadata: metadata || {}
      })
    
    if (eventError) {
      console.error('Error recording usage event:', eventError)
    }
    
    // Increment the counter using the database function
    const { error: incrementError } = await supabase
      .rpc('increment_usage', {
        p_user_id: userId,
        p_feature: eventType,
        p_count: 1
      })
    
    if (incrementError) {
      console.error('Error incrementing usage:', incrementError)
      return { success: false, error: 'Failed to update usage counter' }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error tracking usage:', error)
    return { success: false, error: 'Failed to track usage' }
  }
}

/**
 * Get user's current usage data
 */
export async function getUserUsage(userId: string): Promise<UsageData | null> {
  const supabase = createClient()
  
  if (!supabase) {
    console.error('Supabase client not initialized')
    return null
  }
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      subscription_plan,
      monthly_scans_used,
      monthly_articles_used,
      last_scan_reset_at,
      last_articles_reset_at
    `)
    .eq('id', userId)
    .single()
  
  if (error || !profile) {
    console.error('Error fetching usage data:', error)
    return null
  }
  
  const plan = (profile.subscription_plan || 'free') as PlanType
  const limits = LIMITS[plan]
  
  return {
    scansUsed: profile.monthly_scans_used || 0,
    scansLimit: limits.scans.max,
    scansRemaining: limits.scans.max === -1 
      ? -1 
      : Math.max(0, limits.scans.max - (profile.monthly_scans_used || 0)),
    articlesUsed: profile.monthly_articles_used || 0,
    articlesLimit: limits.articles.max,
    articlesRemaining: limits.articles.max === -1
      ? -1
      : Math.max(0, limits.articles.max - (profile.monthly_articles_used || 0)),
    lastScanReset: new Date(profile.last_scan_reset_at),
    lastArticlesReset: new Date(profile.last_articles_reset_at)
  }
}

/**
 * Get recent usage events for a user
 */
export async function getUsageEvents(
  userId: string,
  limit: number = 50
): Promise<UsageEvent[]> {
  const supabase = createClient()
  
  if (!supabase) {
    console.error('Supabase client not initialized')
    return []
  }
  
  const { data, error } = await supabase
    .from('usage_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching usage events:', error)
    return []
  }
  
  return data || []
}

/**
 * Save scan results to history
 */
export async function saveScanHistory(
  userId: string,
  scanType: 'basic' | 'max',
  domain: string,
  score: number,
  results: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  
  if (!supabase) {
    console.error('Supabase client not initialized')
    return { success: false, error: 'Supabase client not initialized' }
  }
  
  const { error } = await supabase
    .from('scan_history')
    .insert({
      user_id: userId,
      scan_type: scanType,
      domain,
      score,
      results
    })
  
  if (error) {
    console.error('Error saving scan history:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

/**
 * Get scan history for a user
 */
export async function getScanHistory(
  userId: string,
  limit?: number
): Promise<any[]> {
  const supabase = createClient()
  
  if (!supabase) {
    console.error('Supabase client not initialized')
    return []
  }
  
  // Get user's plan for retention limit
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_plan')
    .eq('id', userId)
    .single()
  
  const plan = (profile?.subscription_plan || 'free') as PlanType
  const retentionDays = LIMITS[plan].dataRetention
  
  let query = supabase
    .from('scan_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  // Apply retention filter if not unlimited
  if (retentionDays !== -1) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)
    query = query.gte('created_at', cutoffDate.toISOString())
  }
  
  if (limit) {
    query = query.limit(limit)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching scan history:', error)
    return []
  }
  
  return data || []
}

/**
 * Reset monthly usage counters (to be called by cron job)
 * This should be called from a secure server-side context
 */
export async function resetMonthlyUsage(): Promise<void> {
  const supabase = createServiceClient()
  
  const { error } = await supabase.rpc('reset_monthly_usage')
  
  if (error) {
    console.error('Error resetting monthly usage:', error)
  } else {
    console.log('Monthly usage reset completed')
  }
}

/**
 * Clean up old data based on retention policies
 * This should be called from a secure server-side context
 */
export async function cleanupOldData(): Promise<void> {
  const supabase = createServiceClient()
  
  const { error } = await supabase.rpc('cleanup_old_data')
  
  if (error) {
    console.error('Error cleaning up old data:', error)
  } else {
    console.log('Data cleanup completed')
  }
} 
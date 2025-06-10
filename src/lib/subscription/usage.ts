import { createClient } from '@/lib/supabase/client'
import { PlanType, getSubscriptionLimits } from './config'

export interface UsageData {
  crawlerVisitsUsed: number
  crawlerVisitsRemaining: number
  domainsUsed: number
  domainsRemaining: number
  isOverLimit: boolean
  plan: PlanType
}

/**
 * Check if user can perform an action based on their usage
 */
export async function checkUsageLimit(
  userId: string,
  action: 'crawler-visit' | 'domain'
): Promise<{ allowed: boolean; reason?: string; usage?: UsageData }> {
  const supabase = createClient()
  
  try {
  const { data: profile, error } = await supabase
    .from('profiles')
      .select('subscription_plan, is_admin')
    .eq('id', userId)
    .single()
  
    if (error) {
      return { allowed: false, reason: 'Could not fetch user profile' }
  }
  
    // Admins have unlimited access
  if (profile.is_admin) {
      return { allowed: true }
  }
  
    const userPlan = (profile.subscription_plan || 'starter') as PlanType
    const limits = getSubscriptionLimits(userPlan)

    // Get current usage
    const usage = await getUserUsage(userId)
    
    if (!usage) {
      return { allowed: false, reason: 'Could not fetch usage data' }
    }

    // Check specific action limits
    switch (action) {
      case 'crawler-visit':
        // No limit on crawler visits - they're just tracked
        return { allowed: true, usage }
      
      case 'domain':
        if (usage.domainsUsed >= limits.domains.max) {
          return { 
            allowed: false, 
            reason: `Domain limit reached (${limits.domains.max})`,
            usage 
          }
        }
        return { allowed: true, usage }
      
      default:
        return { allowed: false, reason: 'Unknown action' }
    }

  } catch (error) {
    console.error('Error checking usage limit:', error)
    return { allowed: false, reason: 'Internal error checking usage' }
  }
}

/**
 * Track usage for billing and limits
 */
export async function trackUsage(
  userId: string,
  action: 'crawler-visit' | 'domain',
  amount: number = 1
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  
  try {
    // For now, just track in usage events table
    const { error } = await supabase
      .from('usage_events')
      .insert({
        user_id: userId,
        event_type: action.replace('-', '_'),
        amount: amount,
        billable: false, // Crawler visits aren't billable, domains might be
        metadata: {
          tracked_at: new Date().toISOString()
        }
      })
    
    if (error) {
      console.error('Error tracking usage:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true }

  } catch (error) {
    console.error('Error in trackUsage:', error)
    return { success: false, error: 'Internal error' }
  }
}

/**
 * Get current usage data for a user
 */
export async function getUserUsage(userId: string): Promise<UsageData | null> {
  const supabase = createClient()
  
  try {
  const { data: profile, error } = await supabase
    .from('profiles')
      .select('subscription_plan, is_admin')
    .eq('id', userId)
    .single()
  
    if (error) {
      console.error('Error fetching profile for usage:', error)
    return null
  }
  
    const userPlan = (profile.subscription_plan || 'starter') as PlanType
    const limits = getSubscriptionLimits(userPlan)

    // Get actual domain count
    const { data: domains, error: domainsError } = await supabase
      .from('domains')
      .select('id')
      .eq('user_id', userId)

    const domainsUsed = domains?.length || 0

    // Get crawler visits (just for display, not limited)
    const { data: crawlerVisits, error: crawlerError } = await supabase
      .from('crawler_visits')
      .select('id')
      .eq('user_id', userId)
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days

    const crawlerVisitsUsed = crawlerVisits?.length || 0

    return {
      crawlerVisitsUsed,
      crawlerVisitsRemaining: 999999, // Unlimited
      domainsUsed,
      domainsRemaining: Math.max(0, limits.domains.max - domainsUsed),
      isOverLimit: domainsUsed > limits.domains.max,
      plan: userPlan
    }

  } catch (error) {
    console.error('Error getting user usage:', error)
    return null
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
  
  const plan = (profile?.subscription_plan || 'starter') as PlanType
  const retentionDays = getSubscriptionLimits(plan).dataRetention
  
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
  const supabase = createClient()
  
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
  const supabase = createClient()
  
  const { error } = await supabase.rpc('cleanup_old_data')
  
  if (error) {
    console.error('Error cleaning up old data:', error)
  } else {
    console.log('Data cleanup completed')
  }
} 
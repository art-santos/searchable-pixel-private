import { createAdminClient } from '@/lib/supabase/admin'
import { randomUUID } from 'crypto'

export interface ScorecardOptions {
  maxPages?: number
}

export interface ScorecardJob {
  id: string
  status: string
  site_url: string
  user_id: string
  created_at: string
  aeo_score?: number | null
}

// Create a new scorecard job. This currently just inserts a row in the
// `crawls` table and returns the ID.
export async function createScorecardJob(
  url: string,
  userId: string,
  options: ScorecardOptions = {}
): Promise<ScorecardJob> {
  const supabase = createAdminClient()

  const id = randomUUID()
  const { error } = await supabase.from('crawls').insert({
    id,
    site_url: url,
    user_id: userId,
    status: 'queued',
    options,
  })

  if (error) {
    throw error
  }

  return {
    id,
    status: 'queued',
    site_url: url,
    user_id: userId,
    created_at: new Date().toISOString(),
  }
}

// Fetch a scorecard job status by ID from `crawls` table
export async function getScorecardStatus(id: string): Promise<ScorecardJob | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('crawls')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as ScorecardJob
}

// Retrieve the completed scorecard from the `site_audit_summary` view
export async function getScorecard(id: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('site_audit_summary')
    .select('*')
    .eq('crawl_id', id)
    .single()
  if (error) throw error
  return data
}

// List recent scorecards for a user
export async function getScorecardHistory(userId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('site_audit_summary')
    .select('crawl_id, domain, created_at:started_at, status, aeo_score')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return data
}

import { startSiteAudit, getSiteAuditStatus, getSiteAuditResults } from '@/services/crawler'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export interface ScorecardJobResponse {
  id: string
  status: string
  processedPages?: number
  totalPages?: number
  aeoScore?: number
  issues?: {
    critical: number
    warning: number
    info: number
  }
  metrics?: {
    contentQuality: number
    technical: number
    mediaAccessibility: number
  }
}

/**
 * Create a scorecard job by starting a site audit. The returned id is the
 * underlying crawl id.
 */
export async function createScorecardJob(options: {
  url: string
  userId: string
  maxPages?: number
}): Promise<ScorecardJobResponse> {
  const { crawlId } = await startSiteAudit({ siteUrl: options.url, userId: options.userId, maxPages: options.maxPages })
  return { id: crawlId, status: 'queued' }
}

/**
 * Get the status of a scorecard job.
 */
export async function getScorecardStatus(id: string): Promise<ScorecardJobResponse> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      cookies: {
        get: async (name: string) => cookieStore.get(name)?.value
      }
    }
  )

  const { data: crawlData, error } = await supabase
    .from('crawls')
    .select('total_pages')
    .eq('id', id)
    .single()

  if (error) throw error

  const pagesCount = await supabase
    .from('pages')
    .select('id', { count: 'exact', head: true })
    .eq('crawl_id', id)

  const processed = pagesCount.count || 0
  const total = crawlData?.total_pages || 0

  const { status } = await getSiteAuditStatus(id)

  return { id, status, processedPages: processed, totalPages: total }
}

/**
 * Get the completed scorecard.
 */
export async function getScorecardResult(id: string): Promise<ScorecardJobResponse> {
  const results = await getSiteAuditResults(id)
  if (results.status !== 'completed') return { id, status: results.status }

  return {
    id,
    status: 'completed',
    aeoScore: results.aeoScore,
    issues: results.issues,
    metrics: results.metricScores
  }
}

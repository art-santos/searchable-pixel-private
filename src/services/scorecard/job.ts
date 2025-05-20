import { asyncCrawlUrl, checkCrawlStatus, getCrawlResults, FirecrawlOptions } from '../firecrawl-client'

export interface CreateJobOptions extends FirecrawlOptions {}

export async function createScorecardJob(url: string, userId: string, options: CreateJobOptions = {}) {
  const res = await asyncCrawlUrl(url, options)
  return { id: res.runId, status: 'queued' as const }
}

export async function getScorecardStatus(id: string) {
  return checkCrawlStatus(id)
}

export async function getScorecardResult(id: string) {
  const data = await getCrawlResults(id)
  // Placeholder scoring calculation
  const aeoScore = Math.round(Math.random() * 100)
  return { id, status: 'completed' as const, aeoScore, data }
}

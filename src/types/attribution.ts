export interface AttributionStats {
  totalCrawls: number
  uniqueCrawlers: number
  uniqueDomains: number
  avgResponseTime: number
  uniquePaths: number
  totalSessions: number
  avgPagesPerSession: number
}

export interface CrawlerData {
  name: string
  company: string
  percentage: number
  crawls: number
  icon?: string
  color: string
}

export interface PageData {
  path: string
  totalCrawls: number
  uniqueCrawlers: number
  avgResponse: number
  lastCrawled: string
  topCrawler: string
}

export interface PeriodComparison {
  hasComparison: boolean
  percentChange?: number
  trend?: 'up' | 'down' | 'same'
} 
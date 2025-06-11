import { useState, useEffect, useCallback } from 'react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useAuth } from '@/contexts/AuthContext'
import { TimeframeOption } from '@/components/custom/timeframe-selector'
import { AttributionStats, CrawlerData, PageData, PeriodComparison } from '@/types/attribution'

interface AttributionData {
  stats: AttributionStats | null
  crawlerData: CrawlerData[]
  pageData: PageData[]
  periodComparison: PeriodComparison | null
  isLoading: boolean
  error: string | null
}

const timeframeMap: Record<TimeframeOption, string> = {
  'Last 24 hours': 'last24h',
  'Last 7 days': 'last7d',
  'Last 30 days': 'last30d',
  'Last 90 days': 'last90d',
  'Last 365 days': 'last365d'
}

export function useAttributionData(timeframe: TimeframeOption): AttributionData {
  const { currentWorkspace } = useWorkspace()
  const { session } = useAuth()
  
  const [stats, setStats] = useState<AttributionStats | null>(null)
  const [crawlerData, setCrawlerData] = useState<CrawlerData[]>([])
  const [pageData, setPageData] = useState<PageData[]>([])
  const [periodComparison, setPeriodComparison] = useState<PeriodComparison | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleChartDataChange = useCallback((data: { totalCrawls: number; periodComparison: PeriodComparison | null }) => {
    setPeriodComparison(data.periodComparison)
    console.log('🔍 [useAttributionData] Chart data response:', { 
      totalCrawls: data.totalCrawls, 
      periodComparison: data.periodComparison 
    })
  }, [])

  const fetchAllData = useCallback(async () => {
    if (!currentWorkspace) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const headers = {
        'Authorization': session?.access_token ? `Bearer ${session.access_token}` : ''
      }
      
      // Fetch all data in parallel
      const [statsResponse, crawlerResponse, pagesResponse] = await Promise.all([
        fetch(`/api/dashboard/attribution-stats?timeframe=${timeframeMap[timeframe]}&timezone=${encodeURIComponent(timezone)}&workspaceId=${currentWorkspace.id}`, { headers }),
        fetch(`/api/dashboard/crawler-stats?timeframe=${timeframeMap[timeframe]}&timezone=${encodeURIComponent(timezone)}&workspaceId=${currentWorkspace.id}`, { headers }),
        fetch(`/api/dashboard/attribution-pages?timeframe=${timeframeMap[timeframe]}&timezone=${encodeURIComponent(timezone)}&workspaceId=${currentWorkspace.id}`, { headers })
      ])
      
      if (statsResponse.ok) {
        const data = await statsResponse.json()
        setStats(data)
      }
      
      if (crawlerResponse.ok) {
        const data = await crawlerResponse.json()
        setCrawlerData(data.crawlers || [])
      }
      
      if (pagesResponse.ok) {
        const data = await pagesResponse.json()
        setPageData(data.pages || [])
      }

    } catch (error) {
      console.error('Error fetching attribution data:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch attribution data')
    } finally {
      setIsLoading(false)
    }
  }, [timeframe, currentWorkspace, session?.access_token])

  useEffect(() => {
    if (currentWorkspace) {
      fetchAllData()
    }
  }, [fetchAllData])

  return {
    stats,
    crawlerData,
    pageData,
    periodComparison,
    isLoading,
    error,
    handleChartDataChange
  }
} 
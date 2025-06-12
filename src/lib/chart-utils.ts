import { SupabaseClient } from '@supabase/supabase-js'

// Types
export interface TimeframeConfig {
  startDate: Date
  chartPeriods: number
  isHourly: boolean
  isSixHourly: boolean
  groupBy: 'hour' | 'day' | '6hour'
}

export interface ChartDataPoint {
  date: string
  value: number
  showLabel?: boolean
  isCurrentPeriod?: boolean
}

export interface PeriodBounds {
  start: Date
  end: Date
}

// Constants
export const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
export const BATCH_SIZE = 1000
export const MAX_CONCURRENT_BATCHES = 5

// Timeframe configuration
export function getTimeframeConfig(timeframe: string): TimeframeConfig {
  const now = new Date()
  const config: TimeframeConfig = {
    startDate: new Date(now),
    chartPeriods: 7,
    isHourly: false,
    isSixHourly: false,
    groupBy: 'day'
  }

  switch (timeframe.toLowerCase()) {
    case 'last24h':
    case 'last 24 hours':
      config.startDate.setHours(config.startDate.getHours() - 24)
      config.chartPeriods = 24
      config.isHourly = true
      config.groupBy = 'hour'
      break
    case 'last7d':
    case 'last 7 days':
      config.startDate.setDate(config.startDate.getDate() - 7)
      config.chartPeriods = 28 // 4 intervals per day for 7 days
      config.isSixHourly = true
      config.groupBy = '6hour'
      break
    case 'last30d':
    case 'last 30 days':
      config.startDate.setDate(config.startDate.getDate() - 30)
      config.chartPeriods = 30
      break
    case 'last90d':
    case 'last 90 days':
      config.startDate.setDate(config.startDate.getDate() - 90)
      config.chartPeriods = 90
      break
    case 'last365d':
    case 'last 365 days':
      config.startDate.setDate(config.startDate.getDate() - 365)
      config.chartPeriods = 365
      break
    default:
      // Default to 7 days
      config.startDate.setDate(config.startDate.getDate() - 7)
      config.chartPeriods = 28
      config.isSixHourly = true
      config.groupBy = '6hour'
  }

  return config
}

// Generate aggregation key for visits
export function getAggregationKey(date: Date, groupBy: 'hour' | 'day' | '6hour'): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  switch (groupBy) {
    case 'hour':
      const hour = String(date.getHours()).padStart(2, '0')
      return `${year}-${month}-${day}-${hour}`
    case '6hour':
      const interval = Math.floor(date.getHours() / 6) // 0, 1, 2, or 3
      return `${year}-${month}-${day}-${interval}`
    case 'day':
    default:
      return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`
  }
}

// Get period bounds for chart data generation
export function getPeriodBounds(
  baseTime: Date,
  groupBy: 'hour' | 'day' | '6hour',
  offset: number,
  interval?: number
): PeriodBounds {
  const start = new Date(baseTime)
  const end = new Date(baseTime)

  switch (groupBy) {
    case 'hour':
      start.setHours(start.getHours() - offset, 0, 0, 0)
      end.setHours(end.getHours() - offset, 59, 59, 999)
      break
    case '6hour':
      if (interval !== undefined) {
        start.setHours(interval * 6, 0, 0, 0)
        end.setHours(interval * 6 + 5, 59, 59, 999)
      }
      break
    case 'day':
    default:
      start.setDate(start.getDate() - offset)
      start.setHours(0, 0, 0, 0)
      end.setDate(end.getDate() - offset)
      end.setHours(23, 59, 59, 999)
  }

  return { start, end }
}

// Format display label for chart
export function formatChartLabel(date: Date, groupBy: 'hour' | 'day' | '6hour'): string {
  if (groupBy === 'hour') {
    const hour = date.getHours()
    if (hour === 0) return '12 AM'
    if (hour < 12) return `${hour} AM`
    if (hour === 12) return '12 PM'
    return `${hour - 12} PM`
  }
  
  // For day and 6hour grouping, use day format
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`
}

// Optimized batch fetching with concurrency control
export async function fetchDataInBatches<T>(
  supabase: SupabaseClient,
  tableName: string,
  filters: Record<string, any>,
  selectColumns: string = '*',
  orderBy?: { column: string; ascending: boolean }
): Promise<T[]> {
  // First, get the total count
  let countQuery = supabase.from(tableName).select('*', { count: 'exact', head: true })
  
  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    if (key.startsWith('gte_')) {
      countQuery = countQuery.gte(key.replace('gte_', ''), value)
    } else if (key.startsWith('lte_')) {
      countQuery = countQuery.lte(key.replace('lte_', ''), value)
    } else {
      countQuery = countQuery.eq(key, value)
    }
  })

  const { count, error: countError } = await countQuery

  if (countError || !count) {
    console.error('Error getting count:', countError)
    return []
  }

  // If data is small enough, fetch in one go
  if (count <= BATCH_SIZE) {
    let query = supabase.from(tableName).select(selectColumns)
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (key.startsWith('gte_')) {
        query = query.gte(key.replace('gte_', ''), value)
      } else if (key.startsWith('lte_')) {
        query = query.lte(key.replace('lte_', ''), value)
      } else {
        query = query.eq(key, value)
      }
    })

    // Apply ordering
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending })
    }

    const { data, error } = await query
    return error ? [] : (data as T[])
  }

  // For larger datasets, fetch in controlled batches
  const totalBatches = Math.ceil(count / BATCH_SIZE)
  const results: T[] = []

  // Process in chunks to avoid overwhelming the database
  for (let i = 0; i < totalBatches; i += MAX_CONCURRENT_BATCHES) {
    const batchPromises = []
    
    for (let j = 0; j < MAX_CONCURRENT_BATCHES && i + j < totalBatches; j++) {
      const batchIndex = i + j
      const start = batchIndex * BATCH_SIZE
      const end = start + BATCH_SIZE - 1

      let query = supabase.from(tableName).select(selectColumns)
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (key.startsWith('gte_')) {
          query = query.gte(key.replace('gte_', ''), value)
        } else if (key.startsWith('lte_')) {
          query = query.lte(key.replace('lte_', ''), value)
        } else {
          query = query.eq(key, value)
        }
      })

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending })
      }

      batchPromises.push(query.range(start, end))
    }

    const batchResults = await Promise.all(batchPromises)
    
    for (const { data, error } of batchResults) {
      if (error) {
        console.error('Error fetching batch:', error)
        continue
      }
      if (data) {
        results.push(...(data as T[]))
      }
    }
  }

  return results
}

// Efficient data aggregation using Map
export function aggregateVisitsByPeriod(
  visits: Array<{ timestamp: string; [key: string]: any }>,
  groupBy: 'hour' | 'day' | '6hour',
  timezone?: string
): Map<string, number> {
  const aggregates = new Map<string, number>()

  visits.forEach(visit => {
    const date = new Date(visit.timestamp)
    const key = getAggregationKey(date, groupBy)
    aggregates.set(key, (aggregates.get(key) || 0) + 1)
  })

  return aggregates
}

// Generate complete chart data with proper labels
export function generateChartData(
  aggregates: Map<string, number>,
  config: TimeframeConfig
): ChartDataPoint[] {
  const chartData: ChartDataPoint[] = []
  const now = new Date()

  if (config.isHourly) {
    // Generate 24 hours
    for (let hoursAgo = 23; hoursAgo >= 0; hoursAgo--) {
      const hourTime = new Date(now)
      hourTime.setHours(hourTime.getHours() - hoursAgo)
      
      const key = getAggregationKey(hourTime, 'hour')
      const value = aggregates.get(key) || 0
      
      chartData.push({
        date: formatChartLabel(hourTime, 'hour'),
        value,
        isCurrentPeriod: hoursAgo === 0,
        showLabel: hoursAgo % 4 === 0 || hoursAgo === 0
      })
    }
  } else if (config.isSixHourly) {
    // Generate 7 days with 6-hour intervals
    for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
      const dayTime = new Date(now)
      dayTime.setDate(dayTime.getDate() - daysAgo)
      
      for (let interval = 0; interval < 4; interval++) {
        const key = getAggregationKey(dayTime, '6hour')
          .replace(/-\d$/, `-${interval}`) // Ensure correct interval
        const value = aggregates.get(key) || 0
        
        chartData.push({
          date: formatChartLabel(dayTime, 'day'),
          value,
          isCurrentPeriod: daysAgo === 0 && interval === 3,
          showLabel: interval === 1 // Only show label for middle interval
        })
      }
    }
  } else {
    // Generate daily data
    const daysToGenerate = config.chartPeriods
    
    for (let daysAgo = daysToGenerate - 1; daysAgo >= 0; daysAgo--) {
      const dayTime = new Date(now)
      dayTime.setDate(dayTime.getDate() - daysAgo)
      
      const key = getAggregationKey(dayTime, 'day')
      const value = aggregates.get(key) || 0
      
      // Determine label visibility based on timeframe
      let showLabel = true
      if (daysToGenerate <= 7) {
        // Show all labels for 7 days or less
        showLabel = true
      } else if (daysToGenerate <= 30) {
        // Show every 3rd day for 30 days
        showLabel = daysAgo % 3 === 0 || daysAgo === 0
      } else if (daysToGenerate <= 90) {
        // Show every 7th day for 90 days
        showLabel = daysAgo % 7 === 0 || daysAgo === 0
      } else if (daysToGenerate <= 180) {
        // Show every 14th day for 180 days
        showLabel = daysAgo % 14 === 0 || daysAgo === 0
      } else {
        // Show every 30th day for 365+ days
        showLabel = daysAgo % 30 === 0 || daysAgo === 0
      }
      
      chartData.push({
        date: formatChartLabel(dayTime, 'day'),
        value,
        isCurrentPeriod: daysAgo === 0,
        showLabel
      })
    }
  }

  return chartData
}

// Format relative time
export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const time = new Date(date)
  const diffMs = now.getTime() - time.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  
  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return time.toLocaleDateString()
}

// Calculate average interval
export function calculateAverageInterval(timestamps: string[]): string {
  if (timestamps.length <= 1) return 'N/A'
  
  const sortedTimes = timestamps
    .map(t => new Date(t).getTime())
    .sort((a, b) => a - b)
  
  const intervals: number[] = []
  for (let i = 1; i < sortedTimes.length; i++) {
    intervals.push(sortedTimes[i] - sortedTimes[i - 1])
  }
  
  const avgMs = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
  const avgHours = avgMs / (1000 * 60 * 60)
  
  if (avgHours < 1) {
    return `${Math.round(avgMs / (1000 * 60))}m`
  } else if (avgHours < 24) {
    return `${Math.round(avgHours * 10) / 10}h`
  } else {
    return `${Math.round((avgHours / 24) * 10) / 10}d`
  }
} 
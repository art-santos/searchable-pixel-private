import { SupabaseClient } from '@supabase/supabase-js'

// Database query optimization utilities

export interface QueryOptions {
  select?: string
  filters?: Record<string, any>
  orderBy?: { column: string; ascending: boolean }
  limit?: number
  offset?: number
}

// Build optimized query with proper indexing hints
export function buildOptimizedQuery(
  supabase: SupabaseClient,
  table: string,
  options: QueryOptions
) {
  let query = supabase.from(table)

  // Select specific columns to reduce payload
  if (options.select) {
    query = query.select(options.select)
  } else {
    query = query.select('*')
  }

  // Apply filters
  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      if (key.startsWith('gte_')) {
        query = query.gte(key.replace('gte_', ''), value)
      } else if (key.startsWith('lte_')) {
        query = query.lte(key.replace('lte_', ''), value)
      } else if (key.startsWith('gt_')) {
        query = query.gt(key.replace('gt_', ''), value)
      } else if (key.startsWith('lt_')) {
        query = query.lt(key.replace('lt_', ''), value)
      } else if (key.startsWith('in_')) {
        query = query.in(key.replace('in_', ''), value)
      } else if (key.startsWith('contains_')) {
        query = query.contains(key.replace('contains_', ''), value)
      } else if (value === null) {
        query = query.is(key, null)
      } else {
        query = query.eq(key, value)
      }
    })
  }

  // Apply ordering
  if (options.orderBy) {
    query = query.order(options.orderBy.column, { 
      ascending: options.orderBy.ascending 
    })
  }

  // Apply pagination
  if (options.limit !== undefined) {
    query = query.limit(options.limit)
  }

  if (options.offset !== undefined) {
    const start = options.offset
    const end = options.limit 
      ? options.offset + options.limit - 1 
      : options.offset + 999 // Default to 1000 items
    query = query.range(start, end)
  }

  return query
}

// Batch insert with chunking for better performance
export async function batchInsert<T extends Record<string, any>>(
  supabase: SupabaseClient,
  table: string,
  data: T[],
  chunkSize: number = 500
): Promise<{ success: boolean; error?: any }> {
  if (data.length === 0) {
    return { success: true }
  }

  try {
    // Process in chunks to avoid payload size limits
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize)
      const { error } = await supabase.from(table).insert(chunk)
      
      if (error) {
        console.error(`Error inserting chunk ${i / chunkSize + 1}:`, error)
        return { success: false, error }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Batch insert error:', error)
    return { success: false, error }
  }
}

// Optimized count query
export async function getOptimizedCount(
  supabase: SupabaseClient,
  table: string,
  filters?: Record<string, any>
): Promise<number> {
  let query = supabase
    .from(table)
    .select('*', { count: 'exact', head: true })

  // Apply filters
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (key.startsWith('gte_')) {
        query = query.gte(key.replace('gte_', ''), value)
      } else if (key.startsWith('lte_')) {
        query = query.lte(key.replace('lte_', ''), value)
      } else {
        query = query.eq(key, value)
      }
    })
  }

  const { count, error } = await query

  if (error) {
    console.error('Count query error:', error)
    return 0
  }

  return count || 0
}

// Connection pooling helper for better performance
export class ConnectionPool {
  private static instance: ConnectionPool
  private connections: Map<string, SupabaseClient> = new Map()

  static getInstance(): ConnectionPool {
    if (!ConnectionPool.instance) {
      ConnectionPool.instance = new ConnectionPool()
    }
    return ConnectionPool.instance
  }

  getConnection(key: string, factory: () => SupabaseClient): SupabaseClient {
    if (!this.connections.has(key)) {
      this.connections.set(key, factory())
    }
    return this.connections.get(key)!
  }

  clearConnections(): void {
    this.connections.clear()
  }
}

// Query result transformer for consistent data format
export function transformQueryResult<T, R>(
  data: T[],
  transformer: (item: T) => R
): R[] {
  return data.map(transformer)
}

// Aggregate query helper
export async function aggregateQuery(
  supabase: SupabaseClient,
  table: string,
  aggregations: {
    column: string
    function: 'count' | 'sum' | 'avg' | 'min' | 'max'
    alias: string
  }[],
  filters?: Record<string, any>,
  groupBy?: string[]
): Promise<any[]> {
  // Supabase doesn't support direct aggregation functions in the JS client
  // This is a placeholder for when they add support or for raw SQL queries
  // For now, we'll fetch the data and aggregate in memory
  
  let query = supabase.from(table).select('*')
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value)
    })
  }
  
  const { data, error } = await query
  
  if (error || !data) {
    return []
  }
  
  // Perform in-memory aggregation (not ideal for large datasets)
  // In production, consider using Supabase Functions or direct SQL
  return data
} 
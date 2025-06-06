import { useEffect, useState } from 'react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'

// Hook for workspace-filtered crawler visits
export function useWorkspaceCrawlerVisits() {
  const { user } = useAuth()
  const { currentWorkspace } = useWorkspace()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !currentWorkspace) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const supabase = createClient()
        const { data: visits, error: queryError } = await supabase
          .from('crawler_visits')
          .select('*')
          .eq('workspace_id', currentWorkspace.id)
          .order('timestamp', { ascending: false })

        if (queryError) {
          throw queryError
        }

        setData(visits || [])
      } catch (err) {
        console.error('Error fetching workspace crawler visits:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Listen for workspace changes and refetch data
    const handleWorkspaceChange = () => {
      fetchData()
    }

    window.addEventListener('workspaceChanged', handleWorkspaceChange)
    return () => window.removeEventListener('workspaceChanged', handleWorkspaceChange)
  }, [user, currentWorkspace])

  return { data, loading, error, refetch: () => fetchData() }
}

// Generic hook for workspace-filtered table data
export function useWorkspaceTable<T = any>(
  tableName: string,
  columns?: string,
  filters?: Record<string, any>
) {
  const { user } = useAuth()
  const { currentWorkspace } = useWorkspace()
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !currentWorkspace || !supabase) {
        setData([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        let query = supabase
          .from(tableName)
          .select(columns || '*')
          .eq('workspace_id', currentWorkspace.id)

        // Apply additional filters
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value)
          })
        }

        const { data: results, error: fetchError } = await query

        if (fetchError) {
          setError(`Failed to fetch ${tableName}: ${fetchError.message}`)
          setData([])
        } else {
          setData(results || [])
        }
      } catch (err) {
        setError(`Error fetching ${tableName}: ${err}`)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Listen for workspace changes
    const handleWorkspaceChange = () => {
      fetchData()
    }

    window.addEventListener('workspaceChanged', handleWorkspaceChange)

    return () => {
      window.removeEventListener('workspaceChanged', handleWorkspaceChange)
    }
  }, [user, currentWorkspace, tableName, columns, supabase, filters])

  return { data, loading, error, refetch: () => setLoading(true) }
}

// Hook for workspace-specific crawler visits
export function useWorkspaceCrawlerStats() {
  return useWorkspaceTable(
    'crawler_visits',
    'id, crawler_name, timestamp, page_url, user_agent, geographic_data',
    {}
  )
}

// Hook for workspace-specific AI crawler logs (for billing)
export function useWorkspaceCrawlerLogs() {
  return useWorkspaceTable(
    'ai_crawler_logs', 
    'id, crawler_name, visit_timestamp, page_url, user_agent',
    {}
  )
} 
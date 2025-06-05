import { useEffect, useState } from 'react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'

// Example hook for fetching workspace-filtered data
export function useWorkspaceVisibilityRuns() {
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
        const { data: runs, error: queryError } = await supabase
          .from('max_visibility_runs')
          .select('*')
          .eq('triggered_by', user.id)
          .eq('workspace_id', currentWorkspace.id)
          .order('created_at', { ascending: false })

        if (queryError) {
          throw queryError
        }

        setData(runs || [])
      } catch (err) {
        console.error('Error fetching workspace visibility runs:', err)
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

// Example hook for workspace-filtered content articles
export function useWorkspaceContent() {
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
        const { data: articles, error: queryError } = await supabase
          .from('content_articles')
          .select('*')
          .eq('created_by', user.id)
          .eq('workspace_id', currentWorkspace.id)
          .order('created_at', { ascending: false })

        if (queryError) {
          throw queryError
        }

        setData(articles || [])
      } catch (err) {
        console.error('Error fetching workspace content:', err)
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

// Hook for workspace-specific visibility runs
export function useWorkspaceVisibilityRuns() {
  return useWorkspaceTable(
    'max_visibility_runs',
    'id, total_score, created_at, status',
    { status: 'completed' }
  )
}

// Hook for workspace-specific content articles  
export function useWorkspaceContent() {
  return useWorkspaceTable(
    'content_articles',
    'id, title, content_preview, category, created_at, status, word_count',
    { status: 'published' }
  )
}

// Hook for workspace-specific AI crawler logs
export function useWorkspaceCrawlerLogs() {
  return useWorkspaceTable(
    'ai_crawler_logs', 
    'id, crawler_name, visit_timestamp, page_url, user_agent',
    {}
  )
} 
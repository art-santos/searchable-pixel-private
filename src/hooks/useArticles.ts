import { useState, useEffect, useCallback } from 'react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { toast } from '@/components/ui/use-toast'

export interface Article {
  id: string
  title: string
  content: string
  content_preview: string
  status: string
  category: string
  primary_keyword: string
  meta_description: string
  word_count: number
  read_time: string
  views: number
  workspace_id: string
  created_at: string
  updated_at: string
}

interface UseArticlesResult {
  articles: Article[]
  totalCount: number
  isLoading: boolean
  error: string | null
  
  loadArticles: (options?: {
    search?: string
    status?: string
    limit?: number
    offset?: number
  }) => Promise<void>
  
  createArticle: (article: {
    title: string
    content: string
    category?: string
    primaryKeyword?: string
    metaDescription?: string
    status?: string
  }) => Promise<Article | null>
  
  refresh: () => Promise<void>
}

export function useArticles(): UseArticlesResult {
  const { currentWorkspace } = useWorkspace()
  const [articles, setArticles] = useState<Article[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastOptions, setLastOptions] = useState<any>({})

  const loadArticles = useCallback(async (options?: {
    search?: string
    status?: string
    limit?: number
    offset?: number
  }) => {
    if (!currentWorkspace?.id) {
      setArticles([])
      setTotalCount(0)
      return
    }

    setIsLoading(true)
    setError(null)
    setLastOptions(options || {})

    try {
      const queryParams = new URLSearchParams({
        workspaceId: currentWorkspace.id,
        ...(options?.search && { search: options.search }),
        ...(options?.status && { status: options.status }),
        ...(options?.limit && { limit: options.limit.toString() }),
        ...(options?.offset && { offset: options.offset.toString() })
      })

      const response = await fetch(`/api/content/articles?${queryParams}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load articles')
      }

      setArticles(result.data.articles)
      setTotalCount(result.data.totalCount)
    } catch (error) {
      console.error('Error loading articles:', error)
      setError((error as Error).message)
      toast({
        title: 'Error loading articles',
        description: (error as Error).message,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [currentWorkspace?.id])

  const createArticle = useCallback(async (article: {
    title: string
    content: string
    category?: string
    primaryKeyword?: string
    metaDescription?: string
    status?: string
  }): Promise<Article | null> => {
    if (!currentWorkspace?.id) {
      toast({
        title: 'No workspace selected',
        description: 'Please select a workspace to create articles.',
        variant: 'destructive'
      })
      return null
    }

    try {
      const response = await fetch('/api/content/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: currentWorkspace.id,
          ...article
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create article')
      }

      // Refresh the articles list
      await loadArticles(lastOptions)

      toast({
        title: 'Article created',
        description: 'Your article has been created successfully.'
      })

      return result.data
    } catch (error) {
      console.error('Error creating article:', error)
      toast({
        title: 'Error creating article',
        description: (error as Error).message,
        variant: 'destructive'
      })
      return null
    }
  }, [currentWorkspace?.id, loadArticles, lastOptions])

  const refresh = useCallback(async () => {
    await loadArticles(lastOptions)
  }, [loadArticles, lastOptions])

  // Load articles when workspace changes
  useEffect(() => {
    if (currentWorkspace?.id) {
      loadArticles()
    }
  }, [currentWorkspace?.id])

  return {
    articles,
    totalCount,
    isLoading,
    error,
    loadArticles,
    createArticle,
    refresh
  }
} 
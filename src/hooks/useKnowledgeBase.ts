import { useState, useEffect, useCallback } from 'react'
import { KnowledgeItem, KnowledgeFilters } from '@/lib/knowledge-base/types'
import { toast } from '@/components/ui/use-toast'

interface KnowledgeBaseStatistics {
  totalItems: number
  totalWords: number
  completenessScore: number
  tagDistribution: Record<string, number>
}

interface UseKnowledgeBaseResult {
  // Data
  items: KnowledgeItem[]
  statistics: KnowledgeBaseStatistics | null
  isLoading: boolean
  isExtracting: boolean
  
  // Operations
  loadItems: (companyId: string, filters?: KnowledgeFilters) => Promise<void>
  createItem: (companyId: string, content: string, tag: string) => Promise<void>
  updateItem: (id: string, content: string, tag: string) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  extractFromText: (companyId: string, textDump: string) => Promise<void>
  estimateExtraction: (text: string) => Promise<{ estimatedItemCount: number; wordCount: number }>
  
  // Filters
  filters: KnowledgeFilters
  setFilters: (filters: KnowledgeFilters) => void
}

export function useKnowledgeBase(): UseKnowledgeBaseResult {
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [statistics, setStatistics] = useState<KnowledgeBaseStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [filters, setFilters] = useState<KnowledgeFilters>({})

  // Load knowledge items with filters
  const loadItems = useCallback(async (companyId: string, newFilters?: KnowledgeFilters) => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams({
        companyId,
        ...(newFilters?.tag && newFilters.tag !== 'all' && { tag: newFilters.tag }),
        ...(newFilters?.search && { search: newFilters.search }),
        ...(newFilters?.limit && { limit: newFilters.limit.toString() }),
        ...(newFilters?.offset && { offset: newFilters.offset.toString() })
      })

      const response = await fetch(`/api/knowledge-base/items?${queryParams}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load knowledge items')
      }

      setItems(result.data.items)
      setStatistics(result.data.statistics)
      
    } catch (error) {
      console.error('Error loading knowledge items:', error)
      toast({
        title: 'Error loading knowledge items',
        description: (error as Error).message,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Create a single knowledge item
  const createItem = useCallback(async (companyId: string, content: string, tag: string) => {
    try {
      const response = await fetch('/api/knowledge-base/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, content, tag })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create knowledge item')
      }

      // Add new item to the list
      setItems(prev => [result.data, ...prev])
      
      toast({
        title: 'Knowledge item created',
        description: 'Successfully added to your knowledge base'
      })

      // Refresh statistics
      await loadItems(companyId, filters)
      
    } catch (error) {
      console.error('Error creating knowledge item:', error)
      toast({
        title: 'Error creating knowledge item',
        description: (error as Error).message,
        variant: 'destructive'
      })
      throw error
    }
  }, [filters, loadItems])

  // Update a knowledge item
  const updateItem = useCallback(async (id: string, content: string, tag: string) => {
    try {
      const response = await fetch('/api/knowledge-base/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, content, tag })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update knowledge item')
      }

      // Update item in the list
      setItems(prev => prev.map(item => 
        item.id === id ? result.data : item
      ))
      
      toast({
        title: 'Knowledge item updated',
        description: 'Changes saved successfully'
      })
      
    } catch (error) {
      console.error('Error updating knowledge item:', error)
      toast({
        title: 'Error updating knowledge item',
        description: (error as Error).message,
        variant: 'destructive'
      })
      throw error
    }
  }, [])

  // Delete a knowledge item
  const deleteItem = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/knowledge-base/items?id=${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete knowledge item')
      }

      // Remove item from the list
      setItems(prev => prev.filter(item => item.id !== id))
      
      toast({
        title: 'Knowledge item deleted',
        description: 'Item removed from your knowledge base'
      })
      
    } catch (error) {
      console.error('Error deleting knowledge item:', error)
      toast({
        title: 'Error deleting knowledge item',
        description: (error as Error).message,
        variant: 'destructive'
      })
      throw error
    }
  }, [])

  // Extract knowledge from text dump
  const extractFromText = useCallback(async (companyId: string, textDump: string) => {
    setIsExtracting(true)
    try {
      console.log('Starting knowledge extraction for company:', companyId, 'Text length:', textDump.length)
      
      const response = await fetch('/api/knowledge-base/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, textDump })
      })

      const result = await response.json()
      console.log('Extraction API response:', { status: response.status, ok: response.ok, result })

      if (!response.ok) {
        throw new Error(result.error || `API error: ${response.status} ${response.statusText}`)
      }

      const { extractedItems, extractionStats } = result.data

      console.log('Successfully extracted items:', extractedItems?.length || 0)

      // Add extracted items to the list
      setItems(prev => [...extractedItems, ...prev])
      
      toast({
        title: 'Knowledge extracted successfully',
        description: `Added ${extractedItems.length} new items to your knowledge base`
      })

      // Refresh the full list to get updated statistics
      await loadItems(companyId, filters)
      
      return result.data
      
    } catch (error) {
      console.error('Error extracting knowledge:', {
        error,
        message: (error as Error).message,
        stack: (error as Error).stack,
        companyId,
        textLength: textDump.length
      })
      toast({
        title: 'Error extracting knowledge',
        description: (error as Error).message || 'An unexpected error occurred',
        variant: 'destructive'
      })
      throw error
    } finally {
      setIsExtracting(false)
    }
  }, [filters, loadItems])

  // Estimate extraction results
  const estimateExtraction = useCallback(async (text: string): Promise<{ estimatedItemCount: number; wordCount: number }> => {
    try {
      const response = await fetch(`/api/knowledge-base/extract?text=${encodeURIComponent(text)}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to estimate extraction')
      }

      return {
        estimatedItemCount: result.data.estimatedItemCount,
        wordCount: result.data.wordCount
      }
      
    } catch (error) {
      console.error('Error estimating extraction:', error)
      // Return fallback estimate
      const wordCount = text.trim().split(' ').length
      return {
        estimatedItemCount: Math.max(1, Math.floor(wordCount / 30)),
        wordCount
      }
    }
  }, [])

  return {
    // Data
    items,
    statistics,
    isLoading,
    isExtracting,
    
    // Operations
    loadItems,
    createItem,
    updateItem,
    deleteItem,
    extractFromText,
    estimateExtraction,
    
    // Filters
    filters,
    setFilters
  }
} 
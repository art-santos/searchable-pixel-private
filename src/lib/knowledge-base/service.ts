// Knowledge Base Service Layer
import { createClient } from '@/lib/supabase/client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { KnowledgeItem, KnowledgeFilters, GroupedKnowledge, CompletenessScore, ExtractionResult, ExtractedKnowledge, AVAILABLE_TAGS, TAG_METADATA } from './types'
import { KnowledgeExtractionEngine } from './extraction-engine'

export class KnowledgeBaseService {
  private supabase: ReturnType<typeof createClient>
  private extractionEngine: KnowledgeExtractionEngine

  constructor(useServiceRole = false) {
    this.supabase = useServiceRole ? createServiceRoleClient() : createClient()
    this.extractionEngine = new KnowledgeExtractionEngine()
  }

  /**
   * Extract knowledge from text dump and save to database
   */
  async extractAndSaveKnowledge(textDump: string, companyId: string): Promise<{
    extractedItems: KnowledgeItem[]
    extractionResult: ExtractionResult
  }> {
    try {
      // Extract knowledge using GPT-4o
      const extractionResult = await this.extractionEngine.extractFromTextDump(textDump)
      
      // Remove duplicates
      const deduplicatedItems = await this.removeDuplicates(extractionResult.extractedItems, companyId)
      
      // Save to database
      const savedItems = await this.batchCreateItems(deduplicatedItems, companyId, extractionResult.batchId)
      
      return {
        extractedItems: savedItems,
        extractionResult
      }
    } catch (error) {
      console.error('Extract and save failed:', error)
      throw new Error(`Failed to extract knowledge: ${(error as Error).message}`)
    }
  }

  /**
   * Create a single knowledge item (for manual entry)
   */
  async createItem(companyId: string, content: string, tag: string): Promise<KnowledgeItem> {
    const wordCount = content.trim().split(' ').length
    
    const { data, error } = await this.supabase
      .from('knowledge_base_items')
      .insert({
        company_id: companyId,
        content: content.trim(),
        tag,
        word_count: wordCount,
        created_by: (await this.supabase.auth.getUser()).data.user?.id
      })
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to create knowledge item: ${error.message}`)
    }

    return this.mapDatabaseItem(data)
  }

  /**
   * Create multiple knowledge items in batch
   */
  async batchCreateItems(
    extractedItems: ExtractedKnowledge[], 
    companyId: string, 
    batchId?: string
  ): Promise<KnowledgeItem[]> {
    const userId = (await this.supabase.auth.getUser()).data.user?.id
    
    const itemsToInsert = extractedItems.map(item => ({
      company_id: companyId,
      content: item.content,
      tag: item.tag,
      word_count: item.content.trim().split(' ').length,
      confidence_score: item.confidence,
      source_context: item.sourceContext,
      extraction_batch_id: batchId || null,
      created_by: userId
    }))

    const { data, error } = await this.supabase
      .from('knowledge_base_items')
      .insert(itemsToInsert)
      .select('*')

    if (error) {
      throw new Error(`Failed to batch create items: ${error.message}`)
    }

    return data.map(item => this.mapDatabaseItem(item))
  }

  /**
   * Get knowledge items with filtering
   */
  async getItems(companyId: string, filters?: KnowledgeFilters): Promise<KnowledgeItem[]> {
    let query = this.supabase
      .from('knowledge_base_items')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.tag && filters.tag !== 'all') {
      query = query.eq('tag', filters.tag)
    }

    if (filters?.search) {
      query = query.textSearch('content', filters.search)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get knowledge items: ${error.message}`)
    }

    return data.map(item => this.mapDatabaseItem(item))
  }

  /**
   * Update a knowledge item
   */
  async updateItem(id: string, content: string, tag: string): Promise<KnowledgeItem> {
    const wordCount = content.trim().split(' ').length
    
    const { data, error } = await this.supabase
      .from('knowledge_base_items')
      .update({
        content: content.trim(),
        tag,
        word_count: wordCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to update knowledge item: ${error.message}`)
    }

    return this.mapDatabaseItem(data)
  }

  /**
   * Delete a knowledge item
   */
  async deleteItem(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('knowledge_base_items')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete knowledge item: ${error.message}`)
    }
  }

  /**
   * Get knowledge grouped by tags
   */
  async getGroupedKnowledge(companyId: string): Promise<GroupedKnowledge> {
    const items = await this.getItems(companyId)
    
    const grouped: GroupedKnowledge = {
      'company-overview': [],
      'target-audience': [],
      'pain-points': [],
      'positioning': [],
      'product-features': [],
      'use-cases': [],
      'competitor-notes': [],
      'sales-objections': [],
      'brand-voice': [],
      'keywords': [],
      'other': []
    }

    for (const item of items) {
      if (item.tag in grouped) {
        grouped[item.tag as keyof GroupedKnowledge].push(item.content)
      }
    }

    return grouped
  }

  /**
   * Calculate knowledge base completeness score
   */
  async analyzeKnowledgeCompleteness(companyId: string): Promise<CompletenessScore> {
    const items = await this.getItems(companyId)
    const tagCounts: Record<string, number> = {}
    
    // Count items by tag
    for (const item of items) {
      tagCounts[item.tag] = (tagCounts[item.tag] || 0) + 1
    }

    // Calculate weighted score
    let totalScore = 0
    let totalWeight = 0
    const breakdown: CompletenessScore['breakdown'] = {}

    for (const tag of AVAILABLE_TAGS) {
      const count = tagCounts[tag] || 0
      const weight = TAG_METADATA[tag].weight
      const contribution = Math.min(1, count / 3) * weight // Max score reached at 3+ items per tag
      
      breakdown[tag] = {
        count,
        weight,
        contribution
      }
      
      totalScore += contribution
      totalWeight += weight
    }

    const score = totalWeight > 0 ? totalScore / totalWeight : 0

    // Generate suggestions
    const suggestions = this.generateCompletenessSuggestions(breakdown)

    return {
      score,
      breakdown,
      suggestions
    }
  }

  /**
   * Remove duplicate knowledge items
   */
  private async removeDuplicates(
    newItems: ExtractedKnowledge[], 
    companyId: string
  ): Promise<ExtractedKnowledge[]> {
    const existingItems = await this.getItems(companyId)
    
    return newItems.filter(newItem => {
      // Check for exact content match
      const hasExactMatch = existingItems.some(existing => 
        existing.content.toLowerCase().trim() === newItem.content.toLowerCase().trim()
      )
      
      if (hasExactMatch) return false
      
      // Check for semantic similarity (simplified)
      const hasSimilarMatch = existingItems.some(existing => {
        const similarity = this.calculateSimilarity(existing.content, newItem.content)
        return similarity > 0.8
      })
      
      return !hasSimilarMatch
    })
  }

  /**
   * Calculate text similarity (simplified)
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/))
    const words2 = new Set(text2.toLowerCase().split(/\s+/))
    
    const intersection = new Set([...words1].filter(x => words2.has(x)))
    const union = new Set([...words1, ...words2])
    
    return intersection.size / union.size
  }

  /**
   * Generate completeness suggestions
   */
  private generateCompletenessSuggestions(
    breakdown: CompletenessScore['breakdown']
  ): string[] {
    const suggestions: string[] = []
    
    // Find missing or weak categories
    for (const [tag, data] of Object.entries(breakdown)) {
      if (data.count === 0) {
        suggestions.push(`Add ${TAG_METADATA[tag as keyof typeof TAG_METADATA].label} information`)
      } else if (data.count === 1 && data.weight > 0.7) {
        suggestions.push(`Expand your ${TAG_METADATA[tag as keyof typeof TAG_METADATA].label} details`)
      }
    }
    
    return suggestions.slice(0, 5) // Limit to top 5 suggestions
  }

  /**
   * Map database item to our interface
   */
  private mapDatabaseItem(dbItem: any): KnowledgeItem {
    return {
      id: dbItem.id,
      content: dbItem.content,
      tag: dbItem.tag,
      createdAt: dbItem.created_at,
      wordCount: dbItem.word_count,
      confidenceScore: dbItem.confidence_score,
      sourceContext: dbItem.source_context,
      extractionBatchId: dbItem.extraction_batch_id
    }
  }

  /**
   * Get knowledge base statistics
   */
  async getStatistics(companyId: string): Promise<{
    totalItems: number
    totalWords: number
    completenessScore: number
    tagDistribution: Record<string, number>
  }> {
    const items = await this.getItems(companyId)
    const completeness = await this.analyzeKnowledgeCompleteness(companyId)
    
    const tagDistribution: Record<string, number> = {}
    let totalWords = 0
    
    for (const item of items) {
      tagDistribution[item.tag] = (tagDistribution[item.tag] || 0) + 1
      totalWords += item.wordCount
    }
    
    return {
      totalItems: items.length,
      totalWords,
      completenessScore: completeness.score,
      tagDistribution
    }
  }
} 
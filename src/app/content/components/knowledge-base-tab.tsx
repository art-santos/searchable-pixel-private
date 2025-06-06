'use client'

import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronRight, Database, Upload, FileText, Globe, Sparkles } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { useKnowledgeBase } from '@/hooks/useKnowledgeBase'
import { KnowledgeTable } from '@/components/knowledge-base/knowledge-table'
import { useWorkspace } from '@/contexts/WorkspaceContext'

const availableTags = [
  { value: 'company-overview', label: 'Company Overview' },
  { value: 'target-audience', label: 'Target Audience' },
  { value: 'pain-points', label: 'Pain Points' },
  { value: 'positioning', label: 'Positioning' },
  { value: 'product-features', label: 'Product Features' },
  { value: 'use-cases', label: 'Use Cases' },
  { value: 'competitor-notes', label: 'Competitor Notes' },
  { value: 'sales-objections', label: 'Sales Objections' },
  { value: 'brand-voice', label: 'Brand Voice' },
  { value: 'keywords', label: 'Keywords' },
  { value: 'other', label: 'Other' }
]

export function KnowledgeBaseTab() {
  const { currentWorkspace, switching } = useWorkspace()
  const shouldReduceMotion = useReducedMotion()
  const knowledgeBase = useKnowledgeBase()
  const [newKnowledgeContent, setNewKnowledgeContent] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25

  // Load knowledge items when component mounts or workspace changes
  useEffect(() => {
    if (currentWorkspace?.id) {
      knowledgeBase.loadItems(currentWorkspace.id, { 
        tag: undefined,
        search: undefined
      })
    }
  }, [currentWorkspace?.id])

  // Pagination logic
  const totalPages = Math.ceil(knowledgeBase.items.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = knowledgeBase.items.slice(startIndex, endIndex)

  // Reset to page 1 when items change
  useEffect(() => {
    setCurrentPage(1)
  }, [knowledgeBase.items.length])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const autoDetectTag = (content: string): string => {
    const lowerContent = content.toLowerCase()
    
    // Enhanced tag detection logic
    const tagPatterns = {
      'company-overview': ['company', 'business', 'overview', 'about', 'what we do'],
      'target-audience': ['customer', 'client', 'user', 'audience', 'demographic'],
      'pain-points': ['problem', 'challenge', 'issue', 'pain', 'struggle'],
      'positioning': ['unique', 'different', 'competitive', 'advantage', 'unlike'],
      'product-features': ['feature', 'capability', 'function', 'tool', 'platform'],
      'use-cases': ['use case', 'scenario', 'application', 'example', 'implementation'],
      'competitor-notes': ['competitor', 'vs', 'compared to', 'alternative', 'versus'],
      'sales-objections': ['objection', 'concern', 'worry', 'response', 'address'],
      'brand-voice': ['tone', 'voice', 'messaging', 'communication', 'style'],
      'keywords': ['keyword', 'term', 'phrase', 'seo', 'search']
    }

    for (const [tag, patterns] of Object.entries(tagPatterns)) {
      if (patterns.some(pattern => lowerContent.includes(pattern))) {
        return tag
      }
    }
    
    return 'other'
  }

  const handleAddKnowledgeItem = async () => {
    if (!newKnowledgeContent.trim()) {
      toast({
        title: 'No content provided',
        description: 'Please enter some content to add to your knowledge base',
        variant: 'destructive'
      })
      return
    }
    
    if (!currentWorkspace?.id) {
      toast({
        title: 'No workspace selected',
        description: 'Please select a workspace to add knowledge items.',
        variant: 'destructive'
      })
      return
    }

    try {
      // Use AI-powered extraction instead of manual categorization
      await knowledgeBase.extractFromText(currentWorkspace.id, newKnowledgeContent)
      setNewKnowledgeContent('')
      
      toast({
        title: 'Content processed successfully',
        description: 'AI has extracted and categorized your content into the knowledge base'
      })
    } catch (error) {
      console.error('Error processing content:', error)
      toast({
        title: 'Failed to process content',
        description: 'There was an error processing your content with AI',
        variant: 'destructive'
      })
    }
  }

  const handleCopyKnowledgeItem = (content: string) => {
    navigator.clipboard.writeText(content)
    toast({
      title: 'Copied to clipboard',
      description: 'Knowledge item content copied'
    })
  }

  const handleUpdateKnowledgeItem = async (id: string, updates: Partial<any>) => {
    try {
      // Find the current item to get existing values
      const currentItem = knowledgeBase.items.find(item => item.id === id)
      if (!currentItem) {
        throw new Error('Item not found')
      }

      // Merge updates with existing data
      const content = updates.content !== undefined ? updates.content : currentItem.content
      const tag = updates.tag !== undefined ? updates.tag : currentItem.tag

      await knowledgeBase.updateItem(id, content, tag)
      toast({
        title: 'Updated successfully',
        description: 'Knowledge item has been updated'
      })
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'There was an error updating the item',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteKnowledgeItem = async (id: string) => {
    try {
      await knowledgeBase.deleteItem(id)
      toast({
        title: 'Deleted successfully',
        description: 'Knowledge item has been deleted'
      })
    } catch (error) {
      toast({
        title: 'Delete failed', 
        description: 'There was an error deleting the item',
        variant: 'destructive'
      })
    }
  }

  // Show workspace switching loading state
  if (switching) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-3">
            <div 
              className="w-full h-full workspace-flip-animation"
              style={{ 
                transformStyle: 'preserve-3d',
                perspective: '200px'
              }}
            >
              <img 
                src="/images/split-icon-white.svg" 
                alt="Split" 
                className="w-full h-full"
              />
            </div>
          </div>
          <p className="text-[#666] text-sm">Loading workspace knowledge base...</p>
        </div>
      </div>
    )
  }

  // Show loading state when no workspace is selected
  if (!currentWorkspace) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-[#666] text-sm">No workspace selected</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Knowledge Base Header - Ultra Simple */}
      <div className="px-6 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white">Knowledge Base</span>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#444]" />
            <span className="text-xs text-[#666]">
              {Math.round((knowledgeBase.statistics?.completenessScore || 0) * 100)}% complete
            </span>
          </div>
        </div>
      </div>

      {/* Knowledge Input Area */}
      <div className="px-6 pb-6 flex-shrink-0">
        <div className="space-y-3">
          <div className="relative">
            <textarea
              placeholder="Paste any company content here - marketing docs, sales materials, product descriptions, competitor notes, anything relevant. AI will intelligently extract and categorize knowledge items..."
              value={newKnowledgeContent}
              onChange={(e) => setNewKnowledgeContent(e.target.value)}
              disabled={knowledgeBase.isExtracting}
              className="w-full bg-[#0a0a0a] border border-[#1a1a1a] hover:border-[#2a2a2a] focus:border-[#3a3a3a] text-white p-4 rounded-md text-sm transition-all duration-200 resize-none leading-relaxed min-h-[120px] disabled:opacity-50 pr-16"
              rows={6}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && newKnowledgeContent.trim()) {
                  e.preventDefault()
                  handleAddKnowledgeItem()
                }
              }}
            />
            
            <button
              onClick={handleAddKnowledgeItem}
              disabled={!newKnowledgeContent.trim() || knowledgeBase.isExtracting}
              className={`absolute bottom-4 right-4 w-8 h-8 rounded-md flex items-center justify-center transition-all duration-200 border ${
                newKnowledgeContent.trim() && !knowledgeBase.isExtracting
                  ? 'bg-[#1a1a1a] border-[#333] text-white hover:bg-[#2a2a2a] hover:border-[#444] active:bg-[#333]' 
                  : 'bg-[#0a0a0a] border-[#1a1a1a] text-[#444] cursor-not-allowed'
              }`}
              title={knowledgeBase.isExtracting ? 'AI is processing...' : 'Process with AI'}
            >
              {knowledgeBase.isExtracting ? (
                <div className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
            </button>
          </div>
          
          <p className="text-xs text-[#666] leading-relaxed">
            AI will analyze your content and extract structured knowledge items. Press Enter to process.
          </p>
        </div>
      </div>

      {/* Knowledge Table */}
      <div className="px-6 pb-6 relative">
        {/* Processing Overlay */}
        {knowledgeBase.isExtracting && (
          <div className="absolute inset-0 bg-[#0c0c0c]/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="w-5 h-5 border border-[#333] border-t-white rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-sm font-medium">
                Processing content...
              </p>
            </div>
          </div>
        )}

        <KnowledgeTable
          items={currentItems}
          availableTags={availableTags}
          onUpdateItem={handleUpdateKnowledgeItem}
          onDeleteItem={handleDeleteKnowledgeItem}
          onCopyItem={handleCopyKnowledgeItem}
          isLoading={knowledgeBase.isLoading}
        />

        {/* Empty State with Processing Animation */}
        {knowledgeBase.items.length === 0 && !knowledgeBase.isLoading && !knowledgeBase.isExtracting && (
          <div className="text-center py-16">
            <div className="mb-6">
              <div className="w-24 h-24 border-2 border-dashed border-[#333] rounded-lg mx-auto flex items-center justify-center">
                <svg className="w-8 h-8 text-[#666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <h3 className="text-white text-lg font-medium mb-2">No knowledge items yet</h3>
            <p className="text-[#666] text-sm mb-6 max-w-md mx-auto">
              Paste any content above and AI will intelligently extract and categorize knowledge items for you.
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8 mb-4">
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    currentPage === page
                      ? 'bg-white text-black'
                      : 'text-[#666] hover:text-white'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Items count */}
        {knowledgeBase.items.length > 0 && (
          <div className="text-center mb-6">
            <span className="text-xs text-[#666]">
              Showing {startIndex + 1}-{Math.min(endIndex, knowledgeBase.items.length)} of {knowledgeBase.items.length} items
            </span>
          </div>
        )}
      </div>
    </div>
  )
} 
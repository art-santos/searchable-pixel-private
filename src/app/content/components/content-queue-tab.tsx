'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Calendar, Sparkles, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { mockQueuedArticles, type QueuedArticle } from '../data/mock-articles'

interface ContentQueueTabProps {
  onSwitchToKnowledge: () => void
}

export function ContentQueueTab({ onSwitchToKnowledge }: ContentQueueTabProps) {
  const { currentWorkspace, switching } = useWorkspace()
  const shouldReduceMotion = useReducedMotion()

  const handleGenerateSuggestions = () => {
    console.log('Generating suggestions...')
    // TODO: Implement suggestion generation
  }

  // Show workspace switching loading state
  if (switching) {
    return (
      <div className="flex-1 flex items-center justify-center">
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
          <p className="text-[#666] text-sm">Loading workspace queue...</p>
        </div>
      </div>
    )
  }

  // Show loading state when no workspace is selected
  if (!currentWorkspace) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#666] text-sm">No workspace selected</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-2xl flex items-center justify-center border border-[#333]">
            <Calendar className="w-12 h-12 text-[#666]" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">
            Content queue is empty
          </h3>
          <p className="text-[#888] text-lg leading-relaxed mb-6">
            AI-generated content suggestions will appear here based on your knowledge base and market analysis.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={onSwitchToKnowledge}
              className="bg-white text-black hover:bg-[#f5f5f5] px-6 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-105"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Add Company Knowledge
            </Button>
            <Button
              variant="outline"
              onClick={handleGenerateSuggestions}
              className="border-[#333] text-[#999] hover:text-white hover:bg-[#1a1a1a] px-6 py-2.5 text-sm transition-all duration-200"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate Suggestions
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 
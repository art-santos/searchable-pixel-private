'use client'

import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { FileText, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { mockCompletedArticles, type Article } from '../data/mock-articles'

interface CompletedArticlesTabProps {
  searchQuery: string
  onSwitchToKnowledge: () => void
}

export function CompletedArticlesTab({ 
  searchQuery, 
  onSwitchToKnowledge 
}: CompletedArticlesTabProps) {
  const router = useRouter()
  const { currentWorkspace, switching } = useWorkspace()
  const shouldReduceMotion = useReducedMotion()
  const [currentPage, setCurrentPage] = useState(1)
  const articlesPerPage = 9

  const cardVariants = shouldReduceMotion ? {
    hidden: { opacity: 1, y: 0 },
    visible: { opacity: 1, y: 0 }
  } : {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  }

  // Filter articles
  const filteredArticles = mockCompletedArticles.filter(article => 
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.primaryKeyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.metaDescription.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Pagination logic
  const totalPages = Math.ceil(filteredArticles.length / articlesPerPage)
  const startIndex = (currentPage - 1) * articlesPerPage
  const endIndex = startIndex + articlesPerPage
  const currentArticles = filteredArticles.slice(startIndex, endIndex)

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const handleViewArticle = (articleId: number) => {
    router.push(`/content/article/${articleId}`)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
          <p className="text-[#666] text-sm">Loading workspace articles...</p>
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

  if (currentArticles.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-2xl flex items-center justify-center border border-[#333]">
              <FileText className="w-12 h-12 text-[#666]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              No articles yet
            </h3>
            <p className="text-[#888] text-lg leading-relaxed mb-6">
              Your completed articles will appear here. Start by building your knowledge base to generate intelligent content suggestions.
            </p>
            <Button
              onClick={onSwitchToKnowledge}
              className="bg-white text-black hover:bg-[#f5f5f5] px-6 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-105"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Build Knowledge Base
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="grid grid-cols-3 gap-6 w-full">
          {currentArticles.map((article, index) => (
            <motion.div
              key={article.id}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.05 }}
              className="bg-[#0a0a0a] rounded-lg p-5 border border-[#1a1a1a] hover:border-[#2a2a2a] transition-all duration-300 hover:shadow-lg hover:shadow-black/20 cursor-pointer"
              onClick={() => handleViewArticle(article.id)}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="text-white font-medium text-sm leading-5 line-clamp-2">
                    {article.title}
                  </h3>
                  <div className="text-xs text-[#666] ml-2 flex-shrink-0">
                    {article.readTime}
                  </div>
                </div>
                <p className="text-[#888] text-xs leading-4 line-clamp-3">
                  {article.contentPreview}
                </p>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs px-2 py-1 bg-[#1a1a1a] text-[#999] rounded">
                    {article.category}
                  </span>
                  <span className="text-xs text-[#666]">
                    {article.views} views
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
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
      </div>
    </div>
  )
} 
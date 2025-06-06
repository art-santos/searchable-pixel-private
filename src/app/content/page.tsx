'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useCompany } from '@/hooks/useCompany'
import { CompletedArticlesTab } from './components/completed-articles-tab'
import { ContentQueueTab } from './components/content-queue-tab'
import { KnowledgeBaseTab } from './components/knowledge-base-tab'

const tabs = [
  { id: 'completed', label: 'Completed Articles' },
  { id: 'queue', label: 'Content Queue' },
  { id: 'knowledge', label: 'Knowledge Base' }
]

export default function ContentPage() {
  const { loading } = useAuth()
  const { switching } = useWorkspace()
  const { isLoading: companyLoading } = useCompany()
  const shouldReduceMotion = useReducedMotion()
  const [activeTab, setActiveTab] = useState('completed')
  const [searchQuery, setSearchQuery] = useState('')

  const containerVariants = shouldReduceMotion ? {
    hidden: { opacity: 1 },
    visible: { opacity: 1 }
  } : {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = shouldReduceMotion ? {
    hidden: { opacity: 1, y: 0 },
    visible: { opacity: 1, y: 0 }
  } : {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  }

  const handleSwitchToKnowledge = () => {
    setActiveTab('knowledge')
  }

  // Show loading spinner while auth or company is loading
  if (loading || companyLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0c0c0c]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-white mx-auto mb-4" />
          <p className="text-sm text-[#666]">
            {loading ? 'Loading user...' : 'Setting up company...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <motion.main 
        className="bg-[#0c0c0c] flex flex-col min-h-screen"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
      {/* Streamlined Header */}
      <motion.div variants={itemVariants} className="px-6 pt-6 pb-4 flex-shrink-0">
        {/* Tab Navigation - Visibility Page Style */}
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                  px-4 py-2 rounded-md text-sm font-medium tracking-tight transition-colors border
                    ${activeTab === tab.id 
                      ? 'bg-[#222] text-white border-[#444]' 
                      : 'text-[#666] hover:text-white hover:bg-[#1a1a1a] border-[#333]'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
                <motion.div
            key={activeTab}
            variants={itemVariants}
                initial="hidden"
                animate="visible"
            exit="hidden"
            className="flex flex-col"
          >
            {activeTab === 'completed' && (
              <CompletedArticlesTab 
                searchQuery={searchQuery}
                onSwitchToKnowledge={handleSwitchToKnowledge}
              />
          )}

        {activeTab === 'queue' && (
              <ContentQueueTab 
                onSwitchToKnowledge={handleSwitchToKnowledge}
              />
        )}

        {activeTab === 'knowledge' && (
              <KnowledgeBaseTab />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      </motion.main>

      {/* Workspace Switching Overlay */}
      {switching && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          style={{ pointerEvents: 'all' }}
        >
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4" style={{ perspective: '300px' }}>
              <div 
                className="w-full h-full workspace-flip-animation"
                style={{ 
                  transformStyle: 'preserve-3d'
                }}
              >
                <img 
                  src="/images/split-icon-white.svg" 
                  alt="Split" 
                  className="w-full h-full"
                />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Switching workspace...</h2>
            <p className="text-[#888] text-sm">Loading your workspace data</p>
          </div>
        </motion.div>
      )}

      <style jsx global>{`
        @keyframes workspaceFlip {
          0% { transform: rotateY(0deg); }
          25% { transform: rotateY(90deg); }
          50% { transform: rotateY(180deg); }
          75% { transform: rotateY(270deg); }
          100% { transform: rotateY(360deg); }
        }
        
        .workspace-flip-animation {
          animation: workspaceFlip 2s cubic-bezier(0.4, 0.0, 0.2, 1) infinite;
        }
      `}</style>
    </>
  )
} 
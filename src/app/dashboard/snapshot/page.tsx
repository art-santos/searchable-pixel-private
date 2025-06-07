'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { motion, useReducedMotion } from 'framer-motion'
import { Camera, Download, Calendar, BarChart3 } from 'lucide-react'

export default function SnapshotPage() {
  const { user, loading } = useAuth()
  const { switching } = useWorkspace()
  const shouldReduceMotion = useReducedMotion()

  const containerVariants = shouldReduceMotion ? {
    hidden: { opacity: 1 },
    visible: { opacity: 1 }
  } : {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  }

  const cardVariants = shouldReduceMotion ? {
    hidden: { opacity: 1, y: 0 },
    visible: { opacity: 1, y: 0 }
  } : {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0c0c0c]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-white" />
      </div>
    )
  }

  return (
    <motion.main 
      className="min-h-screen bg-[#0c0c0c] pl-6 pr-4 md:pr-6 lg:pr-8 pb-8 md:pb-12"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="mx-auto max-w-[1600px] flex flex-col gap-4 md:gap-6 lg:gap-8">
        {/* Header */}
        <motion.div 
          variants={cardVariants}
          className="flex flex-col gap-4 pt-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-[#161616] border border-[#222222] rounded-lg">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Snapshot</h1>
              <p className="text-[#888] text-sm">Capture and analyze your content performance</p>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          variants={cardVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="bg-[#161616] border border-[#222222] rounded-lg p-6 hover:border-[#333333] transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-500/20 rounded-lg">
                <Camera className="w-4 h-4 text-blue-400" />
              </div>
              <h3 className="text-white font-medium">Take Snapshot</h3>
            </div>
            <p className="text-[#888] text-sm">Capture current state of your content</p>
          </div>

          <div className="bg-[#161616] border border-[#222222] rounded-lg p-6 hover:border-[#333333] transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-green-500/20 rounded-lg">
                <BarChart3 className="w-4 h-4 text-green-400" />
              </div>
              <h3 className="text-white font-medium">Compare Snapshots</h3>
            </div>
            <p className="text-[#888] text-sm">Analyze changes over time</p>
          </div>

          <div className="bg-[#161616] border border-[#222222] rounded-lg p-6 hover:border-[#333333] transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-500/20 rounded-lg">
                <Download className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="text-white font-medium">Export Data</h3>
            </div>
            <p className="text-[#888] text-sm">Download snapshot reports</p>
          </div>
        </motion.div>

        {/* Recent Snapshots */}
        <motion.div 
          variants={cardVariants}
          className="bg-[#161616] border border-[#222222] rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Recent Snapshots</h2>
            <button className="text-[#888] hover:text-white text-sm transition-colors">
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Empty state */}
            <div className="text-center py-12">
              <div className="flex items-center justify-center w-16 h-16 bg-[#222222] rounded-lg mx-auto mb-4">
                <Camera className="w-8 h-8 text-[#666]" />
              </div>
              <h3 className="text-white font-medium mb-2">No snapshots yet</h3>
              <p className="text-[#888] text-sm mb-6">Create your first snapshot to start tracking your content performance</p>
              <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
                Create Snapshot
              </button>
            </div>
          </div>
        </motion.div>
      </div>

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
    </motion.main>
  )
} 
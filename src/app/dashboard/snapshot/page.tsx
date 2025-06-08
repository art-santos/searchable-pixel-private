'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { motion, useReducedMotion } from 'framer-motion'
import { Camera, Download, Calendar, BarChart3, Plus, ExternalLink, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { 
  createSnapshotRequest, 
  getSnapshotStatus, 
  getSnapshotResults, 
  getUserSnapshots, 
  checkUserRateLimit,
  pollSnapshotStatus,
  type SnapshotRequest,
  type SnapshotSummary,
  type VisibilityResult
} from '@/lib/snapshot-client'

export default function SnapshotPage() {
  const { user, loading } = useAuth()
  const { switching } = useWorkspace()
  const shouldReduceMotion = useReducedMotion()

  // State for snapshot creation
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [urls, setUrls] = useState([''])
  const [topic, setTopic] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // State for snapshot tracking
  const [activeSnapshot, setActiveSnapshot] = useState<SnapshotRequest | null>(null)
  const [snapshotResults, setSnapshotResults] = useState<{
    summaries: SnapshotSummary[];
    results: VisibilityResult[];
  } | null>(null)

  // State for user snapshots
  const [userSnapshots, setUserSnapshots] = useState<SnapshotRequest[]>([])
  const [rateLimit, setRateLimit] = useState<{
    allowed: boolean;
    requestsToday: number;
    limit: number;
  } | null>(null)

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

  // Load user snapshots and rate limit on mount
  useEffect(() => {
    if (user?.id) {
      loadUserData()
    }
  }, [user?.id])

  // Poll active snapshot status
  useEffect(() => {
    if (activeSnapshot && ['pending', 'processing'].includes(activeSnapshot.status)) {
      const cleanup = pollSnapshotStatus(activeSnapshot.id, async (updatedRequest) => {
        setActiveSnapshot(updatedRequest)
        
        if (updatedRequest.status === 'completed') {
          // Load results when completed
          const { success, summaries, results } = await getSnapshotResults(updatedRequest.id)
          if (success) {
            setSnapshotResults({ summaries: summaries || [], results: results || [] })
          }
          // Refresh user snapshots list
          loadUserData()
        }
      })
      
      return cleanup
    }
  }, [activeSnapshot])

  const loadUserData = async () => {
    if (!user?.id) return
    
    // Load recent snapshots
    const { success: snapshotsSuccess, requests } = await getUserSnapshots(user.id, 5)
    if (snapshotsSuccess) {
      setUserSnapshots(requests || [])
    }
    
    // Check rate limit
    const { success: rateLimitSuccess, allowed, requestsToday, limit } = await checkUserRateLimit(user.id)
    if (rateLimitSuccess) {
      setRateLimit({ allowed: allowed || false, requestsToday: requestsToday || 0, limit: limit || 5 })
    }
  }

  const handleCreateSnapshot = async () => {
    if (!user?.id || !topic.trim() || urls.filter(url => url.trim()).length === 0) {
      setCreateError('Please provide a topic and at least one URL')
      return
    }

    setIsCreating(true)
    setCreateError(null)

    try {
      const validUrls = urls.filter(url => url.trim()).map(url => url.trim())
      const { success, requestId, error } = await createSnapshotRequest(validUrls, topic.trim(), user.id)
      
      if (success && requestId) {
        // Reset form
        setUrls([''])
        setTopic('')
        setShowCreateForm(false)
        setSnapshotResults(null)
        
        // Set as active snapshot for tracking
        setActiveSnapshot({
          id: requestId,
          urls: validUrls,
          topic: topic.trim(),
          status: 'pending',
          created_at: new Date().toISOString()
        })
        
        // Refresh rate limit
        await loadUserData()
      } else {
        setCreateError(error || 'Failed to create snapshot')
      }
    } catch (error: any) {
      setCreateError(error.message || 'An unexpected error occurred')
    } finally {
      setIsCreating(false)
    }
  }

  const addUrlInput = () => {
    setUrls([...urls, ''])
  }

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls]
    newUrls[index] = value
    setUrls(newUrls)
  }

  const removeUrl = (index: number) => {
    if (urls.length > 1) {
      setUrls(urls.filter((_, i) => i !== index))
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />
      case 'processing':
        return <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-400'
      case 'processing':
        return 'text-blue-400'
      case 'completed':
        return 'text-green-400'
      case 'failed':
        return 'text-red-400'
      default:
        return 'text-gray-400'
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

        {/* Rate Limit Status */}
        {rateLimit && (
          <motion.div variants={cardVariants} className="bg-[#161616] border border-[#222222] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-500/20 rounded-lg">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Daily Usage</h3>
                  <p className="text-[#888] text-sm">{rateLimit.requestsToday} of {rateLimit.limit} snapshots used today</p>
                </div>
              </div>
              {!rateLimit.allowed && (
                <div className="text-red-400 text-sm font-medium">Limit reached</div>
              )}
            </div>
          </motion.div>
        )}

        {/* Active Snapshot Status */}
        {activeSnapshot && (
          <motion.div variants={cardVariants} className="bg-[#161616] border border-[#222222] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">Current Snapshot</h3>
              <div className="flex items-center gap-2">
                {getStatusIcon(activeSnapshot.status)}
                <span className={`text-sm capitalize ${getStatusColor(activeSnapshot.status)}`}>
                  {activeSnapshot.status}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[#888] text-sm"><span className="text-white">Topic:</span> {activeSnapshot.topic}</p>
              <p className="text-[#888] text-sm"><span className="text-white">URLs:</span> {activeSnapshot.urls.length} URL(s)</p>
              <div className="flex flex-wrap gap-2">
                {activeSnapshot.urls.map((url, index) => (
                  <div key={index} className="bg-[#222] rounded px-2 py-1 text-xs text-[#888]">
                    {new URL(url).hostname}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Create Snapshot Section */}
        {!showCreateForm ? (
          <motion.div variants={cardVariants}>
            <button
              onClick={() => setShowCreateForm(true)}
              disabled={!rateLimit?.allowed}
              className="w-full bg-[#161616] border border-[#222222] rounded-lg p-6 hover:border-[#333333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-500/20 rounded-lg">
                  <Plus className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="text-white font-medium">Create New Snapshot</h3>
              </div>
              <p className="text-[#888] text-sm text-left">Test how your URLs appear in AI search results</p>
            </button>
          </motion.div>
        ) : (
          <motion.div variants={cardVariants} className="bg-[#161616] border border-[#222222] rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-medium">Create Snapshot</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-[#888] hover:text-white text-sm"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-4">
              {/* Topic Input */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Topic or Industry
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., startup banking, project management tools"
                  className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white placeholder-[#666] focus:border-blue-400 focus:outline-none"
                />
              </div>

              {/* URLs Input */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  URLs to Test
                </label>
                <div className="space-y-2">
                  {urls.map((url, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => updateUrl(index, e.target.value)}
                        placeholder="https://example.com"
                        className="flex-1 bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white placeholder-[#666] focus:border-blue-400 focus:outline-none"
                      />
                      {urls.length > 1 && (
                        <button
                          onClick={() => removeUrl(index)}
                          className="px-3 py-2 text-red-400 hover:text-red-300"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addUrlInput}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    + Add another URL
                  </button>
                </div>
              </div>

              {createError && (
                <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg p-3">
                  {createError}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateSnapshot}
                  disabled={isCreating || !rateLimit?.allowed}
                  className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating...' : 'Create Snapshot'}
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="border border-[#333] text-white px-4 py-2 rounded-lg text-sm hover:border-[#444] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Snapshot Results */}
        {snapshotResults && (
          <motion.div variants={cardVariants} className="bg-[#161616] border border-[#222222] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Snapshot Results</h2>
            
            <div className="space-y-6">
              {snapshotResults.summaries.map((summary) => (
                <div key={summary.id} className="border border-[#333] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <ExternalLink className="w-5 h-5 text-[#888]" />
                      <div>
                        <h3 className="text-white font-medium">{new URL(summary.url).hostname}</h3>
                        <p className="text-[#888] text-sm">{summary.url}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{summary.visibility_score}%</div>
                      <div className="text-[#888] text-sm">Visibility Score</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-[#222] rounded-lg p-3">
                      <div className="text-white font-medium text-sm mb-1">Mentions Found</div>
                      <div className="text-lg">{summary.mentions_count} of {summary.total_questions}</div>
                    </div>
                    
                    <div className="bg-[#222] rounded-lg p-3">
                      <div className="text-white font-medium text-sm mb-1">Top Competitors</div>
                      <div className="text-sm text-[#888]">
                        {summary.top_competitors.length > 0 ? summary.top_competitors.slice(0, 3).join(', ') : 'None identified'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-white font-medium text-sm">Insights:</div>
                    {summary.insights.map((insight, index) => (
                      <div key={index} className="text-[#888] text-sm bg-[#222] rounded p-2">
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent Snapshots */}
        <motion.div 
          variants={cardVariants}
          className="bg-[#161616] border border-[#222222] rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Recent Snapshots</h2>
          </div>
          
          <div className="space-y-4">
            {userSnapshots.length > 0 ? (
              userSnapshots.map((snapshot) => (
                <div key={snapshot.id} className="border border-[#333] rounded-lg p-4 hover:border-[#444] transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium">{snapshot.topic}</h3>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(snapshot.status)}
                      <span className={`text-sm capitalize ${getStatusColor(snapshot.status)}`}>
                        {snapshot.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-[#888] text-sm">
                    <span>{snapshot.urls.length} URL(s)</span>
                    <span>{new Date(snapshot.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {snapshot.urls.slice(0, 3).map((url, index) => (
                      <div key={index} className="bg-[#222] rounded px-2 py-1 text-xs text-[#888]">
                        {new URL(url).hostname}
                      </div>
                    ))}
                    {snapshot.urls.length > 3 && (
                      <div className="bg-[#222] rounded px-2 py-1 text-xs text-[#888]">
                        +{snapshot.urls.length - 3} more
                      </div>
                    )}
                  </div>
                  
                  {snapshot.status === 'completed' && (
                    <button
                      onClick={async () => {
                        const { success, summaries, results } = await getSnapshotResults(snapshot.id)
                        if (success) {
                          setSnapshotResults({ summaries: summaries || [], results: results || [] })
                        }
                      }}
                      className="mt-3 text-blue-400 hover:text-blue-300 text-sm"
                    >
                      View Results
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="flex items-center justify-center w-16 h-16 bg-[#222222] rounded-lg mx-auto mb-4">
                  <Camera className="w-8 h-8 text-[#666]" />
                </div>
                <h3 className="text-white font-medium mb-2">No snapshots yet</h3>
                <p className="text-[#888] text-sm mb-6">Create your first snapshot to start tracking your content performance</p>
                <button 
                  onClick={() => setShowCreateForm(true)}
                  disabled={!rateLimit?.allowed}
                  className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  Create Snapshot
                </button>
              </div>
            )}
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
'use client'

import { ArrowRight, Clock, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { 
  getUserSnapshots,
  checkUserRateLimit,
  type SnapshotRequest
} from '@/lib/snapshot-client'
import { getEnhancedSnapshots, getCombinedScore, type EnhancedSnapshotResult } from '@/lib/api/enhanced-snapshots'
import { SnapshotPageSkeleton, SnapshotHistorySkeleton } from '@/components/skeletons'

export default function SnapshotPage() {
  const { user, loading } = useAuth()
  
  // Form state
  const [url, setUrl] = useState('')
  const [topic, setTopic] = useState('')
  const [selectedModel, setSelectedModel] = useState('Perplexity')
  const [showDropdown, setShowDropdown] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // LLM Models
  const models = [
    { 
      name: 'Perplexity', 
      logo: '/images/perplexity.svg', 
      available: true 
    },
    { 
      name: 'ChatGPT', 
      logo: '/images/chatgpt.svg', 
      available: false 
    },
    { 
      name: 'Claude', 
      logo: '/images/claude.svg', 
      available: false 
    },
    { 
      name: 'Gemini', 
      logo: '/images/gemini.svg', 
      available: false 
    }
  ]
  
  // History state
  const [showHistory, setShowHistory] = useState(false)
  const [recentSnapshots, setRecentSnapshots] = useState<EnhancedSnapshotResult[]>([])
  
  // Rate limiting
  const [rateLimit, setRateLimit] = useState<{
    allowed: boolean
    requestsToday: number
    limit: number
  } | null>(null)

  // Load user data on mount
  useEffect(() => {
    if (user?.id) {
      loadUserData()
    }
  }, [user?.id])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowDropdown(false)
    }

    if (showDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showDropdown])

  const loadUserData = async () => {
    if (!user?.id) return
    
    // Load all enhanced snapshots with scores
    try {
      const enhancedSnapshots = await getEnhancedSnapshots(user.id)
      setRecentSnapshots(enhancedSnapshots) // Show all snapshots
    } catch (error) {
      console.error('Failed to load enhanced snapshots:', error)
      setRecentSnapshots([])
    }
    
    // Check rate limit
    const { success: rateLimitSuccess, allowed, requestsToday, limit } = await checkUserRateLimit(user.id)
    if (rateLimitSuccess) {
      setRateLimit({ allowed: allowed || false, requestsToday: requestsToday || 0, limit: limit || 5 })
    }
  }

  const handleSubmit = async () => {
    if (!user?.id) {
      setError('Please sign in to create snapshots')
      return
    }

    if (!url.trim()) {
      setError('Please enter a URL')
      return
    }

    if (!topic.trim()) {
      setError('Please enter a topic to test against')
      return
    }

    if (!rateLimit?.allowed) {
      setError('Daily snapshot limit reached. Please try again tomorrow.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Immediately redirect to a processing page while the API call happens
      const response = await fetch('/api/snapshots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          urls: [url.trim()], // The API will normalize this
          topic: topic.trim(),
          userId: user.id
        }),
      })
      
      const data = await response.json()
      
      if (response.ok && data.success && data.requestId) {
        // Immediately redirect - don't wait for processing to complete
        window.location.href = `/dashboard/snapshot/${data.requestId}`
        return
      } else {
        setError(data.error || 'Failed to create snapshot')
        setIsSubmitting(false)
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred')
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Helper functions for safe URL handling
  const safeParseUrl = (url: string): URL | null => {
    try {
      // If URL doesn't have protocol, assume https
      if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }
      return new URL(url);
    } catch {
      return null;
    }
  };

  const getSafeHostname = (url: string): string => {
    const parsed = safeParseUrl(url);
    return parsed ? parsed.hostname : url;
  };

  const getSafeFaviconUrl = (url: string, size: number = 128): string => {
    try {
      const hostname = getSafeHostname(url);
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=${size}`;
    } catch {
      return '/images/split-icon-black.svg';
    }
  };

  const getHostname = (url: string) => {
    return getSafeHostname(url);
  }

  if (loading) {
    return <SnapshotPageSkeleton />
  }

  return (
    <>
      <style jsx>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
      
      <div className="min-h-screen bg-[#f9f9f9] flex flex-col items-center justify-center relative px-4">
      {/* History Button */}
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="absolute top-8 right-8 flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-300 transition-all duration-200 ease-out hover:scale-105 transform shadow-sm rounded-lg"
      >
        <Clock className="w-4 h-4" />
        <span className="text-sm font-medium">History</span>
      </button>

      {/* Main Content */}
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-semibold text-gray-900 mb-4 tracking-tight" style={{ letterSpacing: '-0.04em' }}>Snapshots</h1>
          <p className="text-2xl text-gray-600 font-medium leading-tighter tracking-tight">
            The fastest way to see if your content is<br />
            visible, crawlable, and cited by AI models.
          </p>
        </div>

        {/* Rate Limit Warning */}
        {rateLimit && !rateLimit.allowed && (
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-red-700 text-sm">
              Daily limit reached ({rateLimit.requestsToday}/{rateLimit.limit})
            </div>
          </div>
        )}

        {/* Unified Command Bar */}
        <div className="bg-white border border-gray-200 p-6 rounded-lg transform transition-all duration-200 ease-out hover:border-gray-300 shadow-sm">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* URL Input - Top Left */}
              <div>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="example.com or https://example.com"
                  className="w-full bg-transparent text-gray-900 placeholder-gray-500 text-base focus:outline-none py-2 border-b border-transparent focus:border-gray-400 transition-colors"
                />
              </div>

              {/* Topic Input - Bottom Left */}
              <div className="relative">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Add the query you'd like to test"
                  className="w-full bg-gray-50 text-gray-900 placeholder-gray-500 text-base focus:outline-none h-12 py-3 px-4 rounded-xl transition-all duration-200 ease-out border border-gray-200 focus:border-gray-300 focus:bg-white"
                />
                {topic && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Bottom Right */}
            <div className="flex items-end justify-end gap-3">
              {/* Engine Dropdown */}
              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDropdown(!showDropdown)
                  }}
                  className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 rounded-xl px-4 h-12 text-gray-900 transition-all duration-200 ease-out min-w-[140px] hover:scale-[1.02] transform border border-gray-200"
                >
                  <img 
                    src={models.find(m => m.name === selectedModel)?.logo} 
                    alt={selectedModel}
                    className="w-5 h-5"
                  />
                  <span className="text-sm font-medium">{selectedModel}</span>
                  <ChevronDown className={`w-4 h-4 ml-auto transition-transform duration-200 ease-out ${showDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown Menu */}
                <div 
                  className={`absolute top-full left-0 mt-2 w-full bg-white rounded-xl overflow-hidden z-10 transform transition-all duration-200 ease-out origin-top border border-gray-200 shadow-lg ${
                    showDropdown ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 -translate-y-1 pointer-events-none'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {models.map((model, index) => (
                    <button
                      key={model.name}
                      onClick={() => {
                        if (model.available) {
                          setSelectedModel(model.name)
                        }
                        setShowDropdown(false)
                      }}
                      disabled={!model.available}
                      className={`w-full flex items-center gap-3 px-4 h-12 text-left transition-all duration-150 ease-out ${
                        model.available 
                          ? 'hover:bg-gray-50 text-gray-900' 
                          : 'text-gray-400 cursor-not-allowed'
                      } ${model.name === selectedModel ? 'bg-gray-50' : ''}`}
                      style={{
                        transitionDelay: showDropdown ? `${index * 25}ms` : '0ms'
                      }}
                    >
                      <img 
                        src={model.logo} 
                        alt={model.name}
                        className={`w-5 h-5 ${!model.available ? 'opacity-50' : ''}`}
                      />
                      <span className="text-sm font-medium">{model.name}</span>
                      {!model.available && (
                        <span className="text-xs ml-auto">Soon</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Arrow */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !rateLimit?.allowed || !topic.trim() || !url.trim()}
                className="flex items-center justify-center w-12 h-12 bg-gray-200 hover:bg-gray-300 border border-gray-300 hover:border-gray-400 text-gray-900 rounded-xl transition-all duration-200 ease-out disabled:opacity-50 hover:scale-105 active:scale-95 transform"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <img 
                    src="/images/pixel-arrow-black.svg" 
                    alt="Submit"
                    className="w-5 h-5 transition-transform duration-200 ease-out"
                  />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-red-700 text-sm">
              {error}
            </div>
          </div>
        )}

        {/* Usage Info */}
        {rateLimit && (
          <div className="mt-8 text-center text-gray-500 text-sm">
            {rateLimit.requestsToday}/{rateLimit.limit} snapshots used today
          </div>
        )}
      </div>

      {/* Enhanced History Sidebar */}
      <div className={`fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 p-6 overflow-y-auto transform transition-transform duration-300 ease-out z-50 shadow-xl ${
        showHistory ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-gray-900 font-semibold text-lg tracking-tight">Snapshot History</h3>
            <p className="text-gray-500 text-xs mt-1">{recentSnapshots.length} snapshots found</p>
          </div>
          <button
            onClick={() => setShowHistory(false)}
            className="flex items-center justify-center w-8 h-8 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="text-gray-600 text-lg leading-none">×</span>
          </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <SnapshotHistorySkeleton />
          ) : recentSnapshots.length > 0 ? (
              recentSnapshots.map((snapshot, index) => {
                // For preview cards, just use the raw database visibility score
                // Detail page will do more sophisticated weighted calculations
                const displayScore = snapshot.status === 'completed' ? 
                  Math.round((snapshot.visibility_score * 0.6) + ((snapshot.calculated_technical_score || snapshot.weighted_aeo_score || snapshot.aeo_score || 0) * 0.4)) : 
                  0;
              const hostname = getHostname(snapshot.url);
              
              return (
                <div
                  key={snapshot.id}
                  className={`bg-white border border-gray-200 p-3 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 ease-out hover:scale-[1.01] transform group rounded-lg shadow-sm ${
                    showHistory ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                  }`}
                  style={{
                    transitionDelay: showHistory ? `${index * 50}ms` : '0ms'
                  }}
                >
                  {/* Header with Favicon, Info, and Score */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        <img
                          src={getSafeFaviconUrl(snapshot.url)}
                          alt=""
                          className="w-4 h-4 rounded"
                          onError={(e) => {
                            e.currentTarget.src = '/images/split-icon-black.svg';
                          }}
                        />
                        {snapshot.status === 'completed' && (
                          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full"></div>
                        )}
                        {snapshot.status === 'processing' && (
                          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        )}
                        {snapshot.status === 'pending' && (
                          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-gray-900 font-medium text-sm truncate">
                          {snapshot.topic || 'Snapshot Analysis'}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {formatDate(snapshot.created_at)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Score Badge */}
                    {snapshot.status === 'completed' ? (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${
                        displayScore !== null && displayScore >= 70 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        displayScore !== null && displayScore >= 55 ? 'bg-blue-50 border-blue-200 text-blue-700' :
                        displayScore !== null && displayScore >= 40 ? 'bg-amber-50 border-amber-200 text-amber-700' :
                        displayScore !== null && displayScore >= 25 ? 'bg-orange-50 border-orange-200 text-orange-700' :
                        'bg-red-50 border-red-200 text-red-700'
                      }`}>
                        {displayScore || 0}
                      </div>
                    ) : (
                      <div className={`text-xs px-2 py-1 rounded-full font-medium border ${
                        snapshot.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        snapshot.status === 'processing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        snapshot.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        snapshot.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-gray-50 text-gray-600 border-gray-200'
                      }`}>
                        {snapshot.status === 'processing' ? 'Processing...' : 
                         snapshot.status === 'pending' ? 'Queued' :
                         snapshot.status === 'failed' ? 'Failed' :
                         snapshot.status}
                      </div>
                    )}
                  </div>

                  {/* URL with external link */}
                  <div className="flex items-center justify-between">
                    <a
                      href={snapshot.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-gray-900 text-xs font-mono truncate flex-1 mr-2 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {snapshot.url}
                    </a>
                    <Link
                      href={`/dashboard/snapshot/${snapshot.id}`}
                      className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
                    >
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-all duration-200" />
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="text-2xl">📊</div>
              </div>
              <div className="text-gray-900 font-medium mb-2 tracking-tight">No snapshots yet</div>
              <div className="text-gray-500 text-sm leading-relaxed">
                Create your first snapshot to start<br />analyzing AI visibility
              </div>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        {recentSnapshots.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-gray-500 text-xs mb-3">Quick Stats</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-gray-900 text-lg font-bold">
                  {recentSnapshots.filter(s => s.status === 'completed').length}
                </div>
                <div className="text-gray-500 text-xs">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-gray-900 text-lg font-bold">
                  {recentSnapshots.filter(s => {
                    if (s.status !== 'completed') return false;
                    const score = getCombinedScore(s).score;
                    return score >= 70;
                  }).length}
                </div>
                <div className="text-gray-500 text-xs">High Score</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay for history */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ease-out ${
          showHistory ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setShowHistory(false)}
      />
      </div>
    </>
  )
} 
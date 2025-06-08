'use client'

import { Plus, ArrowRight, Clock, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { 
  getUserSnapshots,
  checkUserRateLimit,
  type SnapshotRequest
} from '@/lib/snapshot-client'

export default function SnapshotPage() {
  const { user, loading } = useAuth()
  
  // Form state
  const [urls, setUrls] = useState([''])
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
  const [recentSnapshots, setRecentSnapshots] = useState<SnapshotRequest[]>([])
  
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
    
    // Load recent snapshots
    const { success: snapshotsSuccess, requests } = await getUserSnapshots(user.id, 5)
    if (snapshotsSuccess) {
      setRecentSnapshots(requests || [])
    }
    
    // Check rate limit
    const { success: rateLimitSuccess, allowed, requestsToday, limit } = await checkUserRateLimit(user.id)
    if (rateLimitSuccess) {
      setRateLimit({ allowed: allowed || false, requestsToday: requestsToday || 0, limit: limit || 5 })
    }
  }

  const addUrl = () => {
    if (urls.length < 10) { // Max 10 URLs
      setUrls([...urls, ''])
    }
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

  const handleSubmit = async () => {
    if (!user?.id) {
      setError('Please sign in to create snapshots')
      return
    }

    const validUrls = urls.filter(url => url.trim())
    if (validUrls.length === 0) {
      setError('Please enter at least one URL')
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
      const response = await fetch('/api/snapshots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          urls: validUrls,
          topic: topic.trim(),
          userId: user.id
        }),
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        // Navigate to the snapshot processing page
        window.location.href = `/dashboard/snapshot/${data.requestId}`
      } else {
        setError(data.error || 'Failed to create snapshot')
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred')
    } finally {
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

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname
    } catch {
      return url // Return original string if URL parsing fails
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-white" />
      </div>
    )
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
      `}</style>
      
      <div className="min-h-screen bg-[#0c0c0c] flex flex-col items-center justify-center relative px-4">
      {/* History Button */}
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="absolute top-8 right-8 flex items-center gap-2 px-3 py-2 text-[#888] hover:text-white bg-[#181818] border border-[#333] hover:border-[#444] transition-all duration-200 ease-out hover:scale-105 transform"
      >
        <Clock className="w-4 h-4" />
        <span className="text-sm font-medium">History</span>
      </button>

      {/* Main Content */}
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-semibold text-white mb-4 tracking-tight" style={{ letterSpacing: '-0.04em' }}>Snapshots</h1>
          <p className="text-2xl text-[#888] font-medium leading-tighter tracking-tight">
            The fastest way to see if your content is<br />
            visible, crawlable, and cited by AI models.
          </p>
        </div>

        {/* Rate Limit Warning */}
        {rateLimit && !rateLimit.allowed && (
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 text-red-400 text-sm">
              Daily limit reached ({rateLimit.requestsToday}/{rateLimit.limit})
            </div>
          </div>
        )}

        {/* Unified Command Bar */}
        <div className="bg-[#181818] border border-[#333] p-6 transform transition-all duration-200 ease-out hover:border-[#444]">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* URL Inputs - Top Left */}
              <div className="space-y-3">
                {urls.map((url, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-3 group transform transition-all duration-200 ease-out"
                    style={{
                      animation: index > 0 ? 'slideInLeft 0.2s ease-out' : 'none'
                    }}
                  >
                    <div className="flex items-center justify-center w-7 h-7 bg-[#2A2A2A] border border-[#444] rounded-lg text-white text-xs font-medium transition-colors group-hover:bg-[#333]">
                      {index + 1}
                    </div>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => updateUrl(index, e.target.value)}
                      placeholder="www.example.com"
                      className="flex-1 bg-transparent text-white placeholder-[#666] text-base focus:outline-none py-2 border-b border-transparent focus:border-[#444] transition-colors"
                    />
                    {index > 0 && (
                      <button
                        onClick={() => removeUrl(index)}
                        className="flex items-center justify-center w-6 h-6 text-[#666] hover:text-white hover:bg-[#2A2A2A] rounded transition-all duration-200 text-sm"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                
                {/* Add URL Control */}
                {urls.length < 10 && (
                  <button
                    onClick={addUrl}
                    className="flex items-center gap-2 text-[#666] hover:text-white transition-all duration-200 ease-out text-sm ml-10 hover:translate-x-1 transform"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add up to 10 URLs</span>
                  </button>
                )}
              </div>

              {/* Topic Input - Bottom Left */}
              <div className="relative">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Add the query you'd like to test"
                  className="w-full bg-[#1C1C1C] text-white placeholder-[#666] text-base focus:outline-none h-12 py-3 px-4 rounded-xl transition-all duration-200 ease-out"
                />
                {topic && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-2 h-2 bg-[#888] rounded-full"></div>
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
                  className="flex items-center gap-3 bg-[#1C1C1C] hover:bg-[#2A2A2A] rounded-xl px-4 h-12 text-white transition-all duration-200 ease-out min-w-[140px] hover:scale-[1.02] transform"
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
                  className={`absolute top-full left-0 mt-2 w-full bg-[#1C1C1C] rounded-xl overflow-hidden z-10 transform transition-all duration-200 ease-out origin-top ${
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
                          ? 'hover:bg-[#2A2A2A] text-white' 
                          : 'text-[#666] cursor-not-allowed'
                      } ${model.name === selectedModel ? 'bg-[#2A2A2A]' : ''}`}
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
                disabled={isSubmitting || !rateLimit?.allowed || !topic.trim() || urls.filter(url => url.trim()).length === 0}
                className="flex items-center justify-center w-12 h-12 bg-[#2A2A2A] hover:bg-[#333] border border-[#444] hover:border-[#555] text-white rounded-xl transition-all duration-200 ease-out disabled:opacity-50 hover:scale-105 active:scale-95 transform"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <img 
                    src="/images/pixel-arrow.svg" 
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
            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 text-red-400 text-sm">
              {error}
            </div>
          </div>
        )}

        {/* Usage Info */}
        {rateLimit && (
          <div className="mt-8 text-center text-[#666] text-sm">
            {rateLimit.requestsToday}/{rateLimit.limit} snapshots used today
          </div>
        )}
      </div>

      {/* History Sidebar */}
      <div className={`fixed right-0 top-0 h-full w-80 bg-[#181818] border-l border-[#333] p-6 overflow-y-auto transform transition-transform duration-300 ease-out z-50 ${
        showHistory ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-white font-semibold text-lg tracking-tight">Recent Snapshots</h3>
          <button
            onClick={() => setShowHistory(false)}
            className="flex items-center justify-center w-8 h-8 bg-[#1C1C1C] border border-[#333] rounded-lg hover:bg-[#2A2A2A] transition-colors"
          >
            <span className="text-white text-lg leading-none">×</span>
          </button>
        </div>

        <div className="space-y-3">
          {recentSnapshots.length > 0 ? (
            recentSnapshots.map((snapshot, index) => (
              <Link
                key={snapshot.id}
                href={`/dashboard/snapshot/${snapshot.id}`}
                className={`block bg-[#1C1C1C] border border-[#333] p-4 hover:bg-[#2A2A2A] hover:border-[#444] transition-all duration-200 ease-out hover:scale-[1.02] transform ${
                  showHistory ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                }`}
                style={{
                  transitionDelay: showHistory ? `${index * 50}ms` : '0ms'
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="text-white font-medium text-sm tracking-tight mb-1">
                      {snapshot.topic || 'Snapshot Analysis'}
                    </div>
                    <div className="text-[#666] text-xs">
                      {snapshot.urls.length} URL{snapshot.urls.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                    snapshot.status === 'completed' ? 'bg-[#2A2A2A] text-[#888]' :
                    snapshot.status === 'processing' ? 'bg-[#2A2A2A] text-[#888]' :
                    snapshot.status === 'pending' ? 'bg-[#2A2A2A] text-[#888]' :
                    'bg-[#2A2A2A] text-[#888]'
                  }`}>
                    {snapshot.status}
                  </div>
                </div>
                
                <div className="text-[#888] text-xs mb-2">
                  {formatDate(snapshot.created_at)}
                </div>
                
                <div className="text-[#666] text-xs truncate">
                  {snapshot.urls[0] && getHostname(snapshot.urls[0])}
                  {snapshot.urls.length > 1 && ` +${snapshot.urls.length - 1} more`}
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📊</div>
              <div className="text-white font-medium mb-2 tracking-tight">No snapshots yet</div>
              <div className="text-[#666] text-sm">Create your first snapshot to get started</div>
            </div>
          )}
        </div>
      </div>

      {/* Overlay for history */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-out ${
          showHistory ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setShowHistory(false)}
      />
      </div>
    </>
  )
} 
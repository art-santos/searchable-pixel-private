'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, ExternalLink, HelpCircle, Search, ChevronUp, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useToast } from '@/components/ui/use-toast'
import { InstallationGuide } from '@/components/ai-crawler/installation-guide'

interface ConnectAnalyticsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Platform = {
  id: string
  name: string
  description: string
  category: 'framework' | 'cms' | 'nocode' | 'custom'
  icon?: string
  iconBg?: string
  available: boolean
  votes?: number
}

const platforms: Platform[] = [
  {
    id: 'vercel',
    name: 'Vercel / Next.js',
    description: 'Next.js apps hosted on Vercel',
    category: 'framework',
    icon: '▲',
    iconBg: 'bg-white text-black',
    available: true
  },
  {
    id: 'custom',
    name: 'Custom Server',
    description: 'Node.js, Python, PHP, or other',
    category: 'custom',
    icon: '</>',
    iconBg: 'bg-[#1a1a1a] text-[#666]',
    available: true
  },
  {
    id: 'wordpress',
    name: 'WordPress',
    description: 'WordPress.com or self-hosted',
    category: 'cms',
    icon: 'W',
    iconBg: 'bg-[#21759b] text-white',
    available: true
  },
  {
    id: 'netlify',
    name: 'Netlify',
    description: 'Sites with Netlify Edge Functions',
    category: 'framework',
    icon: 'N',
    iconBg: 'bg-[#00D9FF] text-black',
    available: false,
    votes: 0
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    description: 'Sites using Cloudflare Workers',
    category: 'framework',
    icon: 'C',
    iconBg: 'bg-[#F38020] text-white',
    available: false,
    votes: 0
  },
  {
    id: 'ghost',
    name: 'Ghost',
    description: 'Ghost CMS blogs',
    category: 'cms',
    icon: 'G',
    iconBg: 'bg-[#15171A] text-white border border-[#333]',
    available: false,
    votes: 0
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'E-commerce sites on Shopify',
    category: 'cms',
    icon: 'S',
    iconBg: 'bg-[#96BF48] text-white',
    available: false,
    votes: 0
  },
  {
    id: 'framer',
    name: 'Framer',
    description: 'Sites built with Framer',
    category: 'nocode',
    icon: 'F',
    iconBg: 'bg-[#0055FF] text-white',
    available: false,
    votes: 0
  },
  {
    id: 'webflow',
    name: 'Webflow',
    description: 'Sites built with Webflow',
    category: 'nocode',
    icon: 'W',
    iconBg: 'bg-[#4353FF] text-white',
    available: false,
    votes: 0
  },
  {
    id: 'wix',
    name: 'Wix',
    description: 'Sites built with Wix',
    category: 'nocode',
    icon: 'W',
    iconBg: 'bg-[#0C6EFC] text-white',
    available: false,
    votes: 0
  },
  {
    id: 'squarespace',
    name: 'Squarespace',
    description: 'Sites built with Squarespace',
    category: 'nocode',
    icon: 'S',
    iconBg: 'bg-black text-white border border-[#333]',
    available: false,
    votes: 0
  }
]

export function ConnectAnalyticsDialog({
  open,
  onOpenChange,
}: ConnectAnalyticsDialogProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [showInstallationGuide, setShowInstallationGuide] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [votedPlatforms, setVotedPlatforms] = useState<Set<string>>(new Set())
  const [platformVotes, setPlatformVotes] = useState<Record<string, number>>({})
  const [loadingPlatform, setLoadingPlatform] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  // Fetch vote data when dialog opens
  useEffect(() => {
    if (open) {
      fetchVotes()
    }
  }, [open])

  // Debug: Monitor platformVotes changes
  useEffect(() => {
    console.log('[Voting] platformVotes state updated:', platformVotes)
  }, [platformVotes])

  const fetchVotes = async () => {
    try {
      const response = await fetch('/api/platform-votes')
      const data = await response.json()
      
      if (response.ok) {
        // Update vote counts
        const voteMap: Record<string, number> = {}
        data.voteCounts.forEach((vc: any) => {
          voteMap[vc.platform_id] = vc.vote_count
        })
        setPlatformVotes(voteMap)
        
        // Update user's voted platforms
        setVotedPlatforms(new Set(data.userVotes))
        
        console.log('[Voting] Fetched votes:', {
          voteCounts: data.voteCounts,
          userVotes: data.userVotes,
          voteMap
        })
      } else {
        console.error('[Voting] Failed to fetch votes:', data)
        
        // Use mock data for testing
        console.log('[Voting] Using mock data for testing')
        setPlatformVotes({
          wordpress: 234,
          webflow: 156,
          shopify: 128,
          squarespace: 92,
          framer: 89,
          wix: 67,
          ghost: 45,
          netlify: 23,
          cloudflare: 18
        })
      }
    } catch (error) {
      console.error('[Voting] Error fetching votes:', error)
      
      // Use mock data for testing
      console.log('[Voting] Using mock data due to error')
      setPlatformVotes({
        wordpress: 234,
        webflow: 156,
        shopify: 128,
        squarespace: 92,
        framer: 89,
        wix: 67,
        ghost: 45,
        netlify: 23,
        cloudflare: 18
      })
    }
  }

  const filteredPlatforms = useMemo(() => {
    if (!searchQuery) return platforms
    
    const query = searchQuery.toLowerCase()
    return platforms.filter(
      platform => 
        platform.name.toLowerCase().includes(query) ||
        platform.description.toLowerCase().includes(query)
    )
  }, [searchQuery])

  const sortedPlatforms = useMemo(() => {
    const sorted = [...filteredPlatforms].sort((a, b) => {
      // Available platforms first
      if (a.available && !b.available) return -1
      if (!a.available && b.available) return 1
      
      // Then sort by vote count (highest first)
      const aVotes = platformVotes[a.id] || 0
      const bVotes = platformVotes[b.id] || 0
      if (bVotes !== aVotes) {
        return bVotes - aVotes
      }
      
      // If votes are equal, maintain stable order by platform name
      return a.name.localeCompare(b.name)
    })
    return sorted
  }, [filteredPlatforms, platformVotes])

  const handleBack = () => {
    if (showInstallationGuide) {
      setShowInstallationGuide(false)
      setSelectedPlatform(null)
    } else {
      setSelectedPlatform(null)
      setSearchQuery('')
    }
  }

  const handleClose = () => {
    setSelectedPlatform(null)
    setShowInstallationGuide(false)
    setSearchQuery('')
    onOpenChange(false)
  }

  const handlePlatformSelect = (platformId: string) => {
    setSelectedPlatform(platformId)
    
    // For supported platforms, show installation guide
    if (platformId === 'vercel' || platformId === 'custom') {
      setShowInstallationGuide(true)
    }
    // For other platforms, show existing setup instructions
  }

  const handleInstallationComplete = () => {
    // Close dialog and refresh page to show new data
    handleClose()
    router.refresh()
  }

  const handleVote = async (platformId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (votedPlatforms.has(platformId) || loadingPlatform) return
    
    console.log('[Voting] Attempting to vote for:', platformId)
    
    setLoadingPlatform(platformId)
    try {
      const response = await fetch('/api/platform-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platformId })
      })
      
      const data = await response.json()
      console.log('[Voting] Response:', response.status, data)
      
      if (response.ok) {
        setVotedPlatforms(prev => new Set(prev).add(platformId))
        setPlatformVotes(prev => ({
          ...prev,
          [platformId]: data.voteCount
        }))
        
        toast({
          title: "Thanks for voting!",
          description: "We'll prioritize this platform based on community interest.",
        })
        
        console.log('[Voting] Vote successful for', platformId, 'New count:', data.voteCount)
      } else if (response.status === 401) {
        toast({
          title: "Sign in required",
          description: "Please sign in to vote for platforms.",
          variant: "destructive"
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('[Voting] Error submitting vote:', error)
      toast({
        title: "Vote failed",
        description: "Unable to submit your vote. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoadingPlatform(null)
    }
  }

  const selectedPlatformData = platforms.find(p => p.id === selectedPlatform)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-white dark:bg-black border-gray-200 dark:border-[#1a1a1a]">
        {showInstallationGuide ? (
          // Installation Guide flow
          <InstallationGuide
            platform={selectedPlatform === 'custom' ? 'node' : selectedPlatform as 'vercel' | 'node'}
            onComplete={handleInstallationComplete}
            onBack={handleBack}
          />
        ) : selectedPlatform === null ? (
          // Platform selection screen
          <>
            <DialogHeader>
              <DialogTitle className="text-xl text-black dark:text-white">
                How do you host your website?
              </DialogTitle>
              <p className="text-sm text-gray-500 dark:text-[#666] mt-2">
                Search or select your platform for setup instructions
              </p>
            </DialogHeader>

            {/* Search Input */}
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-[#666]" />
              <Input
                type="text"
                placeholder="Search platforms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 dark:bg-[#0a0a0a] border-gray-200 dark:border-[#1a1a1a] text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#444]"
              />
            </div>

            {/* Platform List */}
            <div className="mt-4 max-h-[400px] overflow-y-auto space-y-2 pr-2">
              {sortedPlatforms.map((platform) => {
                const isAvailable = platform.available
                const Component = isAvailable ? 'button' : 'div'
                
                return (
                  <Component
                    key={platform.id}
                    onClick={isAvailable ? () => handlePlatformSelect(platform.id) : undefined}
                    className={`w-full p-3 rounded-lg border transition-colors text-left group ${
                      isAvailable 
                        ? 'border-gray-200 dark:border-[#1a1a1a] hover:border-gray-300 dark:hover:border-[#333] cursor-pointer' 
                        : 'border-gray-200 dark:border-[#0a0a0a] cursor-default'
                    }`}
                    disabled={!isAvailable}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold ${
                        isAvailable ? platform.iconBg : 'bg-gray-200 dark:bg-[#0a0a0a] text-gray-500 dark:text-[#333]'
                      }`}>
                        {platform.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-medium text-sm ${
                          isAvailable ? 'text-black dark:text-white group-hover:text-gray-700 dark:group-hover:text-white/90' : 'text-gray-600 dark:text-[#444]'
                        }`}>
                          {platform.name}
                        </h3>
                        <p className={`text-xs ${
                          isAvailable ? 'text-gray-500 dark:text-[#666]' : 'text-gray-500 dark:text-[#666]'
                        }`}>
                          {isAvailable ? platform.description : 'Coming soon'}
                        </p>
                      </div>
                      {!isAvailable && platform.votes !== undefined && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleVote(platform.id, e)
                            }}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${
                              votedPlatforms.has(platform.id)
                                ? 'bg-green-500/20 text-green-500 cursor-default'
                                : 'bg-gray-200 dark:bg-[#1a1a1a] hover:bg-gray-300 dark:hover:bg-[#222] text-gray-600 dark:text-[#666] hover:text-black dark:hover:text-white'
                            }`}
                            disabled={votedPlatforms.has(platform.id) || loadingPlatform === platform.id}
                          >
                            {loadingPlatform === platform.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <ChevronUp className="w-3 h-3" />
                            )}
                            <span className="text-xs font-medium">
                              {(() => {
                                const currentCount = platformVotes[platform.id] || platform.votes || 0
                                console.log(`[Voting] Display count for ${platform.id}:`, {
                                  fromState: platformVotes[platform.id],
                                  fromPlatform: platform.votes,
                                  displaying: currentCount
                                })
                                return currentCount
                              })()}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </Component>
                )
              })}
            </div>

            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500 dark:text-[#666]">
                Vote for platforms you'd like to see supported
              </p>
            </div>

            {/* I don't know option */}
            <button
              onClick={() => window.open('https://cal.com/sam-hogan/15min', '_blank')}
              className="mt-4 w-full p-4 rounded-lg border border-dashed border-gray-200 dark:border-[#1a1a1a] hover:border-gray-300 dark:hover:border-[#333] transition-colors group"
            >
              <div className="flex items-center justify-center gap-3">
                <HelpCircle className="w-5 h-5 text-gray-500 dark:text-[#666]" />
                <span className="text-gray-500 dark:text-[#666] group-hover:text-gray-700 dark:group-hover:text-[#888]">I don't know / Need help</span>
              </div>
            </button>
          </>
        ) : (
          // Setup instructions based on selection
          <>
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={handleBack}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-gray-500 dark:text-[#666]" />
              </button>
              <DialogTitle className="text-xl text-black dark:text-white">
                {selectedPlatformData?.name} Setup
              </DialogTitle>
            </div>

            <div className="space-y-4">
              {/* Vercel/Next.js Instructions */}
              {selectedPlatform === 'vercel' && (
                <>
                  <div className="bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-lg p-4">
                    <h4 className="font-medium text-black dark:text-white mb-3">Quick Setup</h4>
                    <ol className="space-y-3">
                      <li className="flex gap-3">
                        <span className="text-gray-500 dark:text-[#666] flex-shrink-0">1.</span>
                        <div>
                          <p className="text-sm text-gray-700 dark:text-[#ccc]">Install our package:</p>
                          <code className="block mt-1 text-xs bg-gray-100 dark:bg-[#1a1a1a] px-3 py-2 rounded font-mono text-gray-600 dark:text-[#888]">
                            npm install @split.dev/analytics
                          </code>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-gray-500 dark:text-[#666] flex-shrink-0">2.</span>
                        <div>
                          <p className="text-sm text-gray-700 dark:text-[#ccc]">Add to your middleware.ts:</p>
                          <code className="block mt-1 text-xs bg-gray-100 dark:bg-[#1a1a1a] px-3 py-2 rounded font-mono text-gray-600 dark:text-[#888] whitespace-pre">
{`import { splitAnalytics } from '@split.dev/analytics/next'

export const middleware = splitAnalytics({
  apiKey: process.env.SPLIT_API_KEY
})`}
                          </code>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-gray-500 dark:text-[#666] flex-shrink-0">3.</span>
                        <p className="text-sm text-gray-700 dark:text-[#ccc]">Deploy your changes</p>
                      </li>
                    </ol>
                  </div>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => window.open('https://docs.split.dev', '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View full documentation
                  </Button>
                </>
              )}

              {/* WordPress Instructions */}
              {selectedPlatform === 'wordpress' && (
                <>
                  <div className="bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-lg p-4">
                    <h4 className="font-medium text-black dark:text-white mb-3">Quick Setup</h4>
                    <ol className="space-y-3">
                      <li className="flex gap-3">
                        <span className="text-gray-500 dark:text-[#666] flex-shrink-0">1.</span>
                        <div>
                          <p className="text-sm text-gray-700 dark:text-[#ccc]">Download the Split Analytics plugin:</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              // Create download link for the zip file
                              const link = document.createElement('a')
                              link.href = '/wp-plugin/split-analytics.zip'
                              link.download = 'split-analytics.zip'
                              link.click()
                            }}
                          >
                            Download Plugin (.zip)
                          </Button>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-gray-500 dark:text-[#666] flex-shrink-0">2.</span>
                        <div>
                          <p className="text-sm text-gray-700 dark:text-[#ccc]">Install the plugin:</p>
                          <ul className="mt-1 text-xs text-gray-600 dark:text-gray-300 space-y-1 ml-4">
                            <li>• Go to Plugins → Add New → Upload Plugin</li>
                            <li>• Choose the downloaded ZIP file</li>
                            <li>• Click "Install Now" and "Activate"</li>
                          </ul>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-gray-500 dark:text-[#666] flex-shrink-0">3.</span>
                        <div>
                          <p className="text-sm text-gray-700 dark:text-[#ccc]">Configure your API key:</p>
                          <ul className="mt-1 text-xs text-gray-600 dark:text-gray-300 space-y-1 ml-4">
                            <li>• Go to Settings → Split Analytics</li>
                            <li>• Enter your API key from the dashboard</li>
                            <li>• Enable tracking and save settings</li>
                          </ul>
                        </div>
                      </li>
                    </ol>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg p-3">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      <strong>Note:</strong> The plugin is currently in review for the WordPress.org directory. 
                      For now, please use the manual installation method above.
                    </p>
                  </div>
                </>
              )}

              {/* Custom/API Instructions */}
              {selectedPlatform === 'custom' && (
                <>
                  <div className="bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-lg p-4">
                    <h4 className="font-medium text-black dark:text-white mb-3">Quick Setup</h4>
                    <ol className="space-y-3">
                      <li className="flex gap-3">
                        <span className="text-gray-500 dark:text-[#666] flex-shrink-0">1.</span>
                        <div>
                          <p className="text-sm text-gray-700 dark:text-[#ccc]">Install our package:</p>
                          <code className="block mt-1 text-xs bg-gray-100 dark:bg-[#1a1a1a] px-3 py-2 rounded font-mono text-gray-600 dark:text-[#888]">
                            npm install @split.dev/analytics
                          </code>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-gray-500 dark:text-[#666] flex-shrink-0">2.</span>
                        <div>
                          <p className="text-sm text-gray-700 dark:text-[#ccc]">Add to your server:</p>
                          <code className="block mt-1 text-xs bg-gray-100 dark:bg-[#1a1a1a] px-3 py-2 rounded font-mono text-gray-600 dark:text-[#888] whitespace-pre overflow-x-auto">
{`const { splitAnalytics } = require('@split.dev/analytics')

app.use(splitAnalytics({
  apiKey: process.env.SPLIT_API_KEY
}))`}
                          </code>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="text-gray-500 dark:text-[#666] flex-shrink-0">3.</span>
                        <p className="text-sm text-gray-700 dark:text-[#ccc]">Deploy your changes</p>
                      </li>
                    </ol>
                  </div>
                  <div className="space-y-2">
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => window.open('https://docs.split.dev', '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View full documentation
                    </Button>
                    <p className="text-xs text-gray-500 dark:text-[#666] text-center">
                      Supports Express, Fastify, Koa, and raw Node.js
                    </p>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
} 
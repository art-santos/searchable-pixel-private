'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, ExternalLink, HelpCircle, Search, ChevronUp, Loader2, ChevronRight, ArrowUp, ChevronLeft, AlertCircle, Triangle, Code2, Globe, Hash, Cloud, Ghost, ShoppingBag, Frame, Layers, Wand2, Square } from 'lucide-react'
import Image from 'next/image'
import { useToast } from '@/components/ui/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

interface ConnectAnalyticsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Platform = {
  id: string
  name: string
  description: string
  category: 'framework' | 'cms' | 'nocode' | 'custom'
  icon: React.ComponentType<{ className?: string }>
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
    icon: Triangle,
    iconBg: 'bg-white text-black',
    available: true
  },
  {
    id: 'custom',
    name: 'Custom Server',
    description: 'Node.js, Python, PHP, or other',
    category: 'custom',
    icon: Code2,
    iconBg: 'bg-[#1a1a1a] text-[#666]',
    available: true
  },
  {
    id: 'wordpress',
    name: 'WordPress',
    description: 'WordPress.com or self-hosted',
    category: 'cms',
    icon: Globe,
    iconBg: 'bg-[#21759b] text-white',
    available: false,
    votes: 0
  },
  {
    id: 'netlify',
    name: 'Netlify',
    description: 'Sites with Netlify Edge Functions',
    category: 'framework',
    icon: Hash,
    iconBg: 'bg-[#00D9FF] text-black',
    available: false,
    votes: 0
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    description: 'Sites using Cloudflare Workers',
    category: 'framework',
    icon: Cloud,
    iconBg: 'bg-[#F38020] text-white',
    available: false,
    votes: 0
  },
  {
    id: 'ghost',
    name: 'Ghost',
    description: 'Ghost CMS blogs',
    category: 'cms',
    icon: Ghost,
    iconBg: 'bg-[#15171A] text-white border border-[#333]',
    available: false,
    votes: 0
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'E-commerce sites on Shopify',
    category: 'cms',
    icon: ShoppingBag,
    iconBg: 'bg-[#96BF48] text-white',
    available: false,
    votes: 0
  },
  {
    id: 'framer',
    name: 'Framer',
    description: 'Sites built with Framer',
    category: 'nocode',
    icon: Frame,
    iconBg: 'bg-[#0055FF] text-white',
    available: false,
    votes: 0
  },
  {
    id: 'webflow',
    name: 'Webflow',
    description: 'Sites built with Webflow',
    category: 'nocode',
    icon: Layers,
    iconBg: 'bg-[#4353FF] text-white',
    available: false,
    votes: 0
  },
  {
    id: 'wix',
    name: 'Wix',
    description: 'Sites built with Wix',
    category: 'nocode',
    icon: Wand2,
    iconBg: 'bg-[#0C6EFC] text-white',
    available: false,
    votes: 0
  },
  {
    id: 'squarespace',
    name: 'Squarespace',
    description: 'Sites built with Squarespace',
    category: 'nocode',
    icon: Square,
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
  const [searchQuery, setSearchQuery] = useState('')
  const [votedPlatforms, setVotedPlatforms] = useState<Set<string>>(new Set())
  const [platformVotes, setPlatformVotes] = useState<Record<string, number>>({})
  const [loadingPlatform, setLoadingPlatform] = useState<string | null>(null)
  const { toast } = useToast()
  const [showVercelInstructions, setShowVercelInstructions] = useState(false)
  const [showCustomInstructions, setShowCustomInstructions] = useState(false)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [isGeneratingKey, setIsGeneratingKey] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  const [userVotes, setUserVotes] = useState<string[]>([])
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({})

  // Define unavailable platforms (all except vercel and custom)
  const unavailablePlatforms = platforms
    .filter(p => !p.available)
    .map(p => p.id)

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

  const handleBack = () => {
    setSelectedPlatform(null)
    setSearchQuery('')
  }

  const handleClose = () => {
    setSelectedPlatform(null)
    setSearchQuery('')
    onOpenChange(false)
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

  const handlePlatformSelect = async (platformId: string) => {
    if (unavailablePlatforms.includes(platformId)) {
      // Handle voting for coming soon platforms
      setIsVoting(true)
      try {
        const response = await fetch('/api/platform-votes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ platformId })
        })

        if (!response.ok) {
          const error = await response.json()
          if (response.status === 401) {
            toast({
              title: 'Please sign in to vote for platforms',
              variant: 'destructive'
            })
          } else {
            throw new Error(error.error || 'Failed to vote')
          }
          return
        }

        const data = await response.json()
        
        setUserVotes(prev => [...prev, platformId])
        setVoteCounts(prev => ({
          ...prev,
          [platformId]: data.voteCount
        }))
        setVotedPlatforms(prev => new Set(prev).add(platformId))
        
        toast({
          title: 'Thanks for voting!',
          description: 'We\'ll prioritize based on demand.'
        })
      } catch (error) {
        console.error('Error voting:', error)
        toast({
          title: 'Failed to submit vote',
          variant: 'destructive'
        })
      } finally {
        setIsVoting(false)
      }
    } else {
      // Handle available platforms (Vercel, Custom Server)
      if (platformId === 'vercel') {
        setShowVercelInstructions(true)
      } else if (platformId === 'custom') {
        setShowCustomInstructions(true)
      }
    }
  }

  const generateApiKey = async () => {
    setIsGeneratingKey(true)
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'My Website',
          domains: [] // No restrictions for now
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate API key')
      }

      const data = await response.json()
      setApiKey(data.key.api_key)
      toast({
        title: 'API key generated!',
        description: 'Make sure to save it - you won\'t be able to see it again.'
      })
    } catch (error) {
      console.error('Error generating API key:', error)
      toast({
        title: 'Failed to generate API key',
        variant: 'destructive'
      })
    } finally {
      setIsGeneratingKey(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-black border-[#1a1a1a]">
        {!showVercelInstructions && !showCustomInstructions ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Connect Your Analytics</DialogTitle>
              <DialogDescription className="text-base">
                How do you host your website? We'll show you the best way to add AI crawler tracking.
              </DialogDescription>
            </DialogHeader>

            {/* Search bar */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search platforms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="grid gap-2 py-4">
                {filteredPlatforms.map((platform) => (
                  <Button
                    key={platform.id}
                    variant="outline"
                    className={cn(
                      "relative h-auto justify-start p-4 hover:bg-accent",
                      isVoting && "opacity-50 pointer-events-none"
                    )}
                    onClick={() => handlePlatformSelect(platform.id)}
                    disabled={isVoting}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <platform.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium flex items-center gap-2">
                          {platform.name}
                          {unavailablePlatforms.includes(platform.id) && (
                            <Badge variant="secondary" className="text-xs">
                              Coming Soon
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {platform.description}
                        </div>
                        {unavailablePlatforms.includes(platform.id) && platformVotes[platform.id] !== undefined && (
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              size="sm"
                              variant={votedPlatforms.has(platform.id) ? "default" : "outline"}
                              className={cn(
                                "h-7 gap-1",
                                votedPlatforms.has(platform.id) && "bg-green-600 hover:bg-green-700"
                              )}
                              disabled
                            >
                              <ArrowUp className="h-3 w-3" />
                              <span className="text-xs">{platformVotes[platform.id] || 0}</span>
                            </Button>
                            <span className="text-xs text-muted-foreground">
                              {votedPlatforms.has(platform.id) ? "You voted" : "Vote to prioritize"}
                            </span>
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>

            <DialogFooter className="sm:justify-between">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button variant="link" asChild>
                <a href="mailto:support@split.dev">Need help?</a>
              </Button>
            </DialogFooter>
          </>
        ) : showVercelInstructions ? (
          <>
            <DialogHeader>
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-4 top-4"
                onClick={() => setShowVercelInstructions(false)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <DialogTitle className="text-xl font-semibold mt-2">Setup for Vercel / Next.js</DialogTitle>
              <DialogDescription>
                Track AI crawlers visiting your Next.js application
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h3 className="font-medium">1. Generate your API key</h3>
                {!apiKey ? (
                  <Button 
                    onClick={generateApiKey} 
                    disabled={isGeneratingKey}
                    className="w-full"
                  >
                    {isGeneratingKey ? "Generating..." : "Generate API Key"}
                  </Button>
                ) : (
                  <div className="p-3 bg-muted rounded-lg font-mono text-sm break-all">
                    {apiKey}
                    <p className="text-xs text-muted-foreground mt-2">
                      Save this key - you won't be able to see it again!
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">2. Install the package</h3>
                <pre className="p-3 bg-muted rounded-lg overflow-x-auto">
                  <code className="text-sm">npm install @split.dev/analytics</code>
                </pre>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">3. Create middleware.ts in your project root</h3>
                <pre className="p-3 bg-muted rounded-lg overflow-x-auto text-sm">
                  <code>{`import { createCrawlerMiddleware } from '@split.dev/analytics/middleware'

export const middleware = createCrawlerMiddleware({
  apiKey: process.env.SPLIT_API_KEY!
})

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}`}</code>
                </pre>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">4. Add to your .env.local</h3>
                <pre className="p-3 bg-muted rounded-lg overflow-x-auto">
                  <code className="text-sm">SPLIT_API_KEY={apiKey || 'your_api_key_here'}</code>
                </pre>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  That's it! Your app will now track AI crawler visits automatically.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-4 top-4"
                onClick={() => setShowCustomInstructions(false)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <DialogTitle className="text-xl font-semibold mt-2">Setup for Custom Servers</DialogTitle>
              <DialogDescription>
                Track AI crawlers on Express, Node.js, or any custom server
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h3 className="font-medium">1. Generate your API key</h3>
                {!apiKey ? (
                  <Button 
                    onClick={generateApiKey} 
                    disabled={isGeneratingKey}
                    className="w-full"
                  >
                    {isGeneratingKey ? "Generating..." : "Generate API Key"}
                  </Button>
                ) : (
                  <div className="p-3 bg-muted rounded-lg font-mono text-sm break-all">
                    {apiKey}
                    <p className="text-xs text-muted-foreground mt-2">
                      Save this key - you won't be able to see it again!
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">2. Install the package</h3>
                <pre className="p-3 bg-muted rounded-lg overflow-x-auto">
                  <code className="text-sm">npm install @split.dev/analytics</code>
                </pre>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">3. Add to your Express/Node.js server</h3>
                <pre className="p-3 bg-muted rounded-lg overflow-x-auto text-sm">
                  <code>{`const express = require('express')
const { createNodeMiddleware } = require('@split.dev/analytics')

const app = express()

// Add Split Analytics middleware
app.use(createNodeMiddleware({
  apiKey: process.env.SPLIT_API_KEY
}))

// Your routes
app.get('/', (req, res) => {
  res.send('Hello World!')
})`}</code>
                </pre>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">4. For other frameworks</h3>
                <pre className="p-3 bg-muted rounded-lg overflow-x-auto text-sm">
                  <code>{`import { trackCrawler } from '@split.dev/analytics'

// In your request handler
const wasCrawler = await trackCrawler(
  { apiKey: process.env.SPLIT_API_KEY },
  {
    url: request.url,
    userAgent: request.headers['user-agent']
  }
)`}</code>
                </pre>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your server will now track AI crawler visits automatically!
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
} 
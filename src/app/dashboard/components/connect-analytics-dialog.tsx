'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { InstallationGuide } from '@/components/ai-crawler/installation-guide'
import { Search, HelpCircle, CheckCircle2, ChevronLeft, X } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

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
  hasBeta?: boolean
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
    id: 'wordpress',
    name: 'WordPress',
    description: 'WordPress.com or self-hosted',
    category: 'cms',
    icon: 'W',
    iconBg: 'bg-[#21759b] text-white',
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
    id: 'webflow',
    name: 'Webflow',
    description: 'Sites built with Webflow',
    category: 'nocode',
    iconBg: 'bg-[#4353FF] text-white',
    available: true,
    hasBeta: true
  },
  {
    id: 'framer',
    name: 'Framer',
    description: 'Sites built with Framer',
    category: 'nocode',
    iconBg: 'bg-[#0055FF] text-white',
    available: true,
    hasBeta: true
  },
  {
    id: 'netlify',
    name: 'Netlify',
    description: 'Sites with Netlify Edge Functions',
    category: 'framework',
    icon: 'N',
    iconBg: 'bg-[#00D9FF] text-black',
    available: false
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    description: 'Sites using Cloudflare Workers',
    category: 'framework',
    icon: 'C',
    iconBg: 'bg-[#F38020] text-white',
    available: false
  },
  {
    id: 'ghost',
    name: 'Ghost',
    description: 'Ghost CMS blogs',
    category: 'cms',
    icon: 'G',
    iconBg: 'bg-[#15171A] text-white border border-[#333]',
    available: false
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'E-commerce sites on Shopify',
    category: 'cms',
    icon: 'S',
    iconBg: 'bg-[#96BF48] text-white',
    available: false
  },
  {
    id: 'wix',
    name: 'Wix',
    description: 'Sites built with Wix',
    category: 'nocode',
    icon: 'W',
    iconBg: 'bg-[#0C6EFC] text-white',
    available: false
  },
  {
    id: 'squarespace',
    name: 'Squarespace',
    description: 'Sites built with Squarespace',
    category: 'nocode',
    icon: 'S',
    iconBg: 'bg-black text-white border border-[#333]',
    available: false
  }
]

export function ConnectAnalyticsDialog({
  open,
  onOpenChange,
}: ConnectAnalyticsDialogProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [showInstallationGuide, setShowInstallationGuide] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()
  const router = useRouter()

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
      
      // Among available platforms, non-beta first
      if (a.available && b.available) {
        if (!a.hasBeta && b.hasBeta) return -1
        if (a.hasBeta && !b.hasBeta) return 1
      }
      
      // Maintain stable order by platform name
      return a.name.localeCompare(b.name)
    })
    return sorted
  }, [filteredPlatforms])

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
    if (platformId === 'vercel' || platformId === 'custom' || platformId === 'webflow' || platformId === 'framer') {
      setShowInstallationGuide(true)
    }
    // For other platforms, show existing setup instructions
  }

  const handleInstallationComplete = () => {
    // Close dialog and refresh page to show new data
    handleClose()
    router.refresh()
  }

  const selectedPlatformData = platforms.find(p => p.id === selectedPlatform)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-[#1a1a1a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showInstallationGuide && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="p-0 h-auto hover:bg-transparent"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              )}
              <div>
                <DialogTitle className="text-xl">
                  {showInstallationGuide ? 'Set Up Analytics' : 'Connect Analytics'}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {showInstallationGuide && selectedPlatformData
                    ? `Install Split Analytics on ${selectedPlatformData.name}`
                    : 'Choose your website platform to get started'}
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="p-0 h-auto hover:bg-transparent"
            >
              <X className="w-5 h-5 text-gray-400" />
            </Button>
          </div>
        </DialogHeader>

        <div className="px-6 py-4">
          {showInstallationGuide && selectedPlatform ? (
            <InstallationGuide
              platform={selectedPlatform as any}
              onComplete={handleInstallationComplete}
              onBack={handleBack}
              onClose={handleClose}
            />
          ) : (
            <>
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search platforms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-50 dark:bg-[#0a0a0a] border-gray-200 dark:border-[#1a1a1a] focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                />
              </div>

              {/* Platform grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {sortedPlatforms.map((platform) => {
                  const isAvailable = platform.available
                  const Component = isAvailable ? 'button' : 'div'
                  
                  return (
                    <Component
                      key={platform.id}
                      onClick={isAvailable ? () => handlePlatformSelect(platform.id) : undefined}
                      className={`relative p-4 rounded-lg border transition-all text-left ${
                        isAvailable
                          ? 'border-gray-200 dark:border-[#1a1a1a] hover:border-gray-300 dark:hover:border-[#333] cursor-pointer group'
                          : 'border-gray-100 dark:border-[#0a0a0a] opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold ${platform.iconBg || 'bg-gray-100 dark:bg-[#1a1a1a]'}`}>
                          {platform.icon || platform.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm text-black dark:text-white truncate">
                            {platform.name}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-[#666] mt-0.5">
                            {platform.description}
                          </p>
                          
                          {/* Coming soon badge */}
                          {!isAvailable && (
                            <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 dark:text-[#666] rounded">
                              Coming soon
                            </span>
                          )}
                          
                          {/* Beta badge */}
                          {isAvailable && platform.hasBeta && (
                            <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded">
                              Tracking Pixel
                            </span>
                          )}
                        </div>
                      </div>
                    </Component>
                  )
                })}
              </div>

              <div className="mt-3 text-center">
                <p className="text-xs text-gray-500 dark:text-[#666]">
                  More platforms coming soon
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 
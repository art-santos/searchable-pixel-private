'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'


import { Search, HelpCircle, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { AnimatePresence, motion } from 'framer-motion'

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
  logoSrc?: string
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
    hasBeta: true,
    logoSrc: '/images/webflow.svg'
  },
  {
    id: 'framer',
    name: 'Framer',
    description: 'Sites built with Framer',
    category: 'nocode',
    iconBg: 'bg-[#0055FF] text-white',
    available: true,
    hasBeta: true,
    logoSrc: '/images/framer.svg'
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
        </DialogHeader>

        <div className="px-6 py-4">
          <AnimatePresence mode="wait">
            {showInstallationGuide && selectedPlatform ? (
              <motion.div
                key="installation-guide"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
              >
                <InstallationGuide
                  platform={selectedPlatform as any}
                  onComplete={handleInstallationComplete}
                  onBack={handleBack}
                />
              </motion.div>
            ) : (
              <motion.div
                key="platform-selection"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
                className="space-y-6"
              >
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Search platforms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-50 dark:bg-[#0a0a0a] border-gray-200 dark:border-[#1a1a1a] focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                  />
                </div>

                {/* Platform list */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
                  }}
                  className="space-y-2 mb-6 max-h-[400px] overflow-y-auto"
                >
                  {sortedPlatforms.map((platform, index) => {
                    const isAvailable = platform.available
                    const Component = isAvailable ? motion.button : motion.div
                    
                    return (
                      <Component
                        key={platform.id}
                        onClick={isAvailable ? () => handlePlatformSelect(platform.id) : undefined}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, ease: [0.42, 0, 0.58, 1] }}
                        className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all ${((isAvailable
                          ? 'border-gray-200 dark:border-[#1a1a1a] hover:border-gray-300 dark:hover:border-[#333] hover:bg-gray-50 dark:hover:bg-[#0a0a0a] cursor-pointer group'
                          : 'border-gray-100 dark:border-[#0a0a0a] opacity-60 cursor-not-allowed') as string)
                        }
                        `}
                      >
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold flex-shrink-0 ${platform.iconBg || 'bg-gray-100 dark:bg-[#1a1a1a]'}`}>
                          {platform.logoSrc ? (
                            <Image 
                              src={platform.logoSrc} 
                              alt={platform.name} 
                              width={20} 
                              height={20} 
                              className="filter brightness-0 invert"
                            />
                          ) : (
                            platform.icon || platform.name.charAt(0)
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm text-black dark:text-white">
                              {platform.name}
                            </h3>
                            {isAvailable && platform.hasBeta && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded">
                                Beta
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-[#666] mt-0.5">
                            {platform.description}
                          </p>
                        </div>
                        
                        {/* Status/Arrow */}
                        <div className="flex-shrink-0">
                          {isAvailable ? (
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 dark:text-[#666] rounded">
                              Coming soon
                            </span>
                          )}
                        </div>
                      </Component>
                    )
                  })}
                </motion.div>

                <div className="mt-3 text-center">
                  <p className="text-xs text-gray-500 dark:text-[#666]">
                    More platforms coming soon
                  </p>
                </div>

                {/* I don't know option */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: sortedPlatforms.length * 0.05 + 0.1, duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
                  onClick={() => window.open('https://cal.com/sam-hogan/15min', '_blank')}
                  className="mt-4 w-full p-4 rounded-lg border border-dashed border-gray-200 dark:border-[#1a1a1a] hover:border-gray-300 dark:hover:border-[#333] transition-colors group"
                >
                  <div className="flex items-center justify-center gap-3">
                    <HelpCircle className="w-5 h-5 text-gray-500 dark:text-[#666]" />
                    <span className="text-gray-500 dark:text-[#666] group-hover:text-gray-700 dark:group-hover:text-[#888]">I don't know / Need help</span>
                  </div>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
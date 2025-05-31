"use client"

import * as React from "react"
import { SearchIcon, Command } from "lucide-react"
import { cn } from "@/lib/utils"

// Documentation sections and items for search
const DOC_ITEMS = [
  {
    section: "Getting Started",
    item: "Introduction",
    description: "Overview of Split Analytics and AI crawler tracking",
    keywords: "introduction overview getting started ai crawler analytics"
  },
  {
    section: "Getting Started", 
    item: "Quickstart",
    description: "Get up and running in under 5 minutes",
    keywords: "quickstart quick start setup installation guide"
  },
  {
    section: "Getting Started",
    item: "Installation", 
    description: "Package installation and requirements",
    keywords: "installation install npm yarn pnpm requirements"
  },
  {
    section: "Getting Started",
    item: "Authentication",
    description: "API key management and security",
    keywords: "authentication api key security environment variables"
  },
  {
    section: "Integration",
    item: "Next.js",
    description: "Next.js middleware integration guide", 
    keywords: "nextjs next.js middleware app router integration"
  },
  {
    section: "Integration",
    item: "Express",
    description: "Express.js server integration",
    keywords: "express expressjs server nodejs middleware"
  },
  {
    section: "Integration", 
    item: "Node.js",
    description: "Node.js application integration",
    keywords: "nodejs node.js server backend integration"
  },
  {
    section: "Integration",
    item: "Custom Integration",
    description: "Custom implementation patterns",
    keywords: "custom integration manual implementation patterns"
  },
  {
    section: "API Reference",
    item: "Endpoints",
    description: "Available API endpoints and methods",
    keywords: "api endpoints methods reference documentation"
  },
  {
    section: "API Reference",
    item: "Authentication",
    description: "API authentication methods",
    keywords: "api authentication bearer token security"
  },
  {
    section: "API Reference",
    item: "Events",
    description: "Event tracking and data structure",
    keywords: "events tracking data structure payload"
  },
  {
    section: "API Reference", 
    item: "Rate Limits",
    description: "API rate limiting and quotas",
    keywords: "rate limits quotas throttling api limits"
  },
  {
    section: "Configuration",
    item: "Options",
    description: "Configuration options and parameters",
    keywords: "configuration options parameters settings"
  },
  {
    section: "Configuration",
    item: "Middleware",
    description: "Middleware configuration guide",
    keywords: "middleware configuration setup options"
  },
  {
    section: "Configuration",
    item: "Environment Variables",
    description: "Environment variable configuration",
    keywords: "environment variables env config setup"
  },
  {
    section: "Configuration",
    item: "Debugging",
    description: "Debug mode and troubleshooting",
    keywords: "debugging debug troubleshooting errors logs"
  },
  {
    section: "Advanced",
    item: "AI Crawler Detection",
    description: "How AI crawler detection works",
    keywords: "ai crawler detection bot identification user agent"
  },
  {
    section: "Advanced",
    item: "Event Batching", 
    description: "Event batching and performance optimization",
    keywords: "batching events performance optimization buffer"
  },
  {
    section: "Advanced",
    item: "Retry Logic",
    description: "Automatic retry mechanisms",
    keywords: "retry logic automatic retries error handling"
  },
  {
    section: "Advanced", 
    item: "Webhooks",
    description: "Webhook integration and callbacks",
    keywords: "webhooks callbacks integration notifications"
  }
]

interface DocsSearchBarProps {
  onNavigate?: (sectionId: string) => void
}

export function DocsSearchBar({ onNavigate }: DocsSearchBarProps) {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  // Filter documentation items based on search query
  const filteredItems = searchQuery
    ? DOC_ITEMS.filter(item => {
        const searchLower = searchQuery.toLowerCase()
        return (
          item.section.toLowerCase().includes(searchLower) ||
          item.item.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower) ||
          item.keywords.toLowerCase().includes(searchLower)
        )
      })
    : []

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
      
      if (e.key === 'Escape') {
        setIsSearchOpen(false)
        setSearchQuery("")
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus the search input when the overlay opens
  React.useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchOpen])

  const handleItemClick = (item: typeof DOC_ITEMS[0]) => {
    // Convert section and item to section ID format
    const sectionId = item.item.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    onNavigate?.(sectionId)
    setIsSearchOpen(false)
    setSearchQuery("")
  }

  return (
    <div className="flex items-center w-full">
      <div className="flex items-center w-full h-10 px-2">
        <SearchIcon className="h-4 w-4 text-gray-400 mr-1.5" />
        <div className="relative flex-1">
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Search documentation..."
              className="bg-transparent border-none outline-none text-gray-200 placeholder-gray-400 w-full font-sans text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchOpen(true)}
            />
            <div className="flex items-center h-6 border border-[#2F2F2F] bg-[#1C1C1C] px-1.5 text-gray-400 ml-1">
              <Command className="h-3 w-3" />
              <span className="text-xs mx-1">+</span>
              <span className="text-xs">K</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Overlay */}
      <div 
        className={cn(
          "fixed inset-0 z-50 transition-all duration-200 ease-out",
          isSearchOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Blur Backdrop */}
        <div 
          className={cn(
            "absolute inset-0 bg-[#0c0c0c]/80 backdrop-blur-sm transition-opacity duration-200",
            isSearchOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => {
            setIsSearchOpen(false)
            setSearchQuery("")
          }}
        />
        
        {/* Search Container */}
        <div 
          className="fixed left-1/2 -translate-x-1/2 top-[72px] w-[560px] border border-[#222222] bg-[#0c0c0c] transform transition-all duration-200 ease-out"
          style={{
            transformOrigin: "top",
            transform: `translate(-50%, ${isSearchOpen ? '0' : '-8px'})`,
          }}
        >
          <div className="flex items-center h-16 px-4 border-b border-[#222222]">
            <SearchIcon className="h-5 w-5 text-gray-400 mr-3" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search documentation..."
              className="flex-1 bg-transparent border-none outline-none text-gray-200 placeholder-gray-400 text-xl font-sans"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="flex items-center h-7 border border-[#2F2F2F] bg-[#1C1C1C] px-2 text-gray-400">
              <span className="text-xs font-mono uppercase tracking-wider">ESC</span>
            </div>
          </div>

          {searchQuery && filteredItems.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-1.5 text-xs text-gray-400">
                {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''}
              </div>
              <div className="space-y-1">
                {filteredItems.map((item, index) => (
                  <button 
                    key={index} 
                    className="flex items-start w-full px-4 py-2 text-left hover:bg-[#161616]"
                    onClick={() => handleItemClick(item)}
                  >
                    <div>
                      <div className="text-sm text-gray-200">
                        {item.section} › {item.item}
                      </div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {searchQuery && filteredItems.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              <div className="text-sm">No results found for "{searchQuery}"</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
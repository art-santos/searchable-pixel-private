"use client"

import * as React from "react"
import { SearchIcon, Command } from "lucide-react"
import { cn } from "@/lib/utils"

// Type definition for documentation items
type DocItem = {
  section: string
  item: string
  sectionId: string
  description: string
  keywords: string
}

// Documentation sections and items for search
const DOC_ITEMS: DocItem[] = [
  {
    section: "Getting Started",
    item: "Installation",
    sectionId: "installation", 
    description: "Package installation with npm, yarn, or pnpm",
    keywords: "installation install npm yarn pnpm package manager setup"
  },
  {
    section: "Getting Started",
    item: "Configuration", 
    sectionId: "configuration",
    description: "API key setup and basic configuration",
    keywords: "configuration setup api key environment variables auth"
  },
  {
    section: "API Reference",
    item: "trackCrawlerVisit()",
    sectionId: "js-api",
    description: "Main function for tracking AI crawler visits",
    keywords: "trackcrawlervisit api function main tracking method"
  },
  {
    section: "API Reference",
    item: "SplitAnalytics Class",
    sectionId: "js-api-advanced", 
    description: "Advanced usage with SplitAnalytics class",
    keywords: "splitanalytics class advanced usage constructor methods"
  },
  {
    section: "API Reference",
    item: "Utility Functions",
    sectionId: "js-api-utils",
    description: "Helper functions like ping() for testing",
    keywords: "utility functions ping helpers testing validation"
  },
  {
    section: "Crawlers & Detection",
    item: "Supported Crawlers",
    sectionId: "supported-crawlers",
    description: "List of 25+ supported AI crawlers and bots",
    keywords: "supported crawlers bots ai detection gptbot claudebot bingbot"
  },
  {
    section: "Help & Support", 
    item: "Troubleshooting",
    sectionId: "troubleshooting",
    description: "Common issues and solutions",
    keywords: "troubleshooting problems issues errors solutions help"
  },
  {
    section: "Platform Integration",
    item: "Platform Guides",
    sectionId: "platform-guides",
    description: "Integration guides for different platforms",
    keywords: "platform integration guides framework setup"
  },
  {
    section: "Platform Integration",
    item: "Next.js",
    sectionId: "nextjs",
    description: "Next.js middleware integration guide",
    keywords: "nextjs next.js middleware app router pages integration"
  },
  {
    section: "Platform Integration",
    item: "Node.js",
    sectionId: "nodejs", 
    description: "Node.js and Express server integration",
    keywords: "nodejs node.js express server backend integration"
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

  const handleItemClick = (item: DocItem) => {
    onNavigate?.(item.sectionId)
    setIsSearchOpen(false)
    setSearchQuery("")
  }

  return (
    <div className="flex items-center w-full">
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
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
      
      <div className="flex items-center w-full h-10 px-2">
        <SearchIcon className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
        <div className="relative flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <input
              type="text"
              placeholder="Search docs..."
              className="bg-transparent border-none outline-none text-gray-200 placeholder-gray-400 w-full font-sans text-sm pr-2 truncate"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchOpen(true)}
            />
            <div className="flex items-center h-5 border border-[#2F2F2F] bg-[#1C1C1C] px-1.5 text-gray-400 flex-shrink-0">
              <Command className="h-2.5 w-2.5" />
              <span className="text-xs mx-0.5">+</span>
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
          className="fixed left-1/2 -translate-x-1/2 top-[72px] w-[560px] border border-[#222222] bg-[#0c0c0c] rounded-lg shadow-2xl transform transition-all duration-300 ease-out"
          style={{
            transformOrigin: "top",
            transform: `translate(-50%, ${isSearchOpen ? '0' : '-12px'}) scale(${isSearchOpen ? '1' : '0.98'})`,
            opacity: isSearchOpen ? 1 : 0,
          }}
        >
          <div className="flex items-center h-16 px-4 border-b border-[#222222]">
            <SearchIcon className="h-5 w-5 text-gray-400 mr-3 transition-colors duration-200" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search documentation..."
              className="flex-1 bg-transparent border-none outline-none text-gray-200 placeholder-gray-400 text-xl font-sans transition-all duration-200 focus:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="flex items-center h-7 border border-[#2F2F2F] bg-[#1C1C1C] px-2 text-gray-400 rounded transition-all duration-200 hover:border-[#3F3F3F]">
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
                    className="flex items-start w-full px-4 py-2 text-left hover:bg-[#161616] transition-all duration-150 ease-out hover:transform hover:translateX(2px)"
                    onClick={() => handleItemClick(item)}
                    style={{ 
                      animationDelay: `${index * 50}ms`,
                      animation: isSearchOpen ? 'fadeInUp 0.3s ease-out forwards' : 'none'
                    }}
                  >
                    <div>
                      <div className="text-sm text-gray-200 transition-colors duration-200">
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
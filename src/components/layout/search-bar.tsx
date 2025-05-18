"use client"

import * as React from "react"
import { SearchIcon, Command } from "lucide-react"
import { cn } from "@/lib/utils"

// Navigation items with their paths and descriptions
const NAV_ITEMS = [
  {
    path: "Dashboard",
    subpath: "Visibility Overview",
    description: "Real-time LLM visibility metrics and trends",
    keywords: "dashboard metrics analytics visibility overview stats statistics perplexity llm ai"
  },
  {
    path: "Dashboard",
    subpath: "Topic Analysis",
    description: "Analyze content topics and LLM relevance",
    keywords: "topics analysis content relevance llm ai themes categories"
  },
  {
    path: "Site Audit",
    subpath: "AEO Score",
    description: "Technical analysis of your site's LLM readiness",
    keywords: "audit aeo score technical analysis readiness check site"
  },
  {
    path: "Site Audit",
    subpath: "Technical Issues",
    description: "Review and fix AEO-related problems",
    keywords: "audit technical issues problems fixes errors warnings aeo"
  },
  {
    path: "Content",
    subpath: "Generated Articles",
    description: "AI-optimized content and publishing workflow",
    keywords: "content articles blog posts generation ai writing"
  },
  {
    path: "Content",
    subpath: "llms.txt Editor",
    description: "Configure LLM crawler behavior",
    keywords: "llms txt editor configuration crawler settings rules"
  },
  {
    path: "Settings",
    subpath: "API Configuration",
    description: "Manage API keys and endpoints",
    keywords: "settings api keys configuration endpoints integration"
  }
]

export function SearchBar() {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  // Filter navigation items based on search query
  const filteredItems = searchQuery
    ? NAV_ITEMS.filter(item => {
        const searchLower = searchQuery.toLowerCase()
        return (
          item.path.toLowerCase().includes(searchLower) ||
          item.subpath.toLowerCase().includes(searchLower) ||
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

  return (
    <div className="flex items-center w-[240px]">
      <div className="flex items-center w-full rounded-md h-10 px-2">
        <SearchIcon className="h-4 w-4 text-gray-400 mr-1.5" />
        <div className="relative flex-1">
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Search for or jump to"
              className="bg-transparent border-none outline-none text-gray-200 placeholder-gray-400 w-full font-sans"
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
              placeholder="Search for or jump to"
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
                  >
                    <div>
                      <div className="text-sm text-gray-200">
                        {item.path} › {item.subpath}
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
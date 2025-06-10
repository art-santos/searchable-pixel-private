"use client"

import * as React from "react"
import { SearchIcon, Command } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

// Real navigation items from the actual app structure
const NAV_ITEMS = [
  // Dashboard Section
  {
    path: "Dashboard",
    subpath: "Overview",
    href: "/dashboard",
    description: "Main dashboard with welcome card, crawler stats, and quick actions",
    keywords: "dashboard overview home main crawler stats analytics welcome quick actions"
  },
  {
    path: "Dashboard",
    subpath: "Attribution Overview",
    href: "/dashboard/attribution",
    description: "AI crawler attribution insights and trends",
    keywords: "attribution ai crawler insights trends perplexity chatgpt claude bots overview analytics"
  },
  {
    path: "Dashboard",
    subpath: "Attribution by Source",
    href: "/dashboard/attribution/source",
    description: "Crawler attribution grouped by company/source",
    keywords: "attribution source company crawler openai anthropic google perplexity meta microsoft"
  },
  {
    path: "Dashboard",
    subpath: "Attribution by Page",
    href: "/dashboard/attribution/page",
    description: "Most crawled pages and their attribution metrics",
    keywords: "attribution page crawled visits bots paths urls traffic"
  },
  {
    path: "Dashboard",
    subpath: "Snapshots",
    href: "/dashboard/snapshot",
    description: "AI visibility testing - check if your content appears in AI model responses",
    keywords: "snapshots visibility testing ai models responses citations perplexity chatgpt claude"
  },
  {
    path: "Dashboard", 
    subpath: "Snapshot History",
    href: "/dashboard/snapshot",
    description: "View all your previous snapshot tests and results",
    keywords: "snapshot history results tests visibility ai models previous past"
  },
  
  // Settings Section
  {
    path: "Settings",
    subpath: "Account Settings",
    href: "/settings",
    description: "Manage your account, billing, workspaces, and preferences",
    keywords: "settings account billing workspaces preferences profile subscription"
  },
  {
    path: "Settings",
    subpath: "Profile Settings",
    href: "/profile",
    description: "Update your personal profile information and preferences",
    keywords: "profile personal information preferences name email avatar"
  },
  {
    path: "Settings",
    subpath: "API Keys",
    href: "/api-keys",
    description: "Manage your API keys and integrations",
    keywords: "api keys integration access tokens authentication"
  },
  
  // Authentication Section  
  {
    path: "Auth",
    subpath: "Sign In",
    href: "/login",
    description: "Sign in to your Split account",
    keywords: "login sign in authentication auth signin"
  },
  {
    path: "Auth",
    subpath: "Sign Up", 
    href: "/signup",
    description: "Create a new Split account",
    keywords: "signup sign up register create account new"
  },
  {
    path: "Auth",
    subpath: "Reset Password",
    href: "/reset-password",
    description: "Reset your account password",
    keywords: "reset password forgot password recovery"
  },
  
  // Workspace Management
  {
    path: "Workspace",
    subpath: "Create Workspace",
    href: "/create-workspace", 
    description: "Create a new workspace for your organization",
    keywords: "create workspace organization team new setup"
  },
  
  // Marketing Pages
  {
    path: "Marketing",
    subpath: "Home Page",
    href: "/",
    description: "Split homepage with product overview and features",
    keywords: "home homepage landing page product overview features"
  },
  {
    path: "Marketing",
    subpath: "Get Started",
    href: "/start",
    description: "Get started with Split - onboarding and setup guide",
    keywords: "get started onboarding setup guide tutorial"
  },
  
  // Additional Features
  {
    path: "Features",
    subpath: "Waitlist",
    href: "/waitlist",
    description: "Join the waitlist for early access",
    keywords: "waitlist early access beta preview"
  },
  
  // Quick Actions (from Welcome Card)
  {
    path: "Quick Actions",
    subpath: "Crawler Attribution",
    href: "/dashboard/attribution",
    description: "View detailed AI crawler attribution insights",
    keywords: "quick action crawler attribution insights analytics detailed"
  },
  {
    path: "Quick Actions", 
    subpath: "Analytics Dashboard",
    href: "/dashboard",
    description: "View crawler trends and statistics",
    keywords: "quick action analytics dashboard trends statistics crawler"
  },
  {
    path: "Quick Actions",
    subpath: "Account Settings",
    href: "/settings", 
    description: "Manage billing, workspaces & preferences",
    keywords: "quick action account settings billing workspaces preferences"
  },
  
  // Support & Resources
  {
    path: "Support",
    subpath: "Help & Support",
    href: "/support",
    description: "Get help and support for Split",
    keywords: "help support documentation faq assistance"
  },
  {
    path: "Support",
    subpath: "What's New",
    href: "/changelog",
    description: "View latest updates and changelog",
    keywords: "changelog updates new features release notes"
  },
  
  // Testing & Development
  {
    path: "Testing",
    subpath: "Test Tracking",
    href: "/test-tracking",
    description: "Test your tracking implementation",
    keywords: "test tracking implementation debug crawler analytics"
  },
  {
    path: "Testing",
    subpath: "Examples",
    href: "/examples",
    description: "View implementation examples and code samples",
    keywords: "examples implementation code samples documentation"
  }
]

export function SearchBar() {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const router = useRouter()

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
      }).slice(0, 8) // Limit to 8 results for better UX
    : []

  const handleItemClick = (item: typeof NAV_ITEMS[0]) => {
    router.push(item.href)
    setIsSearchOpen(false)
    setSearchQuery("")
  }

  const handleKeyDown = (e: React.KeyboardEvent, item?: typeof NAV_ITEMS[0]) => {
    if (e.key === 'Enter' && item) {
      handleItemClick(item)
    }
  }

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
          className="fixed left-1/2 -translate-x-1/2 top-[72px] w-[560px] border border-[#222222] bg-[#0c0c0c] transform transition-all duration-200 ease-out rounded-lg overflow-hidden"
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filteredItems.length > 0) {
                  handleItemClick(filteredItems[0])
                }
              }}
            />
            <div className="flex items-center h-7 border border-[#2F2F2F] bg-[#1C1C1C] px-2 text-gray-400">
              <span className="text-xs font-mono uppercase tracking-wider">ESC</span>
            </div>
          </div>

          {searchQuery && filteredItems.length > 0 && (
            <div className="py-2 max-h-[400px] overflow-y-auto">
              <div className="px-4 py-1.5 text-xs text-gray-400">
                {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''}
              </div>
              <div className="space-y-1">
                {filteredItems.map((item, index) => (
                  <button 
                    key={`${item.path}-${item.subpath}-${index}`}
                    className="flex items-start w-full px-4 py-3 text-left hover:bg-[#161616] transition-colors group"
                    onClick={() => handleItemClick(item)}
                    onKeyDown={(e) => handleKeyDown(e, item)}
                  >
                    <div className="flex-1">
                      <div className="text-sm text-gray-200 group-hover:text-white transition-colors">
                        {item.path} › {item.subpath}
                      </div>
                      <div className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors mt-1">
                        {item.description}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      Enter
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {searchQuery && filteredItems.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              <div className="text-sm">No results found for "{searchQuery}"</div>
              <div className="text-xs text-gray-600 mt-1">Try searching for pages, features, or actions</div>
            </div>
          )}

          {!searchQuery && (
            <div className="py-6 px-4">
              <div className="text-xs text-gray-400 mb-3">Popular destinations</div>
              <div className="space-y-2">
                {NAV_ITEMS.filter(item => 
                  item.subpath === "Overview" || 
                  item.subpath === "Attribution Overview" || 
                  item.subpath === "Snapshots" ||
                  item.subpath === "Account Settings"
                ).map((item, index) => (
                  <button
                    key={`popular-${index}`}
                    className="flex items-center w-full px-2 py-2 text-left hover:bg-[#161616] rounded transition-colors group"
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="text-sm text-gray-300 group-hover:text-white transition-colors">
                      {item.path} › {item.subpath}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
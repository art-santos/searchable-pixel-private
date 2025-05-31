'use client'

import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserProfile {
  workspace_name: string | null
  domain?: string | null
}

export function DomainSelector() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [faviconUrl, setFaviconUrl] = useState<string>('/images/split-icon-white.svg')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Get display domain from profile or fallback
  const getDisplayDomain = () => {
    if (loading) return "Loading..."
    if (profile?.domain) return profile.domain
    if (profile?.workspace_name) return `${profile.workspace_name.toLowerCase().replace(/\s+/g, '')}.com`
    return "your-domain.com"
  }

  // Fetch user profile and domain data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user || !supabase) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('workspace_name, domain')
          .eq('id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error)
        }

        setProfile(data || { workspace_name: null, domain: null })
      } catch (err) {
        console.error('Error in profile fetch:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user, supabase])

  // Load favicon when domain changes
  useEffect(() => {
    const domain = profile?.domain || (profile?.workspace_name ? `${profile.workspace_name.toLowerCase().replace(/\s+/g, '')}.com` : null)
    
    if (domain && domain !== "your-domain.com") {
      // Use Google's favicon service directly for simplicity and reliability
      const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
      setFaviconUrl(googleFaviconUrl)
    } else {
      setFaviconUrl('/images/split-icon-white.svg')
    }
  }, [profile])

  return (
    <div className="flex items-start">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="w-fit border border-[#333333] bg-transparent hover:bg-[#1a1a1a] px-2 rounded-none"
          >
            <div className="flex items-center gap-2">
              <div className="relative w-5 h-5 flex-shrink-0 flex items-center justify-center">
                <img 
                  src={faviconUrl}
                  alt={getDisplayDomain()}
                  width={20} 
                  height={20}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/images/split-icon-white.svg'
                  }}
                />
              </div>
              <span className="font-geist-semi text-white">{getDisplayDomain()}</span>
              <ChevronDown className="h-4 w-4 text-[#666666]" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="bg-[#1a1a1a] border border-[#333333] text-white rounded-none"
          align="start"
          alignOffset={-1}
        >
          <DropdownMenuItem className="hover:bg-[#222222] cursor-not-allowed opacity-50 rounded-none">
            <div className="flex items-center gap-2">
              <span className="text-sm">Connect additional domains (coming soon)</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
} 
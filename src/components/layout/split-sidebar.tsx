"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { useState, useEffect } from "react"
import { getUserInitials } from '@/lib/profile/avatar'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboardIcon,
  SettingsIcon,
  Activity,
  HelpCircleIcon,
  Users,
  Camera,
    Crown,
  PanelLeft,
  PanelRight,
} from "lucide-react"
import Image from 'next/image'

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface UserProfile {
  id: string
  username?: string
  full_name?: string
  email?: string
  profile_picture_url?: string
  company_domain?: string
  company_category?: string
  updated_at?: string
  is_admin?: boolean
}

interface SplitSidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

export function SplitSidebar({ isCollapsed = false, onToggle }: SplitSidebarProps) {
  const { user, supabase } = useAuth()
  const { currentWorkspace } = useWorkspace()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showUpgrade] = useState(true)

  const pathname = usePathname()

  // Fetch user profile when user changes
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching profile:', error)
        } else {
          setProfile(data)
        }

        // Check if user is admin (has @split.dev email and admin verification OR is_admin=true)
        const hasAdminEmail = user.email?.endsWith('@split.dev')
        const adminVerified = localStorage.getItem('admin_verified') === 'true'
        const hasAdminRole = data?.is_admin === true
        
        setIsAdmin((hasAdminEmail && adminVerified) || hasAdminRole)
      } catch (error) {
        console.error('Error in fetchProfile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  // Generate user initials
  const initials = getUserInitials(
    profile?.full_name?.split(' ')[0] || profile?.username,
    profile?.full_name?.split(' ')[1],
    user?.email
  )

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon, exact: true },
    { href: "/dashboard/attribution", label: "Attribution", icon: Activity },
    ...(isAdmin ? [{ href: "/dashboard/leads", label: "Leads", icon: Users }] : []),
    { href: "/dashboard/snapshot", label: "Snapshot", icon: Camera },
  ]

  const secondaryItems = [
    { href: "/settings", label: "Settings", icon: SettingsIcon },
    { href: "/docs", label: "Help", icon: HelpCircleIcon },
  ]

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <div className={cn(
      "h-screen max-h-screen flex flex-col transition-all duration-300 ease-out overflow-hidden bg-white border-r border-gray-100",
      isCollapsed ? "w-[72px]" : "w-60"
    )}>
      {/* Header - Consistent height and smooth transitions */}
      <div className="flex-shrink-0 border-b border-gray-50">
        <div className={cn(
          "h-[76px] flex items-center relative",
          isCollapsed ? "justify-center px-4" : "px-4"
        )}>
          <div className={cn(
            isCollapsed ? "" : "pl-3"
          )}>
            <Image
              src="/images/split-icon-black.svg"
              alt="Split"
              width={32}
              height={32}
              className="h-7 w-7 transition-transform duration-500 ease-out transform-gpu cursor-pointer"
              style={{
                transformStyle: 'preserve-3d'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'rotateY(180deg)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'rotateY(0deg)'
              }}
            />
          </div>
          
          {/* Collapse button - only in expanded state, positioned absolutely */}
          {!isCollapsed && (
            <button
              onClick={onToggle}
              className="absolute right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all duration-200 ease-out"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
        
      {/* Scrollable Content Area - Only this section scrolls */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        <div className={cn(
          "py-4 transition-all duration-300 ease-out",
          isCollapsed ? "px-2" : "px-4"
        )}>
          {/* Main Navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href, item.exact)
              
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "group relative flex items-center transition-all duration-200 ease-out cursor-pointer rounded-lg",
                      "hover:bg-gray-50 active:scale-[0.98]",
                      active 
                        ? "bg-gray-100 text-gray-900 shadow-sm" 
                        : "text-gray-600 hover:text-gray-900",
                      isCollapsed 
                        ? "h-11 w-11 justify-center mx-auto mb-1" 
                        : "h-11 px-3 gap-3"
                    )}
                  >
                    <Icon className={cn(
                      "shrink-0 transition-all duration-200 ease-out",
                      isCollapsed ? "h-5 w-5" : "h-5 w-5",
                      active ? "text-gray-700" : ""
                    )} />
                    
                    {/* Label with smooth fade */}
                    <span className={cn(
                      "font-medium text-sm transition-all duration-300 ease-out truncate",
                      isCollapsed ? "opacity-0 scale-95 w-0 overflow-hidden" : "opacity-100 scale-100"
                    )}>
                      {item.label}
                    </span>
                    
                    {/* Elegant tooltip - positioned outside sidebar */}
                    {isCollapsed && (
                      <div className="absolute left-[84px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out pointer-events-none z-[100] group-hover:translate-x-1">
                        <div className="bg-gray-900 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-lg border border-gray-800 whitespace-nowrap">
                          {item.label}
                          {/* Tooltip arrow */}
                          <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 border-l border-t border-gray-800 rotate-45"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Elegant separator */}
          <div className={cn(
            "my-6 transition-all duration-300 ease-out",
            isCollapsed ? "mx-auto w-6 h-px bg-gray-200" : "mx-2 h-px bg-gray-200"
          )} />

          {/* Secondary Navigation - Settings & Help */}
          <nav className="space-y-1">
            {secondaryItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "group relative flex items-center transition-all duration-200 ease-out cursor-pointer rounded-lg",
                      "hover:bg-gray-50 active:scale-[0.98]",
                      active 
                        ? "bg-gray-100 text-gray-900 shadow-sm" 
                        : "text-gray-600 hover:text-gray-900",
                      isCollapsed 
                        ? "h-11 w-11 justify-center mx-auto mb-1" 
                        : "h-11 px-3 gap-3"
                    )}
                  >
                    <Icon className={cn(
                      "shrink-0 transition-all duration-200 ease-out",
                      isCollapsed ? "h-5 w-5" : "h-5 w-5",
                      active ? "text-gray-700" : ""
                    )} />
                    
                    {/* Label with smooth fade */}
                    <span className={cn(
                      "font-medium text-sm transition-all duration-300 ease-out truncate",
                      isCollapsed ? "opacity-0 scale-95 w-0 overflow-hidden" : "opacity-100 scale-100"
                    )}>
                      {item.label}
                    </span>
                    
                    {/* Elegant tooltip - positioned outside sidebar */}
                    {isCollapsed && (
                      <div className="absolute left-[84px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out pointer-events-none z-[100] group-hover:translate-x-1">
                        <div className="bg-gray-900 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-lg border border-gray-800 whitespace-nowrap">
                          {item.label}
                          {/* Tooltip arrow */}
                          <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 border-l border-t border-gray-800 rotate-45"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Upgrade Card - Inside scrollable area */}
          <div className={cn(
            "transition-all duration-300 ease-out mt-6 overflow-hidden",
            isCollapsed ? "opacity-0 max-h-0" : "opacity-100"
          )}>
            {showUpgrade && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg shadow-sm">
                      <Crown className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">Upgrade to Pro</span>
                  </div>
                  
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Get unlimited lead credits and advanced attribution insights
                  </p>
                  
                  <Button 
                    size="sm" 
                    className="w-full bg-gray-900 text-white hover:bg-gray-800 text-xs font-medium h-9 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
                    asChild
                  >
                    <Link href="/settings/billing">
                      Upgrade now
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Profile Section - Always visible at bottom */}
      <div className={cn(
        "flex-shrink-0 border-t border-gray-50 transition-all duration-300 ease-out",
        isCollapsed ? "p-3" : "p-4"
      )}>
        <Link href="/settings" className={cn(isCollapsed ? "flex justify-center" : "")}>
          <div className={cn(
            "group relative flex items-center transition-all duration-200 ease-out cursor-pointer hover:bg-gray-50 rounded-lg active:scale-[0.98]",
            isCollapsed ? "h-11 w-11 justify-center" : "h-12 px-3 gap-3"
          )}>
            <Avatar className={cn(
              "ring-2 ring-transparent hover:ring-gray-200 transition-all duration-200 ease-out shrink-0",
              isCollapsed ? "h-8 w-8" : "h-9 w-9"
            )}>
              <AvatarImage 
                src={profile?.profile_picture_url || undefined} 
                alt="Profile"
              />
              <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            {/* Profile info - only render when expanded */}
            {!isCollapsed && (
              <div className="flex-1 min-w-0 transition-all duration-300 ease-out">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {profile?.full_name || profile?.username || 'User'}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {user?.email}
                </div>
              </div>
            )}
            
            {/* Profile tooltip - elegant and outside */}
            {isCollapsed && (
              <div className="absolute left-[84px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out pointer-events-none z-[100] group-hover:translate-x-1">
                <div className="bg-gray-900 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-lg border border-gray-800 whitespace-nowrap">
                  <div className="font-medium">{profile?.full_name || 'Profile'}</div>
                  <div className="text-gray-300 text-[10px]">{user?.email}</div>
                  {/* Tooltip arrow */}
                  <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 border-l border-t border-gray-800 rotate-45"></div>
                </div>
              </div>
            )}
          </div>
        </Link>
      </div>
    </div>
  )
} 
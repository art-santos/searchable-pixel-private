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
  X,
} from "lucide-react"
import Image from 'next/image'

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar"


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

export function SplitSidebar() {
  const { user, supabase } = useAuth()
  const { currentWorkspace } = useWorkspace()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(true)

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
    <Sidebar className="w-60 border-r border-gray-200 bg-white pt-4">
      {/* Header - Same height as topbar */}
      <SidebarHeader className="p-0">
        <div className="h-[60px] bg-white flex items-center px-4 w-full">
          {/* Logo - Left Aligned */}
          <div className="flex items-center justify-start flex-1">
            <Image
              src="/images/split-icon-black.svg"
              alt="Split"
              width={28}
              height={28}
              className="h-7 w-7 ml-3 transition-transform duration-500 ease-out transform-gpu cursor-pointer"
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
          
          {/* Profile - Right Aligned */}
          <div className="flex items-center justify-end">
            <Link href="/settings">
              <Avatar className="h-8 w-8 mr-3 cursor-pointer hover:ring-2 hover:ring-gray-200 transition-all">
                <AvatarImage 
                  src={profile?.profile_picture_url || undefined} 
                  alt="Profile"
                />
                <AvatarFallback className="bg-gray-100 text-gray-600 text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </SidebarHeader>
        
        {/* Navigation */}
        <SidebarContent className="flex flex-col h-full bg-white px-2 sm:px-4">
                    <div className="flex-1 pt-4 pb-4">
            <nav className="space-y-0.5">
              {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href, item.exact)
              
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                      "hover:bg-gray-50 hover:text-gray-900",
                      active 
                        ? "bg-gray-100 text-gray-900" 
                        : "text-gray-600"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                </Link>
              )
            })}
          </nav>

          <div className="h-px bg-gray-200 mx-4 my-4" />

          <nav className="space-y-0.5">
            {secondaryItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                      "hover:bg-gray-50 hover:text-gray-900",
                      active 
                        ? "bg-gray-100 text-gray-900" 
                        : "text-gray-600"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Upgrade Card */}
        {showUpgrade && (
          <div className="p-3">
            <div className="relative bg-gray-50 border border-gray-200 p-4">
              <button 
                onClick={() => setShowUpgrade(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center bg-gray-200">
                    <Crown className="h-4 w-4 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Upgrade to Pro</span>
                </div>
                
                <p className="text-xs text-gray-600 leading-relaxed pr-4">
                  Get unlimited lead credits and advanced attribution insights
                </p>
                
                <Button 
                  size="sm" 
                  className="w-full bg-gray-900 text-white hover:bg-gray-800 text-xs font-medium h-8"
                  asChild
                >
                  <Link href="/settings/billing">
                    Upgrade now
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  )
} 
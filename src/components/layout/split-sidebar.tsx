"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { useState, useEffect } from "react"
import { getUserInitials } from '@/lib/profile/avatar'
import {
  LayoutDashboardIcon,
  SearchIcon,
  SettingsIcon,
  Activity,
  KeyIcon,
  HelpCircleIcon,
  Users,
  Camera,
} from "lucide-react"
import Image from 'next/image'

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChevronRight,
  BarChart3,
  Search,
  FileText,
  Settings,
  ChevronsUpDown,
  LogOut,
  User,
  Crown,
  Sparkles,
  Eye,
  Zap,
  Target,
  TrendingUp,
  Globe,
  Bot,
  Layers,
  Gauge,
  FileSearch,
  PenTool,
  Code,
  Cog,
  ExternalLink,
} from "lucide-react"

interface UserProfile {
  id: string
  username?: string
  full_name?: string
  email?: string
  profile_picture_url?: string
  company_domain?: string
  company_category?: string
  updated_at?: string
}

export function SplitSidebar() {
  const { user, supabase } = useAuth()
  const { currentWorkspace } = useWorkspace()
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const pathname = usePathname()

  // Fetch user profile when user changes
  useEffect(() => {
    if (!user || !supabase) {
      setProfile(null)
      return
    }

    const fetchProfile = async () => {
      try {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error)
        }

        if (profileData) {
          setProfile(profileData)
        } else {
          // If no profile exists yet, create default profile with user ID
          setProfile({ id: user.id })
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
      }
    }

    fetchProfile()
  }, [user, supabase])

  // Generate user initials
  const initials = getUserInitials(
    profile?.full_name?.split(' ')[0] || profile?.username,
    profile?.full_name?.split(' ')[1],
    user?.email
  )

  return (
    <TooltipProvider delayDuration={100}>
      <style jsx global>{`
        .icon-rotate {
          transition: transform 0.5s ease-out;
          transform-style: preserve-3d;
          perspective: 1000px;
        }
        .menu-button:hover .icon-rotate {
          transform: rotateY(180deg);
        }
        .dark .selected-button:hover {
          background-color: #222222 !important;
        }
        .selected-button:hover {
          background-color: #f3f4f6 !important;
        }
        .dark .selected-button svg {
          color: white;
        }
        .selected-button svg {
          color: black;
        }
      `}</style>
      <Sidebar className="w-16 border-r border-gray-200 dark:border-[#222222] bg-white dark:bg-[#0c0c0c] !bg-white dark:!bg-[#0c0c0c]">
        {/* Logo Square */}
        <SidebarHeader className="box-border h-16 w-16 min-h-[64px] min-w-[64px] border-r border-b border-gray-200 dark:border-[#222222] bg-white dark:bg-[#0c0c0c] flex items-center justify-center">
          <Image
            src="/images/split-icon-white.svg"
            alt="Split Logo"
            width={32}
            height={32}
            className="h-8 w-8 dark:block hidden"
          />
          <Image
            src="/images/split-icon-black.svg"
            alt="Split Logo"
            width={32}
            height={32}
            className="h-8 w-8 dark:hidden block"
          />
        </SidebarHeader>
        
        {/* Main Menu Items */}
        <SidebarContent className="flex flex-col items-center py-2 space-y-1 bg-white dark:bg-[#0c0c0c]">
          <Link href="/dashboard" className="w-full flex justify-center">
            <SidebarMenuButton 
              tooltip="Dashboard"
              className={cn(
                "w-10 h-10 flex items-center justify-center transition-colors rounded-none menu-button",
                pathname === "/dashboard" 
                  ? "bg-gray-100 dark:bg-[#222222] text-black dark:text-white border border-gray-300 dark:border-[#333333] selected-button" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#161616] hover:text-gray-800 dark:hover:text-gray-200"
              )}
            >
              <LayoutDashboardIcon className="h-6 w-6 icon-rotate" />
            </SidebarMenuButton>
          </Link>

          <Link href="/dashboard/attribution" className="w-full flex justify-center">
            <SidebarMenuButton 
              tooltip="AI Attribution"
              className={cn(
                "w-10 h-10 flex items-center justify-center transition-colors rounded-none menu-button",
                pathname.startsWith("/dashboard/attribution") 
                  ? "bg-gray-100 dark:bg-[#222222] text-black dark:text-white border border-gray-300 dark:border-[#333333] selected-button"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#161616] hover:text-gray-800 dark:hover:text-gray-200"
              )}
            >
              <Activity className="h-6 w-6 icon-rotate" />
            </SidebarMenuButton>
          </Link>

          {process.env.NEXT_PUBLIC_LEADS_ENABLED === 'true' && (
            <Link href="/dashboard/leads" className="w-full flex justify-center">
              <SidebarMenuButton 
                tooltip="Leads"
                className={cn(
                  "w-10 h-10 flex items-center justify-center transition-colors rounded-none menu-button",
                  pathname === "/dashboard/leads" 
                    ? "bg-gray-100 dark:bg-[#222222] text-black dark:text-white border border-gray-300 dark:border-[#333333] selected-button"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#161616] hover:text-gray-800 dark:hover:text-gray-200"
                )}
              >
                <Users className="h-6 w-6 icon-rotate" />
              </SidebarMenuButton>
            </Link>
          )}

          <Link href="/dashboard/snapshot" className="w-full flex justify-center">
            <SidebarMenuButton 
              tooltip="Snapshot"
              className={cn(
                "w-10 h-10 flex items-center justify-center transition-colors rounded-none menu-button",
                pathname === "/dashboard/snapshot" 
                  ? "bg-gray-100 dark:bg-[#222222] text-black dark:text-white border border-gray-300 dark:border-[#333333] selected-button"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#161616] hover:text-gray-800 dark:hover:text-gray-200"
              )}
            >
              <Camera className="h-6 w-6 icon-rotate" />
            </SidebarMenuButton>
          </Link>
        </SidebarContent>

        {/* Bottom Menu Items */}
        <div className="mt-auto flex flex-col items-center space-y-1 pb-2 bg-white dark:bg-[#0c0c0c]">
          <Link href="/settings" className="w-full flex justify-center">
            <SidebarMenuButton 
              tooltip="Settings"
              className={cn(
                "w-10 h-10 flex items-center justify-center transition-colors rounded-none menu-button",
                pathname === "/settings" 
                  ? "bg-gray-100 dark:bg-[#222222] text-black dark:text-white border border-gray-300 dark:border-[#333333] selected-button" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#161616] hover:text-gray-800 dark:hover:text-gray-200"
              )}
            >
              <SettingsIcon className="h-6 w-6 icon-rotate" />
            </SidebarMenuButton>
          </Link>

          <div className="w-full flex justify-center">
            <SidebarMenuButton 
              tooltip="Documentation (Coming Soon)"
              className={cn(
                "w-10 h-10 flex items-center justify-center transition-colors rounded-none cursor-not-allowed",
                "text-gray-500 dark:text-gray-600"
              )}
            >
              <HelpCircleIcon className="h-6 w-6" />
            </SidebarMenuButton>
          </div>
        </div>
        
        {/* Profile Square - Now links to settings */}
        <SidebarFooter className="h-16 w-16 border-t border-r border-gray-200 dark:border-[#222222] bg-white dark:bg-[#0c0c0c] flex items-center justify-center">
          <Link href="/settings" className="w-full h-full flex items-center justify-center">
            <Avatar className="h-10 w-10 border border-gray-300 dark:border-[#333333] cursor-pointer hover:border-gray-400 dark:hover:border-[#444444] transition-colors">
              <AvatarImage 
                src={profile?.profile_picture_url || undefined} 
                alt={`${profile?.username || 'User'}'s profile picture`}
              />
              <AvatarFallback className="bg-gray-100 dark:bg-[#222222] text-gray-600 dark:text-gray-400">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  )
} 
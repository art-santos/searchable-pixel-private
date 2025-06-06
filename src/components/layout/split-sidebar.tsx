"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from '@/hooks/use-user'
import { getUserInitials } from '@/lib/profile/avatar'
import {
  LayoutDashboardIcon,
  SearchIcon,
  SettingsIcon,
  Activity,
  KeyIcon,
  HelpCircleIcon,
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
  SidebarProvider,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

export function SplitSidebar() {
  const pathname = usePathname()
  const { user, profile } = useUser()

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
        .selected-button:hover {
          background-color: #222222 !important;
        }
        .selected-button svg {
          color: white;
        }
      `}</style>
      <Sidebar className="w-16 border-r border-[#222222] bg-[#0c0c0c] !bg-[#0c0c0c] dark:!bg-[#0c0c0c]">
        {/* Logo Square */}
        <SidebarHeader className="box-border h-16 w-16 min-h-[64px] min-w-[64px] border-r border-b border-[#222222] bg-[#0c0c0c] flex items-center justify-center">
          <Image
            src="/images/split-icon-white.svg"
            alt="Split Logo"
            width={32}
            height={32}
            className="h-8 w-8"
          />
        </SidebarHeader>
        
        {/* Main Menu Items */}
        <SidebarContent className="flex flex-col items-center py-2 space-y-1 bg-[#0c0c0c]">
          <Link href="/dashboard" className="w-full flex justify-center">
            <SidebarMenuButton 
              tooltip="Dashboard"
              className={cn(
                "w-10 h-10 flex items-center justify-center transition-colors rounded-none menu-button",
                pathname === "/dashboard" 
                  ? "bg-[#222222] text-white border border-[#333333] selected-button" 
                  : "text-gray-400 hover:bg-[#161616] hover:text-gray-200"
              )}
            >
              <LayoutDashboardIcon className="h-6 w-6 icon-rotate" />
            </SidebarMenuButton>
          </Link>

          <Link href="/dashboard" className="w-full flex justify-center">
            <SidebarMenuButton 
              tooltip="AI Attribution"
              className={cn(
                "w-10 h-10 flex items-center justify-center transition-colors rounded-none menu-button",
                pathname === "/attribution" 
                  ? "bg-[#222222] text-white border border-[#333333] selected-button"
                  : "text-gray-400 hover:bg-[#161616] hover:text-gray-200"
              )}
            >
              <Activity className="h-6 w-6 icon-rotate" />
            </SidebarMenuButton>
          </Link>
        </SidebarContent>

        {/* Bottom Menu Items */}
        <div className="mt-auto flex flex-col items-center space-y-1 pb-2 bg-[#0c0c0c]">
          <Link href="/settings" className="w-full flex justify-center">
            <SidebarMenuButton 
              tooltip="Settings"
              className={cn(
                "w-10 h-10 flex items-center justify-center transition-colors rounded-none menu-button",
                pathname === "/settings" 
                  ? "bg-[#222222] text-white border border-[#333333] selected-button" 
                  : "text-gray-400 hover:bg-[#161616] hover:text-gray-200"
              )}
            >
              <SettingsIcon className="h-6 w-6 icon-rotate" />
            </SidebarMenuButton>
          </Link>

          <Link href="https://docs.split.dev" className="w-full flex justify-center">
            <SidebarMenuButton 
              tooltip="Documentation"
              className={cn(
                "w-10 h-10 flex items-center justify-center transition-colors rounded-none menu-button",
                "text-gray-400 hover:bg-[#161616] hover:text-gray-200"
              )}
            >
              <HelpCircleIcon className="h-6 w-6 icon-rotate" />
            </SidebarMenuButton>
          </Link>
        </div>
        
        {/* Profile Square - Now links to settings */}
        <SidebarFooter className="h-16 w-16 border-t border-r border-[#222222] bg-[#0c0c0c] flex items-center justify-center">
          <Link href="/settings" className="w-full h-full flex items-center justify-center">
            <Avatar className="h-10 w-10 border border-[#333333] cursor-pointer hover:border-[#444444] transition-colors">
              <AvatarImage 
                src={profile?.profile_picture_url || undefined} 
                alt={`${profile?.username || 'User'}'s profile picture`}
              />
              <AvatarFallback className="bg-[#222222] text-gray-400">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  )
} 
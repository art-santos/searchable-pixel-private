"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboardIcon,
  SearchIcon,
  SettingsIcon,
  GlobeIcon,
  KeyIcon,
  HelpCircleIcon,
  FileTextIcon,
  LogOutIcon,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function SplitSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { setUser, supabase } = useAuth()

  const handleLogout = async () => {
    // Sign out from Supabase (this will clear auth cookies)
    await supabase?.auth.signOut()
    // Clear the user state
    setUser(null)
    // Redirect to landing page
    router.push('/')
  }

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

          <Link href="/visibility" className="w-full flex justify-center">
            <SidebarMenuButton 
              tooltip="Visibility"
              className={cn(
                "w-10 h-10 flex items-center justify-center transition-colors rounded-none menu-button",
                pathname === "/visibility" 
                  ? "bg-[#222222] text-white border border-[#333333] selected-button"
                  : "text-gray-400 hover:bg-[#161616] hover:text-gray-200"
              )}
            >
              <GlobeIcon className="h-6 w-6 icon-rotate" />
            </SidebarMenuButton>
          </Link>

          <Link href="/visibility-test" className="w-full flex justify-center">
            <SidebarMenuButton
              tooltip="Visibility Test"
              className={cn(
                "w-10 h-10 flex items-center justify-center transition-colors rounded-none menu-button",
                pathname === "/visibility-test"
                  ? "bg-[#222222] text-white border border-[#333333] selected-button"
                  : "text-gray-400 hover:bg-[#161616] hover:text-gray-200"
              )}
            >
              <GlobeIcon className="h-6 w-6 icon-rotate" />
            </SidebarMenuButton>
          </Link>

          <Link href="/site-audit" className="w-full flex justify-center">
            <SidebarMenuButton 
              tooltip="Site Audit"
              className={cn(
                "w-10 h-10 flex items-center justify-center transition-colors rounded-none menu-button",
                pathname === "/site-audit" 
                  ? "bg-[#222222] text-white border border-[#333333] selected-button" 
                  : "text-gray-400 hover:bg-[#161616] hover:text-gray-200"
              )}
            >
              <SearchIcon className="h-6 w-6 icon-rotate" />
            </SidebarMenuButton>
          </Link>

          <Link href="/content" className="w-full flex justify-center">
            <SidebarMenuButton 
              tooltip="Content"
              className={cn(
                "w-10 h-10 flex items-center justify-center transition-colors rounded-none menu-button",
                pathname === "/content" 
                  ? "bg-[#222222] text-white border border-[#333333] selected-button" 
                  : "text-gray-400 hover:bg-[#161616] hover:text-gray-200"
              )}
            >
              <FileTextIcon className="h-6 w-6 icon-rotate" />
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

          <Link href="/docs" className="w-full flex justify-center">
            <SidebarMenuButton 
              tooltip="Documentation"
              className={cn(
                "w-10 h-10 flex items-center justify-center transition-colors rounded-none menu-button",
                pathname === "/docs" 
                  ? "bg-[#222222] text-white border border-[#333333] selected-button" 
                  : "text-gray-400 hover:bg-[#161616] hover:text-gray-200"
              )}
            >
              <HelpCircleIcon className="h-6 w-6 icon-rotate" />
            </SidebarMenuButton>
          </Link>
        </div>
        
        {/* Profile Square */}
        <SidebarFooter className="h-16 w-16 border-t border-r border-[#222222] bg-[#0c0c0c] flex items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-10 w-10 border border-[#333333] cursor-pointer hover:border-[#444444] transition-colors">
            <AvatarImage src="/placeholder-user.jpg" alt="User" />
            <AvatarFallback className="bg-[#222222] text-gray-400">SH</AvatarFallback>
          </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[#161616] border-[#333333]">
              <DropdownMenuItem 
                className="text-gray-200 hover:bg-[#222222] cursor-pointer flex items-center gap-2"
                onClick={handleLogout}
              >
                <LogOutIcon className="h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  )
} 
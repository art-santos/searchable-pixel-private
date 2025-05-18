"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboardIcon,
  SearchIcon,
  SettingsIcon,
  GlobeIcon,
  KeyIcon,
  HelpCircleIcon,
  FileTextIcon,
} from "lucide-react"

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
} from "@/components/ui/sidebar"

export function SplitSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="w-16 border-r border-[#222222] bg-[#0c0c0c] !bg-[#0c0c0c] dark:!bg-[#0c0c0c]">
      {/* Logo Square */}
      <SidebarHeader className="box-border h-16 w-16 min-h-[64px] min-w-[64px] border-r border-b border-[#222222] bg-[#0c0c0c] flex items-center justify-center">
        <img src="/split-icon-white.svg" width={32} height={32} alt="Split Logo" />
      </SidebarHeader>
      
      {/* Main Menu Items */}
      <SidebarContent className="flex flex-col items-center py-2 space-y-1 bg-[#0c0c0c]">
        <Link href="/dashboard" className="w-full flex justify-center">
          <SidebarMenuButton 
            className={cn(
              "w-10 h-10 flex items-center justify-center transition-colors rounded-none",
              pathname === "/dashboard" 
                ? "bg-[#222222] text-white border border-[#333333]" 
                : "text-gray-400 hover:bg-[#161616] hover:text-gray-200"
            )}
          >
            <LayoutDashboardIcon className="h-6 w-6" />
          </SidebarMenuButton>
        </Link>

        <Link href="/visibility" className="w-full flex justify-center">
          <SidebarMenuButton 
            className={cn(
              "w-10 h-10 flex items-center justify-center transition-colors rounded-none",
              pathname === "/visibility" 
                ? "bg-[#222222] text-white border border-[#333333]" 
                : "text-gray-400 hover:bg-[#161616] hover:text-gray-200"
            )}
          >
            <GlobeIcon className="h-6 w-6" />
          </SidebarMenuButton>
        </Link>

        <Link href="/site-audit" className="w-full flex justify-center">
          <SidebarMenuButton 
            className={cn(
              "w-10 h-10 flex items-center justify-center transition-colors rounded-none",
              pathname === "/site-audit" 
                ? "bg-[#222222] text-white border border-[#333333]" 
                : "text-gray-400 hover:bg-[#161616] hover:text-gray-200"
            )}
          >
            <SearchIcon className="h-6 w-6" />
          </SidebarMenuButton>
        </Link>

        <Link href="/content" className="w-full flex justify-center">
          <SidebarMenuButton 
            className={cn(
              "w-10 h-10 flex items-center justify-center transition-colors rounded-none",
              pathname === "/content" 
                ? "bg-[#222222] text-white border border-[#333333]" 
                : "text-gray-400 hover:bg-[#161616] hover:text-gray-200"
            )}
          >
            <FileTextIcon className="h-6 w-6" />
          </SidebarMenuButton>
        </Link>
      </SidebarContent>

      {/* Bottom Menu Items */}
      <div className="mt-auto flex flex-col items-center space-y-1 pb-2 bg-[#0c0c0c]">
        <Link href="/settings" className="w-full flex justify-center">
          <SidebarMenuButton 
            className={cn(
              "w-10 h-10 flex items-center justify-center transition-colors rounded-none",
              pathname === "/settings" 
                ? "bg-[#222222] text-white border border-[#333333]" 
                : "text-gray-400 hover:bg-[#161616] hover:text-gray-200"
            )}
          >
            <SettingsIcon className="h-6 w-6" />
          </SidebarMenuButton>
        </Link>

        <Link href="/api-keys" className="w-full flex justify-center">
          <SidebarMenuButton 
            className={cn(
              "w-10 h-10 flex items-center justify-center transition-colors rounded-none",
              pathname === "/api-keys" 
                ? "bg-[#222222] text-white border border-[#333333]" 
                : "text-gray-400 hover:bg-[#161616] hover:text-gray-200"
            )}
          >
            <KeyIcon className="h-6 w-6" />
          </SidebarMenuButton>
        </Link>

        <Link href="/docs" className="w-full flex justify-center">
          <SidebarMenuButton 
            className={cn(
              "w-10 h-10 flex items-center justify-center transition-colors rounded-none",
              pathname === "/docs" 
                ? "bg-[#222222] text-white border border-[#333333]" 
                : "text-gray-400 hover:bg-[#161616] hover:text-gray-200"
            )}
          >
            <HelpCircleIcon className="h-6 w-6" />
          </SidebarMenuButton>
        </Link>
      </div>
      
      {/* Profile Square */}
      <SidebarFooter className="h-16 w-16 border-t border-r border-[#222222] bg-[#0c0c0c] flex items-center justify-center">
        <Avatar className="h-10 w-10 border border-[#333333]">
          <AvatarImage src="/placeholder-user.jpg" alt="User" />
          <AvatarFallback className="bg-[#222222] text-gray-400">SH</AvatarFallback>
        </Avatar>
      </SidebarFooter>
    </Sidebar>
  )
} 
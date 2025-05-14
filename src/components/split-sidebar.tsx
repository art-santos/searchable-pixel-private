"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboardIcon,
  FileTextIcon,
  SearchIcon,
  ActivityIcon,
  SettingsIcon,
  BotIcon,
  PlusCircleIcon,
  DatabaseIcon,
  ClipboardListIcon,
  FileIcon,
  MoreHorizontalIcon,
  HelpCircleIcon,
  ArrowUpCircleIcon,
  MailIcon,
  UsersIcon,
  GlobeIcon,
  BarChartIcon,
  FolderIcon
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar"

export function SplitSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="border-r border-[#222222] bg-[#0c0c0c] !bg-[#0c0c0c] dark:!bg-[#0c0c0c]" style={{ backgroundColor: '#0c0c0c' }}>
      <SidebarHeader className="border-b border-[#222222] px-2 bg-[#0c0c0c]">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="flex items-center gap-2 hover:bg-transparent cursor-default hover:text-current pointer-events-none">
              <img src="/split-icon-white.svg" width={24} height={24} alt="Split Logo" />
              <span className="text-base font-semibold text-white">Split</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent className="px-2 bg-[#0c0c0c]">
        {/* MONITORING SECTION */}
        <SidebarGroup>
          <div className="px-3 py-2 text-xs font-medium text-gray-400">
            MONITORING
          </div>
          <SidebarGroupContent className="py-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/dashboard" passHref legacyBehavior>
                  <SidebarMenuButton 
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
                      pathname === "/dashboard" 
                        ? "bg-[#222222] text-white" 
                        : "text-gray-400 hover:bg-[#161616] hover:text-gray-200"
                    )}
                  >
                    <LayoutDashboardIcon className="h-5 w-5" />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/performance-reports" passHref legacyBehavior>
                  <SidebarMenuButton 
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
                      pathname === "/performance-reports" 
                        ? "bg-[#222222] text-white" 
                        : "text-gray-400 hover:bg-[#161616] hover:text-gray-200"
                    )}
                  >
                    <BarChartIcon className="h-5 w-5" />
                    <span>Visibility</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* TOOLS SECTION */}
        <SidebarGroup>
          <div className="px-3 py-2 text-xs font-medium text-gray-400">
            TOOLS
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/site-audit" passHref legacyBehavior>
                  <SidebarMenuButton 
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
                      pathname === "/site-audit" 
                        ? "bg-[#222222] text-white" 
                        : "text-gray-400 hover:bg-[#161616] hover:text-gray-200"
                    )}
                  >
                    <SearchIcon className="h-5 w-5" />
                    <span>Site Audit</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/content-strategy" passHref legacyBehavior>
                  <SidebarMenuButton 
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
                      pathname === "/content-strategy" 
                        ? "bg-[#222222] text-white" 
                        : "text-gray-400 hover:bg-[#161616] hover:text-gray-200"
                    )}
                  >
                    <FileTextIcon className="h-5 w-5" />
                    <span>Content Strategy</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/site-connector" passHref legacyBehavior>
                  <SidebarMenuButton 
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
                      pathname === "/site-connector" 
                        ? "bg-[#222222] text-white" 
                        : "text-gray-400 hover:bg-[#161616] hover:text-gray-200"
                    )}
                  >
                    <GlobeIcon className="h-5 w-5" />
                    <span>Site Connector</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      {/* SETTINGS SECTION - Moved to bottom */}
      <div className="mt-auto px-2 bg-[#0c0c0c] pb-4">
        <SidebarGroup>
          <div className="px-3 py-2 text-xs font-medium text-gray-400">
            SETTINGS
          </div>
          <SidebarGroupContent className="py-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/settings" passHref legacyBehavior>
                  <SidebarMenuButton 
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
                      pathname === "/settings" 
                        ? "bg-[#222222] text-white" 
                        : "text-gray-400 hover:bg-[#161616] hover:text-gray-200"
                    )}
                  >
                    <SettingsIcon className="h-5 w-5" />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/team" passHref legacyBehavior>
                  <SidebarMenuButton 
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
                      pathname === "/team" 
                        ? "bg-[#222222] text-white" 
                        : "text-gray-400 hover:bg-[#161616] hover:text-gray-200"
                    )}
                  >
                    <UsersIcon className="h-5 w-5" />
                    <span>Team</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className="text-gray-400 hover:bg-[#161616] hover:text-gray-200 flex items-center gap-3 rounded-md px-3 py-2 transition-colors"
                >
                  <HelpCircleIcon className="h-5 w-5" />
                  <span>Get Help</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </div>
      
      <SidebarFooter className="border-t border-[#222222] p-4 bg-[#0c0c0c]">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-[#333333]">
            <AvatarImage src="/placeholder-user.jpg" alt="User" />
            <AvatarFallback className="bg-[#222222] text-gray-400">SH</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-white">Split User</p>
            <p className="text-xs text-gray-400 truncate">user@split.dev</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
} 
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  Search,
  Activity,
  Settings,
  ChevronRight
} from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()
  
  const navItems = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: <LayoutDashboard className="h-5 w-5" /> 
    },
    { 
      name: 'Content Strategy', 
      href: '/content-strategy', 
      icon: <FileText className="h-5 w-5" /> 
    },
    { 
      name: 'Site Audit', 
      href: '/site-audit', 
      icon: <Search className="h-5 w-5" /> 
    },
    { 
      name: 'Agent Activity', 
      href: '/agent-activity', 
      icon: <Activity className="h-5 w-5" /> 
    },
    { 
      name: 'Settings', 
      href: '/settings', 
      icon: <Settings className="h-5 w-5" /> 
    },
  ]
  
  return (
    <aside className="fixed inset-y-0 left-0 w-64 border-r border-[#222222] bg-[#0c0c0c] z-10">
      <div className="flex h-14 items-center border-b border-[#222222] px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/images/split-icon-white.svg" width={24} height={24} alt="Split Logo" />
          <span className="text-lg font-medium text-white">Split</span>
        </Link>
      </div>
      
      <nav className="flex flex-col gap-0.5 p-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
              pathname === item.href 
                ? "bg-[#222222] text-white" 
                : "text-gray-400 hover:bg-[#161616] hover:text-gray-200"
            )}
          >
            {item.icon}
            <span>{item.name}</span>
            {pathname === item.href && (
              <ChevronRight className="ml-auto h-4 w-4 text-gray-400" />
            )}
          </Link>
        ))}
      </nav>
      
      <div className="absolute bottom-4 left-0 right-0 px-4">
        <div className="rounded-md border border-[#222222] bg-[#161616] p-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[#222222] flex items-center justify-center">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">AEO Agent</p>
              <p className="text-xs text-gray-400">Active</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
} 
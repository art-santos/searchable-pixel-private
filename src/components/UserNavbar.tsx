'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import Image from 'next/image'

export function UserNavbar() {
  const { user, supabase } = useAuth()
  const pathname = usePathname()
  
  const handleSignOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }
  
  const navItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Content', href: '/content' },
    { name: 'Analytics', href: '/analytics' },
    { name: 'Projects', href: '/projects' },
  ]
  
  return (
    <header className="border-b border-[#222222] bg-[#0c0c0c]">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center">
          <Link href="/landing-page" className="text-lg font-medium text-white flex items-center gap-2 mr-8">
            <Image src="/split-icon-white.svg" width={20} height={20} alt="Split Logo" />
            <span>Split</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-gray-200",
                  pathname === item.href ? "text-white" : "text-gray-400"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center mr-4">
            <span className="text-sm text-gray-400">
              {user?.email?.split('@')[0] || 'User'}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="px-3 py-1.5 text-sm bg-transparent border border-[#333333] text-white hover:bg-[#161616] rounded transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  )
} 
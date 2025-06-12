'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { 
  Home, 
  Users, 
  LogOut,
  User
} from 'lucide-react'

interface AdminSidebarProps {
  user: any
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { href: '/admin/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/admin/users', icon: Users, label: 'Users' },
  ]

  const isActiveLink = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === '/admin' || pathname === '/admin/dashboard'
    }
    return pathname.startsWith(href)
  }

  const handleLogout = () => {
    // Clear admin verification
    localStorage.removeItem('admin_verified')
    localStorage.removeItem('admin_verified_at')
    // Redirect to login
    router.push('/login')
  }

  return (
    <div className="fixed left-0 top-0 w-64 bg-[#0c0c0c] border-r border-[#1a1a1a] h-screen flex flex-col z-50">
      {/* Header */}
      <div className="p-6 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
            <Image src="/images/split-icon-white.svg" width={20} height={20} alt="Split Logo" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Admin Panel</h2>
            <p className="text-xs text-[#666666]">Split.dev</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = isActiveLink(item.href)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className="block"
              >
                <motion.div
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-[#0c0c0c]'
                      : 'text-[#888888] hover:text-white hover:bg-[#1a1a1a]'
                  }`}
                  whileHover={!isActive ? { x: 2 } : {}}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </motion.div>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* User Info at Bottom */}
      <div className="border-t border-[#1a1a1a] p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1a1a1a] rounded-md flex items-center justify-center">
            <User className="w-5 h-5 text-[#666666]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {user?.email || 'admin@split.dev'}
            </div>
            <div className="text-xs text-[#666666]">Administrator</div>
          </div>
        </div>
        
        {/* Logout Button */}
        <motion.button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-[#888888] hover:text-white hover:bg-[#1a1a1a] transition-colors"
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </motion.button>
      </div>
    </div>
  )
} 
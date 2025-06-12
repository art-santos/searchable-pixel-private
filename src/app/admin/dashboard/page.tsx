'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminDashboardContent } from '@/components/admin/admin-dashboard-content'

export default function AdminDashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        // Check if user is authenticated
        const { data: { user }, error } = await supabase?.auth.getUser() || { data: { user: null }, error: null }
        
        if (error || !user) {
          router.push('/login')
          return
        }

        // Check if user has @split.dev email
        if (!user.email?.endsWith('@split.dev')) {
          router.push('/dashboard')
          return
        }

        // Check if admin password was verified recently (within 24 hours)
        const adminVerified = localStorage.getItem('admin_verified')
        const adminVerifiedAt = localStorage.getItem('admin_verified_at')
        
        if (!adminVerified || adminVerified !== 'true') {
          router.push('/admin/verify')
          return
        }

        if (adminVerifiedAt) {
          const verifiedTime = new Date(adminVerifiedAt)
          const now = new Date()
          const hoursSinceVerification = (now.getTime() - verifiedTime.getTime()) / (1000 * 60 * 60)
          
          // Require re-verification after 24 hours
          if (hoursSinceVerification > 24) {
            localStorage.removeItem('admin_verified')
            localStorage.removeItem('admin_verified_at')
            router.push('/admin/verify')
            return
          }
        }

        setUser(user)
      } catch (error) {
        console.error('Error checking admin access:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminAccess()
  }, [router, supabase])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
        <div className="text-white">Loading admin dashboard...</div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c]">
      <AdminSidebar user={user} />
      <div className="ml-64">
        <AdminDashboardContent user={user} />
      </div>
    </div>
  )
} 
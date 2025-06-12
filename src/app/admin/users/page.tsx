'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Users, AlertCircle, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'

interface UserData {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  phone_number: string | null
  workspace_name: string | null
  domain: string | null
  subscription_plan: string | null
  created_at?: string
}

export default function AdminUsersPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [users, setUsers] = useState<UserData[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)
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
        await fetchUsers()
      } catch (error) {
        console.error('Error checking admin access:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminAccess()
  }, [router, supabase])

  const fetchUsers = async () => {
    try {
      setError(null)
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      console.log('🔍 Attempting to fetch users...')

      // Try to fetch users with error handling
      const { data, error, count } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone_number,
          workspace_name,
          domain,
          subscription_plan,
          created_at
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      console.log('📊 Fetch result:', { data, error, count })

      if (error) {
        console.error('❌ Error fetching users:', error)
        setError(`Database Error: ${error.message}. This may be due to Row Level Security policies. Please ensure admin access is properly configured.`)
        return
      }

      console.log('✅ Successfully fetched users:', data?.length || 0)
      setUsers(data || [])
    } catch (err: any) {
      console.error('❌ Unexpected error fetching users:', err)
      setError(`Unexpected Error: ${err.message}`)
    }
  }

  const filteredUsers = users.filter(user => 
    `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.workspace_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.domain?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getSubscriptionBadge = (plan: string | null) => {
    switch (plan?.toLowerCase()) {
      case 'pro':
        return <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">Pro</div>
      case 'team':
        return <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">Team</div>
      case 'starter':
        return <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">Starter</div>
      default:
        return <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-[#1a1a1a] text-[#888888] border border-[#333333]">Free</div>
    }
  }

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
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-white" />
                <h1 className="text-3xl font-bold text-white">User List</h1>
                <div className="px-2 py-1 bg-[#1a1a1a] border border-[#333333] rounded-md text-xs text-[#888888]">
                  {users.length} users
                </div>
              </div>
              <motion.button
                onClick={fetchUsers}
                className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] text-white rounded-md text-sm font-medium transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </motion.button>
            </div>
            
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#666666] w-4 h-4" />
              <Input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#111111] border-[#222222] text-white placeholder:text-[#666666] focus:border-[#333333] rounded-md"
              />
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-6 bg-red-900/10 border border-red-500/20 rounded-md"
            >
              <div className="flex items-start gap-3 text-red-400">
                <AlertCircle className="w-6 h-6 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium mb-1">Error Loading Users</h3>
                  <p className="text-sm opacity-90">{error}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Users Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-[#111111] border-[#222222]">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-[#222222]">
                      <tr className="text-left">
                        <th className="px-6 py-4 text-sm font-medium text-[#888888]">Name</th>
                        <th className="px-6 py-4 text-sm font-medium text-[#888888]">Email</th>
                        <th className="px-6 py-4 text-sm font-medium text-[#888888]">Phone</th>
                        <th className="px-6 py-4 text-sm font-medium text-[#888888]">Company</th>
                        <th className="px-6 py-4 text-sm font-medium text-[#888888]">Domain</th>
                        <th className="px-6 py-4 text-sm font-medium text-[#888888]">Subscription Tier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222222]">
                      {filteredUsers.map((user, index) => (
                        <motion.tr 
                          key={user.id}
                          className="hover:bg-[#0a0a0a] transition-colors"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 * index }}
                        >
                          <td className="px-6 py-4">
                            <div className="text-sm text-white font-medium">
                              {user.first_name && user.last_name 
                                ? `${user.first_name} ${user.last_name}`
                                : user.first_name || user.last_name || 'N/A'
                              }
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-[#888888]">{user.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-[#888888]">{user.phone_number || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-[#888888]">{user.workspace_name || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-[#888888]">{user.domain || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4">
                            {getSubscriptionBadge(user.subscription_plan)}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {filteredUsers.length === 0 && !error && (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-[#333333] mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">No users found</h3>
                      <p className="text-[#666666]">
                        {searchTerm ? 'Try adjusting your search criteria' : 'No users have registered yet'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
} 
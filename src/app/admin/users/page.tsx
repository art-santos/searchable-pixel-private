'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Users, AlertCircle, RefreshCw } from 'lucide-react'

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
        return <Badge className="bg-blue-500 text-white hover:bg-blue-500">Pro</Badge>
      case 'team':
        return <Badge className="bg-purple-500 text-white hover:bg-purple-500">Team</Badge>
      case 'starter':
        return <Badge className="bg-green-500 text-white hover:bg-green-500">Starter</Badge>
      default:
        return <Badge className="bg-gray-500 text-white hover:bg-gray-500">Free</Badge>
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-white" />
                <h1 className="text-3xl font-bold text-white">User List</h1>
                <Badge className="bg-gray-700 text-white">
                  {users.length} users
                </Badge>
              </div>
              <button
                onClick={fetchUsers}
                className="flex items-center gap-2 px-4 py-2 bg-[#161616] border border-[#333333] text-white hover:bg-[#222] rounded-md transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
            
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#161616] border-[#333333] text-white"
              />
            </div>
          </div>

          {error && (
            <div className="mb-6 p-6 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-start gap-3 text-red-400">
                <AlertCircle className="w-6 h-6 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-2">Database Access Error</div>
                  <p className="text-sm mb-4">{error}</p>
                  <div className="text-xs text-red-300">
                    <p className="mb-2"><strong>Possible solutions:</strong></p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Run the admin access migration in Supabase dashboard</li>
                      <li>Ensure @split.dev email access policies are configured</li>
                      <li>Check that Row Level Security allows admin access</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Table */}
          <Card className="bg-[#161616] border border-[#333333]">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#222] border-b border-[#333333]">
                    <tr>
                      <th className="text-left p-4 font-medium text-white">Name</th>
                      <th className="text-left p-4 font-medium text-white">Email</th>
                      <th className="text-left p-4 font-medium text-white">Phone</th>
                      <th className="text-left p-4 font-medium text-white">Company</th>
                      <th className="text-left p-4 font-medium text-white">Domain</th>
                      <th className="text-left p-4 font-medium text-white">Subscription Tier</th>
                      <th className="text-left p-4 font-medium text-white">Join Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((userData, index) => (
                        <tr key={userData.id} className={`border-b border-[#333333] hover:bg-[#222] transition-colors ${index % 2 === 0 ? 'bg-[#161616]' : 'bg-[#1a1a1a]'}`}>
                          <td className="p-4 text-white font-medium">
                            {`${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'N/A'}
                          </td>
                          <td className="p-4 text-gray-300">
                            {userData.email}
                          </td>
                          <td className="p-4 text-gray-300">
                            {userData.phone_number || 'N/A'}
                          </td>
                          <td className="p-4 text-gray-300">
                            {userData.workspace_name || 'N/A'}
                          </td>
                          <td className="p-4 text-gray-300">
                            {userData.domain || 'N/A'}
                          </td>
                          <td className="p-4">
                            {getSubscriptionBadge(userData.subscription_plan)}
                          </td>
                          <td className="p-4 text-gray-300">
                            {userData.created_at ? new Date(userData.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-400">
                          {error ? 'Unable to load users due to database access error' : 'No users found'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Footer Stats */}
          {users.length > 0 && (
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Showing {filteredUsers.length} of {users.length} total users
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  TrendingUp,
  DollarSign,
  RefreshCw
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'

interface AdminDashboardContentProps {
  user: any
}

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalWorkspaces: number
  totalApiKeys: number
  currentMrr: number
  lastUpdated: string
}

interface ChartData {
  date: string
  users: number
  mrr: number
}

const PLAN_PRICES = {
  starter: 30,
  pro: 100,
  team: 400
}

export function AdminDashboardContent({ user }: AdminDashboardContentProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalWorkspaces: 0,
    totalApiKeys: 0,
    currentMrr: 0,
    lastUpdated: new Date().toISOString()
  })
  const [userGrowthData, setUserGrowthData] = useState<ChartData[]>([])
  const [mrrData, setMrrData] = useState<ChartData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      console.log('🔍 Fetching admin dashboard stats...')

      // Fetch total users count
      const { count: totalUsersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Fetch all profiles to calculate active users and user growth
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, created_by, created_at, last_snapshot_reset_at, last_articles_reset_at, subscription_status, subscription_plan')

      // Fetch workspaces for creation date
      const { data: workspaces, error: workspacesError } = await supabase
        .from('workspaces')
        .select('id, user_id, created_at, is_primary')

      if (workspacesError) {
        console.error('Error fetching workspaces:', workspacesError)
        throw new Error('Could not fetch workspaces')
      }

      // Fetch workspaces count
      const { count: workspaceCount, error: workspaceError } = await supabase
        .from('workspaces')
        .select('*', { count: 'exact', head: true })

      // Fetch API keys count
      const { count: apiKeyCount, error: apiKeyError } = await supabase
        .from('api_keys')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      // Fetch subscription info for MRR calculation
      const { data: subscriptionInfo, error: subscriptionError } = await supabase
        .from('subscription_info')
        .select('plan_type, plan_status, current_period_start, user_id')
        .eq('plan_status', 'active')

      // Calculate stats
      const totalUsers = totalUsersCount || 0
      const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
      
      // Calculate active users (those with recent activity within last 72 hours)
      const activeUsers = profiles?.filter(profile => {
        const lastSnapshot = profile.last_snapshot_reset_at
        const lastArticle = profile.last_articles_reset_at
        
        return (lastSnapshot && lastSnapshot > seventyTwoHoursAgo) || 
               (lastArticle && lastArticle > seventyTwoHoursAgo)
      }).length || 0

      // Calculate current MRR from profiles with active subscriptions
      const currentMrr = profiles?.reduce((total, profile) => {
        if (profile.subscription_status === 'active' && profile.subscription_plan) {
          const planPrice = PLAN_PRICES[profile.subscription_plan as keyof typeof PLAN_PRICES]
          return total + (planPrice || 0)
        }
        return total
      }, 0) || 0

      console.log('📊 Debug - Current MRR calculation:', {
        currentMrr,
        activeProfiles: profiles?.filter(p => p.subscription_status === 'active').map(p => ({
          plan: p.subscription_plan,
          status: p.subscription_status,
          created_at: p.created_at
        }))
      })

      // Generate daily user growth data
      const userGrowthChartData = generateDailyUserGrowthData(profiles || [])
      
      // Generate daily MRR data
      const mrrChartData = generateDailyMrrData(profiles || [], subscriptionInfo || [])

      setStats({
        totalUsers,
        activeUsers,
        totalWorkspaces: workspaceCount || 0,
        totalApiKeys: apiKeyCount || 0,
        currentMrr,
        lastUpdated: new Date().toISOString()
      })

      setUserGrowthData(userGrowthChartData)
      setMrrData(mrrChartData)

      console.log('✅ Dashboard stats updated:', {
        totalUsers,
        activeUsers,
        currentMrr,
        userGrowthDataPoints: userGrowthChartData.length,
        mrrDataPoints: mrrChartData.length,
        sampleUserGrowth: userGrowthChartData.slice(-5), // Last 5 days
        sampleMrr: mrrChartData.slice(-5), // Last 5 days
        actualUserData: userGrowthChartData.filter(d => d.users > 0).slice(0, 5),
        actualMrrData: mrrChartData.filter(d => d.mrr > 0).slice(0, 5)
      })

      // Debug: Log the actual chart data that will be rendered
      console.log('📊 Chart Data Debug:', {
        userGrowthSample: userGrowthChartData.slice(0, 3),
        mrrSample: mrrChartData.slice(0, 3),
        userGrowthHasData: userGrowthChartData.some(d => d.users > 0),
        mrrHasData: mrrChartData.some(d => d.mrr > 0),
        userGrowthTotal: userGrowthChartData.reduce((sum, d) => sum + d.users, 0),
        mrrTotal: mrrChartData.reduce((sum, d) => sum + d.mrr, 0)
      })

    } catch (err: any) {
      console.error('❌ Error fetching dashboard stats:', err)
      setError(`Failed to load dashboard data: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const generateDailyUserGrowthData = (profiles: any[]): ChartData[] => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 30)
    const chartData: ChartData[] = []

    console.log('📅 Generating user growth data:', {
      profilesCount: profiles.length,
      profilesWithCreatedAt: profiles.filter(p => p.created_at).length,
      sampleDates: profiles.slice(0, 3).map(p => p.created_at)
    })

    // Generate daily data points
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const currentDate = new Date(date)
      currentDate.setHours(23, 59, 59, 999)
      const dateString = currentDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
      
      const usersCreatedByThisDate = profiles.filter(profile => {
        if (!profile.created_at) return false
        const createdDate = new Date(profile.created_at)
        return createdDate <= currentDate
      }).length

      chartData.push({
        date: dateString,
        users: usersCreatedByThisDate,
        mrr: 0
      })
    }
    
    console.log('📊 User growth data sample:', {
      maxUsers: Math.max(...chartData.map(d => d.users)),
      minUsers: Math.min(...chartData.map(d => d.users)),
      nonZeroPoints: chartData.filter(d => d.users > 0).length
    })

    return chartData
  }

  const generateDailyMrrData = (profiles: any[], subscriptionInfo: any[]): ChartData[] => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 30)
    const chartData: ChartData[] = []

    console.log('💰 Generating MRR data:', {
      activeSubscriptionCount: profiles.filter(p => p.subscription_status === 'active').length,
      profilesWithCreatedAt: profiles.filter(p => p.created_at).length
    })
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const currentDate = new Date(date)
      currentDate.setHours(23, 59, 59, 999)
      const dateString = currentDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
      
      const mrrForDate = profiles.filter(profile => {
        if (profile.subscription_status !== 'active' || !profile.subscription_plan) return false
        
        if (!profile.created_at) return false
        const createdDate = new Date(profile.created_at)

        // For MRR, we'll use created_at as the subscription start (simplified approach)
        return createdDate <= currentDate
      }).reduce((total, profile) => {
        const planPrice = PLAN_PRICES[profile.subscription_plan as keyof typeof PLAN_PRICES]
        return total + (planPrice || 0)
      }, 0)

      chartData.push({
        date: dateString,
        users: 0,
        mrr: mrrForDate
      })
    }

    const mrrWithValues = chartData.filter(d => d.mrr > 0)
    console.log('📈 MRR data sample:', {
      maxMrr: Math.max(...chartData.map(d => d.mrr)),
      minMrr: Math.min(...chartData.map(d => d.mrr)),
      nonZeroMrrPoints: mrrWithValues.length,
      firstNonZero: mrrWithValues[0]
    })

    return chartData
  }

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  return (
    <div className="p-8 bg-[#0c0c0c] min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Main Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <motion.button
              onClick={fetchDashboardStats}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] text-white rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </motion.button>
            <div className="text-xs text-[#666666]">
              Last updated: {new Date(stats.lastUpdated).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-900/10 border border-red-500/20 rounded-md"
        >
          <p className="text-red-400 text-sm">{error}</p>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-[#111111] border-[#222222] hover:border-[#333333] transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#888888]">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-[#666666]">Registered accounts</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-[#111111] border-[#222222] hover:border-[#333333] transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#888888]">Active Users</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.activeUsers.toLocaleString()}</div>
              <p className="text-xs text-[#666666]">Last 72 hours</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-[#111111] border-[#222222] hover:border-[#333333] transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#888888]">Monthly Recurring Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">${stats.currentMrr.toLocaleString()}</div>
              <p className="text-xs text-[#666666]">Current active subscriptions</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-[#111111] border-[#222222] hover:border-[#333333] transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#888888]">Total Workspaces</CardTitle>
              <Users className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalWorkspaces.toLocaleString()}</div>
              <p className="text-xs text-[#666666]">Active workspaces</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="space-y-8">
        {/* User Growth Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-[#111111] border-[#222222] w-full">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white">Daily User Growth</CardTitle>
              <p className="text-[#888888] text-sm">Cumulative registered users over last 30 days</p>
            </CardHeader>
            <CardContent>
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={userGrowthData.length > 0 ? userGrowthData : [{ date: '1/1', users: 0, mrr: 0 }]} 
                    margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#666666"
                      fontSize={11}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      interval={Math.floor(Math.max(1, userGrowthData.length / 10))}
                    />
                    <YAxis 
                      stroke="#666666"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#111111', 
                        border: '1px solid #222222',
                        borderRadius: '6px',
                        color: 'white'
                      }}
                      formatter={(value) => [value, 'Users']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', strokeWidth: 1, r: 3 }}
                      activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* MRR Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-[#111111] border-[#222222] w-full">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white">Daily Monthly Recurring Revenue</CardTitle>
              <p className="text-[#888888] text-sm">Cumulative MRR from active subscriptions over last 30 days</p>
            </CardHeader>
            <CardContent>
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={mrrData.length > 0 ? mrrData : [{ date: '1/1', users: 0, mrr: 0 }]} 
                    margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#666666"
                      fontSize={11}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      interval={Math.floor(Math.max(1, mrrData.length / 10))}
                    />
                    <YAxis 
                      stroke="#666666"
                      fontSize={12}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#111111', 
                        border: '1px solid #222222',
                        borderRadius: '6px',
                        color: 'white'
                      }}
                      formatter={(value) => [`$${value}`, 'MRR']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="mrr" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: '#10b981', strokeWidth: 1, r: 3 }}
                      activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
} 
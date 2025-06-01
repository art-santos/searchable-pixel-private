import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  PlanType, 
  FeatureType, 
  PLANS, 
  LIMITS,
  hasFeatureAccess, 
  isAtLeastPlan,
  getUpgradePath,
  formatLimit
} from '@/lib/subscription/config'
import { 
  getUserUsage, 
  checkLimit,
  type UsageData 
} from '@/lib/subscription/usage'

interface SubscriptionData {
  plan: PlanType
  status: 'free' | 'active' | 'canceled' | 'incomplete' | 'past_due' | 'trialing' | 'unpaid'
  periodEnd: Date | null
  stripeCustomerId: string | null
  isAdmin: boolean
}

interface UseSubscriptionReturn {
  // Subscription data
  subscription: SubscriptionData | null
  usage: UsageData | null
  loading: boolean
  error: Error | null
  
  // Helper methods
  hasFeature: (feature: FeatureType) => boolean
  isAtLeast: (plan: PlanType) => boolean
  canPerformAction: (feature: 'scan' | 'article', count?: number) => Promise<boolean>
  getLimit: (feature: 'scan' | 'article') => number
  getRemainingUsage: (feature: 'scan' | 'article') => number
  getUpgradeOptions: () => PlanType[]
  formatLimitDisplay: (limit: number) => string
  
  // Actions
  refresh: () => Promise<void>
  showUpgradePrompt: (reason?: string) => void
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()
  
  // Fetch subscription and usage data
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('Not authenticated')
      }
      
      setUserId(user.id)
      
      // Fetch subscription data
      const response = await fetch('/api/user/subscription')
      if (!response.ok) {
        throw new Error('Failed to fetch subscription')
      }
      
      const subData = await response.json()
      
      const subscription: SubscriptionData = {
        plan: (subData.subscriptionPlan || 'free') as PlanType,
        status: subData.subscriptionStatus || 'free',
        periodEnd: subData.subscriptionPeriodEnd ? new Date(subData.subscriptionPeriodEnd) : null,
        stripeCustomerId: subData.stripeCustomerId,
        isAdmin: subData.isAdmin || false
      }
      
      setSubscription(subscription)
      
      // Fetch usage data
      const usageData = await getUserUsage(user.id)
      setUsage(usageData)
      
    } catch (err) {
      console.error('Error in useSubscription:', err)
      setError(err as Error)
      
      // Set default free subscription on error
      setSubscription({
        plan: 'free',
        status: 'free',
        periodEnd: null,
        stripeCustomerId: null,
        isAdmin: false
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [])
  
  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(() => {
      fetchData()
    })
    
    return () => {
      authSubscription.unsubscribe()
    }
  }, [supabase])
  
  // Helper methods
  const hasFeature = (feature: FeatureType): boolean => {
    if (!subscription) return false
    // Admin override: admins have access to all features
    if (subscription.isAdmin) return true
    return hasFeatureAccess(subscription.plan, feature)
  }
  
  const isAtLeast = (plan: PlanType): boolean => {
    if (!subscription) return false
    // Admin override: admins are treated as having pro plan
    if (subscription.isAdmin) return isAtLeastPlan('pro', plan)
    return isAtLeastPlan(subscription.plan, plan)
  }
  
  const canPerformAction = async (feature: 'scan' | 'article', count: number = 1): Promise<boolean> => {
    if (!userId) return false
    
    // Admin override: admins have unlimited access
    if (subscription?.isAdmin) return true
    
    const result = await checkLimit(userId, feature, count)
    return result.allowed
  }
  
  const getLimit = (feature: 'scan' | 'article'): number => {
    if (!subscription) return 0
    
    // Admin override: admins have unlimited limits (represented as -1)
    if (subscription.isAdmin) {
      const proLimits = LIMITS['pro']
      if (feature === 'scan') {
        return proLimits.scans.max
      } else {
        return proLimits.articles.max
      }
    }
    
    const limits = LIMITS[subscription.plan]
    if (feature === 'scan') {
      return limits.scans.max
    } else {
      return limits.articles.max
    }
  }
  
  const getRemainingUsage = (feature: 'scan' | 'article'): number => {
    if (!usage) return 0
    
    // Admin override: admins have unlimited remaining usage
    if (subscription?.isAdmin) return -1 // Unlimited
    
    if (feature === 'scan') {
      return usage.scansRemaining
    } else {
      return usage.articlesRemaining
    }
  }
  
  const getUpgradeOptions = (): PlanType[] => {
    if (!subscription) return ['visibility', 'plus', 'pro']
    // Admin override: admins don't need to upgrade
    if (subscription.isAdmin) return []
    return getUpgradePath(subscription.plan)
  }
  
  const showUpgradePrompt = (reason?: string) => {
    // You can customize this to show a modal or redirect
    const params = new URLSearchParams()
    if (reason) params.set('reason', reason)
    router.push(`/settings?${params.toString()}`)
  }
  
  return {
    subscription,
    usage,
    loading,
    error,
    hasFeature,
    isAtLeast,
    canPerformAction,
    getLimit,
    getRemainingUsage,
    getUpgradeOptions,
    formatLimitDisplay: formatLimit,
    refresh: fetchData,
    showUpgradePrompt
  }
} 
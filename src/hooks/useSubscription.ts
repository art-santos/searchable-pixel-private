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
        stripeCustomerId: subData.stripeCustomerId
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
        stripeCustomerId: null
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
    return hasFeatureAccess(subscription.plan, feature)
  }
  
  const isAtLeast = (plan: PlanType): boolean => {
    if (!subscription) return false
    return isAtLeastPlan(subscription.plan, plan)
  }
  
  const canPerformAction = async (feature: 'scan' | 'article', count: number = 1): Promise<boolean> => {
    if (!userId) return false
    
    const result = await checkLimit(userId, feature, count)
    return result.allowed
  }
  
  const getLimit = (feature: 'scan' | 'article'): number => {
    if (!subscription) return 0
    
    const limits = LIMITS[subscription.plan]
    if (feature === 'scan') {
      return limits.scans.max
    } else {
      return limits.articles.max
    }
  }
  
  const getRemainingUsage = (feature: 'scan' | 'article'): number => {
    if (!usage) return 0
    
    if (feature === 'scan') {
      return usage.scansRemaining
    } else {
      return usage.articlesRemaining
    }
  }
  
  const getUpgradeOptions = (): PlanType[] => {
    if (!subscription) return ['visibility', 'plus', 'pro']
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
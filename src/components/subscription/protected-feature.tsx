'use client'

import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Lock, Sparkles, Zap, Crown } from 'lucide-react'
import { PlanType, PLANS, FeatureType } from '@/lib/subscription/config'
import { useSubscription } from '@/hooks/useSubscription'
import { motion } from 'framer-motion'

interface ProtectedFeatureProps {
  children: ReactNode
  requiredPlan?: PlanType
  feature?: FeatureType
  fallback?: ReactNode
  soft?: boolean // Show preview with overlay instead of hard block
  message?: string
}

export function ProtectedFeature({
  children,
  requiredPlan,
  feature,
  fallback,
  soft = false,
  message
}: ProtectedFeatureProps) {
  const { subscription, hasFeature, isAtLeast, showUpgradePrompt, loading } = useSubscription()
  
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-[#1a1a1a] rounded-lg"></div>
      </div>
    )
  }
  
  // Check access
  let hasAccess = true
  
  if (feature) {
    hasAccess = hasFeature(feature)
  } else if (requiredPlan) {
    hasAccess = isAtLeast(requiredPlan)
  }
  
  // If has access, render children
  if (hasAccess) {
    return <>{children}</>
  }
  
  // Get upgrade target
  const targetPlan = requiredPlan || 'plus'
  const targetPlanInfo = PLANS[targetPlan]
  
  // Get plan icon
  const getPlanIcon = (plan: PlanType) => {
    switch (plan) {
      case 'visibility':
        return <Zap className="w-5 h-5" />
      case 'plus':
        return <Sparkles className="w-5 h-5" />
      case 'pro':
        return <Crown className="w-5 h-5" />
      default:
        return <Lock className="w-5 h-5" />
    }
  }
  
  // Default message based on feature
  const getDefaultMessage = () => {
    if (message) return message
    
    if (feature) {
      switch (feature) {
        case 'generate-content':
          return 'AI content generation is available on Plus and Pro plans'
        case 'max-scan':
          return 'Deep visibility analysis with MAX scans'
        case 'competitor-analysis':
          return 'See how you compare to competitors'
        case 'multi-domain':
          return 'Track multiple domains with Pro'
        default:
          return `This feature requires ${targetPlanInfo.name} plan or higher`
      }
    }
    
    return `Upgrade to ${targetPlanInfo.name} to unlock this feature`
  }
  
  // Soft block - show preview with overlay
  if (soft) {
    return (
      <div className="relative">
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
        >
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6 max-w-sm text-center">
            <div className="w-12 h-12 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-4">
              {getPlanIcon(targetPlan)}
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              {targetPlanInfo.name} Feature
            </h3>
            <p className="text-sm text-[#888] mb-4">
              {getDefaultMessage()}
            </p>
            <Button
              onClick={() => showUpgradePrompt(feature)}
              className="bg-white text-black hover:bg-gray-100"
            >
              Upgrade to {targetPlanInfo.name}
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }
  
  // Hard block - show upgrade prompt
  if (fallback) {
    return <>{fallback}</>
  }
  
  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-8">
      <div className="max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-4">
          {getPlanIcon(targetPlan)}
        </div>
        <h2 className="text-xl font-medium text-white mb-2">
          Unlock with {targetPlanInfo.name}
        </h2>
        <p className="text-[#888] mb-6">
          {getDefaultMessage()}
        </p>
        
        {/* Feature highlights */}
        <div className="space-y-2 mb-6">
          {targetPlan === 'plus' && (
            <>
              <div className="text-sm text-[#888]">✓ Daily MAX visibility scans</div>
              <div className="text-sm text-[#888]">✓ 10 AI articles per month</div>
              <div className="text-sm text-[#888]">✓ Competitor benchmarking</div>
            </>
          )}
          {targetPlan === 'pro' && (
            <>
              <div className="text-sm text-[#888]">✓ Unlimited MAX scans</div>
              <div className="text-sm text-[#888]">✓ 30 premium articles per month</div>
              <div className="text-sm text-[#888]">✓ Track up to 3 domains</div>
            </>
          )}
        </div>
        
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="border-[#333]"
          >
            Go Back
          </Button>
          <Button
            onClick={() => showUpgradePrompt(feature)}
            className="bg-white text-black hover:bg-gray-100"
          >
            View Plans
          </Button>
        </div>
      </div>
    </div>
  )
} 
// Example: Protected Server Component Page
// This shows how to handle protection in server components

import { getSubscriptionHeaders } from '@/lib/subscription/server-utils'
import { ProtectedFeature } from '@/components/subscription/protected-feature'
import { redirect } from 'next/navigation'
import { PLANS } from '@/lib/subscription/config'

export default async function ServerProtectedPage() {
  // Get subscription info from headers set by middleware
  const { userPlan, isSoftBlocked, requiredPlan, feature } = getSubscriptionHeaders()
  
  // Example 1: Hard redirect for certain features (server-side)
  if (userPlan === 'free' && requiredPlan === 'pro') {
    redirect('/settings?upgrade=true&requiredPlan=pro')
  }
  
  // Example 2: Conditional rendering based on plan
  const showAdvancedFeatures = userPlan === 'plus' || userPlan === 'pro'
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-white mb-8">
        Dashboard
      </h1>
      
      {/* Basic features for all users */}
      <div className="grid gap-6 mb-8">
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6">
          <h2 className="text-xl font-medium text-white mb-4">
            Your Plan: {userPlan ? PLANS[userPlan].name : 'Free'}
          </h2>
          <p className="text-[#888]">
            Basic visibility tracking and analytics
          </p>
        </div>
      </div>
      
      {/* Advanced features - conditionally rendered */}
      {showAdvancedFeatures ? (
        <div className="grid gap-6">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6">
            <h2 className="text-xl font-medium text-white mb-4">
              Advanced Analytics
            </h2>
            <p className="text-[#888]">
              Deep insights and competitor tracking
            </p>
          </div>
        </div>
      ) : (
        <ProtectedFeature
          requiredPlan="plus"
          feature="competitor-analysis"
          soft={true}
        >
          <div className="grid gap-6">
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6">
              <h2 className="text-xl font-medium text-white mb-4">
                Advanced Analytics
              </h2>
              <p className="text-[#888]">
                This would show advanced features
              </p>
            </div>
          </div>
        </ProtectedFeature>
      )}
      
      {/* Show soft block info if applicable */}
      {isSoftBlocked && (
        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-sm text-yellow-400">
            Some features on this page require a {requiredPlan && PLANS[requiredPlan].name} plan
          </p>
        </div>
      )}
    </div>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Zap, Lock, Crown } from 'lucide-react'
import { PRICING_PLANS } from '@/components/onboarding/utils/onboarding-constants'
import { useAuth } from '@/contexts/AuthContext'

interface PlanEnforcementProps {
  forceShow?: boolean
  allowDismiss?: boolean
  message?: string
}

export function PlanEnforcement({ 
  forceShow = false, 
  allowDismiss = false, 
  message 
}: PlanEnforcementProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    checkSubscriptionStatus()
  }, [user])

  useEffect(() => {
    if (forceShow) {
      setIsOpen(true)
    }
  }, [forceShow])

  const checkSubscriptionStatus = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/user/subscription')
      if (response.ok) {
        const data = await response.json()
        const plan = data.subscriptionPlan
        const status = data.subscriptionStatus
        
        setCurrentPlan(plan)
        
        // Show enforcement if no active plan
        if (!plan || status !== 'active' || !['starter', 'pro', 'team'].includes(plan)) {
          setIsOpen(true)
        }
      } else {
        // API error, assume no subscription
        setIsOpen(true)
      }
    } catch (error) {
      console.error('Error checking subscription:', error)
      setIsOpen(true)
    }
  }

  const handlePlanSelect = async (planId: string) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          isAnnual: false,
          customerEmail: user?.email || '',
          addOns: {}
        })
      })

      const { url, error } = await response.json()
      
      if (error) {
        console.error('Error creating checkout session:', error)
        return
      }

      // Redirect to Stripe Checkout
      window.location.href = url
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismiss = () => {
    if (allowDismiss) {
      setIsOpen(false)
    }
  }

  // Don't show if user has valid subscription
  if (currentPlan && ['starter', 'pro', 'team'].includes(currentPlan) && !forceShow) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={allowDismiss ? setIsOpen : undefined}>
      <DialogContent 
        className="bg-[#0a0a0a] border border-[#1a1a1a] text-white max-w-4xl max-h-[90vh] overflow-y-auto"
        hideCloseButton={!allowDismiss}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center border border-red-500/20">
              <Lock className="w-6 h-6 text-red-400" />
            </div>
            Subscription Required
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lock Message */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-sm text-[#ccc]">
              {message || "Split requires an active subscription to access all features. Choose a plan below to continue."}
            </p>
            <p className="text-xs text-red-400 mt-2">
              🔒 Your account is currently locked
            </p>
          </div>

          {/* Pricing Plans */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Choose Your Plan</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PRICING_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative bg-[#0c0c0c] border rounded-lg p-6 ${
                    plan.isRecommended ? 'border-white' : 'border-[#333]'
                  }`}
                >
                  {plan.isRecommended && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-white text-black px-3 py-1 text-xs font-medium rounded">
                        RECOMMENDED
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <h3 className="text-lg font-medium text-white">{plan.name}</h3>
                      {plan.badge && <span className="text-sm">{plan.badge}</span>}
                    </div>
                    <p className="text-xs text-[#666] mb-3 leading-relaxed">{plan.description}</p>
                    <div className="flex items-end justify-center gap-1">
                      <span className="text-2xl font-semibold text-white">
                        ${plan.monthlyPrice}
                      </span>
                      <span className="text-[#666] mb-1">/month</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {plan.features.slice(0, 4).map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 bg-[#666] rounded-full mt-2 flex-shrink-0" />
                        <span className="text-xs text-[#ccc]">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handlePlanSelect(plan.id)}
                    className={`w-full h-9 text-sm font-medium ${
                      plan.isRecommended
                        ? 'bg-white text-black hover:bg-gray-100'
                        : plan.buttonStyle
                    }`}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Loading...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4" />
                        {plan.buttonText}
                      </div>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Message */}
          <div className="text-center pt-4 border-t border-[#1a1a1a]">
            <p className="text-xs text-[#666]">
              ✨ All plans include unlimited AI crawler tracking and 10 lines of code setup
            </p>
            <p className="text-xs text-[#666] mt-1">
              🔒 Secure checkout powered by Stripe
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook for checking if user needs plan enforcement
export function usePlanEnforcement() {
  const [needsSubscription, setNeedsSubscription] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  const checkSubscription = async () => {
    if (!user) {
      setNeedsSubscription(true)
      setIsLoading(false)
      return true
    }

    try {
      const response = await fetch('/api/user/subscription')
      if (response.ok) {
        const data = await response.json()
        const plan = data.subscriptionPlan
        const status = data.subscriptionStatus
        
        const hasValidSubscription = plan && 
          status === 'active' && 
          ['starter', 'pro', 'team'].includes(plan)
        
        setNeedsSubscription(!hasValidSubscription)
        setIsLoading(false)
        return !hasValidSubscription
      } else {
        setNeedsSubscription(true)
        setIsLoading(false)
        return true
      }
    } catch (error) {
      console.error('Error checking subscription:', error)
      setNeedsSubscription(true)
      setIsLoading(false)
      return true
    }
  }

  useEffect(() => {
    checkSubscription()
  }, [user])

  return {
    needsSubscription,
    isLoading,
    checkSubscription
  }
} 
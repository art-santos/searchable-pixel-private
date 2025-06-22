'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { CheckCircle2, X, Check, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { UpgradeDialog } from '@/components/subscription/upgrade-dialog'
import { DomainAddonDialog } from '@/components/subscription/domain-addon-dialog'
import { WorkspaceDeletionDialog } from '@/components/workspace/workspace-deletion-dialog'
import type { PlanType } from '@/lib/subscription/config'
import { useAuth } from '@/contexts/AuthContext'

const pricingPlans = [
  {
    id: 'plus',
    name: 'Plus',
    price: 99,
    annualPrice: 79,
    features: [
      '1 domain included',
      '30-day crawler data',
      '10 snapshots/month',
      'AI attribution tracking',
      'Basic insights',
      '+$100/mo per extra domain'
    ],
    recommended: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 299,
    annualPrice: 239,
    features: [
      '1 domain included',
      '90-day crawler data',
      '50 snapshots/month',
      '500 attribution credits',
      'Slack alerts + API access',
      'Advanced insights',
      '+$100/mo per extra domain'
    ],
    recommended: true
  }
]

export function SettingsModals() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [isAnnualBilling, setIsAnnualBilling] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPlan, setCurrentPlan] = useState('free')
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [upgradeDialogProps, setUpgradeDialogProps] = useState<{
    feature?: string
    requiredPlan?: PlanType
    fromPath?: string
  }>({})
  const [showDomainDialog, setShowDomainDialog] = useState(false)
  const [showWorkspaceDeletionDialog, setShowWorkspaceDeletionDialog] = useState(false)
  const [domainsToRemove, setDomainsToRemove] = useState(0)
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [extraDomains, setExtraDomains] = useState(0)

  // Check URL parameters for upgrade dialog
  useEffect(() => {
    const shouldShowUpgrade = searchParams.get('showUpgrade') === 'true'
    const feature = searchParams.get('feature')
    const requiredPlan = searchParams.get('requiredPlan') as PlanType
    const fromPath = searchParams.get('fromPath')
    
    if (shouldShowUpgrade) {
      setUpgradeDialogProps({
        feature: feature || undefined,
        requiredPlan: requiredPlan || undefined,
        fromPath: fromPath || undefined
      })
      setShowUpgradeDialog(true)
    }
  }, [searchParams])

  // Fetch subscription data
  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch('/api/user/subscription')
        if (response.ok) {
          const data = await response.json()
          setStripeCustomerId(data.stripeCustomerId)
          setCurrentPlan(data.subscriptionPlan || 'free')
          
          if (data.subscriptionStatus === 'active' && data.subscriptionPeriodEnd) {
            const periodEnd = new Date(data.subscriptionPeriodEnd)
            const now = new Date()
            const monthsUntilEnd = (periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)
            setIsAnnualBilling(monthsUntilEnd > 6)
          }
        }
      } catch (error) {
        console.error('Error fetching subscription:', error)
      }
    }
    
    fetchSubscription()
  }, [])

  const handlePlanChange = async (planId: string) => {
    if (planId === 'free') {
      // Handle downgrade through Stripe Customer Portal
      await handleManageSubscription()
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          isAnnual: isAnnualBilling,
          customerId: stripeCustomerId,
          customerEmail: user?.email || '',
          addOns: {
            extraDomains
          }
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

  const handleManageSubscription = async () => {
    if (!stripeCustomerId) {
      console.error('No Stripe customer ID found')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: stripeCustomerId })
      })

      const { url, error } = await response.json()
      
      if (error) {
        console.error('Error creating portal session:', error)
        return
      }

      // Redirect to Stripe Customer Portal
      window.location.href = url
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWorkspacesDeleted = async (workspaceIds: string[]) => {
    // Delete workspaces from database
    for (const workspaceId of workspaceIds) {
      try {
        const response = await fetch(`/api/workspaces?id=${workspaceId}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          throw new Error('Failed to delete workspace')
        }
      } catch (error) {
        console.error('Error deleting workspace:', error)
        throw error
      }
    }
  }

  return (
    <>
      {/* Pricing Modal */}
      <AnimatePresence>
        {showPricingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-gray-200 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-medium text-gray-900">Choose Your Plan</h2>
                    <p className="text-sm text-gray-600 mt-1">Select the plan that best fits your needs</p>
                  </div>
                  <button
                    onClick={() => setShowPricingModal(false)}
                    className="text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Billing Toggle */}
                <div className="flex items-center justify-center mt-6">
                  <span className={`text-sm mr-3 ${!isAnnualBilling ? 'text-gray-900' : 'text-gray-500'}`}>Monthly</span>
                  <button
                    onClick={() => setIsAnnualBilling(!isAnnualBilling)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      isAnnualBilling ? 'bg-gray-200 border border-gray-300' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-[#191919] rounded-full transition-transform ${
                        isAnnualBilling ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-sm ml-3 ${isAnnualBilling ? 'text-gray-900' : 'text-gray-500'}`}>
                    Annual
                    <span className="text-xs text-gray-400 ml-1">(save 20%)</span>
                  </span>
                </div>
              </div>
              
              {/* Pricing Plans */}
              <div className="p-6">
                <div className="grid md:grid-cols-3 gap-6">
                  {pricingPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`relative bg-gray-50 border rounded-lg p-6 ${
                        plan.recommended ? 'border-[#191919]' : 'border-gray-200'
                      }`}
                    >
                      {plan.recommended && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <div className="bg-[#191919] text-white px-3 py-1 text-xs font-medium">
                            RECOMMENDED
                          </div>
                        </div>
                      )}

                      <div className="text-center mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-1">{plan.name}</h3>
                        <div className="flex items-end justify-center gap-1 mt-3">
                          <span className="text-3xl font-bold text-gray-900">
                            ${isAnnualBilling ? plan.annualPrice : plan.price}
                          </span>
                          <span className="text-gray-600 mb-1">/month</span>
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <div className="w-4 h-4 text-gray-900 mt-0.5 flex-shrink-0">
                              <Check className="w-4 h-4" />
                            </div>
                            <span className="text-sm text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>

                      <Button
                        onClick={() => handlePlanChange(plan.id)}
                        className={`w-full h-10 text-sm font-medium ${
                          currentPlan === plan.id
                            ? 'bg-gray-200 text-gray-600 cursor-default'
                            : plan.recommended
                            ? 'bg-[#191919] hover:bg-black border border-[#191919] hover:border-black text-white'
                            : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-300'
                        }`}
                        disabled={currentPlan === plan.id || isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : currentPlan === plan.id ? (
                          'Current Plan'
                        ) : (
                          `Choose ${plan.name}`
                        )}
                      </Button>
                    </div>
                  ))}

                  {/* Enterprise "Need More?" Card */}
                  <div className="relative bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">Need more?</h3>
                      <div className="flex items-end justify-center gap-1 mt-3">
                        <span className="text-2xl font-medium text-gray-600">Custom</span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-start gap-2">
                        <div className="w-4 h-4 text-gray-900 mt-0.5 flex-shrink-0">
                          <Check className="w-4 h-4" />
                        </div>
                        <span className="text-sm text-gray-700">More domains</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-4 h-4 text-gray-900 mt-0.5 flex-shrink-0">
                          <Check className="w-4 h-4" />
                        </div>
                        <span className="text-sm text-gray-700">Custom attribution credits</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-4 h-4 text-gray-900 mt-0.5 flex-shrink-0">
                          <Check className="w-4 h-4" />
                        </div>
                        <span className="text-sm text-gray-700">Enterprise features</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-4 h-4 text-gray-900 mt-0.5 flex-shrink-0">
                          <Check className="w-4 h-4" />
                        </div>
                        <span className="text-sm text-gray-700">CRM integrations</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-4 h-4 text-gray-900 mt-0.5 flex-shrink-0">
                          <Check className="w-4 h-4" />
                        </div>
                        <span className="text-sm text-gray-700">SLAs & priority support</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => window.open('https://cal.com/sam-hogan/15min', '_blank')}
                      className="w-full h-10 text-sm font-medium bg-white text-gray-900 hover:bg-gray-50 border border-gray-300"
                    >
                      Contact Sales
                    </Button>
                  </div>
                </div>
                
                {/* Free Plan Option */}
                {currentPlan !== 'free' && (
                  <div className="text-center mt-8">
                    <button
                      onClick={() => handlePlanChange('free')}
                      className="text-gray-600 text-sm hover:text-gray-900 transition-colors"
                      disabled={isLoading}
                    >
                      Downgrade to free plan
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upgrade Dialog - Shows when redirected from protected route */}
      <UpgradeDialog 
        open={showUpgradeDialog}
        onOpenChange={(open) => {
          setShowUpgradeDialog(open)
          // If closing the dialog, don't automatically show pricing modal
        }}
        feature={upgradeDialogProps.feature}
        requiredPlan={upgradeDialogProps.requiredPlan}
        fromPath={upgradeDialogProps.fromPath}
      />

      {/* Domain Add-on Dialog */}
      <DomainAddonDialog
        open={showDomainDialog}
        onOpenChange={setShowDomainDialog}
        currentDomains={extraDomains}
        onSuccess={() => {
          // Handle success
        }}
      />

      {/* Workspace Deletion Dialog */}
      <WorkspaceDeletionDialog
        open={showWorkspaceDeletionDialog}
        onOpenChange={setShowWorkspaceDeletionDialog}
        workspaces={workspaces}
        domainsToRemove={domainsToRemove}
        onConfirm={handleWorkspacesDeleted}
      />
    </>
  )
} 
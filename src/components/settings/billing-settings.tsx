'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Loader2, Plus, Minus, Globe, Zap, X, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { PRICING_PLANS } from '@/components/onboarding/utils/onboarding-constants'

interface BillingSettingsProps {
  usageData: any
  loadingUsage: boolean
  onRefreshUsage: () => Promise<void>
}

export function BillingSettings({ usageData, loadingUsage, onRefreshUsage }: BillingSettingsProps) {
  const { user } = useAuth()
  const [billingTab, setBillingTab] = useState<'plans' | 'usage' | 'settings'>('plans')
  const [currentPlan, setCurrentPlan] = useState('free')
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [isAnnualBilling, setIsAnnualBilling] = useState(false)
  const [extraDomains, setExtraDomains] = useState(0)
  const [isUpdatingAddOns, setIsUpdatingAddOns] = useState(false)
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [savingPreferences, setSavingPreferences] = useState(false)
  const [preferencesSaveMessage, setPreferencesSaveMessage] = useState('')
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null)
  const [visitorCredits, setVisitorCredits] = useState(3750) // Current slider value
  const [currentVisitorCredits, setCurrentVisitorCredits] = useState(3750) // Current subscription amount
  const [isUpdatingCredits, setIsUpdatingCredits] = useState(false)

  // Get base credits included in current plan
  const getBaseCreditsForPlan = (planType: string) => {
    switch (planType) {
      case 'visibility': return 0
      case 'plus': return 3750
      case 'pro': return 15000
      default: return 0 // free plan
    }
  }

  const baseCredits = getBaseCreditsForPlan(currentPlan)
  const isVisibilityPlan = currentPlan === 'visibility' || currentPlan === 'free'

  // Tiered pricing calculation
  const calculateCreditCost = (credits: number) => {
    if (credits <= baseCredits) return 0
    
    const additionalCredits = credits - baseCredits
    let cost = 0
    
    // Tier 1: 1-2500 additional credits at $0.25 each
    if (additionalCredits > 0) {
      const tier1Credits = Math.min(additionalCredits, 2500)
      cost += tier1Credits * 0.25
    }
    
    // Tier 2: 2501-7500 additional credits at $0.20 each  
    if (additionalCredits > 2500) {
      const tier2Credits = Math.min(additionalCredits - 2500, 5000)
      cost += tier2Credits * 0.20
    }
    
    // Tier 3: 7501+ additional credits at $0.15 each
    if (additionalCredits > 7500) {
      const tier3Credits = additionalCredits - 7500
      cost += tier3Credits * 0.15
    }
    
    return Math.round(cost)
  }

  // Get current price per credit for display
  const getCurrentPricePerCredit = (credits: number) => {
    if (credits <= baseCredits) return 0
    
    const additionalCredits = credits - baseCredits
    if (additionalCredits <= 2500) return 0.25
    if (additionalCredits <= 7500) return 0.20
    return 0.15
  }

  // Update credits when plan changes
  useEffect(() => {
    const planBaseCredits = getBaseCreditsForPlan(currentPlan)
    setVisitorCredits(planBaseCredits)
    setCurrentVisitorCredits(planBaseCredits)
  }, [currentPlan])

  // Fetch subscription data on mount
  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch('/api/user/subscription')
        if (response.ok) {
          const data = await response.json()
          setStripeCustomerId(data.stripeCustomerId)
          setCurrentPlan(data.subscriptionPlan || 'free')
          
          // Determine if user is on annual billing
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

  // Fetch workspaces data
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await fetch('/api/workspaces')
        if (response.ok) {
          const data = await response.json()
          console.log('Workspaces fetched:', data) // Debug log
          setWorkspaces(data.workspaces || [])
        } else {
          console.error('Failed to fetch workspaces:', response.status)
        }
      } catch (error) {
        console.error('Error fetching workspaces:', error)
      }
    }

    if (user) {
      fetchWorkspaces()
    }
  }, [user])

  // Refresh workspaces when usage data changes
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await fetch('/api/workspaces')
        if (response.ok) {
          const data = await response.json()
          setWorkspaces(data.workspaces || [])
        }
      } catch (error) {
        console.error('Error fetching workspaces:', error)
      }
    }

    if (user && usageData) {
      fetchWorkspaces()
    }
  }, [user, usageData])

  // Initialize add-ons from usage data
  useEffect(() => {
    if (usageData?.addOns) {
      const domainsAddon = usageData.addOns.find((addon: any) => addon.add_on_type === 'extra_domains')
      const backendSlots = domainsAddon?.quantity || 0
      console.log('Syncing extraDomains from backend:', backendSlots)
      setExtraDomains(backendSlots)
    }
  }, [usageData])

  // Auto-sync billing slots for admin accounts with workspace mismatch
  useEffect(() => {
    if (workspaces.length > 0 && usageData) {
      const extraWorkspaceCount = workspaces.filter(ws => !ws.is_primary).length
      
      // If we have extra workspaces but no billing slots, auto-sync for admin accounts
      if (extraWorkspaceCount > 0 && extraDomains === 0) {
        console.log('Admin account detected: auto-syncing billing slots', { extraWorkspaceCount, extraDomains })
        setExtraDomains(extraWorkspaceCount)
      }
    }
  }, [workspaces, extraDomains, usageData])

  // Function to save billing preferences
  const saveBillingPreferences = async (preferences: any) => {
    setSavingPreferences(true)
    setPreferencesSaveMessage('')
    
    try {
      const response = await fetch('/api/billing/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences })
      })
      
      if (!response.ok) {
        throw new Error('Failed to save preferences')
      }
      
      setPreferencesSaveMessage('Saved successfully')
      onRefreshUsage()
      
      // Clear success message after 2 seconds
      setTimeout(() => setPreferencesSaveMessage(''), 2000)
    } catch (error) {
      setPreferencesSaveMessage('Failed to save')
      console.error('Error saving preferences:', error)
      
      // Clear error message after 3 seconds
      setTimeout(() => setPreferencesSaveMessage(''), 3000)
    } finally {
      setSavingPreferences(false)
    }
  }

  // Calculate actual workspace counts
  const getWorkspaceCounts = () => {
    const totalWorkspaces = workspaces.length
    const extraWorkspaces = Math.max(0, totalWorkspaces - 1) // Subtract 1 for primary workspace
    return {
      total: totalWorkspaces,
      extra: extraWorkspaces,
      primary: workspaces.filter(ws => ws.is_primary).length
    }
  }

  const workspaceCounts = getWorkspaceCounts()

  // Handle add domain
  const handleAddDomain = async () => {
    const needsBillingSlot = workspaceCounts.extra >= extraDomains
    
    if (needsBillingSlot) {
      setIsUpdatingAddOns(true)
      try {
        const response = await fetch('/api/billing/manage-addons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: extraDomains === 0 ? 'add' : 'update',
            addonType: 'extra_domains',
            quantity: extraDomains + 1
          })
        })
        
        if (response.ok) {
          setExtraDomains(extraDomains + 1)
          await onRefreshUsage()
          showToast('Domain slot added! You can now create a new workspace.')
        } else {
          const error = await response.json()
          showToast(error.error || 'Failed to add domain slot')
        }
      } catch (error) {
        console.error('Error adding domain:', error)
        showToast('Failed to add domain slot')
      } finally {
        setIsUpdatingAddOns(false)
      }
    } else {
      showToast('You have available domain slots. Use the domain selector to create a new workspace.')
    }
  }

  // Handle remove domain
  const handleRemoveDomain = async () => {
    if (extraDomains === 0) return
    
    const extraWorkspaces = workspaces.filter(ws => !ws.is_primary)
    const minRequiredSlots = extraWorkspaces.length
    
    // Only allow removal if we have more domain slots than required for existing workspaces
    if (extraDomains > minRequiredSlots) {
      setIsUpdatingAddOns(true)
      try {
        const response = await fetch('/api/billing/manage-addons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: extraDomains === 1 ? 'remove' : 'update',
            addonType: 'extra_domains',
            quantity: Math.max(minRequiredSlots, extraDomains - 1)
          })
        })
        
        if (response.ok) {
          setExtraDomains(Math.max(minRequiredSlots, extraDomains - 1))
          showToast('Domain slot removed!')
          onRefreshUsage()
        } else {
          const error = await response.json()
          showToast(error.error || 'Failed to remove domain slot')
        }
      } catch (error) {
        showToast('Failed to remove domain slot')
      } finally {
        setIsUpdatingAddOns(false)
      }
    } else if (extraDomains === minRequiredSlots) {
      showToast(`Cannot remove slot - you need ${minRequiredSlots} slot${minRequiredSlots === 1 ? '' : 's'} for your ${extraWorkspaces.length} extra workspace${extraWorkspaces.length === 1 ? '' : 's'}.`)
    } else {
      showToast('Insufficient slots detected. Auto-syncing...')
      setExtraDomains(minRequiredSlots)
    }
  }

  // Helper function to show success toast
  const showToast = (message: string) => {
    setToastMessage(message)
    setShowSuccessToast(true)
    setTimeout(() => setShowSuccessToast(false), 3000)
  }

  // Dynamic billing data
  const getBillingData = () => {
    if (!usageData) {
      return { name: 'Loading...', price: 0, period: 'month', nextBilling: null }
    }

    const planType = currentPlan || usageData.billingPeriod.planType || 'free'
    
    if (planType === 'free') {
      return {
        name: 'Free',
        price: 0,
        period: 'forever',
        nextBilling: null
      }
    }
    
    const plan = PRICING_PLANS.find(p => p.id === planType) || PRICING_PLANS[1]
    
    return {
      name: plan.name,
      price: isAnnualBilling ? plan.annualPrice : plan.monthlyPrice,
      period: 'month',
      nextBilling: new Date(usageData.billingPeriod.end).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }
  }

  const billingPlan = getBillingData()

  const handlePlanChange = async (planId: string) => {
    if (planId === 'free') {
      // Handle downgrade through Stripe Customer Portal
      setShowPricingModal(false)
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

      // Close modal before redirecting
      setShowPricingModal(false)
      
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

  const handleUpdateCredits = async () => {
    if (visitorCredits === currentVisitorCredits) return

    setIsUpdatingCredits(true)
    try {
      // TODO: Connect to actual API endpoint for credit updates
      const response = await fetch('/api/billing/update-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credits: visitorCredits
        })
      })

      if (response.ok) {
        setCurrentVisitorCredits(visitorCredits)
        showToast(`Visitor credits updated to ${visitorCredits.toLocaleString()}!`)
        await onRefreshUsage()
      } else {
        const error = await response.json()
        showToast(error.error || 'Failed to update credits')
      }
    } catch (error) {
      console.error('Error updating credits:', error)
      showToast('Failed to update credits')
    } finally {
      setIsUpdatingCredits(false)
    }
  }

  const handleCancelCreditChanges = () => {
    setVisitorCredits(currentVisitorCredits)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-medium text-white mb-2">Billing & Usage</h2>
        <p className="text-sm text-[#666]">
          Manage your subscription and usage preferences
        </p>
      </div>

      {/* Sub-tabs for Billing */}
      <div className="border-b border-[#1a1a1a]">
        <nav className="flex space-x-8">
          <button
            onClick={() => setBillingTab('plans')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors font-mono tracking-tight ${
              billingTab === 'plans'
                ? 'border-white text-white'
                : 'border-transparent text-[#666] hover:text-white'
            }`}
          >
            Plans & Billing
          </button>
          <button
            onClick={() => setBillingTab('usage')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors font-mono tracking-tight ${
              billingTab === 'usage'
                ? 'border-white text-white'
                : 'border-transparent text-[#666] hover:text-white'
            }`}
          >
            Usage
          </button>
          <button
            onClick={() => setBillingTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors font-mono tracking-tight ${
              billingTab === 'settings'
                ? 'border-white text-white'
                : 'border-transparent text-[#666] hover:text-white'
            }`}
          >
            Settings
          </button>
        </nav>
      </div>

      {loadingUsage ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#666]" />
        </div>
      ) : (
        <>
          {/* Plans & Billing Tab */}
          {billingTab === 'plans' && (
            <div className="space-y-8">
              {/* Current Plan */}
              <div className="py-6 border-b border-[#1a1a1a]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-medium text-white font-mono tracking-tight">{billingPlan.name}</h3>
                      {usageData?.billingPeriod.planType !== 'free' && (
                        <span className="text-xs bg-[#222] text-[#999] px-2 py-1 rounded-sm border border-[#333] font-mono tracking-tight">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {usageData?.billingPeriod.planType === 'free' ? (
                        <p className="text-[#666] font-mono tracking-tight text-sm">Get started with basic features</p>
                      ) : (
                        <>
                          <p className="text-3xl font-bold text-white font-mono tracking-tight">
                            ${billingPlan.price}
                            <span className="text-lg font-normal text-[#666]">/month</span>
                          </p>
                          {billingPlan.nextBilling && (
                            <p className="text-xs text-[#666] font-mono tracking-tight">
                              Next billing: {billingPlan.nextBilling}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowPricingModal(true)}
                      className="bg-[#1a1a1a] hover:bg-[#333] border border-[#333] hover:border-[#444] text-white h-8 px-4 font-mono tracking-tight text-sm"
                      disabled={isLoading}
                    >
                      {usageData?.billingPeriod.planType === 'free' ? 'Upgrade Plan' : 'Change Plan'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Add-ons */}
              {usageData?.billingPeriod.planType !== 'free' && (currentPlan === 'plus' || currentPlan === 'pro') && (
                <div>
                  <h3 className="text-lg font-medium text-white mb-6 font-mono tracking-tight">Add-ons</h3>
                  <div className="space-y-4">
                    {/* Extra Domains */}
                    <div className="flex items-center justify-between py-4 border-b border-[#1a1a1a]">
                      <div>
                        <div className="font-medium text-white font-mono tracking-tight text-sm">Extra Workspaces</div>
                        <div className="text-xs text-[#666] font-mono tracking-tight">
                          $100 per slot per month • {extraDomains} slots purchased • {workspaceCounts.extra} workspaces using slots
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <Button
                            onClick={handleRemoveDomain}
                            disabled={extraDomains === 0 || extraDomains <= workspaceCounts.extra || isUpdatingAddOns}
                            size="sm"
                            variant="outline"
                            className="w-8 h-8 p-0 border-[#333] font-mono"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="text-white font-medium min-w-[2rem] text-center font-mono tracking-tight text-sm">
                            {extraDomains}
                          </span>
                          <Button
                            onClick={handleAddDomain}
                            disabled={isUpdatingAddOns}
                            size="sm"
                            variant="outline"
                            className="w-8 h-8 p-0 border-[#333] font-mono"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="text-right min-w-[5rem]">
                          <div className="font-medium text-white font-mono tracking-tight text-sm">
                            {extraDomains > 0 ? `+$${extraDomains * 100}` : '$0'}
                          </div>
                          <div className="text-xs text-[#666] font-mono tracking-tight">per month</div>
                        </div>
                      </div>
                    </div>

                    {/* Visitor Credits */}
                    <div className="py-4 border-b border-[#1a1a1a]">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="font-medium text-white font-mono tracking-tight text-sm">Visitor Credits</div>
                          <div className="text-xs text-[#666] font-mono tracking-tight">
                            {isVisibilityPlan 
                              ? 'Upgrade to Plus or Pro to access visitor identification'
                              : getCurrentPricePerCredit(visitorCredits) > 0 
                                ? `$${getCurrentPricePerCredit(visitorCredits).toFixed(2)} per additional credit • ${visitorCredits.toLocaleString()} credits per month`
                                : `${visitorCredits.toLocaleString()} credits included in plan`
                            }
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-white font-mono tracking-tight text-sm">
                            {isVisibilityPlan 
                              ? '—'
                              : calculateCreditCost(visitorCredits) > 0 
                                ? `+$${calculateCreditCost(visitorCredits)}`
                                : '$0'
                            }
                          </div>
                          <div className="text-xs text-[#666] font-mono tracking-tight">per month</div>
                        </div>
                      </div>
                      
                      {isVisibilityPlan ? (
                        /* Upgrade CTA for Visibility/Free plans */
                        <div className="text-center py-8 border border-dashed border-[#333] rounded-lg">
                          <div className="w-12 h-12 bg-[#1a1a1a] rounded-sm flex items-center justify-center mx-auto mb-3">
                            <span className="text-xl">👥</span>
                          </div>
                          <h4 className="text-sm font-medium text-white mb-2 font-mono tracking-tight">Visitor Identification</h4>
                          <p className="text-xs text-[#666] mb-4 max-w-xs mx-auto font-mono tracking-tight">
                            Track and identify your website visitors with our advanced analytics
                          </p>
                          <Button 
                            onClick={() => setShowPricingModal(true)}
                            className="bg-white text-black hover:bg-[#f5f5f5] h-8 px-4 font-mono tracking-tight text-xs"
                          >
                            Upgrade Plan
                          </Button>
                        </div>
                      ) : (
                        /* Credit Slider for Plus/Pro plans */
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs text-[#666] font-mono tracking-tight">
                            <span>{baseCredits.toLocaleString()} (included)</span>
                            <span>{currentPlan === 'pro' ? '25,000' : '15,000'}</span>
                          </div>
                          <div className="relative">
                            <input
                              type="range"
                              min={baseCredits}
                              max={currentPlan === 'pro' ? 25000 : 15000}
                              step="250"
                              value={visitorCredits}
                              onChange={(e) => setVisitorCredits(Number(e.target.value))}
                              className="w-full h-2 bg-[#1a1a1a] rounded-lg appearance-none cursor-pointer
                                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                                [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                                [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#333]
                                [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-white 
                                [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none"
                              style={{
                                background: `linear-gradient(to right, #333 0%, #333 ${((visitorCredits - baseCredits) / ((currentPlan === 'pro' ? 25000 : 15000) - baseCredits)) * 100}%, #1a1a1a ${((visitorCredits - baseCredits) / ((currentPlan === 'pro' ? 25000 : 15000) - baseCredits)) * 100}%, #1a1a1a 100%)`
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-center">
                            <span className="text-white font-medium font-mono tracking-tight text-sm">
                              {visitorCredits.toLocaleString()} credits
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Upgrade Button - shows when credits changed from current */}
                      {!isVisibilityPlan && visitorCredits !== currentVisitorCredits && (
                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#1a1a1a]">
                          <Button
                            onClick={handleCancelCreditChanges}
                            variant="outline"
                            size="sm"
                            className="border-[#333] text-[#666] hover:text-white font-mono tracking-tight text-xs"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleUpdateCredits}
                            disabled={isUpdatingCredits}
                            size="sm"
                            className="bg-white text-black hover:bg-[#f5f5f5] font-mono tracking-tight text-xs"
                          >
                            {isUpdatingCredits ? (
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            ) : null}
                            {visitorCredits > currentVisitorCredits ? 'Upgrade' : 'Downgrade'} Credits
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Upgrade CTA for Free Plan */}
              {usageData?.billingPeriod.planType === 'free' && (
                <div className="text-center py-12 border-t border-[#1a1a1a]">
                  <div className="w-16 h-16 bg-[#1a1a1a] rounded-sm flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-[#666]" />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2 font-mono tracking-tight">Ready to Scale?</h3>
                  <p className="text-[#666] mb-6 max-w-md mx-auto font-mono tracking-tight text-sm">
                    Upgrade to unlock AI article generation, unlimited visibility scans, and advanced AI tracking
                  </p>
                  <Button 
                    onClick={() => setShowPricingModal(true)}
                    className="bg-white text-black hover:bg-[#f5f5f5] h-10 px-8 font-mono tracking-tight text-sm"
                  >
                    View Plans & Pricing
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Usage Tab */}
          {billingTab === 'usage' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium text-white mb-6 font-mono tracking-tight">Current Usage</h3>
                <div className="space-y-6">
                  {/* AI Crawler Logs */}
                  <div className="flex items-center justify-between py-3 border-b border-[#1a1a1a]">
                    <div>
                      <div className="font-medium text-white font-mono tracking-tight text-sm">AI Crawler Logs</div>
                      <div className="text-xs text-[#666] font-mono tracking-tight mt-1">
                        {usageData?.aiLogs?.used || 0} crawler visits this billing period
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="font-medium text-white font-mono tracking-tight text-sm">Unlimited</div>
                      </div>
                      <div className="w-24 h-1 bg-[#1a1a1a] rounded-sm">
                        <div 
                          className="h-full bg-[#444] rounded-sm transition-all"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Domain Tracking */}
                  <div className={`flex items-center justify-between py-3 border-b border-[#1a1a1a] rounded-lg px-3 transition-all duration-500 ${
                    highlightedSection === 'domains' ? 'bg-white/5 border-white/20' : ''
                  }`}>
                    <div>
                      <div className="font-medium text-white font-mono tracking-tight text-sm">Domain Tracking</div>
                      <div className="text-xs text-[#666] font-mono tracking-tight mt-1">
                        {usageData?.domains?.used || 0} / {usageData?.domains?.included || 1} domains
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="font-medium text-white font-mono tracking-tight text-sm">
                          {usageData?.domains?.remaining || 0} slots left
                        </div>
                      </div>
                      <div className="w-24 h-1 bg-[#1a1a1a] rounded-sm">
                        <div 
                          className="h-full bg-[#444] rounded-sm transition-all"
                          style={{ 
                            width: `${Math.min(100, ((usageData?.domains?.used || 0) / Math.max(1, usageData?.domains?.included || 1)) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {billingTab === 'settings' && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-white font-mono tracking-tight">Billing Controls</h3>
                  {preferencesSaveMessage && (
                    <div className={`text-xs font-mono tracking-tight px-2 py-1 rounded-sm ${
                      preferencesSaveMessage.includes('success') ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'
                    }`}>
                      {preferencesSaveMessage}
                    </div>
                  )}
                </div>
                <div className="space-y-6">
                  {/* AI Logs Tracking Toggle */}
                  <div className="flex items-center justify-between py-3 border-b border-[#1a1a1a]">
                    <div>
                      <div className="font-medium text-white font-mono tracking-tight text-sm">AI Crawler Tracking</div>
                      <div className="text-xs text-[#666] font-mono tracking-tight mt-1">
                        Track AI crawler visits to your website for analytics
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="font-medium text-white font-mono tracking-tight text-sm">
                          {usageData?.aiLogs?.trackingEnabled !== false ? 'Enabled' : 'Disabled'}
                        </div>
                      </div>
                      <div className="w-12">
                        <Switch
                          checked={usageData?.aiLogs?.trackingEnabled !== false}
                          disabled={savingPreferences}
                          onCheckedChange={(checked) => {
                            saveBillingPreferences({ ai_logs_enabled: checked })
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Platform Notifications */}
                  <div className="flex items-center justify-between py-3 border-b border-[#1a1a1a]">
                    <div>
                      <div className="font-medium text-white font-mono tracking-tight text-sm">Platform Notifications</div>
                      <div className="text-xs text-[#666] font-mono tracking-tight mt-1">
                        Track AI crawler activity and platform updates
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="font-medium text-white font-mono tracking-tight text-sm">
                          {usageData?.billingPreferences?.overage_notifications !== false ? 'Enabled' : 'Disabled'}
                        </div>
                      </div>
                      <div className="w-12">
                        <Switch
                          checked={usageData?.billingPreferences?.overage_notifications !== false}
                          disabled={savingPreferences}
                          onCheckedChange={(checked) => {
                            saveBillingPreferences({ overage_notifications: checked })
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 flex items-center gap-3 shadow-lg">
            <span className="text-white text-sm font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Pricing Modal */}
      <AnimatePresence>
        {showPricingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-[#0a0a0a] border-b border-[#1a1a1a] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-medium text-white">Choose Your Plan</h2>
                    <p className="text-sm text-[#666] mt-1">Track AI visibility. Attribute real traffic. Enrich what matters.</p>
                  </div>
                  <button
                    onClick={() => setShowPricingModal(false)}
                    className="text-[#666] hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Billing Toggle */}
                <div className="flex items-center justify-center mt-6">
                  <span className={`text-sm mr-3 ${!isAnnualBilling ? 'text-white' : 'text-[#666]'}`}>Monthly</span>
                  <button
                    onClick={() => setIsAnnualBilling(!isAnnualBilling)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      isAnnualBilling ? 'bg-[#1a1a1a] border border-[#333]' : 'bg-[#333]'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        isAnnualBilling ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-sm ml-3 ${isAnnualBilling ? 'text-white' : 'text-[#666]'}`}>
                    Annual
                    <span className="text-xs text-[#888] ml-1">(save 20%)</span>
                  </span>
                </div>
              </div>
              
              {/* Pricing Plans */}
              <div className="p-6">
                <div className="grid grid-cols-3 gap-6">
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

                      <div className="text-center mb-6">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <h3 className="text-lg font-medium text-white">{plan.name}</h3>
                        </div>
                        <p className="text-xs text-[#666] mb-4 leading-relaxed">{plan.description}</p>
                        <div className="flex items-end justify-center gap-1 mt-3">
                          <span className="text-3xl font-semibold text-white">
                            ${isAnnualBilling ? plan.annualPrice : plan.monthlyPrice}
                          </span>
                          <span className="text-[#666] mb-1">/month</span>
                        </div>
                      </div>

                      <div className="space-y-2 mb-6">
                        {plan.features.map((feature, index) => {
                          // Check if this feature contains visitor credits numbers
                          const hasCredits = feature.includes('3,750') || feature.includes('15,000')
                          
                          if (hasCredits) {
                            const parts = feature.split(/(\d{1,2},\d{3})/)
                            return (
                              <div key={index} className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 bg-[#666] rounded-full mt-2 flex-shrink-0" />
                                <span className="text-sm text-[#ccc] flex items-center gap-1">
                                  {parts.map((part, partIndex) => {
                                    if (part.match(/\d{1,2},\d{3}/)) {
                                      return (
                                        <span key={partIndex} className="bg-[#1a1a1a] text-white px-2 py-1 text-xs rounded border border-[#333]">
                                          {part}
                                        </span>
                                      )
                                    }
                                    return part
                                  })}
                                </span>
                              </div>
                            )
                          }
                          
                          return (
                            <div key={index} className="flex items-start gap-3">
                              <div className="w-1.5 h-1.5 bg-[#666] rounded-full mt-2 flex-shrink-0" />
                              <span className="text-sm text-[#ccc]">
                                {feature}
                              </span>
                            </div>
                          )
                        })}
                      </div>

                      <Button
                        onClick={() => handlePlanChange(plan.id)}
                        className={`w-full h-10 text-sm font-medium ${
                          currentPlan === plan.id
                            ? 'bg-[#333] text-white cursor-default border border-[#555]'
                            : plan.buttonStyle
                        }`}
                        disabled={currentPlan === plan.id || isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : currentPlan === plan.id ? (
                          'Current Plan'
                        ) : (
                          plan.buttonText
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
                
                {/* Free Plan Option */}
                {currentPlan !== 'free' && (
                  <div className="text-center mt-8">
                    <button
                      onClick={() => handlePlanChange('free')}
                      className="text-[#666] text-sm hover:text-white transition-colors"
                      disabled={isLoading}
                    >
                      Continue with free tier (limited features)
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 
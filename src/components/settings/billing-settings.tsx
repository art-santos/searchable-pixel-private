'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Loader2, Plus, Minus, Globe, Zap, X, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { PRICING_PLANS } from '@/components/onboarding/utils/onboarding-constants'
import { WorkspaceDeletionDialog } from '@/components/workspace/workspace-deletion-dialog'

interface BillingSettingsProps {
  usageData: any
  loadingUsage: boolean
  onRefreshUsage: () => Promise<void>
}

export function BillingSettings({ usageData, loadingUsage, onRefreshUsage }: BillingSettingsProps) {
  const { user } = useAuth()
  const [billingTab, setBillingTab] = useState<'plans' | 'usage' | 'settings'>('plans')
  const [currentPlan, setCurrentPlan] = useState('starter')
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
  const [showWorkspaceDeletionDialog, setShowWorkspaceDeletionDialog] = useState(false)
  const [domainsToRemove, setDomainsToRemove] = useState(0)

  // Fetch subscription data on mount
  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch('/api/user/subscription')
        if (response.ok) {
          const data = await response.json()
          setStripeCustomerId(data.stripeCustomerId)
          const plan = data.subscriptionPlan || null
          setCurrentPlan(plan || 'starter') // Default for display, but will force upgrade
          
          // If no active plan, force upgrade modal
          if (!plan || data.subscriptionStatus !== 'active') {
            setShowPricingModal(true)
          }
          
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
        // On error, also show upgrade modal to be safe
        setShowPricingModal(true)
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

  // Calculate actual workspace counts with proper billing logic
  const getWorkspaceCounts = () => {
    const totalWorkspaces = workspaces.length
    const primaryWorkspaces = workspaces.filter(ws => ws.is_primary).length
    
    // Calculate included vs extra workspaces based on plan
    let includedLimit = 1 // Default for starter/pro
    if (currentPlan === 'team') {
      includedLimit = 5
    }
    
    const includedWorkspaces = Math.min(totalWorkspaces, includedLimit)
    const extraWorkspaces = Math.max(0, totalWorkspaces - includedLimit)
    
    return {
      total: totalWorkspaces,
      included: includedWorkspaces,
      extra: extraWorkspaces,
      primary: primaryWorkspaces,
      availableIncluded: Math.max(0, includedLimit - totalWorkspaces)
    }
  }

  // Get snapshot limit based on plan
  const getSnapshotLimit = () => {
    switch (currentPlan) {
      case 'starter': return 10
      case 'pro': return 50
      case 'team': return 100
      case 'admin': return -1 // unlimited
      default: return 0
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

  // Handle remove domain with workspace deletion check
  const handleRemoveDomain = async () => {
    if (extraDomains === 0) return
    
    // Calculate if removing this add-on would require workspace deletion
    const newAddOnCount = extraDomains - 1
    const includedLimit = currentPlan === 'team' ? 5 : 1
    const newMaxWorkspaces = includedLimit + newAddOnCount
    const currentWorkspaceCount = workspaces.length
    
    if (currentWorkspaceCount > newMaxWorkspaces) {
      const workspacesToDelete = currentWorkspaceCount - newMaxWorkspaces
      
      // Show workspace deletion dialog
      setDomainsToRemove(workspacesToDelete)
      setShowWorkspaceDeletionDialog(true)
      return
    }
    
    // No workspace deletion needed, proceed with add-on removal
    await removeAddOnDirect()
  }

  // Direct add-on removal without workspace deletion
  const removeAddOnDirect = async () => {
      setIsUpdatingAddOns(true)
      try {
        const response = await fetch('/api/billing/manage-addons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: extraDomains === 1 ? 'remove' : 'update',
            addonType: 'extra_domains',
          quantity: extraDomains - 1
          })
        })
        
        if (response.ok) {
        setExtraDomains(extraDomains - 1)
        await onRefreshUsage()
        showToast('Extra domain removed!')
        } else {
          const error = await response.json()
        showToast(error.error || 'Failed to remove extra domain')
        }
      } catch (error) {
      console.error('Error removing domain:', error)
      showToast('Failed to remove extra domain')
      } finally {
        setIsUpdatingAddOns(false)
      }
  }

  // Handle workspace deletion confirmation
  const handleWorkspaceDeletion = async (workspaceIds: string[]) => {
    try {
      // Delete workspaces first
      const deleteResponse = await fetch('/api/workspaces/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceIds,
          reason: 'addon_removal'
        })
      })

      if (!deleteResponse.ok) {
        const error = await deleteResponse.json()
        throw new Error(error.error || 'Failed to delete workspaces')
      }

      const deleteResult = await deleteResponse.json()
      
      if (deleteResult.success) {
        // Now remove the add-on
        await removeAddOnDirect()
        
        // Refresh workspaces list
        const response = await fetch('/api/workspaces')
        if (response.ok) {
          const data = await response.json()
          setWorkspaces(data.workspaces || [])
        }
        
        showToast(`${deleteResult.deletedCount} workspace${deleteResult.deletedCount !== 1 ? 's' : ''} deleted and add-on removed!`)
    } else {
        throw new Error(deleteResult.message || 'Some workspaces failed to delete')
      }
    } catch (error) {
      console.error('Error in workspace deletion:', error)
      showToast(error instanceof Error ? error.message : 'Failed to delete workspaces')
    }
  }

  // Handle edge alerts toggle
  const handleEdgeAlertsToggle = async (enabled: boolean) => {
    setIsUpdatingAddOns(true)
    try {
      const response = await fetch('/api/billing/manage-addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: enabled ? 'add' : 'remove',
          addonType: 'edge_alerts',
          quantity: 1
        })
      })
      
      if (response.ok) {
        await onRefreshUsage()
        showToast(enabled ? 'Edge Alerts activated!' : 'Edge Alerts deactivated!')
      } else {
        const error = await response.json()
        showToast(error.error || `Failed to ${enabled ? 'activate' : 'deactivate'} Edge Alerts`)
      }
    } catch (error) {
      console.error('Error toggling edge alerts:', error)
      showToast(`Failed to ${enabled ? 'activate' : 'deactivate'} Edge Alerts`)
    } finally {
      setIsUpdatingAddOns(false)
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

    const planType = currentPlan || usageData.billingPeriod.planType || 'starter'
    
    // No free plan - all users must have paid subscription (or be admin)
    if (!planType || !['starter', 'pro', 'team', 'admin'].includes(planType)) {
      return {
        name: 'No Active Plan',
        price: 0,
        period: 'month',
        nextBilling: null
      }
    }
    
    const plan = PRICING_PLANS.find(p => p.id === planType) || PRICING_PLANS[0]
    
    return {
      name: plan.name,
      price: isAnnualBilling ? plan.annualPrice : plan.monthlyPrice,
      period: 'month',
      nextBilling: usageData.billingPeriod?.end ? new Date(usageData.billingPeriod.end).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }) : null
    }
  }

  const billingPlan = getBillingData()

  const handlePlanChange = async (planId: string) => {
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



  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-medium text-black dark:text-white mb-2">Billing & Usage</h2>
        <p className="text-sm text-gray-500 dark:text-[#666]">
          Manage your subscription and usage preferences
        </p>
      </div>

      {/* Sub-tabs for Billing */}
      <div className="border-b border-gray-200 dark:border-[#1a1a1a]">
        <nav className="flex space-x-8">
          <button
            onClick={() => setBillingTab('plans')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors font-mono tracking-tight ${
              billingTab === 'plans'
                ? 'border-black dark:border-white text-black dark:text-white'
                : 'border-transparent text-gray-500 dark:text-[#666] hover:text-black dark:hover:text-white'
            }`}
          >
            Plans & Billing
          </button>
          <button
            onClick={() => setBillingTab('usage')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors font-mono tracking-tight ${
              billingTab === 'usage'
                ? 'border-black dark:border-white text-black dark:text-white'
                : 'border-transparent text-gray-500 dark:text-[#666] hover:text-black dark:hover:text-white'
            }`}
          >
            Usage
          </button>
          <button
            onClick={() => setBillingTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors font-mono tracking-tight ${
              billingTab === 'settings'
                ? 'border-black dark:border-white text-black dark:text-white'
                : 'border-transparent text-gray-500 dark:text-[#666] hover:text-black dark:hover:text-white'
            }`}
          >
            Settings
          </button>
        </nav>
      </div>

      {loadingUsage ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500 dark:text-[#666]" />
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
                      <h3 className="text-2xl font-medium text-black dark:text-white font-mono tracking-tight">{billingPlan.name}</h3>
                      {usageData?.billingPeriod.planType !== 'free' && (
                        <span className="text-xs bg-[#222] text-[#999] px-2 py-1 rounded-sm border border-[#333] font-mono tracking-tight">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {!currentPlan || !['starter', 'pro', 'team', 'admin'].includes(currentPlan) ? (
                        <div>
                          <p className="text-red-400 font-mono tracking-tight text-sm">No Active Subscription</p>
                          <p className="text-xs text-[#666] font-mono tracking-tight">Choose a plan below to continue</p>
                        </div>
                      ) : (
                        <>
                          <p className="text-3xl font-bold text-black dark:text-white font-mono tracking-tight">
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
                      className={`h-8 px-4 font-mono tracking-tight text-sm ${
                        !currentPlan || !['starter', 'pro', 'team', 'admin'].includes(currentPlan)
                          ? 'bg-red-600 hover:bg-red-700 text-white border-red-500'
                          : 'bg-[#1a1a1a] hover:bg-[#333] border border-[#333] hover:border-[#444] text-white'
                      }`}
                      disabled={isLoading || currentPlan === 'admin'}
                    >
                      {!currentPlan || !['starter', 'pro', 'team', 'admin'].includes(currentPlan) 
                        ? 'Choose Plan' 
                        : currentPlan === 'admin' 
                          ? 'Admin Account' 
                          : 'Change Plan'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Workspace Overview for Team Plan */}
              {currentPlan === 'team' && (
                <div>
                  <h3 className="text-lg font-medium text-black dark:text-white mb-6 font-mono tracking-tight">Workspace Overview</h3>
                  <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-black dark:text-white font-mono tracking-tight text-sm">Team Plan Workspaces</div>
                        <div className="text-xs text-[#666] font-mono tracking-tight mt-1">
                          {workspaceCounts.included}/5 included • {workspaceCounts.extra > 0 ? `${workspaceCounts.extra} extra (${extraDomains} billed)` : '0 extra'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-black dark:text-white font-mono tracking-tight text-sm">
                          {workspaceCounts.availableIncluded} included slots left
                        </div>
                        <div className="text-xs text-[#666] font-mono tracking-tight">
                          {workspaceCounts.extra > 0 ? `+${workspaceCounts.extra} extra workspaces` : 'Ready to use'}
                        </div>
                      </div>
                    </div>
                    
                    {workspaceCounts.extra > extraDomains && (
                      <div className="mt-3 pt-3 border-t border-[#1a1a1a] bg-yellow-500/5 rounded p-2">
                        <p className="text-xs text-yellow-400 font-mono tracking-tight">
                          ⚠️ You have {workspaceCounts.extra - extraDomains} unbilled extra workspace{workspaceCounts.extra - extraDomains > 1 ? 's' : ''}. Add extra domain billing below.
                        </p>
                      </div>
                    )}
                    
                    {workspaceCounts.total >= 5 && workspaceCounts.availableIncluded === 0 && (
                      <div className="mt-3 pt-3 border-t border-[#1a1a1a]">
                        <p className="text-xs text-[#666] font-mono tracking-tight">
                          💡 Need more workspaces? Purchase Extra Domain add-ons below.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Add-ons */}
              {(currentPlan === 'pro' || currentPlan === 'team') && (
                <div>
                  <h3 className="text-lg font-medium text-black dark:text-white mb-6 font-mono tracking-tight">Add-ons</h3>
                  <div className="space-y-4">
                    {/* Extra Domains */}
                    <div className="flex items-center justify-between py-4 border-b border-[#1a1a1a]">
                      <div>
                        <div className="font-medium text-black dark:text-white font-mono tracking-tight text-sm">Extra Domain</div>
                        <div className="text-xs text-[#666] font-mono tracking-tight">
                          $100 per additional workspace/domain per month{currentPlan === 'team' ? ' • Beyond your 5 included' : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <Button
                            onClick={handleRemoveDomain}
                            disabled={extraDomains === 0 || isUpdatingAddOns}
                            size="sm"
                            variant="outline"
                            className="w-8 h-8 p-0 border-[#333] font-mono"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="text-black dark:text-white font-medium min-w-[2rem] text-center font-mono tracking-tight text-sm">
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
                          <div className="font-medium text-black dark:text-white font-mono tracking-tight text-sm">
                            {extraDomains > 0 ? `+$${extraDomains * 100}` : '$0'}
                          </div>
                          <div className="text-xs text-[#666] font-mono tracking-tight">per month</div>
                        </div>
                      </div>
                    </div>

                    {/* Edge Alerts Add-on */}
                    <div className="flex items-center justify-between py-4 border-b border-[#1a1a1a]">
                        <div>
                        <div className="font-medium text-black dark:text-white font-mono tracking-tight text-sm">Edge Alerts</div>
                          <div className="text-xs text-[#666] font-mono tracking-tight">
                          $10 per month • Real-time webhooks for visitor spikes, new bots & thresholds
                          </div>
                        </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={usageData?.addOns?.some((addon: any) => addon.add_on_type === 'edge_alerts' && addon.is_active) || false}
                            disabled={isUpdatingAddOns}
                            onCheckedChange={(checked) => handleEdgeAlertsToggle(checked)}
                          />
                        </div>
                        <div className="text-right min-w-[5rem]">
                          <div className="font-medium text-black dark:text-white font-mono tracking-tight text-sm">
                            {usageData?.addOns?.some((addon: any) => addon.add_on_type === 'edge_alerts' && addon.is_active) ? '+$10' : '$0'}
                          </div>
                          <div className="text-xs text-[#666] font-mono tracking-tight">per month</div>
                        </div>
                        </div>
                      </div>
                      

                          </div>
                        </div>
              )}


                          </div>
          )}

          {/* Usage Tab */}
          {billingTab === 'usage' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium text-black dark:text-white mb-6 font-mono tracking-tight">Current Usage</h3>
                <div className="space-y-6">
                  {/* Workspaces */}
                  <div className={`flex items-center justify-between py-3 border-b border-[#1a1a1a] rounded-lg px-3 transition-all duration-500 ${
                    highlightedSection === 'workspaces' ? 'bg-white/5 border-white/20' : ''
                  }`}>
                    <div>
                      <div className="font-medium text-black dark:text-white font-mono tracking-tight text-sm">Workspaces</div>
                      <div className="text-xs text-[#666] font-mono tracking-tight mt-1">
                        {workspaceCounts.total} total workspaces • {workspaceCounts.included} included in plan
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="font-medium text-black dark:text-white font-mono tracking-tight text-sm">
                          {workspaceCounts.availableIncluded} included slots left
                        </div>
                        <div className="text-xs text-[#666] font-mono tracking-tight">
                          {workspaceCounts.extra > 0 ? `+${workspaceCounts.extra} extra ($${workspaceCounts.extra * 100}/mo)` : 'No extras'}
                        </div>
                      </div>
                      <div className="w-24 h-1 bg-[#1a1a1a] rounded-sm">
                        <div 
                          className="h-full bg-[#444] rounded-sm transition-all"
                              style={{
                            width: `${Math.min(100, (workspaceCounts.included / (currentPlan === 'team' ? 5 : 1)) * 100)}%` 
                              }}
                            />
                          </div>
                          </div>
                        </div>

                  {/* Snapshots */}
                  <div className="flex items-center justify-between py-3 border-b border-[#1a1a1a]">
                    <div>
                      <div className="font-medium text-black dark:text-white font-mono tracking-tight text-sm">Monthly Snapshots</div>
                      <div className="text-xs text-[#666] font-mono tracking-tight mt-1">
                        {usageData?.snapshots?.used || 0} / {getSnapshotLimit()} snapshots this month
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="font-medium text-black dark:text-white font-mono tracking-tight text-sm">
                          {getSnapshotLimit() === -1 ? 'Unlimited' : `${Math.max(0, getSnapshotLimit() - (usageData?.snapshots?.used || 0))} left`}
                  </div>
                </div>
                      <div className="w-24 h-1 bg-[#1a1a1a] rounded-sm">
                        <div 
                          className="h-full bg-[#444] rounded-sm transition-all"
                          style={{ 
                            width: getSnapshotLimit() === -1 ? '100%' : `${Math.min(100, ((usageData?.snapshots?.used || 0) / getSnapshotLimit()) * 100)}%`
                          }}
                        />
                  </div>
                </div>
            </div>

                  {/* AI Crawler Logs */}
                  <div className="flex items-center justify-between py-3 border-b border-[#1a1a1a]">
                    <div>
                      <div className="font-medium text-black dark:text-white font-mono tracking-tight text-sm">AI Crawler Logs</div>
                      <div className="text-xs text-[#666] font-mono tracking-tight mt-1">
                        {usageData?.aiLogs?.used || 0} crawler visits this billing period
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="font-medium text-black dark:text-white font-mono tracking-tight text-sm">Unlimited</div>
                      </div>
                      <div className="w-24 h-1 bg-[#1a1a1a] rounded-sm">
                        <div 
                          className="h-full bg-[#444] rounded-sm transition-all"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Edge Alerts */}
                  <div className="flex items-center justify-between py-3 border-b border-[#1a1a1a]">
                    <div>
                      <div className="font-medium text-black dark:text-white font-mono tracking-tight text-sm">Edge Alerts</div>
                      <div className="text-xs text-[#666] font-mono tracking-tight mt-1">
                        Real-time webhooks for visitor spikes and bot detection
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="font-medium text-black dark:text-white font-mono tracking-tight text-sm">
                          {usageData?.addOns?.some((addon: any) => addon.add_on_type === 'edge_alerts' && addon.is_active) ? 'Active' : 'Inactive'}
                        </div>
                        <div className="text-xs text-[#666] font-mono tracking-tight">
                          {usageData?.addOns?.some((addon: any) => addon.add_on_type === 'edge_alerts' && addon.is_active) ? '$10/month' : 'Add-on required'}
                      </div>
                      </div>
                      {!usageData?.addOns?.some((addon: any) => addon.add_on_type === 'edge_alerts' && addon.is_active) && (
                        <Button
                          size="sm"
                          onClick={() => setBillingTab('plans')}
                          className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 hover:text-blue-300 text-xs"
                        >
                          Add Edge Alerts
                        </Button>
                      )}
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
                  <h3 className="text-lg font-medium text-black dark:text-white font-mono tracking-tight">Billing Controls</h3>
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
                      <div className="font-medium text-black dark:text-white font-mono tracking-tight text-sm">AI Crawler Tracking</div>
                      <div className="text-xs text-[#666] font-mono tracking-tight mt-1">
                        Track AI crawler visits to your website for analytics
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="font-medium text-black dark:text-white font-mono tracking-tight text-sm">
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
                      <div className="font-medium text-black dark:text-white font-mono tracking-tight text-sm">Platform Notifications</div>
                      <div className="text-xs text-[#666] font-mono tracking-tight mt-1">
                        Billing updates, feature announcements, and alerts
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="font-medium text-black dark:text-white font-mono tracking-tight text-sm">
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

                  {/* Workspace Auto-deletion Protection */}
                  <div className="flex items-center justify-between py-3 border-b border-[#1a1a1a]">
                    <div>
                      <div className="font-medium text-black dark:text-white font-mono tracking-tight text-sm">Workspace Protection</div>
                      <div className="text-xs text-[#666] font-mono tracking-tight mt-1">
                        Warn before plan changes that would delete workspaces
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="font-medium text-black dark:text-white font-mono tracking-tight text-sm">Enabled</div>
                        <div className="text-xs text-[#666] font-mono tracking-tight">Always protected</div>
                      </div>
                      <div className="w-12">
                        <Switch
                          checked={true}
                          disabled={true}
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
                    <h2 className="text-xl font-medium text-black dark:text-white">Choose Your Plan</h2>
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
                          <h3 className="text-lg font-medium text-black dark:text-white">{plan.name}</h3>
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
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 bg-[#666] rounded-full mt-2 flex-shrink-0" />
                            <span className="text-sm text-[#ccc]">
                              {feature}
                            </span>
                          </div>
                        ))}
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
                

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workspace Deletion Dialog */}
      <WorkspaceDeletionDialog
        open={showWorkspaceDeletionDialog}
        onOpenChange={setShowWorkspaceDeletionDialog}
        workspaces={workspaces}
        domainsToRemove={domainsToRemove}
        onConfirm={handleWorkspaceDeletion}
      />
    </div>
  )
} 
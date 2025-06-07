'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Loader2, Plus, Minus, Globe, Zap } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'

interface BillingSettingsProps {
  usageData: any
  loadingUsage: boolean
  onRefreshUsage: () => Promise<void>
}

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
    limits: {
      crawlerLogs: 'Unlimited',
      domains: 1,
      retention: '30 days'
    }
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
    limits: {
      crawlerLogs: 'Unlimited',
      domains: 1,
      retention: '90 days'
    },
    recommended: true
  }
]

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
          setWorkspaces(data.workspaces || [])
        }
      } catch (error) {
        console.error('Error fetching workspaces:', error)
      }
    }

    if (user) {
      fetchWorkspaces()
    }
  }, [user])

  // Initialize add-ons from usage data
  useEffect(() => {
    if (usageData?.addOns) {
      const domainsAddon = usageData.addOns.find(addon => addon.add_on_type === 'extra_domains')
      setExtraDomains(domainsAddon?.quantity || 0)
    }
  }, [usageData])

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
    
    if (extraWorkspaces.length === 0) {
      setIsUpdatingAddOns(true)
      try {
        const response = await fetch('/api/billing/manage-addons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: extraDomains === 1 ? 'remove' : 'update',
            addonType: 'extra_domains',
            quantity: Math.max(0, extraDomains - 1)
          })
        })
        
        if (response.ok) {
          setExtraDomains(Math.max(0, extraDomains - 1))
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
    
    const plan = pricingPlans.find(p => p.id === planType) || pricingPlans[1]
    
    return {
      name: plan.name,
      price: isAnnualBilling ? plan.annualPrice : plan.price,
      period: 'month',
      nextBilling: new Date(usageData.billingPeriod.end).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }
  }

  const billingPlan = getBillingData()

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
                          $100 per workspace per month • {workspaceCounts.total} total ({workspaceCounts.extra} extra)
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
                          <span className="text-white font-medium min-w-[2rem] text-center font-mono tracking-tight text-sm">
                            {workspaceCounts.extra}
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
                            {workspaceCounts.extra > 0 ? `+$${workspaceCounts.extra * 100}` : '$0'}
                          </div>
                          <div className="text-xs text-[#666] font-mono tracking-tight">per month</div>
                        </div>
                      </div>
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
    </div>
  )
} 
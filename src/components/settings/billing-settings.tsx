'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Loader2, Crown, CheckCircle2, Check, Mail, MessageSquare, CreditCard, AlertCircle, X, Minus, Plus, HelpCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { getCalApi } from "@calcom/embed-react"
import { PRICING_PLANS, CREDIT_PRICING_TIERS } from '@/components/onboarding/utils/onboarding-constants'
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
  const [isAnnualBilling, setIsAnnualBilling] = useState(true)
  const [selectedCredits, setSelectedCredits] = useState(250)
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [savingPreferences, setSavingPreferences] = useState(false)
  const [preferencesSaveMessage, setPreferencesSaveMessage] = useState('')
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null)
  const [showWorkspaceDeletionDialog, setShowWorkspaceDeletionDialog] = useState(false)

  // Initialize Cal.com
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({"namespace":"split"});
      cal("ui", {"hideEventTypeDetails":false,"layout":"month_view"});
    })();
  }, [])

  // Fetch subscription data on mount
  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch('/api/user/subscription')
        if (response.ok) {
          const data = await response.json()
          console.log('Subscription data:', data)
          setStripeCustomerId(data.stripeCustomerId)
          const plan = data.subscriptionPlan || null
          setCurrentPlan(plan || 'starter')
          
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

  // Get current credit pricing
  const getCurrentCreditTier = (credits: number) => {
    return CREDIT_PRICING_TIERS.find(tier => tier.credits === credits) || CREDIT_PRICING_TIERS[0]
  }

  // Dynamic billing data
  const getBillingData = () => {
    if (!usageData) {
      return { name: 'Loading...', price: 0, period: 'month', nextBilling: null }
    }

    const planType = currentPlan || usageData.billingPeriod.planType || 'starter'
    
    if (!planType || !['starter', 'pro', 'enterprise', 'admin'].includes(planType)) {
      return {
        name: 'No Active Plan',
        price: 0,
        period: 'month',
        nextBilling: null
      }
    }
    
    const plan = PRICING_PLANS.find(p => p.id === planType) || PRICING_PLANS[0]
    let price = isAnnualBilling ? plan.annualPrice : plan.monthlyPrice
    
    // For Pro plan, calculate price based on selected credits
    if (planType === 'pro' && plan.hasCredits) {
      const creditTier = getCurrentCreditTier(selectedCredits)
      price = isAnnualBilling ? Math.round(creditTier.totalPrice * 0.83) : creditTier.totalPrice // 17% annual discount
    }
    
    return {
      name: plan.name,
      price: price,
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
      // For enterprise plan, open Cal.com booking
      if (planId === 'enterprise') {
        // Create a temporary button with Cal.com data attributes and click it
        const tempButton = document.createElement('button');
        tempButton.setAttribute('data-cal-namespace', 'split');
        tempButton.setAttribute('data-cal-link', 'sam-hogan/split');
        tempButton.setAttribute('data-cal-config', '{"layout":"month_view"}');
        tempButton.style.display = 'none';
        document.body.appendChild(tempButton);
        tempButton.click();
        document.body.removeChild(tempButton);
        setIsLoading(false)
        setShowPricingModal(false)
        return
      }

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          isAnnual: isAnnualBilling,
          customerId: stripeCustomerId,
          customerEmail: user?.email || '',
          credits: planId === 'pro' ? selectedCredits : undefined
        })
      })

      const { url, error } = await response.json()
      
      if (error) {
        console.error('Error creating checkout session:', error)
        return
      }

      setShowPricingModal(false)
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

  // Helper function to show success toast
  const showToast = (message: string) => {
    setToastMessage(message)
    setShowSuccessToast(true)
    setTimeout(() => setShowSuccessToast(false), 3000)
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">

      {/* Sub-tabs for Billing */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setBillingTab('plans')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              billingTab === 'plans'
                ? 'border-[#191919] text-[#191919]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Plans & Billing
          </button>
          <button
            onClick={() => setBillingTab('usage')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              billingTab === 'usage'
                ? 'border-[#191919] text-[#191919]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Usage & Credits
          </button>
          <button
            onClick={() => setBillingTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              billingTab === 'settings'
                ? 'border-[#191919] text-[#191919]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Settings
          </button>
        </nav>
      </div>

      {loadingUsage ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
        </div>
      ) : (
        <>
          {/* Plans & Billing Tab */}
          {billingTab === 'plans' && (
            <div className="space-y-8">
              {/* Current Plan */}
              <div className="py-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-medium text-gray-900 font-mono tracking-tight">{billingPlan.name}</h3>
                      {currentPlan !== 'starter' && (
                        <span className="text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded-sm border border-gray-300 font-mono tracking-tight">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {!currentPlan || !['starter', 'pro', 'enterprise', 'admin'].includes(currentPlan) ? (
                        <div>
                          <p className="text-red-400 font-mono tracking-tight text-sm">No Active Subscription</p>
                          <p className="text-xs text-gray-500 font-mono tracking-tight">Choose a plan below to continue</p>
                        </div>
                      ) : (
                        <>
                          <p className="text-3xl font-bold text-gray-900 font-mono tracking-tight">
                            ${billingPlan.price}
                            <span className="text-lg font-normal text-gray-500">/month</span>
                          </p>
                          {currentPlan === 'pro' && (
                            <p className="text-xs text-gray-500 font-mono tracking-tight">
                              {selectedCredits} credits included • ${getCurrentCreditTier(selectedCredits).pricePerCredit} per credit
                            </p>
                          )}
                          {billingPlan.nextBilling && (
                            <p className="text-xs text-gray-500 font-mono tracking-tight">
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
                        !currentPlan || !['starter', 'pro', 'enterprise', 'admin'].includes(currentPlan)
                          ? 'bg-red-600 hover:bg-red-700 text-white border-red-500'
                          : 'bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-white'
                      }`}
                      disabled={isLoading}
                    >
                      {!currentPlan || !['starter', 'pro', 'enterprise', 'admin'].includes(currentPlan) 
                        ? 'Choose Plan' 
                        : 'Change Plan'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Plan Features */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Current Plan Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {currentPlan && PRICING_PLANS.find(p => p.id === currentPlan)?.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Usage & Credits Tab */}
          {billingTab === 'usage' && (
            <div className="space-y-6">
              {/* Credit Usage (Pro plans only) */}
              {currentPlan === 'pro' && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Lead Credits</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">Credits Included</div>
                      <div className="text-2xl font-bold text-gray-900 mt-1">{selectedCredits}</div>
                      <div className="text-xs text-gray-500 mt-1">per month</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">Credits Used</div>
                      <div className="text-2xl font-bold text-gray-900 mt-1">{usageData?.credits?.used || 0}</div>
                      <div className="text-xs text-gray-500 mt-1">this billing cycle</div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Usage</span>
                      <span>{usageData?.credits?.used || 0} / {selectedCredits}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ 
                          width: `${Math.min(100, ((usageData?.credits?.used || 0) / selectedCredits) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Snapshot Usage */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Snapshot Audits</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">Monthly Limit</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">
                      {usageData?.snapshots?.included === -1 ? 'Unlimited' : usageData?.snapshots?.included || 0}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">Used This Month</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">{usageData?.snapshots?.used || 0}</div>
                  </div>
                </div>
              </div>

              {/* AI Tracking Usage */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">AI Crawler Tracking</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">Status</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Active & Tracking</span>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">Crawls This Month</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">{usageData?.aiLogs?.used || 0}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {billingTab === 'settings' && (
            <div className="space-y-6">
              {/* Billing Information */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Billing Information</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">Manage Payment Method</div>
                      <div className="text-xs text-gray-500 mt-1">Update your card or billing address</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Implement Stripe customer portal
                        window.open('/api/stripe/customer-portal', '_blank')
                      }}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Manage
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">Download Invoices</div>
                      <div className="text-xs text-gray-500 mt-1">Access your billing history</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Implement invoice download
                        window.open('/api/billing/invoices', '_blank')
                      }}
                    >
                      Download
                    </Button>
                  </div>
                </div>
              </div>

              {/* Support */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Support</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">Email Support</div>
                      <div className="text-xs text-gray-500 mt-1">Get help via email</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open('mailto:support@split.dev', '_blank')}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Contact
                    </Button>
                  </div>
                  
                  {(currentPlan === 'pro' || currentPlan === 'enterprise') && (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 text-sm">Priority Chat Support</div>
                        <div className="text-xs text-gray-500 mt-1">Available for Pro and Enterprise plans</div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Implement chat support
                          console.log('Opening chat support')
                        }}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Chat
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pricing Modal - Updated with new plans */}
      <AnimatePresence>
        {showPricingModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShowPricingModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-auto rounded-lg shadow-2xl border border-gray-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">Choose Your Plan</h2>
                    <p className="text-gray-600 mt-1">
                      Turn AI visibility into pipeline
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPricingModal(false)}
                    className="text-gray-500 hover:text-gray-900 transition-colors p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6">
                  {/* Billing Toggle */}
                  <div className="flex items-center justify-center gap-4 mb-8">
                    <span className={`text-sm font-medium ${!isAnnualBilling ? 'text-gray-900' : 'text-gray-500'}`}>
                      Monthly
                    </span>
                    <button
                      onClick={() => setIsAnnualBilling(!isAnnualBilling)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                        isAnnualBilling ? 'bg-gray-900' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 rounded-full transition-transform duration-200 ${
                          isAnnualBilling 
                            ? 'translate-x-7 bg-white' 
                            : 'translate-x-1 bg-white'
                        }`}
                      />
                    </button>
                    <span className={`text-sm font-medium ${isAnnualBilling ? 'text-gray-900' : 'text-gray-500'}`}>
                      Annual
                      <span className="text-gray-500 ml-1">(save 17%)</span>
                    </span>
                  </div>

                  {/* Pricing Plans */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {PRICING_PLANS.map((plan) => (
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: PRICING_PLANS.indexOf(plan) * 0.03, duration: 0.15, ease: "easeOut" }}
                        className={`bg-gray-50 p-6 relative rounded-sm transition-all duration-200 ${
                          plan.isRecommended 
                            ? 'border border-gray-900' 
                            : 'border border-gray-200 hover:border-gray-300'
                        }`}
                      >
                                                {plan.isRecommended && (
                          <div className="absolute -top-3 left-6">
                            <div className="bg-gray-900 text-white px-3 py-1 text-xs font-medium rounded">
                              Most Popular
                            </div>
                          </div>
                        )}
                        
                        <div className="mb-6">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                          <p className="text-gray-600 mb-4">{plan.description}</p>
                          
                                                                                {plan.id === 'pro' ? (
                            <div className="text-3xl font-bold text-gray-900 mb-1">
                              ${isAnnualBilling ? Math.round(getCurrentCreditTier(selectedCredits).totalPrice * 0.83) : getCurrentCreditTier(selectedCredits).totalPrice}
                            </div>
                          ) : plan.isEnterprise ? (
                            <div className="text-3xl font-bold text-gray-900 mb-1">
                              Custom
                            </div>
                          ) : (
                            <div className="text-3xl font-bold text-gray-900 mb-1">
                              ${isAnnualBilling ? plan.annualPrice : plan.monthlyPrice}
                            </div>
                          )}
                          
                          {!plan.isEnterprise && (
                            <div className="text-gray-500">per month</div>
                          )}
                        </div>

                        {/* Pro Plan Credit Selection */}
                        {plan.id === 'pro' && (
                          <div className="mb-6">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2 cursor-help">
                                  Monthly Lead Credits
                                  <HelpCircle className="w-4 h-4 text-gray-400" />
                                </label>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Normal Lead = 1 credit • Max Lead = 5 credits</p>
                              </TooltipContent>
                            </Tooltip>
                            <Select
                              value={selectedCredits.toString()}
                              onValueChange={(value) => setSelectedCredits(parseInt(value))}
                            >
                              <SelectTrigger className="w-full bg-white border-gray-300 text-gray-900">
                                <SelectValue placeholder="Select credits" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-gray-200">
                                {CREDIT_PRICING_TIERS.map((tier) => (
                                  <SelectItem key={tier.credits} value={tier.credits.toString()} className="text-gray-900 hover:bg-gray-50">
                                    {tier.credits.toLocaleString()} credits - ${isAnnualBilling ? Math.round(tier.totalPrice * 0.83) : tier.totalPrice}/mo
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Features */}
                        <div className="space-y-3 mb-6">
                          {plan.features.map((feature, index) => (
                            <div key={index} className="flex items-start gap-3">
                              <Check className="w-4 h-4 text-gray-900 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{feature}</span>
                            </div>
                          ))}
                        </div>

                        <Button
                          onClick={() => handlePlanChange(plan.id)}
                          disabled={currentPlan === plan.id || isLoading}
                          className={`w-full h-11 text-sm font-medium transition-all duration-200 ${
                            currentPlan === plan.id
                              ? 'bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed'
                              : plan.isRecommended
                                ? 'bg-gray-900 hover:bg-gray-800 text-white border-0'
                                : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300'
                          }`}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                              Processing...
                            </>
                          ) : currentPlan === plan.id ? (
                            'Current Plan'
                          ) : (
                            plan.buttonText
                          )}
                        </Button>
                      </motion.div>
                    ))}
                  </div>



                  {/* Trust indicators */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                      <span>✓ Cancel anytime</span>
                      <span>✓ 14-day money back</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Workspace Deletion Dialog */}
      <WorkspaceDeletionDialog
        open={showWorkspaceDeletionDialog}
        onOpenChange={setShowWorkspaceDeletionDialog}
        workspaces={workspaces}
        onConfirm={() => {
          // Implementation for workspace deletion
          console.log('Workspace deletion confirmed')
        }}
      />
    </div>
    </TooltipProvider>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Globe, 
  CreditCard,
  BarChart3,
  User,
  CheckCircle2, 
  ArrowRight,
  Copy,
  Eye,
  EyeOff,
  Building,
  Mail,
  X,
  Check,
  Zap,
  Loader2,
  ExternalLink,
  FileText,
  Key
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { UpgradeDialog } from '@/components/subscription/upgrade-dialog'
import { PlanType } from '@/lib/subscription/config'
import { useSubscription } from '@/hooks/useSubscription'
import { UsageDisplay } from '@/components/subscription/usage-display'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'

interface AnalyticsProvider {
  id: string
  name: string
  icon: string
  connected: boolean
  lastSync?: string
}

interface PricingPlan {
  id: string
  name: string
  price: number
  annualPrice: number
  features: string[]
  limits: {
    scans: string
    articles: number
    domains: number
  }
  recommended?: boolean
}

interface UserProfile {
  id?: string
  first_name?: string | null
  workspace_name?: string | null
  domain?: string | null
  email?: string | null
  created_by?: string
  updated_by?: string
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'visibility',
    name: 'Visibility',
    price: 40,
    annualPrice: 32,
    features: [
      'Daily visibility scans',
      'Citation analysis',
      'Single domain tracking',
      'Email alerts'
    ],
    limits: {
      scans: 'Daily',
      articles: 0,
      domains: 1
    }
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 200,
    annualPrice: 160,
    features: [
      'Daily MAX visibility scans',
      '10 monthly AI articles',
      'Competitor benchmarking',
      'Keyword trend analysis',
      'Priority support'
    ],
    limits: {
      scans: 'Unlimited',
      articles: 10,
      domains: 1
    },
    recommended: true
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 1000,
    annualPrice: 800,
    features: [
      'Everything in Plus',
      '30 premium articles',
      'Unlimited MAX scans',
      'Multi-brand tracking',
      'Up to 3 domains'
    ],
    limits: {
      scans: 'Unlimited',
      articles: 30,
      domains: 3
    }
  }
]

export default function SettingsPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('general')
  const [copied, setCopied] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [isAnnualBilling, setIsAnnualBilling] = useState(false)
  const [currentPlan, setCurrentPlan] = useState('free')
  const [isLoading, setIsLoading] = useState(false)
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null)
  const [loadingSubscription, setLoadingSubscription] = useState(true)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('Settings saved successfully')
  const { usage: subscriptionUsage, refresh: refreshUsage } = useSubscription()
  
  // Upgrade dialog state
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [upgradeDialogProps, setUpgradeDialogProps] = useState<{
    feature?: string
    requiredPlan?: PlanType
    fromPath?: string
  }>({})
  
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user || !supabase) {
        setProfileLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error)
        }

        setProfile(data || {
          first_name: user.email?.split('@')[0] || '',
          workspace_name: '',
          email: user.email
        })
      } catch (err) {
        console.error('Error in profile fetch:', err)
      } finally {
        setProfileLoading(false)
      }
    }

    fetchProfile()
  }, [user, supabase])
  
  // Check URL parameters for tab selection and upgrade dialog
  useEffect(() => {
    const tab = searchParams.get('tab')
    const shouldShowUpgrade = searchParams.get('showUpgrade') === 'true'
    const feature = searchParams.get('feature')
    const requiredPlan = searchParams.get('requiredPlan') as PlanType
    const fromPath = searchParams.get('fromPath')
    
    // Auto-select tab if specified
    if (tab) {
      setActiveSection(tab)
    }
    
    // Show upgrade dialog if redirected from protected route
    if (shouldShowUpgrade) {
      setUpgradeDialogProps({
        feature: feature || undefined,
        requiredPlan: requiredPlan || undefined,
        fromPath: fromPath || undefined
      })
      setShowUpgradeDialog(true)
    }
  }, [searchParams])
  
  // Fetch user's subscription data on mount
  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch('/api/user/subscription')
        if (response.ok) {
          const data = await response.json()
          setStripeCustomerId(data.stripeCustomerId)
          setCurrentPlan(data.subscriptionPlan || 'free')
          // Determine if user is on annual billing based on their current plan
          if (data.subscriptionStatus === 'active' && data.subscriptionPeriodEnd) {
            const periodEnd = new Date(data.subscriptionPeriodEnd)
            const now = new Date()
            const monthsUntilEnd = (periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)
            setIsAnnualBilling(monthsUntilEnd > 6)
          }
        }
      } catch (error) {
        console.error('Error fetching subscription:', error)
      } finally {
        setLoadingSubscription(false)
      }
    }
    
    fetchSubscription()
  }, [])
  
  // Check for Stripe redirect parameters
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      // Handle successful payment - refetch subscription data
      async function refetchSubscription() {
        setLoadingSubscription(true)
        try {
          const response = await fetch('/api/user/subscription')
          if (response.ok) {
            const data = await response.json()
            setStripeCustomerId(data.stripeCustomerId)
            setCurrentPlan(data.subscriptionPlan || 'free')
          }
        } catch (error) {
          console.error('Error refetching subscription:', error)
        } finally {
          setLoadingSubscription(false)
        }
      }
      refetchSubscription()
    } else if (searchParams.get('canceled') === 'true') {
      // Handle canceled payment
      console.log('Payment canceled')
    }
  }, [searchParams])
  
  // Dynamic workspace data from profile
  const [workspace, setWorkspace] = useState({
    name: '',
    domain: '',
    email: ''
  })

  // Update workspace state when profile loads
  useEffect(() => {
    if (profile) {
      setWorkspace({
        name: profile.workspace_name || '',
        domain: profile.domain || '',
        email: profile.email || user?.email || ''
      })
    }
  }, [profile, user])

  // Helper function to show success toast
  const showToast = (message: string) => {
    setToastMessage(message)
    setShowSuccessToast(true)
    
    // Auto-hide toast after 3 seconds
    setTimeout(() => {
      setShowSuccessToast(false)
    }, 3000)
  }

  // Unified function to save all general settings (workspace + profile)
  const handleSaveSettings = async () => {
    if (!user || !supabase) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: profile?.first_name,
          workspace_name: workspace.name,
          domain: workspace.domain,
          email: workspace.email,
          updated_by: user.id
        })

      if (error) {
        console.error('Error updating profile:', error)
        return
      }

      // Update local profile state
      setProfile((prev: UserProfile | null) => ({
        ...prev,
        first_name: profile?.first_name,
        workspace_name: workspace.name,
        domain: workspace.domain,
        email: workspace.email
      }))

      showToast('Settings saved successfully')
    } catch (err) {
      console.error('Error saving settings:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const sections = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'api-keys', label: 'API Keys', icon: Key },
    { id: 'billing', label: 'Billing', icon: CreditCard }
    // Removed Account section - merged with General
  ]
  
  // Mock data
  const [analytics, setAnalytics] = useState<AnalyticsProvider[]>([
    { id: 'ga4', name: 'Google Analytics', icon: '📊', connected: true, lastSync: '2 hours ago' },
    { id: 'vercel', name: 'Vercel Analytics', icon: '▲', connected: false },
    { id: 'plausible', name: 'Plausible', icon: '📈', connected: false }
  ])
  
  // Dynamic billing data based on current plan
  const getBillingData = () => {
    if (currentPlan === 'free') {
      return {
        name: 'Free',
        price: 0,
        period: 'forever',
        nextBilling: null,
        usage: {
          scans: { used: 3, limit: '5/month' },
          articles: { used: 0, limit: 0 },
          domains: { used: 1, limit: 1 }
        }
      }
    }
    
    const plan = pricingPlans.find(p => p.id === currentPlan) || pricingPlans[1]
    return {
      name: plan.name,
      price: isAnnualBilling ? plan.annualPrice : plan.price,
      period: 'month',
      nextBilling: 'January 15, 2025',
      usage: {
        scans: { used: 45, limit: plan.limits.scans },
        articles: { used: 6, limit: plan.limits.articles },
        domains: { used: 1, limit: plan.limits.domains }
      }
    }
  }

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText('sk_live_***************************')
    setCopied(true)
    showToast('API key copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

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
          customerEmail: workspace.email
        })
      })

      const { url, error } = await response.json()
      
      if (error) {
        console.error('Error creating checkout session:', error)
        // TODO: Show error toast
        return
      }

      // Redirect to Stripe Checkout
      window.location.href = url
    } catch (error) {
      console.error('Error:', error)
      // TODO: Show error toast
    } finally {
      setIsLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    if (!stripeCustomerId) {
      console.error('No Stripe customer ID found')
      // TODO: Show error toast
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
        // TODO: Show error toast
        return
      }

      // Redirect to Stripe Customer Portal
      window.location.href = url
    } catch (error) {
      console.error('Error:', error)
      // TODO: Show error toast
    } finally {
      setIsLoading(false)
    }
  }

  const billingPlan = getBillingData()
  
  // Get user's display name
  const getDisplayName = () => {
    if (profileLoading) return 'Loading...'
    if (profile?.first_name) return profile.first_name
    if (user?.email) return user.email.split('@')[0]
    return 'User'
  }

  return (
    <main className="min-h-full bg-[#0c0c0c]">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-medium text-white mb-2">Settings</h1>
          <p className="text-[#666] text-sm">Manage your workspace and integrations</p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Sidebar Navigation - Responsive */}
          <nav className="w-full lg:w-48 flex-shrink-0">
            <ul className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
              {sections.map((section) => {
                const Icon = section.icon
                return (
                  <li key={section.id} className="flex-shrink-0">
                    <button
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors whitespace-nowrap ${
                        activeSection === section.id
                          ? 'bg-[#1a1a1a] text-white'
                          : 'text-[#666] hover:text-white hover:bg-[#0a0a0a]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="lg:inline">{section.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Content Area - Scrollable */}
          <div className="flex-1 min-w-0">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* General Settings */}
              {activeSection === 'general' && (
                <div className="space-y-6">
                  {/* Workspace Settings */}
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6">
                    <h2 className="text-lg font-medium text-white mb-6">Workspace Settings</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm text-[#888] mb-2">Workspace Name</label>
                        <Input
                          value={workspace.name}
                          onChange={(e) => setWorkspace(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="My Company"
                          className="bg-[#1a1a1a] border-[#333] text-white h-10"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-[#888] mb-2">Primary Domain</label>
                        <Input
                          value={workspace.domain}
                          onChange={(e) => setWorkspace(prev => ({ ...prev, domain: e.target.value }))}
                          placeholder="example.com"
                          className="bg-[#1a1a1a] border-[#333] text-white h-10"
                        />
                        <p className="text-xs text-[#666] mt-2">
                          This is the domain we'll monitor for AI visibility
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm text-[#888] mb-2">Contact Email</label>
                        <Input
                          value={workspace.email}
                          onChange={(e) => setWorkspace(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="team@example.com"
                          className="bg-[#1a1a1a] border-[#333] text-white h-10"
                        />
                      </div>
                      </div>
                    </div>

                  {/* Personal Information */}
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6">
                    <h2 className="text-lg font-medium text-white mb-6">Personal Information</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm text-[#888] mb-2">Full Name</label>
                        <Input
                          value={profile?.first_name || ''}
                          onChange={(e) => setProfile((prev: UserProfile | null) => ({ 
                            ...prev, 
                            first_name: e.target.value 
                          }))}
                          placeholder="John Doe"
                          className="bg-[#1a1a1a] border-[#333] text-white h-10"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-[#888] mb-2">Email Address</label>
                        <Input
                          value={user?.email || ''}
                          type="email"
                          disabled
                          className="bg-[#1a1a1a] border-[#333] text-[#888] h-10"
                        />
                        <p className="text-xs text-[#666] mt-1">
                          Email cannot be changed here. Contact support if needed.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                      <Button 
                      onClick={handleSaveSettings}
                        disabled={isLoading}
                        className="bg-[#1a1a1a] hover:bg-[#222] border border-[#333] hover:border-[#444] text-white h-9 px-4 text-sm font-medium"
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-[#0a0a0a] border border-red-900/20 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-red-400 mb-2">Danger Zone</h3>
                    <p className="text-sm text-[#666] mb-6">
                      These actions cannot be undone. Please proceed with caution.
                    </p>
                    
                    <Button 
                      variant="outline"
                      className="border-red-900 text-red-400 hover:bg-red-900/20 h-9 px-4 text-sm"
                    >
                      Delete Account
                    </Button>
                  </div>
                </div>
              )}

              {/* Analytics Settings */}
              {activeSection === 'analytics' && (
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6">
                  <h2 className="text-lg font-medium text-white mb-2">Analytics Integrations</h2>
                  <p className="text-sm text-[#666] mb-6">
                    Connect your analytics platforms to track AI visibility impact
                  </p>

                  <div className="space-y-3">
                    {analytics.map((provider) => (
                      <div
                        key={provider.id}
                        className="flex items-center justify-between p-4 bg-[#0c0c0c] border border-[#1a1a1a] rounded-lg hover:border-[#333] transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-[#1a1a1a] rounded-lg flex items-center justify-center text-lg">
                            {provider.icon}
                          </div>
                          <div>
                            <div className="text-white font-medium">{provider.name}</div>
                            {provider.connected && provider.lastSync && (
                              <div className="text-xs text-[#666]">Last synced {provider.lastSync}</div>
                            )}
                          </div>
                        </div>
                        
                        {provider.connected ? (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-xs text-green-400">
                              <CheckCircle2 className="w-3 h-3" />
                              Connected
                            </div>
                            <Button
                              variant="outline"
                              className="border-[#333] hover:border-[#444] h-8 px-3 text-xs"
                            >
                              Settings
                            </Button>
                          </div>
                        ) : (
                          <Button
                            className="bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#333] h-8 px-3 text-xs"
                          >
                            Connect
                          </Button>
                        )}
                      </div>
                    ))}
              </div>
              
                  <div className="mt-6 p-4 bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg">
                    <p className="text-xs text-[#666]">
                      Analytics data helps us understand how AI visibility improvements impact your actual traffic and conversions.
                      We only access read-only data and never share it with third parties.
                    </p>
                  </div>
                </div>
              )}

              {/* API Keys Settings */}
              {activeSection === 'api-keys' && (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-lg font-medium text-white mb-2">API Keys</h2>
                        <p className="text-sm text-[#666]">
                          Manage your API keys for accessing Split's AI crawler analytics
                        </p>
                      </div>
                      <Button
                        className="bg-white text-black hover:bg-gray-100 h-9 px-4 text-sm font-medium"
                      >
                        Generate New Key
                      </Button>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                      <div className="flex gap-3">
                        <div className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-amber-400 text-xs">!</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-amber-300 mb-1">Keep Your API Keys Secure</h4>
                          <p className="text-amber-200/80 text-sm">
                            Store keys in environment variables. Never commit them to version control or share them publicly.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* API Keys List */}
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg">
                    <div className="p-6 border-b border-[#1a1a1a]">
                      <h3 className="text-white font-medium">Your API Keys</h3>
                      <p className="text-sm text-[#666] mt-1">These keys allow access to your Split analytics data</p>
                    </div>

                    <div className="divide-y divide-[#1a1a1a]">
                      {/* Example API Key */}
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-8 h-8 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
                                <Key className="w-4 h-4 text-[#666]" />
                              </div>
                              <div>
                                <h4 className="text-white font-medium">Production Key</h4>
                                <p className="text-xs text-[#666]">Created Dec 15, 2024</p>
                              </div>
                            </div>
                            
                            <div className="bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 mb-3">
                              <div className="flex items-center gap-2">
                                <code className="text-sm text-white font-mono flex-1 truncate">
                                  {showApiKey ? 'split_live_abc123xyz789' : 'split_live_***************************'}
                                </code>
                                <button
                                  onClick={() => setShowApiKey(!showApiKey)}
                                  className="text-[#666] hover:text-white transition-colors flex-shrink-0"
                                >
                                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                <span className="text-[#666]">Last used 2 hours ago</span>
                              </div>
                              <div className="text-[#666]">
                                Domain: example.com
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              onClick={handleCopyApiKey}
                              variant="outline"
                              className="border-[#333] hover:border-[#444] h-8 px-3 text-xs"
                            >
                              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            </Button>
                            <Button
                              variant="outline"
                              className="border-[#333] hover:border-[#444] h-8 px-3 text-xs"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              className="border-red-900 text-red-400 hover:bg-red-900/20 h-8 px-3 text-xs"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Empty state for no additional keys */}
                      <div className="p-6 text-center">
                        <div className="text-[#666] text-sm">
                          No additional API keys. Generate a new key to get started.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Usage & Limits */}
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6">
                    <h3 className="text-white font-medium mb-4">Usage & Limits</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <div className="text-2xl font-bold text-white mb-1">1,247</div>
                        <div className="text-sm text-[#666] mb-2">API Requests (30 days)</div>
                        <div className="w-full h-1 bg-[#1a1a1a] rounded-full">
                          <div className="w-3/4 h-1 bg-white/60 rounded-full"></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-2xl font-bold text-white mb-1">156</div>
                        <div className="text-sm text-[#666] mb-2">AI Crawlers Detected</div>
                        <div className="text-xs text-green-400">+12% this month</div>
                      </div>
                      
                      <div>
                        <div className="text-2xl font-bold text-white mb-1">99.9%</div>
                        <div className="text-sm text-[#666] mb-2">API Uptime</div>
                        <div className="text-xs text-green-400">All systems operational</div>
                      </div>
                    </div>
                  </div>

                  {/* Integration Examples */}
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6">
                    <h3 className="text-white font-medium mb-4">Quick Start</h3>
                    <p className="text-sm text-[#666] mb-6">
                      Get up and running with our NPM package or API endpoints
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-white text-sm font-medium mb-3">NPM Package</h4>
                        <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-lg p-4">
                          <pre className="text-xs text-gray-300 overflow-x-auto">
                            <code>{`npm install @split.dev/analytics

// middleware.ts
import { createCrawlerMiddleware } from '@split.dev/analytics/middleware'

export const middleware = createCrawlerMiddleware({
  apiKey: process.env.SPLIT_API_KEY
})`}</code>
                          </pre>
                        </div>
                        <div className="mt-2">
                          <a
                            href="/docs"
                            className="text-blue-400 hover:text-blue-300 text-xs inline-flex items-center gap-1"
                          >
                            View full documentation
                            <ArrowRight className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-white text-sm font-medium mb-3">Direct API</h4>
                        <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-lg p-4">
                          <pre className="text-xs text-gray-300 overflow-x-auto">
                            <code>{`curl -X POST https://split.dev/api/crawler-events \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"events": [...]}'`}</code>
                          </pre>
                        </div>
                        <div className="mt-2">
                          <a
                            href="/docs#api-reference"
                            className="text-blue-400 hover:text-blue-300 text-xs inline-flex items-center gap-1"
                          >
                            API Reference
                            <ArrowRight className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Billing Settings */}
              {activeSection === 'billing' && (
                <div className="space-y-6">
                  {loadingSubscription ? (
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-8 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                </div>
                  ) : currentPlan === 'free' ? (
                    /* Free Plan Empty State */
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-8 text-center">
                      <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-4">
                        <Zap className="w-8 h-8 text-[#666]" />
              </div>
                      <h2 className="text-xl font-medium text-white mb-2">You're on the Free plan</h2>
                      <p className="text-[#666] text-sm mb-6 max-w-md mx-auto">
                        Unlock daily visibility scans, AI-generated content, and advanced analytics with a paid plan
                      </p>
                      
                      {/* Usage Limits */}
                      <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-lg p-4 mb-6 max-w-sm mx-auto">
                        <div className="space-y-3 text-left">
                          <div className="flex justify-between text-sm">
                            <span className="text-[#888]">Visibility Scans</span>
                            <span className="text-white">{billingPlan.usage.scans.used} / {billingPlan.usage.scans.limit}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-[#888]">AI Articles</span>
                            <span className="text-[#666]">Not available</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-[#888]">Domains</span>
                            <span className="text-white">{billingPlan.usage.domains.used} / {billingPlan.usage.domains.limit}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => setShowPricingModal(true)}
                        className="bg-white text-black hover:bg-gray-100 h-10 px-6 text-sm font-medium"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Upgrade Plan'
                        )}
                      </Button>
                    </div>
                  ) : (
                    /* Paid Plan View */
                    <>
                      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6">
                        <div className="flex items-start justify-between mb-6">
                          <div>
                            <h2 className="text-lg font-medium text-white mb-1">Current Plan</h2>
                            <p className="text-sm text-[#666]">You're on the {billingPlan.name} plan</p>
                          </div>
                          <Button
                            onClick={() => setShowPricingModal(true)}
                            variant="outline"
                            className="border-[#333] hover:border-[#444] h-9 px-4 text-sm"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Change Plan'
                            )}
                          </Button>
                        </div>

                        <div className="flex items-end gap-1 mb-6">
                          <span className="text-3xl font-bold text-white">${billingPlan.price}</span>
                          <span className="text-[#666] mb-1">/{billingPlan.period}</span>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-[#888]">Visibility Scans</span>
                              <span className="text-white">{billingPlan.usage.scans.limit}</span>
                            </div>
                            <div className="text-xs text-[#666]">{billingPlan.usage.scans.used} scans this month</div>
                  </div>
                  
                          {billingPlan.usage.articles.limit > 0 && (
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-[#888]">AI Articles</span>
                                <span className="text-white">{billingPlan.usage.articles.used} / {billingPlan.usage.articles.limit}</span>
                              </div>
                              <div className="w-full h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-white/60 rounded-full"
                                  style={{ width: `${(billingPlan.usage.articles.used / billingPlan.usage.articles.limit) * 100}%` }}
                                />
                              </div>
                            </div>
                          )}

                      <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-[#888]">Domains</span>
                              <span className="text-white">{billingPlan.usage.domains.used} / {billingPlan.usage.domains.limit}</span>
                            </div>
                          </div>
                        </div>

                        {billingPlan.nextBilling && (
                          <div className="pt-4 mt-4 border-t border-[#1a1a1a]">
                            <p className="text-xs text-[#666]">
                              Next billing date: {billingPlan.nextBilling}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Payment Method */}
                      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6">
                        <h3 className="text-lg font-medium text-white mb-4">Payment Method</h3>
                        
                        <div className="flex items-center justify-between p-4 bg-[#0c0c0c] border border-[#1a1a1a] rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
                              <CreditCard className="w-5 h-5 text-[#666]" />
                            </div>
                            <div>
                              <div className="text-white text-sm">•••• •••• •••• 4242</div>
                              <div className="text-xs text-[#666]">Expires 12/25</div>
                            </div>
                      </div>
                      <Button 
                            onClick={handleManageSubscription}
                            variant="outline"
                            className="border-[#333] hover:border-[#444] h-8 px-3 text-xs gap-1"
                            disabled={isLoading || !stripeCustomerId}
                          >
                            {isLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                Manage
                                <ExternalLink className="w-3 h-3" />
                              </>
                            )}
                      </Button>
                    </div>
                        <p className="text-xs text-[#666] mt-3">
                          Update payment method, view invoices, or cancel subscription in Stripe portal
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
                  </div>
                </div>
              </div>
              
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
              className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-[#0a0a0a] border-b border-[#1a1a1a] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-medium text-white">Choose Your Plan</h2>
                    <p className="text-sm text-[#666] mt-1">Select the plan that best fits your needs</p>
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
                      isAnnualBilling ? 'bg-white' : 'bg-[#333]'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-black rounded-full transition-transform ${
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
                <div className="grid md:grid-cols-3 gap-6">
                  {pricingPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`relative bg-[#0c0c0c] border rounded-lg p-6 ${
                        plan.recommended ? 'border-white' : 'border-[#333]'
                      }`}
                    >
                      {plan.recommended && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <div className="bg-white text-black px-3 py-1 text-xs font-medium">
                            RECOMMENDED
                </div>
              </div>
                      )}

                      <div className="text-center mb-6">
                        <h3 className="text-lg font-medium text-white mb-1">{plan.name}</h3>
                        <div className="flex items-end justify-center gap-1 mt-3">
                          <span className="text-3xl font-bold text-white">
                            ${isAnnualBilling ? plan.annualPrice : plan.price}
                          </span>
                          <span className="text-[#666] mb-1">/month</span>
                </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-white">{feature}</span>
                          </div>
                        ))}
                      </div>

                      <Button
                        onClick={() => handlePlanChange(plan.id)}
                        className={`w-full h-10 text-sm font-medium ${
                          currentPlan === plan.id
                            ? 'bg-[#333] text-white cursor-default'
                            : plan.recommended
                            ? 'bg-white text-black hover:bg-gray-100'
                            : 'bg-[#1a1a1a] text-white hover:bg-[#2a2a2a] border border-[#333]'
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
              </div>
              
                {/* Free Plan Option */}
                {currentPlan !== 'free' && (
                  <div className="text-center mt-8">
                    <button
                      onClick={() => handlePlanChange('free')}
                      className="text-[#666] text-sm hover:text-white transition-colors"
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
          // If closing the dialog and it was the billing tab, keep it selected
          if (!open && activeSection === 'billing') {
            setShowPricingModal(true)
          }
        }}
        feature={upgradeDialogProps.feature}
        requiredPlan={upgradeDialogProps.requiredPlan}
        fromPath={upgradeDialogProps.fromPath}
      />

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 flex items-center gap-3 shadow-lg">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-white text-sm font-medium">{toastMessage}</span>
              <button
                onClick={() => setShowSuccessToast(false)}
                className="text-[#666] hover:text-white transition-colors ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
} 
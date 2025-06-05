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
  Key,
  LogOut,
  Plus,
  Minus,
  AlertTriangle,
  DollarSign
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'
import { UpgradeDialog } from '@/components/subscription/upgrade-dialog'
import { PlanType } from '@/lib/subscription/config'
import { useSubscription } from '@/hooks/useSubscription'
import { UsageDisplay } from '@/components/subscription/usage-display'
import { useAuth } from '@/contexts/AuthContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { createClient } from '@/lib/supabase/client'
import { AvatarUpload } from '@/components/profile/avatar-upload'
import { BillingPreferences } from '@/components/billing/billing-preferences'
import { Switch } from "@/components/ui/switch"
import { NotificationBannerList } from "@/components/ui/notification-banner"
import { DomainAddonDialog } from '@/components/subscription/domain-addon-dialog'
import { WorkspaceDeletionDialog } from '@/components/workspace/workspace-deletion-dialog'

interface AnalyticsProvider {
  id: string
  name: string
  icon: string
  status: 'connected' | 'not_connected'
  description: string
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
  last_name?: string | null
  workspace_name?: string | null
  domain?: string | null
  email?: string | null
  created_by?: string
  updated_by?: string
  profile_picture_url?: string | null
}

interface UsageData {
  billingPeriod: {
    start: string
    end: string
    planType: string
  }
  billingPreferences?: {
    ai_logs_enabled: boolean
    spending_limit_cents: number | null
    overage_notifications: boolean
    auto_billing_enabled: boolean
    analytics_only_mode: boolean
  }
  spendingLimits?: {
    plan_limit_cents: number
    user_limit_cents: number
    effective_limit_cents: number
    current_overage_cents: number
    remaining_cents: number
  }
  articles: {
    included: number
    used: number
    purchased: number
    remaining: number
    percentage: number
    note?: string
  }
  domains: {
    included: number
    used: number
    purchased: number
    remaining: number
    percentage: number
  }
  aiLogs: {
    included: number
    used: number
    remaining: number
    percentage: number
    overage: number
    overageCost: number
    billingBlocked?: boolean
    warningLevel?: 'overage' | 'critical' | 'warning' | 'normal'
    analyticsOnlyMode?: boolean
    trackingEnabled?: boolean
  }
  scans: {
    maxScansUsed: number
    dailyScansUsed: number
    totalScansUsed: number
    unlimitedMax: boolean
    dailyAllowed: boolean
  }
  recentEvents: any[]
  addOns: any[]
  notifications?: Array<{
    type: string
    key: string
    title: string
    message: string
    level: 'info' | 'warning' | 'error' | 'success'
    dismissible: boolean
  }>
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'visibility',
    name: 'Visibility',
    price: 40,
    annualPrice: 32,
    features: [
      '1 domain tracking',
      'Daily visibility scans',
      'Citation analysis',
      '250 AI crawler logs/month',
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
      '1 domain tracking',
      '10 monthly AI articles',
      'MAX visibility scans',
      '500 AI crawler logs/month',
      'Competitor benchmarking',
      'Keyword trend analysis',
      'Priority support',
      'Extra domains: +$100/month each'
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
      '1 domain tracking',
      '30 monthly AI articles',
      'Unlimited MAX scans',
      '1,000 AI crawler logs/month',
      'Multi-brand tracking',
      'Premium support',
      'API access',
      'Extra domains: +$100/month each'
    ],
    limits: {
      scans: 'Unlimited',
      articles: 30,
      domains: 1
    }
  }
]

export default function SettingsPage() {
  const { user } = useAuth()
  const { currentWorkspace, switching } = useWorkspace()
  const router = useRouter()
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
  
  // Workspace state management
  const [workspaceSettings, setWorkspaceSettings] = useState({
    name: '',
    domain: '',
    email: ''
  })
  
  // Initialize workspace settings from current workspace
  useEffect(() => {
    if (currentWorkspace) {
      setWorkspaceSettings({
        name: currentWorkspace.workspace_name || '',
        domain: currentWorkspace.domain || '',
        email: user?.email || ''
      })
    }
  }, [currentWorkspace, user])
  
  // Real usage data
  const [usageData, setUsageData] = useState<UsageData | null>(null)
  const [loadingUsage, setLoadingUsage] = useState(true)
  
  // Add-on state
  const [extraArticles, setExtraArticles] = useState(0)
  const [extraDomains, setExtraDomains] = useState(0)
  const [addOnChanges, setAddOnChanges] = useState<{ articles: number, domains: number } | null>(null)
  const [isUpdatingAddOns, setIsUpdatingAddOns] = useState(false)
  
  // API Keys state
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [loadingKeys, setLoadingKeys] = useState(true)
  const [newKeyName, setNewKeyName] = useState('')
  const [isCreatingKey, setIsCreatingKey] = useState(false)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const [copiedNewKey, setCopiedNewKey] = useState(false)
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Upgrade dialog state
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [upgradeDialogProps, setUpgradeDialogProps] = useState<{
    feature?: string
    requiredPlan?: PlanType
    fromPath?: string
  }>({})
  
  // Billing sub-tab state
  const [billingTab, setBillingTab] = useState<'plans' | 'usage' | 'settings'>('plans')
  
  // Add state for handling preference updates
  const [savingPreferences, setSavingPreferences] = useState(false)
  const [preferencesSaveMessage, setPreferencesSaveMessage] = useState('')
  
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [showDomainDialog, setShowDomainDialog] = useState(false)
  
  // Add state for highlighting sections
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null)
  
  // Workspace management state
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true)
  const [showWorkspaceCreationDialog, setShowWorkspaceCreationDialog] = useState(false)
  const [showWorkspaceDeletionDialog, setShowWorkspaceDeletionDialog] = useState(false)
  const [domainsToRemove, setDomainsToRemove] = useState(0)
  
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
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save preferences')
      }
      
      setPreferencesSaveMessage('Saved successfully')
      fetchUsageData() // Refresh usage data to show updated preferences
      
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

  // Fetch usage data
  const fetchUsageData = async () => {
    console.log('🔍 Fetching usage data...')
    setLoadingUsage(true)
    try {
      const response = await fetch('/api/usage/current')
      console.log('📡 Usage API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Usage data received:', data)
        setUsageData(data.usage)
        console.log('✅ Usage data set successfully')
      } else {
        console.error('❌ Failed to fetch usage data, status:', response.status)
        const errorData = await response.text()
        console.error('Error response:', errorData)
      }
    } catch (error) {
      console.error('💥 Error fetching usage data:', error)
    } finally {
      setLoadingUsage(false)
    }
  }

  // Fetch workspaces data
  const fetchWorkspaces = async () => {
    console.log('🏢 Fetching workspaces...')
    setLoadingWorkspaces(true)
    try {
      const response = await fetch('/api/workspaces')
      console.log('📡 Workspaces API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('🏢 Workspaces data received:', data)
        setWorkspaces(data.workspaces || [])
        console.log('✅ Workspaces data set successfully')
      } else {
        console.error('❌ Failed to fetch workspaces data, status:', response.status)
        const errorData = await response.text()
        console.error('Error response:', errorData)
      }
    } catch (error) {
      console.error('💥 Error fetching workspaces:', error)
    } finally {
      setLoadingWorkspaces(false)
    }
  }

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
          .select('first_name, workspace_name, domain, profile_picture_url')
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

  // Fetch usage data on component mount
  useEffect(() => {
    if (user) {
      fetchUsageData()
      fetchWorkspaces()
    }
  }, [user])
  
  // Check URL parameters for tab selection and upgrade dialog
  useEffect(() => {
    const tab = searchParams.get('tab')
    const shouldShowUpgrade = searchParams.get('showUpgrade') === 'true'
    const feature = searchParams.get('feature')
    const requiredPlan = searchParams.get('requiredPlan') as PlanType
    const fromPath = searchParams.get('fromPath')
    const highlight = searchParams.get('highlight')
    
    // Auto-select tab if specified
    if (tab) {
      setActiveSection(tab)
      
      // If highlighting domains in billing tab, switch to usage sub-tab
      if (tab === 'billing' && highlight === 'domains') {
        setBillingTab('usage')
        setHighlightedSection('domains')
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
          setHighlightedSection(null)
        }, 3000)
      }
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
      console.log('🔍 Fetching subscription data...')
      try {
        const response = await fetch('/api/user/subscription')
        console.log('📡 Subscription API response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('💳 Subscription data received:', data)
          
          setStripeCustomerId(data.stripeCustomerId)
          setCurrentPlan(data.subscriptionPlan || 'free')
          
          console.log('✅ Set currentPlan to:', data.subscriptionPlan || 'free')
          
          // Determine if user is on annual billing based on their current plan
          if (data.subscriptionStatus === 'active' && data.subscriptionPeriodEnd) {
            const periodEnd = new Date(data.subscriptionPeriodEnd)
            const now = new Date()
            const monthsUntilEnd = (periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)
            setIsAnnualBilling(monthsUntilEnd > 6)
          }
        } else {
          console.error('❌ Failed to fetch subscription data, status:', response.status)
        }
      } catch (error) {
        console.error('💥 Error fetching subscription:', error)
      } finally {
        setLoadingSubscription(false)
      }
    }
    
    fetchSubscription()
  }, [])
  
  // Fetch API keys when section is active
  useEffect(() => {
    if (activeSection === 'api-keys' && user) {
      fetchApiKeys()
    } else if (activeSection !== 'api-keys') {
      // Clear the newly created key message when leaving the API keys section
      setNewlyCreatedKey(null)
      setCopiedNewKey(false)
    }
  }, [activeSection, user])
  
  const fetchApiKeys = async () => {
    setLoadingKeys(true)
    try {
      const response = await fetch('/api/api-keys')
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.apiKeys || [])
      }
    } catch (error) {
      console.error('Error fetching API keys:', error)
    } finally {
      setLoadingKeys(false)
    }
  }
  
  const handleCreateApiKey = async (keyType: 'test' | 'live' = 'live') => {
    if (isCreatingKey) return
    
    setIsCreatingKey(true)
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyType }) // Pass the key type
      })
      
      if (response.ok) {
        const data = await response.json()
        setNewlyCreatedKey(data.apiKey.key)
        showToast(`${keyType === 'test' ? 'Test' : 'Live'} API key created successfully`)
        fetchApiKeys() // Refresh the list
      } else {
        const error = await response.json()
        showToast(error.error || 'Failed to create API key')
      }
    } catch (error) {
      console.error('Error creating API key:', error)
      showToast('Failed to create API key')
    } finally {
      setIsCreatingKey(false)
    }
  }
  
  const handleCopyApiKey = (key: string) => {
    // Check if this is a masked key (contains asterisks)
    if (key.includes('*')) {
      showToast('Cannot copy masked key. Keys are only shown once when created.')
      return
    }
    
    navigator.clipboard.writeText(key)
    setCopied(true)
    showToast('API key copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }
  
  const handleCopyNewKey = () => {
    if (newlyCreatedKey) {
      navigator.clipboard.writeText(newlyCreatedKey)
      setCopiedNewKey(true)
      setTimeout(() => setCopiedNewKey(false), 2000)
    }
  }
  
  const handleDeleteApiKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/api-keys?id=${keyId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        showToast('API key deleted successfully')
        fetchApiKeys() // Refresh the list
        setDeletingKeyId(null)
      } else {
        showToast('Failed to delete API key')
      }
    } catch (error) {
      console.error('Error deleting API key:', error)
      showToast('Failed to delete API key')
    }
  }
  
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
    if (!user || !supabase || !currentWorkspace) return

    setIsLoading(true)
    try {
      // Save profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: profile?.first_name,
          updated_by: user.id
        })

      if (profileError) {
        console.error('Error updating profile:', profileError)
        showToast('Failed to save profile settings')
        return
      }

      // Save workspace data
      const { error: workspaceError } = await supabase
        .from('workspaces')
        .update({
          workspace_name: workspaceSettings.name,
          domain: workspaceSettings.domain,
          updated_by: user.id
        })
        .eq('id', currentWorkspace.id)

      if (workspaceError) {
        console.error('Error updating workspace:', workspaceError)
        showToast('Failed to save workspace settings')
        return
      }

      // Update local profile state
      setProfile((prev: UserProfile | null) => ({
        ...prev,
        first_name: profile?.first_name
      }))

      showToast('Settings saved successfully')
    } catch (err) {
      console.error('Error saving settings:', err)
      showToast('Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  const sections = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'api-keys', label: 'API Keys', icon: Key },
    { id: 'billing', label: 'Billing', icon: CreditCard }
  ]
  
  // Mock data
  const [analytics, setAnalytics] = useState<AnalyticsProvider[]>([
    { id: 'ga4', name: 'Google Analytics', icon: '📊', status: 'connected', description: '2 hours ago' },
    { id: 'vercel', name: 'Vercel Analytics', icon: '▲', status: 'not_connected', description: '' },
    { id: 'plausible', name: 'Plausible', icon: '📈', status: 'not_connected', description: '' }
  ])
  
  // Dynamic billing data based on current plan and real usage
  const getBillingData = () => {
    console.log('🔍 getBillingData called with:', { 
      usageData: usageData ? 'loaded' : 'null',
      currentPlan,
      usageDataPlanType: usageData?.billingPeriod?.planType 
    })
    
    if (!usageData) {
      return {
        name: 'Loading...',
        price: 0,
        period: 'month',
        nextBilling: null,
        usage: {
          scans: { 
            maxScansUsed: 0, 
            dailyScansUsed: 0, 
            totalScansUsed: 0, 
            unlimitedMax: false, 
            dailyAllowed: true 
          },
          articles: { used: 0, limit: 0, remaining: 0, percentage: 0, note: 'Loading...' },
          domains: { used: 0, limit: 1, remaining: 1, percentage: 0 },
          aiLogs: { 
            included: 0, 
            used: 0, 
            remaining: 0, 
            percentage: 0, 
            overage: 0, 
            overageCost: 0 
        }
      }
    }
    }

    // Use actual subscription plan (currentPlan) instead of usage data plan
    const planType = currentPlan || usageData.billingPeriod.planType || 'free'
    
    console.log('📊 Final plan determination:', {
      currentPlan,
      usageDataPlan: usageData.billingPeriod.planType,
      finalPlanType: planType
    })
    
    if (planType === 'free') {
      console.log('🆓 Showing free plan UI')
      return {
        name: 'Free',
        price: 0,
        period: 'forever',
        nextBilling: null,
        usage: {
          scans: usageData.scans,
          articles: usageData.articles,
          domains: usageData.domains,
          aiLogs: usageData.aiLogs
        }
      }
    }
    
    const plan = pricingPlans.find(p => p.id === planType) || pricingPlans[1]
    console.log('✅ Showing paid plan UI:', plan.name)
    
    return {
      name: plan.name,
      price: isAnnualBilling ? plan.annualPrice : plan.price,
      period: 'month',
      nextBilling: new Date(usageData.billingPeriod.end).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      usage: {
        scans: usageData.scans,
        articles: usageData.articles,
        domains: usageData.domains,
        aiLogs: usageData.aiLogs
      }
    }
  }

  const billingPlan = getBillingData()
  
  const handlePlanChange = async (planId: string) => {
    if (planId === 'free') {
      // Handle downgrade through Stripe Customer Portal
      await handleManageSubscription()
      return
    }

    setIsLoading(true)
    try {
      // Calculate total price with add-ons
      const basePlan = pricingPlans.find(p => p.id === planId)
      if (!basePlan) return

      const addOnCosts = {
        extraArticles: extraArticles * 10, // $10 per article
        extraDomains: extraDomains * 100   // $100 per domain
      }

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          isAnnual: isAnnualBilling,
          customerId: stripeCustomerId,
          customerEmail: workspace.email,
          addOns: {
            extraArticles,
            extraDomains
          }
        })
      })

      const { url, error } = await response.json()
      
      if (error) {
        console.error('Error creating checkout session:', error)
        showToast('Failed to create checkout session')
        return
      }

      // Redirect to Stripe Checkout
      window.location.href = url
    } catch (error) {
      console.error('Error:', error)
      showToast('Failed to upgrade plan')
    } finally {
      setIsLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    if (!stripeCustomerId) {
      console.error('No Stripe customer ID found')
      showToast('No subscription to manage')
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
        showToast('Failed to open billing portal')
        return
      }

      // Redirect to Stripe Customer Portal
      window.location.href = url
    } catch (error) {
      console.error('Error:', error)
      showToast('Failed to open billing portal')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Get user's display name
  const getDisplayName = () => {
    if (profileLoading) return 'Loading...'
    if (profile?.first_name) return profile.first_name
    if (user?.email) return user.email.split('@')[0]
    return 'User'
  }

  // Handle logout
  const handleLogout = async () => {
    setIsLoading(true)
    try {
      if (supabase) {
      await supabase.auth.signOut()
      }
      router.push('/')
    } catch (error) {
      console.error('Error during logout:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle add-on changes
  const handleAddOnChange = (type: 'articles' | 'domains', value: number) => {
    if (type === 'articles') {
      setExtraArticles(value)
      setAddOnChanges({ articles: value, domains: extraDomains })
    } else {
      setExtraDomains(value)
      setAddOnChanges({ articles: extraArticles, domains: value })
    }
  }

  const cancelAddOnChanges = () => {
    if (!addOnChanges) return
    
    // Reset sliders to current values  
    setExtraArticles(addOnChanges.articles)
    setExtraDomains(addOnChanges.domains)
    setAddOnChanges(null)
  }

  const applyAddOnChanges = async () => {
    if (!addOnChanges) return

    setIsUpdatingAddOns(true)
    try {
      // Handle extra domains
      if (addOnChanges.domains !== extraDomains) {
        const action = addOnChanges.domains === 0 ? 'remove' : 
                     extraDomains === 0 ? 'add' : 'update'
        
        const response = await fetch('/api/billing/manage-addons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            addonType: 'extra_domains',
            quantity: addOnChanges.domains
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to update domains')
        }

        console.log('✅ Successfully updated extra domains')
      }

      // Handle extra articles (when feature is available)
      // Feature disabled for now - removing to prevent linter errors
      
      // Reset changes state
      setAddOnChanges(null)
      showToast('Add-ons updated successfully!')
      
      // Refresh usage data
      fetchUsageData()

    } catch (error) {
      console.error('Error updating add-ons:', error)
      showToast(error instanceof Error ? error.message : 'Failed to update add-ons')
    } finally {
      setIsUpdatingAddOns(false)
    }
  }

  // Initialize add-ons from usage data
  useEffect(() => {
    if (usageData?.addOns) {
      const articlesAddon = usageData.addOns.find(addon => addon.add_on_type === 'extra_articles')
      const domainsAddon = usageData.addOns.find(addon => addon.add_on_type === 'extra_domains')
      
      setExtraArticles(articlesAddon?.quantity || 0)
      setExtraDomains(domainsAddon?.quantity || 0)
    }
  }, [usageData])

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

  // Function to dismiss notifications
  const handleDismissNotification = async (notificationType: string, notificationKey: string) => {
    try {
      const response = await fetch('/api/notifications/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          notification_type: notificationType, 
          notification_key: notificationKey 
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to dismiss notification')
      }
      
      // Refresh usage data to update notifications
      fetchUsageData()
    } catch (error) {
      console.error('Error dismissing notification:', error)
      showToast('Failed to dismiss notification')
    }
  }

  // Workspace-aware domain management handlers
  const handleAddDomain = async () => {
    // First, check if we need to add billing slot
    const needsBillingSlot = workspaceCounts.extra >= extraDomains
    
    if (needsBillingSlot) {
      // Add the domain slot to Stripe billing first
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
          // Update the local state
          setExtraDomains(extraDomains + 1)
          // Refresh usage data
          await fetchUsageData()
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
      // User already has available billing slots, just show info
      showToast('You have available domain slots. Use the domain selector to create a new workspace.')
    }
  }

  const handleRemoveDomain = async () => {
    if (extraDomains === 0) return
    
    // Check how many extra workspaces exist (non-primary)
    const extraWorkspaces = workspaces.filter(ws => !ws.is_primary)
    
    if (extraWorkspaces.length === 0) {
      // No extra workspaces to delete, just update billing
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
          fetchUsageData()
        } else {
          const error = await response.json()
          showToast(error.error || 'Failed to remove domain slot')
        }
      } catch (error) {
        showToast('Failed to remove domain slot')
      } finally {
        setIsUpdatingAddOns(false)
      }
    } else {
      // Show workspace deletion dialog
      setDomainsToRemove(1)
      setShowWorkspaceDeletionDialog(true)
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
    
    // Refresh workspaces list
    await fetchWorkspaces()
    showToast(`${workspaceIds.length} workspace${workspaceIds.length > 1 ? 's' : ''} deleted successfully!`)
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
            {/* Notification Banners */}
            {usageData?.notifications && usageData.notifications.length > 0 && (
              <NotificationBannerList
                notifications={usageData.notifications}
                onDismiss={handleDismissNotification}
                className="mb-6"
              />
            )}
            
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* General Settings */}
              {activeSection === 'general' && (
                <div className="space-y-6">
                  {/* Header */}
                  <div>
                    <h2 className="text-xl font-medium text-white mb-2">General Settings</h2>
                    <p className="text-sm text-[#666]">
                      Manage your profile and workspace settings
                    </p>
                  </div>

                  {/* Personal Information with Profile Picture */}
                  <div className="space-y-6">
                    <h3 className="text-white font-medium">Personal Information</h3>
                    
                    {/* Profile Picture */}
                    <div className="flex items-start gap-6">
                      <AvatarUpload
                        profilePictureUrl={profile?.profile_picture_url}
                        firstName={profile?.first_name}
                        lastName={profile?.last_name}
                        email={user?.email}
                        onAvatarUpdate={(url: string | null) => setProfile((prev: UserProfile | null) => ({ 
                          ...prev, 
                          profile_picture_url: url 
                        }))}
                        size="lg"
                      />
                      <div className="text-sm text-[#666] mt-1">
                        <p>Upload a profile picture</p>
                        <p className="text-xs mt-1">JPG, PNG or GIF. Max size 5MB.</p>
                        <p className="text-xs mt-1">Drag & drop or click to upload.</p>
                      </div>
                    </div>

                    {/* Name and Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-[#888] mb-2">Full Name</label>
                        <Input
                          value={profile?.first_name || ''}
                          onChange={(e) => setProfile((prev: UserProfile | null) => ({ 
                            ...prev, 
                            first_name: e.target.value 
                          }))}
                          placeholder="John Doe"
                          className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-10"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-[#888] mb-2">Email Address</label>
                        <Input
                          value={user?.email || ''}
                          type="email"
                          disabled
                          className="bg-[#0a0a0a] border-[#2a2a2a] text-[#666] h-10 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Workspace Settings */}
                  <div className="space-y-6 pt-6 border-t border-[#1a1a1a]">
                    <h3 className="text-white font-medium">Current Workspace Settings</h3>
                    
                    {currentWorkspace ? (
                      <>
                    <div>
                      <label className="block text-sm text-[#888] mb-2">Workspace Name</label>
                      <Input
                            value={workspaceSettings.name}
                            onChange={(e) => setWorkspaceSettings(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="My Company"
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-10"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-[#888] mb-2">Primary Domain</label>
                      <Input
                            value={workspaceSettings.domain}
                            onChange={(e) => setWorkspaceSettings(prev => ({ ...prev, domain: e.target.value }))}
                        placeholder="example.com"
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-10"
                      />
                      <p className="text-xs text-[#666] mt-2">
                        This is the domain we'll monitor for AI visibility
                      </p>
                    </div>

                    <div>
                          <label className="block text-sm text-[#888] mb-2">Workspace Type</label>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              currentWorkspace.is_primary 
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                            }`}>
                              {currentWorkspace.is_primary ? 'Primary Workspace' : 'Additional Workspace'}
                            </span>
                    </div>
                          <p className="text-xs text-[#666] mt-2">
                            {currentWorkspace.is_primary 
                              ? 'This is your primary workspace and cannot be deleted'
                              : 'Additional workspace that can be managed independently'
                            }
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                        <p className="text-[#666] text-sm">Loading workspace settings...</p>
                      </div>
                    )}
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4">
                    <Button 
                      onClick={handleSaveSettings}
                      disabled={isLoading}
                      className="bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#333] text-white h-9 px-6 text-sm"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </div>

                  {/* Logout Button */}
                  <div className="flex justify-end pt-4">
                    <Button 
                      onClick={handleLogout}
                      disabled={isLoading}
                      className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 h-9 px-6 text-sm flex items-center gap-2"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <LogOut className="w-4 h-4" />
                          Logout
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Delete Account - Small text link */}
                  <div className="pt-8 border-t border-[#1a1a1a] text-center">
                    <button className="text-xs text-[#666] hover:text-red-400 transition-colors">
                      Delete Account
                    </button>
                  </div>
                </div>
              )}

              {/* API Keys Settings */}
              {activeSection === 'api-keys' && (
                <div className="space-y-6">
                  {/* Header with Generate Buttons */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-medium text-white mb-2">API Keys</h2>
                      <p className="text-sm text-[#666]">
                        Manage programmatic access to your Split Analytics data. Use test keys for development and live keys for production.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleCreateApiKey('test')}
                        disabled={isCreatingKey}
                        className="bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#333] text-white h-9 px-4 text-sm"
                      >
                        {isCreatingKey ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Generate Test Key'
                        )}
                      </Button>
                      <Button
                        onClick={() => handleCreateApiKey('live')}
                        disabled={isCreatingKey}
                        className="bg-[#333] hover:bg-[#444] border border-[#555] text-white h-9 px-4 text-sm"
                      >
                        {isCreatingKey ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Generate Live Key'
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* New Key Display */}
                  {newlyCreatedKey && (
                    <div className="bg-[#0a0a0a] border border-green-500/20 rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-white font-medium">API Key Created Successfully</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              newlyCreatedKey.startsWith('split_test_') 
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                : 'bg-green-500/10 text-green-400 border border-green-500/20'
                            }`}>
                              {newlyCreatedKey.startsWith('split_test_') ? 'Test Key' : 'Live Key'}
                            </span>
                          </div>
                          <p className="text-sm text-[#666] mb-3">
                            Save this key securely. You won't be able to see it again.
                          </p>
                          
                          <div className="flex items-center gap-2 p-3 bg-[#1a1a1a] rounded border border-[#333]">
                            <code className="text-sm text-white font-mono flex-1">
                              {newlyCreatedKey}
                            </code>
                            <Button
                              onClick={handleCopyNewKey}
                              size="sm"
                              className="bg-[#333] hover:bg-[#444] text-white h-8 px-3 text-xs"
                            >
                              {copiedNewKey ? 'Copied!' : 'Copy'}
                            </Button>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setNewlyCreatedKey(null)
                            setCopiedNewKey(false)
                          }}
                          className="text-[#666] hover:text-white transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Newly Created Key Display */}
                  {newlyCreatedKey && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#0a0a0a] border border-green-500/20 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <code className="text-sm text-white font-mono bg-[#1a1a1a] px-3 py-2 rounded flex-1 overflow-x-auto">
                          {newlyCreatedKey}
                        </code>
                        <Button
                          onClick={handleCopyNewKey}
                          variant="outline"
                          className="border-[#333] hover:border-[#444] text-white hover:text-white h-9 px-4 text-sm flex items-center gap-2"
                        >
                          {copiedNewKey ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* Keys List */}
                  {loadingKeys ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-[#666]" />
                    </div>
                  ) : apiKeys.length === 0 && !newlyCreatedKey ? (
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-8 text-center">
                      <Key className="w-10 h-10 text-[#333] mx-auto mb-3" />
                      <p className="text-[#666] text-sm">No API keys yet</p>
                      <p className="text-xs text-[#666] mt-1">Generate your first key to get started</p>
                    </div>
                  ) : (
                    <div className="border border-[#1a1a1a] rounded-lg divide-y divide-[#1a1a1a]">
                      {/* Existing keys */}
                      {apiKeys.map((apiKey) => (
                        <div
                          key={apiKey.id}
                          className="p-4 hover:bg-[#0a0a0a] transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <h4 className="text-white text-sm font-medium">{apiKey.name}</h4>
                                {/* Key Type Badge */}
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  apiKey.key.startsWith('split_test_') 
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                    : 'bg-green-500/10 text-green-400 border border-green-500/20'
                                }`}>
                                  {apiKey.key.startsWith('split_test_') ? 'Test' : 'Live'}
                                </span>
                                <span className="text-xs text-[#666]">
                                  Created {new Date(apiKey.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <code className="text-xs text-[#666] font-mono">
                                  {apiKey.key}
                                </code>
                                <button
                                  onClick={() => handleCopyApiKey(apiKey.key)}
                                  className="text-[#666] hover:text-white transition-colors group relative"
                                  title={apiKey.key.includes('*') ? "Masked keys cannot be copied" : "Copy API key"}
                                >
                                  <Copy className="w-3 h-3" />
                                  {apiKey.key.includes('*') && (
                                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-[#1a1a1a] text-xs text-[#666] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                      Keys are only shown once
                                    </span>
                                  )}
                                </button>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => {
                                setDeletingKeyId(apiKey.id)
                                setShowDeleteConfirm(true)
                              }}
                              className="text-[#666] hover:text-red-400 transition-colors p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Documentation Link */}
                  <div className="text-center pt-4">
                    <a
                      href="https://docs.split.dev#api-keys"
                      className="inline-flex items-center gap-1.5 text-xs text-[#666] hover:text-white transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View API documentation
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              {/* Billing Settings */}
              {activeSection === 'billing' && (
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
                          {/* Current Plan - Simplified */}
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
                                {usageData?.billingPeriod.planType !== 'free' && stripeCustomerId && (
                                  <Button
                                    onClick={handleManageSubscription}
                                    variant="outline"
                                    className="border-[#1a1a1a] hover:border-[#333] text-[#666] hover:text-white bg-transparent hover:bg-[#1a1a1a] h-8 px-4 font-mono tracking-tight text-sm"
                                    disabled={isLoading}
                                  >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Manage Billing'}
                                  </Button>
                                )}
                              </div>
                            </div>
                        </div>

                          {/* Add-ons - Simplified */}
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
                                      <span className="text-white font-medium min-w-[2rem] text-center font-mono tracking-tight text-sm">{workspaceCounts.extra}</span>
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

                                {/* Extra Articles - Coming Soon */}
                                <div className="flex items-center justify-between py-4 border-b border-[#1a1a1a]">
                                  <div>
                                    <div className="font-medium text-white font-mono tracking-tight text-sm">Extra Articles</div>
                                    <div className="text-xs text-[#666] font-mono tracking-tight">$10 per article per month</div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className="text-xs bg-[#222] text-[#666] px-2 py-1 rounded-sm border border-[#333] font-mono tracking-tight">
                                      Coming Soon
                              </span>
                            </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Domain Add-on Unavailable for Visibility Plan */}
                          {usageData?.billingPeriod.planType !== 'free' && currentPlan === 'visibility' && (
                            <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-6">
                              <div className="flex items-center gap-3 mb-3">
                                <Globe className="w-5 h-5 text-[#666]" />
                                <h3 className="text-lg font-medium text-white font-mono tracking-tight">Multi-Domain Tracking</h3>
                              </div>
                              <p className="text-sm text-[#666] mb-4">
                                Track additional domains beyond your primary domain. Available on Plus and Pro plans.
                              </p>
                              <Button
                                onClick={() => setShowPricingModal(true)}
                                className="bg-[#1a1a1a] hover:bg-[#333] border border-[#333] hover:border-[#444] text-white h-8 px-4 font-mono tracking-tight text-sm"
                              >
                                Upgrade to Plus
                              </Button>
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

                      {/* Usage & Controls Tab */}
                      {billingTab === 'usage' && (
                        <div className="space-y-8">
                          {/* Usage Overview - Clean Layout */}
                          <div>
                            <h3 className="text-lg font-medium text-white mb-6 font-mono tracking-tight">Current Usage</h3>
                            <div className="space-y-6">
                              {/* AI Crawler Logs */}
                              <div className="flex items-center justify-between py-3 border-b border-[#1a1a1a]">
                                <div>
                                  <div className="font-medium text-white font-mono tracking-tight text-sm">AI Crawler Logs</div>
                                  <div className="text-xs text-[#666] font-mono tracking-tight mt-1">
                                    {usageData?.aiLogs?.used || 0} / {usageData?.aiLogs?.included || 0} used
                                    {usageData?.aiLogs && usageData.aiLogs.overage > 0 && (
                                      <span className="text-[#888] ml-2">
                                        (+{usageData.aiLogs.overage} overage)
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-6">
                                  <div className="text-right">
                                    <div className="font-medium text-white font-mono tracking-tight text-sm">{usageData?.aiLogs?.remaining || 0} left</div>
                                    {usageData?.aiLogs && usageData.aiLogs.overage > 0 && (
                                      <div className="text-xs text-[#888] font-mono tracking-tight">
                                        ${usageData.aiLogs.overageCost.toFixed(3)} overage
                                      </div>
                                    )}
                                  </div>
                                  <div className="w-24 h-1 bg-[#1a1a1a] rounded-sm">
                                    <div 
                                      className={`h-full rounded-sm transition-all ${
                                        (usageData?.aiLogs?.percentage || 0) >= 100 ? 'bg-[#666]' :
                                        (usageData?.aiLogs?.percentage || 0) >= 80 ? 'bg-[#888]' : 'bg-[#444]'
                                }`}
                                style={{ 
                                        width: `${Math.min(100, ((usageData?.aiLogs?.used || 0) / Math.max(1, usageData?.aiLogs?.included || 1)) * 100)}%` 
                                }}
                              />
                            </div>
                                </div>
                          </div>

                              {/* Domains */}
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
                                    <div className="font-medium text-white font-mono tracking-tight text-sm">{usageData?.domains?.remaining || 0} slots left</div>
                                  </div>
                                  <div className="w-24 h-1 bg-[#1a1a1a] rounded-sm">
                                <div 
                                      className="h-full bg-[#444] rounded-sm transition-all"
                                      style={{ width: `${Math.min(100, ((usageData?.domains?.used || 0) / Math.max(1, usageData?.domains?.included || 1)) * 100)}%` }}
                                />
                            </div>
                                </div>
                          </div>

                              {/* Visibility Scans */}
                              <div className="flex items-center justify-between py-3 border-b border-[#1a1a1a]">
                          <div>
                                  <div className="font-medium text-white font-mono tracking-tight text-sm">Visibility Scans</div>
                                  <div className="text-xs text-[#666] font-mono tracking-tight mt-1">
                                    {usageData?.scans?.unlimitedMax ? 'Unlimited' : 'Daily scans only'}
                            </div>
                                </div>
                                <div className="flex items-center gap-6">
                                  <div className="text-right">
                                    <div className="font-medium text-white font-mono tracking-tight text-sm">{usageData?.scans?.totalScansUsed || 0} this month</div>
                                  </div>
                                  <div className="w-24 h-1 bg-[#1a1a1a] rounded-sm">
                              <div 
                                      className="h-full bg-[#444] rounded-sm transition-all"
                                      style={{ width: usageData?.scans?.unlimitedMax ? '100%' : '25%' }}
                              />
                            </div>
                                </div>
                          </div>
                        </div>
                      </div>

                          {/* Usage Warnings - Simplified */}
                          {((usageData?.aiLogs?.percentage && usageData.aiLogs.percentage >= 80) || 
                            (usageData?.aiLogs?.overage && usageData.aiLogs.overage > 0) || 
                            usageData?.aiLogs?.billingBlocked) && (
                            <div className="flex items-start gap-3 py-4 border-t border-[#1a1a1a]">
                              <div className={`w-4 h-4 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                usageData?.aiLogs?.billingBlocked ? 'bg-[#333] text-[#999]' :
                                usageData?.aiLogs?.overage && usageData.aiLogs.overage > 0 ? 'bg-[#333] text-[#ccc]' :
                                'bg-[#333] text-[#aaa]'
                              }`}>
                                <span className="text-xs font-mono">!</span>
                              </div>
                              <div>
                                <div className="font-medium text-white mb-1 font-mono tracking-tight text-sm">
                                  {usageData?.aiLogs?.billingBlocked ? 'Billing Protection Active' :
                                   usageData?.aiLogs?.overage && usageData.aiLogs.overage > 0 ? 'Overage Charges Active' :
                                   'Approaching Usage Limit'}
                                </div>
                                <div className="text-xs text-[#666] font-mono tracking-tight">
                                  {usageData?.aiLogs?.billingBlocked && 
                                    'AI log overage billing has been paused due to your spending limits. Tracking continues for analytics.'}
                                  {usageData?.aiLogs?.overage && usageData.aiLogs.overage > 0 && !usageData?.aiLogs?.billingBlocked && 
                                    `You have ${usageData.aiLogs.overage} AI crawler logs over your plan limit, costing $${usageData.aiLogs.overageCost?.toFixed(3) || '0.000'} this month.`}
                                  {usageData?.aiLogs?.percentage && usageData.aiLogs.percentage >= 80 && (!usageData?.aiLogs?.overage || usageData.aiLogs.overage === 0) && 
                                    `You've used ${usageData.aiLogs.percentage}% of your AI logs. Additional logs cost $0.008 each.`}
                                </div>
                              </div>
                            </div>
                          )}
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
                                    Track AI crawler visits to your website for analytics and billing
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

                              {/* Monthly Spending Limit */}
                              {usageData?.aiLogs?.trackingEnabled !== false && (
                                <div className="flex items-center justify-between py-3 border-b border-[#1a1a1a]">
                              <div>
                                    <div className="font-medium text-white font-mono tracking-tight text-sm">Monthly Spending Limit</div>
                                    <div className="text-xs text-[#666] font-mono tracking-tight mt-1">
                                      Maximum amount to spend on overages per month
                              </div>
                              </div>
                                  <div className="flex items-center gap-6">
                                    <div className="text-right">
                                      <div className="font-medium text-white font-mono tracking-tight text-sm">
                                        {usageData?.spendingLimits?.user_limit_cents && 
                                         usageData.spendingLimits.user_limit_cents !== usageData.spendingLimits.plan_limit_cents
                                          ? `$${(usageData.spendingLimits.user_limit_cents / 100).toFixed(2)}`
                                          : 'Not configured'}
                            </div>
                                    </div>
                                    <div className="w-24">
                                      <div className="relative">
                                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[#666] font-mono text-xs">$</span>
                                        <Input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          placeholder="0.00"
                                          disabled={savingPreferences}
                                          defaultValue={usageData?.spendingLimits?.user_limit_cents && 
                                                       usageData.spendingLimits.user_limit_cents !== usageData.spendingLimits.plan_limit_cents
                                                ? (usageData.spendingLimits.user_limit_cents / 100).toFixed(2)
                                                : ''}
                                          className="pl-5 pr-2 py-1 h-7 bg-[#111] border-[#333] text-white font-mono text-xs tracking-tight"
                                          onBlur={(e) => {
                                            const value = parseFloat(e.target.value) || 0
                                            
                                            if (value > 0) {
                                              saveBillingPreferences({ spending_limit_cents: Math.round(value * 100) })
                                            } else {
                                              // Set to null to remove the limit
                                              saveBillingPreferences({ spending_limit_cents: null })
                                            }
                                          }}
                                        />
                                </div>
                              </div>
                          </div>
                        </div>
                      )}

                              {/* Current Usage Summary */}
                              {usageData?.spendingLimits && (
                                <div className="flex items-center justify-between py-3 border-b border-[#1a1a1a]">
                            <div>
                                    <div className="font-medium text-white font-mono tracking-tight text-sm">Current Overage</div>
                                    <div className="text-xs text-[#666] font-mono tracking-tight mt-1">
                                      Overage charges this billing period
                            </div>
                                  </div>
                                  <div className="flex items-center gap-6">
                                    <div className="text-right">
                                      <div className="font-medium text-white font-mono tracking-tight text-sm">
                                        ${(usageData.spendingLimits.current_overage_cents / 100).toFixed(2)}
                                      </div>
                                      <div className="text-xs text-[#666] font-mono tracking-tight">
                                        {usageData.spendingLimits.remaining_cents !== null
                                          ? `$${(usageData.spendingLimits.remaining_cents / 100).toFixed(2)} remaining`
                                          : 'No spending limit set'}
                                      </div>
                                    </div>
                          </div>
                        </div>
                      )}

                              {/* Platform Notifications */}
                              <div className="flex items-center justify-between py-3 border-b border-[#1a1a1a]">
                                <div>
                                  <div className="font-medium text-white font-mono tracking-tight text-sm">Platform Notifications</div>
                                  <div className="text-xs text-[#666] font-mono tracking-tight mt-1">
                                    Show friendly banner warnings when you reach 90% of your usage limits
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
                            <div className="w-4 h-4 text-white mt-0.5 flex-shrink-0">
                              <Check className="w-4 h-4" />
                            </div>
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
                            ? 'bg-[#1a1a1a] hover:bg-[#333] border border-[#333] hover:border-[#444] text-white'
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

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <X className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-white mb-1">Delete API Key</h3>
                    <p className="text-sm text-[#666] mb-6">
                      This action cannot be undone. This API key will be permanently deleted and any applications using it will lose access.
                    </p>
                    
                    <div className="flex gap-3 justify-end">
                      <Button
                        onClick={() => setShowDeleteConfirm(false)}
                        variant="outline"
                        className="border-[#333] hover:border-[#444] text-[#666] hover:text-white h-9 px-4 text-sm"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          if (deletingKeyId) {
                            handleDeleteApiKey(deletingKeyId)
                          }
                          setShowDeleteConfirm(false)
                        }}
                        className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 h-9 px-4 text-sm"
                      >
                        Delete Key
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Domain Add-on Dialog */}
      <DomainAddonDialog
        open={showDomainDialog}
        onOpenChange={setShowDomainDialog}
        currentDomains={extraDomains}
        onSuccess={() => {
          fetchUsageData()
          showToast('Domain add-ons updated successfully!')
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

      {/* Workspace Switching Overlay */}
      {switching && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          style={{ pointerEvents: 'all' }}
        >
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4" style={{ perspective: '300px' }}>
              <div 
                className="w-full h-full workspace-flip-animation"
                style={{ 
                  transformStyle: 'preserve-3d'
                }}
              >
                <img 
                  src="/images/split-icon-white.svg" 
                  alt="Split" 
                  className="w-full h-full"
                />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Switching workspace...</h2>
            <p className="text-[#888] text-sm">Loading your workspace data</p>
          </div>
        </motion.div>
      )}

      <style jsx global>{`
        @keyframes workspaceFlip {
          0% { transform: rotateY(0deg); }
          25% { transform: rotateY(90deg); }
          50% { transform: rotateY(180deg); }
          75% { transform: rotateY(270deg); }
          100% { transform: rotateY(360deg); }
        }
        
        .workspace-flip-animation {
          animation: workspaceFlip 2s cubic-bezier(0.4, 0.0, 0.2, 1) infinite;
        }
      `}</style>
    </main>
  )
} 

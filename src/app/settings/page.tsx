'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { Globe, CreditCard, Key } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { NotificationBannerList } from "@/components/ui/notification-banner"
import { GeneralSettings } from '@/components/settings/general-settings'
import { APIKeysSettings } from '@/components/settings/api-keys-settings'
import { BillingSettings } from '@/components/settings/billing-settings'
import { SettingsModals } from '@/components/settings/settings-modals'

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
  domains: {
    included: number
    used: number
    purchased: number
    remaining: number
    percentage: number
  }
  snapshots: {
    included: number
    used: number
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

export default function SettingsPage() {
  const { user } = useAuth()
  const { switching } = useWorkspace()
  const [activeSection, setActiveSection] = useState('general')
  const [usageData, setUsageData] = useState<UsageData | null>(null)
  const [loadingUsage, setLoadingUsage] = useState(true)
  const searchParams = useSearchParams()

  // Fetch usage data
  const fetchUsageData = async () => {
    setLoadingUsage(true)
    try {
      const response = await fetch('/api/usage/current')
      if (response.ok) {
        const data = await response.json()
        setUsageData(data.usage)
      }
    } catch (error) {
      console.error('Error fetching usage data:', error)
    } finally {
      setLoadingUsage(false)
    }
  }

  // Fetch usage data on component mount
  useEffect(() => {
    if (user) {
      fetchUsageData()
    }
  }, [user])

  // Check URL parameters for tab selection
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) {
      setActiveSection(tab)
    }
  }, [searchParams])

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
      
      if (response.ok) {
        fetchUsageData()
      }
    } catch (error) {
      console.error('Error dismissing notification:', error)
    }
  }

  const sections = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'api-keys', label: 'API Keys', icon: Key },
    { id: 'billing', label: 'Billing', icon: CreditCard }
  ]

  return (
    <main className="min-h-full bg-white dark:bg-[#0c0c0c]">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-medium text-black dark:text-white mb-2">Settings</h1>
          <p className="text-gray-500 dark:text-[#666] text-sm">Manage your workspace and integrations</p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Sidebar Navigation */}
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
                          ? 'bg-gray-100 dark:bg-[#1a1a1a] text-black dark:text-white'
                          : 'text-gray-500 dark:text-[#666] hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#0a0a0a]'
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

          {/* Content Area */}
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
                <GeneralSettings 
                  usageData={usageData}
                  onRefreshUsage={fetchUsageData}
                />
              )}

              {/* API Keys Settings */}
              {activeSection === 'api-keys' && (
                <APIKeysSettings />
              )}

              {/* Billing Settings */}
              {activeSection === 'billing' && (
                <BillingSettings 
                  usageData={usageData}
                  loadingUsage={loadingUsage}
                  onRefreshUsage={fetchUsageData}
                />
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Modals and Overlays */}
      <SettingsModals />

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
            <h2 className="text-xl font-semibold text-black dark:text-white mb-2">Switching workspace...</h2>
            <p className="text-gray-600 dark:text-[#888] text-sm">Loading your workspace data</p>
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
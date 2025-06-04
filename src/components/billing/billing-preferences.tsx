'use client'

import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { 
  Shield, 
  DollarSign, 
  AlertTriangle, 
  Info, 
  Zap,
  BarChart3,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface BillingPreferences {
  ai_logs_enabled: boolean
  spending_limit_cents: number | null
  overage_notifications: boolean
  auto_billing_enabled: boolean
  analytics_only_mode: boolean
}

interface SpendingLimits {
  plan_spending_limit_cents: number
  max_user_spending_limit_cents: number
}

interface UsageData {
  aiLogs: {
    included: number
    used: number
    remaining: number
    percentage: number
    overage: number
    overageCost: number
    warningLevel: 'normal' | 'warning' | 'critical' | 'overage'
    trackingEnabled: boolean
    billingBlocked: boolean
    analyticsOnlyMode: boolean
  }
  spendingLimits: {
    plan_limit_cents: number
    user_limit_cents: number
    effective_limit_cents: number
    current_overage_cents: number
    remaining_cents: number
  }
}

interface BillingPreferencesProps {
  usageData?: UsageData
  onPreferencesChange?: (preferences: BillingPreferences) => void
}

export function BillingPreferences({ usageData, onPreferencesChange }: BillingPreferencesProps) {
  const [preferences, setPreferences] = useState<BillingPreferences>({
    ai_logs_enabled: true,
    spending_limit_cents: null,
    overage_notifications: true,
    auto_billing_enabled: true,
    analytics_only_mode: false
  })
  
  const [limits, setLimits] = useState<SpendingLimits>({
    plan_spending_limit_cents: 0,
    max_user_spending_limit_cents: 0
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [spendingLimitInput, setSpendingLimitInput] = useState('')

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingChange, setPendingChange] = useState<{
    type: 'disable_tracking' | 'enable_analytics_only' | 'disable_auto_billing'
    value: boolean
    title: string
    message: string
  } | null>(null)

  // Fetch current preferences
  useEffect(() => {
    fetchPreferences()
  }, [])

  // Update spending limit input when preferences change
  useEffect(() => {
    setSpendingLimitInput(
      preferences.spending_limit_cents !== null 
        ? (preferences.spending_limit_cents / 100).toFixed(2)
        : ''
    )
  }, [preferences.spending_limit_cents])

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/billing/preferences')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch preferences')
      }
      
      setPreferences(data.preferences)
      setLimits(data.limits)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preferences')
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // Parse spending limit
      let spendingLimitCents = null
      if (spendingLimitInput.trim()) {
        const limitDollars = parseFloat(spendingLimitInput)
        if (isNaN(limitDollars) || limitDollars < 0) {
          throw new Error('Spending limit must be a valid positive number')
        }
        spendingLimitCents = Math.round(limitDollars * 100)
      }

      const updatedPreferences = {
        ...preferences,
        spending_limit_cents: spendingLimitCents
      }

      const response = await fetch('/api/billing/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: updatedPreferences })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save preferences')
      }
      
      setPreferences(data.preferences)
      setSuccess('Billing preferences saved successfully!')
      onPreferencesChange?.(data.preferences)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmationNeeded = (type: string, value: boolean, currentValue: boolean) => {
    // Show confirmation for important changes
    if (type === 'ai_logs_enabled' && value === false && currentValue === true) {
      setPendingChange({
        type: 'disable_tracking',
        value,
        title: 'Disable AI Crawler Tracking?',
        message: 'This will stop tracking AI crawler visits to your website. You won\'t receive any AI visibility analytics or be able to monitor mentions of your brand across AI platforms.'
      })
      setShowConfirmDialog(true)
      return false
    }
    
    if (type === 'analytics_only_mode' && value === true && currentValue === false) {
      setPendingChange({
        type: 'enable_analytics_only',
        value,
        title: 'Enable Analytics-Only Mode?',
        message: 'This will track AI crawler visits for analytics but never charge for any overages. You\'ll see usage data but won\'t be billed for logs beyond your plan limits.'
      })
      setShowConfirmDialog(true)
      return false
    }

    if (type === 'auto_billing_enabled' && value === false && currentValue === true) {
      setPendingChange({
        type: 'disable_auto_billing',
        value,
        title: 'Disable Automatic Billing?',
        message: 'This will prevent automatic charges for overages. Your usage will be tracked but you won\'t be billed for logs beyond your plan limits until you re-enable this setting.'
      })
      setShowConfirmDialog(true)
      return false
    }

    return true
  }

  const handlePreferenceChange = (type: keyof BillingPreferences, value: boolean) => {
    const currentValue = preferences[type] as boolean
    
    if (handleConfirmationNeeded(type, value, currentValue)) {
      setPreferences(prev => ({ ...prev, [type]: value }))
    }
  }

  const confirmPendingChange = () => {
    if (pendingChange) {
      if (pendingChange.type === 'disable_tracking') {
        setPreferences(prev => ({ ...prev, ai_logs_enabled: pendingChange.value }))
      } else if (pendingChange.type === 'enable_analytics_only') {
        setPreferences(prev => ({ ...prev, analytics_only_mode: pendingChange.value }))
      } else if (pendingChange.type === 'disable_auto_billing') {
        setPreferences(prev => ({ ...prev, auto_billing_enabled: pendingChange.value }))
      }
    }
    setShowConfirmDialog(false)
    setPendingChange(null)
  }

  const cancelPendingChange = () => {
    setShowConfirmDialog(false)
    setPendingChange(null)
  }

  const getWarningAlert = () => {
    if (!usageData?.aiLogs) return null

    const { warningLevel, percentage, remaining, overage, overageCost, billingBlocked } = usageData.aiLogs

    if (billingBlocked) {
      return (
        <Alert className="border-orange-500/20 bg-orange-500/10">
          <Shield className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-orange-200">
            <strong>Billing Blocked:</strong> AI log overage billing has been paused due to your spending limits. 
            Tracking continues for analytics.
          </AlertDescription>
        </Alert>
      )
    }

    if (warningLevel === 'overage') {
      return (
        <Alert className="border-red-500/20 bg-red-500/10">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-200">
            <strong>Overage Active:</strong> You have {overage} AI logs over your limit, 
            costing ${overageCost.toFixed(3)} this month.
          </AlertDescription>
        </Alert>
      )
    }

    if (warningLevel === 'critical') {
      return (
        <Alert className="border-yellow-500/20 bg-yellow-500/10">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-200">
            <strong>Approaching Limit:</strong> {remaining} AI logs remaining before overage billing begins 
            (${(0.008).toFixed(3)} per log).
          </AlertDescription>
        </Alert>
      )
    }

    if (warningLevel === 'warning') {
      return (
        <Alert className="border-blue-500/20 bg-blue-500/10">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-200">
            You've used {percentage}% of your AI logs. Additional logs cost $0.008 each.
          </AlertDescription>
        </Alert>
      )
    }

    return null
  }

  if (loading) {
    return (
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-[#1a1a1a] rounded w-1/3 mb-4"></div>
          <div className="h-2 bg-[#1a1a1a] rounded w-full mb-2"></div>
          <div className="h-2 bg-[#1a1a1a] rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  const maxSpendingLimit = (limits.max_user_spending_limit_cents / 100).toFixed(2)

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm p-6 space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2 font-mono tracking-tight">
          <Shield className="w-5 h-5" />
          Billing & Usage Controls
        </h3>
        <p className="text-xs text-[#666] font-mono tracking-tight">
          Manage how AI crawler tracking and billing works for your account
        </p>
      </div>

      {error && (
        <div className="bg-[#111] border border-[#222] rounded-sm p-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#333] rounded-sm flex items-center justify-center">
              <span className="text-xs text-[#999] font-mono">×</span>
            </div>
            <span className="text-xs text-[#999] font-mono tracking-tight">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-[#111] border border-[#222] rounded-sm p-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#333] rounded-sm flex items-center justify-center">
              <span className="text-xs text-[#ccc] font-mono">✓</span>
            </div>
            <span className="text-xs text-[#ccc] font-mono tracking-tight">{success}</span>
          </div>
        </div>
      )}

      {getWarningAlert()}

      <div className="space-y-4">
        {/* AI Logs Tracking Toggle */}
        <div className="flex items-center justify-between p-4 bg-[#111] rounded-sm border border-[#222]">
          <div className="space-y-1">
            <div className="text-white font-medium text-sm font-mono tracking-tight flex items-center gap-2">
              <Zap className="w-4 h-4" />
              AI Crawler Tracking
            </div>
            <p className="text-xs text-[#666] font-mono tracking-tight">
              Track AI crawler visits to your website for analytics and billing
            </p>
          </div>
          <Switch
            checked={preferences.ai_logs_enabled}
            onCheckedChange={(checked) => 
              handlePreferenceChange('ai_logs_enabled', checked)
            }
          />
        </div>

        {/* Analytics Only Mode */}
        {preferences.ai_logs_enabled && (
          <div className="flex items-center justify-between p-4 bg-[#111] rounded-sm border border-[#222]">
            <div className="space-y-1">
              <div className="text-white font-medium text-sm font-mono tracking-tight flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics-Only Mode
              </div>
              <p className="text-xs text-[#666] font-mono tracking-tight">
                Track AI crawlers for analytics but never charge for overages
              </p>
            </div>
            <Switch
              checked={preferences.analytics_only_mode}
              onCheckedChange={(checked) => 
                handlePreferenceChange('analytics_only_mode', checked)
              }
            />
          </div>
        )}

        {/* Auto Billing Toggle */}
        {preferences.ai_logs_enabled && !preferences.analytics_only_mode && (
          <div className="flex items-center justify-between p-4 bg-[#111] rounded-sm border border-[#222]">
            <div className="space-y-1">
              <div className="text-white font-medium text-sm font-mono tracking-tight flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Automatic Billing
              </div>
              <p className="text-xs text-[#666] font-mono tracking-tight">
                Automatically bill for usage overages (disable to require manual approval)
              </p>
            </div>
            <Switch
              checked={preferences.auto_billing_enabled}
              onCheckedChange={(checked) => 
                handlePreferenceChange('auto_billing_enabled', checked)
              }
            />
          </div>
        )}

        {/* Spending Limit */}
        {preferences.ai_logs_enabled && !preferences.analytics_only_mode && (
          <div className="p-4 bg-[#111] rounded-sm border border-[#222]">
            <div className="text-white font-medium text-sm font-mono tracking-tight flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4" />
              Monthly Spending Limit
            </div>
            <p className="text-xs text-[#666] font-mono tracking-tight mb-3">
              Maximum amount to spend on overages per month (plan limit: ${maxSpendingLimit})
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#666] font-mono">$</span>
                <Input
                  type="number"
                  min="0"
                  max={maxSpendingLimit}
                  step="0.01"
                  placeholder="No limit"
                  value={spendingLimitInput}
                  onChange={(e) => setSpendingLimitInput(e.target.value)}
                  className="pl-6 bg-[#0a0a0a] border-[#333] text-white font-mono text-sm tracking-tight"
                />
              </div>
            </div>
            {usageData?.spendingLimits && (
              <div className="mt-2 text-xs text-[#666] font-mono tracking-tight">
                Current overage: ${(usageData.spendingLimits.current_overage_cents / 100).toFixed(2)} • 
                Remaining: ${(usageData.spendingLimits.remaining_cents / 100).toFixed(2)}
              </div>
            )}
          </div>
        )}

        {/* Email Notifications */}
        <div className="flex items-center justify-between p-4 bg-[#111] rounded-sm border border-[#222]">
          <div className="space-y-1">
            <div className="text-white font-medium text-sm font-mono tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Usage Notifications
            </div>
            <p className="text-xs text-[#666] font-mono tracking-tight">
              Send email alerts when approaching usage limits (80% and 95%)
            </p>
          </div>
          <Switch
            checked={preferences.overage_notifications}
            onCheckedChange={(checked) => 
              handlePreferenceChange('overage_notifications', checked)
            }
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-[#1a1a1a]">
        <Button
          onClick={savePreferences}
          disabled={saving}
          className="bg-white text-black hover:bg-[#f5f5f5] font-mono tracking-tight text-sm"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && pendingChange && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm w-full max-w-md">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#222] rounded-sm flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-[#888]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-white mb-1 font-mono tracking-tight">{pendingChange.title}</h3>
                  <p className="text-xs text-[#666] mb-6 font-mono tracking-tight">{pendingChange.message}</p>
                  
                  <div className="flex gap-3 justify-end">
                    <Button
                      onClick={cancelPendingChange}
                      variant="outline"
                      className="border-[#333] hover:border-[#444] text-[#666] hover:text-white h-9 px-4 text-sm font-mono tracking-tight"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={confirmPendingChange}
                      className="bg-[#222] hover:bg-[#333] border border-[#444] text-white h-9 px-4 text-sm font-mono tracking-tight"
                    >
                      Confirm
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Zap, Bell, TrendingUp, X, Check } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface EdgeAlertsPromptProps {
  trigger: 'spike_detected' | 'new_bot' | 'threshold_reached' | 'manual'
  context?: {
    domain?: string
    metric?: string
    value?: number
    threshold?: number
  }
  onUpgrade?: () => void
  onDismiss?: () => void
}

export function EdgeAlertsPrompt({ 
  trigger, 
  context, 
  onUpgrade, 
  onDismiss 
}: EdgeAlertsPromptProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const { user } = useAuth()

  const getTriggerInfo = () => {
    switch (trigger) {
      case 'spike_detected':
        return {
          title: 'Visitor Spike Detected!',
          description: `${context?.domain || 'Your website'} just saw a ${context?.value || '300%'} increase in traffic`,
          icon: TrendingUp,
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20'
        }
      case 'new_bot':
        return {
          title: 'New AI Bot Detected',
          description: `A new ${context?.metric || 'AI crawler'} just visited ${context?.domain || 'your site'}`,
          icon: Bell,
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20'
        }
      case 'threshold_reached':
        return {
          title: 'Threshold Alert',
          description: `${context?.metric || 'Visitor count'} reached ${context?.value || context?.threshold || '1,000'} visits`,
          icon: Zap,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20'
        }
      default:
        return {
          title: 'Get Real-Time Alerts',
          description: 'Never miss important changes to your website traffic and AI visibility',
          icon: Bell,
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/10',
          borderColor: 'border-purple-500/20'
        }
    }
  }

  const triggerInfo = getTriggerInfo()
  const IconComponent = triggerInfo.icon

  const handleUpgrade = async () => {
    setIsUpgrading(true)
    
    try {
      // Add Edge Alerts add-on
      const response = await fetch('/api/billing/manage-addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          addonType: 'edge_alerts',
          quantity: 1
        })
      })

      if (response.ok) {
        onUpgrade?.()
        setIsOpen(false)
      } else {
        // If adding fails, redirect to billing page
        window.location.href = '/settings?tab=billing'
      }
    } catch (error) {
      console.error('Error adding Edge Alerts:', error)
      // Fallback to billing page
      window.location.href = '/settings?tab=billing'
    } finally {
      setIsUpgrading(false)
    }
  }

  const handleDismiss = () => {
    setIsOpen(false)
    onDismiss?.()
  }

  const features = [
    'Real-time visitor spike notifications',
    'New AI bot detection alerts',
    'Custom threshold monitoring',
    'Slack & Discord webhooks',
    'Email notifications',
    'API integrations'
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-[#0a0a0a] border border-[#1a1a1a] text-white max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-lg">
              <div className={`w-10 h-10 ${triggerInfo.bgColor} rounded-lg flex items-center justify-center border ${triggerInfo.borderColor}`}>
                <IconComponent className={`w-5 h-5 ${triggerInfo.color}`} />
              </div>
              {triggerInfo.title}
            </DialogTitle>
            <button
              onClick={handleDismiss}
              className="text-[#666] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Trigger Context */}
          <div className={`${triggerInfo.bgColor} border ${triggerInfo.borderColor} rounded-lg p-4`}>
            <p className="text-sm text-[#ccc]">{triggerInfo.description}</p>
            <p className="text-xs text-[#666] mt-2">
              💡 Get notified instantly when this happens again
            </p>
          </div>

          {/* Edge Alerts Features */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-medium text-white">Edge Alerts Features</h3>
              <Badge variant="secondary" className="bg-[#1a1a1a] text-[#ccc] text-xs">
                $10/month
              </Badge>
            </div>
            
            <div className="space-y-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-sm text-[#ccc]">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-[#1a1a1a]">
            <Button
              onClick={handleDismiss}
              variant="outline"
              className="flex-1 border-[#333] hover:border-[#444] text-[#666] hover:text-white"
            >
              Not Now
            </Button>
            
            <Button
              onClick={handleUpgrade}
              disabled={isUpgrading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0"
            >
              {isUpgrading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adding...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Add Edge Alerts
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook to check if user has Edge Alerts
export function useEdgeAlerts() {
  const [hasEdgeAlerts, setHasEdgeAlerts] = useState<boolean | null>(null)
  
  const checkEdgeAlerts = async () => {
    try {
      const response = await fetch('/api/usage/current')
      if (response.ok) {
        const data = await response.json()
        const hasAlerts = data.addOns?.some((addon: any) => 
          addon.add_on_type === 'edge_alerts' && addon.is_active
        )
        setHasEdgeAlerts(hasAlerts || false)
        return hasAlerts || false
      }
    } catch (error) {
      console.error('Error checking Edge Alerts:', error)
    }
    return false
  }

  return {
    hasEdgeAlerts,
    checkEdgeAlerts,
    refreshStatus: checkEdgeAlerts
  }
} 
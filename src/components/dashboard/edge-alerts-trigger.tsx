'use client'

import { useState, useEffect } from 'react'
import { EdgeAlertsPrompt, useEdgeAlerts } from '@/components/hooks/edge-alerts-prompt'

interface EdgeAlertsTriggerProps {
  // Props for triggering alerts based on dashboard data
  visitorData?: {
    current: number
    previous: number
    domain: string
  }
  crawlerData?: {
    newBots: string[]
    domain: string
  }
  thresholds?: {
    visitorSpike: number
    customThreshold?: number
  }
}

export function EdgeAlertsTrigger({ 
  visitorData, 
  crawlerData, 
  thresholds = { visitorSpike: 200 }
}: EdgeAlertsTriggerProps) {
  const [showPrompt, setShowPrompt] = useState(false)
  const [promptConfig, setPromptConfig] = useState<any>(null)
  const { hasEdgeAlerts, checkEdgeAlerts } = useEdgeAlerts()

  useEffect(() => {
    checkEdgeAlerts()
  }, [])

  // Check for visitor spikes
  useEffect(() => {
    if (!hasEdgeAlerts && visitorData) {
      const increasePercent = ((visitorData.current - visitorData.previous) / visitorData.previous) * 100
      
      if (increasePercent >= thresholds.visitorSpike) {
        triggerAlert('spike_detected', {
          domain: visitorData.domain,
          value: Math.round(increasePercent),
          metric: 'visitor traffic'
        })
      }
    }
  }, [visitorData, hasEdgeAlerts, thresholds.visitorSpike])

  // Check for new AI bots
  useEffect(() => {
    if (!hasEdgeAlerts && crawlerData?.newBots.length) {
      triggerAlert('new_bot', {
        domain: crawlerData.domain,
        metric: crawlerData.newBots[0] // Show first new bot
      })
    }
  }, [crawlerData, hasEdgeAlerts])

  // Check custom thresholds
  useEffect(() => {
    if (!hasEdgeAlerts && thresholds.customThreshold && visitorData) {
      if (visitorData.current >= thresholds.customThreshold) {
        triggerAlert('threshold_reached', {
          domain: visitorData.domain,
          value: visitorData.current,
          threshold: thresholds.customThreshold,
          metric: 'Visitor count'
        })
      }
    }
  }, [visitorData, hasEdgeAlerts, thresholds.customThreshold])

  const triggerAlert = (trigger: string, context: any) => {
    // Prevent spam - only show one alert per session
    if (sessionStorage.getItem('edge_alerts_prompted')) return
    
    setPromptConfig({
      trigger,
      context
    })
    setShowPrompt(true)
    sessionStorage.setItem('edge_alerts_prompted', 'true')
  }

  const handleUpgrade = () => {
    // Refresh the Edge Alerts status
    checkEdgeAlerts()
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Set a session flag to prevent re-showing
    sessionStorage.setItem('edge_alerts_dismissed', 'true')
  }

  // Don't show anything if user already has Edge Alerts
  if (hasEdgeAlerts) return null

  return (
    <>
      {showPrompt && promptConfig && (
        <EdgeAlertsPrompt
          trigger={promptConfig.trigger}
          context={promptConfig.context}
          onUpgrade={handleUpgrade}
          onDismiss={handleDismiss}
        />
      )}
    </>
  )
}

// Utility function for manually triggering Edge Alerts prompts
export function triggerEdgeAlertsPrompt(
  trigger: 'spike_detected' | 'new_bot' | 'threshold_reached' | 'manual',
  context?: any
) {
  // This can be called from anywhere in the app to show Edge Alerts prompt
  const event = new CustomEvent('show-edge-alerts-prompt', {
    detail: { trigger, context }
  })
  window.dispatchEvent(event)
}

// Hook for manually triggering prompts
export function useEdgeAlertsPrompter() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [promptConfig, setPromptConfig] = useState<any>(null)

  useEffect(() => {
    const handleShowPrompt = (event: any) => {
      setPromptConfig({
        trigger: event.detail.trigger,
        context: event.detail.context
      })
      setShowPrompt(true)
    }

    window.addEventListener('show-edge-alerts-prompt', handleShowPrompt)
    return () => window.removeEventListener('show-edge-alerts-prompt', handleShowPrompt)
  }, [])

  return {
    showPrompt,
    promptConfig,
    setShowPrompt,
    triggerPrompt: triggerEdgeAlertsPrompt
  }
} 
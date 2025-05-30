'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Zap } from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'
import { checkLimit, trackUsage, saveScanHistory } from '@/lib/subscription/usage'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { UsageDisplay } from './usage-display'

interface ScanLimitCheckProps {
  domain: string
  onScanComplete?: (results: any) => void
}

export function ScanLimitCheck({ domain, onScanComplete }: ScanLimitCheckProps) {
  const [scanning, setScanning] = useState(false)
  const { subscription, usage, refresh, showUpgradePrompt } = useSubscription()
  const supabase = createClient()
  
  const handleScan = async () => {
    if (!subscription) return
    
    try {
      setScanning(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Not authenticated')
        return
      }
      
      // Check if user can perform scan
      const canScan = await checkLimit(user.id, 'scan')
      
      if (!canScan.allowed) {
        toast.error('Scan limit reached', {
          description: `You've used all ${canScan.limit} scans this month. Upgrade to continue.`,
          action: {
            label: 'Upgrade',
            onClick: () => showUpgradePrompt('scan-limit')
          }
        })
        return
      }
      
      // Determine scan type based on plan
      const scanType = subscription.plan === 'plus' || subscription.plan === 'pro' ? 'max' : 'basic'
      
      // Perform the scan (mock for this example)
      toast.info(`Starting ${scanType.toUpperCase()} scan for ${domain}...`)
      
      // Simulate scan delay
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Track the usage
      const trackResult = await trackUsage(
        user.id,
        'scan',
        scanType === 'max' ? 'max_scan' : 'basic_scan',
        { domain, timestamp: new Date().toISOString() }
      )
      
      if (!trackResult.success) {
        throw new Error(trackResult.error || 'Failed to track usage')
      }
      
      // Mock scan results
      const results = {
        score: Math.floor(Math.random() * 100),
        visibility: Math.random() > 0.5 ? 'High' : 'Medium',
        queries: scanType === 'max' ? 200 : 100,
        competitors: scanType === 'max' ? 10 : 5
      }
      
      // Save to history
      await saveScanHistory(
        user.id,
        scanType,
        domain,
        results.score,
        results
      )
      
      // Refresh usage data
      await refresh()
      
      toast.success('Scan completed!', {
        description: `Visibility score: ${results.score}/100`
      })
      
      if (onScanComplete) {
        onScanComplete(results)
      }
      
    } catch (error) {
      console.error('Scan error:', error)
      toast.error('Scan failed', {
        description: error instanceof Error ? error.message : 'Please try again'
      })
    } finally {
      setScanning(false)
    }
  }
  
  const isAtLimit = usage && usage.scansLimit !== -1 && usage.scansRemaining === 0
  
  return (
    <div className="space-y-4">
      {/* Usage display */}
      <UsageDisplay 
        usage={usage} 
        feature="scan"
        onUpgrade={() => showUpgradePrompt('scan-usage')}
        compact={false}
      />
      
      {/* Scan button */}
      <Button
        onClick={handleScan}
        disabled={scanning || isAtLimit}
        className="w-full bg-white text-black hover:bg-gray-100"
      >
        {scanning ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Scanning...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4 mr-2" />
            Run {subscription?.plan === 'plus' || subscription?.plan === 'pro' ? 'MAX' : 'Basic'} Scan
          </>
        )}
      </Button>
      
      {/* Scan type indicator */}
      {subscription && (
        <p className="text-xs text-center text-[#666]">
          {subscription.plan === 'plus' || subscription.plan === 'pro' ? (
            <>Using MAX scan (200+ queries) for deep analysis</>
          ) : (
            <>Using basic scan (100 queries). Upgrade for MAX scans.</>
          )}
        </p>
      )}
    </div>
  )
} 
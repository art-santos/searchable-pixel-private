'use client'

import { formatLimit } from '@/lib/subscription/config'
import { UsageData } from '@/lib/subscription/usage'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ArrowUpRight, Zap, FileText } from 'lucide-react'

interface UsageDisplayProps {
  usage: UsageData | null
  feature: 'scan' | 'article'
  onUpgrade?: () => void
  compact?: boolean
  showUpgradeButton?: boolean
}

export function UsageDisplay({ 
  usage, 
  feature, 
  onUpgrade,
  compact = false,
  showUpgradeButton = true 
}: UsageDisplayProps) {
  if (!usage) return null
  
  const isScans = feature === 'scan'
  const used = isScans ? usage.scansUsed : usage.articlesUsed
  const limit = isScans ? usage.scansLimit : usage.articlesLimit
  const remaining = isScans ? usage.scansRemaining : usage.articlesRemaining
  
  const isUnlimited = limit === -1
  const percentage = isUnlimited ? 0 : (used / limit) * 100
  const isNearLimit = !isUnlimited && percentage >= 80
  const isAtLimit = !isUnlimited && percentage >= 100
  
  const Icon = isScans ? Zap : FileText
  const featureName = isScans ? 'Scans' : 'Articles'
  
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Icon className="w-4 h-4 text-[#666]" />
        <span className="text-[#888]">
          {isUnlimited ? (
            'Unlimited'
          ) : (
            <>
              {used} / {formatLimit(limit)}
            </>
          )}
        </span>
      </div>
    )
  }
  
  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-white" />
          <h3 className="font-medium text-white">{featureName}</h3>
        </div>
        {showUpgradeButton && onUpgrade && !isUnlimited && (
          <Button
            onClick={onUpgrade}
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs hover:bg-[#1a1a1a]"
          >
            Upgrade
            <ArrowUpRight className="w-3 h-3 ml-1" />
          </Button>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[#888]">Used this month</span>
          <span className={`font-medium ${isAtLimit ? 'text-red-400' : isNearLimit ? 'text-yellow-400' : 'text-white'}`}>
            {isUnlimited ? (
              <>Unlimited</>
            ) : (
              <>{used} / {formatLimit(limit)}</>
            )}
          </span>
        </div>
        
        {!isUnlimited && (
          <>
            <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-white/60'
                }`}
                style={{ width: `${Math.min(100, percentage)}%` }}
              />
            </div>
            
            <div className="flex justify-between text-xs">
              <span className="text-[#666]">
                {remaining > 0 ? `${remaining} remaining` : 'Limit reached'}
              </span>
              {isNearLimit && !isAtLimit && (
                <span className="text-yellow-400">
                  {Math.round(100 - percentage)}% left
                </span>
              )}
            </div>
          </>
        )}
      </div>
      
      {isAtLimit && showUpgradeButton && onUpgrade && (
        <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded">
          <p className="text-xs text-red-400 mb-2">
            You've reached your monthly limit
          </p>
          <Button
            onClick={onUpgrade}
            size="sm"
            className="w-full h-8 bg-red-500 hover:bg-red-600 text-white text-xs"
          >
            Upgrade to Continue
          </Button>
        </div>
      )}
    </div>
  )
} 
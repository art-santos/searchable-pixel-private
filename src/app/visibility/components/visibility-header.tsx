'use client'
import { RefreshCw, Sparkles, Zap } from 'lucide-react'

interface VisibilityHeaderProps {
  tabs: Array<{ id: string; label: string }>
  activeTab: string
  onTabChange: (tabId: string) => void
  subscription: any
  hasMaxAccess: boolean
  isRefreshing: boolean
  onRefreshData: () => void
  onRunNewScan: () => void
}

export function VisibilityHeader({
  tabs,
  activeTab,
  onTabChange,
  subscription,
  hasMaxAccess,
  isRefreshing,
  onRefreshData,
  onRunNewScan
}: VisibilityHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`text-sm font-medium transition-colors ${
              activeTab === tab.id 
                ? 'text-white border-b border-white pb-1' 
                : 'text-[#666] hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      <div className="flex items-center gap-4">
        {subscription && (
          <div className="flex items-center gap-1 text-xs text-[#666]">
            <Zap className="w-3 h-3" />
            <span>
              {subscription.plan === 'free' ? 'Free Plan' :
               subscription.plan === 'visibility' ? 'Visibility Plan' :
               subscription.plan === 'plus' ? 'Plus Plan' :
               subscription.plan === 'pro' ? 'Pro Plan' : 'Plan'}
            </span>
            {hasMaxAccess && (
              <>
                <span className="mx-1">•</span>
                <span className="text-yellow-500">MAX</span>
              </>
            )}
          </div>
        )}
        
        <button
          onClick={onRefreshData}
          disabled={isRefreshing || !subscription}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border ${
            isRefreshing || !subscription
              ? 'text-[#666] border-[#333] cursor-not-allowed'
              : 'text-white border-[#444] hover:border-[#555] hover:bg-[#111]'
          } rounded`}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>

        <button
          onClick={onRunNewScan}
          disabled={isRefreshing || !subscription}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
            isRefreshing || !subscription
              ? 'bg-[#222] text-[#666] cursor-not-allowed border border-[#333]'
              : 'bg-white text-black hover:bg-[#f5f5f5] border border-white'
          } rounded`}
        >
          <Sparkles className="w-4 h-4" />
          {isRefreshing ? 'Scanning...' : 'Run New Scan'}
        </button>
      </div>
    </div>
  )
} 
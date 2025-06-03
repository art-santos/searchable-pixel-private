'use client'
import { RefreshCw, Sparkles } from 'lucide-react'

interface CentralizedEmptyStateProps {
  isRefreshing: boolean
  onRefreshScore: () => void
  subscription: any
  hasMaxAccess: boolean
  currentAssessment: {
    id: string | null
    status: 'pending' | 'running' | 'completed' | 'failed' | null
    progress: number
    stage?: string
    message?: string
    error?: string
    company?: string
  }
}

export function CentralizedEmptyState({ 
  isRefreshing, 
  onRefreshScore, 
  subscription, 
  hasMaxAccess,
  currentAssessment 
}: CentralizedEmptyStateProps) {
  const getStatusText = () => {
    if (!isRefreshing) return `Run ${hasMaxAccess ? 'MAX ' : ''}Visibility Scan`
    
    switch (currentAssessment.status) {
      case 'pending':
        return 'Initializing scan...'
      case 'running':
        const stage = currentAssessment.stage
        if (stage === 'setup') return `Setting up... ${currentAssessment.progress}%`
        if (stage === 'questions') return `Generating questions... ${currentAssessment.progress}%`
        if (stage === 'analysis') return `Analyzing responses... ${currentAssessment.progress}%`
        if (stage === 'scoring') return `Calculating scores... ${currentAssessment.progress}%`
        return `Analyzing... ${currentAssessment.progress}%`
      case 'failed':
        return 'Scan failed'
      default:
        return 'Scanning...'
    }
  }

  const getStatusDescription = () => {
    if (!isRefreshing) return "Run your first visibility scan to analyze your AI presence across platforms and unlock insights about your digital footprint."
    
    switch (currentAssessment.status) {
      case 'pending':
        return 'Setting up your visibility analysis across AI platforms'
      case 'running':
        return currentAssessment.message || `Scanning ${hasMaxAccess ? 'MAX' : 'Lite'} visibility data across multiple AI platforms and analyzing results`
      case 'failed':
        return currentAssessment.error || 'The scan encountered an error. Please try again.'
      default:
        return 'Processing your visibility scan'
    }
  }

  const getIconAndColor = () => {
    if (currentAssessment.status === 'failed') {
      return { icon: '⚠️', color: 'text-red-400', bgColor: 'bg-red-900/20 border-red-800' }
    }
    if (isRefreshing) {
      return { icon: <RefreshCw className="w-6 h-6 text-[#666] animate-spin" />, color: 'text-[#666]', bgColor: 'bg-[#111] border-[#333]' }
    }
    return { icon: <Sparkles className="w-6 h-6 text-[#666]" />, color: 'text-[#666]', bgColor: 'bg-[#111] border-[#333]' }
  }

  const { icon, color, bgColor } = getIconAndColor()

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className={`w-16 h-16 mx-auto mb-6 ${bgColor} rounded flex items-center justify-center`}>
            {typeof icon === 'string' ? (
              <span className="text-2xl">{icon}</span>
            ) : (
              <div className="relative">
                {icon}
                {currentAssessment.status === 'running' && currentAssessment.progress > 0 && (
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-[#888] font-mono">
                    {currentAssessment.progress}%
                  </div>
                )}
              </div>
            )}
          </div>
          <h3 className={`text-xl font-semibold mb-3 ${currentAssessment.status === 'failed' ? 'text-red-400' : 'text-white'}`}>
            {currentAssessment.status === 'failed' ? 'Scan failed' : 
             isRefreshing ? 'Scanning visibility...' : 'No visibility data'}
          </h3>
          <p className="text-[#888] text-sm leading-relaxed">
            {getStatusDescription()}
          </p>
          
          {/* Enhanced Progress bar */}
          {isRefreshing && currentAssessment.status === 'running' && currentAssessment.progress > 0 && (
            <div className="mt-4 w-full max-w-xs mx-auto">
              <div className="bg-[#222] rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-white h-full transition-all duration-300 ease-out"
                  style={{ width: `${currentAssessment.progress}%` }}
                />
              </div>
              {/* Stage indicator */}
              {currentAssessment.stage && (
                <div className="mt-2 text-xs text-[#666] font-mono">
                  {currentAssessment.stage === 'setup' && '🔧 Setup'}
                  {currentAssessment.stage === 'questions' && '❓ Questions'}
                  {currentAssessment.stage === 'analysis' && '🧠 Analysis'}
                  {currentAssessment.stage === 'scoring' && '📊 Scoring'}
                  {currentAssessment.stage === 'complete' && '✅ Complete'}
                </div>
              )}
            </div>
          )}
        </div>
        
        <button 
          onClick={onRefreshScore}
          disabled={isRefreshing || !subscription}
          className={`inline-flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
            isRefreshing || !subscription
              ? 'bg-[#222] text-[#666] cursor-not-allowed border border-[#333]'
              : currentAssessment.status === 'failed'
              ? 'bg-red-600 text-white hover:bg-red-700 border border-red-600'
              : 'bg-white text-black hover:bg-[#f5f5f5] border border-white'
          } rounded`}
        >
          {currentAssessment.status === 'failed' ? (
            <>
              <RefreshCw className="w-4 h-4" />
              Try Again
            </>
          ) : (
            <>
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {getStatusText()}
            </>
          )}
        </button>
        
        {hasMaxAccess && currentAssessment.status !== 'failed' && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#666]">
            <Sparkles className="w-3 h-3" />
            <span>Enhanced with MAX analytics</span>
          </div>
        )}
        
        {/* Assessment ID and company for debugging */}
        {isRefreshing && currentAssessment.id && (
          <div className="mt-2 text-xs text-[#555] font-mono space-y-1">
            <div>ID: {currentAssessment.id.slice(-8)}</div>
            {currentAssessment.company && (
              <div>Company: {currentAssessment.company}</div>
            )}
          </div>
        )}
        
        {/* Error details */}
        {currentAssessment.status === 'failed' && currentAssessment.error && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded text-left">
            <div className="text-xs text-red-400 font-mono">
              Error: {currentAssessment.error}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
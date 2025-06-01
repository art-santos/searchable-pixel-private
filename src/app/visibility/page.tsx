'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { TimeframeSelector, TimeframeOption } from '@/components/custom/timeframe-selector'
import { Sparkles, RefreshCw, Zap } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useSubscription } from '@/hooks/useSubscription'
import { toast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'

// Import our enhanced tab components
import { EnhancedOverviewTab } from './components/enhanced-overview-tab'
import { EnhancedCitationsTab } from './components/enhanced-citations-tab'
import { EnhancedGapsTab } from './components/enhanced-gaps-tab'
import { EnhancedInsightsTab } from './components/enhanced-insights-tab'

// Import our data management hook
import { useMaxVisibility } from '@/hooks/useMaxVisibility'

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'citations', label: 'Citations' },
  { id: 'gaps', label: 'Gaps & Opportunities' },
  { id: 'insights', label: 'AI Insights' },
]

interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333333] px-3 py-2 rounded">
        <p className="font-mono text-sm text-white">{Number(payload[0].value).toFixed(1)}</p>
        <p className="font-mono text-xs text-[#666666]">{label}</p>
      </div>
    )
  }
  return null
}

// Centralized Empty State Component
function CentralizedEmptyState({ 
  isRefreshing, 
  onRefreshScore, 
  subscription, 
  hasMaxAccess,
  currentAssessment 
}: { 
  isRefreshing: boolean
  onRefreshScore: () => void
  subscription: any
  hasMaxAccess: boolean
  currentAssessment: {
    id: string | null
    status: 'pending' | 'running' | 'completed' | 'failed' | null
    progress: number
  }
}) {
  const getStatusText = () => {
    if (!isRefreshing) return `Run ${hasMaxAccess ? 'MAX ' : ''}Visibility Scan`
    
    switch (currentAssessment.status) {
      case 'pending':
        return 'Initializing scan...'
      case 'running':
        return `Analyzing... ${currentAssessment.progress}%`
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
        return `Scanning ${hasMaxAccess ? 'MAX' : 'Lite'} visibility data across multiple AI platforms and analyzing results`
      default:
        return 'Processing your visibility scan'
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="w-16 h-16 mx-auto mb-6 bg-[#111] border border-[#333] rounded flex items-center justify-center">
            {isRefreshing ? (
              <div className="relative">
                <RefreshCw className="w-6 h-6 text-[#666] animate-spin" />
                {currentAssessment.status === 'running' && currentAssessment.progress > 0 && (
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-[#888] font-mono">
                    {currentAssessment.progress}%
                  </div>
                )}
              </div>
            ) : (
              <Sparkles className="w-6 h-6 text-[#666]" />
            )}
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">
            {isRefreshing ? 'Scanning visibility...' : 'No visibility data'}
          </h3>
          <p className="text-[#888] text-sm leading-relaxed">
            {getStatusDescription()}
          </p>
          
          {/* Progress bar */}
          {isRefreshing && currentAssessment.status === 'running' && currentAssessment.progress > 0 && (
            <div className="mt-4 w-full max-w-xs mx-auto">
              <div className="bg-[#222] rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-white h-full transition-all duration-300 ease-out"
                  style={{ width: `${currentAssessment.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        <button 
          onClick={onRefreshScore}
          disabled={isRefreshing || !subscription}
          className={`inline-flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
            isRefreshing || !subscription
              ? 'bg-[#222] text-[#666] cursor-not-allowed border border-[#333]'
              : 'bg-white text-black hover:bg-[#f5f5f5] border border-white'
          } rounded`}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {getStatusText()}
        </button>
        
        {hasMaxAccess && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#666]">
            <Sparkles className="w-3 h-3" />
            <span>Enhanced with MAX analytics</span>
          </div>
        )}
        
        {/* Assessment ID for debugging */}
        {isRefreshing && currentAssessment.id && (
          <div className="mt-2 text-xs text-[#555] font-mono">
            ID: {currentAssessment.id.slice(-8)}
          </div>
        )}
      </div>
    </div>
  )
}

export default function VisibilityPage() {
  const { loading, user } = useAuth()
  const { subscription } = useSubscription()
  const shouldReduceMotion = useReducedMotion()
  const [userProfile, setUserProfile] = useState<{workspace_name: string | null, domain: string | null} | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [isChartVisible, setIsChartVisible] = useState(false)
  const [hoveredScore, setHoveredScore] = useState<number | null>(null)
  const [timeframe, setTimeframe] = useState<TimeframeOption>('Last 30 days')

  // Use our MAX visibility data management hook
  const maxVisibility = useMaxVisibility()
  const hasMaxAccess = subscription?.plan === 'plus' || subscription?.plan === 'pro'
  
  const supabase = createClient()

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user || !supabase) return

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('workspace_name, domain')
          .eq('id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user profile:', error)
        }

        setUserProfile(data || { workspace_name: null, domain: null })
      } catch (err) {
        console.error('Error in profile fetch:', err)
      }
    }

    fetchUserProfile()
  }, [user, supabase])

  const containerVariants = shouldReduceMotion ? {
    hidden: { opacity: 1 },
    visible: { opacity: 1 }
  } : {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = shouldReduceMotion ? {
    hidden: { opacity: 1, y: 0 },
    visible: { opacity: 1, y: 0 }
  } : {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  }

  // Show chart after initial mount with a slight delay
  useEffect(() => {
    const timer = setTimeout(() => setIsChartVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Get display score (from real data or chart hover)
  const getDisplayScore = () => {
    if (hoveredScore !== null) return hoveredScore
    if (maxVisibility.data?.score.overall_score) return maxVisibility.data.score.overall_score
    return 0 // Fallback to 0
  }

  // Format score for display - truncate to 1 decimal without rounding
  const formatScore = (score: number): string => {
    const truncated = Math.floor(score * 10) / 10
    return truncated.toFixed(1)
  }

  const handleMouseMove = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      setHoveredScore(data.activePayload[0].value)
    }
  }

  const handleMouseLeave = () => {
    setHoveredScore(null)
  }

  const handleRefreshScore = async () => {
    await maxVisibility.triggerScan()
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0c0c0c]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-white" />
      </div>
    )
  }

  // Show centralized empty state if no data
  if (!maxVisibility.hasData) {
    return (
      <div className="min-h-full bg-[#0c0c0c]">
        <motion.main 
          className="p-8"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Minimal Header */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`text-sm font-medium transition-colors ${
                      activeTab === tab.id 
                        ? 'text-white' 
                        : 'text-[#666] hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              
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
            </div>
          </motion.div>

          {/* Centralized Empty State for ALL tabs */}
          <motion.div variants={itemVariants}>
            <CentralizedEmptyState 
              isRefreshing={maxVisibility.isRefreshing}
              onRefreshScore={handleRefreshScore}
              subscription={subscription}
              hasMaxAccess={hasMaxAccess}
              currentAssessment={maxVisibility.currentAssessment}
            />
          </motion.div>
        </motion.main>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#0c0c0c]">
      <motion.main 
        className="p-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Clean Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
              onClick={handleRefreshScore}
              disabled={maxVisibility.isRefreshing || !subscription}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border ${
                maxVisibility.isRefreshing || !subscription
                  ? 'text-[#666] border-[#333] cursor-not-allowed'
                  : 'text-white border-[#444] hover:border-[#555] hover:bg-[#111]'
              } rounded`}
            >
              <RefreshCw className={`w-4 h-4 ${maxVisibility.isRefreshing ? 'animate-spin' : ''}`} />
              {maxVisibility.isRefreshing ? 'Scanning...' : 'Refresh'}
            </button>
          </div>
        </motion.div>

        {/* Content Area */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-12 gap-8">
            {/* Chart Section */}
            <motion.div variants={itemVariants} className="col-span-8">
              <div className="mb-6">
                <TimeframeSelector 
                  title="Visibility Score"
                  timeframe={timeframe} 
                  onTimeframeChange={setTimeframe}
                  titleColor="text-white"
                  selectorColor="text-[#A7A7A7]"
                />
                <div className="text-5xl font-bold text-white mt-4">
                  {formatScore(getDisplayScore())}
                </div>
              </div>

              <div className="h-[500px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={maxVisibility.data?.chartData || []}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                          >
                            <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fff" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#fff" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" opacity={0.3} />
                            <XAxis
                              dataKey="date"
                      axisLine={false}
                              tickLine={false}
                      tick={{ fill: '#666', fontSize: 11, fontFamily: 'ui-monospace, monospace' }}
                            />
                            <YAxis
                      axisLine={false}
                              tickLine={false}
                      tick={{ fill: '#666', fontSize: 11, fontFamily: 'ui-monospace, monospace' }}
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                            />
                    <Tooltip content={<CustomTooltip />} />
                            <Area
                      type="monotone"
                              dataKey="score"
                              stroke="#fff"
                              strokeWidth={2}
                      fill="url(#scoreGradient)"
                      dot={false}
                      activeDot={{ 
                        r: 4, 
                        stroke: '#fff', 
                        strokeWidth: 2, 
                        fill: '#0c0c0c' 
                      }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Overview Tab Component */}
            <motion.div variants={itemVariants} className="col-span-4">
              <EnhancedOverviewTab 
                hasVisibilityData={maxVisibility.hasData}
                isRefreshing={maxVisibility.isRefreshing}
                onRefreshScore={handleRefreshScore}
                data={maxVisibility.data}
              />
            </motion.div>
                    </div>
                  )}
                  
        {/* Other Tabs */}
        {activeTab === 'citations' && (
          <motion.div variants={itemVariants}>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">Citations</h2>
              <p className="text-[#666] text-sm">
                {maxVisibility.data?.citations.total_count || 0} mentions across AI platforms
              </p>
                    </div>
            <EnhancedCitationsTab 
              hasVisibilityData={maxVisibility.hasData}
              isRefreshing={maxVisibility.isRefreshing}
              onRefreshScore={handleRefreshScore}
              data={maxVisibility.data}
            />
                </motion.div>
              )}
              
        {activeTab === 'gaps' && (
              <motion.div variants={itemVariants}>
                <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">Gaps & Opportunities</h2>
              <p className="text-[#666] text-sm">High-value queries to prioritize for content creation</p>
                </div>
            <EnhancedGapsTab 
              hasVisibilityData={maxVisibility.hasData}
              isRefreshing={maxVisibility.isRefreshing}
              onRefreshScore={handleRefreshScore}
              data={maxVisibility.data}
            />
                  </motion.div>
        )}

        {activeTab === 'insights' && (
              <motion.div variants={itemVariants}>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                <h2 className="text-xl font-semibold text-white mb-2">AI Insights</h2>
                <p className="text-[#666] text-sm">AI-powered recommendations and competitive intelligence</p>
                  </div>
              {hasMaxAccess && (
                <div className="flex items-center gap-2 px-3 py-1 bg-[#111] border border-[#333] rounded text-xs text-[#666]">
                  <Sparkles className="w-3 h-3" />
                  <span>MAX Analytics</span>
                        </div>
                            )}
                          </div>
            <EnhancedInsightsTab 
              hasVisibilityData={maxVisibility.hasData}
              isRefreshing={maxVisibility.isRefreshing}
              onRefreshScore={handleRefreshScore}
              data={maxVisibility.data}
            />
              </motion.div>
        )}
      </motion.main>
    </div>
  )
} 
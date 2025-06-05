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

// Mock chart data - 30 days (keep existing chart for now)
const chartData = [
  { date: 'APR 1', score: 45.2 },
  { date: 'APR 2', score: 44.8 },
  { date: 'APR 3', score: 43.1 },
  { date: 'APR 4', score: 42.1 },
  { date: 'APR 5', score: 43.7 },
  { date: 'APR 6', score: 46.2 },
  { date: 'APR 7', score: 48.3 },
  { date: 'APR 8', score: 49.1 },
  { date: 'APR 9', score: 51.4 },
  { date: 'APR 10', score: 52.7 },
  { date: 'APR 11', score: 54.3 },
  { date: 'APR 12', score: 56.8 },
  { date: 'APR 13', score: 58.9 },
  { date: 'APR 14', score: 57.2 },
  { date: 'APR 15', score: 56.4 },
  { date: 'APR 16', score: 55.4 },
  { date: 'APR 17', score: 58.1 },
  { date: 'APR 18', score: 61.7 },
  { date: 'APR 19', score: 65.2 },
  { date: 'APR 20', score: 63.8 },
  { date: 'APR 21', score: 62.4 },
  { date: 'APR 22', score: 64.1 },
  { date: 'APR 23', score: 66.3 },
  { date: 'APR 24', score: 68.7 },
  { date: 'APR 25', score: 67.2 },
  { date: 'APR 26', score: 69.4 },
  { date: 'APR 27', score: 71.8 },
  { date: 'APR 28', score: 70.3 },
  { date: 'APR 29', score: 72.1 },
  { date: 'APR 30', score: 74.5 },
]

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
        <p className="font-mono text-sm text-white">{payload[0].value}</p>
        <p className="font-mono text-xs text-[#666666]">{label}</p>
      </div>
    )
  }
  return null
}

export default function EnhancedVisibilityPage() {
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
    return chartData[chartData.length - 1].score // Fallback to chart data
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
    // Always trigger MAX scan from visibility dashboard
    await maxVisibility.triggerScan('max')
  }

  // Helper to get display name
  const getUserDisplayName = () => {
    return userProfile?.workspace_name || 'Your Company'
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0c0c0c]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-white" />
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#0c0c0c]">
      <motion.main 
        className="p-4 md:p-6 lg:p-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Tab Navigation */}
        <motion.div variants={itemVariants} className="flex items-center justify-between gap-2 mb-6 md:mb-8">
          <div className="flex items-center gap-2 flex-wrap">
            {tabs.map((tab) => {
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-3 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium tracking-tight transition-colors border
                    ${activeTab === tab.id 
                      ? 'bg-[#222] text-white border-[#444]' 
                      : 'text-[#666] hover:text-white hover:bg-[#1a1a1a] border-[#333]'
                    }
                  `}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {/* Scan Schedule Display */}
            {subscription && (
              <div className="hidden md:flex items-center gap-2 text-sm">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-[#666]" />
                    <span className="text-[#888] text-xs font-medium">
                      {(() => {
                        switch (subscription.plan) {
                          case 'free':
                            return 'Free Plan'
                          case 'visibility':
                            return 'Visibility Plan'
                          case 'plus':
                            return 'Plus Plan'
                          case 'pro':
                            return 'Pro Plan'
                          default:
                            return 'Plan'
                        }
                      })()}
                    </span>
                  </div>
                  <span className="text-[#666] text-xs">
                    {(() => {
                      switch (subscription.plan) {
                        case 'free':
                          return 'Scans every 7 days'
                        case 'visibility':
                          return 'Daily scans'
                        case 'plus':
                          return 'Daily MAX scans'
                        case 'pro':
                          return 'Daily MAX + on-demand'
                        default:
                          return 'Scan schedule'
                      }
                    })()}
                  </span>
                </div>
                {maxVisibility.featureAccess.hasMaxAccess && (
                  <span className="text-xs text-yellow-500 font-medium bg-yellow-500/10 px-2 py-0.5 rounded">MAX</span>
                )}
              </div>
            )}
            
            <button
              onClick={handleRefreshScore}
              disabled={maxVisibility.isRefreshing || !subscription}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium tracking-tight transition-colors border flex items-center gap-2 ${
                maxVisibility.isRefreshing || !subscription
                  ? 'text-[#444] border-[#333] cursor-not-allowed'
                  : 'text-[#666] hover:text-white hover:bg-[#1a1a1a] border-[#333]'
              }`}
            >
              <RefreshCw className={`h-3 w-3 md:h-4 md:w-4 ${maxVisibility.isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {maxVisibility.isRefreshing ? 'Scanning...' : 
                 `Refresh Score${maxVisibility.featureAccess.hasMaxAccess ? ' (MAX)' : ''}`}
              </span>
              <span className="sm:hidden">{maxVisibility.isRefreshing ? '...' : 'Refresh'}</span>
            </button>
          </div>
        </motion.div>

        {/* Main Content Area */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8" style={{ minHeight: '75vh'}}>
            {/* Chart Section - Maintaining existing layout */}
            <motion.div variants={itemVariants} className="lg:col-span-7 flex flex-col">
              {/* Score Header */}
              <div className="mb-6">
                <TimeframeSelector 
                  title="Visibility Score"
                  timeframe={timeframe} 
                  onTimeframeChange={setTimeframe}
                  titleColor="text-white"
                  selectorColor="text-[#A7A7A7]"
                />
                <div className={`text-5xl font-bold transition-all duration-200 mt-4 ${
                  maxVisibility.hasData ? 'text-white' : 'text-[#333]'
                }`}>
                  {maxVisibility.hasData ? getDisplayScore().toFixed(1) : '—'}
                </div>
                {!maxVisibility.hasData && (
                  <p className="text-[#666] text-sm mt-2">Score will appear after first scan</p>
                )}
              </div>

              {/* Chart Container - Keep existing chart implementation */}
              <div className="flex-1" style={{ minHeight: '60vh' }}>
                {maxVisibility.hasData ? (
                  <AnimatePresence mode="wait">
                    {isChartVisible && (
                      <motion.div 
                        className="h-full w-full relative"
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ 
                          duration: 0.3,
                          ease: [0.16, 1, 0.3, 1]
                        }}
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={chartData}
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
                              domain={['dataMin - 5', 'dataMax + 5']}
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                ) : (
                  /* Empty State for Chart */
                  <div className="flex items-center justify-center h-full border border-[#333] rounded-lg bg-[#0a0a0a]">
                    <div className="text-center">
                      <div className="text-[#666] text-sm mb-4">No historical data available</div>
                      <div className="text-[#888] text-xs">Complete your first scan to see trends</div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Enhanced Overview Tab Component - Replace existing competitive section */}
            <motion.div variants={itemVariants} className="lg:col-span-5">
              <EnhancedOverviewTab 
                hasVisibilityData={maxVisibility.hasData}
                isRefreshing={maxVisibility.isRefreshing}
                onRefreshScore={handleRefreshScore}
              />
            </motion.div>
          </div>
        )}

        {/* Enhanced Citations Tab */}
        {activeTab === 'citations' && (
          <div className="h-[95vh] bg-[#0c0c0c] overflow-hidden">
            <motion.main 
              className="h-full flex flex-col"
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              {/* Minimal Header */}
              <motion.div variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-2">Citations</h2>
                <p className="text-[#666] text-sm">
                  {maxVisibility.hasData 
                    ? `${maxVisibility.data?.citations.total_count || 0} mentions across AI platforms`
                    : 'AI platform mentions will appear here'
                  }
                </p>
              </motion.div>

              {/* Enhanced Citations Component */}
              <motion.div variants={itemVariants} className="flex-1 min-h-0">
                <EnhancedCitationsTab 
                  hasVisibilityData={maxVisibility.hasData}
                  isRefreshing={maxVisibility.isRefreshing}
                  onRefreshScore={handleRefreshScore}
                />
              </motion.div>
            </motion.main>
          </div>
        )}

        {/* Enhanced Gaps Tab */}
        {activeTab === 'gaps' && (
          <div className="h-[95vh] bg-[#0c0c0c] overflow-hidden">
            <motion.main 
              className="h-full flex flex-col"
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              {/* Minimal Header */}
              <motion.div variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-2">Gaps & Opportunities</h2>
                <p className="text-[#666] text-sm">High-value queries to prioritize for content creation</p>
              </motion.div>

              {/* Enhanced Gaps Component */}
              <motion.div variants={itemVariants} className="flex-1 min-h-0">
                <EnhancedGapsTab 
                  hasVisibilityData={maxVisibility.hasData}
                  isRefreshing={maxVisibility.isRefreshing}
                  onRefreshScore={handleRefreshScore}
                />
              </motion.div>
            </motion.main>
          </div>
        )}

        {/* Enhanced Insights Tab - New MAX-powered tab */}
        {activeTab === 'insights' && (
          <div className="h-[95vh] bg-[#0c0c0c] overflow-hidden">
            <motion.main 
              className="h-full flex flex-col"
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              {/* Minimal Header */}
              <motion.div variants={itemVariants} className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-white mb-2">AI Insights</h2>
                    <p className="text-[#666] text-sm">AI-powered recommendations and competitive intelligence</p>
                  </div>
                  {maxVisibility.featureAccess.hasMaxAccess && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#222] border border-[#333] rounded text-xs text-[#888]">
                      <Sparkles className="w-3 h-3" />
                      <span>MAX Analytics</span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Enhanced Insights Component */}
              <motion.div variants={itemVariants} className="flex-1 min-h-0">
                <EnhancedInsightsTab 
                  hasVisibilityData={maxVisibility.hasData}
                  isRefreshing={maxVisibility.isRefreshing}
                  onRefreshScore={handleRefreshScore}
                />
              </motion.div>
            </motion.main>
          </div>
        )}
      </motion.main>
    </div>
  )
} 
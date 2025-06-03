'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { TimeframeOption } from '@/components/custom/timeframe-selector'
import { Sparkles, Zap } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { useSubscription } from '@/hooks/useSubscription'
import { createClient } from '@/lib/supabase/client'

// Import our enhanced tab components
import { EnhancedOverviewTab } from './components/enhanced-overview-tab'
import { EnhancedCitationsTab } from './components/enhanced-citations-tab'
import { EnhancedGapsTab } from './components/enhanced-gaps-tab'
import { EnhancedInsightsTab } from './components/enhanced-insights-tab'

// Import our new components
import { VisibilityChart } from './components/visibility-chart'
import { VisibilityHeader } from './components/visibility-header'
import { CentralizedEmptyState } from './components/centralized-empty-state'

// Import our data management hook
import { useMaxVisibility } from '@/hooks/useMaxVisibility'

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'citations', label: 'Citations' },
  { id: 'gaps', label: 'Gaps & Opportunities' },
  { id: 'insights', label: 'AI Insights' },
]

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

  // Reset chart visibility when data changes
  useEffect(() => {
    if (maxVisibility.hasData) {
      setIsChartVisible(false)
      const timer = setTimeout(() => setIsChartVisible(true), 100)
      return () => clearTimeout(timer)
    }
  }, [maxVisibility.hasData])

  // Get display score (from real data or chart hover)
  const getDisplayScore = () => {
    if (hoveredScore !== null) return hoveredScore
    if (maxVisibility.data?.score.overall_score) {
      // Convert 0-1 scale to percentage (0.21 → 21.0)
      return maxVisibility.data.score.overall_score * 100
    }
    return 0 // Fallback to 0
  }

  // Format score for display - truncate to 1 decimal without rounding
  const formatScore = (score: number): string => {
    // Truncate to 1 decimal place without rounding
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
    // Clear cache and refresh data (no new scan)
    maxVisibility.clearCache()
    await maxVisibility.refresh()
  }

  const handleRunNewScan = async () => {
    // Always trigger a new MAX scan regardless of existing data
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
          <motion.div variants={itemVariants} className="mb-8">
            <VisibilityHeader
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              subscription={subscription}
              hasMaxAccess={hasMaxAccess}
              isRefreshing={maxVisibility.isRefreshing}
              onRefreshData={handleRefreshScore}
              onRunNewScan={handleRunNewScan}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <CentralizedEmptyState 
              isRefreshing={maxVisibility.isRefreshing}
              onRefreshScore={handleRunNewScan}
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
        {/* Header */}
        <motion.div variants={itemVariants}>
          <VisibilityHeader
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            subscription={subscription}
            hasMaxAccess={hasMaxAccess}
            isRefreshing={maxVisibility.isRefreshing}
            onRefreshData={handleRefreshScore}
            onRunNewScan={handleRunNewScan}
          />
        </motion.div>

        {/* Content Area */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-12 gap-8">
            {/* Chart Section */}
            <motion.div variants={itemVariants} className="col-span-8">
              <VisibilityChart
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
                chartData={maxVisibility.data?.chartData || []}
                displayScore={getDisplayScore()}
                formatScore={formatScore}
                isChartVisible={isChartVisible}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              />
            </motion.div>

            {/* Overview Tab Component */}
            <motion.div variants={itemVariants} className="col-span-4">
              <EnhancedOverviewTab 
                hasVisibilityData={maxVisibility.hasData}
                isRefreshing={maxVisibility.isRefreshing}
                onRefreshScore={handleRunNewScan}
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
              onRefreshScore={handleRunNewScan}
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
              onRefreshScore={handleRunNewScan}
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
              onRefreshScore={handleRunNewScan}
              data={maxVisibility.data}
            />
          </motion.div>
        )}
      </motion.main>
    </div>
  )
} 
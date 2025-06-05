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

// Import our new components
import { VisibilityChart } from './components/visibility-chart'
import { VisibilityHeader } from './components/visibility-header'
import { CentralizedEmptyState } from './components/centralized-empty-state'

// Import our new modal components
import { ScanProgressModal } from './components/scan-progress-modal'
import { ScanResultsModal } from './components/scan-results-modal'

// Import our data management hook
import { useMaxVisibility } from '@/hooks/useMaxVisibility'

// Import our skeleton components
import { 
  VisibilityPageSkeleton, 
  CitationsTabSkeleton, 
  GapsTabSkeleton 
} from './components/visibility-skeleton'

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'citations', label: 'Citations' },
  { id: 'gaps', label: 'Gaps & Opportunities' }
]

export default function VisibilityPage() {
  const { loading: authLoading, user } = useAuth()
  const { subscription } = useSubscription()
  const shouldReduceMotion = useReducedMotion()
  const [userProfile, setUserProfile] = useState<{workspace_name: string | null, domain: string | null} | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [isChartVisible, setIsChartVisible] = useState(false)
  const [hoveredScore, setHoveredScore] = useState<number | null>(null)
  const [timeframe, setTimeframe] = useState<TimeframeOption>('Last 30 days')

  // Modal states
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [previousScore, setPreviousScore] = useState<number | null>(null)

  // Use our MAX visibility data management hook
  const maxVisibility = useMaxVisibility()
  const hasMaxAccess = subscription?.plan === 'plus' || subscription?.plan === 'pro'

  // Debug current state
  useEffect(() => {
    console.log('🔍 Visibility page state update:', {
      hasData: maxVisibility.hasData,
      isLoading: maxVisibility.isLoading,
      isInitialLoading: maxVisibility.isInitialLoading,
      isRefreshing: maxVisibility.isRefreshing,
      error: maxVisibility.error,
      lastUpdated: maxVisibility.lastUpdated,
      score: maxVisibility.data?.score?.overall_score,
      assessmentStatus: maxVisibility.currentAssessment.status,
      assessmentId: maxVisibility.currentAssessment.id?.slice(-8)
    })

    // Log detailed score information if available
    if (maxVisibility.data?.score) {
      console.log('📊 Score Analysis:', {
        overall: maxVisibility.data.score.overall_score,
        trend: maxVisibility.data.score.trend_change,
        lastUpdated: maxVisibility.lastUpdated,
        scanType: maxVisibility.scanType
      })
    }

    // Log competitive information if available
    if (maxVisibility.data?.competitive) {
      console.log('🏁 Competitive Analysis:', {
        currentRank: maxVisibility.data.competitive.current_rank,
        totalCompetitors: maxVisibility.data.competitive.total_competitors,
        percentile: maxVisibility.data.competitive.percentile,
        competitorsCount: maxVisibility.data.competitive.competitors?.length || 0
      })
    }
  }, [
    maxVisibility.hasData, 
    maxVisibility.isLoading, 
    maxVisibility.isInitialLoading,
    maxVisibility.isRefreshing,
    maxVisibility.error,
    maxVisibility.lastUpdated,
    maxVisibility.data?.score?.overall_score,
    maxVisibility.currentAssessment.status,
    maxVisibility.currentAssessment.id,
    maxVisibility.data?.score,
    maxVisibility.data?.competitive
  ])
  
  const supabase = createClient()

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

  const handleRefreshScore = async () => {
    console.log('🔄 Refreshing score data...')
    
    // Clear cache and refresh data (no new scan)
    console.log('🧹 Clearing cache...')
    maxVisibility.clearCache()
    
    console.log('📊 Calling refresh...')
    await maxVisibility.refresh()
    
    console.log('✅ Refresh completed')
  }

  const handleRunNewScan = async () => {
    // Store current score as previous score before starting new scan
    if (maxVisibility.data?.score?.overall_score) {
      setPreviousScore(maxVisibility.data.score.overall_score * 100)
    }
    
    console.log('🔥 Starting new visibility scan')
    await maxVisibility.triggerScan('max')
  }

  // Fetch user profile data and visibility data in parallel
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user || !supabase) return

      try {
        // Fetch profile and visibility data in parallel
        const [profileResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('workspace_name, domain')
            .eq('id', user.id)
            .single(),
          maxVisibility.refresh() // Refresh visibility data
        ])

        if (profileResult.error && profileResult.error.code !== 'PGRST116') {
          console.error('Error fetching user profile:', profileResult.error)
        }

        setUserProfile(profileResult.data || { workspace_name: null, domain: null })
      } catch (err) {
        console.error('Error in initial data fetch:', err)
      }
    }

    loadInitialData()
  }, [user, supabase])

  // Show chart after mount with slight delay
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

  // Handle assessment status changes for modal management
  useEffect(() => {
    const { currentAssessment } = maxVisibility

    console.log('🎯 Modal effect triggered:', {
      assessmentId: currentAssessment.id?.slice(-8),
      status: currentAssessment.status,
      progress: currentAssessment.progress,
      stage: currentAssessment.stage,
      showProgressModal,
      showResultsModal,
      hasData: maxVisibility.hasData,
      hasScore: !!maxVisibility.data?.score?.overall_score
    })

    // Show progress modal when assessment is running, pending, or completed
    if (currentAssessment.status === 'running' || currentAssessment.status === 'pending') {
      console.log('📱 Showing progress modal for running/pending assessment')
      setShowProgressModal(true)
      setShowResultsModal(false)
    }
    
    // Keep progress modal open when completed to show final score
    // The progress modal now handles the completion state internally
    else if (currentAssessment.status === 'completed') {
      console.log('✅ Assessment completed, ensuring progress modal is open to show final score')
      setShowProgressModal(true) // Ensure modal is open to show completion
      setShowResultsModal(false)
    }
    
    // Hide progress modal on failure (error handling is done by the hook with toasts)
    else if (currentAssessment.status === 'failed') {
      console.log('❌ Assessment failed, hiding modals')
      setShowProgressModal(false)
      setShowResultsModal(false)
    }

    // Hide modals when no active assessment
    else if (!currentAssessment.status) {
      console.log('💤 No active assessment, hiding progress modal')
      setShowProgressModal(false)
      // Don't auto-hide results modal, let user close it
    }
  }, [maxVisibility.currentAssessment.status, maxVisibility.currentAssessment.progress, maxVisibility.hasData])

  // Show loading skeleton while initial data loads OR while refreshing without data
  if (authLoading || (maxVisibility.isInitialLoading && !maxVisibility.hasData)) {
    return (
      <div className="min-h-screen bg-[#0c0c0c]">
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
            {activeTab === 'overview' && <VisibilityPageSkeleton />}
            {activeTab === 'citations' && <CitationsTabSkeleton />}
            {activeTab === 'gaps' && <GapsTabSkeleton />}
          </motion.div>
        </motion.main>
      </div>
    )
  }

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

  // Show centralized empty state if no data (and not loading)
  if (!maxVisibility.hasData && !maxVisibility.isInitialLoading) {
    return (
      <div className="min-h-screen bg-[#0c0c0c]">
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

  // Show main content when data is available
  return (
    <div className="min-h-screen bg-[#0c0c0c]">
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
            <EnhancedGapsTab 
              hasVisibilityData={maxVisibility.hasData}
              isRefreshing={maxVisibility.isRefreshing}
              onRefreshScore={handleRunNewScan}
              data={maxVisibility.data}
            />
          </motion.div>
        )}

        {/* Progress Modal */}
        <ScanProgressModal
          isOpen={showProgressModal}
          onOpenChange={setShowProgressModal}
          progress={maxVisibility.currentAssessment.progress}
          stage={maxVisibility.currentAssessment.stage}
          message={maxVisibility.currentAssessment.message}
          assessmentId={maxVisibility.currentAssessment.id}
          status={maxVisibility.currentAssessment.status}
          finalScore={maxVisibility.data?.score?.overall_score ? maxVisibility.data.score.overall_score * 100 : undefined}
          previousScore={previousScore || undefined}
        />

        {/* Results Modal - Keep for potential future use but don't auto-show */}
        <ScanResultsModal
          isOpen={showResultsModal}
          onOpenChange={setShowResultsModal}
          newScore={(maxVisibility.data?.score?.overall_score || 0) * 100}
          previousScore={previousScore || undefined}
          scanType="max"
          assessmentId={maxVisibility.currentAssessment.id || undefined}
          additionalMetrics={{
            mentionRate: maxVisibility.data?.citations?.coverage_rate,
            sentimentScore: maxVisibility.data?.citations?.sentiment_score,
            citationScore: undefined, // Not available in current API response
            competitiveScore: undefined // Not available in current API response
          }}
        />
      </motion.main>
    </div>
  )
} 
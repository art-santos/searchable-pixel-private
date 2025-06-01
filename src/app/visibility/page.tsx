'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { OverviewTab } from './components/overview-tab'
import { TimeframeSelector, TimeframeOption } from '@/components/custom/timeframe-selector'
import { Sparkles, Trophy, Target, ChevronDown, RefreshCw, Search, Filter, Download, ExternalLink, ArrowUpRight, AlertCircle, CheckCircle2, Zap, Copy, X, Bookmark } from 'lucide-react'
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
import Image from 'next/image'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSubscription } from '@/hooks/useSubscription'
import { ProtectedFeature } from '@/components/subscription/protected-feature'
import { PlanType } from '@/lib/subscription/config'
import { toast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'

// Mock chart data - 30 days
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

const competitorsByQuery = {
  'AI research agents': [
    { name: 'Salesforce', url: 'salesforce.com', score: 89.9, icon: '/images/salesforce.svg' },
    { name: 'Gong', url: 'gong.io', score: 84.8, icon: '/images/gong.svg' },
    { name: 'Clari', url: 'clari.com', score: 82.1, icon: '/images/clari.svg' },
    { name: 'Apollo', url: 'apollo.io', score: 79.4, icon: '/images/apollo.svg' },
    { name: 'Origami Agents', url: 'origamiagents.com', score: 72.2, icon: '/origami-favicon.svg', isUser: true },
  ],
  'Sales automation tools': [
    { name: 'HubSpot', url: 'hubspot.com', score: 92.3, icon: '/images/hubspot.svg' },
    { name: 'Salesforce', url: 'salesforce.com', score: 89.9, icon: '/images/salesforce.svg' },
    { name: 'Pipedrive', url: 'pipedrive.com', score: 76.1, icon: '/images/pipedrive.svg' },
    { name: 'Origami Agents', url: 'origamiagents.com', score: 72.2, icon: '/origami-favicon.svg', isUser: true },
    { name: 'ActiveCampaign', url: 'activecampaign.com', score: 68.5, icon: '/images/activecampaign.svg' },
  ],
  'CRM platforms': [
    { name: 'Salesforce', url: 'salesforce.com', score: 94.7, icon: '/images/salesforce.svg' },
    { name: 'HubSpot', url: 'hubspot.com', score: 91.2, icon: '/images/hubspot.svg' },
    { name: 'Pipedrive', url: 'pipedrive.com', score: 83.4, icon: '/images/pipedrive.svg' },
    { name: 'Zoho CRM', url: 'zoho.com/crm', score: 78.9, icon: '/images/zoho.svg' },
    { name: 'Origami Agents', url: 'origamiagents.com', score: 72.2, icon: '/origami-favicon.svg', isUser: true },
  ],
  'Lead generation software': [
    { name: 'Apollo', url: 'apollo.io', score: 87.6, icon: '/images/apollo.svg' },
    { name: 'ZoomInfo', url: 'zoominfo.com', score: 85.3, icon: '/images/zoominfo.svg' },
    { name: 'Outreach', url: 'outreach.io', score: 82.1, icon: '/images/outreach.svg' },
    { name: 'Origami Agents', url: 'origamiagents.com', score: 72.2, icon: '/origami-favicon.svg', isUser: true },
    { name: 'Lemlist', url: 'lemlist.com', score: 69.8, icon: '/images/lemlist.svg' },
  ]
}

const queryOptions = Object.keys(competitorsByQuery)

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'citations', label: 'Citations' },
  { id: 'map', label: 'Topic Map' },
  { id: 'gaps', label: 'Gaps & Opportunities' },
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

// Mock data for Citations tab - Updated to show referring sources
const citationsData = [
  { id: 1, engine: 'Forbes', query: 'What is Origami Agents?', matchType: 'Direct', snippet: 'Origami Agents is a powerful AI tool that helps sales teams automate their outbound processes...', date: '2025-01-20', url: 'https://forbes.com/origami-agents-review' },
  { id: 2, engine: 'TechCrunch', query: 'Best AI tools for outbound sales', matchType: 'Indirect', snippet: 'Some sales teams use Origami Agents for their automated outreach campaigns...', date: '2025-01-18', url: 'https://techcrunch.com/ai-sales-tools' },
  { id: 3, engine: 'Wired', query: 'AI SDR tools comparison', matchType: 'Direct', snippet: 'Origami Agents stands out among AI SDR tools for its advanced automation...', date: '2025-01-15', url: 'https://wired.com/ai-sdr-comparison' },
  { id: 4, engine: 'VentureBeat', query: 'Sales automation platforms', matchType: 'Indirect', snippet: 'Companies like those using Origami Agents are seeing 40% increase...', date: '2025-01-12', url: 'https://venturebeat.com/sales-automation' },
  { id: 5, engine: 'The Verge', query: 'Origami Agents pricing', matchType: 'Direct', snippet: 'Origami Agents offers flexible pricing plans starting from...', date: '2025-01-10', url: 'https://theverge.com/origami-pricing' },
  { id: 6, engine: 'Ars Technica', query: 'Cold email tools for startups', matchType: 'Indirect', snippet: 'Startups often choose solutions like Origami Agents to scale...', date: '2025-01-08', url: 'https://arstechnica.com/cold-email-tools' },
]

// Type for node positions
type NodePositions = {
  [key: string]: { x: number; y: number }
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
  const [selectedQuery, setSelectedQuery] = useState<string>('AI research agents')
  const [selectedCitation, setSelectedCitation] = useState<any>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [scanType, setScanType] = useState<'basic' | 'max'>('basic')
  const [hasVisibilityData, setHasVisibilityData] = useState(false) // Track if user has visibility data

  const supabase = createClient()

  // Check if user has visibility data - for now we'll simulate this
  useEffect(() => {
    const checkVisibilityData = async () => {
      // TODO: Replace with actual API call to check if user has visibility data
      // For now, simulate that user has no data initially
      setHasVisibilityData(false)
    }
    
    checkVisibilityData()
  }, [])

  // Development helper: middle mouse button to toggle data state
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const handleMiddleClick = (e: MouseEvent) => {
      if (e.button === 1) { // Middle mouse button
        e.preventDefault()
        setHasVisibilityData(prev => !prev)
      }
    }

    document.addEventListener('mousedown', handleMiddleClick)
    return () => document.removeEventListener('mousedown', handleMiddleClick)
  }, [])

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

  // Topic Map draggable positions
  const [topicNodePositions, setTopicNodePositions] = useState<NodePositions>({
    'center': { x: 0, y: 0 },
    'ai-sales': { x: -120, y: -80 },
    'cold-outreach': { x: 100, y: -60 },
    'sdrs': { x: -80, y: 100 },
    'lead-gen': { x: 120, y: 80 },
    'email-automation': { x: 0, y: -140 },
    'crm-integration': { x: 0, y: 140 },
  })

  // Mock data - replace with real API calls
  const baseVisibilityScore = 74.5 // Latest score from chart data
  const displayScore = hoveredScore !== null ? hoveredScore : baseVisibilityScore
  const directPoints = 32
  const indirectPoints = 58
  const totalCitations = 86
  
  // Update competitors to use real user data
  const getUserDisplayName = () => {
    return userProfile?.workspace_name || 'Your Company'
  }
  
  const getUserDomain = () => {
    return userProfile?.domain || 'your-domain.com'
  }
  
  // Create dynamic competitors with user data - Top 10 list
  const currentCompetitors = [
    { name: 'Salesforce', url: 'salesforce.com', score: 89.9, actualRank: 1, isUser: false },
    { name: 'HubSpot', url: 'hubspot.com', score: 87.2, actualRank: 2, isUser: false },
    { name: 'Gong', url: 'gong.io', score: 84.8, actualRank: 3, isUser: false },
    { name: 'Clari', url: 'clari.com', score: 82.1, actualRank: 4, isUser: false },
    { name: 'Apollo', url: 'apollo.io', score: 79.4, actualRank: 5, isUser: false },
    { name: 'ZoomInfo', url: 'zoominfo.com', score: 76.8, actualRank: 6, isUser: false },
    { name: 'Outreach', url: 'outreach.io', score: 74.5, actualRank: 7, isUser: false },
    { name: 'Pipedrive', url: 'pipedrive.com', score: 73.1, actualRank: 8, isUser: false },
    { name: 'ActiveCampaign', url: 'activecampaign.com', score: 71.6, actualRank: 9, isUser: false },
    { name: getUserDisplayName(), url: getUserDomain(), score: 72.2, actualRank: 10, isUser: true }, // User always in top 10, worst case position 10
  ]

  // Mock data for Topic Map
  const topicNodes = [
    { id: 'center', label: getUserDisplayName(), x: 0, y: 0, size: 40, type: 'center', citations: 86 },
    { id: 'ai-sales', label: 'AI Sales Tools', x: -120, y: -80, size: 28, type: 'topic', citations: 34 },
    { id: 'cold-outreach', label: 'Cold Outreach', x: 100, y: -60, size: 24, type: 'topic', citations: 28 },
    { id: 'sdrs', label: 'SDR Automation', x: -80, y: 100, size: 20, type: 'topic', citations: 24 },
    { id: 'lead-gen', label: 'Lead Generation', x: 120, y: 80, size: 18, type: 'topic', citations: 18 },
    { id: 'email-automation', label: 'Email Automation', x: 0, y: -140, size: 16, type: 'topic', citations: 12 },
    { id: 'crm-integration', label: 'CRM Integration', x: 0, y: 140, size: 14, type: 'topic', citations: 8 },
  ]

  // Mock data for Gaps & Opportunities
  const gapsData = [
    { id: 1, prompt: 'Best AI agents for GTM teams', status: 'missing', searchVolume: 'High', difficulty: 'Medium', suggestion: 'Create comprehensive guide' },
    { id: 2, prompt: 'Alternatives to Clay.com', status: 'weak', searchVolume: 'Medium', difficulty: 'Low', suggestion: 'Strengthen positioning' },
    { id: 3, prompt: 'Top cold email automation tools 2025', status: 'missing', searchVolume: 'High', difficulty: 'High', suggestion: 'Develop comparison content' },
    { id: 4, prompt: 'AI SDR vs human SDR comparison', status: 'weak', searchVolume: 'Medium', difficulty: 'Medium', suggestion: 'Expand content depth' },
    { id: 5, prompt: `${getUserDisplayName()} vs Apollo integration`, status: 'missing', searchVolume: 'Low', difficulty: 'Low', suggestion: 'Create integration docs' },
    { id: 6, prompt: 'Sales automation ROI calculator', status: 'missing', searchVolume: 'High', difficulty: 'Medium', suggestion: 'Build interactive tool' },
  ]

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

  // Determine available scan type based on plan
  useEffect(() => {
    if (subscription) {
      const plan = subscription.plan as PlanType
      if (plan === 'plus' || plan === 'pro') {
        setScanType('max')
      } else {
        setScanType('basic')
      }
    }
  }, [subscription])

  const handleRefreshScore = async () => {
    if (!subscription) return
    
    // For Pro plan, allow on-demand refreshes
    // For other plans, this is just a manual trigger of the regular scan process
    if (subscription.plan !== 'pro') {
      toast({
        title: "Scan scheduled",
        description: "Your visibility scan has been queued and will be processed shortly.",
      })
      return
    }
    
    setIsRefreshing(true)
    
    try {
      // For Pro users, trigger immediate scan
      // Simulate scan process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // After successful scan, simulate having data
      setHasVisibilityData(true)
      
      toast({
        title: "Visibility scan complete",
        description: `${scanType === 'max' ? 'MAX' : 'Basic'} scan completed successfully.`,
      })
    } catch (error) {
      toast({
        title: "Scan failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleMouseMove = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      setHoveredScore(data.activePayload[0].value)
    }
  }

  const handleMouseLeave = () => {
    setHoveredScore(null)
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
            {/* Scan Schedule Display - Moved here */}
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
                {scanType === 'max' && (
                  <span className="text-xs text-yellow-500 font-medium bg-yellow-500/10 px-2 py-0.5 rounded">MAX</span>
                )}
              </div>
            )}
            
            <button
              onClick={handleRefreshScore}
              disabled={isRefreshing || !subscription}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium tracking-tight transition-colors border flex items-center gap-2 ${
                isRefreshing || !subscription
                  ? 'text-[#444] border-[#333] cursor-not-allowed'
                  : 'text-[#666] hover:text-white hover:bg-[#1a1a1a] border-[#333]'
              }`}
            >
              <RefreshCw className={`h-3 w-3 md:h-4 md:w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isRefreshing ? 'Scanning...' : `Refresh Score${scanType === 'max' ? ' (MAX)' : ''}`}</span>
              <span className="sm:hidden">{isRefreshing ? '...' : 'Refresh'}</span>
            </button>
          </div>
        </motion.div>

        {/* Main Content Area */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8" style={{ minHeight: '75vh'}}>
            {/* Chart Section */}
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
                  hasVisibilityData ? 'text-white' : 'text-[#333]'
                }`}>
                  {hasVisibilityData ? displayScore.toFixed(1) : '—'}
                </div>
                {!hasVisibilityData && (
                  <p className="text-[#666] text-sm mt-2">Score will appear after first scan</p>
                )}
              </div>

              {/* Chart Container */}
              <div className="flex-1" style={{ minHeight: '60vh' }}>
                {hasVisibilityData ? (
                  <AnimatePresence mode="wait">
                    {isChartVisible && (
                      <motion.div 
                        className="h-full w-full relative"
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ 
                          duration: 0.3,
                          ease: [0.16, 1, 0.3, 1],
                          type: "spring",
                          stiffness: 300,
                          damping: 30
                        }}
                      >
                        <motion.div 
                          className="absolute inset-0"
                          initial={{ clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)" }}
                          animate={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
                          transition={{ 
                            duration: 1.5, 
                            ease: [0.16, 1, 0.3, 1],
                            delay: 0.4
                          }}
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={chartData}
                              margin={{ top: 20, right: 30, left: -40, bottom: 20 }}
                              onMouseMove={handleMouseMove}
                              onMouseLeave={handleMouseLeave}
                            >
                              <defs>
                                <linearGradient id="visibilityGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#fff" stopOpacity={0.15} />
                                  <stop offset="100%" stopColor="#fff" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid
                                vertical={false}
                                horizontal={true}
                                strokeDasharray="4 4"
                                stroke="#333333"
                                opacity={0.4}
                              />
                              <XAxis
                                dataKey="date"
                                axisLine={{ stroke: '#333333' }}
                                tick={{ 
                                  fill: '#666666', 
                                  fontSize: 11,
                                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace'
                                }}
                                tickLine={false}
                                interval={2}
                              />
                              <YAxis
                                domain={[0, 100]}
                                ticks={[0, 20, 40, 60, 80, 100]}
                                axisLine={{ stroke: '#333333' }}
                                tick={{ 
                                  fill: '#666666', 
                                  fontSize: 11,
                                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace'
                                }}
                                tickLine={false}
                                tickFormatter={(value) => `${value}`}
                              />
                              <Tooltip
                                content={<CustomTooltip />}
                                cursor={false}
                              />
                              <Area
                                type="linear"
                                dataKey="score"
                                stroke="#fff"
                                strokeWidth={2}
                                fill="url(#visibilityGradient)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                ) : (
                  /* Empty State for Chart */
                  <div className="relative h-full flex flex-col">
                    {/* Preview of chart with low opacity and blur */}
                    <div className="absolute inset-0 opacity-20 blur-sm pointer-events-none">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={chartData}
                          margin={{ top: 20, right: 30, left: -40, bottom: 20 }}
                        >
                          <defs>
                            <linearGradient id="visibilityGradientEmpty" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#fff" stopOpacity={0.15} />
                              <stop offset="100%" stopColor="#fff" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            vertical={false}
                            horizontal={true}
                            strokeDasharray="4 4"
                            stroke="#333333"
                            opacity={0.4}
                          />
                          <XAxis
                            dataKey="date"
                            axisLine={{ stroke: '#333333' }}
                            tick={{ 
                              fill: '#666666', 
                              fontSize: 11,
                              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace'
                            }}
                            tickLine={false}
                            interval={2}
                          />
                          <YAxis
                            domain={[0, 100]}
                            ticks={[0, 20, 40, 60, 80, 100]}
                            axisLine={{ stroke: '#333333' }}
                            tick={{ 
                              fill: '#666666', 
                              fontSize: 11,
                              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace'
                            }}
                            tickLine={false}
                            tickFormatter={(value) => `${value}`}
                          />
                          <Area
                            type="linear"
                            dataKey="score"
                            stroke="#fff"
                            strokeWidth={2}
                            fill="url(#visibilityGradientEmpty)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Empty state message - absolute positioned overlay */}
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="text-center max-w-sm">
                        <h4 className="text-white font-medium mb-2">Not enough data</h4>
                        <p className="text-[#666] text-sm mb-6 leading-relaxed">
                          Run a visibility scan to begin tracking your AI presence across platforms
                        </p>
                        <button 
                          onClick={handleRefreshScore}
                          disabled={isRefreshing || !subscription}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            isRefreshing || !subscription
                              ? 'bg-[#333] text-[#666] cursor-not-allowed'
                              : 'bg-white text-black hover:bg-gray-100'
                          }`}
                        >
                          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                          {isRefreshing ? 'Scanning...' : 'Run Visibility Scan'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Right Sidebar */}
            <div className="lg:col-span-5 flex flex-col px-8">
              {/* Competitive Benchmarking - Same height as chart */}
              <motion.div variants={itemVariants} className="flex flex-col" style={{ minHeight: '60vh' }}>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-1">Competitive Benchmarking</h3>
                  <p className="text-sm text-[#888]">Share of voice comparison</p>
                </div>
                
                {hasVisibilityData ? (
                  <div className="flex-1 overflow-y-auto pr-2">
                    <div className="space-y-2">
                      <AnimatePresence mode="wait">
                        {currentCompetitors.map((comp, idx) => {
                          // Helper to get favicon URL for competitors
                          const getFaviconForCompetitor = (url: string) => {
                            // Extract domain from URL
                            const cleanDomain = url
                              .replace(/^https?:\/\//, '')
                              .replace(/^www\./, '')
                              .split('/')[0]
                            
                            return `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`
                          }

                          return (
                            <motion.div
                              key={`${comp.name}-${comp.url}`}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ delay: idx * 0.05 }}
                              className={`flex items-center justify-between py-3 px-0 ${
                                comp.isUser ? 'bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3' : ''
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-[#666] font-mono text-sm w-5">
                                  {comp.isUser ? comp.actualRank : idx + 1}
                                </span>
                                <div className="flex items-center justify-center w-6 h-6 rounded bg-[#1a1a1a] border border-[#2a2a2a]">
                                  <div className="relative">
                                    <img 
                                      src={getFaviconForCompetitor(comp.url)}
                                      alt={comp.name}
                                      width={14}
                                      height={14}
                                      className="w-3.5 h-3.5 object-contain"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.style.display = 'none'
                                        // Show fallback dot instead
                                        const fallback = target.nextElementSibling as HTMLElement
                                        if (fallback) fallback.style.display = 'block'
                                      }}
                                    />
                                    <div className="w-2 h-2 rounded-full bg-[#666] hidden" />
                                  </div>
                                </div>
                                <div>
                                  <div className="text-white font-medium text-sm">{comp.name}</div>
                                  <div className="text-[#666] text-xs">{comp.url}</div>
                                </div>
                              </div>
                              <span className="text-white font-semibold">{comp.score.toFixed(1)}</span>
                            </motion.div>
                          )
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                ) : (
                  /* Empty State for Competitive Benchmarking */
                  <div className="relative flex-1 flex flex-col">
                    {/* Preview of competitors with low opacity and blur */}
                    <div className="absolute inset-0 opacity-20 blur-sm pointer-events-none overflow-y-auto pr-2">
                      <div className="space-y-2">
                        {currentCompetitors.map((comp, idx) => {
                          // Helper to get favicon URL for competitors
                          const getFaviconForCompetitor = (url: string) => {
                            // Extract domain from URL
                            const cleanDomain = url
                              .replace(/^https?:\/\//, '')
                              .replace(/^www\./, '')
                              .split('/')[0]
                            
                            return `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`
                          }

                          return (
                            <div
                              key={`empty-${comp.name}-${comp.url}`}
                              className={`flex items-center justify-between py-3 px-0 ${
                                comp.isUser ? 'bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3' : ''
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-[#666] font-mono text-sm w-5">
                                  {comp.isUser ? comp.actualRank : idx + 1}
                                </span>
                                <div className="flex items-center justify-center w-6 h-6 rounded bg-[#1a1a1a] border border-[#2a2a2a]">
                                  <div className="relative">
                                    <img 
                                      src={getFaviconForCompetitor(comp.url)}
                                      alt={comp.name}
                                      width={14}
                                      height={14}
                                      className="w-3.5 h-3.5 object-contain"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.style.display = 'none'
                                        // Show fallback dot instead
                                        const fallback = target.nextElementSibling as HTMLElement
                                        if (fallback) fallback.style.display = 'block'
                                      }}
                                    />
                                    <div className="w-2 h-2 rounded-full bg-[#666] hidden" />
                                  </div>
                                </div>
                                <div>
                                  <div className="text-white font-medium text-sm">{comp.name}</div>
                                  <div className="text-[#666] text-xs">{comp.url}</div>
                                </div>
                              </div>
                              <span className="text-white font-semibold">{comp.score.toFixed(1)}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Empty state message - absolute positioned overlay */}
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="text-center max-w-sm">
                        <h4 className="text-white font-medium mb-2">Not enough data</h4>
                        <p className="text-[#666] text-sm mb-6 leading-relaxed">
                          Run a visibility scan to see how you compare against competitors
                        </p>
                        <button 
                          onClick={handleRefreshScore}
                          disabled={isRefreshing || !subscription}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            isRefreshing || !subscription
                              ? 'bg-[#333] text-[#666] cursor-not-allowed'
                              : 'bg-white text-black hover:bg-gray-100'
                          }`}
                        >
                          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                          {isRefreshing ? 'Scanning...' : 'Run Visibility Scan'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}

        {/* Citations Tab */}
        {activeTab === 'citations' && (
          <div className="h-[95vh] bg-[#0c0c0c] overflow-hidden">
            <motion.main 
              className="h-full flex flex-col p-6"
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              {/* Minimal Header */}
              <motion.div variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-2">Citations</h2>
                <p className="text-[#666] text-sm">86 mentions across AI platforms</p>
              </motion.div>

              {/* Clean Data Table */}
              <div className="flex-1 min-h-0">
                <div className="h-full overflow-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-[#0c0c0c] border-b border-[#333]">
                      <tr>
                        <th className="text-left py-4 text-[#888] font-medium text-xs uppercase tracking-wide w-20">Engine</th>
                        <th className="text-left py-4 text-[#888] font-medium text-xs uppercase tracking-wide">Prompt</th>
                        <th className="text-left py-4 text-[#888] font-medium text-xs uppercase tracking-wide w-24">Match</th>
                        <th className="text-left py-4 text-[#888] font-medium text-xs uppercase tracking-wide">Context</th>
                        <th className="text-left py-4 text-[#888] font-medium text-xs uppercase tracking-wide w-28">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {citationsData.map((citation, idx) => (
                        <motion.tr
                          key={citation.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.02 }}
                          className="border-b border-[#1a1a1a] hover:bg-[#0a0a0a] transition-colors cursor-pointer group"
                          onClick={() => {
                            setSelectedCitation(citation)
                            setIsDrawerOpen(true)
                          }}
                        >
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-md bg-[#1a1a1a] border border-[#333] flex items-center justify-center">
                                <div className="w-3 h-3 rounded-sm bg-[#666]" />
                              </div>
                              <span className="text-white font-medium text-sm">{citation.engine}</span>
                            </div>
                          </td>
                          <td className="py-4 pr-4">
                            <div className="text-white text-sm leading-relaxed max-w-md">
                              {citation.query.length > 60 ? `${citation.query.substring(0, 60)}...` : citation.query}
                            </div>
                          </td>
                          <td className="py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                              citation.matchType === 'Direct' 
                                ? 'bg-white/5 text-white border-white/10' 
                                : 'bg-[#333]/30 text-[#888] border-[#333]'
                            }`}>
                              {citation.matchType}
                            </span>
                          </td>
                          <td className="py-4 pr-4">
                            <div className="text-[#aaa] text-sm leading-relaxed">
                              <div className="line-clamp-3 max-w-lg">
                                {citation.snippet}
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="text-[#666] font-mono text-xs">{citation.date}</div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.main>
          </div>
        )}

        {/* Full-Screen Citation Drawer */}
        <AnimatePresence>
          {isDrawerOpen && selectedCitation && (
            <>
              {/* Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black/20 z-40"
                onClick={() => setIsDrawerOpen(false)}
              />
              
              {/* Drawer */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="fixed top-0 right-0 w-[480px] h-screen bg-[#0a0a0a] border-l border-[#333] flex flex-col z-50"
              >
                {/* Drawer Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#333]">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-md bg-[#1a1a1a] border border-[#333] flex items-center justify-center">
                      <div className="w-3 h-3 rounded-sm bg-[#666]" />
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{selectedCitation.engine}</div>
                      <div className="text-[#666] text-xs font-mono">{selectedCitation.engine.toLowerCase()}.ai › ai-tools</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 hover:bg-[#1a1a1a] rounded-md transition-colors"
                  >
                    <X className="w-4 h-4 text-[#666]" />
                  </button>
                </div>

                {/* Drawer Content */}
                <div className="flex-1 overflow-auto p-6 space-y-6">
                  {/* Prompt Section */}
                  <div>
                    <div className="text-[#888] text-xs font-medium uppercase tracking-wide mb-3">Prompt</div>
                    <div className="text-white text-sm leading-relaxed bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
                      {selectedCitation.query}
                    </div>
                  </div>

                  {/* Match Details */}
                  <div>
                    <div className="text-[#888] text-xs font-medium uppercase tracking-wide mb-3">Match Details</div>
                    <div className="flex items-center gap-4 mb-3">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${
                        selectedCitation.matchType === 'Direct' 
                          ? 'bg-white/5 text-white border-white/10' 
                          : 'bg-[#333]/30 text-[#888] border-[#333]'
                      }`}>
                        {selectedCitation.matchType}
                      </span>
                      <div className="text-[#666] text-xs">Confidence: 94%</div>
                    </div>
                  </div>

                  {/* Full Response */}
                  <div>
                    <div className="text-[#888] text-xs font-medium uppercase tracking-wide mb-3">Full Response</div>
                    <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
                      <div className="text-[#ccc] text-sm leading-relaxed font-mono">
                        {selectedCitation.snippet}
                        <span className="bg-white/10 px-1 rounded">Origami Agents</span>
                        {" continues to be a leading solution in the space..."}
                      </div>
                    </div>
                  </div>

                  {/* Context */}
                  <div>
                    <div className="text-[#888] text-xs font-medium uppercase tracking-wide mb-3">Mention Context</div>
                    <div className="text-[#aaa] text-sm leading-relaxed">
                      {selectedCitation.snippet.substring(0, 100)}
                      <span className="bg-white/10 px-1 rounded mx-1">Origami Agents</span>
                      {selectedCitation.snippet.substring(100)}
                    </div>
                  </div>
                </div>

                {/* Drawer Actions */}
                <div className="border-t border-[#333] p-6">
                  <div className="space-y-3">
                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] rounded-lg text-white text-sm font-medium transition-colors">
                      <Copy className="w-4 h-4" />
                      Copy Citation
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] rounded-lg text-white text-sm font-medium transition-colors">
                      <Download className="w-4 h-4" />
                      Export as .md
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-[#f5f5f5] rounded-lg text-black text-sm font-medium transition-colors">
                      <Bookmark className="w-4 h-4" />
                      Save to Analysis
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Topic Map Tab */}
        {activeTab === 'map' && (
          <div className="h-[95vh] bg-[#0c0c0c] overflow-hidden">
            <motion.main 
              className="h-full flex flex-col p-6"
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              {/* Minimal Header */}
              <motion.div variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-2">Topic Map</h2>
                <p className="text-[#666] text-sm">Semantic authority across 6 topic clusters</p>
              </motion.div>

              {/* Main Layout: 7-5 Grid */}
              <div className="flex-1 grid grid-cols-12 gap-8 min-h-0">
                {/* 3D Citation Graph */}
                <motion.div variants={itemVariants} className="col-span-7 flex flex-col min-h-0">
                  <div className="flex-1 relative border border-[#333] rounded-lg bg-[#0a0a0a] overflow-hidden">
                    <svg className="w-full h-full" viewBox="-200 -200 400 400">
                      {/* Grid Plane */}
                      <defs>
                        <pattern id="grid3d" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1a1a1a" strokeWidth="0.5" opacity="0.3"/>
                        </pattern>
                      </defs>
                      <rect x="-200" y="-200" width="400" height="400" fill="url(#grid3d)" opacity="0.5" />
                      
                      {/* Connection Lines */}
                      {topicNodes.filter(node => node.type === 'topic').map((node) => {
                        const connectionNodePos = topicNodePositions[node.id] || { x: node.x, y: node.y }
                        const centerPos = topicNodePositions['center'] || { x: 0, y: 0 }
                        return (
                          <motion.line
                            key={`connection-${node.id}`}
                            x1={centerPos.x}
                            y1={centerPos.y}
                            x2={connectionNodePos.x * 0.8}
                            y2={connectionNodePos.y * 0.8}
                            stroke="#333"
                            strokeWidth="1"
                            opacity="0.4"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1, delay: 0.5 }}
                          />
                        )
                      })}
                      
                      {/* Draggable Topic Nodes */}
                      {topicNodes.map((node, idx) => {
                        const draggableNodePos = topicNodePositions[node.id] || { x: node.x, y: node.y }
                        return (
                          <motion.g
                            key={node.id}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.15, type: "spring", stiffness: 300 }}
                            className="cursor-grab active:cursor-grabbing"
                            onMouseDown={(e) => {
                              if (node.type === 'center') return // Don't allow dragging center node
                              
                              e.preventDefault()
                              const svgRect = e.currentTarget.closest('svg')?.getBoundingClientRect()
                              if (!svgRect) return
                              
                              const startMouseX = e.clientX
                              const startMouseY = e.clientY
                              const startNodeX = draggableNodePos.x * 0.8
                              const startNodeY = draggableNodePos.y * 0.8
                              
                              const handleMouseMove = (e: MouseEvent) => {
                                const deltaX = e.clientX - startMouseX
                                const deltaY = e.clientY - startMouseY
                                
                                // Convert mouse movement to SVG coordinates
                                const scale = 400 / svgRect.width // SVG viewBox is 400 units wide
                                const newX = (startNodeX + deltaX * scale) / 0.8
                                const newY = (startNodeY + deltaY * scale) / 0.8
                                
                                // Constrain to boundaries
                                const constrainedX = Math.max(-180, Math.min(180, newX))
                                const constrainedY = Math.max(-180, Math.min(180, newY))
                                
                                setTopicNodePositions(prev => ({
                                  ...prev,
                                  [node.id]: { x: constrainedX, y: constrainedY }
                                }))
                              }
                              
                              const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove)
                                document.removeEventListener('mouseup', handleMouseUp)
                              }
                              
                              document.addEventListener('mousemove', handleMouseMove)
                              document.addEventListener('mouseup', handleMouseUp)
                            }}
                          >
                            {/* Shadow/Depth Circle */}
                            <circle
                              cx={draggableNodePos.x * 0.8 + 2}
                              cy={draggableNodePos.y * 0.8 + 2}
                              r={node.type === 'center' ? 28 : node.size * 0.7}
                              fill="#000"
                              opacity="0.2"
                            />
                            
                            {/* Main Node */}
                            <circle
                              cx={draggableNodePos.x * 0.8}
                              cy={draggableNodePos.y * 0.8}
                              r={node.type === 'center' ? 28 : node.size * 0.7}
                              fill={node.type === 'center' ? '#fff' : '#1a1a1a'}
                              stroke={node.type === 'center' ? '#fff' : '#444'}
                              strokeWidth={node.type === 'center' ? 2 : 1}
                              className={`${node.type === 'center' ? '' : 'hover:opacity-80'} transition-all duration-200`}
                            />
                            
                            {/* Node Labels */}
                            <text
                              x={draggableNodePos.x * 0.8}
                              y={draggableNodePos.y * 0.8 + (node.type === 'center' ? 42 : node.size * 0.7 + 20)}
                              textAnchor="middle"
                              className="fill-white text-xs font-medium pointer-events-none"
                            >
                              {node.label}
                            </text>
                            <text
                              x={draggableNodePos.x * 0.8}
                              y={draggableNodePos.y * 0.8 + (node.type === 'center' ? 56 : node.size * 0.7 + 32)}
                              textAnchor="middle"
                              className="fill-[#666] text-xs pointer-events-none font-mono"
                            >
                              {node.citations} mentions
                            </text>
                          </motion.g>
                        )
                      })}
                    </svg>
                    
                    {/* Interaction Hint */}
                    <div className="absolute bottom-4 left-4 text-[#666] text-xs">
                      Drag clusters to reposition • Interactive nodes
                    </div>
                  </div>
                </motion.div>

                {/* Right Sidebar Cards */}
                <div className="col-span-5 space-y-8">
                  {/* Top Topics Card */}
                  <motion.div variants={itemVariants}>
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-white mb-1">Topic Visibility</h3>
                      <p className="text-sm text-[#888]">Last 30 days</p>
                    </div>
                    
                    <div className="space-y-3">
                      {[
                        { topic: 'AI Sales Tools', mentions: 34, percentage: 34.2, visits: '1,247 mentions' },
                        { topic: 'Cold Outreach', mentions: 28, percentage: 28.7, visits: '1,045 mentions' },
                        { topic: 'SDR Automation', mentions: 24, percentage: 19.1, visits: '697 mentions' },
                        { topic: 'Lead Generation', mentions: 18, percentage: 12.4, visits: '452 mentions' },
                        { topic: 'Email Automation', mentions: 12, percentage: 5.6, visits: '204 mentions' }
                      ].map((item, idx) => (
                        <motion.div 
                          key={item.topic}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 + idx * 0.05 }}
                          className="flex items-center gap-3"
                        >
                          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                            <div className="w-2 h-2 rounded-full bg-[#888]" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-white font-medium text-sm">{item.topic}</span>
                              <span className="text-white font-semibold text-sm">{item.percentage}%</span>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[#666] text-xs">{item.visits}</span>
                            </div>
                            <div className="w-full bg-[#2a2a2a] rounded-full h-1 overflow-hidden">
                              <motion.div 
                                className="h-full bg-[#888] rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${item.percentage}%` }}
                                transition={{ delay: 0.5 + idx * 0.1, duration: 1.2, ease: "easeOut" }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Top Sources Card */}
                  <motion.div variants={itemVariants}>
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-white mb-1">Leading Sources</h3>
                      <p className="text-sm text-[#888]">Last 30 days</p>
                    </div>
                    
                    <div className="space-y-3">
                      {[
                        { source: 'Forbes', mentions: 18, percentage: 32.6, visits: '1,247 mentions' },
                        { source: 'TechCrunch', mentions: 15, percentage: 28.7, visits: '1,045 mentions' },
                        { source: 'Wired', mentions: 12, percentage: 19.1, visits: '697 mentions' },
                        { source: 'VentureBeat', mentions: 9, percentage: 12.4, visits: '452 mentions' },
                        { source: 'The Verge', mentions: 8, percentage: 7.2, visits: '264 mentions' }
                      ].map((item, idx) => (
                        <motion.div 
                          key={item.source}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 + idx * 0.05 }}
                          className="flex items-center gap-3"
                        >
                          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                            <div className="w-2 h-2 rounded-full bg-[#888]" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-white font-medium text-sm">{item.source}</span>
                              <span className="text-white font-semibold text-sm">{item.percentage}%</span>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[#666] text-xs">{item.visits}</span>
                            </div>
                            <div className="w-full bg-[#2a2a2a] rounded-full h-1 overflow-hidden">
                              <motion.div 
                                className="h-full bg-[#888] rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${item.percentage}%` }}
                                transition={{ delay: 0.7 + idx * 0.1, duration: 1.2, ease: "easeOut" }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.main>
          </div>
        )}

        {/* Gaps & Opportunities Tab */}
        {activeTab === 'gaps' && (
          <div className="h-[95vh] bg-[#0c0c0c] overflow-hidden">
            <motion.main 
              className="h-full flex flex-col p-6"
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              {/* Minimal Header */}
              <motion.div variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-2">Gaps & Opportunities</h2>
                <p className="text-[#666] text-sm">High-value queries to prioritize for content creation</p>
              </motion.div>

              {/* Strategic Insights Grid */}
              <div className="flex-1 min-h-0">
                <div className="h-full overflow-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-[#0c0c0c] border-b border-[#333]">
                      <tr>
                        <th className="text-left py-4 text-[#888] font-medium text-xs uppercase tracking-wide w-20">Status</th>
                        <th className="text-left py-4 text-[#888] font-medium text-xs uppercase tracking-wide">Query Opportunity</th>
                        <th className="text-left py-4 text-[#888] font-medium text-xs uppercase tracking-wide w-24">Volume</th>
                        <th className="text-left py-4 text-[#888] font-medium text-xs uppercase tracking-wide w-24">Difficulty</th>
                        <th className="text-left py-4 text-[#888] font-medium text-xs uppercase tracking-wide">Strategic Action</th>
                        <th className="w-28"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {gapsData.map((gap, idx) => (
                        <motion.tr
                          key={gap.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.03 }}
                          className="border-b border-[#1a1a1a] hover:bg-[#0a0a0a] transition-colors group"
                        >
                          <td className="py-6">
                            <div className="flex items-center gap-3">
                              {gap.status === 'missing' ? (
                                <>
                                  <div className="w-2 h-2 rounded-full bg-white" />
                                  <span className="text-white font-medium text-sm">Missing</span>
                                </>
                              ) : (
                                <>
                                  <div className="w-2 h-2 rounded-full bg-[#666]" />
                                  <span className="text-[#888] font-medium text-sm">Weak</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="py-6 pr-6">
                            <div className="text-white text-sm leading-relaxed max-w-md">
                              {gap.prompt}
                            </div>
                          </td>
                          <td className="py-6">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              gap.searchVolume === 'High' 
                                ? 'bg-white/10 text-white' 
                                : gap.searchVolume === 'Medium'
                                ? 'bg-[#333]/50 text-[#ccc]'
                                : 'bg-[#333]/30 text-[#888]'
                            }`}>
                              {gap.searchVolume}
                            </span>
                          </td>
                          <td className="py-6">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              gap.difficulty === 'Low' 
                                ? 'bg-[#333]/30 text-[#888]'
                                : gap.difficulty === 'Medium'
                                ? 'bg-[#333]/50 text-[#ccc]'
                                : 'bg-white/10 text-white'
                            }`}>
                              {gap.difficulty}
                            </span>
                          </td>
                          <td className="py-6 pr-6">
                            <div className="text-[#aaa] text-sm leading-relaxed max-w-sm">
                              {gap.suggestion}
                            </div>
                          </td>
                          <td className="py-6">
                            <button
                              className={`px-4 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
                                gap.status === 'missing'
                                  ? 'bg-white text-black hover:bg-[#f5f5f5]'
                                  : 'bg-[#1a1a1a] text-white border border-[#333] hover:bg-[#222]'
                              }`}
                            >
                              {gap.status === 'missing' ? 'Generate' : 'Improve'}
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Strategic Summary */}
              <motion.div 
                variants={itemVariants}
                className="mt-8 pt-6 border-t border-[#333]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-white" />
                      <span className="text-[#888] text-sm">4 missing opportunities</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#666]" />
                      <span className="text-[#888] text-sm">2 weak positions</span>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-white text-black rounded-md text-sm font-medium hover:bg-[#f5f5f5] transition-colors">
                    Generate All Priority Content
                  </button>
                </div>
              </motion.div>
            </motion.main>
          </div>
        )}
      </motion.main>
    </div>
  )
} 
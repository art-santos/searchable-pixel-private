import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CrawlerSelector } from "@/components/custom/crawler-selector"
import {
  TimeframeSelector,
  TimeframeOption,
} from "@/components/custom/timeframe-selector"
import { ViewsChart } from "./views-chart"
import { useState, useEffect } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { LinkIcon, TrendingUp, Loader2 } from "lucide-react"
import { ConnectAnalyticsDialog } from "../connect-analytics-dialog"
import { useAuth } from "@/contexts/AuthContext"

export type TimeframeType = TimeframeOption

interface CrawlerOption {
  id: string
  name: string
  company: string
  count: number
  icon?: string
}

interface ChartDataPoint {
  date: string
  crawls: number
}

export function PageViewCard() {
  const { supabase } = useAuth()
  const [timeframe, setTimeframe] = useState<TimeframeType>('Last 24 hours')
  const [selectedCrawler, setSelectedCrawler] = useState<string>('all')
  const [isChartVisible, setIsChartVisible] = useState(false)
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [availableCrawlers, setAvailableCrawlers] = useState<CrawlerOption[]>([])
  const [totalCrawls, setTotalCrawls] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  // Fetch data when component mounts or when timeframe/crawler changes
  useEffect(() => {
    fetchCrawlerVisits()
  }, [timeframe, selectedCrawler])

  const fetchCrawlerVisits = async () => {
    setIsLoading(true)
    setError(null)
    setIsChartVisible(false)
    
    try {
      // Get the current session token from Supabase
      const sessionResult = await supabase?.auth.getSession()
      const session = sessionResult?.data?.session
      
      // Auto-detect user's timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      
      const response = await fetch(`/api/dashboard/crawler-visits?timeframe=${encodeURIComponent(timeframe)}&crawler=${selectedCrawler}&timezone=${encodeURIComponent(timezone)}`, {
        headers: {
          'Authorization': session?.access_token ? `Bearer ${session.access_token}` : ''
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch crawler visits')
      }
      
      const data = await response.json()
      
      // Check if user has any data
      if (data.totalCrawls > 0 || data.availableCrawlers.length > 0) {
        setIsConnected(true)
        setChartData(data.chartData || [])
        setAvailableCrawlers(data.availableCrawlers || [])
        setTotalCrawls(data.totalCrawls || 0)
        
        // Show chart after data loads
        setTimeout(() => setIsChartVisible(true), 100)
      } else {
        setIsConnected(false)
        // Use sample data for empty state
        setChartData([
          { date: 'APR 1', crawls: 87 },
          { date: 'APR 4', crawls: 125 },
          { date: 'APR 7', crawls: 164 },
          { date: 'APR 10', crawls: 98 },
          { date: 'APR 13', crawls: 212 },
          { date: 'APR 16', crawls: 178 },
          { date: 'APR 19', crawls: 289 },
          { date: 'APR 22', crawls: 195 },
          { date: 'APR 25', crawls: 267 },
          { date: 'APR 28', crawls: 234 },
        ])
      }
    } catch (err) {
      console.error('Error fetching crawler visits:', err)
      setError('Failed to load crawler data')
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTimeframeChange = (newTimeframe: TimeframeType) => {
    setTimeframe(newTimeframe)
  }

  const handleCrawlerChange = (crawler: string) => {
    setSelectedCrawler(crawler)
  }

  const cardVariants = shouldReduceMotion ? {
    hidden: { opacity: 1 },
    visible: { opacity: 1 }
  } : {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="h-full flex flex-col"
      >
        <CardHeader className="pb-4 pt-4 pl-6 flex-shrink-0 border-b border-[#1a1a1a]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Crawler Visits</h3>
              {isConnected && totalCrawls > 0 && (
                <p className="text-sm text-[#666]">{totalCrawls.toLocaleString()} total visits</p>
              )}
            </div>
            <TimeframeSelector 
              title=""
              timeframe={timeframe} 
              onTimeframeChange={handleTimeframeChange}
              titleColor="text-white"
              selectorColor="text-[#A7A7A7]"
            />
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 min-h-0 pt-4 pr-6 pb-8 pl-6 flex flex-col relative">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-[#666]" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-[#666] text-sm">{error}</p>
                <button 
                  onClick={fetchCrawlerVisits}
                  className="mt-2 text-sm text-white hover:underline"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : isConnected ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="text-sm text-[#888] font-medium">Crawler Filter</div>
                <CrawlerSelector 
                  selectedCrawler={selectedCrawler}
                  onCrawlerChange={handleCrawlerChange}
                  availableCrawlers={availableCrawlers}
                />
              </div>
              
              <div className="flex-1 relative" style={{ minHeight: '405px' }}>
                <div className="absolute inset-0">
                  <ViewsChart 
                    timeframe={timeframe}
                    isVisible={isChartVisible}
                    setIsVisible={setIsChartVisible}
                    data={chartData}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="relative h-full flex flex-col">
              {/* Preview of actual content with low opacity and blur - takes full height */}
              <div className="absolute inset-0 opacity-30 blur-sm pointer-events-none">
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <div className="text-sm text-[#888] font-medium">Crawler Filter</div>
                    <CrawlerSelector 
                      selectedCrawler="all"
                      onCrawlerChange={() => {}}
                      availableCrawlers={[]}
                    />
                  </div>
                  
                  <div className="flex-1 relative min-h-0">
                    <div className="absolute inset-0">
                      <ViewsChart 
                        timeframe={timeframe}
                        isVisible={true}
                        setIsVisible={() => {}}
                        data={chartData}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Empty state message - absolute positioned overlay */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-center max-w-sm">
                  <h4 className="text-white font-medium mb-2">No data yet</h4>
                  <p className="text-[#666] text-sm mb-6 leading-relaxed">
                    Connect your analytics to track every time an AI engine crawls your pages
                  </p>
                  <button 
                    onClick={() => setShowConnectDialog(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Connect Analytics
                  </button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </motion.div>

      <ConnectAnalyticsDialog 
        open={showConnectDialog}
        onOpenChange={setShowConnectDialog}
      />
    </Card>
  )
} 
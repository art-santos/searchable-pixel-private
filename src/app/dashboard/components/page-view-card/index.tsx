import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { LLMSelector } from "@/components/custom/llm-selector"
import {
  TimeframeSelector,
  TimeframeOption,
} from "@/components/custom/timeframe-selector"
import { ViewsChart } from "./views-chart"
import { useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { LinkIcon, TrendingUp } from "lucide-react"
import { ConnectAnalyticsDialog } from "../connect-analytics-dialog"

export type TimeframeType = TimeframeOption

export function PageViewCard() {
  const [timeframe, setTimeframe] = useState<TimeframeType>('Today')
  const [isChartVisible, setIsChartVisible] = useState(false)
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const shouldReduceMotion = useReducedMotion()
  // TODO: Replace with actual analytics connection state from context/API
  const [isConnected] = useState(false) // Changed to false for empty state by default

  const handleTimeframeChange = (newTimeframe: TimeframeType) => {
    setIsChartVisible(false)
    setTimeout(() => {
      setTimeframe(newTimeframe)
      setIsChartVisible(true)
    }, 150)
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
          {isConnected ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="text-sm text-[#888] font-medium">AI Engine Filter</div>
                <LLMSelector />
              </div>
              
              <div className="flex-1 relative" style={{ minHeight: '300px' }}>
                <div className="absolute inset-0">
                  <ViewsChart 
                    timeframe={timeframe}
                    isVisible={isChartVisible}
                    setIsVisible={setIsChartVisible}
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
                    <div className="text-sm text-[#888] font-medium">AI Engine Filter</div>
                    <LLMSelector />
                  </div>
                  
                  <div className="flex-1 relative" style={{ minHeight: '300px' }}>
                    <div className="absolute inset-0">
                      <ViewsChart 
                        timeframe={timeframe}
                        isVisible={true}
                        setIsVisible={() => {}}
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
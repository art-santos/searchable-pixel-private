import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { LLMSelector } from "@/components/custom/llm-selector"
import {
  TimeframeSelector,
  TimeframeOption,
} from "@/components/custom/timeframe-selector"
import { ViewsChart } from "./views-chart"
import { useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { LinkIcon } from "lucide-react"

export type TimeframeType = TimeframeOption

export function PageViewCard() {
  const [timeframe, setTimeframe] = useState<TimeframeType>('Today')
  const [isChartVisible, setIsChartVisible] = useState(false)
  const shouldReduceMotion = useReducedMotion()
  // Simulate analytics connection state - would come from actual data/context
  const [isConnected] = useState(true)

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
    <Card className="h-full flex flex-col relative overflow-hidden">
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
        
        <CardContent className="flex-1 min-h-0 pt-4 pr-6 pb-6 pl-6 flex flex-col">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div className="text-sm text-[#888] font-medium">AI Engine Filter</div>
            <LLMSelector />
          </div>
          
          <div className="flex-1 min-h-0 flex items-end">
            <div className="w-full h-full">
              <ViewsChart 
                timeframe={timeframe}
                isVisible={isChartVisible}
                setIsVisible={setIsChartVisible}
              />
            </div>
          </div>
        </CardContent>
      </motion.div>

      {/* Empty State Overlay */}
      {!isConnected && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          {/* Blur/Darken Overlay - more subtle */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
          
          {/* Connect Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="relative"
          >
            <button className="bg-[#0c0c0c] border border-[#333] hover:border-[#444] rounded-lg px-4 py-3 flex items-center gap-3 transition-all duration-200 hover:bg-[#1a1a1a] group shadow-lg">
              <LinkIcon className="w-4 h-4 text-[#888] group-hover:text-white transition-colors" />
              <span className="text-sm font-medium text-white">Connect your analytics</span>
            </button>
          </motion.div>
        </div>
      )}
    </Card>
  )
} 
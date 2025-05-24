import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { LLMSelector } from "@/components/custom/llm-selector"
import {
  TimeframeSelector,
  TimeframeOption,
} from "@/components/custom/timeframe-selector"
import { ViewsChart } from "./views-chart"
import { useState } from "react"
import { motion, useReducedMotion } from "framer-motion"

export type TimeframeType = TimeframeOption

export function PageViewCard() {
  const [timeframe, setTimeframe] = useState<TimeframeType>('Today')
  const [isChartVisible, setIsChartVisible] = useState(false)
  const shouldReduceMotion = useReducedMotion()

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
              <h3 className="text-lg font-semibold text-white mb-1">Page Views</h3>
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
            <div className="text-sm text-[#888] font-medium">Source Filter</div>
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
    </Card>
  )
} 
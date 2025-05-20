import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { LLMSelector } from "@/components/custom/llm-selector"
import {
  TimeframeSelector,
  TimeframeOption,
} from "@/components/custom/timeframe-selector"
import { ViewsChart } from "./views-chart"
import { useState } from "react"

export type TimeframeType = TimeframeOption

export function PageViewCard() {
  const [timeframe, setTimeframe] = useState<TimeframeType>('Today')
  const [isChartVisible, setIsChartVisible] = useState(false)

  const handleTimeframeChange = (newTimeframe: TimeframeType) => {
    setIsChartVisible(false)
    setTimeout(() => {
      setTimeframe(newTimeframe)
      setIsChartVisible(true)
    }, 150)
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4 flex-none">
        <div className="flex flex-col gap-2">
          <TimeframeSelector 
            title="Page Views"
            timeframe={timeframe} 
            onTimeframeChange={handleTimeframeChange}
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-[400px] pl-1">
        <ViewsChart 
          timeframe={timeframe}
          isVisible={isChartVisible}
          setIsVisible={setIsChartVisible}
        />
      </CardContent>
    </Card>
  )
} 
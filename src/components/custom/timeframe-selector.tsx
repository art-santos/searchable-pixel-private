import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type TimeframeOption =
  | "Last 24 hours"
  | "Last 7 days"
  | "Last 30 days"
  | "Last 90 days"
  | "Last 365 days"

const ALL_TIMEFRAMES: TimeframeOption[] = [
  "Last 24 hours",
  "Last 7 days", 
  "Last 30 days",
  "Last 90 days",
  "Last 365 days"
]

interface TimeframeSelectorProps {
  timeframe: TimeframeOption
  onTimeframeChange: (timeframe: TimeframeOption) => void
  title?: string
  titleColor?: string
  selectorColor?: string
}

export function TimeframeSelector({ 
  timeframe, 
  onTimeframeChange, 
  title = "Page Views",
  titleColor = "text-gray-600 dark:text-[#A7A7A7]",
  selectorColor = "text-black dark:text-white",
}: TimeframeSelectorProps) {
  return (
    <div className="space-y-1">
      <h3 className={`text-base font-medium ${titleColor}`}>{title}</h3>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-fit bg-transparent hover:bg-transparent p-0 rounded-none"
          >
            <div className="flex items-center gap-2">
              <span className={`font-geist-semi ${selectorColor}`}>{timeframe}</span>
              <ChevronDown className="h-4 w-4 text-gray-400 dark:text-[#666666]" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333333] text-black dark:text-white rounded-none mt-1"
          align="end"
          alignOffset={0}
        >
          {ALL_TIMEFRAMES.map((option) => (
            <DropdownMenuItem 
              key={option}
              className="hover:bg-gray-100 dark:hover:bg-[#222222] rounded-none"
              onClick={() => onTimeframeChange(option)}
            >
              <span className="text-sm">{option}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
} 
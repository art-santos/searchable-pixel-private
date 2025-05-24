import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
export type TimeframeOption =
  | "Today"
  | "This Week"
  | "This Month"
  | "Custom Range"

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
  titleColor = "text-[#A7A7A7]",
  selectorColor = "text-white"
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
              <ChevronDown className="h-4 w-4 text-[#666666]" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="bg-[#1a1a1a] border border-[#333333] text-white rounded-none mt-1"
          align="start"
          alignOffset={0}
        >
          <DropdownMenuItem 
            className="hover:bg-[#222222] rounded-none"
            onClick={() => onTimeframeChange('Today')}
          >
            <span className="text-sm">Today</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="hover:bg-[#222222] rounded-none"
            onClick={() => onTimeframeChange('This Week')}
          >
            <span className="text-sm">This Week</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="hover:bg-[#222222] rounded-none"
            onClick={() => onTimeframeChange('This Month')}
          >
            <span className="text-sm">This Month</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="hover:bg-[#222222] rounded-none"
            onClick={() => onTimeframeChange('Custom Range')}
          >
            <span className="text-sm">Custom Range</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
} 
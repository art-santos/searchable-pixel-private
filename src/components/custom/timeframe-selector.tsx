import { Button } from "@/components/ui/button"
import { ChevronDown, Lock } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getAllowedTimeframes, hasTimeframeAccess, PlanType } from "@/lib/subscription/config"
import { useAuth } from "@/contexts/AuthContext"
import { useState, useEffect } from "react"

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
  userPlan?: PlanType
}

export function TimeframeSelector({ 
  timeframe, 
  onTimeframeChange, 
  title = "Page Views",
  titleColor = "text-[#A7A7A7]",
  selectorColor = "text-white",
  userPlan
}: TimeframeSelectorProps) {
  const { user } = useAuth()
  const [currentPlan, setCurrentPlan] = useState<PlanType>('starter')

  useEffect(() => {
    const fetchUserPlan = async () => {
      if (userPlan) {
        setCurrentPlan(userPlan)
        return
      }

      if (user) {
        try {
          const response = await fetch('/api/user/subscription')
          if (response.ok) {
            const data = await response.json()
            console.log('[TimeframeSelector] User subscription data:', data)
            setCurrentPlan(data.subscriptionPlan || 'starter')
          } else {
            console.error('[TimeframeSelector] Failed to fetch subscription:', response.status)
            setCurrentPlan('starter')
          }
        } catch (error) {
          console.error('[TimeframeSelector] Error fetching user plan:', error)
          setCurrentPlan('starter')
        }
      }
    }

    fetchUserPlan()
  }, [user, userPlan])

  const allowedTimeframes = getAllowedTimeframes(currentPlan)
  
  // Debug logging
  console.log('[TimeframeSelector] Current plan:', currentPlan)
  console.log('[TimeframeSelector] Allowed timeframes:', allowedTimeframes)
  console.log('[TimeframeSelector] Current timeframe:', timeframe)

  // If current timeframe is not allowed, switch to first allowed one
  useEffect(() => {
    if (!hasTimeframeAccess(currentPlan, timeframe)) {
      console.log('[TimeframeSelector] Switching timeframe from', timeframe, 'to', allowedTimeframes[0])
      onTimeframeChange(allowedTimeframes[0] as TimeframeOption)
    }
  }, [currentPlan, timeframe, allowedTimeframes, onTimeframeChange])

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
          align="start"
          alignOffset={0}
        >
          {ALL_TIMEFRAMES.map((option) => {
            const isAllowed = allowedTimeframes.includes(option)
            const isSelected = timeframe === option
            
            return (
          <DropdownMenuItem 
                key={option}
                className={`hover:bg-gray-100 dark:hover:bg-[#222222] rounded-none flex items-center justify-between ${
                  !isAllowed ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={() => isAllowed && onTimeframeChange(option)}
                disabled={!isAllowed}
          >
                <span className="text-sm">{option}</span>
                {!isAllowed && <Lock className="h-3 w-3 text-gray-400 dark:text-[#666]" />}
          </DropdownMenuItem>
            )
          })}
          
          {currentPlan === 'starter' && (
            <>
              <div className="border-t border-gray-200 dark:border-[#333] my-1" />
              <div className="px-3 py-2">
                <p className="text-xs text-gray-500 dark:text-[#666] mb-1">Need longer timeframes?</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer">
                  Upgrade to Pro or Team →
                </p>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
} 
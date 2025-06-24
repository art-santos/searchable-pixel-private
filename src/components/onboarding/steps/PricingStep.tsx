import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CheckCircle2, Check, HelpCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { PRICING_PLANS, CREDIT_PRICING_TIERS } from '../utils/onboarding-constants'
import { useState, useEffect } from 'react'
import { getCalApi } from "@calcom/embed-react"

interface PricingStepProps {
  isAnnual: boolean
  setIsAnnual: (annual: boolean) => void
  onSelectPlan: (planId: string, credits?: number) => void
}

export function PricingStep({ isAnnual, setIsAnnual, onSelectPlan }: PricingStepProps) {
  const [selectedCredits, setSelectedCredits] = useState(250)

  // Initialize Cal.com
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({"namespace":"split"});
      cal("ui", {"hideEventTypeDetails":false,"layout":"month_view"});
    })();
  }, [])

  // Get current credit pricing for Pro plan
  const getCurrentCreditTier = (credits: number) => {
    return CREDIT_PRICING_TIERS.find(tier => tier.credits === credits) || CREDIT_PRICING_TIERS[0]
  }

  const handlePlanSelect = async (planId: string) => {
    if (planId === 'enterprise') {
      // Open Cal.com booking
      const cal = await getCalApi({"namespace":"split"});
      cal("openModal", {
        calLink: "sam-hogan/split",
        config: {"layout":"month_view"}
      });
      return
    }
    
    if (planId === 'pro') {
      onSelectPlan(planId, selectedCredits)
    } else {
      onSelectPlan(planId)
    }
  }

  return (
    <TooltipProvider>
      <motion.div
      key="paywall"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-xl font-medium text-white">Choose Your Plan</h2>
        <p className="text-sm text-[#888]">
          Turn AI visibility into pipeline
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <span className={`text-sm ${!isAnnual ? 'text-white' : 'text-[#666]'}`}>
          Monthly
        </span>
        <button
          onClick={() => setIsAnnual(!isAnnual)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            isAnnual ? 'bg-[#1a1a1a] border border-[#333]' : 'bg-[#333]'
          }`}
        >
          <div
            className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${
              isAnnual 
                ? 'translate-x-7 bg-white' 
                : 'translate-x-1 bg-white'
            }`}
          />
        </button>
        <span className={`text-sm ${isAnnual ? 'text-white' : 'text-[#666]'}`}>
          Annual
          <span className="text-xs text-[#888] ml-1">(save 17%)</span>
        </span>
      </div>

      {/* Pricing Plans */}
      <div className="grid gap-4">
        {PRICING_PLANS.map((plan) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: PRICING_PLANS.indexOf(plan) * 0.1, duration: 0.3 }}
            className={`relative bg-[#111] border rounded-lg p-6 transition-all duration-200 ${
              plan.isRecommended 
                ? 'border-white shadow-lg' 
                : 'border-[#333] hover:border-[#444]'
            }`}
          >
            {plan.isRecommended && (
              <div className="absolute -top-3 left-6">
                <div className="bg-white text-black px-3 py-1 text-xs font-medium rounded-sm">
                  Recommended
                </div>
              </div>
            )}

            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                <p className="text-[#888] mb-3">{plan.description}</p>
                
                {plan.id === 'pro' ? (
                  <div className="text-3xl font-bold text-white">
                    ${isAnnual ? Math.round(getCurrentCreditTier(selectedCredits).totalPrice * 0.83) : getCurrentCreditTier(selectedCredits).totalPrice}
                    <span className="text-base font-normal text-[#888]">/month</span>
                  </div>
                ) : plan.isEnterprise ? (
                  <div className="text-3xl font-bold text-white">
                    Custom Pricing
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-white">
                    ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                    <span className="text-base font-normal text-[#888]">/month</span>
                  </div>
                )}
              </div>
            </div>

            {/* Pro Plan Credit Selection */}
            {plan.id === 'pro' && (
              <div className="mb-6">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <label className="flex items-center gap-2 text-sm font-medium text-white mb-2 cursor-help">
                      Monthly Lead Credits
                      <HelpCircle className="w-4 h-4 text-[#888]" />
                    </label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Normal Lead = 1 credit • Max Lead = 5 credits</p>
                  </TooltipContent>
                </Tooltip>
                <Select
                  value={selectedCredits.toString()}
                  onValueChange={(value) => setSelectedCredits(parseInt(value))}
                >
                  <SelectTrigger className="w-full bg-[#111] border-[#333] text-white hover:bg-[#222]">
                    <SelectValue placeholder="Select credits" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] border-[#333]">
                    {CREDIT_PRICING_TIERS.map((tier) => (
                      <SelectItem key={tier.credits} value={tier.credits.toString()} className="text-white hover:bg-[#333] focus:bg-[#333]">
                        {tier.credits.toLocaleString()} credits - ${isAnnual ? Math.round(tier.totalPrice * 0.83) : tier.totalPrice}/mo
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Features */}
            <div className="space-y-2 mb-6">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-[#ccc]">{feature}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={() => handlePlanSelect(plan.id)}
              className={`w-full ${
                plan.isRecommended
                  ? 'bg-white hover:bg-gray-100 text-black'
                  : plan.isEnterprise
                    ? 'bg-white hover:bg-gray-100 text-black border border-[#333]'
                    : 'bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-[#333]'
              }`}
            >
              {plan.buttonText}
            </Button>
          </motion.div>
        ))}
      </div>



      {/* Trust Indicators */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-6 text-sm text-[#666]">
          <span>✓ Cancel anytime</span>
          <span>✓ 14-day money back</span>
        </div>
      </div>
    </motion.div>
    </TooltipProvider>
  )
} 
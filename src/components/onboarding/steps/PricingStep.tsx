import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { PRICING_PLANS } from '../utils/onboarding-constants'

interface PricingStepProps {
  isAnnual: boolean
  setIsAnnual: (annual: boolean) => void
  onSelectPlan: () => void
}

export function PricingStep({ isAnnual, setIsAnnual, onSelectPlan }: PricingStepProps) {
  return (
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
          Your analysis is complete! Select a plan to unlock your full visibility insights.
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
          <span className="text-xs text-[#888] ml-1">(save 20%)</span>
        </span>
      </div>

      {/* Pricing Plans */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {PRICING_PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`bg-[#1a1a1a] p-6 relative ${
              plan.isRecommended 
                ? 'border-2 border-white' 
                : 'border border-[#333]'
            }`}
          >
            {plan.isRecommended && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-white text-black px-3 py-1 text-xs font-medium">
                  RECOMMENDED
                </div>
              </div>
            )}
            
            <div className="text-center mb-6">
              <h3 className="text-lg font-medium text-white mb-1">{plan.name}</h3>
              <p className="text-xs text-[#888] mb-3">{plan.description}</p>
              <div className="text-3xl font-bold text-white mb-1">
                ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
              </div>
              <div className="text-xs text-[#666]">per month</div>
            </div>
            
            <div className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span className="text-sm text-white">{feature}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={onSelectPlan}
              className={`w-full h-10 text-sm font-medium ${plan.buttonStyle}`}
            >
              {plan.buttonText}
            </Button>
          </div>
        ))}
      </div>

      {/* Skip Option */}
      <div className="text-center">
        <button
          onClick={onSelectPlan}
          className="text-[#666] text-sm hover:text-white transition-colors"
        >
          Continue with free tier (limited features)
        </button>
      </div>
    </motion.div>
  )
} 
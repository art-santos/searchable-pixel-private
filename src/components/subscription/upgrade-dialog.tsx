'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { 
  Zap, 
  Sparkles, 
  Crown, 
  FileText, 
  BarChart, 
  Globe, 
  Webhook,
  TrendingUp,
  Users,
  Lock,
  Bot,
  ArrowRight
} from 'lucide-react'
import { PlanType, PLANS, FeatureType } from '@/lib/subscription/config'
import { useRouter } from 'next/navigation'

interface UpgradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feature?: string
  requiredPlan?: PlanType
  fromPath?: string
}

// Feature descriptions and benefits
const FEATURE_INFO: Record<string, {
  title: string
  description: string
  icon: any
  benefits: string[]
}> = {
  'generate-content': {
    title: 'AEO Content Agent',
    description: 'Your AI-powered content strategist that identifies visibility gaps and creates optimized content',
    icon: Bot,
    benefits: [
      'Automatically identifies content gaps in your AI visibility',
      'Suggests topics based on competitor analysis',
      'Drafts SEO-optimized articles tailored for AI crawlers',
      'Monitors performance and suggests improvements'
    ]
  },
  'competitor-analysis': {
    title: 'Competitor Analysis',
    description: 'Track and compare your visibility against competitors',
    icon: TrendingUp,
    benefits: [
      'Monitor competitor rankings',
      'Track visibility trends',
      'Identify content gaps',
      'Benchmark performance'
    ]
  },
  'multi-domain': {
    title: 'Multi-Domain Management',
    description: 'Track multiple domains from a single dashboard',
    icon: Globe,
    benefits: [
      'Manage up to 3 domains',
      'Unified analytics',
      'Cross-domain insights',
      'Team collaboration'
    ]
  },
  'custom-reports': {
    title: 'Custom Reports',
    description: 'Generate detailed reports tailored to your needs',
    icon: BarChart,
    benefits: [
      'Customizable metrics',
      'Scheduled reports',
      'Export to PDF/CSV',
      'White-label options'
    ]
  },
  'webhooks': {
    title: 'Webhooks & API Access',
    description: 'Integrate with your existing tools and workflows',
    icon: Webhook,
    benefits: [
      'Real-time notifications',
      'API access',
      'Custom integrations',
      'Automation support'
    ]
  }
}

// Plan pricing and features
const PLAN_INFO = {
  visibility: {
    price: { monthly: 40, annual: 32 },
    features: [
      'Daily visibility scans',
      'Basic analytics',
      '180-day data retention',
      'Email support'
    ]
  },
  plus: {
    price: { monthly: 200, annual: 160 },
    features: [
      'Daily MAX scans (200+ queries)',
      '10 AI articles per month',
      'Competitor analysis',
      'Priority support'
    ]
  },
  pro: {
    price: { monthly: 1000, annual: 800 },
    features: [
      'Unlimited MAX scans',
      '30 premium articles per month',
      'Track up to 3 domains',
      'API & webhook access'
    ]
  }
}

export function UpgradeDialog({
  open,
  onOpenChange,
  feature,
  requiredPlan,
  fromPath
}: UpgradeDialogProps) {
  const router = useRouter()
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')
  
  const featureInfo = feature ? FEATURE_INFO[feature] : null
  const planInfo = requiredPlan ? PLAN_INFO[requiredPlan as keyof typeof PLAN_INFO] : null
  const Icon = featureInfo?.icon || Lock
  
  // Get plan icon
  const getPlanIcon = (plan: PlanType) => {
    switch (plan) {
      case 'visibility':
        return Zap
      case 'plus':
        return Sparkles
      case 'pro':
        return Crown
      default:
        return Lock
    }
  }
  
  const PlanIcon = requiredPlan ? getPlanIcon(requiredPlan) : Lock
  
  const handleUpgrade = () => {
    // Close dialog and let the settings page handle the upgrade
    onOpenChange(false)
    // The billing tab should already be selected from the URL params
  }
  
  return (
    <>
      {/* Dark overlay */}
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 z-40"
          onClick={() => onOpenChange(false)}
        />
      )}
      
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl bg-[#0a0a0a] border-[#1a1a1a] z-50 p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {featureInfo?.title || 'Upgrade Required'}
            </DialogTitle>
          </DialogHeader>
          
          {/* Header Section */}
          <div className="p-8 pb-0">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#111] rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-medium text-white mb-1">
                  {featureInfo?.title || 'Upgrade Required'}
                </h2>
                <p className="text-sm text-[#888] leading-relaxed">
                  {featureInfo?.description || 'This feature requires a higher plan'}
                </p>
              </div>
            </div>
            
            {/* Feature benefits */}
            {featureInfo && (
              <div className="mt-6 space-y-2">
                {featureInfo.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className="w-1 h-1 bg-white/40 rounded-full mt-1.5 flex-shrink-0" />
                    <span className="text-[#999] leading-relaxed">{benefit}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Plan Section */}
          {requiredPlan && planInfo && (
            <div className="p-8 pt-6">
              <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-lg p-6">
                {/* Plan Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#111] rounded-lg flex items-center justify-center">
                      <PlanIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">
                        {PLANS[requiredPlan].name} Plan
                      </h3>
                      <p className="text-xs text-[#666]">
                        Everything you need to scale
                      </p>
                    </div>
                  </div>
                  
                  {/* Billing toggle */}
                  <div className="flex items-center gap-2 bg-[#111] rounded-full p-0.5">
                    <button
                      onClick={() => setBillingPeriod('monthly')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        billingPeriod === 'monthly' 
                          ? 'bg-[#1a1a1a] text-white' 
                          : 'text-[#666] hover:text-[#999]'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingPeriod('annual')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        billingPeriod === 'annual' 
                          ? 'bg-[#1a1a1a] text-white' 
                          : 'text-[#666] hover:text-[#999]'
                      }`}
                    >
                      Annual
                    </button>
                  </div>
                </div>
                
                {/* Price */}
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-3xl font-semibold text-white">
                    ${planInfo.price[billingPeriod]}
                  </span>
                  <span className="text-[#666]">/month</span>
                  {billingPeriod === 'annual' && (
                    <span className="text-xs text-[#666] bg-[#111] px-2 py-0.5 rounded-full">
                      Save 20%
                    </span>
                  )}
                </div>
                
                {/* Plan features */}
                <div className="space-y-3 mb-6">
                  {planInfo.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className="w-4 h-4 rounded-full bg-[#111] flex items-center justify-center flex-shrink-0">
                        <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
                      </div>
                      <span className="text-[#999]">{feature}</span>
                    </div>
                  ))}
                </div>
                
                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => onOpenChange(false)}
                    variant="ghost"
                    className="flex-1 h-10 border-0 bg-transparent hover:bg-[#111] text-[#666] hover:text-white"
                  >
                    Not now
                  </Button>
                  <Button
                    onClick={handleUpgrade}
                    className="flex-1 h-10 bg-[#1a1a1a] hover:bg-[#333] border border-[#333] hover:border-[#444] text-white font-medium group"
                  >
                    Upgrade
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </div>
              </div>
              
              {/* Trust indicators */}
              <div className="mt-4 flex items-center justify-center gap-6 text-xs text-[#666]">
                <span>Cancel anytime</span>
                <span>•</span>
                <span>Secure payment</span>
                <span>•</span>
                <span>Instant access</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
} 
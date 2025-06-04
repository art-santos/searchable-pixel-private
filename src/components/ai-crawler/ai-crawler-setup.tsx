'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { 
  CreditCard, 
  CheckCircle2, 
  ArrowRight, 
  Loader2,
  ArrowLeft,
  Shield,
  BarChart3,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/hooks/useSubscription'

interface AICrawlerSetupProps {
  platform: 'vercel' | 'custom'
  onComplete?: () => void
  onBack?: () => void
}

interface PaymentMethod {
  id: string
  card: {
    brand: string
    last4: string
    exp_month: number
    exp_year: number
  }
}

export function AICrawlerSetup({ platform, onComplete, onBack }: AICrawlerSetupProps) {
  const { user } = useAuth()
  const { usage, subscription } = useSubscription()
  const [step, setStep] = useState<'intro' | 'payment' | 'complete'>('intro')
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loadingPayment, setLoadingPayment] = useState(true)
  const [isEnabling, setIsEnabling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get plan information
  const planType = subscription?.plan || 'free'
  const aiLogsIncluded = planType === 'free' ? 100 : planType === 'visibility' ? 250 : planType === 'plus' ? 500 : planType === 'pro' ? 1000 : 100
  const hasPaymentMethod = paymentMethods.length > 0

  useEffect(() => {
    checkPaymentMethods()
  }, [])

  const checkPaymentMethods = async () => {
    setLoadingPayment(true)
    try {
      const response = await fetch('/api/stripe/payment-methods')
      if (response.ok) {
        const data = await response.json()
        setPaymentMethods(data.paymentMethods || [])
      }
    } catch (error) {
      console.error('Error checking payment methods:', error)
    } finally {
      setLoadingPayment(false)
    }
  }

  const handleAddPaymentMethod = async () => {
    try {
      const response = await fetch('/api/stripe/setup-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const { setupIntent } = await response.json()
        window.location.href = setupIntent.url
      } else {
        throw new Error('Failed to create setup intent')
      }
    } catch (error) {
      setError('Failed to set up payment method')
      console.error('Error setting up payment method:', error)
    }
  }

  const handleEnableTracking = async () => {
    setIsEnabling(true)
    setError(null)
    
    try {
      const response = await fetch('/api/billing/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: {
            ai_logs_enabled: true,
            overage_notifications: true
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to enable AI tracking')
      }

      setStep('complete')
    } catch (error) {
      setError('Failed to enable AI tracking')
      console.error('Error enabling AI tracking:', error)
    } finally {
      setIsEnabling(false)
    }
  }

  const getPlatformInstructions = () => {
    switch (platform) {
      case 'vercel':
        return {
          title: 'Vercel / Next.js',
          steps: [
            'Install our package: npm install @split.dev/analytics',
            'Add to your middleware.ts file',
            'Deploy your changes'
          ]
        }
      case 'custom':
        return {
          title: 'Custom Server',
          steps: [
            'Install our package: npm install @split.dev/analytics',
            'Add middleware to your server',
            'Deploy your changes'
          ]
        }
      default:
        return { title: 'Setup', steps: [] }
    }
  }

  const instructions = getPlatformInstructions()

  return (
    <div className="max-w-[500px] mx-auto">
      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="text-center space-y-2">
              <h2 className="text-xl text-white">
                Enable AI Crawler Tracking
              </h2>
              <p className="text-sm text-[#666]">
                Track which AI systems are viewing your content
              </p>
            </div>

            {/* Free Plan Highlight */}
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-white font-medium">Free Plan Included</div>
                <div className="text-sm bg-[#1a1a1a] text-[#888] px-2 py-1 rounded font-mono">
                  {aiLogsIncluded} logs/month
                </div>
              </div>
              <div className="text-sm text-[#666]">
                Additional logs beyond your plan: <span className="text-[#888] font-mono">$0.008 each</span>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 py-3">
                <div className="w-8 h-8 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-[#888]" />
                </div>
                <div>
                  <div className="text-sm text-white">Real-time Detection</div>
                  <div className="text-xs text-[#666]">See AI crawlers as they visit</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 py-3">
                <div className="w-8 h-8 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-[#888]" />
                </div>
                <div>
                  <div className="text-sm text-white">Source Attribution</div>
                  <div className="text-xs text-[#666]">Know which AI systems are crawling</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 py-3">
                <div className="w-8 h-8 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-[#888]" />
                </div>
                <div>
                  <div className="text-sm text-white">Full Control</div>
                  <div className="text-xs text-[#666]">Disable anytime in Settings</div>
                </div>
              </div>
            </div>

            {/* Action */}
            {loadingPayment ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-[#666]" />
              </div>
            ) : (
              <div className="flex gap-3 pt-2">
                {onBack && (
                  <Button
                    onClick={onBack}
                    variant="outline"
                    className="flex-1 border-[#1a1a1a] text-[#666] hover:text-white bg-transparent hover:bg-[#1a1a1a]"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                )}
                <Button
                  onClick={() => {
                    if (hasPaymentMethod || planType !== 'free') {
                      handleEnableTracking()
                    } else {
                      setStep('payment')
                    }
                  }}
                  className="flex-1 bg-[#1a1a1a] hover:bg-[#333] border border-[#333] hover:border-[#444] text-white"
                  disabled={isEnabling}
                >
                  {isEnabling ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {hasPaymentMethod || planType !== 'free' ? 'Enable Tracking' : 'Continue'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {error && (
              <div className="bg-[#1a1a1a] border border-[#333] p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#888] mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-[#888]">{error}</div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {step === 'payment' && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-xl text-white">
                Add Payment Method
              </h2>
              <p className="text-sm text-[#666]">
                Required for usage beyond {aiLogsIncluded} free logs per month
              </p>
            </div>

            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#888]" />
                <div className="text-sm text-white">Secure & Transparent</div>
              </div>
              
              <div className="space-y-2 text-sm text-[#666]">
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-[#666] rounded-full mt-2 flex-shrink-0"></div>
                  <div>Payment securely processed by Stripe</div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-[#666] rounded-full mt-2 flex-shrink-0"></div>
                  <div>Only charged for usage above {aiLogsIncluded} logs/month</div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-[#666] rounded-full mt-2 flex-shrink-0"></div>
                  <div>Cancel or disable anytime in Settings</div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-[#666] rounded-full mt-2 flex-shrink-0"></div>
                  <div>Real-time usage tracking and alerts</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setStep('intro')}
                variant="outline"
                className="flex-1 border-[#1a1a1a] text-[#666] hover:text-white bg-transparent hover:bg-[#1a1a1a]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleAddPaymentMethod}
                className="flex-1 bg-[#1a1a1a] hover:bg-[#333] border border-[#333] hover:border-[#444] text-white"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Add Payment Method
              </Button>
            </div>

            {error && (
              <div className="bg-[#1a1a1a] border border-[#333] p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#888] mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-[#888]">{error}</div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {step === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-[#1a1a1a] border border-[#333] rounded-lg flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl text-white mb-2">
                  AI Tracking Enabled
                </h2>
                <p className="text-sm text-[#666]">
                  Now set up the code on your {instructions.title} site
                </p>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
              <div className="text-sm text-white mb-3">Setup Instructions</div>
              
              <div className="space-y-3">
                {instructions.steps.map((step, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="w-5 h-5 bg-[#1a1a1a] border border-[#333] rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-[#888] font-mono">{index + 1}</span>
                    </div>
                    <div className="text-sm text-[#888] leading-relaxed">
                      {step}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-3">
              <div className="text-xs text-[#666] text-center">
                Manage tracking settings in{' '}
                <span className="text-[#888]">Settings → Usage & Controls</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => window.open('https://docs.split.dev', '_blank')}
                variant="outline"
                className="flex-1 border-[#1a1a1a] text-[#666] hover:text-white bg-transparent hover:bg-[#1a1a1a]"
              >
                Documentation
              </Button>
              <Button
                onClick={onComplete}
                className="flex-1 bg-[#1a1a1a] hover:bg-[#333] border border-[#333] hover:border-[#444] text-white"
              >
                Complete Setup
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 
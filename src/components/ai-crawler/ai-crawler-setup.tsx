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
  AlertCircle,
  Eye
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
  const planType = subscription?.plan || 'starter'
  const aiLogsIncluded = planType === 'starter' ? 100 : planType === 'pro' ? 500 : planType === 'team' ? 1000 : 100
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
      setError(null)
      console.log('🔄 Starting payment method setup...')
      
      const response = await fetch('/api/stripe/setup-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      console.log('📡 Setup intent response status:', response.status)
      const data = await response.json()
      console.log('📋 Setup intent response data:', data)
      
      if (response.ok && data.setupIntent?.url) {
        console.log('✅ Redirecting to Stripe checkout:', data.setupIntent.url)
        window.location.href = data.setupIntent.url
      } else {
        console.error('❌ Setup intent failed:', data)
        throw new Error(data.details || data.error || 'Failed to create setup intent')
      }
    } catch (error) {
      console.error('💥 Payment method setup error:', error)
      setError(error instanceof Error ? error.message : 'Failed to set up payment method')
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
            <div className="text-center space-y-2">
              <h2 className="text-xl text-black dark:text-white">
                Enable AI Crawler Tracking
              </h2>
              <p className="text-sm text-gray-500 dark:text-[#666]">
                Track which AI crawlers visit your website
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-3 py-3">
                <div className="w-8 h-8 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg flex items-center justify-center">
                  <Eye className="w-4 h-4 text-gray-600 dark:text-[#888]" />
                </div>
                <div>
                  <div className="text-sm text-black dark:text-white">Real-time Detection</div>
                  <div className="text-xs text-gray-500 dark:text-[#666]">See AI crawlers as they visit</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 py-3">
                <div className="w-8 h-8 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-gray-600 dark:text-[#888]" />
                </div>
                <div>
                  <div className="text-sm text-black dark:text-white">Usage Analytics</div>
                  <div className="text-xs text-gray-500 dark:text-[#666]">Understand AI training patterns</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 py-3">
                <div className="w-8 h-8 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-gray-600 dark:text-[#888]" />
                </div>
                <div>
                  <div className="text-sm text-black dark:text-white">Full Control</div>
                  <div className="text-xs text-gray-500 dark:text-[#666]">Disable anytime in Settings</div>
                </div>
              </div>
            </div>

            {/* Action */}
            {loadingPayment ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400 dark:text-[#666]" />
              </div>
            ) : (
              <div className="flex gap-3 pt-2">
                {onBack && (
                  <Button
                    onClick={onBack}
                    variant="outline"
                    className="flex-1 border-gray-200 dark:border-[#1a1a1a] text-gray-500 dark:text-[#666] hover:text-black dark:hover:text-white bg-transparent hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                )}
                <Button
                  onClick={() => {
                    if (hasPaymentMethod) {
                      handleEnableTracking()
                    } else {
                      setStep('payment')
                    }
                  }}
                  className="flex-1 bg-gray-900 dark:bg-[#1a1a1a] hover:bg-gray-800 dark:hover:bg-[#333] border border-gray-300 dark:border-[#333] hover:border-gray-400 dark:hover:border-[#444] text-white"
                  disabled={isEnabling}
                >
                  {isEnabling ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {hasPaymentMethod ? 'Enable Tracking' : 'Continue'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-[#1a1a1a] border border-red-200 dark:border-[#333] p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 dark:text-[#888] mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-700 dark:text-[#888]">{error}</div>
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
              <h2 className="text-xl text-black dark:text-white">
                Add Payment Method
              </h2>
              <p className="text-sm text-gray-500 dark:text-[#666]">
                Required for usage beyond {aiLogsIncluded} included logs per month
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-600 dark:text-[#888]" />
                <div className="text-sm text-black dark:text-white">Secure & Transparent</div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-500 dark:text-[#666]">
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-gray-400 dark:bg-[#666] rounded-full mt-2 flex-shrink-0"></div>
                  <div>Payment securely processed by Stripe</div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-gray-400 dark:bg-[#666] rounded-full mt-2 flex-shrink-0"></div>
                  <div>Only charged for usage above {aiLogsIncluded} included logs/month</div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-gray-400 dark:bg-[#666] rounded-full mt-2 flex-shrink-0"></div>
                  <div>Cancel or disable anytime in Settings</div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-gray-400 dark:bg-[#666] rounded-full mt-2 flex-shrink-0"></div>
                  <div>Real-time usage tracking and alerts</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setStep('intro')}
                variant="outline"
                className="flex-1 border-gray-200 dark:border-[#1a1a1a] text-gray-500 dark:text-[#666] hover:text-black dark:hover:text-white bg-transparent hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleAddPaymentMethod}
                className="flex-1 bg-gray-900 dark:bg-[#1a1a1a] hover:bg-gray-800 dark:hover:bg-[#333] border border-gray-300 dark:border-[#333] hover:border-gray-400 dark:hover:border-[#444] text-white"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Add Payment Method
              </Button>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-[#1a1a1a] border border-red-200 dark:border-[#333] p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 dark:text-[#888] mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-700 dark:text-[#888]">{error}</div>
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
              <div className="w-12 h-12 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#333] rounded-lg flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 text-black dark:text-white" />
              </div>
              <div>
                <h2 className="text-xl text-black dark:text-white mb-2">
                  AI Tracking Enabled
                </h2>
                <p className="text-sm text-gray-500 dark:text-[#666]">
                  Now set up the code on your {instructions.title} site
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-lg p-4">
              <div className="text-sm text-black dark:text-white mb-3">Setup Instructions</div>
              
              <div className="space-y-3">
                {instructions.steps.map((step, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="w-5 h-5 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#333] rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-gray-600 dark:text-[#888] font-mono">{index + 1}</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-[#888] leading-relaxed">
                      {step}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-lg p-3">
              <div className="text-xs text-gray-500 dark:text-[#666] text-center">
                Manage tracking settings in{' '}
                <span className="text-gray-700 dark:text-[#888]">Settings → Usage & Controls</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => window.open('https://docs.split.dev', '_blank')}
                variant="outline"
                className="flex-1 border-gray-200 dark:border-[#1a1a1a] text-gray-500 dark:text-[#666] hover:text-black dark:hover:text-white bg-transparent hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
              >
                Documentation
              </Button>
              <Button
                onClick={onComplete}
                className="flex-1 bg-gray-900 dark:bg-[#1a1a1a] hover:bg-gray-800 dark:hover:bg-[#333] border border-gray-300 dark:border-[#333] hover:border-gray-400 dark:hover:border-[#444] text-white"
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
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  CreditCard, 
  Zap, 
  Shield, 
  CheckCircle2, 
  ArrowRight, 
  Info,
  Loader2,
  AlertTriangle
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
  const { usage } = useSubscription()
  const [step, setStep] = useState<'intro' | 'payment' | 'complete'>('intro')
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loadingPayment, setLoadingPayment] = useState(true)
  const [isEnabling, setIsEnabling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get plan information
  const planType = usage?.billingPeriod?.planType || 'free'
  const aiLogsIncluded = usage?.aiLogs?.included || (planType === 'free' ? 100 : 250)
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
        // Redirect to Stripe's hosted setup page
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
      // Enable AI tracking in billing preferences
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
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">
                Enable AI Crawler Tracking
              </h3>
              <p className="text-[#666] max-w-md mx-auto">
                Track which AI engines are viewing your content to optimize your AI visibility strategy
              </p>
            </div>

            {/* What you get */}
            <Card className="bg-[#0a0a0a] border-[#1a1a1a]">
              <CardContent className="p-6">
                <h4 className="font-medium text-white mb-4">What you'll get:</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white text-sm font-medium">Real-time AI crawler detection</p>
                      <p className="text-[#666] text-xs">Track ChatGPT, Claude, Perplexity, and 50+ other AI crawlers</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white text-sm font-medium">Attribution by source</p>
                      <p className="text-[#666] text-xs">See which AI engines are crawling your content most</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white text-sm font-medium">Usage analytics</p>
                      <p className="text-[#666] text-xs">Monitor trends and optimize your AI visibility</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card className="bg-[#0a0a0a] border-[#1a1a1a]">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-white mb-1">Pricing</h4>
                    <p className="text-[#666] text-sm">
                      You get <span className="text-white font-medium">{aiLogsIncluded} free AI crawler logs</span> per month. 
                      Additional logs cost <span className="text-white font-medium">$0.008 each</span>.
                    </p>
                  </div>
                </div>
                
                {planType === 'free' && (
                  <div className="flex items-start gap-3 mt-4 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <p className="text-yellow-200 text-xs">
                      Free plan users need a payment method on file to track AI crawlers beyond the included amount.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {loadingPayment ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#666]" />
              </div>
            ) : (
              <div className="flex gap-3">
                {onBack && (
                  <Button
                    onClick={onBack}
                    variant="outline"
                    className="flex-1 border-[#333] text-[#666] hover:text-white"
                  >
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
                  className="flex-1 bg-white text-black hover:bg-gray-100"
                  disabled={isEnabling}
                >
                  {isEnabling ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Zap className="w-4 h-4 mr-2" />
                  )}
                  {hasPaymentMethod || planType !== 'free' ? 'Enable Tracking' : 'Add Payment Method'}
                </Button>
              </div>
            )}

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                {error}
              </div>
            )}
          </motion.div>
        )}

        {step === 'payment' && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">
                Add Payment Method
              </h3>
              <p className="text-[#666] max-w-md mx-auto">
                We need a payment method on file to bill for any usage beyond your {aiLogsIncluded} free AI crawler logs.
              </p>
            </div>

            <Card className="bg-[#0a0a0a] border-[#1a1a1a]">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-white mb-2">Secure & Transparent</h4>
                    <ul className="space-y-1 text-sm text-[#666]">
                      <li>• Your card is securely stored by Stripe</li>
                      <li>• You'll only be charged for usage above {aiLogsIncluded} logs/month</li>
                      <li>• Cancel anytime in billing settings</li>
                      <li>• Real-time usage tracking and alerts</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                onClick={() => setStep('intro')}
                variant="outline"
                className="flex-1 border-[#333] text-[#666] hover:text-white"
              >
                Back
              </Button>
              <Button
                onClick={handleAddPaymentMethod}
                className="flex-1 bg-white text-black hover:bg-gray-100"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Add Payment Method
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">
                AI Tracking Enabled!
              </h3>
              <p className="text-[#666] max-w-md mx-auto">
                Now let's set up the code to start tracking AI crawlers on your {instructions.title} site.
              </p>
            </div>

            {/* Setup Instructions */}
            <Card className="bg-[#0a0a0a] border-[#1a1a1a]">
              <CardHeader>
                <CardTitle className="text-white text-lg">Setup Instructions</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <ol className="space-y-4">
                  {instructions.steps.map((step, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="text-[#666] flex-shrink-0 font-medium">{index + 1}.</span>
                      <p className="text-[#ccc] text-sm">{step}</p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                onClick={() => window.open('https://docs.split.dev', '_blank')}
                variant="outline"
                className="flex-1 border-[#333] text-[#666] hover:text-white"
              >
                View Documentation
              </Button>
              <Button
                onClick={onComplete}
                className="flex-1 bg-white text-black hover:bg-gray-100"
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
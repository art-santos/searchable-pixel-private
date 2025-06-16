'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { 
  CreditCard, 
  Shield, 
  Check, 
  Loader2, 
  ArrowRight,
  Lock,
  Zap,
  Globe,
  BarChart3
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function PaymentRequiredPage() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [workspaceName, setWorkspaceName] = useState('')

  // Check payment status on mount
  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!user) {
        router.push('/login')
        return
      }

      try {
        // Get workspace name for personalization
        const { data: profile } = await supabase
          .from('profiles')
          .select('workspace_name, first_name')
          .eq('id', user.id)
          .single()

        if (profile) {
          setWorkspaceName(profile.workspace_name || profile.first_name || 'your workspace')
        }

        // Check if payment method is already verified
        const response = await fetch('/api/payment-method/verify')
        if (response.ok) {
          const data = await response.json()
          if (data.verified || data.isAdmin || !data.requiresPaymentMethod) {
            // Payment method verified or admin, redirect to dashboard
            router.push('/dashboard')
            return
          }
        }
        
        setIsCheckingStatus(false)
      } catch (error) {
        console.error('Error checking payment status:', error)
        setIsCheckingStatus(false)
      }
    }

    checkPaymentStatus()
  }, [user, router])

  const handleAddPaymentMethod = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Create setup intent for payment method
      const response = await fetch('/api/stripe/setup-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to create payment setup session')
      }

      const { setupIntent } = await response.json()
      
      if (setupIntent?.url) {
        // Redirect to Stripe Checkout for payment method setup
        window.location.href = setupIntent.url
      } else {
        throw new Error('No setup URL received')
      }
    } catch (error) {
      console.error('Error setting up payment method:', error)
      setError(error instanceof Error ? error.message : 'Failed to setup payment method')
      setIsLoading(false)
    }
  }

  // Show loading while checking status
  if (isCheckingStatus) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-white">Checking payment status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          {/* Logo/Icon */}
          <div className="w-16 h-16 bg-gradient-to-br from-white to-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CreditCard className="w-8 h-8 text-black" />
          </div>
          
          {/* Header */}
          <h1 className="text-3xl font-bold text-white mb-3">
            Add Payment Method
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            {workspaceName ? 
              `Complete setup for ${workspaceName} by adding a payment method. We won't charge you until you upgrade.` :
              `Complete your workspace setup by adding a payment method. We won't charge you until you upgrade.`
            }
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="bg-[#111] border-[#222] mb-6">
            <CardContent className="p-6">
              {/* Features you'll get access to */}
              <div className="mb-6">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  What you'll get access to:
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                    <span className="text-gray-300 text-sm">AI visibility tracking & analytics</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                    <span className="text-gray-300 text-sm">Website snapshots & reports</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                    <span className="text-gray-300 text-sm">API access & integrations</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                    <span className="text-gray-300 text-sm">Full dashboard access</span>
                  </div>
                </div>
              </div>

              {/* Security assurance */}
              <div className="bg-[#0c0c0c] border border-[#222] rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <span className="text-white font-medium text-sm">Free Trial - No Charges</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  We require a payment method for account verification, but you won't be charged until you choose to upgrade from the free tier.
                </p>
              </div>

              {/* Error display */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Add payment method button */}
              <Button
                onClick={handleAddPaymentMethod}
                disabled={isLoading}
                className="w-full h-12 bg-white hover:bg-gray-100 text-black font-medium text-base"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Add Payment Method
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Trust indicators */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500 mb-4">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Secure payment
              </span>
              <span>•</span>
              <span>SSL encrypted</span>
              <span>•</span>
              <span>Cancel anytime</span>
            </div>
            
            <p className="text-xs text-gray-600">
              Powered by Stripe • We never store your card details
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 
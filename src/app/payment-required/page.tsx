'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Loader2, 
  ArrowRight,
  Lock,
  Check,
  X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { PRICING_PLANS } from '@/components/onboarding/utils/onboarding-constants'

// Text sequence for cinematic intro - optimized timing under 300ms transitions
const textSequence = [
  { text: 'Welcome to the future of AI attribution.', duration: 2800 },
  { text: 'Split shows you which bot visited your site.', duration: 2000 },
  { text: 'Which page they visited.', duration: 1500 },
  { text: 'and who saw it.', duration: 1800 },
]

export default function PaymentRequiredPage() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [workspaceName, setWorkspaceName] = useState('')
  
  // Animation states
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [showButton, setShowButton] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [isAnnual, setIsAnnual] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  
  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Check payment status on mount
  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!user) {
        router.push('/login')
        return
      }

      try {
        // Get workspace name for personalization
        if (supabase) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('workspace_name, first_name')
            .eq('id', user.id)
            .single()

          if (profile) {
            setWorkspaceName(profile.workspace_name || profile.first_name || 'your workspace')
          }
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
  }, [user, router, supabase])

  // Text sequence animation with faster transitions
  useEffect(() => {
    if (isCheckingStatus) return

    const timer = setTimeout(() => {
      if (currentTextIndex < textSequence.length - 1) {
        setCurrentTextIndex(currentTextIndex + 1)
      } else {
        setShowButton(true)
      }
    }, textSequence[currentTextIndex].duration)

    return () => clearTimeout(timer)
  }, [currentTextIndex, isCheckingStatus])

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId)
    setIsLoading(true)
    setError(null)

    try {
      // Create checkout session for the selected plan
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId,
          isAnnual,
          customerEmail: user?.email || '',
          // Success URL will redirect to dashboard after payment
          successUrl: `${window.location.origin}/dashboard?payment=success`,
          cancelUrl: window.location.href
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { url, error: sessionError } = await response.json()
      
      if (sessionError) {
        throw new Error(sessionError)
      }
      
      if (url) {
        // Redirect to Stripe Checkout for subscription creation
        window.location.href = url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      setError(error instanceof Error ? error.message : 'Failed to create checkout session')
      setIsLoading(false)
    }
  }

  // Show loading while checking status
  if (isCheckingStatus) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <div 
        className="min-h-screen bg-[#0c0c0c] flex items-center justify-center p-6 relative cursor-pointer"
        onClick={() => showButton && setShowModal(true)}
      >
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />

        <motion.div 
          className="relative z-10 w-full max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Logo and text container - unified animation */}
          <div className="text-center">
            {/* Logo - only show during text sequence */}
            <AnimatePresence>
              {!showButton && (
                <motion.div 
                  className="mb-3 flex justify-center"
                  initial={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <motion.div
                    animate={prefersReducedMotion ? {} : { 
                      rotateY: [0, 360],
                      scale: [1, 1.02, 1]
                    }}
                    transition={prefersReducedMotion ? {} : { 
                      rotateY: {
                        duration: 8,
                        repeat: Infinity,
                        ease: "linear"
                      },
                      scale: {
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }
                    }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <Image 
                      src="/images/split-icon-white.svg" 
                      width={64} 
                      height={64} 
                      alt="Split Logo" 
                      className="opacity-80"
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Text sequence container */}
            <div className="min-h-[120px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {!showButton ? (
                  <motion.h1
                    key={currentTextIndex}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="text-2xl md:text-4xl font-medium text-white/90 leading-tight max-w-3xl"
                    style={{ letterSpacing: '-0.04em' }}
                  >
                    {textSequence[currentTextIndex].text}
                  </motion.h1>
                ) : (
                  <motion.div
                    key="cta"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
                    className="text-center"
                  >
                    <div className="relative inline-block">
                      <h1 className="text-xl md:text-2xl text-white/80" style={{ letterSpacing: '-0.04em' }}>
                        Click anywhere to get started
                      </h1>
                      {/* Animated underline */}
                      <motion.div
                        className="absolute -bottom-2 left-0 h-0.5 bg-white/60"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ 
                          duration: 0.8, 
                          ease: "easeOut",
                          delay: 0.6
                        }}
                      />
                      {/* Glowing underline effect */}
                      <motion.div
                        className="absolute -bottom-2 left-0 h-0.5 bg-white/20 blur-sm"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ 
                          duration: 0.8, 
                          ease: "easeOut",
                          delay: 0.6
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Pricing Modal - minimal design */}
      <AnimatePresence>
        {showModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50"
              onClick={() => setShowModal(false)}
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="sticky top-0 bg-[#0a0a0a] border-b border-[#1a1a1a] p-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-medium text-white font-mono" style={{ letterSpacing: '-0.05em' }}>Choose Your Plan</h2>
                    <p className="text-[#666] text-xs mt-1 font-mono" style={{ letterSpacing: '-0.05em' }}>
                      Complete setup for {workspaceName}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-[#666] hover:text-white transition-colors duration-200 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                  {/* Billing Toggle */}
                  <div className="flex items-center justify-center gap-4 mb-8">
                    <span className={`text-xs font-mono ${!isAnnual ? 'text-white' : 'text-[#666]'}`} style={{ letterSpacing: '-0.05em' }}>
                      Monthly
                    </span>
                    <button
                      onClick={() => setIsAnnual(!isAnnual)}
                      className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                        isAnnual ? 'bg-[#333]' : 'bg-[#222]'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform duration-200 ${
                          isAnnual 
                            ? 'translate-x-5 bg-white' 
                            : 'translate-x-0.5 bg-[#666]'
                        }`}
                      />
                    </button>
                    <span className={`text-xs font-mono ${isAnnual ? 'text-white' : 'text-[#666]'}`} style={{ letterSpacing: '-0.05em' }}>
                      Annual
                      <span className="text-[#666] ml-1">(save 20%)</span>
                    </span>
                  </div>

                  {/* Error display */}
                  {error && (
                    <div className="bg-[#111] border border-[#222] rounded-sm p-3 mb-6">
                      <p className="text-xs text-[#999] font-mono" style={{ letterSpacing: '-0.05em' }}>{error}</p>
                    </div>
                  )}

                  {/* Pricing Plans - minimal design */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {PRICING_PLANS.map((plan) => (
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: PRICING_PLANS.indexOf(plan) * 0.03, duration: 0.15, ease: "easeOut" }}
                        className={`bg-[#111] p-6 relative rounded-sm transition-all duration-200 ${
                          plan.isRecommended 
                            ? 'border border-white' 
                            : 'border border-[#222] hover:border-[#333]'
                        }`}
                      >
                        {plan.isRecommended && (
                          <div className="absolute -top-2.5 left-6">
                            <div className="bg-white text-black px-3 py-0.5 text-[10px] font-medium rounded-sm font-mono uppercase" style={{ letterSpacing: '-0.05em' }}>
                              Recommended
                            </div>
                          </div>
                        )}
                        
                        <div className="mb-6">
                          <h3 className="text-lg font-medium text-white mb-1 font-mono" style={{ letterSpacing: '-0.05em' }}>{plan.name}</h3>
                          <p className="text-xs text-[#666] mb-4 font-mono" style={{ letterSpacing: '-0.05em' }}>{plan.description}</p>
                          <div className="text-3xl font-bold text-white mb-0.5 font-mono" style={{ letterSpacing: '-0.05em' }}>
                            ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                          </div>
                          <div className="text-xs text-[#666] font-mono" style={{ letterSpacing: '-0.05em' }}>per month</div>
                        </div>
                        
                        <div className="space-y-2 mb-6">
                          {plan.features.slice(0, 6).map((feature, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <Check className="w-3 h-3 text-[#666] mt-0.5 flex-shrink-0" />
                              <span className="text-xs text-[#999] font-mono leading-relaxed" style={{ letterSpacing: '-0.05em' }}>{feature}</span>
                            </div>
                          ))}
                          {plan.features.length > 6 && (
                            <p className="text-xs text-[#666] font-mono pl-5" style={{ letterSpacing: '-0.05em' }}>
                              +{plan.features.length - 6} more features
                            </p>
                          )}
                        </div>

                        <Button
                          onClick={() => handleSelectPlan(plan.id)}
                          disabled={isLoading && selectedPlan === plan.id}
                          className={`w-full h-9 text-xs font-medium rounded-sm transition-all duration-200 font-mono ${
                            plan.isRecommended
                              ? 'bg-white hover:bg-gray-100 text-black border-0'
                              : 'bg-[#1a1a1a] hover:bg-[#222] text-white border border-[#333]'
                          }`}
                          style={{ letterSpacing: '-0.05em' }}
                        >
                          {isLoading && selectedPlan === plan.id ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                              Processing...
                            </>
                          ) : (
                            `Start with ${plan.name}`
                          )}
                        </Button>
                      </motion.div>
                    ))}
                  </div>

                  {/* Trust indicators */}
                  <div className="text-center pt-4 border-t border-[#1a1a1a]">
                    <div className="flex items-center justify-center gap-4 text-xs text-[#666] mb-3 font-mono" style={{ letterSpacing: '-0.05em' }}>
                      <span className="flex items-center gap-1.5">
                        <Lock className="w-3 h-3" />
                        Secure payment
                      </span>
                      <span>•</span>
                      <span>SSL encrypted</span>
                      <span>•</span>
                      <span>Cancel anytime</span>
                    </div>
                    
                    <p className="text-[10px] text-[#444] font-mono" style={{ letterSpacing: '-0.05em' }}>
                      Powered by Stripe • We never store your card details
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
} 
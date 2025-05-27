'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, ArrowRight, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const supabase = createClient()

  useEffect(() => {
    // Get email from URL params or localStorage
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    } else {
      // Try to get from onboarding data
      const onboardingData = localStorage.getItem('onboardingData')
      if (onboardingData) {
        const data = JSON.parse(onboardingData)
        setEmail(data.email || '')
      }
    }
  }, [searchParams])

  const handleResendEmail = async () => {
    if (!email || isResending || !supabase) return

    setIsResending(true)
    setResendMessage('')

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`
        }
      })

      if (error) {
        setResendMessage('Failed to resend email. Please try again.')
      } else {
        setResendMessage('Verification email sent! Check your inbox.')
        
        // Also re-add to Loops if resending (non-blocking)
        const formBody = `email=${encodeURIComponent(email)}&userGroup=${encodeURIComponent('Email resend')}&source=${encodeURIComponent('Verification resend')}`
        
        fetch('https://app.loops.so/api/newsletter-form/cmb5vrlua29icyq0iha1pm14f', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formBody,
        }).catch(error => {
          console.error('Loops re-signup error:', error)
          // Don't block the flow on newsletter errors
        })
      }
    } catch (err) {
      setResendMessage('Failed to resend email. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  const handleBackToSignup = () => {
    router.push('/signup')
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-16 h-16 bg-[#1a1a1a] border border-[#333] rounded-full flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">
                Check your email
              </h1>
              <p className="text-balance text-sm text-gray-400">
                We sent a verification link to
              </p>
              {email && (
                <p className="text-sm text-white font-medium bg-[#1a1a1a] border border-[#333] px-3 py-2 rounded">
                  {email}
                </p>
              )}
            </div>

            <div className="bg-[#1a1a1a] border border-[#333] p-6 rounded">
              <div className="text-sm text-white font-medium mb-3">What to do next:</div>
              <div className="space-y-3 text-sm text-gray-400">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#333] rounded-full flex items-center justify-center text-xs text-white font-medium mt-0.5">
                    1
                  </div>
                  <div>
                    <div className="text-white mb-1">Check your email inbox</div>
                    <div className="text-xs text-gray-500">Look for an email from Split</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#333] rounded-full flex items-center justify-center text-xs text-white font-medium mt-0.5">
                    2
                  </div>
                  <div>
                    <div className="text-white mb-1">Click the verification link</div>
                    <div className="text-xs text-gray-500">This will activate your account</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#333] rounded-full flex items-center justify-center text-xs text-white font-medium mt-0.5">
                    3
                  </div>
                  <div>
                    <div className="text-white mb-1">Return to see your score</div>
                    <div className="text-xs text-gray-500">You'll be automatically redirected to your dashboard</div>
                  </div>
                </div>
              </div>
            </div>

            {resendMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded border text-sm ${
                  resendMessage.includes('sent') 
                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}
              >
                {resendMessage}
              </motion.div>
            )}

            <div className="space-y-3">
              <Button
                onClick={() => router.push('/login')}
                className="w-full bg-white hover:bg-gray-100 text-black h-12 text-sm font-medium"
              >
                I've verified my email
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <Button
                onClick={handleBackToSignup}
                variant="ghost"
                className="w-full text-gray-400 hover:text-white h-12 text-sm"
              >
                Back to signup
              </Button>
            </div>

            <div className="text-center text-xs text-gray-500">
              <button 
                onClick={handleResendEmail}
                disabled={isResending}
                className="text-gray-400 hover:text-white underline underline-offset-4 transition-colors"
              >
                {isResending ? 'Sending...' : 'Resend verification'}
              </button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
} 
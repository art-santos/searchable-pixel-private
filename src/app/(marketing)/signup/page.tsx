'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { SignupForm } from '@/components/auth/signup-form'

export default function SignupPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [lockedEmail, setLockedEmail] = useState<string>('')

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  // Load email from onboarding data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const onboardingData = localStorage.getItem('onboardingData')
      if (onboardingData) {
        const data = JSON.parse(onboardingData)
        setLockedEmail(data.email || '')
      } else {
        // Redirect to start if no onboarding data
        router.push('/start')
      }
    }
  }, [router])

  const handleSignupSuccess = () => {
    // Don't clear onboarding data yet - score page needs it
    // Data will be cleared after score is shown
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0c0c0c]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-white" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <SignupForm 
            lockedEmail={lockedEmail}
            onSignupSuccess={handleSignupSuccess}
          />
        </div>
      </main>
    </div>
  )
} 
'use client'

import { useEffect } from 'react'
import { redirect } from 'next/navigation'
import { SignupForm } from '@/components/auth/signup-form'

export default function SignupPage() {
  useEffect(() => {
    // Only redirect to waitlist if it's enabled
    const waitlistEnabled = process.env.NEXT_PUBLIC_WAITLIST_ENABLED === 'true'
    if (waitlistEnabled) {
      redirect('/waitlist')
    }
  }, [])

  // If waitlist is disabled, show the signup form
  const waitlistEnabled = process.env.NEXT_PUBLIC_WAITLIST_ENABLED === 'true'
  
  if (waitlistEnabled) {
    // Show loading while redirecting
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-primary mx-auto" />
          <p className="mt-4 text-gray-400">Redirecting to waitlist...</p>
        </div>
      </div>
    )
  }

  // Render the actual signup form when waitlist is disabled
  return (
    <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center px-4">
      <SignupForm />
    </div>
  )
} 
'use client'

import { useEffect } from 'react'
import { redirect } from 'next/navigation'

export default function SignupPage() {
  useEffect(() => {
    // Redirect to waitlist
    redirect('/waitlist')
  }, [])

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
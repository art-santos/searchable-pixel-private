'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // If user is authenticated, redirect to dashboard
        router.push('/dashboard')
      } else {
        // If user is not authenticated, redirect to landing page
        router.push('/landing-page')
      }
    }
  }, [user, loading, router])

  // Show loading spinner while determining where to redirect
  return (
    <div className="flex h-screen items-center justify-center bg-[#0c0c0c]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-white" />
    </div>
  )
} 
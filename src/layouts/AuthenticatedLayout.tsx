'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  
  const [onboardingStatus, setOnboardingStatus] = useState<'loading' | 'complete' | 'incomplete'>('loading')

  useEffect(() => {
    // 1. Wait for auth to finish loading
    if (authLoading || !supabase) {
      return
    }

    // 2. If no user, redirect to login (unless on public marketing pages)
    if (!user) {
      if (pathname !== '/login' && pathname !== '/signup') {
        router.push('/login')
      }
      return
    }

    // 3. If user is present, check their onboarding status from the database
    const checkOnboarding = async () => {
      console.log('🛡️ AuthenticatedLayout: Checking onboarding status for user', user.id)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error fetching profile for onboarding check:', error)
        // Let user proceed but log error. Maybe show a toast later.
        setOnboardingStatus('complete')
        return
      }
      
      // PGRST116 means no profile row found, which means onboarding is incomplete.
      // Also check if the onboarding_completed flag is false.
      if (!data || data.onboarding_completed === false) {
        console.log('ℹ️ Onboarding incomplete. Profile data:', data)
        setOnboardingStatus('incomplete')
      } else {
        console.log('✅ Onboarding complete.')
        setOnboardingStatus('complete')
      }
    }

    checkOnboarding()

  }, [user, authLoading, supabase, router, pathname])

  useEffect(() => {
    if (onboardingStatus === 'loading') {
      return
    }

    // --- Onboarding Redirection Logic ---
    const isAtCreateWorkspace = pathname === '/create-workspace'

    // If onboarding is incomplete, they MUST be at the create-workspace page.
    if (onboardingStatus === 'incomplete' && !isAtCreateWorkspace) {
      console.log('Redirecting to /create-workspace, onboarding is incomplete.')
      router.push('/create-workspace')
    }

    // If onboarding IS complete, they MUST NOT be at the create-workspace page.
    if (onboardingStatus === 'complete' && isAtCreateWorkspace) {
      console.log('Redirecting to /dashboard, onboarding is already complete.')
      router.push('/dashboard')
    }
  }, [onboardingStatus, pathname, router])
  
  // Show a loading screen while we verify auth and onboarding status
  if (authLoading || onboardingStatus === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0c0c0c]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-white" />
      </div>
    )
  }
  
  // If the user is unauthenticated or their onboarding status is incomplete and they're not on the create workspace page
  // return null to avoid flashing content before redirect.
  if (!user || (onboardingStatus === 'incomplete' && pathname !== '/create-workspace')) {
    return null
  }

  // If onboarding is complete but they are on the create-workspace page, return null
  if (onboardingStatus === 'complete' && pathname === '/create-workspace') {
    return null
  }
  
  return (
    <div className="h-screen bg-[#0c0c0c] flex">
        {children}
    </div>
  )
} 
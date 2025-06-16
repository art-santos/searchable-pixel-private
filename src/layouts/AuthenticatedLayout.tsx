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
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'required' | 'verified'>('loading')

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

    const checkOnboarding = async () => {
      try {
        // Get user profile to check onboarding status
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('onboarding_completed, is_admin')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('❌ Error fetching profile:', profileError)
          setOnboardingStatus('incomplete')
          return
        }

        const profileSaysComplete = profile?.onboarding_completed
        const isAdminUser = profile?.is_admin

        // Get user's workspaces to double-check onboarding status
        const { data: workspaces, error: workspaceError } = await supabase
          .from('workspaces')
          .select('id')
          .eq('user_id', user.id)

        if (workspaceError) {
          console.error('❌ Error fetching workspaces:', workspaceError)
          setOnboardingStatus('incomplete')
          return
        }

        const hasWorkspaces = workspaces && workspaces.length > 0

        // Determine onboarding status
        if (hasWorkspaces) {
          console.log('✅ User has workspaces - onboarding complete')
          
          // If profile flag is wrong, fix it in the background
          if (!profileSaysComplete) {
            console.log('🔧 Fixing inconsistent onboarding_completed flag...')
            supabase
              .from('profiles')
              .update({
                onboarding_completed: true,
                onboarding_completed_at: new Date().toISOString()
              })
              .eq('id', user.id)
              .then(({ error }) => {
                if (error) {
                  console.error('❌ Failed to fix onboarding flag:', error)
                } else {
                  console.log('✅ Fixed onboarding_completed flag')
                }
              })
          }
          
          setOnboardingStatus('complete')

          // Now check payment method status (only for non-admin users)
          if (!isAdminUser) {
            checkPaymentMethodStatus()
          } else {
            setPaymentStatus('verified') // Admins don't need payment methods
          }
        } else if (profileSaysComplete) {
          // Profile says complete but no workspaces - this is inconsistent
          // but let them proceed (maybe workspaces were deleted)
          console.log('⚠️ Profile says onboarding complete but no workspaces found')
          setOnboardingStatus('complete')
          
          if (!isAdminUser) {
            checkPaymentMethodStatus()
          } else {
            setPaymentStatus('verified')
          }
        } else {
          // No workspaces and profile says incomplete
          console.log('ℹ️ Onboarding incomplete - no workspaces found')
          setOnboardingStatus('incomplete')
          setPaymentStatus('verified') // Skip payment check if onboarding incomplete
        }

      } catch (error) {
        console.error('❌ Unexpected error checking onboarding status:', error)
        // Default to incomplete on error to be safe
        setOnboardingStatus('incomplete')
        setPaymentStatus('verified') // Skip payment check on error
      }
    }

    const checkPaymentMethodStatus = async () => {
      try {
        const response = await fetch('/api/payment-method/verify')
        if (response.ok) {
          const data = await response.json()
          if (data.verified || data.isAdmin || !data.requiresPaymentMethod) {
            setPaymentStatus('verified')
          } else {
            setPaymentStatus('required')
          }
        } else {
          // If API call fails, require payment method to be safe
          setPaymentStatus('required')
        }
      } catch (error) {
        console.error('❌ Error checking payment method status:', error)
        setPaymentStatus('required')
      }
    }

    checkOnboarding()

  }, [user, authLoading, supabase, router, pathname])

  useEffect(() => {
    if (onboardingStatus === 'loading' || paymentStatus === 'loading') {
      return
    }

    // --- Routing Logic ---
    const isAtCreateWorkspace = pathname === '/create-workspace'
    const isAtPaymentRequired = pathname === '/payment-required'
    const isAdminEmail = user?.email?.endsWith('@split.dev')
    const isAtAdminVerify = pathname === '/admin/verify'
    const isAtAdminDashboard = pathname.startsWith('/admin/dashboard')

    // If user has @split.dev email, handle admin flow
    if (isAdminEmail) {
      // If not at admin verify or admin dashboard, redirect to admin verify
      if (!isAtAdminVerify && !isAtAdminDashboard) {
        console.log('📍 Redirecting admin user to /admin/verify')
        router.push('/admin/verify')
        return
      }
    } else {
      // Regular user flow
      
      // 1. If onboarding is incomplete, they MUST be at the create-workspace page
      if (onboardingStatus === 'incomplete' && !isAtCreateWorkspace) {
        console.log('📍 Redirecting to /create-workspace - onboarding incomplete')
        router.push('/create-workspace')
        return
      }

      // 2. If onboarding IS complete but they're at create-workspace, redirect them
      if (onboardingStatus === 'complete' && isAtCreateWorkspace) {
        console.log('📍 Redirecting from /create-workspace - onboarding already complete')
        if (paymentStatus === 'required') {
          router.push('/payment-required')
        } else {
          router.push('/dashboard')
        }
        return
      }

      // 3. If payment method is required and they're not at the payment page, redirect them
      if (paymentStatus === 'required' && !isAtPaymentRequired) {
        console.log('📍 Redirecting to /payment-required - payment method required')
        router.push('/payment-required')
        return
      }

      // 4. If payment method is verified but they're at the payment page, redirect to dashboard
      if (paymentStatus === 'verified' && isAtPaymentRequired) {
        console.log('📍 Redirecting to /dashboard - payment method verified')
        router.push('/dashboard')
        return
      }
    }
  }, [onboardingStatus, paymentStatus, pathname, router, user])
  
  // Show a loading screen while we verify auth, onboarding, and payment status
  if (authLoading || onboardingStatus === 'loading' || paymentStatus === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0c0c0c]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-white" />
      </div>
    )
  }
  
  // If the user is unauthenticated, return null
  if (!user) {
    return null
  }

  return <>{children}</>
} 
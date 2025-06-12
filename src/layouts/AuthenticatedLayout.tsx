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

    // 3. Check onboarding status comprehensively
    const checkOnboarding = async () => {
      console.log('🛡️ AuthenticatedLayout: Checking onboarding status for user', user.id)
      
      try {
        // First, check if user has any workspaces (primary indicator)
        const { data: workspaces, error: workspaceError } = await supabase
          .from('workspaces')
          .select('id, is_primary')
          .eq('user_id', user.id)
          .limit(1)

        if (workspaceError) {
          console.error('❌ Error checking workspaces:', workspaceError)
        }

        // Also check the profile flag
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('❌ Error fetching profile for onboarding check:', profileError)
        }

        // Determine onboarding status with multiple checks
        const hasWorkspaces = workspaces && workspaces.length > 0
        const profileSaysComplete = profile && profile.onboarding_completed === true
        
        console.log('📊 Onboarding status check:', {
          hasWorkspaces,
          profileSaysComplete,
          workspaceCount: workspaces?.length || 0,
          profileData: profile
        })

        // If user has workspaces, they should be considered onboarded
        // regardless of the profile flag (handles inconsistent states)
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
        } else if (profileSaysComplete) {
          // Profile says complete but no workspaces - this is inconsistent
          // but let them proceed (maybe workspaces were deleted)
          console.log('⚠️ Profile says onboarding complete but no workspaces found')
          setOnboardingStatus('complete')
        } else {
          // No workspaces and profile says incomplete
          console.log('ℹ️ Onboarding incomplete - no workspaces found')
          setOnboardingStatus('incomplete')
        }

      } catch (error) {
        console.error('❌ Unexpected error checking onboarding status:', error)
        // Default to incomplete on error to be safe
        setOnboardingStatus('incomplete')
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
      // Regular user flow - If onboarding is incomplete, they MUST be at the create-workspace page.
      if (onboardingStatus === 'incomplete' && !isAtCreateWorkspace) {
        console.log('📍 Redirecting to /create-workspace - onboarding incomplete')
        router.push('/create-workspace')
      }
    }

    // If onboarding IS complete, they MUST NOT be at the create-workspace page.
    if (onboardingStatus === 'complete' && isAtCreateWorkspace) {
      if (isAdminEmail) {
        console.log('📍 Redirecting admin user to /admin/verify - should not be at create-workspace')
        router.push('/admin/verify')
      } else {
        console.log('📍 Redirecting to /dashboard - onboarding already complete')
        router.push('/dashboard')
      }
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
  
  // If the user is unauthenticated, return null
  if (!user) {
    return null
  }

  // Check if user is admin
  const isAdminEmail = user?.email?.endsWith('@split.dev')
  const isAtAdminVerify = pathname === '/admin/verify'
  const isAtAdminDashboard = pathname.startsWith('/admin/dashboard')

  // Admin user logic
  if (isAdminEmail) {
    // Admin users should only see content if they're at admin verify or admin dashboard
    if (!isAtAdminVerify && !isAtAdminDashboard) {
      return null // Will redirect in useEffect
    }
  } else {
    // Regular user logic
    // If their onboarding status is incomplete and they're not on the create workspace page, return null
    if (onboardingStatus === 'incomplete' && pathname !== '/create-workspace') {
      return null
    }

    // If onboarding is complete but they are on the create-workspace page, return null
    if (onboardingStatus === 'complete' && pathname === '/create-workspace') {
      return null
    }
  }
  
  return (
    <div className="h-screen bg-[#0c0c0c] flex">
        {children}
    </div>
  )
} 
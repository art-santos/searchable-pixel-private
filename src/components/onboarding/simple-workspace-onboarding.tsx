'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { saveOnboardingData } from '@/lib/onboarding/database'
import { 
  ArrowRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SimpleWorkspaceOnboardingProps {
  children: React.ReactNode
  onComplete?: () => void
}

export function SimpleWorkspaceOnboarding({ children, onComplete }: SimpleWorkspaceOnboardingProps) {
  const { user } = useAuth()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Workspace form data
  const [workspaceData, setWorkspaceData] = useState({
    name: '',
    workspaceName: '',
    domain: ''
  })

  const supabase = createClient()

  // Clean up any complex onboarding state that might interfere
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Clear any existing complex onboarding data
      localStorage.removeItem('onboardingData')
      sessionStorage.removeItem('onboardingInProgress')
      sessionStorage.removeItem('justSignedUp')
      sessionStorage.removeItem('fromOnboarding')
      
      // Clear any verification cookies
      if (document.cookie.includes('justVerified=true')) {
        document.cookie = 'justVerified=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      }
    }
  }, [])

  // Check if user needs onboarding (first time + missing name/workspace)
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user || !supabase) {
        setCheckingStatus(false)
        return
      }

      try {
        // Check both profile and company existence
        const [profileResult, companyResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('first_name, workspace_name, domain')
            .eq('id', user.id)
            .single(),
          supabase
            .from('companies')
            .select('id, company_name, root_url')
            .eq('submitted_by', user.id)
            .single()
        ])

        const { data: profile, error: profileError } = profileResult
        const { data: company, error: companyError } = companyResult

        console.log('Onboarding status check:', {
          profile: profile,
          company: company,
          profileError: profileError?.code,
          companyError: companyError?.code
        })

        // Only show onboarding if user is missing name OR workspace name OR company
        const hasName = profile?.first_name?.trim()
        const hasWorkspaceName = profile?.workspace_name?.trim()
        const hasCompany = company?.id
        const shouldShowOnboarding = !hasName || !hasWorkspaceName || !hasCompany

        setShowOnboarding(shouldShowOnboarding)

        // Pre-populate form if we have existing data
        if (profile) {
          setWorkspaceData({
            name: profile.first_name || '',
            workspaceName: profile.workspace_name || '',
            domain: profile.domain || (company?.root_url ? new URL(company.root_url).hostname : '')
          })
        }
      } catch (err) {
        console.error('Error in onboarding check:', err)
      } finally {
        setCheckingStatus(false)
      }
    }

    checkOnboardingStatus()
  }, [user, supabase])

  const handleComplete = async () => {
    if (!user || !supabase) return

    console.log('🚀 ONBOARDING DEBUG: Starting workspace onboarding completion...')
    console.log('👤 User:', { id: user.id, email: user.email })
    console.log('📝 Workspace data:', workspaceData)

    // Validate required fields
    if (!workspaceData.name.trim() || !workspaceData.workspaceName.trim() || !workspaceData.domain.trim()) {
      console.error('❌ ONBOARDING DEBUG: Missing required fields')
      setErrorMessage('Please fill in all required fields.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      console.log('💾 ONBOARDING DEBUG: About to call saveOnboardingData...')
      console.log('📋 ONBOARDING DEBUG: Payload:', {
        userName: workspaceData.name,
        workspaceName: workspaceData.workspaceName,
        userEmail: user.email || '',
        domain: workspaceData.domain, // Use the actual domain entered by user
        isAnalyticsConnected: false,
        keywords: [],
        businessOffering: '',
        knownFor: '',
        competitors: []
      })

      // Use the proper onboarding data save function
      const result = await saveOnboardingData(user, {
        userName: workspaceData.name,
        workspaceName: workspaceData.workspaceName,
        userEmail: user.email || '',
        domain: workspaceData.domain,
        isAnalyticsConnected: false,
        keywords: [],
        businessOffering: '',
        knownFor: '',
        competitors: []
      })

      console.log('📋 ONBOARDING DEBUG: saveOnboardingData result:', result)

      if (!result.success) {
        console.error('❌ ONBOARDING DEBUG: Failed to save onboarding data:', result.error)
        console.error('🔍 ONBOARDING DEBUG: Full result object:', result)
        setErrorMessage(result.error || 'Failed to save workspace information.')
        return
      }

      console.log('✅ ONBOARDING DEBUG: Onboarding completed successfully:', result)
      
      // Hide onboarding and call completion callback
      setShowOnboarding(false)
      onComplete?.()
    } catch (err) {
      console.error('❌ ONBOARDING DEBUG: Unexpected error completing onboarding:', err)
      console.error('🔍 ONBOARDING DEBUG: Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        name: err instanceof Error ? err.name : undefined
      })
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save workspace information.')
    } finally {
      setIsLoading(false)
      console.log('🏁 ONBOARDING DEBUG: Process completed, loading set to false')
    }
  }

  const handleSkip = () => {
    setShowOnboarding(false)
  }

  const canProceed = () => {
    return workspaceData.name.trim() && 
           workspaceData.workspaceName.trim() && 
           workspaceData.domain.trim()
  }

  // Show loading state while checking status
  if (checkingStatus) {
    return <>{children}</>
  }

  // Don't show onboarding if not needed
  if (!showOnboarding) {
    return <>{children}</>
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Dashboard Content (blurred background) */}
      <div className="absolute inset-0">
        {children}
      </div>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/95 backdrop-blur-sm z-40" />

      {/* Onboarding Modal */}
      <div className="relative z-50 flex items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-xl font-medium text-white mb-2">
              Create workspace
            </h1>
            <p className="text-sm text-[#666]">
              Set up your account to get started
            </p>
          </div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-lg p-6"
        >
            <div className="space-y-4">
              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 rounded flex items-start gap-2 text-sm bg-red-500/10 border border-red-500/20 text-red-400"
                  >
                    {errorMessage}
                  </motion.div>
                )}
              </AnimatePresence>
              <div>
                <label className="block text-xs text-[#888] mb-2">
                  Your name
                </label>
                <Input
                  value={workspaceData.name}
                  onChange={(e) => setWorkspaceData(prev => ({ 
                    ...prev, 
                    name: e.target.value 
                  }))}
                  placeholder="John Doe"
                  className="bg-[#1a1a1a] border-[#333] text-white h-10 focus:border-[#444] transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-xs text-[#888] mb-2">
                  Workspace name
                </label>
                <Input
                  value={workspaceData.workspaceName}
                  onChange={(e) => setWorkspaceData(prev => ({ 
                    ...prev, 
                    workspaceName: e.target.value 
                  }))}
                  placeholder="My Company"
                  className="bg-[#1a1a1a] border-[#333] text-white h-10 focus:border-[#444] transition-colors"
                />
                <p className="text-xs text-[#666] mt-1">
                  This will be the name of your workspace
                </p>
              </div>

              <div>
                <label className="block text-xs text-[#888] mb-2">
                  Primary website domain
                </label>
                <Input
                  value={workspaceData.domain}
                  onChange={(e) => setWorkspaceData(prev => ({ 
                    ...prev, 
                    domain: e.target.value 
                  }))}
                  placeholder="yourcompany.com"
                  className="bg-[#1a1a1a] border-[#333] text-white h-10 focus:border-[#444] transition-colors"
                />
                <p className="text-xs text-[#666] mt-1">
                  Enter your main website domain (this will appear in your settings)
                </p>
              </div>
            </div>

            <Button
              onClick={handleComplete}
              disabled={!canProceed() || isLoading}
              className="w-full mt-6 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] hover:border-[#444] text-white h-10 text-sm font-medium transition-all duration-200"
            >
              {isLoading ? (
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
              ) : (
                <>
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </motion.div>

          {/* Skip Option */}
          <div className="text-center mt-4">
            <button
              onClick={handleSkip}
              className="text-xs text-[#666] hover:text-[#888] transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 
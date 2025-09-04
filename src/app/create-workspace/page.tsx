'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { saveOnboardingData } from '@/lib/onboarding/database'
import { isValidDomain, cleanDomain } from '@/lib/utils/domain'
import { ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

export default function CreateWorkspacePage() {
  const { user } = useAuth()
  const { refreshWorkspaces } = useWorkspace()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Check if user has @split.dev email and redirect to admin verification
  if (user?.email?.endsWith('@split.dev')) {
    router.push('/admin/verify')
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
        <div className="text-white">Redirecting to admin verification...</div>
      </div>
    )
  }
  
  // Workspace form data
  const [workspaceData, setWorkspaceData] = useState({
    name: '',
    workspaceName: '',
    domain: ''
  })

  const supabase = createClient()

  const handleComplete = async () => {
    if (!user || !supabase) return

    console.log('🚀 WORKSPACE CREATION: Starting...')
    console.log('👤 User:', { id: user.id, email: user.email })
    console.log('📝 Workspace data:', workspaceData)

    const cleanedDomain = cleanDomain(workspaceData.domain)

    // Validate required fields
    if (!workspaceData.name.trim() || !workspaceData.workspaceName.trim() || !cleanedDomain) {
      console.error('❌ WORKSPACE CREATION: Missing required fields')
      setErrorMessage('Please fill in all required fields.')
      return
    }

    if (!isValidDomain(cleanedDomain)) {
      console.error('❌ WORKSPACE CREATION: Invalid domain format')
      setErrorMessage('Please enter a valid domain (e.g. example.com).')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const onboardingPayload: import('@/lib/onboarding/database').OnboardingData = {
        userEmail: user.email || '',
        userName: workspaceData.name,
        workspaceName: workspaceData.workspaceName,
        domain: cleanedDomain,
        profileData: {
          first_name: workspaceData.name
        },
      }

      console.log('💾 WORKSPACE CREATION: About to call saveOnboardingData...')
      console.log('📋 WORKSPACE CREATION: Payload:', onboardingPayload)

      // Save data and wait for completion
      const result = await saveOnboardingData(user, onboardingPayload)
      console.log('📋 WORKSPACE CREATION: saveOnboardingData result:', result)
      
      if (!result.success) {
        console.error('❌ WORKSPACE CREATION: Failed to save:', result.error)
        setErrorMessage(result.error || 'Failed to save workspace information. Please try again.')
        setIsLoading(false)
        return
      }

      console.log('✅ WORKSPACE CREATION: Data saved successfully!')

      // Send welcome email now that workspace is set up (non-blocking)
      try {
        const welcomeResponse = await fetch('/api/emails/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            name: workspaceData.name,
            workspaceName: workspaceData.workspaceName,
            domain: cleanedDomain
          })
        })
        
        if (welcomeResponse.ok) {
          console.log('📧 WORKSPACE CREATION: Welcome email sent successfully')
        } else {
          console.error('📧 WORKSPACE CREATION: Failed to send welcome email:', await welcomeResponse.text())
        }
      } catch (emailError) {
        console.error('📧 WORKSPACE CREATION: Welcome email error:', emailError)
        // Don't block workspace creation for email errors
      }

      // Ensure onboarding completion flag is set (backup check)
      try {
        console.log('🔧 WORKSPACE CREATION: Ensuring onboarding completion...')
        const { error: completionError } = await supabase
          .from('profiles')
          .update({
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString()
          })
          .eq('id', user.id)

        if (completionError) {
          console.error('❌ Error updating onboarding flag:', completionError)
          setErrorMessage('Workspace created but onboarding could not be finalized. Please try again.')
          setIsLoading(false)
          return
        } else {
          console.log('✅ Onboarding completion flag updated')
        }
      } catch (flagError) {
        console.error('❌ Error updating onboarding flag:', flagError)
        setErrorMessage('Workspace created but onboarding could not be finalized. Please try again.')
        setIsLoading(false)
        return
      }

      // Refresh workspace context to get the new workspace
      console.log('🔄 WORKSPACE CREATION: Refreshing workspaces...')
      try {
        await refreshWorkspaces()
        console.log('✅ Workspaces refreshed successfully')
      } catch (refreshError) {
        console.error('❌ Warning: Failed to refresh workspaces:', refreshError)
        // Don't fail for this - continue with redirect
      }

      // Small delay to ensure all database operations complete
      console.log('⏳ WORKSPACE CREATION: Allowing time for database sync...')
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Check if user is admin (admins skip payment requirement)
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      const isAdmin = profile?.is_admin || false

      // Redirect based on admin status
      if (isAdmin) {
        console.log('📍 WORKSPACE CREATION: Admin user - redirecting to dashboard...')
        router.push('/dashboard')
      } else {
        console.log('📍 WORKSPACE CREATION: Regular user - redirecting to payment setup...')
        router.push('/payment-required')
      }

    } catch (error) {
      console.error('❌ WORKSPACE CREATION: Unexpected error:', error)
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const canProceed = () => {
    const cleanedDomain = cleanDomain(workspaceData.domain)
    return (
      workspaceData.name.trim() &&
      workspaceData.workspaceName.trim() &&
      cleanedDomain.trim() &&
      isValidDomain(cleanedDomain)
    )
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] grid lg:grid-cols-2">
      {/* Left side - Form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <Image src="/images/split-icon-white.svg" width={32} height={32} alt="Split Logo" />
              <h1 className="text-2xl font-bold text-white">Create Workspace</h1>
            </div>
            
            <div className="space-y-6">
              <div>
                <p className="text-gray-400 mb-6">
                  Set up your workspace to get started with Split.
                </p>
              </div>

              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
                >
                  <p className="text-red-400 text-sm">{errorMessage}</p>
                </motion.div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Your Name
                  </label>
                  <Input
                    value={workspaceData.name}
                    onChange={(e) => setWorkspaceData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Doe"
                    className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-gray-500"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Workspace Name
                  </label>
                  <Input
                    value={workspaceData.workspaceName}
                    onChange={(e) => setWorkspaceData(prev => ({ ...prev, workspaceName: e.target.value }))}
                    placeholder="My Company"
                    className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-gray-500"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Website Domain
                  </label>
                  <Input
                    value={workspaceData.domain}
                    onChange={(e) => setWorkspaceData(prev => ({ ...prev, domain: e.target.value }))}
                    onBlur={() => setWorkspaceData(prev => ({ ...prev, domain: cleanDomain(prev.domain) }))}
                    placeholder="example.com"
                    className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-gray-500"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                onClick={handleComplete}
                disabled={!canProceed() || isLoading}
                className="w-full bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : 'Create Workspace'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <p className="text-center text-xs text-gray-500">
                By continuing, you agree to our{' '}
                <Link href="/terms" className="underline hover:text-white">
                  Terms of Service
                </Link>
                .
              </p>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Right side - Visual/Branding */}
      
    </div>
  )
} 
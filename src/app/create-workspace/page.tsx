'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { saveOnboardingData } from '@/lib/onboarding/database'
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

    // Validate required fields
    if (!workspaceData.name.trim() || !workspaceData.workspaceName.trim() || !workspaceData.domain.trim()) {
      console.error('❌ WORKSPACE CREATION: Missing required fields')
      setErrorMessage('Please fill in all required fields.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const onboardingPayload: import('@/lib/onboarding/database').OnboardingData = {
        userEmail: user.email || '',
        userName: workspaceData.name,
        workspaceName: workspaceData.workspaceName,
        domain: workspaceData.domain,
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
          console.error('⚠️ Warning: Could not update onboarding flag:', completionError)
          // Don't fail for this - the workspace creation succeeded
        } else {
          console.log('✅ Onboarding completion flag updated')
        }
      } catch (flagError) {
        console.error('⚠️ Warning: Error updating onboarding flag:', flagError)
        // Don't fail for this
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

      // Now redirect to dashboard
      console.log('📍 WORKSPACE CREATION: Redirecting to dashboard...')
      router.push('/dashboard')

    } catch (error) {
      console.error('❌ WORKSPACE CREATION: Unexpected error:', error)
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const canProceed = () => {
    return workspaceData.name.trim() && 
           workspaceData.workspaceName.trim() && 
           workspaceData.domain.trim()
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
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
                    placeholder="example.com"
                    className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-gray-500"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter your domain without http:// or https://
                  </p>
                </div>
              </div>

              <Button
                onClick={handleComplete}
                disabled={!canProceed() || isLoading}
                className="w-full bg-white hover:bg-gray-100 text-black font-medium h-12"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creating workspace...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Create Workspace
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>

              <div className="text-center pt-4">
                <Link 
                  href="/dashboard" 
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Back to dashboard
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex flex-1 bg-[#1a1a1a] items-center justify-center p-8">
        <div className="text-center">
          <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ArrowRight className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Almost there!</h2>
          <p className="text-gray-400 max-w-sm">
            Just a few details and you'll be ready to optimize your site's AI visibility.
          </p>
        </div>
      </div>
    </div>
  )
} 
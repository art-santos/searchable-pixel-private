'use client'

import { useState, useEffect } from 'react'
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

  // Redirect if user already has workspace or not authenticated
  useEffect(() => {
    const checkWorkspaceStatus = async () => {
      if (!user || !supabase) {
        router.push('/login')
        return
      }

      try {
        // Check if user already has workspace data
        const [profileResult, companyResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('first_name, workspace_name')
            .eq('id', user.id)
            .single(),
          supabase
            .from('companies')
            .select('id, company_name, root_url')
            .eq('submitted_by', user.id)
            .single()
        ])

        const { data: profile } = profileResult
        const { data: company } = companyResult

        // If user already has complete workspace data, redirect to dashboard
        const hasName = profile?.first_name?.trim()
        const hasWorkspaceName = profile?.workspace_name?.trim()
        const hasCompany = company?.id

        if (hasName && hasWorkspaceName && hasCompany) {
          console.log('User already has workspace, redirecting to dashboard')
          router.push('/dashboard')
          return
        }

        // Pre-populate form if we have existing data
        if (profile) {
          setWorkspaceData({
            name: profile.first_name || '',
            workspaceName: profile.workspace_name || '',
            domain: company?.root_url ? new URL(company.root_url).hostname : ''
          })
        }
      } catch (err) {
        console.error('Error checking workspace status:', err)
      }
    }

    checkWorkspaceStatus()
  }, [user, supabase, router])

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

      const result = await saveOnboardingData(user, onboardingPayload)

      console.log('📋 WORKSPACE CREATION: saveOnboardingData result:', result)

      if (!result.success) {
        console.error('❌ WORKSPACE CREATION: Failed to save:', result.error)
        setErrorMessage(result.error || 'Failed to save workspace information.')
        return
      }

      console.log('✅ WORKSPACE CREATION: Success! Refreshing workspace context...')
      
      // Refresh the workspace context to pick up the new workspace
      await refreshWorkspaces()
      
      console.log('✅ WORKSPACE CREATION: Context refreshed, redirecting to dashboard...')
      
      // Small delay to ensure UI updates, then redirect
      setTimeout(() => {
        router.push('/dashboard')
      }, 300)
    } catch (err) {
      console.error('❌ WORKSPACE CREATION: Unexpected error:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save workspace information.')
    } finally {
      setIsLoading(false)
    }
  }

  const canProceed = () => {
    return workspaceData.name.trim() && 
           workspaceData.workspaceName.trim() && 
           workspaceData.domain.trim()
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-medium mb-6">
            <Image src="/images/split-icon-white.svg" width={32} height={32} alt="Split Logo" />
            <span className="text-white text-lg">Split</span>
          </Link>
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

          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleComplete}
              className="w-full bg-white text-black text-sm h-9"
              disabled={isLoading || !canProceed()}
            >
              {isLoading ? 'Creating...' : 'Continue'}
              {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 
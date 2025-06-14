'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { saveOnboardingData } from '@/lib/onboarding/database'
import { isValidDomain } from '@/lib/utils/domain'
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

    if (!isValidDomain(workspaceData.domain)) {
      console.error('❌ ONBOARDING DEBUG: Invalid domain format')
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
        domain: workspaceData.domain,
        profileData: {
          first_name: workspaceData.name
        },
      }

      console.log('💾 ONBOARDING DEBUG: About to call saveOnboardingData...')
      console.log('📋 ONBOARDING DEBUG: Payload:', onboardingPayload)

      // Hide onboarding immediately and call completion callback
      setShowOnboarding(false)
      onComplete?.()

      // Continue saving data in the background
      saveOnboardingData(user, onboardingPayload).then(result => {
        console.log('📋 ONBOARDING DEBUG: saveOnboardingData result:', result)

        if (!result.success) {
          console.error('❌ ONBOARDING DEBUG: Failed to save onboarding data:', result.error)
          console.error('🔍 ONBOARDING DEBUG: Full result object:', result)
          // Note: User has moved on, so we handle this gracefully in background
        } else {
          console.log('✅ ONBOARDING DEBUG: Onboarding completed successfully:', result)
        }
      }).catch(err => {
        console.error('❌ ONBOARDING DEBUG: Unexpected error completing onboarding:', err)
        console.error('🔍 ONBOARDING DEBUG: Error details:', {
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined,
          name: err instanceof Error ? err.name : undefined
        })
        // Handle error gracefully in background
      }).finally(() => {
        setIsLoading(false)
        console.log('🏁 ONBOARDING DEBUG: Process completed, loading set to false')
      })

    } catch (err) {
      console.error('❌ ONBOARDING DEBUG: Unexpected error in try block:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save workspace information.')
      setIsLoading(false)
    }
  }

  const canProceed = () => {
    return (
      workspaceData.name.trim() &&
      workspaceData.workspaceName.trim() &&
      workspaceData.domain.trim() &&
      isValidDomain(workspaceData.domain)
    )
  }
  
  return <>{children}</>
} 
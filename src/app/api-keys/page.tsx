'use client'

import { useState, useEffect } from 'react'
import AgentCredentialsManager from '@/components/dashboard/AgentCredentialsManager'
import WebsiteConnector from '@/components/website-connector'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function ApiKeysPage() {
  const { user } = useAuth()
  const [hasCredentials, setHasCredentials] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showConnector, setShowConnector] = useState(false)
  
  const checkCredentials = async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('agent_credentials')
        .select('id')
        .eq('is_active', true)
        .limit(1)
      
      if (error) {
        console.error('Error checking credentials:', error)
        return
      }
      
      const hasActiveCredentials = data && data.length > 0
      setHasCredentials(hasActiveCredentials)
      
      // If no credentials, automatically show connector
      setShowConnector(!hasActiveCredentials)
    } catch (error) {
      console.error('Failed to check credentials:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    if (user) {
      checkCredentials()
    }
  }, [user])
  
  // Listen for credential deletion events
  useEffect(() => {
    const handleCredentialChange = () => {
      checkCredentials()
    }
    
    window.addEventListener('credential-deleted', handleCredentialChange)
    
    return () => {
      window.removeEventListener('credential-deleted', handleCredentialChange)
    }
  }, [])
  
  if (isLoading) {
    return (
      <div className="container py-6 max-w-5xl">
        <div className="flex h-full items-center justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-white" />
        </div>
      </div>
    )
  }
  
  return (
    <div className="container py-6 max-w-5xl">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              {showConnector ? 'Connect Your Site' : 'API Keys'}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {showConnector 
                ? 'Set up the connection between your website and Split' 
                : 'Manage your API credentials for connecting your sites to Split.'
              }
            </p>
          </div>
          
          {/* Only show button to toggle views if user has credentials */}
          {hasCredentials && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowConnector(!showConnector)}
              className="border-[#333333] hover:bg-[#222222]"
            >
              {showConnector ? (
                <>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to API Keys
                </>
              ) : (
                'Connect New Site'
              )}
            </Button>
          )}
        </div>
        
        {showConnector ? (
          <WebsiteConnector onComplete={checkCredentials} />
        ) : (
          <AgentCredentialsManager onCredentialDeleted={checkCredentials} />
        )}
      </div>
    </div>
  )
} 
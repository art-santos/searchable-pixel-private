'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LogOut, Loader2, User, Building, Shield, Calendar } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AvatarUpload } from '@/components/profile/avatar-upload'

interface UserProfile {
  first_name?: string | null
  workspace_name?: string | null
  profile_picture_url?: string | null
}

interface SubscriptionData {
  subscriptionPlan: string | null
  subscriptionStatus: string
  stripeCustomerId: string | null
}

interface GeneralSettingsProps {
  usageData: any
  onRefreshUsage: () => Promise<void>
}

export function GeneralSettings({ usageData, onRefreshUsage }: GeneralSettingsProps) {
  const { user } = useAuth()
  const { currentWorkspace } = useWorkspace()
  const router = useRouter()
  const [generalTab, setGeneralTab] = useState<'profile' | 'workspace'>('profile')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [originalProfile, setOriginalProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [workspaceSettings, setWorkspaceSettings] = useState({
    name: '',
    domain: '',
    email: ''
  })
  const [originalWorkspaceSettings, setOriginalWorkspaceSettings] = useState({
    name: '',
    domain: '',
    email: ''
  })
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Additional state for domain change restrictions
  const [domainChangeInfo, setDomainChangeInfo] = useState<{
    canChange: boolean
    daysRemaining: number
    lastChange: string | null
  } | null>(null)
  const [domainChangeLoading, setDomainChangeLoading] = useState(false)

  const supabase = createClient()

  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    if (!profile || !originalProfile) return false
    
    const profileChanged = 
      profile.first_name !== originalProfile.first_name ||
      profile.profile_picture_url !== originalProfile.profile_picture_url
    
    const workspaceChanged = 
      workspaceSettings.name !== originalWorkspaceSettings.name ||
      workspaceSettings.domain !== originalWorkspaceSettings.domain
    
    return profileChanged || workspaceChanged
  }

  // Fetch user profile data - using same method as dashboard WelcomeCard
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user || !supabase) {
        setProfileLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, workspace_name, profile_picture_url')
          .eq('id', user.id)
          .single()

        console.log('🔍 Profile fetch result:', { data, error, userId: user.id })

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error)
        }

        // Use exact same approach as dashboard WelcomeCard
        setProfile(data || null)
        setOriginalProfile(data || null)
      } catch (err) {
        console.error('Error in profile fetch:', err)
        setProfile(null)
        setOriginalProfile(null)
      } finally {
        setProfileLoading(false)
      }
    }

    fetchProfile()
  }, [user, supabase])

  // Fetch subscription data
  useEffect(() => {
    const fetchSubscription = async () => {
      setSubscriptionLoading(true)
      try {
        const response = await fetch('/api/user/subscription')
        if (response.ok) {
          const data = await response.json()
          setSubscriptionData({
            subscriptionPlan: data.subscriptionPlan || null,
            subscriptionStatus: data.subscriptionStatus || 'inactive',
            stripeCustomerId: data.stripeCustomerId
          })
        }
      } catch (error) {
        // Error fetching subscription - handle silently
      } finally {
        setSubscriptionLoading(false)
      }
    }

    if (user) {
      fetchSubscription()
    }
  }, [user])

  // Initialize workspace settings from current workspace
  useEffect(() => {
    if (currentWorkspace) {
      const workspaceData = {
        name: currentWorkspace.workspace_name || '',
        domain: currentWorkspace.domain || '',
        email: user?.email || ''
      }
      setWorkspaceSettings(workspaceData)
      setOriginalWorkspaceSettings(workspaceData)
    }
  }, [currentWorkspace, user])

  // Fetch domain change info when workspace changes
  useEffect(() => {
    const fetchDomainChangeInfo = async () => {
      if (!currentWorkspace) return

      try {
        const response = await fetch(`/api/settings/workspace?workspaceId=${currentWorkspace.id}`)
        if (response.ok) {
          const data = await response.json()
          const workspace = data.data
          
          // Get domain change status
          const canChangeResponse = await fetch('/api/user/domain-change-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workspaceId: currentWorkspace.id })
          })
          
          if (canChangeResponse.ok) {
            const canChangeData = await canChangeResponse.json()
            setDomainChangeInfo({
              canChange: canChangeData.canChange,
              daysRemaining: canChangeData.daysRemaining || 0,
              lastChange: workspace.last_domain_change
            })
          }
        }
      } catch (error) {
        console.error('Error fetching domain change info:', error)
      }
    }

    if (currentWorkspace) {
      fetchDomainChangeInfo()
    }
  }, [currentWorkspace])

  // Helper function to show success toast
  const showToast = (message: string) => {
    setToastMessage(message)
    setShowSuccessToast(true)
    
    // Auto-hide toast after 3 seconds
    setTimeout(() => {
      setShowSuccessToast(false)
    }, 3000)
  }

  // Get plan display info
  const getPlanInfo = () => {
    if (!subscriptionData?.subscriptionPlan || subscriptionData.subscriptionStatus !== 'active') {
      return { name: 'No Active Plan', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20' }
    }
    
    switch (subscriptionData.subscriptionPlan) {
      case 'starter':
        return { name: 'Starter', color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' }
      case 'pro':
        return { name: 'Pro', color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20' }
      case 'team':
        return { name: 'Team', color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20' }
      default:
        return { name: 'Unknown', color: 'text-gray-400', bgColor: 'bg-gray-500/10', borderColor: 'border-gray-500/20' }
    }
  }

  // Get workspace limits based on plan
  const getWorkspaceLimits = () => {
    const plan = subscriptionData?.subscriptionPlan
    if (!plan || subscriptionData.subscriptionStatus !== 'active') {
      return { included: 0, total: 0 }
    }
    
          const included = plan === 'pro' ? 3 : 1
    const extraDomains = 0 // Removed: Add-ons no longer supported
    return { included, total: included + extraDomains }
  }

  // Format membership date
  const getMembershipDate = () => {
    if (!user?.created_at) return null
    const date = new Date(user.created_at)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  // Enhanced save settings function with domain change handling
  const handleSaveSettings = async () => {
    if (!user || !currentWorkspace) return

    setIsLoading(true)
    try {
      // First update user profile settings (first name, avatar, etc)
      const profileResponse = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: profile?.first_name || '',
          profile_picture_url: profile?.profile_picture_url
        })
      })

      if (!profileResponse.ok) {
        const error = await profileResponse.json()
        throw new Error(error.error || 'Failed to update profile')
      }

      // Then update workspace settings (name, domain)
      const workspaceResponse = await fetch('/api/settings/workspace', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: currentWorkspace.id,
          workspace_name: workspaceSettings.name,
          domain: workspaceSettings.domain
        })
      })

      if (!workspaceResponse.ok) {
        const error = await workspaceResponse.json()
        
        // Handle domain change cooldown specifically
        if (workspaceResponse.status === 429 && error.cooldownDays !== undefined) {
          showToast(`Domain change blocked: ${error.message}`)
          return
        }
        
        throw new Error(error.error || 'Failed to update workspace')
      }

      // Update local state with response data
      const profileData = await profileResponse.json()
      setProfile(profileData.data)
      setOriginalProfile(profileData.data)
      setOriginalWorkspaceSettings(workspaceSettings)
      
      // Emit workspace change event if name or domain changed
      if (workspaceSettings.name !== currentWorkspace.workspace_name || 
          workspaceSettings.domain !== currentWorkspace.domain) {
        window.dispatchEvent(new Event('workspaceChanged'))
        
        // Refresh workspace context to get updated domain
        if (typeof window !== 'undefined' && workspaceSettings.domain !== currentWorkspace.domain) {
          window.location.reload() // Force reload to ensure all components get updated domain
        }
      }

      showToast('Settings saved successfully')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle logout
  const handleLogout = async () => {
    setIsLoading(true)
    try {
      if (supabase) {
        await supabase.auth.signOut()
      }
      router.push('/')
    } catch (error) {
      // Error during logout - handle silently
    } finally {
      setIsLoading(false)
    }
  }

  const planInfo = getPlanInfo()
  const workspaceLimits = getWorkspaceLimits()
  const membershipDate = getMembershipDate()

  return (
    <>
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
      <div className="space-y-6">


      {/* Sub-tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setGeneralTab('profile')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              generalTab === 'profile'
                ? 'border-[#191919] text-[#191919]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setGeneralTab('workspace')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              generalTab === 'workspace'
                ? 'border-[#191919] text-[#191919]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Workspace
          </button>
        </nav>
      </div>

      {/* Profile Tab */}
      {generalTab === 'profile' && (
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-6">Personal Information</h3>
        
        {/* Profile Picture */}
            <div className="flex items-center justify-between py-4 border-b border-gray-200">
              <div>
                <div className="font-medium text-gray-900 text-sm">Profile Picture</div>
                <div className="text-xs text-gray-600 mt-1">
                  JPG, PNG or GIF. Max size 5MB.
                </div>
              </div>
              <div className="flex items-center gap-6">
          <AvatarUpload
            profilePictureUrl={profile?.profile_picture_url}
            firstName={profile?.first_name}
            lastName={null}
            email={user?.email}
            onAvatarUpdate={(url: string | null) => setProfile((prev: UserProfile | null) => ({ 
              ...prev, 
              profile_picture_url: url 
            }))}
            size="lg"
          />
          </div>
        </div>

            {/* Name */}
            <div className="flex items-center justify-between py-4 border-b border-gray-200">
          <div>
                <div className="font-medium text-gray-900 text-sm">Full Name</div>
                <div className="text-xs text-gray-600 mt-1">
                  Your display name across the platform
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right min-w-[16rem]">
            <Input
              value={profile?.first_name || ''}
              onChange={(e) => setProfile((prev: UserProfile | null) => ({ 
                ...prev, 
                first_name: e.target.value 
              }))}
              placeholder="Enter your name"
                    className="bg-white border-gray-300 text-gray-900 h-8 text-sm"
            />
                </div>
              </div>
          </div>
          
            {/* Email */}
            <div className="flex items-center justify-between py-4 border-b border-gray-200">
          <div>
                <div className="font-medium text-gray-900 text-sm">Email Address</div>
                <div className="text-xs text-gray-600 mt-1">
                  Contact support to change your email address
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right min-w-[16rem]">
            <Input
              value={user?.email || ''}
              type="email"
              disabled
                    className="bg-gray-50 border-gray-300 text-gray-500 h-8 cursor-not-allowed text-sm"
            />
          </div>
        </div>
      </div>

            {/* Password */}
            <div className="flex items-center justify-between py-4 border-b border-gray-200">
              <div>
                <div className="font-medium text-gray-900 text-sm">Password</div>
                <div className="text-xs text-gray-600 mt-1">
                  Reset your password via email
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right min-w-[16rem]">
                  <Button
                    onClick={() => router.push(`/forgot-password?email=${encodeURIComponent(user?.email || '')}`)}
                    variant="outline"
                    className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50 h-8 text-sm px-4"
                  >
                    Reset Password
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Account Overview Section */}
          <div>
            {/* Account Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="font-medium text-gray-900 text-sm">Account Details</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {profile?.first_name || user?.email?.split('@')[0] || 'User'} • {user?.email}
                  </div>
                </div>

                <div>
                  <div className="font-medium text-gray-900 text-sm">Current Plan</div>
                  <div className="flex items-center gap-2 mt-1">
                    {subscriptionLoading ? (
                      <div className="h-6 w-16 bg-gray-200 rounded relative overflow-hidden">
                        <div 
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          style={{
                            animation: 'shimmer 1.5s ease-in-out infinite'
                          }}
                        ></div>
                      </div>
                    ) : (
                      <span className={`text-xs px-2 py-1 rounded-sm border ${planInfo.bgColor} ${planInfo.color} ${planInfo.borderColor}`}>
                        {planInfo.name}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="font-medium text-gray-900 text-sm">Member Since</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {membershipDate || 'Unknown'}
                  </div>
                </div>
              </div>
            </div>

            {/* Logout */}
            <div className="flex items-center justify-between py-4 border-b border-gray-200">
              <div>
                <div className="font-medium text-gray-900 text-sm">End Session</div>
                <div className="text-xs text-gray-600 mt-1">
                  Sign out of your account on this device
                </div>
              </div>
              <div className="flex items-center gap-6">
                <Button 
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 hover:text-red-700 text-sm h-8 px-4 flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <LogOut className="w-4 h-4" />
                      Logout
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workspace Tab */}
      {generalTab === 'workspace' && (
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-6">Current Workspace</h3>
        
        {currentWorkspace ? (
          <>
                {/* Workspace Overview */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">Workspace Type</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-sm border ${
                          currentWorkspace.is_primary 
                            ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                            : 'bg-gray-500/10 text-gray-600 border-gray-500/20'
                        }`}>
                          {currentWorkspace.is_primary ? 'Primary' : 'Additional'}
                        </span>
                        {currentWorkspace.is_primary && (
                          <Shield className="w-3 h-3 text-blue-600" />
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <div className="font-medium text-gray-900 text-sm">Plan Allocation</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {workspaceLimits.included > 0 ? `${Math.min(1, workspaceLimits.included)}/` : '0/'}{workspaceLimits.included} included
                        {workspaceLimits.total - workspaceLimits.included > 0 && ` • +${workspaceLimits.total - workspaceLimits.included} extra`}
                      </div>
                    </div>
                    
                    <div>
                      <div className="font-medium text-gray-900 text-sm">Protection Status</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {currentWorkspace.is_primary ? 'Cannot be deleted' : 'Can be managed'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Workspace Name */}
                <div className="flex items-center justify-between py-4 border-b border-gray-200">
            <div>
                    <div className="font-medium text-gray-900 text-sm">Workspace Name</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Display name for your workspace
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right min-w-[16rem]">
              <Input
                value={workspaceSettings.name}
                onChange={(e) => setWorkspaceSettings(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Company"
                        className="bg-white border-gray-300 text-gray-900 h-8 text-sm"
              />
                    </div>
                  </div>
            </div>
            
                {/* Primary Domain */}
                <div className="flex items-center justify-between py-4 border-b border-gray-200">
            <div>
                    <div className="font-medium text-gray-900 text-sm">Primary Domain</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Domain we'll monitor for AI visibility
                      {domainChangeInfo && !domainChangeInfo.canChange && (
                        <span className="block text-orange-600 mt-1">
                          ⚠️ Domain can be changed in {domainChangeInfo.daysRemaining} day{domainChangeInfo.daysRemaining !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right min-w-[16rem]">
              <Input
                value={workspaceSettings.domain}
                onChange={(e) => setWorkspaceSettings(prev => ({ ...prev, domain: e.target.value }))}
                placeholder="example.com"
                        className="bg-white border-gray-300 text-gray-900 h-8 text-sm"
              />
              {domainChangeInfo && !domainChangeInfo.canChange && workspaceSettings.domain !== currentWorkspace.domain && (
                <div className="text-xs text-orange-600 mt-1">
                  Domain changes limited to once every 7 days
                </div>
              )}
            </div>
              </div>
            </div>
          </>
        ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-600 text-sm">Loading workspace settings...</p>
          </div>
        )}
          </div>
        </div>
      )}

      {/* Save Changes Button - Appears when there are unsaved changes */}
      {hasUnsavedChanges() && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-900">Unsaved Changes</div>
              <div className="text-xs text-gray-600">You have unsaved changes that will be lost if you navigate away.</div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => {
                  setProfile(originalProfile)
                  setWorkspaceSettings(originalWorkspaceSettings)
                }}
                variant="outline"
                className="border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-900 h-8 px-4 text-sm"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveSettings}
                disabled={isLoading}
                className="bg-[#191919] hover:bg-black border border-[#191919] hover:border-black text-white text-sm h-8 px-4"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
      </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3 shadow-lg">
            <span className="text-gray-900 text-sm font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
    </>
  )
} 
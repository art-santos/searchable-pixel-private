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
  id?: string
  first_name?: string | null
  last_name?: string | null
  workspace_name?: string | null
  email?: string | null
  created_by?: string
  updated_by?: string
  profile_picture_url?: string | null
  created_at?: string
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
  const [generalTab, setGeneralTab] = useState<'profile' | 'workspace' | 'account'>('profile')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [originalProfile, setOriginalProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
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

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user || !supabase) {
        setProfileLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, workspace_name, profile_picture_url, created_at')
          .eq('id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          // Profile fetch error - handle silently
        }

        const profileData = data || {
          first_name: user.email?.split('@')[0] || '',
          workspace_name: '',
          email: user.email,
          created_at: user.created_at
        }

        setProfile(profileData)
        setOriginalProfile(profileData)
      } catch (err) {
        // Error in profile fetch - handle silently
      } finally {
        setProfileLoading(false)
      }
    }

    fetchProfile()
  }, [user, supabase])

  // Fetch subscription data
  useEffect(() => {
    const fetchSubscription = async () => {
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
    
    const included = plan === 'team' ? 5 : 1
    const extraDomains = usageData?.addOns?.find((addon: any) => addon.add_on_type === 'extra_domains')?.quantity || 0
    return { included, total: included + extraDomains }
  }

  // Format membership date
  const getMembershipDate = () => {
    if (!profile?.created_at && !user?.created_at) return null
    const date = new Date(profile?.created_at || user?.created_at)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  // Unified function to save all general settings (workspace + profile)
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
      }

      showToast('Settings saved successfully')
    } catch (error) {
      showToast('Failed to save settings')
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-medium text-white mb-2">General Settings</h2>
        <p className="text-sm text-[#666]">
          Manage your profile and workspace settings
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="border-b border-[#1a1a1a]">
        <nav className="flex space-x-8">
          <button
            onClick={() => setGeneralTab('profile')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors font-mono tracking-tight ${
              generalTab === 'profile'
                ? 'border-white text-white'
                : 'border-transparent text-[#666] hover:text-white'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setGeneralTab('workspace')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors font-mono tracking-tight ${
              generalTab === 'workspace'
                ? 'border-white text-white'
                : 'border-transparent text-[#666] hover:text-white'
            }`}
          >
            Workspace
          </button>
          <button
            onClick={() => setGeneralTab('account')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors font-mono tracking-tight ${
              generalTab === 'account'
                ? 'border-white text-white'
                : 'border-transparent text-[#666] hover:text-white'
            }`}
          >
            Account
          </button>
        </nav>
      </div>

      {/* Profile Tab */}
      {generalTab === 'profile' && (
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-medium text-white mb-6 font-mono tracking-tight">Personal Information</h3>
            
            {/* Profile Picture */}
            <div className="flex items-center justify-between py-4 border-b border-[#1a1a1a]">
              <div>
                <div className="font-medium text-white font-mono tracking-tight text-sm">Profile Picture</div>
                <div className="text-xs text-[#666] font-mono tracking-tight mt-1">
                  JPG, PNG or GIF. Max size 5MB.
                </div>
              </div>
              <div className="flex items-center gap-6">
                <AvatarUpload
                  profilePictureUrl={profile?.profile_picture_url}
                  firstName={profile?.first_name}
                  lastName={profile?.last_name}
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
            <div className="flex items-center justify-between py-4 border-b border-[#1a1a1a]">
              <div>
                <div className="font-medium text-white font-mono tracking-tight text-sm">Full Name</div>
                <div className="text-xs text-[#666] font-mono tracking-tight mt-1">
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
                    placeholder="John Doe"
                    className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-8 font-mono tracking-tight text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between py-4 border-b border-[#1a1a1a]">
              <div>
                <div className="font-medium text-white font-mono tracking-tight text-sm">Email Address</div>
                <div className="text-xs text-[#666] font-mono tracking-tight mt-1">
                  Contact support to change your email address
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right min-w-[16rem]">
                  <Input
                    value={user?.email || ''}
                    type="email"
                    disabled
                    className="bg-[#0a0a0a] border-[#2a2a2a] text-[#666] h-8 cursor-not-allowed font-mono tracking-tight text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workspace Tab */}
      {generalTab === 'workspace' && (
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-medium text-white mb-6 font-mono tracking-tight">Current Workspace</h3>
            
            {currentWorkspace ? (
              <>
                {/* Workspace Overview */}
                <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <div className="font-medium text-white font-mono tracking-tight text-sm">Workspace Type</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-sm border font-mono tracking-tight ${
                          currentWorkspace.is_primary 
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                        }`}>
                          {currentWorkspace.is_primary ? 'Primary' : 'Additional'}
                        </span>
                        {currentWorkspace.is_primary && (
                          <Shield className="w-3 h-3 text-blue-400" />
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <div className="font-medium text-white font-mono tracking-tight text-sm">Plan Allocation</div>
                      <div className="text-xs text-[#666] font-mono tracking-tight mt-1">
                        {workspaceLimits.included > 0 ? `${Math.min(1, workspaceLimits.included)}/` : '0/'}{workspaceLimits.included} included
                        {workspaceLimits.total - workspaceLimits.included > 0 && ` • +${workspaceLimits.total - workspaceLimits.included} extra`}
                      </div>
                    </div>
                    
                    <div>
                      <div className="font-medium text-white font-mono tracking-tight text-sm">Protection Status</div>
                      <div className="text-xs text-[#666] font-mono tracking-tight mt-1">
                        {currentWorkspace.is_primary ? 'Cannot be deleted' : 'Can be managed'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Workspace Name */}
                <div className="flex items-center justify-between py-4 border-b border-[#1a1a1a]">
                  <div>
                    <div className="font-medium text-white font-mono tracking-tight text-sm">Workspace Name</div>
                    <div className="text-xs text-[#666] font-mono tracking-tight mt-1">
                      Display name for your workspace
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right min-w-[16rem]">
                      <Input
                        value={workspaceSettings.name}
                        onChange={(e) => setWorkspaceSettings(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="My Company"
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-8 font-mono tracking-tight text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Primary Domain */}
                <div className="flex items-center justify-between py-4 border-b border-[#1a1a1a]">
                  <div>
                    <div className="font-medium text-white font-mono tracking-tight text-sm">Primary Domain</div>
                    <div className="text-xs text-[#666] font-mono tracking-tight mt-1">
                      Domain we'll monitor for AI visibility
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right min-w-[16rem]">
                      <Input
                        value={workspaceSettings.domain}
                        onChange={(e) => setWorkspaceSettings(prev => ({ ...prev, domain: e.target.value }))}
                        placeholder="example.com"
                        className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-8 font-mono tracking-tight text-sm"
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-4">
                <p className="text-[#666] text-sm font-mono tracking-tight">Loading workspace settings...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Account Tab */}
      {generalTab === 'account' && (
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-medium text-white mb-6 font-mono tracking-tight">Account Overview</h3>
            
            {/* Account Info */}
            <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="font-medium text-white font-mono tracking-tight text-sm">Account Details</div>
                  <div className="text-xs text-[#666] font-mono tracking-tight mt-1">
                    {profile?.first_name || user?.email?.split('@')[0] || 'User'} • {user?.email}
                  </div>
                </div>
                
                <div>
                  <div className="font-medium text-white font-mono tracking-tight text-sm">Current Plan</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-sm border font-mono tracking-tight ${planInfo.bgColor} ${planInfo.color} ${planInfo.borderColor}`}>
                      {planInfo.name}
                    </span>
                  </div>
                </div>
                
                <div>
                  <div className="font-medium text-white font-mono tracking-tight text-sm">Member Since</div>
                  <div className="text-xs text-[#666] font-mono tracking-tight mt-1">
                    {membershipDate || 'Unknown'}
                  </div>
                </div>
              </div>
            </div>

            {/* Logout */}
            <div className="flex items-center justify-between py-4 border-b border-[#1a1a1a]">
              <div>
                <div className="font-medium text-white font-mono tracking-tight text-sm">End Session</div>
                <div className="text-xs text-[#666] font-mono tracking-tight mt-1">
                  Sign out of your account on this device
                </div>
              </div>
              <div className="flex items-center gap-6">
                <Button 
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 font-mono tracking-tight text-sm h-8 px-4 flex items-center gap-2"
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

      {/* Save Changes Button - Appears when there are unsaved changes */}
      {hasUnsavedChanges() && (
        <div className="sticky bottom-0 bg-[#0c0c0c] border-t border-[#1a1a1a] p-4 -mx-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white font-mono tracking-tight">Unsaved Changes</div>
              <div className="text-xs text-[#666] font-mono tracking-tight">You have unsaved changes that will be lost if you navigate away.</div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => {
                  setProfile(originalProfile)
                  setWorkspaceSettings(originalWorkspaceSettings)
                }}
                variant="outline"
                className="border-[#333] hover:border-[#444] text-[#666] hover:text-white h-8 px-4 text-sm font-mono tracking-tight"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveSettings}
                disabled={isLoading}
                className="bg-[#1a1a1a] hover:bg-[#333] border border-[#333] hover:border-[#444] text-white font-mono tracking-tight text-sm h-8 px-4"
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
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 flex items-center gap-3 shadow-lg">
            <span className="text-white text-sm font-medium font-mono tracking-tight">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  )
} 
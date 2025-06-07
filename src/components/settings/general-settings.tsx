'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LogOut, Loader2 } from 'lucide-react'
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
}

interface GeneralSettingsProps {
  usageData: any
  onRefreshUsage: () => Promise<void>
}

export function GeneralSettings({ usageData, onRefreshUsage }: GeneralSettingsProps) {
  const { user } = useAuth()
  const { currentWorkspace } = useWorkspace()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [workspaceSettings, setWorkspaceSettings] = useState({
    name: '',
    domain: '',
    email: ''
  })
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const supabase = createClient()

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
          .select('first_name, workspace_name, profile_picture_url')
          .eq('id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error)
        }

        setProfile(data || {
          first_name: user.email?.split('@')[0] || '',
          workspace_name: '',
          email: user.email
        })
      } catch (err) {
        console.error('Error in profile fetch:', err)
      } finally {
        setProfileLoading(false)
      }
    }

    fetchProfile()
  }, [user, supabase])

  // Initialize workspace settings from current workspace
  useEffect(() => {
    if (currentWorkspace) {
      setWorkspaceSettings({
        name: currentWorkspace.workspace_name || '',
        domain: currentWorkspace.domain || '',
        email: user?.email || ''
      })
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
      
      // Emit workspace change event if name or domain changed
      if (workspaceSettings.name !== currentWorkspace.workspace_name || 
          workspaceSettings.domain !== currentWorkspace.domain) {
        window.dispatchEvent(new Event('workspaceChanged'))
      }

      showToast('Settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
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
      console.error('Error during logout:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-medium text-white mb-2">General Settings</h2>
        <p className="text-sm text-[#666]">
          Manage your profile and workspace settings
        </p>
      </div>

      {/* Personal Information with Profile Picture */}
      <div className="space-y-6">
        <h3 className="text-white font-medium">Personal Information</h3>
        
        {/* Profile Picture */}
        <div className="flex items-start gap-6">
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
          <div className="text-sm text-[#666] mt-1">
            <p>Upload a profile picture</p>
            <p className="text-xs mt-1">JPG, PNG or GIF. Max size 5MB.</p>
            <p className="text-xs mt-1">Drag & drop or click to upload.</p>
          </div>
        </div>

        {/* Name and Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[#888] mb-2">Full Name</label>
            <Input
              value={profile?.first_name || ''}
              onChange={(e) => setProfile((prev: UserProfile | null) => ({ 
                ...prev, 
                first_name: e.target.value 
              }))}
              placeholder="John Doe"
              className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-10"
            />
          </div>
          
          <div>
            <label className="block text-sm text-[#888] mb-2">Email Address</label>
            <Input
              value={user?.email || ''}
              type="email"
              disabled
              className="bg-[#0a0a0a] border-[#2a2a2a] text-[#666] h-10 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Workspace Settings */}
      <div className="space-y-6 pt-6 border-t border-[#1a1a1a]">
        <h3 className="text-white font-medium">Current Workspace Settings</h3>
        
        {currentWorkspace ? (
          <>
            <div>
              <label className="block text-sm text-[#888] mb-2">Workspace Name</label>
              <Input
                value={workspaceSettings.name}
                onChange={(e) => setWorkspaceSettings(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Company"
                className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-10"
              />
            </div>
            
            <div>
              <label className="block text-sm text-[#888] mb-2">Primary Domain</label>
              <Input
                value={workspaceSettings.domain}
                onChange={(e) => setWorkspaceSettings(prev => ({ ...prev, domain: e.target.value }))}
                placeholder="example.com"
                className="bg-[#0a0a0a] border-[#2a2a2a] text-white h-10"
              />
              <p className="text-xs text-[#666] mt-2">
                This is the domain we'll monitor for AI visibility
              </p>
            </div>

            <div>
              <label className="block text-sm text-[#888] mb-2">Workspace Type</label>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  currentWorkspace.is_primary 
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                }`}>
                  {currentWorkspace.is_primary ? 'Primary Workspace' : 'Additional Workspace'}
                </span>
              </div>
              <p className="text-xs text-[#666] mt-2">
                {currentWorkspace.is_primary 
                  ? 'This is your primary workspace and cannot be deleted'
                  : 'Additional workspace that can be managed independently'
                }
              </p>
            </div>
          </>
        ) : (
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
            <p className="text-[#666] text-sm">Loading workspace settings...</p>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleSaveSettings}
          disabled={isLoading}
          className="bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#333] text-white h-9 px-6 text-sm"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>

      {/* Logout Button */}
      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleLogout}
          disabled={isLoading}
          className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 h-9 px-6 text-sm flex items-center gap-2"
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

      {/* Delete Account - Small text link */}
      <div className="pt-8 border-t border-[#1a1a1a] text-center">
        <button className="text-xs text-[#666] hover:text-red-400 transition-colors">
          Delete Account
        </button>
      </div>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 flex items-center gap-3 shadow-lg">
            <span className="text-white text-sm font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  )
} 
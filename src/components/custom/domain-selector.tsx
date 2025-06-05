'use client'

import { Button } from "@/components/ui/button"
import { ChevronDown, Plus, Crown, Check } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { WorkspaceCreationDialog } from '@/components/workspace/workspace-creation-dialog'

interface Workspace {
  id: string
  domain: string
  workspace_name: string
  is_primary: boolean
  created_at: string
}

interface DomainSelectorProps {
  showAddButton?: boolean
  position?: 'welcome' | 'topbar'
}

export function DomainSelector({ showAddButton = false, position = 'welcome' }: DomainSelectorProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [faviconUrl, setFaviconUrl] = useState<string>('/images/split-icon-white.svg')
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)
  const [showWorkspaceCreationDialog, setShowWorkspaceCreationDialog] = useState(false)
  const supabase = createClient()

  // Get display domain from current workspace or fallback
  const getDisplayDomain = () => {
    if (loading) return "Loading..."
    if (currentWorkspace?.domain) return currentWorkspace.domain
    if (currentWorkspace?.workspace_name) return `${currentWorkspace.workspace_name.toLowerCase().replace(/\s+/g, '')}.com`
    return "your-domain.com"
  }

  // Fetch workspaces and subscription data
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !supabase) {
        setLoading(false)
        return
      }

      try {
        // Fetch workspaces
        const workspacesResponse = await fetch('/api/workspaces')
        if (workspacesResponse.ok) {
          const workspacesData = await workspacesResponse.json()
          setWorkspaces(workspacesData.workspaces || [])
          
          // Set current workspace to primary workspace
          const primaryWorkspace = workspacesData.workspaces?.find((ws: Workspace) => ws.is_primary)
          if (primaryWorkspace) {
            setCurrentWorkspace(primaryWorkspace)
          }
        }

        // Fetch subscription
        const subscriptionResponse = await fetch('/api/user/subscription')
        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json()
          setSubscription(subscriptionData)
        }
      } catch (err) {
        console.error('Error in data fetch:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, supabase])

  // Load favicon when current workspace changes
  useEffect(() => {
    const domain = currentWorkspace?.domain
    
    if (domain && domain !== "your-domain.com") {
      // Use Google's favicon service directly for simplicity and reliability
      const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
      setFaviconUrl(googleFaviconUrl)
    } else {
      setFaviconUrl('/images/split-icon-white.svg')
    }
  }, [currentWorkspace])

  // Check if user can add domains
  const canAddDomains = subscription?.subscriptionPlan === 'plus' || subscription?.subscriptionPlan === 'pro'
  const isFreePlan = !subscription?.subscriptionPlan || subscription?.subscriptionPlan === 'free'
  const isVisibilityPlan = subscription?.subscriptionPlan === 'visibility'

  const handleAddDomain = () => {
    if (!canAddDomains) {
      // Redirect to upgrade for free/visibility users
      router.push('/settings?tab=billing&showUpgrade=true&feature=multi-domain&requiredPlan=plus')
    } else {
      // Show workspace creation dialog for plus/pro users
      setShowWorkspaceCreationDialog(true)
    }
  }

  const handleWorkspaceCreated = async (workspace: any) => {
    // Refresh workspaces list
    try {
      const workspacesResponse = await fetch('/api/workspaces')
      if (workspacesResponse.ok) {
        const workspacesData = await workspacesResponse.json()
        setWorkspaces(workspacesData.workspaces || [])
        
        // Switch to the newly created workspace
        const newWorkspace = workspacesData.workspaces?.find((ws: Workspace) => ws.id === workspace.id)
        if (newWorkspace) {
          setCurrentWorkspace(newWorkspace)
        }
      }
    } catch (error) {
      console.error('Error refreshing workspaces:', error)
    }
  }

  const handleWorkspaceSwitch = (workspace: Workspace) => {
    setCurrentWorkspace(workspace)
    // TODO: Implement workspace context switching
    // This will be used to filter all data by workspace_id
    console.log('Switching to workspace:', workspace)
  }

  const getAddDomainText = () => {
    if (isFreePlan || isVisibilityPlan) {
      return 'Upgrade to Plus to add domains'
    }
    return 'Add new workspace'
  }

  const getAddDomainIcon = () => {
    if (isFreePlan || isVisibilityPlan) {
      return Crown
    }
    return Plus
  }

  const AddIcon = getAddDomainIcon()

  return (
    <div className="flex items-start">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className={`border border-[#333333] bg-transparent hover:bg-[#1a1a1a] rounded-none ${
              position === 'topbar' 
                ? 'h-8 px-3 text-sm' 
                : 'w-fit px-2'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`relative flex-shrink-0 flex items-center justify-center ${
                position === 'topbar' ? 'w-4 h-4' : 'w-5 h-5'
              }`}>
                <img 
                  src={faviconUrl}
                  alt={getDisplayDomain()}
                  width={position === 'topbar' ? 16 : 20} 
                  height={position === 'topbar' ? 16 : 20}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/images/split-icon-white.svg'
                  }}
                />
              </div>
              <span className="font-geist-semi text-white">{getDisplayDomain()}</span>
              <ChevronDown className={`text-[#666666] ${
                position === 'topbar' ? 'h-3 w-3' : 'h-4 w-4'
              }`} />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="bg-[#1a1a1a] border border-[#333333] text-white rounded-none"
          align={position === 'topbar' ? 'end' : 'start'}
          alignOffset={-1}
        >
          {/* Workspace list */}
          {workspaces.map((workspace) => (
            <DropdownMenuItem 
              key={workspace.id}
              className="hover:bg-[#222222] rounded-none cursor-pointer"
              onClick={() => handleWorkspaceSwitch(workspace)}
            >
              <div className="flex items-center gap-2 w-full">
                <div className="w-4 h-4 flex items-center justify-center">
                  <img 
                    src={workspace.domain ? `https://www.google.com/s2/favicons?domain=${workspace.domain}&sz=128` : '/images/split-icon-white.svg'}
                    alt={workspace.domain || workspace.workspace_name}
                    width={16} 
                    height={16}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/images/split-icon-white.svg'
                    }}
                  />
                </div>
                <div className="flex-1">
                  <div className="text-sm">{workspace.workspace_name}</div>
                  <div className="text-xs text-[#666]">{workspace.domain}</div>
                </div>
                <div className="flex items-center gap-1">
                  {workspace.is_primary && (
                    <span className="text-xs text-[#666] bg-[#333] px-1.5 py-0.5 rounded">Primary</span>
                  )}
                  {currentWorkspace?.id === workspace.id && (
                    <Check className="w-3 h-3 text-green-400" />
                  )}
                </div>
              </div>
            </DropdownMenuItem>
          ))}
          
          {workspaces.length === 0 && !loading && (
            <DropdownMenuItem className="hover:bg-[#222222] rounded-none">
              <div className="flex items-center gap-2 w-full">
                <div className="w-4 h-4 flex items-center justify-center">
                  <img 
                    src={faviconUrl}
                    alt="Default"
                    width={16} 
                    height={16}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-sm flex-1">{getDisplayDomain()}</span>
                <span className="text-xs text-[#666] bg-[#333] px-1.5 py-0.5 rounded">Default</span>
              </div>
            </DropdownMenuItem>
          )}
          
          {showAddButton && (
            <>
              <DropdownMenuSeparator className="bg-[#333333]" />
              <DropdownMenuItem 
                className="hover:bg-[#222222] cursor-pointer rounded-none"
                onClick={handleAddDomain}
              >
                <div className="flex items-center gap-2">
                  <AddIcon className="w-4 h-4" />
                  <span className="text-sm">{getAddDomainText()}</span>
                </div>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Workspace Creation Dialog */}
      <WorkspaceCreationDialog
        open={showWorkspaceCreationDialog}
        onOpenChange={setShowWorkspaceCreationDialog}
        onSuccess={handleWorkspaceCreated}
      />
    </div>
  )
} 
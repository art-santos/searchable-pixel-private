'use client'

import { Button } from "@/components/ui/button"
import { ChevronDown, Plus, Crown, Check } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { WorkspaceCreationDialog } from '@/components/workspace/workspace-creation-dialog'

interface DomainSelectorProps {
  showAddButton?: boolean
  position?: 'welcome' | 'topbar'
}

export function DomainSelector({ showAddButton = false, position = 'welcome' }: DomainSelectorProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { 
    currentWorkspace, 
    workspaces, 
    loading, 
    switchWorkspace, 
    refreshWorkspaces 
  } = useWorkspace()
  
  const [faviconUrl, setFaviconUrl] = useState<string>('/images/split-icon-white.svg')
  const [subscription, setSubscription] = useState<any>(null)
  const [showWorkspaceCreationDialog, setShowWorkspaceCreationDialog] = useState(false)
  const [usageData, setUsageData] = useState<any>(null)

  // Get display domain from current workspace or fallback
  const getDisplayDomain = () => {
    if (loading) return "Loading..."
    if (currentWorkspace?.domain) return currentWorkspace.domain
    if (currentWorkspace?.workspace_name) return `${currentWorkspace.workspace_name.toLowerCase().replace(/\s+/g, '')}.com`
    return "your-domain.com"
  }

  // Fetch subscription and usage data
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        const [subscriptionResponse, usageResponse] = await Promise.all([
          fetch('/api/user/subscription'),
          fetch('/api/usage/current')
        ])
        
        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json()
          setSubscription(subscriptionData)
        }
        
        if (usageResponse.ok) {
          const usageData = await usageResponse.json()
          setUsageData(usageData)
        }
      } catch (err) {
        console.error('Error fetching data:', err)
      }
    }

    fetchData()
  }, [user])

  // Refresh usage data when workspaces change (to update available slots)
  useEffect(() => {
    const refreshUsageData = async () => {
      if (!user) return
      
      try {
        const usageResponse = await fetch('/api/usage/current')
        if (usageResponse.ok) {
          const newUsageData = await usageResponse.json()
          setUsageData(newUsageData)
        }
      } catch (err) {
        console.error('Error refreshing usage data:', err)
      }
    }

    refreshUsageData()
  }, [workspaces, user])

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
    await refreshWorkspaces()
    
    // Also refresh usage data to update available slots
    try {
      const usageResponse = await fetch('/api/usage/current')
      if (usageResponse.ok) {
        const newUsageData = await usageResponse.json()
        setUsageData(newUsageData)
      }
    } catch (err) {
      console.error('Error refreshing usage data:', err)
    }
    
    // The workspaces array from context should now be updated
    // We need to wait a bit for React state to update
    setTimeout(() => {
      const newWorkspace = workspaces.find(ws => ws.id === workspace.id)
      
      if (newWorkspace) {
        switchWorkspace(newWorkspace)
      }
    }, 100)
  }

  const handleWorkspaceSwitch = async (workspace: any) => {
    await switchWorkspace(workspace)
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

  // Calculate available slots for empty workspace placeholders
  const getAvailableSlots = () => {
    if (!usageData?.addOns) return 0
    const domainsAddon = usageData.addOns.find((addon: any) => addon.add_on_type === 'extra_domains')
    const billingSlots = domainsAddon?.quantity || 0
    const extraWorkspaces = workspaces.filter(ws => !ws.is_primary).length
    return Math.max(0, billingSlots - extraWorkspaces)
  }

  const availableSlots = getAvailableSlots()

  // Debug logging for admin
  console.log('Domain Selector Debug:', {
    workspaces: workspaces.length,
    extraWorkspaces: workspaces.filter(ws => !ws.is_primary).length,
    usageData: usageData?.addOns,
    availableSlots,
    canAddDomains
  })

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
          
          {/* Empty slots for available billing capacity */}
          {availableSlots > 0 && canAddDomains && Array.from({ length: availableSlots }, (_, i) => (
            <DropdownMenuItem 
              key={`empty-slot-${i}`}
              className="hover:bg-[#222222] cursor-pointer rounded-none border border-dashed border-[#444] m-1"
              onClick={() => setShowWorkspaceCreationDialog(true)}
            >
              <div className="flex items-center gap-2 w-full opacity-60">
                <div className="w-4 h-4 flex items-center justify-center">
                  <Plus className="w-3 h-3 text-[#666]" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-[#666]">Available slot</div>
                  <div className="text-xs text-[#555]">Click to add workspace</div>
                </div>
                <span className="text-xs text-[#555] bg-[#2a2a2a] px-1.5 py-0.5 rounded">Empty</span>
              </div>
            </DropdownMenuItem>
          ))}
          
          {showAddButton && !canAddDomains && (
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
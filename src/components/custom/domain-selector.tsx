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
  const { 
    workspaces, 
    currentWorkspace, 
    switchWorkspace, 
    loading: workspaceLoading,
    refreshWorkspaces
  } = useWorkspace()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [showWorkspaceCreationDialog, setShowWorkspaceCreationDialog] = useState(false)
  const [userPlan, setUserPlan] = useState<'starter' | 'pro' | 'team'>('starter')
  const [availableSlots, setAvailableSlots] = useState(0)

  // Get display text based on position
  const getDisplayText = () => {
    return position === 'welcome' ? 'Select Domain' : ''
  }

  // Determine if user can add more domains
  const canAddDomains = availableSlots > 0
  
  // Get Add Domain text based on plan
  const getAddDomainText = () => {
    if (canAddDomains) {
      return 'Add Domain'
    }
    return userPlan === 'starter' ? 'Upgrade for More Domains' : 'Upgrade Plan'
  }

  // Generate Add icon component
  const AddIcon = canAddDomains ? Plus : Crown

  // Load user plan and calculate available slots
  useEffect(() => {
    const loadUserPlan = async () => {
      if (!user) return
      
      try {
        const response = await fetch('/api/user/subscription')
        if (response.ok) {
          const data = await response.json()
          const plan = data.subscriptionPlan || 'starter'
          setUserPlan(plan)
          
          // Calculate available slots
          const maxDomains = plan === 'starter' ? 1 : plan === 'pro' ? 3 : 10
          const usedSlots = workspaces.length
          setAvailableSlots(Math.max(0, maxDomains - usedSlots))
        }
      } catch (error) {
        console.error('Error loading user plan:', error)
      }
    }

    loadUserPlan()
  }, [user, workspaces])

  const handleWorkspaceSwitch = async (workspaceId: string) => {
    if (workspaceId === currentWorkspace?.id) return
    
    setLoading(true)
    try {
      await switchWorkspace(workspaceId)
    } catch (error) {
      console.error('Error switching workspace:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDomain = () => {
    if (canAddDomains) {
      setShowWorkspaceCreationDialog(true)
    } else {
      // Redirect to upgrade page
      router.push('/settings/billing')
    }
  }

  const handleWorkspaceCreated = async () => {
    await refreshWorkspaces()
    setShowWorkspaceCreationDialog(false)
  }

  // Helper to get favicon URL
  const getFaviconUrl = (domain: string) => {
    if (domain && domain !== 'No domain set') {
      const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '')
      return `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`
    }
    return '/images/default-favicon.svg'
  }

  const getDisplayDomain = () => {
    if (position === 'welcome') {
      return currentWorkspace?.domain || 'No domain set'
    }
    return currentWorkspace?.domain || 'Split'
  }

  const faviconUrl = getFaviconUrl(currentWorkspace?.domain || '')

  if (workspaceLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-gray-200 dark:bg-[#333] rounded animate-pulse" />
        <div className="w-24 h-4 bg-gray-200 dark:bg-[#333] rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex items-center relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="bg-transparent hover:bg-gray-100 dark:hover:bg-transparent p-0 rounded-none flex items-center gap-2"
            disabled={loading}
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 flex items-center justify-center">
                <img 
                  src={faviconUrl}
                  alt="Domain favicon"
                  width={16} 
                  height={16}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-geist-semi text-black dark:text-white truncate max-w-[120px]">
                {getDisplayDomain()}
              </span>
              {getDisplayText() && (
                <span className="text-sm text-gray-500 dark:text-[#A7A7A7]">{getDisplayText()}</span>
              )}
            </div>
            <ChevronDown className="h-4 w-4 text-gray-500 dark:text-[#666666] ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333333] text-black dark:text-white rounded-none min-w-[200px] max-w-[300px]"
          align="start"
          alignOffset={0}
          sideOffset={4}
        >
          {/* Existing workspaces */}
          {workspaces.map((workspace) => (
            <DropdownMenuItem 
              key={workspace.id}
              className="hover:bg-gray-100 dark:hover:bg-[#222222] rounded-none"
              onClick={() => handleWorkspaceSwitch(workspace.id)}
            >
              <div className="flex items-center gap-2 w-full">
                <div className="w-4 h-4 flex items-center justify-center">
                  <img 
                    src={getFaviconUrl(workspace.domain)}
                    alt={workspace.name}
                    width={16} 
                    height={16}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-sm flex-1 truncate">{workspace.domain || workspace.name}</span>
                {workspace.id === currentWorkspace?.id && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
          
          {workspaces.length === 0 && !loading && (
            <DropdownMenuItem className="hover:bg-gray-100 dark:hover:bg-[#222222] rounded-none">
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
                <span className="text-xs text-gray-500 dark:text-[#666] bg-gray-100 dark:bg-[#333] px-1.5 py-0.5 rounded">Default</span>
              </div>
            </DropdownMenuItem>
          )}
          
          {/* Empty slots for available billing capacity */}
          {availableSlots > 0 && canAddDomains && Array.from({ length: availableSlots }, (_, i) => (
            <DropdownMenuItem 
              key={`empty-slot-${i}`}
              className="hover:bg-gray-100 dark:hover:bg-[#222222] cursor-pointer rounded-none border border-dashed border-gray-300 dark:border-[#444] m-1"
              onClick={() => setShowWorkspaceCreationDialog(true)}
            >
              <div className="flex items-center gap-2 w-full opacity-60">
                <div className="w-4 h-4 flex items-center justify-center">
                  <Plus className="w-3 h-3 text-gray-500 dark:text-[#666]" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500 dark:text-[#666]">Available slot</div>
                  <div className="text-xs text-gray-400 dark:text-[#555]">Click to add workspace</div>
                </div>
                <span className="text-xs text-gray-400 dark:text-[#555] bg-gray-100 dark:bg-[#2a2a2a] px-1.5 py-0.5 rounded">Empty</span>
              </div>
            </DropdownMenuItem>
          ))}
          
          {showAddButton && !canAddDomains && (
            <>
              <DropdownMenuSeparator className="bg-gray-200 dark:bg-[#333333]" />
              <DropdownMenuItem 
                className="hover:bg-gray-100 dark:hover:bg-[#222222] cursor-pointer rounded-none"
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
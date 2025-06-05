'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'

interface Workspace {
  id: string
  domain: string
  workspace_name: string
  is_primary: boolean
  created_at: string
  user_id: string
}

interface WorkspaceContextType {
  // Current state
  currentWorkspace: Workspace | null
  workspaces: Workspace[]
  loading: boolean
  switching: boolean  // New loading state for workspace switching
  
  // Actions
  switchWorkspace: (workspace: Workspace) => Promise<void>  // Make async
  refreshWorkspaces: () => Promise<void>
  
  // Computed values
  isWorkspaceOwner: boolean
  workspaceCount: number
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

interface WorkspaceProviderProps {
  children: ReactNode
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const { user } = useAuth()
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)
  const supabase = createClient()

  // Fetch workspaces from API
  const fetchWorkspaces = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/workspaces')
      if (response.ok) {
        const data = await response.json()
        const fetchedWorkspaces = data.workspaces || []
        setWorkspaces(fetchedWorkspaces)
        
        // If no current workspace, set to primary or first workspace
        if (!currentWorkspace && fetchedWorkspaces.length > 0) {
          const savedWorkspaceId = localStorage.getItem('currentWorkspaceId')
          let workspaceToSet: Workspace | null = null
          
          if (savedWorkspaceId) {
            // Try to restore saved workspace
            workspaceToSet = fetchedWorkspaces.find((ws: Workspace) => ws.id === savedWorkspaceId) || null
          }
          
          if (!workspaceToSet) {
            // Fall back to primary workspace or first available
            workspaceToSet = fetchedWorkspaces.find((ws: Workspace) => ws.is_primary) || fetchedWorkspaces[0]
          }
          
          if (workspaceToSet) {
            setCurrentWorkspace(workspaceToSet)
            localStorage.setItem('currentWorkspaceId', workspaceToSet.id)
          }
        }
      } else {
        console.error('Failed to fetch workspaces:', response.status)
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error)
    } finally {
      setLoading(false)
    }
  }

  // Switch to a different workspace
  const switchWorkspace = async (workspace: Workspace) => {
    if (switching) {
      return
    }

    console.log('🔄 Starting workspace switch to:', workspace.workspace_name)
    setSwitching(true)
    
    // Set the new workspace
    setCurrentWorkspace(workspace)
    localStorage.setItem('currentWorkspaceId', workspace.id)
    
    // Emit a custom event so other components can react to workspace changes
    window.dispatchEvent(new CustomEvent('workspaceChanged', { 
      detail: { workspace } 
    }))
    
    // Keep the loading state for at least 1 second to show the animation
    // and give components time to load new data
    console.log('⏳ Waiting for components to load...')
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    console.log('✅ Workspace switch complete')
    setSwitching(false)
  }

  // Refresh workspaces (useful after creating/deleting)
  const refreshWorkspaces = async () => {
    await fetchWorkspaces()
  }

  // Initialize workspaces when user is available
  useEffect(() => {
    if (user) {
      fetchWorkspaces()
    } else {
      // Clear state when user logs out
      setCurrentWorkspace(null)
      setWorkspaces([])
      setLoading(false)
      localStorage.removeItem('currentWorkspaceId')
    }
  }, [user])

  // Listen for workspace changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentWorkspaceId' && e.newValue) {
        const newWorkspaceId = e.newValue
        const newWorkspace = workspaces.find(ws => ws.id === newWorkspaceId)
        if (newWorkspace && newWorkspace.id !== currentWorkspace?.id) {
          setCurrentWorkspace(newWorkspace)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [workspaces, currentWorkspace])

  const value: WorkspaceContextType = {
    currentWorkspace,
    workspaces,
    loading,
    switching,
    switchWorkspace,
    refreshWorkspaces,
    isWorkspaceOwner: currentWorkspace?.user_id === user?.id,
    workspaceCount: workspaces.length,
  }

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

// Custom hook to use workspace context
export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}

// Helper hook for workspace-filtered queries
export function useWorkspaceQuery() {
  const { currentWorkspace } = useWorkspace()
  
  return {
    workspaceId: currentWorkspace?.id || null,
    workspaceFilter: currentWorkspace ? { workspace_id: currentWorkspace.id } : null,
    isReady: !!currentWorkspace,
  }
} 
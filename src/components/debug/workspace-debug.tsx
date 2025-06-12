'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'

export function WorkspaceDebug() {
  const { user } = useAuth()
  const { 
    currentWorkspace, 
    workspaces, 
    loading, 
    switching, 
    isWorkspaceOwner, 
    workspaceCount 
  } = useWorkspace()

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h4 className="font-bold mb-2">Workspace Debug</h4>
      <div className="space-y-1">
        <div>User Email: {user?.email || 'Not logged in'}</div>
        <div>Is Admin Email: {user?.email?.endsWith('@split.dev') ? 'Yes' : 'No'}</div>
        <div>Loading: {loading ? 'Yes' : 'No'}</div>
        <div>Switching: {switching ? 'Yes' : 'No'}</div>
        <div>Workspace Count: {workspaceCount}</div>
        <div>Current Workspace: {currentWorkspace?.workspace_name || 'None'}</div>
        <div>Current Domain: {currentWorkspace?.domain || 'None'}</div>
        <div>Is Owner: {isWorkspaceOwner ? 'Yes' : 'No'}</div>
        <div>Available Workspaces:</div>
        <ul className="ml-2">
          {workspaces.map(ws => (
            <li key={ws.id} className={ws.id === currentWorkspace?.id ? 'font-bold' : ''}>
              • {ws.workspace_name} ({ws.domain}) {ws.is_primary ? '(Primary)' : ''}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
} 
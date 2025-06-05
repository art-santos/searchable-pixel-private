import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Globe, Trash2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Workspace {
  id: string
  domain: string
  workspace_name: string
  is_primary: boolean
  created_at: string
}

interface WorkspaceDeletionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaces: Workspace[]
  domainsToRemove: number // How many domains are being removed
  onConfirm: (workspaceIds: string[]) => Promise<void>
}

export function WorkspaceDeletionDialog({ 
  open, 
  onOpenChange, 
  workspaces, 
  domainsToRemove,
  onConfirm 
}: WorkspaceDeletionDialogProps) {
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  // Filter out primary workspace and sort by creation date
  const deletableWorkspaces = workspaces
    .filter(ws => !ws.is_primary)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const handleWorkspaceToggle = (workspaceId: string) => {
    setSelectedWorkspaces(prev => 
      prev.includes(workspaceId) 
        ? prev.filter(id => id !== workspaceId)
        : [...prev, workspaceId]
    )
  }

  const handleConfirm = async () => {
    if (selectedWorkspaces.length !== domainsToRemove) {
      toast({
        title: "Selection Required",
        description: `Please select exactly ${domainsToRemove} workspace${domainsToRemove > 1 ? 's' : ''} to delete.`,
        variant: "destructive"
      })
      return
    }

    setIsDeleting(true)
    try {
      await onConfirm(selectedWorkspaces)
      onOpenChange(false)
      setSelectedWorkspaces([])
    } catch (error) {
      console.error('Error deleting workspaces:', error)
      toast({
        title: "Deletion Failed",
        description: "Failed to delete selected workspaces. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancel = () => {
    setSelectedWorkspaces([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a0a0a] border border-[#1a1a1a] text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            Delete Workspaces
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-4">
            <p className="text-sm text-[#ccc] mb-2">
              You're removing {domainsToRemove} domain{domainsToRemove > 1 ? 's' : ''} from your subscription. 
              Please select which workspace{domainsToRemove > 1 ? 's' : ''} to delete:
            </p>
            <p className="text-xs text-[#666]">
              ⚠️ This will permanently delete all data associated with the selected workspaces.
            </p>
          </div>

          {deletableWorkspaces.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="w-12 h-12 text-[#333] mx-auto mb-3" />
              <p className="text-[#666]">No additional workspaces to delete</p>
              <p className="text-xs text-[#666] mt-1">You only have your primary workspace</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm font-medium text-white">
                Select {domainsToRemove} workspace{domainsToRemove > 1 ? 's' : ''} to delete:
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {deletableWorkspaces.map(workspace => (
                  <div
                    key={workspace.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedWorkspaces.includes(workspace.id)
                        ? 'border-red-500/50 bg-red-500/5'
                        : 'border-[#1a1a1a] hover:border-[#333] hover:bg-[#111]'
                    }`}
                    onClick={() => handleWorkspaceToggle(workspace.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          selectedWorkspaces.includes(workspace.id)
                            ? 'border-red-500 bg-red-500'
                            : 'border-[#333]'
                        }`}>
                          {selectedWorkspaces.includes(workspace.id) && (
                            <X className="w-2.5 h-2.5 text-white" />
                          )}
                        </div>
                        
                        <div>
                          <div className="font-medium text-white text-sm">
                            {workspace.workspace_name}
                          </div>
                          <div className="text-xs text-[#666]">
                            {workspace.domain}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-[#666]">
                        Created {new Date(workspace.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-[#1a1a1a]">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="border-[#333] hover:border-[#444] text-[#666] hover:text-white"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleConfirm}
              disabled={
                isDeleting || 
                selectedWorkspaces.length !== domainsToRemove ||
                deletableWorkspaces.length === 0
              }
              className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300"
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Delete {selectedWorkspaces.length} Workspace{selectedWorkspaces.length !== 1 ? 's' : ''}
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
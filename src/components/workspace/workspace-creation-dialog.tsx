import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Globe, Plus, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface WorkspaceCreationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (workspace: any) => void
}

export function WorkspaceCreationDialog({ 
  open, 
  onOpenChange, 
  onSuccess 
}: WorkspaceCreationDialogProps) {
  const [domain, setDomain] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  const handleCreate = async () => {
    if (!domain || !workspaceName) {
      toast({
        title: "Missing Information",
        description: "Please fill in both domain and workspace name.",
        variant: "destructive"
      })
      return
    }

    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.([a-zA-Z]{2,}|[a-zA-Z]{2,}\.[a-zA-Z]{2,})$/
    if (!domainRegex.test(domain)) {
      toast({
        title: "Invalid Domain",
        description: "Please enter a valid domain (e.g., example.com)",
        variant: "destructive"
      })
      return
    }

    setIsCreating(true)
    try {
      // First, create the workspace
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: domain.toLowerCase(),
          workspace_name: workspaceName
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.requiresUpgrade) {
          toast({
            title: "Upgrade Required",
            description: data.error,
            variant: "destructive",
            action: (
              <Button
                size="sm"
                onClick={() => window.location.href = '/settings?tab=billing&upgrade=team'}
                className="bg-white text-black"
              >
                Upgrade to Team
              </Button>
            )
          })
          return
        }
        throw new Error(data.error || 'Failed to create workspace')
      }

      // Workspace created successfully - no additional billing sync needed for Team plan

      toast({
        title: "Workspace Created!",
        description: `Successfully created workspace for ${domain}`,
      })

      onSuccess(data.workspace)
      handleCancel()

    } catch (error) {
      console.error('Error creating workspace:', error)
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create workspace. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleCancel = () => {
    setDomain('')
    setWorkspaceName('')
    onOpenChange(false)
  }

  const handleDomainChange = (value: string) => {
    setDomain(value)
    // Auto-generate workspace name from domain
    if (value && !workspaceName) {
      const domainParts = value.split('.')
      const mainDomain = domainParts[0]
      const capitalizedName = mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1)
      setWorkspaceName(capitalizedName)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a0a0a] border border-[#1a1a1a] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-green-400" />
            </div>
            Add New Workspace
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-4">
            <p className="text-sm text-[#ccc] mb-2">
              Create a new workspace to track a different domain. Each workspace is completely isolated.
            </p>
            <p className="text-xs text-[#666]">
              💡 Team plan includes 5 workspaces (1 primary + 4 additional). Pro/Starter plans can purchase extra domains.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Domain
              </label>
              <Input
                value={domain}
                onChange={(e) => handleDomainChange(e.target.value)}
                placeholder="example.com"
                className="bg-[#111] border-[#333] text-white placeholder:text-[#666]"
                disabled={isCreating}
              />
              <p className="text-xs text-[#666] mt-1">
                Enter the domain you want to track (without https://)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Workspace Name
              </label>
              <Input
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="My Company"
                className="bg-[#111] border-[#333] text-white placeholder:text-[#666]"
                disabled={isCreating}
              />
              <p className="text-xs text-[#666] mt-1">
                Choose a friendly name for this workspace
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-[#1a1a1a]">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="border-[#333] hover:border-[#444] text-[#666] hover:text-white"
              disabled={isCreating}
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleCreate}
              disabled={isCreating || !domain || !workspaceName}
              className="bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 hover:text-green-300"
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create Workspace
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
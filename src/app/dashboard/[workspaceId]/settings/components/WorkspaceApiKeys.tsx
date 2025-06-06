'use client'

import { useState, useEffect } from 'react'
import { Copy, Trash2, Plus, Eye, EyeOff, Loader2, Key, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'

interface WorkspaceApiKey {
  id: string
  workspace_id: string
  name: string
  api_key?: string
  permissions: {
    crawler_tracking: boolean
    read_data: boolean
  }
  is_active: boolean
  last_used_at: string | null
  created_at: string
  metadata?: any
}

export default function WorkspaceApiKeys({ workspaceId }: { workspaceId: string }) {
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [apiKeys, setApiKeys] = useState<WorkspaceApiKey[]>([])
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const [keyNameInput, setKeyNameInput] = useState('')
  const [keyType, setKeyType] = useState<'live' | 'test'>('live')
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [keyToDelete, setKeyToDelete] = useState<WorkspaceApiKey | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showKey, setShowKey] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    fetchApiKeys()
  }, [workspaceId])

  const fetchApiKeys = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/workspaces/${workspaceId}/api-keys`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch API keys')
      }
      
      const data = await response.json()
      setApiKeys(data.apiKeys || [])
    } catch (error) {
      console.error('Error fetching API keys:', error)
      toast({
        title: 'Error',
        description: 'Failed to load API keys',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const createApiKey = async () => {
    try {
      setIsCreating(true)
      const response = await fetch(`/api/workspaces/${workspaceId}/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: keyNameInput.trim() || undefined,
          keyType
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create API key')
      }

      const data = await response.json()
      setNewlyCreatedKey(data.apiKey.api_key)
      setShowNewKeyDialog(false)
      setKeyNameInput('')
      await fetchApiKeys()
      
      toast({
        title: 'Success',
        description: 'API key created successfully'
      })
    } catch (error: any) {
      console.error('Error creating API key:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to create API key',
        variant: 'destructive'
      })
    } finally {
      setIsCreating(false)
    }
  }

  const deleteApiKey = async () => {
    if (!keyToDelete) return

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/workspaces/${workspaceId}/api-keys?id=${keyToDelete.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete API key')
      }

      await fetchApiKeys()
      setShowDeleteDialog(false)
      setKeyToDelete(null)
      
      toast({
        title: 'Success',
        description: 'API key deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting API key:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete API key',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: 'Copied!',
        description: 'API key copied to clipboard'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive'
      })
    }
  }

  const maskApiKey = (key: string) => {
    const prefix = key.substring(0, 20)
    const masked = '*'.repeat(20)
    return `${prefix}${masked}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">API Keys</h3>
          <p className="text-sm text-gray-400 mt-1">
            Manage API keys for this workspace. Keys are scoped to this workspace only.
          </p>
        </div>
        
        <Button
          onClick={() => setShowNewKeyDialog(true)}
          disabled={apiKeys.length >= 10}
          className="bg-white text-black hover:bg-gray-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create API Key
        </Button>
      </div>

      {/* Newly Created Key Alert */}
      {newlyCreatedKey && (
        <Alert className="bg-green-900/20 border-green-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="font-semibold mb-1">New API key created!</p>
              <p className="text-sm text-gray-300 mb-2">
                Make sure to copy your API key now. You won't be able to see it again!
              </p>
              <code className="bg-gray-800 px-2 py-1 rounded text-sm font-mono">
                {newlyCreatedKey}
              </code>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(newlyCreatedKey)}
              className="ml-4"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* API Keys List */}
      {apiKeys.length === 0 && !newlyCreatedKey ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="py-12 text-center">
            <Key className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 mb-4">No API keys yet</p>
            <p className="text-sm text-gray-500 mb-6">
              Create your first API key to start tracking crawler visits
            </p>
            <Button
              onClick={() => setShowNewKeyDialog(true)}
              className="bg-white text-black hover:bg-gray-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Key
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {apiKeys.map((apiKey) => (
            <Card key={apiKey.id} className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{apiKey.name}</h4>
                      {!apiKey.is_active && (
                        <span className="text-xs bg-red-900/30 text-red-400 px-2 py-1 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-400">
                        Created: {format(new Date(apiKey.created_at), 'PPP')}
                      </p>
                      {apiKey.last_used_at && (
                        <p className="text-gray-400">
                          Last used: {format(new Date(apiKey.last_used_at), 'PPpp')}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <code className="bg-gray-800 px-2 py-1 rounded text-xs font-mono">
                          {showKey[apiKey.id] ? maskApiKey(apiKey.name) : '••••••••••••••••••••'}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowKey({ ...showKey, [apiKey.id]: !showKey[apiKey.id] })}
                        >
                          {showKey[apiKey.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setKeyToDelete(apiKey)
                      setShowDeleteDialog(true)
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Usage Limit Info */}
      {apiKeys.length > 0 && (
        <p className="text-sm text-gray-500 text-center">
          {apiKeys.length}/10 API keys used
        </p>
      )}

      {/* Create Key Dialog */}
      <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle>Create New API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for this workspace. The key will only have access to this workspace's data.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="key-name">Key Name (optional)</Label>
              <Input
                id="key-name"
                placeholder="e.g., Production Key"
                value={keyNameInput}
                onChange={(e) => setKeyNameInput(e.target.value)}
                className="mt-1 bg-gray-800 border-gray-700"
              />
              <p className="text-xs text-gray-400 mt-1">
                A descriptive name to help you identify this key
              </p>
            </div>
            
            <div>
              <Label>Key Type</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="live"
                    checked={keyType === 'live'}
                    onChange={(e) => setKeyType(e.target.value as 'live')}
                    className="text-white"
                  />
                  <span className="text-sm">Live</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="test"
                    checked={keyType === 'test'}
                    onChange={(e) => setKeyType(e.target.value as 'test')}
                    className="text-white"
                  />
                  <span className="text-sm">Test</span>
                </label>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Test keys are for development and won't count towards your usage
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowNewKeyDialog(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={createApiKey}
              disabled={isCreating}
              className="bg-white text-black hover:bg-gray-200"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle>Delete API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{keyToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteApiKey}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
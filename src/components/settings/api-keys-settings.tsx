'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { 
  CheckCircle2, 
  Copy,
  X,
  Loader2,
  ArrowRight,
  FileText,
  Key
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'

export function APIKeysSettings() {
  const { user } = useAuth()
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [loadingKeys, setLoadingKeys] = useState(true)
  const [isCreatingKey, setIsCreatingKey] = useState(false)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const [copiedNewKey, setCopiedNewKey] = useState(false)
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Fetch API keys when component mounts
  useEffect(() => {
    if (user) {
      fetchApiKeys()
    }
  }, [user])

  const fetchApiKeys = async () => {
    setLoadingKeys(true)
    try {
      const response = await fetch('/api/api-keys')
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.apiKeys || [])
      }
    } catch (error) {
      console.error('Error fetching API keys:', error)
    } finally {
      setLoadingKeys(false)
    }
  }

  const handleCreateApiKey = async (keyType: 'test' | 'live' = 'live') => {
    if (isCreatingKey) return
    
    setIsCreatingKey(true)
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyType })
      })
      
      if (response.ok) {
        const data = await response.json()
        setNewlyCreatedKey(data.apiKey.key)
        showToast(`${keyType === 'test' ? 'Test' : 'Live'} API key created successfully`)
        fetchApiKeys() // Refresh the list
      } else {
        const error = await response.json()
        showToast(error.error || 'Failed to create API key')
      }
    } catch (error) {
      console.error('Error creating API key:', error)
      showToast('Failed to create API key')
    } finally {
      setIsCreatingKey(false)
    }
  }

  const handleCopyApiKey = (key: string) => {
    // Check if this is a masked key (contains asterisks)
    if (key.includes('*')) {
      showToast('Cannot copy masked key. Keys are only shown once when created.')
      return
    }
    
    navigator.clipboard.writeText(key)
    showToast('API key copied to clipboard')
  }

  const handleCopyNewKey = () => {
    if (newlyCreatedKey) {
      navigator.clipboard.writeText(newlyCreatedKey)
      setCopiedNewKey(true)
      setTimeout(() => setCopiedNewKey(false), 2000)
    }
  }

  const handleDeleteApiKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/api-keys?id=${keyId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        showToast('API key deleted successfully')
        fetchApiKeys() // Refresh the list
        setDeletingKeyId(null)
      } else {
        showToast('Failed to delete API key')
      }
    } catch (error) {
      console.error('Error deleting API key:', error)
      showToast('Failed to delete API key')
    }
  }

  const showToast = (message: string) => {
    setToastMessage(message)
    setShowSuccessToast(true)
    setTimeout(() => setShowSuccessToast(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Header with Generate Buttons */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-medium text-white mb-2">API Keys</h2>
          <p className="text-sm text-[#666]">
            Manage programmatic access to your Split Analytics data. Use test keys for development and live keys for production.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleCreateApiKey('test')}
            disabled={isCreatingKey}
            className="bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#333] text-white h-9 px-4 text-sm"
          >
            {isCreatingKey ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Generate Test Key'
            )}
          </Button>
          <Button
            onClick={() => handleCreateApiKey('live')}
            disabled={isCreatingKey}
            className="bg-[#333] hover:bg-[#444] border border-[#555] text-white h-9 px-4 text-sm"
          >
            {isCreatingKey ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Generate Live Key'
            )}
          </Button>
        </div>
      </div>

      {/* New Key Display */}
      {newlyCreatedKey && (
        <div className="bg-[#0a0a0a] border border-green-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3 mb-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-white font-medium">API Key Created Successfully</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  newlyCreatedKey.startsWith('split_test_') 
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                    : 'bg-green-500/10 text-green-400 border border-green-500/20'
                }`}>
                  {newlyCreatedKey.startsWith('split_test_') ? 'Test Key' : 'Live Key'}
                </span>
              </div>
              <p className="text-sm text-[#666] mb-3">
                Save this key securely. You won't be able to see it again.
              </p>
              
              <div className="flex items-center gap-2 p-3 bg-[#1a1a1a] rounded border border-[#333]">
                <code className="text-sm text-white font-mono flex-1">
                  {newlyCreatedKey}
                </code>
                <Button
                  onClick={handleCopyNewKey}
                  size="sm"
                  className="bg-[#333] hover:bg-[#444] text-white h-8 px-3 text-xs"
                >
                  {copiedNewKey ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
            <button
              onClick={() => {
                setNewlyCreatedKey(null)
                setCopiedNewKey(false)
              }}
              className="text-[#666] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Keys List */}
      {loadingKeys ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#666]" />
        </div>
      ) : apiKeys.length === 0 && !newlyCreatedKey ? (
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-8 text-center">
          <Key className="w-10 h-10 text-[#333] mx-auto mb-3" />
          <p className="text-[#666] text-sm">No API keys yet</p>
          <p className="text-xs text-[#666] mt-1">Generate your first key to get started</p>
        </div>
      ) : (
        <div className="border border-[#1a1a1a] rounded-lg divide-y divide-[#1a1a1a]">
          {/* Existing keys */}
          {apiKeys.map((apiKey) => (
            <div
              key={apiKey.id}
              className="p-4 hover:bg-[#0a0a0a] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-white text-sm font-medium">{apiKey.name}</h4>
                    {/* Key Type Badge */}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      apiKey.key.startsWith('split_test_') 
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                        : 'bg-green-500/10 text-green-400 border border-green-500/20'
                    }`}>
                      {apiKey.key.startsWith('split_test_') ? 'Test' : 'Live'}
                    </span>
                    <span className="text-xs text-[#666]">
                      Created {new Date(apiKey.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-[#666] font-mono">
                      {apiKey.key}
                    </code>
                    <button
                      onClick={() => handleCopyApiKey(apiKey.key)}
                      className="text-[#666] hover:text-white transition-colors group relative"
                      title={apiKey.key.includes('*') ? "Masked keys cannot be copied" : "Copy API key"}
                    >
                      <Copy className="w-3 h-3" />
                      {apiKey.key.includes('*') && (
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-[#1a1a1a] text-xs text-[#666] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          Keys are only shown once
                        </span>
                      )}
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setDeletingKeyId(apiKey.id)
                    setShowDeleteConfirm(true)
                  }}
                  className="text-[#666] hover:text-red-400 transition-colors p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Documentation Link */}
      <div className="text-center pt-4">
        <a
          href="https://docs.split.dev#api-keys"
          className="inline-flex items-center gap-1.5 text-xs text-[#666] hover:text-white transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          View API documentation
          <ArrowRight className="w-3 h-3" />
        </a>
      </div>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <X className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-white mb-1">Delete API Key</h3>
                    <p className="text-sm text-[#666] mb-6">
                      This action cannot be undone. This API key will be permanently deleted and any applications using it will lose access.
                    </p>
                    
                    <div className="flex gap-3 justify-end">
                      <Button
                        onClick={() => setShowDeleteConfirm(false)}
                        variant="outline"
                        className="border-[#333] hover:border-[#444] text-[#666] hover:text-white h-9 px-4 text-sm"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          if (deletingKeyId) {
                            handleDeleteApiKey(deletingKeyId)
                          }
                          setShowDeleteConfirm(false)
                        }}
                        className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 h-9 px-4 text-sm"
                      >
                        Delete Key
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 flex items-center gap-3 shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="text-white text-sm font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  )
} 
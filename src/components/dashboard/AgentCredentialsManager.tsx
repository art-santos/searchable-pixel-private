'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardTitle, 
  CardFooter 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Key, 
  Copy, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Globe,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

interface AgentCredential {
  id: string;
  domain: string;
  agent_id: string;
  created_at: string;
  is_active: boolean;
}

export default function AgentCredentialsManager() {
  const { user, supabase, loading } = useAuth()
  const [credentials, setCredentials] = useState<AgentCredential[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [domain, setDomain] = useState('')
  const [newCredentials, setNewCredentials] = useState<{agent_id: string, agent_secret: string} | null>(null)
  const [showSecret, setShowSecret] = useState(false)
  const [copySuccess, setCopySuccess] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCredentials = async () => {
      if (!supabase || !user) return
      
      try {
        const { data, error } = await supabase
          .from('agent_credentials')
          .select('id, domain, agent_id, created_at, is_active')
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('Error fetching credentials:', error)
          setError('Failed to load credentials')
          return
        }
        
        setCredentials(data || [])
      } catch (err) {
        console.error('Failed to fetch credentials:', err)
        setError('Failed to load credentials')
      } finally {
        setIsLoading(false)
      }
    }
    
    if (user && supabase) {
      fetchCredentials()
    } else {
      setIsLoading(false)
    }
  }, [user, supabase])

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopySuccess(`${type} copied!`)
    setTimeout(() => setCopySuccess(''), 2000)
  }

  const generateCredentials = async () => {
    if (!domain) {
      setError('Please enter a domain')
      return
    }
    
    setIsGenerating(true)
    setError('')
    
    try {
      const response = await fetch('/api/agent-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate credentials')
      }
      
      setNewCredentials({
        agent_id: data.agent_id,
        agent_secret: data.agent_secret,
      })
      
      // Refresh the credentials list
      if (supabase && user) {
        const { data: freshData } = await supabase
          .from('agent_credentials')
          .select('id, domain, agent_id, created_at, is_active')
          .order('created_at', { ascending: false })
        
        if (freshData) {
          setCredentials(freshData)
        }
      }
    } catch (err: any) {
      console.error('Error generating credentials:', err)
      setError(err.message || 'Failed to generate credentials')
    } finally {
      setIsGenerating(false)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-white" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[#101010] border-[#222222] border shadow-md">
        <CardHeader className="border-b border-[#222222]/50 pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium text-white">API Credentials</CardTitle>
            <Badge 
              className="bg-transparent border border-[#FF914D] text-white h-7 px-3"
              style={{
                background: "linear-gradient(to bottom, rgba(255, 145, 77, 0.3), rgba(255, 236, 159, 0.3))"
              }}
            >
              Development
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Generate new credentials */}
          <div className="mb-8 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-white mb-2">Generate New Credentials</h3>
              <p className="text-xs text-gray-400 mb-4">
                Create new agent credentials for your domain. These will be used to authenticate webhook requests.
              </p>
            </div>
            
            <div className="flex gap-3">
              <Input
                type="text"
                placeholder="example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="bg-[#171717] border-[#333333] text-white placeholder:text-gray-500 focus:border-[#FF914D]/70 focus:ring-[#FF914D]/20"
              />
              <Button 
                className="bg-gradient-to-r from-[#222222] to-[#2a2a2a] text-white hover:from-[#282828] hover:to-[#333333] border border-[#333333]"
                onClick={generateCredentials}
                disabled={isGenerating || !domain}
              >
                {isGenerating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Key className="h-4 w-4 mr-2" />
                )}
                Generate
              </Button>
            </div>
            
            {error && (
              <div className="flex items-center text-red-400 text-xs gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* New credentials display */}
          <AnimatePresence>
            {newCredentials && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-[#171717] border border-white/10 rounded-lg p-4 mb-6"
              >
                <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <span>New Credentials</span>
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                    Generated
                  </Badge>
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-400">Agent ID</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2 text-xs text-gray-400 hover:text-white hover:bg-[#222222]"
                        onClick={() => copyToClipboard(newCredentials.agent_id, 'Agent ID')}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <div className="bg-[#0c0c0c] rounded p-2 text-xs font-mono text-white overflow-x-auto">
                      {newCredentials.agent_id}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-400">Agent Secret</span>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-xs text-gray-400 hover:text-white hover:bg-[#222222]"
                          onClick={() => setShowSecret(!showSecret)}
                        >
                          {showSecret ? 'Hide' : 'Show'}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-xs text-gray-400 hover:text-white hover:bg-[#222222]"
                          onClick={() => copyToClipboard(newCredentials.agent_secret, 'Agent Secret')}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                    </div>
                    <div className="bg-[#0c0c0c] rounded p-2 text-xs font-mono text-white overflow-x-auto">
                      {showSecret ? newCredentials.agent_secret : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                    </div>
                  </div>
                  
                  {copySuccess && (
                    <div className="flex items-center text-green-400 text-xs gap-1 mt-2">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>{copySuccess}</span>
                    </div>
                  )}
                  
                  <div className="pt-2">
                    <p className="text-xs text-amber-400/90 flex items-start gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <span>
                        Save these credentials now. The secret will not be displayed again and cannot be retrieved later.
                      </span>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Existing credentials list */}
          <div>
            <h3 className="text-sm font-medium text-white mb-4">Your Credentials</h3>
            
            {credentials.length === 0 ? (
              <div className="bg-[#171717] border border-[#222222] rounded-lg p-6 flex flex-col items-center justify-center text-center">
                <Globe className="h-10 w-10 text-gray-500 mb-2" />
                <p className="text-gray-300 font-medium">No credentials yet</p>
                <p className="text-xs text-gray-400 mt-1 mb-4">Generate your first agent credentials to get started</p>
                <Button 
                  variant="outline"
                  size="sm"
                  className="border-[#333333] bg-[#222222] text-white hover:bg-[#282828]"
                  onClick={() => document.getElementById('domain-input')?.focus()}
                >
                  Create Credentials
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {credentials.map((cred) => (
                  <div 
                    key={cred.id}
                    className="bg-[#171717] border border-[#222222] rounded-lg p-4 flex justify-between items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium">{cred.domain}</span>
                        {cred.is_active ? (
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30 text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">ID: {cred.agent_id.slice(0, 8)}...</span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-400">
                          Created: {new Date(cred.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2 text-xs text-gray-400 hover:text-white hover:bg-[#222222]"
                      onClick={() => copyToClipboard(cred.agent_id, 'Agent ID')}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      Copy ID
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Installation Instructions Card */}
      <Card className="bg-[#101010] border-[#222222] border shadow-md">
        <CardHeader className="border-b border-[#222222]/50 pb-4">
          <CardTitle className="text-lg font-medium text-white">How to Use</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-white mb-2">Using the CLI</h3>
              <p className="text-xs text-gray-400 mb-2">
                Use our CLI tool to quickly connect your site to Split:
              </p>
              <div className="bg-[#0c0c0c] rounded p-3 font-mono text-xs text-white overflow-x-auto">
                npx create-split
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-white mb-2">Manual Setup</h3>
              <p className="text-xs text-gray-400 mb-2">
                Add these credentials to your Next.js project's .env.local file:
              </p>
              <div className="bg-[#0c0c0c] rounded p-3 font-mono text-xs text-white overflow-x-auto">
                SPLIT_AGENT_ID=your_agent_id<br/>
                SPLIT_AGENT_SECRET=your_agent_secret
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/AuthContext'

interface ApiKey {
  id: string
  name: string
  key: string
  created_at: string
  user_id: string
}

export default function AgentCredentialsManager() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchApiKeys()
    }
  }, [user])

  const fetchApiKeys = async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }
      
      setApiKeys(data || [])
    } catch (error: any) {
      console.error('Error fetching API keys:', error.message)
      toast({
        title: 'Error',
        description: 'Failed to fetch API keys: ' + error.message,
        variant: 'destructive',
      })
    }
  }

  const generateApiKey = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to generate API keys',
        variant: 'destructive',
      })
      return
    }

    if (!supabase) {
      toast({
        title: 'Error',
        description: 'Database connection is not available',
        variant: 'destructive',
      })
      return
    }

    if (!newKeyName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a name for the API key',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const newKey = crypto.randomUUID()
      const { error } = await supabase
        .from('api_keys')
        .insert([
          {
            name: newKeyName.trim(),
            key: newKey,
            user_id: user.id
          },
        ])

      if (error) throw error

      toast({
        title: 'Success',
        description: 'API key generated successfully',
      })
      
      setNewKeyName('')
      await fetchApiKeys()
    } catch (error: any) {
      console.error('Error generating API key:', error.message)
      toast({
        title: 'Error',
        description: 'Failed to generate API key: ' + error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteApiKey = async (id: string) => {
    if (!user) return
    
    if (!supabase) {
      toast({
        title: 'Error',
        description: 'Database connection is not available',
        variant: 'destructive',
      })
      return
    }

    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'API key deleted successfully',
      })
      
      await fetchApiKeys()
    } catch (error: any) {
      console.error('Error deleting API key:', error.message)
      toast({
        title: 'Error',
        description: 'Failed to delete API key: ' + error.message,
        variant: 'destructive',
      })
    }
  }

  if (!user) {
    return (
      <Alert>
        <AlertTitle>Authentication Required</AlertTitle>
        <AlertDescription>
          Please log in to manage your API keys.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Enter key name"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          className="bg-[#222222] border-[#333333] text-white placeholder:text-gray-500 focus-visible:ring-gray-500"
        />
        <Button 
          onClick={generateApiKey} 
          disabled={loading}
          className="bg-[#333333] hover:bg-[#444444] text-white"
        >
          Generate New Key
        </Button>
      </div>

      <div className="space-y-2">
        {apiKeys.map((key) => (
          <Alert key={key.id} className="bg-[#222222] border-[#333333]">
            <AlertTitle className="flex items-center justify-between text-white">
              {key.name}
              <Button
                onClick={() => deleteApiKey(key.id)}
                className="bg-red-900/30 hover:bg-red-900/50 text-red-400 border-red-800/50"
                size="sm"
              >
                Delete
              </Button>
            </AlertTitle>
            <AlertDescription className="font-mono mt-2 text-gray-400">
              {key.key}
            </AlertDescription>
          </Alert>
        ))}
      </div>
    </div>
  )
} 
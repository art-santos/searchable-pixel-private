'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, Settings, Key, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import WorkspaceApiKeys from './components/WorkspaceApiKeys'
import { WorkspaceSettings } from '@/app/api/workspaces/[workspaceId]/settings/route'

export default function WorkspaceSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const workspaceId = params.workspaceId as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [workspace, setWorkspace] = useState<any>(null)
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null)
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    fetchWorkspaceAndSettings()
  }, [workspaceId])

  const fetchWorkspaceAndSettings = async () => {
    try {
      setLoading(true)
      
      // Fetch workspace details
      const workspaceRes = await fetch(`/api/workspaces/${workspaceId}`)
      if (!workspaceRes.ok) {
        throw new Error('Failed to fetch workspace')
      }
      const workspaceData = await workspaceRes.json()
      setWorkspace(workspaceData.workspace)
      
      // Fetch settings
      const settingsRes = await fetch(`/api/workspaces/${workspaceId}/settings`)
      if (!settingsRes.ok) {
        throw new Error('Failed to fetch settings')
      }
      const settingsData = await settingsRes.json()
      setSettings(settingsData.settings)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load workspace settings',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!settings) return
    
    try {
      setSaving(true)
      const response = await fetch(`/api/workspaces/${workspaceId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      })
      
      if (!response.ok) {
        throw new Error('Failed to save settings')
      }
      
      toast({
        title: 'Success',
        description: 'Settings saved successfully'
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (path: string, value: any) => {
    if (!settings) return
    
    const newSettings = { ...settings }
    const keys = path.split('.')
    let current: any = newSettings
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]]
    }
    
    current[keys[keys.length - 1]] = value
    setSettings(newSettings)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="mb-4 text-gray-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">
            {workspace?.workspace_name || 'Workspace'} Settings
          </h1>
          <p className="text-gray-400">
            Manage settings and API keys for {workspace?.domain || 'this workspace'}
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-900 border border-gray-800">
            <TabsTrigger value="general" className="data-[state=active]:bg-gray-800">
              <Settings className="w-4 h-4 mr-2" />
              General Settings
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="data-[state=active]:bg-gray-800">
              <Key className="w-4 h-4 mr-2" />
              API Keys
            </TabsTrigger>
          </TabsList>

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-6">
            {settings && (
              <>
                {/* Crawler Tracking */}
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h3 className="text-lg font-semibold mb-4">Crawler Tracking</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="crawler-tracking">Enable Crawler Tracking</Label>
                        <p className="text-sm text-gray-400">Track AI crawler visits to your site</p>
                      </div>
                      <Switch
                        id="crawler-tracking"
                        checked={settings.crawler_tracking.enabled}
                        onCheckedChange={(checked) => updateSetting('crawler_tracking.enabled', checked)}
                      />
                    </div>
                  </div>
                </div>

                {/* Data Retention */}
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h3 className="text-lg font-semibold mb-4">Data Retention</h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="crawler-logs-days">Crawler Logs Retention (days)</Label>
                      <Input
                        id="crawler-logs-days"
                        type="number"
                        min="7"
                        max="365"
                        value={settings.data_retention.crawler_logs_days}
                        onChange={(e) => updateSetting('data_retention.crawler_logs_days', parseInt(e.target.value))}
                        className="mt-1 bg-gray-800 border-gray-700"
                      />
                      <p className="text-xs text-gray-400 mt-1">Between 7 and 365 days</p>
                    </div>
                    
                    <div>
                      <Label htmlFor="max-visibility-days">Max Visibility Data Retention (days)</Label>
                      <Input
                        id="max-visibility-days"
                        type="number"
                        min="30"
                        max="730"
                        value={settings.data_retention.max_visibility_days}
                        onChange={(e) => updateSetting('data_retention.max_visibility_days', parseInt(e.target.value))}
                        className="mt-1 bg-gray-800 border-gray-700"
                      />
                      <p className="text-xs text-gray-400 mt-1">Between 30 and 730 days</p>
                    </div>
                  </div>
                </div>

                {/* API Rate Limits */}
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h3 className="text-lg font-semibold mb-4">API Rate Limits</h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="requests-per-minute">Requests per Minute</Label>
                      <Input
                        id="requests-per-minute"
                        type="number"
                        min="1"
                        max="1000"
                        value={settings.api_limits.requests_per_minute}
                        onChange={(e) => updateSetting('api_limits.requests_per_minute', parseInt(e.target.value))}
                        className="mt-1 bg-gray-800 border-gray-700"
                      />
                      <p className="text-xs text-gray-400 mt-1">Between 1 and 1,000</p>
                    </div>
                    
                    <div>
                      <Label htmlFor="requests-per-day">Requests per Day</Label>
                      <Input
                        id="requests-per-day"
                        type="number"
                        min="100"
                        max="1000000"
                        value={settings.api_limits.requests_per_day}
                        onChange={(e) => updateSetting('api_limits.requests_per_day', parseInt(e.target.value))}
                        className="mt-1 bg-gray-800 border-gray-700"
                      />
                      <p className="text-xs text-gray-400 mt-1">Between 100 and 1,000,000</p>
                    </div>
                  </div>
                </div>

                {/* Notifications */}
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h3 className="text-lg font-semibold mb-4">Notifications</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="email-alerts">Email Alerts</Label>
                        <p className="text-sm text-gray-400">Receive email notifications for important events</p>
                      </div>
                      <Switch
                        id="email-alerts"
                        checked={settings.notifications.email_alerts}
                        onCheckedChange={(checked) => updateSetting('notifications.email_alerts', checked)}
                      />
                    </div>
                    
                    {settings.notifications.email_alerts && (
                      <div>
                        <Label htmlFor="webhook-url">Webhook URL (optional)</Label>
                        <Input
                          id="webhook-url"
                          type="url"
                          placeholder="https://your-webhook-endpoint.com"
                          value={settings.notifications.webhook_url || ''}
                          onChange={(e) => updateSetting('notifications.webhook_url', e.target.value)}
                          className="mt-1 bg-gray-800 border-gray-700"
                        />
                        <p className="text-xs text-gray-400 mt-1">Receive webhook notifications for events</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={saveSettings}
                    disabled={saving}
                    className="bg-white text-black hover:bg-gray-200"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Settings
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api-keys">
            <WorkspaceApiKeys workspaceId={workspaceId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 
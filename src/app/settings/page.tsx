'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Settings,
  Globe, 
  RefreshCw, 
  UserPlus, 
  CheckCircle2, 
  XCircle,
  Link as LinkIcon,
  ExternalLink,
  FileText,
  Code,
  ToggleRight,
  Users,
  Mail,
  Lock,
  Save,
  AlertTriangle,
  Info,
  Key
} from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import AgentCredentialsManager from '@/components/dashboard/AgentCredentialsManager'

export default function SettingsPage() {
  const [siteUrl, setSiteUrl] = useState('https://yoursitename.com')
  const [cmsType, setCmsType] = useState('Webflow')
  const [isConnected, setIsConnected] = useState(true)
  
  // Toggle states
  const [autoPublish, setAutoPublish] = useState(true)
  const [autoSitemap, setAutoSitemap] = useState(true)
  const [structuredData, setStructuredData] = useState(true)
  
  // Team members
  const teamMembers = [
    { id: 1, name: 'Jane Smith', email: 'jane@example.com', role: 'Admin', pending: false },
    { id: 2, name: 'John Doe', email: 'john@example.com', role: 'Editor', pending: false },
    { id: 3, name: 'Alex Johnson', email: 'alex@example.com', role: 'Viewer', pending: true }
  ]
  
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState('Viewer')
  
  const handleReconnect = () => {
    // Simulate reconnection
    setIsConnected(false)
    setTimeout(() => {
      setIsConnected(true)
    }, 1500)
  }
  
  const handleToggle = (setting: string, value: boolean) => {
    switch(setting) {
      case 'autoPublish':
        setAutoPublish(value)
        break
      case 'autoSitemap':
        setAutoSitemap(value)
        break
      case 'structuredData':
        setStructuredData(value)
        break
    }
  }
  
  const handleInvite = () => {
    if (!newEmail.trim()) return
    // Would normally add a new team member here
    setNewEmail('')
  }
  
  return (
    <main className="flex flex-1 flex-col gap-8 p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-400">Configure your AEO Agent and manage site connections</p>
        </div>
        
        <Button 
          className="flex items-center gap-2 self-start md:self-auto bg-[#333333] hover:bg-[#444444] text-white"
        >
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>
      
      <Tabs defaultValue="site" className="w-full">
        <TabsList className="bg-[#222222] border border-[#333333] mb-6">
          <TabsTrigger value="site" className="data-[state=active]:bg-[#333333] text-white">
            Site Connection
          </TabsTrigger>
          <TabsTrigger value="agent" className="data-[state=active]:bg-[#333333] text-white">
            AEO Agent Controls
          </TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-[#333333] text-white">
            Team Access
          </TabsTrigger>
          <TabsTrigger value="api" className="data-[state=active]:bg-[#333333] text-white">
            API Keys
          </TabsTrigger>
        </TabsList>
        
        {/* Site Connection Tab */}
        <TabsContent value="site">
          <Card className="border-[#333333]">
            <CardHeader>
              <CardTitle className="text-xl font-medium text-white">
                Site Connection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between py-4 border-b border-[#222222]">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-white">Connected Website</p>
                    <p className="text-sm text-gray-400">{siteUrl}</p>
                  </div>
                </div>
                <Button 
                  className="bg-[#333333] hover:bg-[#444444] text-white"
                  onClick={() => setSiteUrl(prompt('Enter site URL', siteUrl) || siteUrl)}
                >
                  Edit
                </Button>
              </div>
              
              <div className="flex items-center justify-between py-4 border-b border-[#222222]">
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-white">CMS Platform</p>
                    <p className="text-sm text-gray-400">{cmsType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative inline-flex items-center rounded-md bg-[#1a1a1a] p-1 text-sm font-medium">
                    {['Webflow', 'Next.js', 'Framer'].map((cms) => (
                      <button
                        key={cms}
                        type="button"
                        className={`relative rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                          cmsType === cms 
                            ? 'bg-[#333333] text-white' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                        onClick={() => setCmsType(cms)}
                      >
                        {cms}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-white">Connection Status</p>
                    <p className="text-sm text-gray-400">Last verified: June 15, 2023</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge 
                    variant="outline" 
                    className={isConnected 
                      ? "bg-green-900/30 text-green-400 border-green-800/50 flex items-center gap-1.5" 
                      : "bg-red-900/30 text-red-400 border-red-800/50 flex items-center gap-1.5"
                    }
                  >
                    {isConnected ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        Connected
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3" />
                        Disconnected
                      </>
                    )}
                  </Badge>
                  <Button 
                    className="bg-[#333333] hover:bg-[#444444] text-white flex items-center gap-1.5"
                    onClick={handleReconnect}
                    disabled={!isConnected}
                  >
                    <RefreshCw className="h-4 w-4" />
                    {isConnected ? 'Refresh' : 'Connecting...'}
                  </Button>
                </div>
              </div>
              
              <div className="pt-4 border-t border-[#222222]">
                <h3 className="text-sm font-medium text-white mb-4">Integration Methods</h3>
                <div className="space-y-4">
                  <div className="rounded-md border border-[#333333] p-4 hover:bg-[#222222] cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-[#333333] text-white border-[#444444]">Recommended</Badge>
                        </div>
                        <h4 className="font-medium text-white mb-1">API Integration</h4>
                        <p className="text-sm text-gray-400">Connect your CMS via API for full automation capabilities</p>
                      </div>
                      <Button 
                        className="bg-[#333333] hover:bg-[#444444] text-white"
                      >
                        Configure
                      </Button>
                    </div>
                  </div>
                  
                  <div className="rounded-md border border-[#333333] p-4 hover:bg-[#222222] cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-white mb-1">JavaScript Snippet</h4>
                        <p className="text-sm text-gray-400">Add our script to your site's header for basic tracking</p>
                      </div>
                      <Button 
                        className="bg-[#333333] hover:bg-[#444444] text-white"
                      >
                        Copy Code
                      </Button>
                    </div>
                  </div>
                  
                  <div className="rounded-md border border-[#333333] p-4 hover:bg-[#222222] cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-white mb-1">Manual Configuration</h4>
                        <p className="text-sm text-gray-400">Manually upload llms.txt and implement structured data</p>
                      </div>
                      <Button 
                        className="bg-[#333333] hover:bg-[#444444] text-white"
                      >
                        View Guide
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* AEO Agent Controls Tab */}
        <TabsContent value="agent">
          <Card className="border-[#333333]">
            <CardHeader>
              <CardTitle className="text-xl font-medium text-white">
                AEO Agent Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between py-4 border-b border-[#222222]">
                <div className="flex items-start gap-2">
                  <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-white">Auto-publish Content</p>
                    <p className="text-sm text-gray-400">Let the agent automatically publish generated content to your site</p>
                  </div>
                </div>
                <div 
                  className={`h-6 w-11 rounded-full transition-colors cursor-pointer flex items-center ${autoPublish ? 'bg-[#333333] justify-end' : 'bg-[#222222] justify-start'}`}
                  onClick={() => handleToggle('autoPublish', !autoPublish)}
                >
                  <div className={`h-5 w-5 rounded-full mx-0.5 ${autoPublish ? 'bg-white' : 'bg-gray-500'}`}></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-4 border-b border-[#222222]">
                <div className="flex items-start gap-2">
                  <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-white">Auto-sitemap + llms.txt</p>
                    <p className="text-sm text-gray-400">Update sitemap.xml and llms.txt with new content</p>
                  </div>
                </div>
                <div 
                  className={`h-6 w-11 rounded-full transition-colors cursor-pointer flex items-center ${autoSitemap ? 'bg-[#333333] justify-end' : 'bg-[#222222] justify-start'}`}
                  onClick={() => handleToggle('autoSitemap', !autoSitemap)}
                >
                  <div className={`h-5 w-5 rounded-full mx-0.5 ${autoSitemap ? 'bg-white' : 'bg-gray-500'}`}></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-4 border-b border-[#222222]">
                <div className="flex items-start gap-2">
                  <Code className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-white">Structured Data Injection</p>
                    <p className="text-sm text-gray-400">Add Schema.org markup to help LLMs understand your content</p>
                  </div>
                </div>
                <div 
                  className={`h-6 w-11 rounded-full transition-colors cursor-pointer flex items-center ${structuredData ? 'bg-[#333333] justify-end' : 'bg-[#222222] justify-start'}`}
                  onClick={() => handleToggle('structuredData', !structuredData)}
                >
                  <div className={`h-5 w-5 rounded-full mx-0.5 ${structuredData ? 'bg-white' : 'bg-gray-500'}`}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Team Access Tab */}
        <TabsContent value="team">
          <Card className="border-[#333333]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-medium text-white">
                Team Access
              </CardTitle>
              <Badge className="bg-[#222222] text-white border-[#333333]">
                {teamMembers.length} members
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                <Input
                  className="bg-[#222222] border-[#333333] text-white placeholder:text-gray-500 focus-visible:ring-gray-500"
                  placeholder="Add team member email..."
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
                <Button 
                  className="bg-[#333333] hover:bg-[#444444] text-white flex-shrink-0"
                  onClick={handleInvite}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Invite
                </Button>
              </div>
              
              <div className="rounded-md border border-[#333333] overflow-hidden">
                <div className="grid grid-cols-12 gap-4 bg-[#222222] px-4 py-3 text-sm font-medium text-gray-400">
                  <div className="col-span-5">User</div>
                  <div className="col-span-3">Role</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Actions</div>
                </div>
                <div className="divide-y divide-[#333333]">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-[#1a1a1a]">
                      <div className="col-span-5">
                        <p className="font-medium text-white">{member.name}</p>
                        <p className="text-xs text-gray-400">{member.email}</p>
                      </div>
                      <div className="col-span-3">
                        <Badge 
                          variant="outline" 
                          className="bg-[#222222] text-gray-300 border-[#333333]"
                        >
                          {member.role}
                        </Badge>
                      </div>
                      <div className="col-span-2">
                        {member.pending ? (
                          <Badge className="bg-yellow-900/30 text-yellow-400 border-yellow-800/50">
                            Pending
                          </Badge>
                        ) : (
                          <Badge className="bg-green-900/30 text-green-400 border-green-800/50">
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="col-span-2 flex gap-2">
                        <Button size="sm" className="bg-[#333333] hover:bg-[#444444] text-white">
                          Edit
                        </Button>
                        <Button size="sm" className="bg-[#333333] hover:bg-[#444444] text-white">
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-2 pl-1 text-xs text-gray-500">
                <div className="mb-1 font-semibold text-gray-400">Role Permissions</div>
                <div className="space-y-1">
                  <p><span className="text-white">Admin:</span> Full access to all features including billing and team management</p>
                  <p><span className="text-white">Editor:</span> Can create and edit content, but cannot manage team or billing</p>
                  <p><span className="text-white">Viewer:</span> Can view content and reports, but cannot make changes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api">
          <Card className="border-[#333333]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-gray-400" />
                <CardTitle className="text-xl font-medium text-white">
                  API Keys
                </CardTitle>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Generate and manage API keys for programmatic access to your AEO Agent
              </p>
            </CardHeader>
            <CardContent>
              <AgentCredentialsManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, X, ExternalLink, Building, MapPin, Calendar, Mail, Linkedin, Copy, CheckCircle, AlertCircle, Code, Globe, Users, TrendingUp, Activity } from 'lucide-react'
import Image from 'next/image'

interface Lead {
  id: string
  timestamp: string
  model: string
  pageVisited: string
  inferredQuery?: string
  // Individual enrichment data
  email?: string
  fullName?: string
  firstName?: string
  lastName?: string
  company?: string
  jobTitle?: string
  location?: string
  linkedinUrl?: string
  confidence: 'high' | 'medium' | 'low'
  // Additional metadata
  ipAddress?: string
  userAgent?: string
  sessionDuration?: number
  pagesViewed?: number
}

interface LeadStats {
  leadsToday: number
  topModel: string
  topModelCount: number
  mostCrawledPage: string
  topTopic: string
}

interface ConnectionStatus {
  connected: boolean
  workspace: {
    id: string
    domain: string
  }
  lastConnection: string | null
  eventCount: number
}

// Mock data for MVP - replace with actual API calls
const mockLeads: Lead[] = [
  {
    id: '1',
    timestamp: '2024-01-15T10:30:00Z',
    model: 'GPT-4o',
    pageVisited: '/pricing',
    inferredQuery: 'AI pricing for startups',
    email: 'sarah.chen@acmecorp.com',
    fullName: 'Sarah Chen',
    firstName: 'Sarah',
    lastName: 'Chen',
    company: 'Acme Corp',
    jobTitle: 'VP of Engineering',
    location: 'San Francisco, CA',
    linkedinUrl: 'https://linkedin.com/in/sarahchen',
    confidence: 'high',
    ipAddress: '198.51.100.42',
    sessionDuration: 420,
    pagesViewed: 5
  },
  {
    id: '2', 
    timestamp: '2024-01-15T10:25:00Z',
    model: 'Claude',
    pageVisited: '/blog/ai-sales',
    inferredQuery: 'Best CRM for founders',
    email: 'mike.rodriguez@techstart.io',
    fullName: 'Mike Rodriguez',
    firstName: 'Mike',
    lastName: 'Rodriguez',
    company: 'TechStart Inc',
    jobTitle: 'Founder & CEO',
    location: 'Austin, TX',
    linkedinUrl: 'https://linkedin.com/in/mikerodriguez',
    confidence: 'high',
    ipAddress: '203.0.113.15',
    sessionDuration: 180,
    pagesViewed: 3
  },
  {
    id: '3',
    timestamp: '2024-01-15T10:20:00Z',
    model: 'Perplexity',
    pageVisited: '/features',
    inferredQuery: 'AI tools comparison',
    email: 'j.smith@example.com',
    fullName: 'Jamie Smith',
    firstName: 'Jamie',
    lastName: 'Smith',
    company: 'DataFlow Solutions',
    jobTitle: 'Product Manager',
    location: 'New York, NY',
    confidence: 'medium',
    ipAddress: '192.0.2.100',
    sessionDuration: 95,
    pagesViewed: 2
  },
  {
    id: '4',
    timestamp: '2024-01-15T10:15:00Z',
    model: 'GPT-4o',
    pageVisited: '/integrations',
    inferredQuery: 'CRM integrations API',
    fullName: 'Alex Thompson',
    firstName: 'Alex',
    lastName: 'Thompson',
    company: 'Scale Ventures',
    jobTitle: 'Technical Lead',
    location: 'Seattle, WA',
    confidence: 'low',
    ipAddress: '198.51.100.200',
    sessionDuration: 320,
    pagesViewed: 4
  }
]

const mockStats: LeadStats = {
  leadsToday: 12,
  topModel: 'GPT-4o',
  topModelCount: 7,
  mostCrawledPage: '/pricing',
  topTopic: 'AI pricing'
}

export default function LeadsPage() {
  const { user } = useAuth()
  const { currentWorkspace, switching } = useWorkspace()
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<LeadStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null)
  const [checkingConnection, setCheckingConnection] = useState(false)
  const [scriptCopied, setScriptCopied] = useState(false)
  const [testingTracking, setTestingTracking] = useState(false)

  // Check connection status
  const checkConnection = async () => {
    if (!currentWorkspace?.id) return
    
    setCheckingConnection(true)
    try {
      const response = await fetch(`/api/tracking/status?workspace=${currentWorkspace.id}`)
      if (response.ok) {
        const data = await response.json()
        setConnectionStatus(data)
      }
    } catch (error) {
      console.error('Error checking connection:', error)
    } finally {
      setCheckingConnection(false)
    }
  }

  // Fetch leads data (will only run if connected)
  const fetchLeads = async () => {
    if (!connectionStatus?.connected) return
    
    setLoading(true)
    try {
      // TODO: Replace with actual API call that fetches real visitor data
      // For now, we'll show empty state until real data is flowing
      setLeads([])
      setStats(null)
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  // Copy tracking script to clipboard
  const copyTrackingScript = async () => {
    if (!currentWorkspace?.id) return
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const script = `<script src="${baseUrl.replace(/\/$/, '')}/api/tracking/script?workspace=${currentWorkspace.id}"></script>`
    
    try {
      await navigator.clipboard.writeText(script)
      setScriptCopied(true)
      setTimeout(() => setScriptCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy script:', error)
    }
  }

  // Test tracking without installing script
  const testTrackingNow = async () => {
    if (!currentWorkspace?.id) return
    
    setTestingTracking(true)
    try {
      const response = await fetch('/api/tracking/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId: currentWorkspace.id
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Test tracking successful:', data)
        
        // Refresh connection status after test
        setTimeout(() => {
          checkConnection()
        }, 1000)
      } else {
        console.error('Test tracking failed:', await response.text())
      }
    } catch (error) {
      console.error('Test tracking error:', error)
    } finally {
      setTestingTracking(false)
    }
  }

  useEffect(() => {
    if (user && currentWorkspace) {
      checkConnection()
    }
  }, [user, currentWorkspace])

  useEffect(() => {
    if (connectionStatus?.connected) {
      fetchLeads()
    }
  }, [connectionStatus])

  // Format relative time
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diff = now.getTime() - time.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
    
    const days = Math.floor(hours / 24)
    return `${days} ${days === 1 ? 'day' : 'days'} ago`
  }

  // Get model logo and styling
  const getModelInfo = (model: string) => {
    const modelConfig = {
      'GPT-4o': { logo: '/images/chatgpt.svg', name: 'ChatGPT' },
      'Claude': { logo: '/images/claude.svg', name: 'Claude' },
      'Perplexity': { logo: '/images/perplexity.svg', name: 'Perplexity' },
      'Gemini': { logo: '/images/chatgpt.svg', name: 'Gemini' } // Fallback to ChatGPT logo
    }
    
    return modelConfig[model as keyof typeof modelConfig] || {
      logo: '/images/chatgpt.svg',
      name: model
    }
  }

  // Get confidence badge styling (only green variations)
  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return { bg: 'bg-green-600/20', text: 'text-green-400' }
      case 'medium':
        return { bg: 'bg-green-600/10', text: 'text-green-500' }
      case 'low':
        return { bg: 'bg-gray-600/20', text: 'text-gray-400' }
      default:
        return { bg: 'bg-gray-600/20', text: 'text-gray-400' }
    }
  }

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead)
  }

  const handleCloseDrawer = () => {
    setSelectedLead(null)
  }

  return (
    <main className="min-h-screen bg-[#0c0c0c] pl-6 pr-4 md:pr-6 lg:pr-8 pb-8 md:pb-12">
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <div className="mb-6 md:mb-8 pt-6">
          <h1 className="text-xl md:text-2xl font-medium text-white mb-2">Visitor Intelligence</h1>
          <p className="text-[#666] text-sm">Identify and track companies visiting your website in real-time.</p>
        </div>

        {/* Connection Status or Leads Content */}
        {switching ? (
          <Card className="bg-[#1a1a1a] border-[#222222]">
            <CardContent className="p-0">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto mb-3">
                    <img 
                      src="/images/split-icon-white.svg" 
                      alt="Split" 
                      className="w-full h-full animate-spin"
                      style={{ animation: 'spin 1s linear infinite' }}
                    />
                  </div>
                  <p className="text-[#666] text-sm">Switching workspace...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : checkingConnection ? (
          <Card className="bg-[#1a1a1a] border-[#222222]">
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#666] mx-auto mb-3" />
                <p className="text-[#666] text-sm">Checking connection status...</p>
              </div>
            </CardContent>
          </Card>
        ) : !connectionStatus?.connected ? (
          <Card className="bg-[#1a1a1a] border-[#222222]">
            <CardContent className="p-8">
              <div className="max-w-3xl mx-auto text-center">
                {/* Header */}
                <div className="mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-[#222222] rounded-full flex items-center justify-center">
                    <Code className="w-8 h-8 text-[#666]" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Connect Your Website</h2>
                  <p className="text-[#666] text-lg">
                    Add our tracking script to start identifying and enriching your website visitors
                  </p>
                </div>

                {/* Benefits */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-green-400" />
                    </div>
                    <h3 className="text-white font-medium mb-1">Visitor Identification</h3>
                    <p className="text-[#666] text-sm">Identify companies visiting your website in real-time</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <Building className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-white font-medium mb-1">Company Enrichment</h3>
                    <p className="text-[#666] text-sm">Get detailed company data and contact information</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-purple-500/10 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-white font-medium mb-1">Lead Intelligence</h3>
                    <p className="text-[#666] text-sm">Track visitor behavior and engagement patterns</p>
                  </div>
                </div>

                {/* Installation Instructions */}
                <div className="bg-[#0c0c0c] border border-[#333333] rounded-lg p-6 mb-6">
                  <div className="text-left">
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                      <span className="bg-green-500/20 text-green-400 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                      Copy the tracking script
                    </h3>
                    <div className="bg-[#1a1a1a] border border-[#333333] rounded p-4 mb-4 overflow-x-auto">
                      <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap break-all">
                        {currentWorkspace ? 
                          `<script src="${(process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '')}/api/tracking/script?workspace=${currentWorkspace.id}"></script>`
                          : 'Loading...'
                        }
                      </pre>
                    </div>
                    <Button 
                      onClick={copyTrackingScript}
                      disabled={!currentWorkspace}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      {scriptCopied ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Script
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="bg-[#0c0c0c] border border-[#333333] rounded-lg p-6 mb-6">
                  <div className="text-left">
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                      <span className="bg-green-500/20 text-green-400 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                      Add to your website
                    </h3>
                    <p className="text-[#666] mb-4">
                      Paste the script into the <code className="bg-[#1a1a1a] px-2 py-1 rounded text-green-400">&lt;head&gt;</code> section of your website, just before the closing <code className="bg-[#1a1a1a] px-2 py-1 rounded text-green-400">&lt;/head&gt;</code> tag.
                    </p>
                    <div className="text-[#666] text-sm space-y-2">
                      <p><strong className="text-white">For HTML sites:</strong> Add directly to your HTML template</p>
                      <p><strong className="text-white">For WordPress:</strong> Use a header/footer plugin or theme editor</p>
                      <p><strong className="text-white">For React/Next.js:</strong> Add to your _document.js or layout component</p>
                      <p><strong className="text-white">For other platforms:</strong> Check your platform's documentation for adding custom scripts</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0c0c0c] border border-[#333333] rounded-lg p-6">
                  <div className="text-left">
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                      <span className="bg-green-500/20 text-green-400 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                      Test or verify connection
                    </h3>
                    <p className="text-[#666] mb-4">
                      You can test the tracking system directly from the dashboard, or after installing the script, visit your website to verify it's working.
                    </p>
                    
                    <div className="space-y-3">
                      {/* Test Now Button */}
                      <Button 
                        onClick={testTrackingNow}
                        disabled={testingTracking}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {testingTracking ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <Activity className="w-4 h-4 mr-2" />
                            Test Tracking Now
                          </>
                        )}
                      </Button>
                      
                      {/* Check Connection Button */}
                      <Button 
                        onClick={checkConnection}
                        disabled={checkingConnection}
                        variant="outline"
                        className="w-full"
                      >
                        {checkingConnection ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Checking...
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Check Connection Status
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <div className="mt-4 text-sm text-[#666]">
                      <p><strong className="text-white">Test Now:</strong> Simulates a visitor to test the system</p>
                      <p><strong className="text-white">Check Status:</strong> Verifies if real tracking is working</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Connected State - Show Dashboard */
          <>
            {/* Connection Status Banner */}
            <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div className="flex-1">
                  <p className="text-green-400 font-medium">Tracking Connected</p>
                  <p className="text-green-300/70 text-sm">
                    {connectionStatus.eventCount} events tracked • Last activity: {connectionStatus.lastConnection ? formatRelativeTime(connectionStatus.lastConnection) : 'Never'}
                  </p>
                </div>
                <Button 
                  onClick={checkConnection}
                  disabled={checkingConnection}
                  variant="outline"
                  size="sm"
                  className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                >
                  {checkingConnection ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
                </Button>
              </div>
            </div>

            {/* Stats Bar */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#1a1a1a] border border-[#222222] rounded-lg px-4 py-3">
                  <div className="text-sm text-[#666] mb-1">Visitors Today</div>
                  <div className="text-white font-medium">{stats.leadsToday}</div>
                </div>
                
                <div className="bg-[#1a1a1a] border border-[#222222] rounded-lg px-4 py-3">
                  <div className="text-sm text-[#666] mb-1">Top Company</div>
                  <div className="text-white font-medium">{stats.topModel}</div>
                </div>
                
                <div className="bg-[#1a1a1a] border border-[#222222] rounded-lg px-4 py-3">
                  <div className="text-sm text-[#666] mb-1">Most Visited Page</div>
                  <div className="text-white font-medium">{stats.mostCrawledPage}</div>
                </div>
                
                <div className="bg-[#1a1a1a] border border-[#222222] rounded-lg px-4 py-3">
                  <div className="text-sm text-[#666] mb-1">Active Sessions</div>
                  <div className="text-white font-medium">Live</div>
                </div>
              </div>
            )}

            {/* Leads Table */}
            <Card className="bg-[#1a1a1a] border-[#222222]">
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-6 h-6 animate-spin text-[#666]" />
                  </div>
                ) : leads.length === 0 ? (
                  /* Empty State */
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center max-w-sm">
                      <div className="w-16 h-16 mx-auto mb-4 grid grid-cols-4 gap-1 opacity-40">
                        {[...Array(16)].map((_, i) => (
                          <div key={i} className="w-3 h-3 bg-[#333] rounded-sm" />
                        ))}
                      </div>
                      <h4 className="text-white font-medium mb-2">No visitors yet</h4>
                      <p className="text-[#666] text-sm leading-relaxed">
                        Visitors will appear here once your tracking script starts collecting data from your website.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Leads Table */
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-[#222222]">
                        <tr>
                          <th className="text-left py-3 px-4 text-xs font-medium text-[#666] uppercase tracking-wider">Time</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-[#666] uppercase tracking-wider">Location</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-[#666] uppercase tracking-wider">Company</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-[#666] uppercase tracking-wider">Page</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-[#666] uppercase tracking-wider">Device</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-[#666] uppercase tracking-wider">IP Address</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads.map((lead, index) => {
                          return (
                            <motion.tr
                              key={lead.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="border-b border-[#222222] hover:bg-[#1f2029] transition-colors cursor-pointer"
                              onClick={() => handleLeadClick(lead)}
                            >
                              <td className="py-3 px-4 text-sm text-[#666]">
                                {formatRelativeTime(lead.timestamp)}
                              </td>
                              
                              <td className="py-3 px-4">
                                <div className="text-sm text-white">
                                  {lead.location || 'Unknown'}
                                </div>
                              </td>
                              
                              <td className="py-3 px-4">
                                <div>
                                  <div className="text-sm text-white font-medium">
                                    {lead.company || 'Unknown Company'}
                                  </div>
                                  {lead.confidence && (
                                    <div className="text-xs text-[#666]">{lead.confidence} confidence</div>
                                  )}
                                </div>
                              </td>
                              
                              <td className="py-3 px-4 text-sm text-[#888] font-mono">
                                {lead.pageVisited}
                              </td>
                              
                              <td className="py-3 px-4 text-sm text-[#d1d1d6]">
                                <div className="text-sm text-white">
                                  Desktop
                                </div>
                              </td>
                              
                              <td className="py-3 px-4">
                                <code className="text-xs text-[#666] font-mono">
                                  {lead.ipAddress || 'Unknown'}
                                </code>
                              </td>
                            </motion.tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Workspace Switching Overlay */}
      {switching && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          style={{ pointerEvents: 'all' }}
        >
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4" style={{ perspective: '300px' }}>
              <div 
                className="w-full h-full workspace-flip-animation"
                style={{ 
                  transformStyle: 'preserve-3d'
                }}
              >
                <img 
                  src="/images/split-icon-white.svg" 
                  alt="Split" 
                  className="w-full h-full"
                />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Switching workspace...</h2>
            <p className="text-[#888] text-sm">Loading your workspace data</p>
          </div>
        </motion.div>
      )}

      <style jsx global>{`
        @keyframes workspaceFlip {
          0% { transform: rotateY(0deg); }
          25% { transform: rotateY(90deg); }
          50% { transform: rotateY(180deg); }
          75% { transform: rotateY(270deg); }
          100% { transform: rotateY(360deg); }
        }
        
        .workspace-flip-animation {
          animation: workspaceFlip 2s cubic-bezier(0.4, 0.0, 0.2, 1) infinite;
        }
      `}</style>
    </main>
  )
} 
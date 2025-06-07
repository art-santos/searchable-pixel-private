'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, X, ExternalLink, Building, MapPin, Calendar, Mail, Linkedin } from 'lucide-react'
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
  const { switching } = useWorkspace()
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<LeadStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  // Fetch leads data
  const fetchLeads = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/leads')
      // const data = await response.json()
      
      // Using mock data for MVP
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API delay
      setLeads(mockLeads)
      setStats(mockStats)
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchLeads()
    }
  }, [user])

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
          <h1 className="text-xl md:text-2xl font-medium text-white mb-2">Leads</h1>
          <p className="text-[#666] text-sm">AI-attributed visitors enriched from model crawls. Updated in real time.</p>
        </div>

        {/* Stats Bar */}
        {stats && !loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#1a1a1a] border border-[#222222] rounded-lg px-4 py-3">
              <div className="text-sm text-[#666] mb-1">Leads Today</div>
              <div className="text-white font-medium">{stats.leadsToday}</div>
            </div>
            
            <div className="bg-[#1a1a1a] border border-[#222222] rounded-lg px-4 py-3">
              <div className="text-sm text-[#666] mb-1">Top Model</div>
              <div className="text-white font-medium">{stats.topModel} ({stats.topModelCount})</div>
            </div>
            
            <div className="bg-[#1a1a1a] border border-[#222222] rounded-lg px-4 py-3">
              <div className="text-sm text-[#666] mb-1">Most Crawled Page</div>
              <div className="text-white font-medium">{stats.mostCrawledPage}</div>
            </div>
            
            <div className="bg-[#1a1a1a] border border-[#222222] rounded-lg px-4 py-3">
              <div className="text-sm text-[#666] mb-1">Top Topic</div>
              <div className="text-white font-medium">"{stats.topTopic}"</div>
            </div>
          </div>
        )}

        {/* Leads Table */}
        <Card className="bg-[#1a1a1a] border-[#222222]">
          <CardContent className="p-0">
            {switching ? (
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
            ) : loading ? (
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
                  <h4 className="text-white font-medium mb-2">No LLM leads yet</h4>
                  <p className="text-[#666] text-sm leading-relaxed">
                    Once AI models like ChatGPT or Perplexity visit your site and we detect attribution data, you'll see them here.
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
                      <th className="text-left py-3 px-4 text-xs font-medium text-[#666] uppercase tracking-wider">Model</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-[#666] uppercase tracking-wider">Visitor</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-[#666] uppercase tracking-wider">Page</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-[#666] uppercase tracking-wider">Query</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-[#666] uppercase tracking-wider">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead, index) => {
                      const modelInfo = getModelInfo(lead.model)
                      const confidenceBadge = getConfidenceBadge(lead.confidence)
                      
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
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 flex-shrink-0">
                                <Image
                                  src={modelInfo.logo}
                                  alt={modelInfo.name}
                                  width={20}
                                  height={20}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <span className="text-sm text-white">{modelInfo.name}</span>
                            </div>
                          </td>
                          
                          <td className="py-3 px-4">
                            <div>
                              <div className="text-sm text-white font-medium">
                                {lead.fullName || 'Anonymous'}
                              </div>
                              {lead.company && (
                                <div className="text-xs text-[#666]">{lead.company}</div>
                              )}
                            </div>
                          </td>
                          
                          <td className="py-3 px-4 text-sm text-[#888] font-mono">
                            {lead.pageVisited}
                          </td>
                          
                          <td className="py-3 px-4 text-sm text-[#d1d1d6] max-w-xs">
                            <div className="truncate">
                              {lead.inferredQuery || '—'}
                            </div>
                          </td>
                          
                          <td className="py-3 px-4">
                            <Badge className={`${confidenceBadge.bg} ${confidenceBadge.text} border-none capitalize`}>
                              {lead.confidence}
                            </Badge>
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
      </div>

      {/* Lead Detail Drawer */}
      <AnimatePresence>
        {selectedLead && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={handleCloseDrawer}
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-96 bg-[#1a1a1a] border-l border-[#222222] z-50 overflow-y-auto"
            >
              {/* Header */}
              <div className="p-6 border-b border-[#222222]">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-medium text-white mb-1">
                      {selectedLead.fullName || 'Anonymous Visitor'}
                    </h2>
                    <p className="text-sm text-[#666]">
                      {formatRelativeTime(selectedLead.timestamp)}
                    </p>
                  </div>
                  <button
                    onClick={handleCloseDrawer}
                    className="p-2 hover:bg-[#222222] rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-[#666]" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Model & Query */}
                <div>
                  <h3 className="text-sm font-medium text-white mb-3">Detection Info</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6">
                        <Image
                          src={getModelInfo(selectedLead.model).logo}
                          alt={getModelInfo(selectedLead.model).name}
                          width={24}
                          height={24}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <div className="text-sm text-white">{getModelInfo(selectedLead.model).name}</div>
                        <div className="text-xs text-[#666]">AI Model</div>
                      </div>
                    </div>
                    
                    {selectedLead.inferredQuery && (
                      <div>
                        <div className="text-xs text-[#666] mb-1">Inferred Query</div>
                        <div className="text-sm text-[#d1d1d6]">"{selectedLead.inferredQuery}"</div>
                      </div>
                    )}
                    
                    <div>
                      <div className="text-xs text-[#666] mb-1">Page Visited</div>
                      <div className="text-sm text-white font-mono">{selectedLead.pageVisited}</div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-[#666] mb-1">Confidence</div>
                      <Badge className={`${getConfidenceBadge(selectedLead.confidence).bg} ${getConfidenceBadge(selectedLead.confidence).text} border-none capitalize`}>
                        {selectedLead.confidence}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <h3 className="text-sm font-medium text-white mb-3">Contact Information</h3>
                  <div className="space-y-3">
                    {selectedLead.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-[#666]" />
                        <div>
                          <div className="text-sm text-white">{selectedLead.email}</div>
                          <div className="text-xs text-[#666]">Email</div>
                        </div>
                      </div>
                    )}
                    
                    {selectedLead.linkedinUrl && (
                      <div className="flex items-center gap-3">
                        <Linkedin className="w-4 h-4 text-[#666]" />
                        <div className="flex-1">
                          <a 
                            href={selectedLead.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-green-400 hover:text-green-300 transition-colors flex items-center gap-1"
                          >
                            LinkedIn Profile
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <div className="text-xs text-[#666]">Social</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Professional Info */}
                <div>
                  <h3 className="text-sm font-medium text-white mb-3">Professional Information</h3>
                  <div className="space-y-3">
                    {selectedLead.company && (
                      <div className="flex items-center gap-3">
                        <Building className="w-4 h-4 text-[#666]" />
                        <div>
                          <div className="text-sm text-white">{selectedLead.company}</div>
                          <div className="text-xs text-[#666]">Company</div>
                        </div>
                      </div>
                    )}
                    
                    {selectedLead.jobTitle && (
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 text-[#666] flex items-center justify-center">
                          <div className="w-2 h-2 bg-[#666] rounded-full"></div>
                        </div>
                        <div>
                          <div className="text-sm text-white">{selectedLead.jobTitle}</div>
                          <div className="text-xs text-[#666]">Role</div>
                        </div>
                      </div>
                    )}
                    
                    {selectedLead.location && (
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-[#666]" />
                        <div>
                          <div className="text-sm text-white">{selectedLead.location}</div>
                          <div className="text-xs text-[#666]">Location</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Session Data */}
                <div>
                  <h3 className="text-sm font-medium text-white mb-3">Session Details</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      {selectedLead.sessionDuration && (
                        <div>
                          <div className="text-xs text-[#666] mb-1">Duration</div>
                          <div className="text-sm text-white">{Math.floor(selectedLead.sessionDuration / 60)}m {selectedLead.sessionDuration % 60}s</div>
                        </div>
                      )}
                      
                      {selectedLead.pagesViewed && (
                        <div>
                          <div className="text-xs text-[#666] mb-1">Pages</div>
                          <div className="text-sm text-white">{selectedLead.pagesViewed}</div>
                        </div>
                      )}
                    </div>
                    
                    {selectedLead.ipAddress && (
                      <div>
                        <div className="text-xs text-[#666] mb-1">IP Address</div>
                        <div className="text-sm text-white font-mono">{selectedLead.ipAddress}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, X, ExternalLink, Building, MapPin, Calendar, Mail, Linkedin, Copy, CheckCircle, AlertCircle, Code, Globe, Users, TrendingUp, Activity, Settings, User, Download, Search, Target, Plus, Save } from 'lucide-react'
import Image from 'next/image'
import { TableSkeleton } from "@/components/skeletons"
import { Textarea } from "@/components/ui/textarea"

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
  // Extended enrichment data
  picture_url?: string
  headline?: string
  summary?: string
  lead_source?: string
  exa_webset_id?: string
  exa_raw?: any
  enrichment_data?: any
  confidence_score?: number
  // Media and activity data
  media_content?: Array<{
    type: string
    title: string
    url?: string
    description?: string
    published_date?: string
    platform?: string
    quote?: string
    event?: string
    publication?: string
    snippet?: string
  }>
  work_experience?: Array<{
    company: string
    role: string
    start_date?: string
    end_date?: string
    is_current: boolean
    description?: string
  }>
  education?: Array<{
    institution: string
    degree: string
    field_of_study?: string
    start_year?: number
    end_year?: number
  }>
}

interface LeadStats {
  leadsToday: number
  topModel: string
  topModelCount: number
  mostCrawledPage: string
  topTopic: string
  websetsEnriched?: number
  total?: number
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

export default function LeadsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { currentWorkspace } = useWorkspace()
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<LeadStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [adminLoading, setAdminLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showConfig, setShowConfig] = useState(false)
  const [sortField, setSortField] = useState<string>('timestamp')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [configTab, setConfigTab] = useState<'icp' | 'tracking'>('icp')
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  // Configuration state
  const [icpSettings, setIcpSettings] = useState({
    target_titles: ['CEO', 'CTO', 'VP of Engineering', 'Head of Product'],
    custom_prompt: '',
    is_enabled: true // Default to enabled
  })

  // Admin access check
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        router.push('/login')
        return
      }

      // Check user's admin status from both email domain and profile
      const supabase = createClient()
      if (!supabase) {
        router.push('/login')
        return
      }
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      const hasAdminEmail = user.email?.endsWith('@split.dev')
      const hasAdminRole = profile?.is_admin === true

      if (!hasAdminEmail && !hasAdminRole) {
        router.push('/dashboard')
        return
      }

      // For @split.dev users, check admin verification
      if (hasAdminEmail) {
        const adminVerified = localStorage.getItem('admin_verified')
        const adminVerifiedAt = localStorage.getItem('admin_verified_at')
        
        if (!adminVerified || adminVerified !== 'true') {
          router.push('/admin/verify')
          return
        }

        if (adminVerifiedAt) {
          const verifiedTime = new Date(adminVerifiedAt)
          const now = new Date()
          const hoursSinceVerification = (now.getTime() - verifiedTime.getTime()) / (1000 * 60 * 60)
          
          // Require re-verification after 24 hours
          if (hoursSinceVerification > 24) {
            localStorage.removeItem('admin_verified')
            localStorage.removeItem('admin_verified_at')
            router.push('/admin/verify')
            return
          }
        }
      }

      setAdminLoading(false)
    }

    checkAdminAccess()
  }, [user, router])

  const copyTrackingCode = () => {
    if (!currentWorkspace) return
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const code = `<script src="${baseUrl}/api/tracking/script?workspace=${currentWorkspace.id}"></script>`
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const addTitle = () => {
    if (!newTitle.trim()) return
    if (icpSettings.target_titles.includes(newTitle.trim())) return
    
    setIcpSettings(prev => ({
      ...prev,
      target_titles: [...prev.target_titles, newTitle.trim()]
    }))
    setNewTitle('')
  }

  const removeTitle = (title: string) => {
    setIcpSettings(prev => ({
      ...prev,
      target_titles: prev.target_titles.filter(t => t !== title)
    }))
  }

  const saveSettings = async () => {
    if (!currentWorkspace) return
    
    setSaving(true)
    try {
      const response = await fetch('/api/leads/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: currentWorkspace.id,
          target_titles: icpSettings.target_titles,
          custom_prompt: icpSettings.custom_prompt,
          is_enabled: icpSettings.is_enabled
        })
      })
      
      if (response.ok) {
        console.log('Settings saved successfully')
        setShowConfig(false)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const fetchLeads = async () => {
    if (!currentWorkspace || adminLoading) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/leads?workspaceId=${currentWorkspace.id}`)
      if (response.ok) {
        const data = await response.json()
        setLeads(data.leads || [])
        setStats(data.stats || null)
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
      setLeads([])
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentWorkspace && !adminLoading) {
      fetchLeads()
    }
  }, [currentWorkspace, adminLoading])

  const exportToCSV = () => {
    if (filteredLeads.length === 0) return
    
    const headers = ['Name', 'Title', 'Company', 'Email', 'Model', 'Confidence', 'Page', 'Date']
    const rows = filteredLeads.map(lead => [
      lead.fullName || 'Unknown',
      lead.jobTitle || 'Unknown',
      lead.company || 'Unknown',
      lead.email || 'Unknown',
      lead.model,
      lead.confidence,
      lead.pageVisited,
      new Date(lead.timestamp).toLocaleDateString()
    ])
    
    const csvContent = [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diff = now.getTime() - time.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const getModelInfo = (model: string) => {
    const modelConfig = {
      'GPT-4o': { logo: '/images/chatgpt.svg', name: 'ChatGPT' },
      'Claude': { logo: '/images/claude.svg', name: 'Claude' },
      'Perplexity': { logo: '/images/perplexity.svg', name: 'Perplexity' },
      'Gemini': { logo: '/images/chatgpt.svg', name: 'Gemini' }
    }
    
    return modelConfig[model as keyof typeof modelConfig] || {
      logo: '/images/chatgpt.svg',
      name: model
    }
  }

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

  const getAttributionBadge = (source: string | undefined) => {
    if (!source) return <span className="font-medium text-gray-900 text-sm">Unknown</span>

    // Check if it's an AI platform
    const lowerSource = source.toLowerCase()
    
    if (lowerSource.includes('perplexity')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-cyan-50 text-cyan-700 border border-cyan-200">
          <img src="/images/perplexity.svg" alt="Perplexity" className="w-3 h-3" />
          Perplexity
        </span>
      )
    }
    
    if (lowerSource.includes('chatgpt') || lowerSource.includes('gpt')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
          <img src="/images/chatgpt.svg" alt="ChatGPT" className="w-3 h-3" />
          ChatGPT
        </span>
      )
    }
    
    if (lowerSource.includes('claude')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
          <img src="/images/claude.svg" alt="Claude" className="w-3 h-3" />
          Claude
        </span>
      )
    }
    
    if (lowerSource.includes('gemini')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
          <img src="/images/gemini.svg" alt="Gemini" className="w-3 h-3" />
          Gemini
        </span>
      )
    }
    
    // For other sources, just show as regular text
    return <span className="font-medium text-gray-900 text-sm">{source}</span>
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const SortableHeader = ({ field, children, className }: { field: string, children: React.ReactNode, className: string }) => (
    <th 
      className={`${className} cursor-pointer hover:bg-gray-100 transition-colors`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <div className="flex flex-col">
          <svg className={`w-3 h-3 ${sortField === field && sortDirection === 'asc' ? 'text-gray-900' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <svg className={`w-3 h-3 ${sortField === field && sortDirection === 'desc' ? 'text-gray-900' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </th>
  )

  // Filter and sort leads
  const filteredLeads = useMemo(() => {
    let filtered = leads.filter(lead => {
      const matchesSearch = !searchQuery || 
        (lead.fullName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (lead.company?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (lead.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (lead.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()))
      
      return matchesSearch
    })

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = ''
      let bValue: any = ''

      switch (sortField) {
        case 'fullName':
          aValue = a.fullName || ''
          bValue = b.fullName || ''
          break
        case 'jobTitle':
          aValue = a.jobTitle || ''
          bValue = b.jobTitle || ''
          break
        case 'company':
          aValue = a.company || ''
          bValue = b.company || ''
          break
        case 'location':
          aValue = a.location || ''
          bValue = b.location || ''
          break
        case 'email':
          aValue = a.email || ''
          bValue = b.email || ''
          break
        case 'confidence':
          const confidenceOrder = { 'high': 3, 'medium': 2, 'low': 1 }
          aValue = confidenceOrder[a.confidence as keyof typeof confidenceOrder] || 0
          bValue = confidenceOrder[b.confidence as keyof typeof confidenceOrder] || 0
          break
        case 'model':
          aValue = a.model || ''
          bValue = b.model || ''
          break
        case 'pageVisited':
          aValue = a.pageVisited || ''
          bValue = b.pageVisited || ''
          break
        case 'sessionDuration':
          aValue = a.sessionDuration || 0
          bValue = b.sessionDuration || 0
          break
        case 'pagesViewed':
          aValue = a.pagesViewed || 0
          bValue = b.pagesViewed || 0
          break
        case 'timestamp':
          aValue = new Date(a.timestamp).getTime()
          bValue = new Date(b.timestamp).getTime()
          break
        default:
          return 0
      }

      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

         return filtered
  }, [leads, searchQuery, sortField, sortDirection])

  // Show loading while checking admin access
  if (adminLoading) {
    return (
      <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-500 mx-auto mb-4" />
          <p className="text-gray-600">Checking admin access...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header with Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-900 font-medium text-sm">
                {filteredLeads.length}
              </span>
              <span className="text-gray-500 text-sm">
                {filteredLeads.length === leads.length ? 'leads' : `of ${leads.length} leads`}
              </span>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${searchQuery ? 'text-blue-600' : 'text-gray-500'}`} />
              <Input
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 w-80 bg-white placeholder:text-gray-500 focus:ring-0 shadow-sm ${
                  searchQuery 
                    ? 'border-blue-300 bg-blue-50 text-blue-900 focus:border-blue-400' 
                    : 'border-gray-200 text-gray-900 focus:border-gray-300'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={exportToCSV}
              disabled={filteredLeads.length === 0}
              variant="outline"
              size="sm"
              className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button 
              onClick={() => setShowConfig(true)}
              variant="outline"
              size="sm"
              className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm px-2"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                {loading ? (
            <div className="p-6">
              <TableSkeleton 
                rows={8}
                columns={[
                  { span: 4, align: 'left' },
                  { span: 2, align: 'center' },
                  { span: 2, align: 'center' },
                  { span: 2, align: 'center' },
                  { span: 2, align: 'right' }
                ]}
                showExpandableRows={false}
              />
                  </div>
          ) : filteredLeads.length === 0 ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center max-w-sm">
                      <div className="w-16 h-16 mx-auto mb-4 grid grid-cols-4 gap-1 opacity-40">
                        {[...Array(16)].map((_, i) => (
                    <div key={i} className="w-3 h-3 bg-gray-200 rounded-sm" />
                        ))}
                      </div>
                <h4 className="text-gray-900 font-medium mb-2">
                  {searchQuery ? 'No leads found' : 'No leads yet'}
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {searchQuery 
                    ? 'Try adjusting your search or filters'
                    : 'Leads will appear here once visitors are enriched'
                  }
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1600px]">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    {/* Contact Information */}
                    <SortableHeader field="fullName" className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider w-64 whitespace-nowrap">
                      Contact Name
                    </SortableHeader>
                    <SortableHeader field="jobTitle" className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-48 whitespace-nowrap">
                      Title/Position
                    </SortableHeader>
                    <SortableHeader field="company" className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-48 whitespace-nowrap">
                      Company
                    </SortableHeader>
                    <SortableHeader field="location" className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-32 whitespace-nowrap">
                      Location
                    </SortableHeader>
                    
                    {/* Contact Details */}
                    <SortableHeader field="email" className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-40 whitespace-nowrap">
                      Email
                    </SortableHeader>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-32 whitespace-nowrap">LinkedIn</th>
                    
                    {/* Professional Data */}
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-48 whitespace-nowrap">Current Role</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-64 whitespace-nowrap">Professional Headline</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-48 whitespace-nowrap">Recent Activity</th>
                    
                    {/* Attribution Data */}
                    <SortableHeader field="confidence" className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-24 whitespace-nowrap">
                      Confidence
                    </SortableHeader>
                    <SortableHeader field="model" className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-32 whitespace-nowrap">
                      AI Model
                    </SortableHeader>
                    <SortableHeader field="pageVisited" className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-48 whitespace-nowrap">
                      Page Visited
                    </SortableHeader>
                    
                    {/* Engagement Metrics */}
                    <SortableHeader field="sessionDuration" className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-32 whitespace-nowrap">
                      Session Time
                    </SortableHeader>
                    <SortableHeader field="pagesViewed" className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-32 whitespace-nowrap">
                      Pages Viewed
                    </SortableHeader>
                    <SortableHeader field="timestamp" className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-32 whitespace-nowrap">
                      First Seen
                    </SortableHeader>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLeads.map((lead, index) => {
                    const modelInfo = getModelInfo(lead.model)
                    
                          return (
                            <motion.tr
                              key={lead.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-gray-50 transition-colors cursor-pointer group"
                        onClick={() => setSelectedLead(lead)}
                            >
                        {/* Contact Name */}
                        <td className="py-2 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {lead.picture_url ? (
                              <img 
                                src={lead.picture_url} 
                                alt={lead.fullName || 'Contact'} 
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 ${lead.picture_url ? 'hidden' : ''}`}>
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-900 font-medium text-sm truncate">{lead.fullName || 'Unknown'}</span>
                                {lead.exa_webset_id && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 border border-purple-200 text-purple-700 flex-shrink-0">
                                    Enhanced
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                              
                        {/* Title/Position */}
                        <td className="py-2 px-4 whitespace-nowrap">
                          <span className="text-gray-900 text-sm truncate block">{lead.jobTitle || '-'}</span>
                        </td>
                              
                        {/* Company */}
                        <td className="py-2 px-4 whitespace-nowrap">
                          <span className="text-gray-900 text-sm truncate block">{lead.company || '-'}</span>
                        </td>
                        
                        {/* Location */}
                        <td className="py-2 px-4 whitespace-nowrap">
                          <span className="text-gray-600 text-sm truncate block">{lead.location || '-'}</span>
                        </td>
                        
                        {/* Email */}
                        <td className="py-2 px-4 whitespace-nowrap">
                          {lead.email ? (
                            <a href={`mailto:${lead.email}`} className="text-blue-600 hover:text-blue-800 text-sm truncate block"
                               onClick={(e) => e.stopPropagation()}>
                              {lead.email}
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        
                        {/* LinkedIn */}
                        <td className="py-2 px-4 whitespace-nowrap">
                          {lead.linkedinUrl ? (
                            <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer" 
                               className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                               onClick={(e) => e.stopPropagation()}>
                              <Linkedin className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">Profile</span>
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        
                        {/* Current Role */}
                        <td className="py-2 px-4 whitespace-nowrap">
                          {lead.work_experience && lead.work_experience.length > 0 ? (
                            <div className="text-sm min-w-0">
                              <div className="text-gray-900 font-medium truncate">{lead.work_experience[0].role}</div>
                              <div className="text-gray-600 text-xs truncate">at {lead.work_experience[0].company}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        
                        {/* Professional Headline */}
                        <td className="py-2 px-4 whitespace-nowrap">
                          {lead.headline ? (
                            <div className="text-gray-700 text-sm truncate" title={lead.headline}>
                              {lead.headline}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        
                        {/* Recent Activity */}
                        <td className="py-2 px-4 whitespace-nowrap">
                          {lead.media_content && lead.media_content.length > 0 ? (
                            <div className="text-sm min-w-0">
                              <div className="text-gray-900 font-medium truncate">
                                {lead.media_content[0].title || lead.media_content[0].snippet || 'Recent activity'}
                              </div>
                              <div className="text-gray-500 text-xs truncate">
                                {lead.media_content[0].type} • {lead.media_content[0].published_date ? new Date(lead.media_content[0].published_date).toLocaleDateString() : 'Recent'}
                              </div>
                            </div>
                          ) : lead.enrichment_data?.linkedin_posts ? (
                            <div className="text-sm">
                              <div className="text-gray-900 font-medium">LinkedIn Activity</div>
                              <div className="text-gray-500 text-xs">Recent posts available</div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                              
                        {/* Confidence */}
                        <td className="py-2 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium ${
                            lead.confidence === 'high' ? 'bg-green-50 border-green-200 text-green-700' :
                            lead.confidence === 'medium' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                            'bg-gray-50 border-gray-200 text-gray-700'
                          }`}>
                            {lead.confidence}
                          </span>
                        </td>
                              
                        {/* AI Model */}
                        <td className="py-2 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 min-w-0">
                            {modelInfo.logo && (
                              <img src={modelInfo.logo} alt={modelInfo.name} className="w-4 h-4 flex-shrink-0" />
                            )}
                            <span className="text-gray-900 text-sm truncate">{modelInfo.name}</span>
                          </div>
                        </td>
                              
                        {/* Page Visited */}
                        <td className="py-2 px-4 whitespace-nowrap">
                          <code className="text-gray-600 text-xs bg-gray-100 px-2 py-1 rounded truncate block">
                            {lead.pageVisited}
                          </code>
                        </td>
                              
                        {/* Session Time */}
                        <td className="py-2 px-4 whitespace-nowrap">
                          <span className="text-gray-600 text-sm">
                            {lead.sessionDuration ? `${lead.sessionDuration}s` : '-'}
                          </span>
                        </td>
                              
                        {/* Pages Viewed */}
                        <td className="py-2 px-4 whitespace-nowrap">
                          <span className="text-gray-600 text-sm">
                            {lead.pagesViewed || '-'}
                          </span>
                        </td>
                        
                        {/* First Seen */}
                        <td className="py-2 px-4 whitespace-nowrap">
                          <span className="text-gray-600 text-sm">
                            {new Date(lead.timestamp).toLocaleDateString()}
                          </span>
                        </td>
                            </motion.tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
        </div>
      </div>

      {/* Configuration Dialog */}
      <AnimatePresence>
        {showConfig && (
          <>
            {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setShowConfig(false)}
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white border border-gray-200 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Configure Leads</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConfig(false)}
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <div className="flex">
                    <button
                      onClick={() => setConfigTab('icp')}
                      className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                        configTab === 'icp'
                          ? 'border-gray-900 text-gray-900'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Target className="w-4 h-4 mr-2 inline" />
                      ICP Settings
                    </button>
                    <button
                      onClick={() => setConfigTab('tracking')}
                      className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                        configTab === 'tracking'
                          ? 'border-gray-900 text-gray-900'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
        >
                      <Code className="w-4 h-4 mr-2 inline" />
                      Tracking Setup
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  {configTab === 'icp' ? (
                    <div className="space-y-8">
                      {/* Enable/Disable */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">Enable Lead Enrichment</h3>
                          <p className="text-gray-600 text-sm">
                            Automatically enrich qualified visitors with contact and company data
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={icpSettings.is_enabled}
                            onChange={(e) => setIcpSettings(prev => ({ ...prev, is_enabled: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                        </label>
                      </div>

                      {/* Target Job Titles */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">Target Job Titles</h3>
                          <p className="text-gray-600 text-sm">
                            Define which job titles should trigger lead enrichment
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {icpSettings.target_titles.map((title, index) => (
                            <div
                              key={index} 
                              className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm flex items-center gap-2 group hover:bg-gray-50 transition-colors shadow-sm"
                            >
                              {title}
                              <button
                                onClick={() => removeTitle(title)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add job title (e.g., CEO, CTO)"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addTitle()}
                            className="flex-1 bg-white border-gray-200 text-gray-900 placeholder:text-gray-500 focus:border-gray-300 focus:ring-0 shadow-sm"
                          />
                          <Button 
                            onClick={addTitle} 
                            disabled={!newTitle.trim()}
                            className="bg-gray-900 hover:bg-gray-800 text-white border border-gray-200 shadow-sm"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Custom Prompt */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">Custom Search Prompt</h3>
                          <p className="text-gray-600 text-sm">
                            Describe your ideal customer profile. This works with job titles above to find the right contacts.
                          </p>
                        </div>
                        <Textarea
                          placeholder="e.g., Senior executive or decision maker who evaluates new technology solutions..."
                          value={icpSettings.custom_prompt}
                          onChange={(e) => setIcpSettings(prev => ({ ...prev, custom_prompt: e.target.value }))}
                          className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-500 focus:border-gray-300 focus:ring-0 resize-none shadow-sm"
                          rows={3}
                        />
                        <div className="text-xs text-gray-500">
                          💡 The system combines your job titles and custom prompt to find the most relevant contacts at each company
                        </div>
              </div>
            </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Tracking Code */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">Tracking Code</h3>
                          <p className="text-gray-600 text-sm">
                            Add this code to your website to start tracking visitors
                          </p>
                        </div>
                        
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <code className="text-green-700 text-sm font-mono whitespace-pre-wrap break-all">
                            {currentWorkspace ? 
                              `<script src="${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/tracking/script?workspace=${currentWorkspace.id}"></script>`
                              : 'Loading...'
                            }
                          </code>
          </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={copyTrackingCode}
                            size="sm"
                            className="bg-gray-900 text-white hover:bg-gray-800 shadow-sm"
                          >
                            {copied ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Code
                              </>
      )}
                          </Button>
                        </div>
                      </div>

                      {/* Installation Instructions */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">Installation</h3>
                        <div className="space-y-3">
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <span className="bg-gray-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">1</span>
                              <div>
                                <h4 className="font-medium text-gray-900 mb-1">Add to your website</h4>
                                <p className="text-gray-600 text-sm">
                                  Paste the tracking code in the <code className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-xs">&lt;head&gt;</code> section of your website
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <span className="bg-gray-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">2</span>
                              <div>
                                <h4 className="font-medium text-gray-900 mb-1">Verify installation</h4>
                                <p className="text-gray-600 text-sm">
                                  Visit your website to test the tracking. Leads will appear within minutes.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* What We Track */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">Data Collection</h3>
                        <p className="text-gray-600 text-sm">
                          We collect the following data to identify and enrich your visitors:
                        </p>
                        
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                              <span className="text-gray-700">Page visits</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                              <span className="text-gray-700">Session duration</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                              <span className="text-gray-700">Referrer source</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                              <span className="text-gray-700">Device type</span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                              <span className="text-gray-700">IP geolocation</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                              <span className="text-gray-700">Company identification</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                              <span className="text-gray-700">Contact enrichment</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                              <span className="text-gray-700">Intent scoring</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Privacy Notice */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          Privacy Compliance
                        </h4>
                        <p className="text-blue-700 text-sm">
                          Our tracking is GDPR and CCPA compliant. We only collect business contact information and do not track personal browsing behavior.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfig(false)}
                    className="text-gray-600 hover:text-gray-800 border-gray-200 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  
                  {configTab === 'icp' && (
                    <Button
                      onClick={saveSettings}
                      disabled={saving}
                      className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Settings
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Lead Detail Side Panel */}
      <AnimatePresence>
        {selectedLead && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setSelectedLead(null)}
            />

            {/* Side Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl z-50 flex flex-col"
            >
              {/* Tabs Header */}
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button className="px-6 py-3 text-sm font-medium text-gray-900 border-b-2 border-gray-900">
                    Information
                  </button>
                  <button className="px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700">
                    Company
                  </button>
                  <button className="px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700">
                    Similar
                  </button>
                  <button className="px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700">
                    Comments
                  </button>
                  <div className="flex-1 flex justify-end items-center pr-4">
                    <button
                      onClick={() => setSelectedLead(null)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Header Title */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-semibold text-gray-900">Website Lead</h1>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-md">
                      <Globe className="w-4 h-4 text-gray-600" />
                    </button>
                    {selectedLead?.linkedinUrl && (
                      <button 
                        onClick={() => window.open(selectedLead.linkedinUrl, '_blank')}
                        className="p-2 hover:bg-gray-100 rounded-md"
                      >
                        <Linkedin className="w-4 h-4 text-gray-600" />
                      </button>
                    )}
                    {selectedLead?.email && (
                      <button 
                        onClick={() => window.open(`mailto:${selectedLead.email}`, '_blank')}
                        className="p-2 hover:bg-gray-100 rounded-md"
                      >
                        <Mail className="w-4 h-4 text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-5">
                  {/* Contact Name */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 text-sm">Contact Name</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedLead?.picture_url ? (
                        <img 
                          src={selectedLead.picture_url} 
                          alt={selectedLead.fullName || 'Contact'} 
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="w-3 h-3 text-gray-500" />
                        </div>
                      )}
                      <span className="font-medium text-gray-900">{selectedLead?.fullName || 'Unknown'}</span>
                    </div>
                  </div>

                  {/* Position */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 text-sm">Position</span>
                    </div>
                    <span className="font-medium text-gray-900">{selectedLead?.jobTitle || 'Unknown'}</span>
                  </div>

                  {/* Visited Website */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 text-sm">Visited your website</span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {selectedLead ? new Date(selectedLead.timestamp).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      }) : ''}
                    </span>
                  </div>

                  {/* Email */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 text-sm">Email</span>
                    </div>
                    <span className="font-medium text-gray-900">{selectedLead?.email || 'No email'}</span>
                  </div>

                  {/* Attribution Details */}
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-gray-900">Attribution Details</h3>
                    
                    {/* Attribution Source */}
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 text-sm">Attribution Source</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getAttributionBadge(selectedLead?.model)}
                      </div>
                    </div>

                    {/* Query */}
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 text-sm">Query (if attached)</span>
                      </div>
                      <span className="font-medium text-gray-900 text-sm">
                        {selectedLead?.inferredQuery ? `"${selectedLead.inferredQuery}"` : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Qualifications */}
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-gray-900">Qualifications</h3>
                    <div className="space-y-2">
                      {/* Location */}
                      {selectedLead?.location && (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-gray-600 text-sm">Location: <span className="text-gray-900">{selectedLead.location}</span></span>
                        </div>
                      )}

                      {/* Company Headcount */}
                      {selectedLead?.company && (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-gray-600 text-sm">Company Headcount: <span className="text-gray-900">249-500</span></span>
                        </div>
                      )}

                      {/* Industry */}
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-gray-600 text-sm">Industry: <span className="text-gray-900">SaaS</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Social Media Activity */}
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-gray-900">Social Media Activity</h3>
                    
                    {selectedLead?.media_content && selectedLead.media_content.length > 0 ? (
                      <div className="space-y-3">
                        {selectedLead.media_content.slice(0, 2).map((item: any, idx: number) => (
                          <div key={idx} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center flex-shrink-0">
                                {item.type === 'linkedin_post' ? '📝' : 
                                 item.type === 'article' ? '📰' :
                                 item.type === 'quote' ? '💬' : '🔗'}
                              </div>
                              <div className="flex-1 min-w-0">
                                {item.url ? (
                                  <a href={item.url} target="_blank" rel="noopener noreferrer" 
                                     className="text-sm font-medium text-blue-600 hover:underline block">
                                    {item.title || item.snippet || 'Activity'}
                                  </a>
                                ) : (
                                  <p className="text-sm font-medium text-gray-900">
                                    {item.title || item.snippet || 'Activity'}
                                  </p>
                                )}
                                {item.description && (
                                  <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                                    {item.description}
                                  </p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                  {item.published_date ? new Date(item.published_date).toLocaleDateString() : 'Recent'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : selectedLead?.enrichment_data?.linkedin_posts ? (
                      <div className="space-y-3">
                        {selectedLead.enrichment_data.linkedin_posts.split('\n\n').slice(0, 2).map((post: string, idx: number) => (
                          <div key={idx} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center flex-shrink-0">
                                📝
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {post.replace(/URL:\s*https:\/\/[^\s]+/, '').trim()}
                                </p>
                                {post.includes('URL:') && (
                                  <a href={post.match(/URL:\s*(https:\/\/[^\s]+)/)?.[1]} 
                                     target="_blank" 
                                     rel="noopener noreferrer"
                                     className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                                    View Post →
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <Activity className="w-5 h-5 text-gray-400" />
                        </div>
                        <p className="text-sm">No social media activity available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  )
} 
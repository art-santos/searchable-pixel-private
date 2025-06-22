'use client'

import { useState, useEffect, useMemo } from 'react'
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
  const [filterConfidence, setFilterConfidence] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [filterAttribution, setFilterAttribution] = useState<'all' | 'chatgpt' | 'perplexity' | 'claude' | 'google' | 'direct'>('all')
  const [showConfig, setShowConfig] = useState(false)
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

  // Filter leads based on search and filters
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = !searchQuery || 
        (lead.fullName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (lead.company?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (lead.email?.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesConfidence = filterConfidence === 'all' || lead.confidence === filterConfidence
      
      const matchesAttribution = filterAttribution === 'all' || 
        lead.model?.toLowerCase().includes(filterAttribution)
      
      return matchesSearch && matchesConfidence && matchesAttribution
    })
  }, [leads, searchQuery, filterConfidence, filterAttribution])

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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Leads</h1>
            <p className="text-gray-600 text-sm">AI-attributed leads from your website visitors</p>
          </div>

          <div className="flex items-center gap-6">
            {stats && (
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="text-gray-900 font-medium">{stats.leadsToday}</div>
                  <div className="text-gray-500">Today</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-900 font-medium">{stats.topModel}</div>
                  <div className="text-gray-500">Top Model</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-900 font-medium">
                    {stats.websetsEnriched || 0}/{stats.total || 0}
                  </div>
                  <div className="text-gray-500">Enhanced</div>
                </div>
              </div>
            )}
                    <Button 
              onClick={() => setShowConfig(true)}
              variant="outline"
              size="sm"
              className="border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configure
                    </Button>
                  </div>
                </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80 bg-white border-gray-200 text-gray-900 placeholder:text-gray-500 focus:border-gray-300 focus:ring-0 shadow-sm"
              />
                </div>

            <select
              value={filterConfidence}
              onChange={(e) => setFilterConfidence(e.target.value as any)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-md text-gray-700 text-sm focus:border-gray-300 focus:outline-none focus:ring-0 shadow-sm"
            >
              <option value="all">All Confidence</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={filterAttribution}
              onChange={(e) => setFilterAttribution(e.target.value as any)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-md text-gray-700 text-sm focus:border-gray-300 focus:outline-none focus:ring-0 shadow-sm"
            >
              <option value="all">All Models</option>
              <option value="chatgpt">ChatGPT</option>
              <option value="perplexity">Perplexity</option>
              <option value="claude">Claude</option>
              <option value="google">Google</option>
            </select>
                    </div>
                    
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">
              {filteredLeads.length} leads
            </span>
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
                    <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Page</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLeads.map((lead, index) => {
                    const modelInfo = getModelInfo(lead.model)
                    const confidenceBadge = getConfidenceBadge(lead.confidence)
                    
                          return (
                            <motion.tr
                              key={lead.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-gray-50 transition-colors cursor-pointer group"
                        onClick={() => setSelectedLead(lead)}
                            >
                        {/* Contact */}
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-3">
                            {lead.picture_url ? (
                              <img 
                                src={lead.picture_url} 
                                alt={lead.fullName || 'Contact'} 
                                className="w-8 h-8 rounded-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center ${lead.picture_url ? 'hidden' : ''}`}>
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-900 font-medium text-sm">{lead.fullName || 'Unknown'}</span>
                                {lead.exa_webset_id && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 border border-purple-200 text-purple-700">
                                    Enhanced
                                  </span>
                                )}
                              </div>
                              <div className="text-gray-500 text-xs">{lead.jobTitle || 'Unknown'}</div>
                              {lead.headline && (
                                <div className="text-gray-600 text-xs mt-0.5 truncate max-w-[300px]">{lead.headline}</div>
                              )}
                            </div>
                                </div>
                              </td>
                              
                        {/* Company */}
                              <td className="py-3 px-4">
                                <div>
                            <div className="text-gray-900 font-medium text-sm">{lead.company || 'Unknown'}</div>
                            <div className="text-gray-500 text-xs">{lead.location || 'Unknown'}</div>
                                </div>
                              </td>
                              
                        {/* Confidence */}
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium ${
                            lead.confidence === 'high' ? 'bg-green-50 border-green-200 text-green-700' :
                            lead.confidence === 'medium' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                            'bg-gray-50 border-gray-200 text-gray-700'
                          }`}>
                            {lead.confidence}
                          </span>
                              </td>
                              
                        {/* Model */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {modelInfo.logo && (
                              <img src={modelInfo.logo} alt={modelInfo.name} className="w-4 h-4" />
                            )}
                            <span className="text-gray-900 text-sm">{modelInfo.name}</span>
                                </div>
                              </td>
                              
                        {/* Page */}
                              <td className="py-3 px-4">
                          <code className="text-gray-600 text-xs bg-gray-100 px-2 py-1 rounded">
                            {lead.pageVisited}
                                </code>
                              </td>
                        
                        {/* Time */}
                        <td className="py-3 px-4">
                          <div className="text-gray-600 text-sm">
                            {formatRelativeTime(lead.timestamp)}
                          </div>
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
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-1.5 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
                {selectedLead?.picture_url ? (
                  <img 
                    src={selectedLead.picture_url} 
                    alt={selectedLead.fullName || 'Contact'} 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-medium text-gray-900 truncate">
                    {selectedLead?.fullName || 'Unknown Contact'}
                  </h2>
                  <p className="text-sm text-gray-500 truncate">
                    {selectedLead?.jobTitle || 'Unknown Title'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {selectedLead?.company || 'Unknown Company'}
                  </p>
                </div>
                {selectedLead?.exa_webset_id && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                    Enhanced
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 pb-8">
                <div className="space-y-8">
                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 h-9"
                      onClick={() => window.open(`mailto:${selectedLead?.email}`, '_blank')}
                    >
                      <Mail className="w-3.5 h-3.5 mr-1.5" />
                      Email
                    </Button>
                    {selectedLead?.linkedinUrl ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 h-9"
                        onClick={() => window.open(selectedLead.linkedinUrl, '_blank')}
                      >
                        <Linkedin className="w-3.5 h-3.5 mr-1.5" />
                        LinkedIn
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 h-9"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedLead?.email || '');
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                      >
                        {copied ? <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                        {copied ? 'Copied!' : 'Copy'}
                      </Button>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h3>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Email</span>
                          <p className="text-sm text-gray-900 font-medium mt-0.5">
                            {selectedLead?.email || 'No email'}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Location</span>
                          <p className="text-sm text-gray-900 mt-0.5">
                            {selectedLead?.location || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Attribution</span>
                            <p className="text-sm text-gray-900 mt-0.5">
                              {selectedLead?.model} via {selectedLead?.pageVisited}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">Confidence</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                selectedLead?.confidence === 'high' ? 'bg-green-100 text-green-700' :
                                selectedLead?.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {selectedLead?.confidence}
                              </span>
                              {selectedLead?.confidence_score && (
                                <span className="text-xs text-gray-500">
                                  {(selectedLead.confidence_score * 100).toFixed(0)}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Professional Profile */}
                  {selectedLead?.exa_webset_id && (selectedLead.headline || selectedLead.summary) && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Professional Profile</h3>
                      <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                        {selectedLead.headline && (
                          <div>
                            <span className="text-xs text-gray-500 uppercase tracking-wide">LinkedIn Headline</span>
                            <p className="text-sm text-gray-700 mt-1 leading-relaxed">{selectedLead.headline}</p>
                          </div>
                        )}
                        
                        {selectedLead.summary && (
                          <>
                            {selectedLead.headline && <div className="border-t border-gray-200 pt-3" />}
                            <div>
                              <span className="text-xs text-gray-500 uppercase tracking-wide">Summary</span>
                              <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                                {selectedLead.summary}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Display enrichment data from Websets */}
                  {selectedLead?.enrichment_data && (
                    <>
                      {/* Enhanced Insights */}
                      {(selectedLead.enrichment_data.focus_areas || selectedLead.enrichment_data.linkedin_posts) && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 mb-3">Enhanced Insights</h3>
                          <div className="bg-gray-50 rounded-lg p-3 space-y-4">
                            {/* Current Focus Areas */}
                            {selectedLead.enrichment_data.focus_areas && (
                              <div>
                                <span className="text-xs text-gray-500 uppercase tracking-wide">Current Focus Areas</span>
                                <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                                  {selectedLead.enrichment_data.focus_areas}
                                </p>
                              </div>
                            )}

                            {/* Recent LinkedIn Posts */}
                            {selectedLead.enrichment_data.linkedin_posts && (
                              <>
                                {selectedLead.enrichment_data.focus_areas && <div className="border-t border-gray-200 pt-4" />}
                                <div>
                                  <span className="text-xs text-gray-500 uppercase tracking-wide">Recent Activity</span>
                                  <div className="space-y-2 mt-2">
                                    {selectedLead.enrichment_data.linkedin_posts.split('\n\n').slice(0, 2).map((post: string, idx: number) => (
                                      <div key={idx} className="bg-white p-2 rounded border border-gray-200">
                                        <p className="text-xs text-gray-700 leading-relaxed">
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
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Press Quotes */}
                      {selectedLead.enrichment_data.press_quotes && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 mb-3">Press Quotes</h3>
                          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                            {selectedLead.enrichment_data.press_quotes.split('\n\n').slice(0, 2).map((quote: string, idx: number) => {
                              const quoteMatch = quote.match(/"([^"]+)"/);
                              const sourceMatch = quote.match(/quoted in\s+([^(]+)/i);
                              const dateMatch = quote.match(/\(([^)]+)\)/);
                              
                              return (
                                <div key={idx} className="bg-white p-3 rounded border border-gray-200">
                                  {quoteMatch && (
                                    <>
                                      <p className="text-sm italic text-gray-700">
                                        "{quoteMatch[1]}"
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {sourceMatch ? `— ${sourceMatch[1].trim()}` : '— Press'} 
                                        {dateMatch && ` (${dateMatch[1]})`}
                                      </p>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Key Works */}
                      {selectedLead.enrichment_data.key_works && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 mb-3">Key Works & Projects</h3>
                          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                            {selectedLead.enrichment_data.key_works.split('\n\n').slice(0, 3).map((work: string, idx: number) => {
                              const titleMatch = work.match(/"([^"]+)"/);
                              const typeMatch = work.match(/\(([^,]+),/);
                              
                              return (
                                <div key={idx} className="bg-white p-3 rounded border border-gray-200">
                                  <p className="text-sm font-medium text-gray-900">
                                    {titleMatch ? titleMatch[1] : work.split('(')[0].trim()}
                                  </p>
                                  {typeMatch && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {typeMatch[1]}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Public Activity */}
                  {selectedLead?.media_content && selectedLead.media_content.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Public Activity</h3>
                      <div className="bg-gray-50 rounded-lg p-3">
                      <div className="space-y-3">
                        {/* LinkedIn Posts */}
                        {selectedLead.media_content
                          .filter((media: any) => media.type === 'linkedin_post' || media.type === 'post')
                          .slice(0, 3)
                          .map((post: any, idx: number) => (
                            <div key={`linkedin-${idx}`} className="space-y-2">
                              <div className="flex items-start gap-2">
                                <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  {post.url ? (
                                    <a href={post.url} target="_blank" rel="noopener noreferrer" 
                                       className="text-sm font-medium text-blue-600 hover:underline line-clamp-2">
                                      {post.title || post.snippet || 'LinkedIn Post'}
                                    </a>
                                  ) : (
                                    <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                      {post.title || post.snippet || 'LinkedIn Post'}
                                    </p>
                                  )}
                                  {(post.description || post.snippet) && (
                                    <p className="mt-1 text-xs text-gray-600 line-clamp-3">
                                      {post.description || post.snippet}
                                    </p>
                                  )}
                                  {post.published_date && (
                                    <p className="mt-1 text-xs text-gray-500">
                                      {new Date(post.published_date).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}

                        {/* Articles & Thought Leadership */}
                        {selectedLead.media_content
                          .filter((media: any) => ['article', 'blog', 'interview', 'podcast', 'webinar', 'talk'].includes(media.type))
                          .slice(0, 3)
                          .map((article: any, idx: number) => (
                            <div key={`article-${idx}`} className="space-y-2">
                              <div className="flex items-start gap-2">
                                <div className="w-8 h-8 rounded bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                  {article.type === 'podcast' ? '🎙️' : 
                                   article.type === 'webinar' ? '🖥️' :
                                   article.type === 'talk' ? '🎤' : '📝'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <a href={article.url} target="_blank" rel="noopener noreferrer" 
                                     className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline line-clamp-2">
                                    {article.title}
                                  </a>
                                  {article.description && (
                                    <p className="mt-1 text-xs text-gray-600 line-clamp-3">
                                      {article.description}
                                    </p>
                                  )}
                                  <p className="mt-1 text-xs text-gray-500">
                                    {article.type.charAt(0).toUpperCase() + article.type.slice(1)} • {new Date(article.published_date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}

                        {/* Press Quotes & Media Mentions */}
                        {selectedLead.media_content
                          .filter((media: any) => media.type === 'quote' || media.type === 'news' || media.type === 'article')
                          .slice(0, 5)
                          .map((item: any, idx: number) => (
                            <div key={`media-${idx}`} className="space-y-2">
                              <div className="flex items-start gap-2">
                                <div className="w-8 h-8 rounded bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                  {item.type === 'quote' ? '💬' : '📰'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  {item.type === 'quote' && item.quote ? (
                                    <>
                                      <p className="text-sm italic text-gray-700">
                                        "{item.quote}"
                                      </p>
                                      <p className="mt-1 text-xs text-gray-500">
                                        — {item.publication || item.platform || 'Press'} 
                                        {item.published_date && ` • ${new Date(item.published_date).toLocaleDateString()}`}
                                      </p>
                                    </>
                                  ) : (
                                    <>
                                      {item.url ? (
                                        <a href={item.url} target="_blank" rel="noopener noreferrer" 
                                           className="text-sm font-medium text-green-600 dark:text-green-400 hover:underline line-clamp-2">
                                          {item.title || 'Media Mention'}
                                        </a>
                                      ) : (
                                        <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                          {item.title || 'Media Mention'}
                                        </p>
                                      )}
                                      {item.description && !item.quote && (
                                        <p className="mt-1 text-xs text-gray-600 line-clamp-3">
                                          {item.description}
                                        </p>
                                      )}
                                      <p className="mt-1 text-xs text-gray-500">
                                        {item.platform || item.publication || 'Media'} • {new Date(item.published_date).toLocaleDateString()}
                                      </p>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}

                        {/* Patents */}
                        {selectedLead.media_content
                          .filter((media: any) => media.type === 'patent')
                          .slice(0, 2)
                          .map((patent: any, idx: number) => (
                            <div key={`patent-${idx}`} className="space-y-2">
                              <div className="flex items-start gap-2">
                                <div className="w-8 h-8 rounded bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                                  🔬
                                </div>
                                <div className="flex-1 min-w-0">
                                  <a href={patent.url} target="_blank" rel="noopener noreferrer" 
                                     className="text-sm font-medium text-orange-600 dark:text-orange-400 hover:underline line-clamp-2">
                                    {patent.title}
                                  </a>
                                  <p className="mt-1 text-xs text-gray-500">
                                    Patent • {new Date(patent.published_date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Work Experience */}
                  {selectedLead?.work_experience && selectedLead.work_experience.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Experience</h3>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="space-y-3">
                          {selectedLead.work_experience.slice(0, 3).map((exp, idx) => (
                            <div key={`exp-${idx}`} className={idx > 0 ? 'pt-3 border-t border-gray-200' : ''}>
                              <div className="flex items-start justify-between mb-1">
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium text-gray-900">{exp.role}</h4>
                                  <p className="text-sm text-gray-600">{exp.company}</p>
                                </div>
                                {exp.is_current && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                    Current
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">
                                {exp.start_date} - {exp.end_date || 'Present'}
                              </p>
                              {exp.description && (
                                <p className="mt-1 text-xs text-gray-600 leading-relaxed">{exp.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {selectedLead?.education && selectedLead.education.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Education</h3>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="space-y-3">
                          {selectedLead.education.map((edu, idx) => (
                            <div key={`edu-${idx}`} className={idx > 0 ? 'pt-3 border-t border-gray-200' : ''}>
                              <h4 className="text-sm font-medium text-gray-900">{edu.institution}</h4>
                              <p className="text-sm text-gray-600">
                                {edu.degree} {edu.field_of_study && `in ${edu.field_of_study}`}
                              </p>
                              {(edu.start_year || edu.end_year) && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {edu.start_year} - {edu.end_year}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Engagement Metrics */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Engagement Metrics</h3>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Session Duration</p>
                          <p className="text-sm font-medium text-gray-900 mt-0.5">
                            {selectedLead?.sessionDuration ? `${selectedLead.sessionDuration}s` : 'Unknown'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Pages Viewed</p>
                          <p className="text-sm font-medium text-gray-900 mt-0.5">
                            {selectedLead?.pagesViewed || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-3 mt-3 border-t border-gray-200">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">First Seen</p>
                          <p className="text-sm font-medium text-gray-900 mt-0.5">
                            {selectedLead ? new Date(selectedLead.timestamp).toLocaleDateString() : ''}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Time</p>
                          <p className="text-sm font-medium text-gray-900 mt-0.5">
                            {selectedLead ? new Date(selectedLead.timestamp).toLocaleTimeString() : ''}
                          </p>
                        </div>
                      </div>
                    </div>
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
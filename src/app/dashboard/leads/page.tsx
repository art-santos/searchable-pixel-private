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
      <div className="min-h-screen bg-white dark:bg-[#0c0c0c] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-500 mx-auto mb-4" />
          <p className="text-zinc-600 dark:text-zinc-400">Checking admin access...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0c0c0c]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-black dark:text-white mb-1">Leads</h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">AI-attributed leads from your website visitors</p>
        </div>

          <div className="flex items-center gap-6">
            {stats && (
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="text-black dark:text-white font-medium">{stats.leadsToday}</div>
                  <div className="text-zinc-500">Today</div>
                </div>
                <div className="text-center">
                  <div className="text-black dark:text-white font-medium">{stats.topModel}</div>
                  <div className="text-zinc-500">Top Model</div>
                </div>
                <div className="text-center">
                  <div className="text-black dark:text-white font-medium">
                    {stats.websetsEnriched || 0}/{stats.total || 0}
                  </div>
                  <div className="text-zinc-500">Enhanced</div>
                </div>
              </div>
            )}
                    <Button 
              onClick={() => setShowConfig(true)}
              variant="outline"
              size="sm"
              className="border-zinc-300 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:text-black dark:hover:text-white"
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80 bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-300 dark:border-zinc-800 text-black dark:text-white placeholder:text-zinc-500 focus:border-zinc-400 dark:focus:border-zinc-700"
              />
                </div>

            <select
              value={filterConfidence}
              onChange={(e) => setFilterConfidence(e.target.value as any)}
              className="px-3 py-2 bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800 rounded-md text-zinc-700 dark:text-zinc-300 text-sm focus:border-zinc-400 dark:focus:border-zinc-700 focus:outline-none"
            >
              <option value="all">All Confidence</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={filterAttribution}
              onChange={(e) => setFilterAttribution(e.target.value as any)}
              className="px-3 py-2 bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800 rounded-md text-zinc-700 dark:text-zinc-300 text-sm focus:border-zinc-400 dark:focus:border-zinc-700 focus:outline-none"
            >
              <option value="all">All Models</option>
              <option value="chatgpt">ChatGPT</option>
              <option value="perplexity">Perplexity</option>
              <option value="claude">Claude</option>
              <option value="google">Google</option>
            </select>
                    </div>
                    
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 text-sm">
              {filteredLeads.length} leads
            </span>
                <Button 
              onClick={exportToCSV}
              disabled={filteredLeads.length === 0}
                  variant="outline"
                  size="sm"
              className="border-zinc-300 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
                >
              <Download className="w-4 h-4 mr-2" />
              Export
                </Button>
              </div>
            </div>

        {/* Table */}
        <div className="bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200/50 dark:border-zinc-800/50 rounded-lg overflow-hidden">
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
                    <div key={i} className="w-3 h-3 bg-zinc-300 dark:bg-zinc-700 rounded-sm" />
                        ))}
                      </div>
                <h4 className="text-black dark:text-white font-medium mb-2">
                  {searchQuery ? 'No leads found' : 'No leads yet'}
                </h4>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
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
                <thead>
                  <tr className="border-b border-zinc-200/50 dark:border-zinc-800/50">
                    <th className="text-left py-3 px-6 text-xs font-medium text-zinc-600 dark:text-zinc-500 uppercase tracking-wider">Contact</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-zinc-600 dark:text-zinc-500 uppercase tracking-wider">Company</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-zinc-600 dark:text-zinc-500 uppercase tracking-wider">Confidence</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-zinc-600 dark:text-zinc-500 uppercase tracking-wider">Model</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-zinc-600 dark:text-zinc-500 uppercase tracking-wider">Page</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-zinc-600 dark:text-zinc-500 uppercase tracking-wider">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                  {filteredLeads.map((lead, index) => {
                    const modelInfo = getModelInfo(lead.model)
                    const confidenceBadge = getConfidenceBadge(lead.confidence)
                    
                          return (
                            <motion.tr
                              key={lead.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-b border-zinc-200/30 dark:border-zinc-800/30 hover:bg-zinc-100/30 dark:hover:bg-zinc-900/30 transition-colors cursor-pointer group"
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
                            <div className={`w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center ${lead.picture_url ? 'hidden' : ''}`}>
                              <User className="w-4 h-4 text-zinc-500" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-black dark:text-white font-medium text-sm">{lead.fullName || 'Unknown'}</span>
                                {lead.exa_webset_id && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-600/20 text-purple-400">
                                    Enhanced
                                  </span>
                                )}
                              </div>
                              <div className="text-zinc-500 text-xs">{lead.jobTitle || 'Unknown'}</div>
                              {lead.headline && (
                                <div className="text-zinc-600 dark:text-zinc-400 text-xs mt-0.5 truncate max-w-[300px]">{lead.headline}</div>
                              )}
                            </div>
                                </div>
                              </td>
                              
                        {/* Company */}
                              <td className="py-3 px-4">
                                <div>
                            <div className="text-black dark:text-white font-medium text-sm">{lead.company || 'Unknown'}</div>
                            <div className="text-zinc-500 text-xs">{lead.location || 'Unknown'}</div>
                                </div>
                              </td>
                              
                        {/* Confidence */}
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${confidenceBadge.bg} ${confidenceBadge.text}`}>
                            {lead.confidence}
                          </span>
                              </td>
                              
                        {/* Model */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {modelInfo.logo && (
                              <img src={modelInfo.logo} alt={modelInfo.name} className="w-4 h-4" />
                            )}
                            <span className="text-black dark:text-white text-sm">{modelInfo.name}</span>
                                </div>
                              </td>
                              
                        {/* Page */}
                              <td className="py-3 px-4">
                          <code className="text-zinc-600 dark:text-zinc-400 text-xs bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded">
                            {lead.pageVisited}
                                </code>
                              </td>
                        
                        {/* Time */}
                        <td className="py-3 px-4">
                          <div className="text-zinc-600 dark:text-zinc-400 text-sm">
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
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
              onClick={() => setShowConfig(false)}
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-zinc-950 border border-zinc-800/50 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
                  <h2 className="text-xl font-semibold text-white">Configure Leads</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConfig(false)}
                    className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Tabs */}
                <div className="border-b border-zinc-800/50">
                  <div className="flex">
                    <button
                      onClick={() => setConfigTab('icp')}
                      className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                        configTab === 'icp'
                          ? 'border-white text-white'
                          : 'border-transparent text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Target className="w-4 h-4 mr-2 inline" />
                      ICP Settings
                    </button>
                    <button
                      onClick={() => setConfigTab('tracking')}
                      className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                        configTab === 'tracking'
                          ? 'border-white text-white'
                          : 'border-transparent text-zinc-400 hover:text-white'
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
                      <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-lg">
                        <div>
                          <h3 className="text-lg font-medium text-white mb-1">Enable Lead Enrichment</h3>
                          <p className="text-zinc-400 text-sm">
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
                          <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
                        </label>
                      </div>

                      {/* Target Job Titles */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-medium text-white mb-1">Target Job Titles</h3>
                          <p className="text-zinc-400 text-sm">
                            Define which job titles should trigger lead enrichment
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {icpSettings.target_titles.map((title, index) => (
                            <div
                              key={index} 
                              className="bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 px-3 py-1.5 rounded-md text-sm flex items-center gap-2 group hover:bg-zinc-700/50 transition-colors"
                            >
                              {title}
                              <button
                                onClick={() => removeTitle(title)}
                                className="text-zinc-500 hover:text-white transition-colors"
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
                            className="flex-1 bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-zinc-600"
                          />
                          <Button 
                            onClick={addTitle} 
                            disabled={!newTitle.trim()}
                            className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700/50"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Custom Prompt */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-medium text-white mb-1">Custom Search Prompt</h3>
                          <p className="text-zinc-400 text-sm">
                            Describe your ideal customer profile. This works with job titles above to find the right contacts.
                          </p>
                        </div>
                        <Textarea
                          placeholder="e.g., Senior executive or decision maker who evaluates new technology solutions..."
                          value={icpSettings.custom_prompt}
                          onChange={(e) => setIcpSettings(prev => ({ ...prev, custom_prompt: e.target.value }))}
                          className="bg-zinc-900/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-zinc-600 resize-none"
                          rows={3}
                        />
                        <div className="text-xs text-zinc-500">
                          💡 The system combines your job titles and custom prompt to find the most relevant contacts at each company
                        </div>
              </div>
            </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Tracking Code */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-medium text-white mb-1">Tracking Code</h3>
                          <p className="text-zinc-400 text-sm">
                            Add this code to your website to start tracking visitors
                          </p>
                        </div>
                        
                        <div className="bg-zinc-900 border border-zinc-700/50 rounded-lg p-4">
                          <code className="text-green-400 text-sm font-mono whitespace-pre-wrap break-all">
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
                            className="bg-white text-zinc-900 hover:bg-zinc-100"
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
                        <h3 className="text-lg font-medium text-white">Installation</h3>
                        <div className="space-y-3">
                          <div className="bg-zinc-900/50 border border-zinc-700/50 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <span className="bg-zinc-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">1</span>
                              <div>
                                <h4 className="font-medium text-white mb-1">Add to your website</h4>
                                <p className="text-zinc-400 text-sm">
                                  Paste the tracking code in the <code className="bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded text-xs">&lt;head&gt;</code> section of your website
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-zinc-900/50 border border-zinc-700/50 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <span className="bg-zinc-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">2</span>
                              <div>
                                <h4 className="font-medium text-white mb-1">Verify installation</h4>
                                <p className="text-zinc-400 text-sm">
                                  Visit your website to test the tracking. Leads will appear within minutes.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* What We Track */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-white">Data Collection</h3>
                        <p className="text-zinc-400 text-sm">
                          We collect the following data to identify and enrich your visitors:
                        </p>
                        
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full"></div>
                              <span className="text-zinc-300">Page visits</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full"></div>
                              <span className="text-zinc-300">Session duration</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full"></div>
                              <span className="text-zinc-300">Referrer source</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full"></div>
                              <span className="text-zinc-300">Device type</span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full"></div>
                              <span className="text-zinc-300">IP geolocation</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full"></div>
                              <span className="text-zinc-300">Company identification</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full"></div>
                              <span className="text-zinc-300">Contact enrichment</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full"></div>
                              <span className="text-zinc-300">Intent scoring</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Privacy Notice */}
                      <div className="bg-zinc-900/30 border border-zinc-700/30 rounded-lg p-4">
                        <h4 className="font-medium text-zinc-300 mb-2 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full"></div>
                          Privacy Compliance
                        </h4>
                        <p className="text-zinc-400 text-sm">
                          Our tracking is GDPR and CCPA compliant. We only collect business contact information and do not track personal browsing behavior.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-zinc-800/50">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfig(false)}
                    className="text-zinc-400 hover:text-white border-zinc-700/50 hover:bg-zinc-800/50"
                  >
                    Cancel
                  </Button>
                  
                  {configTab === 'icp' && (
                    <Button
                      onClick={saveSettings}
                      disabled={saving}
                      className="bg-white hover:bg-zinc-200 text-black"
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
              className="fixed right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-zinc-950 shadow-xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center gap-4 p-6 border-b border-zinc-200 dark:border-zinc-800/50">
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
                {selectedLead?.picture_url ? (
                  <img 
                    src={selectedLead.picture_url} 
                    alt={selectedLead.fullName || 'Contact'} 
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                    <User className="w-7 h-7 text-zinc-500" />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-black dark:text-white">
                    {selectedLead?.fullName || 'Unknown Contact'}
                  </h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {selectedLead?.jobTitle || 'Unknown Title'} at {selectedLead?.company || 'Unknown Company'}
                  </p>
                </div>
                {selectedLead?.exa_webset_id && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-600/20 text-purple-400">
                    Enhanced
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(`mailto:${selectedLead?.email}`, '_blank')}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Send Email
                    </Button>
                    {selectedLead?.linkedinUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => window.open(selectedLead.linkedinUrl, '_blank')}
                      >
                        <Linkedin className="w-4 h-4 mr-2" />
                        View LinkedIn
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedLead?.email || '');
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                    >
                      {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>

                  {/* Contact Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-xs text-zinc-500 uppercase tracking-wide">Email</span>
                      <p className="text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                        {selectedLead?.email || 'No email'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-zinc-500 uppercase tracking-wide">Location</span>
                      <p className="text-sm text-zinc-900 dark:text-zinc-100">
                        {selectedLead?.location || 'Unknown'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-zinc-500 uppercase tracking-wide">Attribution</span>
                      <p className="text-sm text-zinc-900 dark:text-zinc-100">
                        {selectedLead?.model} → {selectedLead?.pageVisited}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-zinc-500 uppercase tracking-wide">Confidence</span>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          selectedLead?.confidence === 'high' ? 'bg-green-600/20 text-green-400' :
                          selectedLead?.confidence === 'medium' ? 'bg-green-600/10 text-green-500' :
                          'bg-gray-600/20 text-gray-400'
                        }`}>
                          {selectedLead?.confidence}
                        </span>
                        {selectedLead?.confidence_score && (
                          <span className="text-xs text-zinc-500">
                            ({(selectedLead.confidence_score * 100).toFixed(0)}%)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Profile Data */}
                  {selectedLead?.exa_webset_id && (
                    <div className="space-y-4">
                      {selectedLead.headline && (
                        <div className="space-y-1">
                          <span className="text-xs text-zinc-500 uppercase tracking-wide">LinkedIn Headline</span>
                          <p className="text-sm text-zinc-900 dark:text-zinc-100">{selectedLead.headline}</p>
                        </div>
                      )}
                      
                      {selectedLead.summary && (
                        <div className="space-y-1">
                          <span className="text-xs text-zinc-500 uppercase tracking-wide">Professional Summary</span>
                          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                            {selectedLead.summary}
                          </p>
                        </div>
                      )}

                      {/* Display enrichment data from Websets */}
                      {selectedLead.enrichment_data && (
                        <>
                          {/* Current Focus Areas */}
                          {selectedLead.enrichment_data.focus_areas && (
                            <div className="space-y-1">
                              <span className="text-xs text-zinc-500 uppercase tracking-wide">Current Focus Areas</span>
                              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg">
                                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                  {selectedLead.enrichment_data.focus_areas}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Recent LinkedIn Posts */}
                          {selectedLead.enrichment_data.linkedin_posts && (
                            <div className="space-y-1">
                              <span className="text-xs text-zinc-500 uppercase tracking-wide">Recent LinkedIn Activity</span>
                              <div className="space-y-2">
                                {selectedLead.enrichment_data.linkedin_posts.split('\n\n').slice(0, 3).map((post: string, idx: number) => (
                                  <div key={idx} className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg">
                                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                                      {post.replace(/URL:\s*https:\/\/[^\s]+/, '').trim()}
                                    </p>
                                    {post.includes('URL:') && (
                                      <a href={post.match(/URL:\s*(https:\/\/[^\s]+)/)?.[1]} 
                                         target="_blank" 
                                         rel="noopener noreferrer"
                                         className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block">
                                        View Post →
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Press Quotes */}
                          {selectedLead.enrichment_data.press_quotes && (
                            <div className="space-y-1">
                              <span className="text-xs text-zinc-500 uppercase tracking-wide">Press Quotes</span>
                              <div className="space-y-2">
                                {selectedLead.enrichment_data.press_quotes.split('\n\n').slice(0, 2).map((quote: string, idx: number) => {
                                  const quoteMatch = quote.match(/"([^"]+)"/);
                                  const sourceMatch = quote.match(/quoted in\s+([^(]+)/i);
                                  const dateMatch = quote.match(/\(([^)]+)\)/);
                                  
                                  return (
                                    <div key={idx} className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg">
                                      {quoteMatch && (
                                        <>
                                          <p className="text-sm italic text-zinc-700 dark:text-zinc-300">
                                            "{quoteMatch[1]}"
                                          </p>
                                          <p className="text-xs text-zinc-500 mt-1">
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
                            <div className="space-y-1">
                              <span className="text-xs text-zinc-500 uppercase tracking-wide">Key Works & Projects</span>
                              <div className="space-y-2">
                                {selectedLead.enrichment_data.key_works.split('\n\n').slice(0, 3).map((work: string, idx: number) => {
                                  const titleMatch = work.match(/"([^"]+)"/);
                                  const typeMatch = work.match(/\(([^,]+),/);
                                  
                                  return (
                                    <div key={idx} className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg">
                                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                        {titleMatch ? titleMatch[1] : work.split('(')[0].trim()}
                                      </p>
                                      {typeMatch && (
                                        <p className="text-xs text-zinc-500 mt-0.5">
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
                    </div>
                  )}

                  {/* Public Activity */}
                  {selectedLead.media_content && selectedLead.media_content.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-xs text-zinc-500 uppercase tracking-wide">Public Activity & Media</span>
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
                                       className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline line-clamp-2">
                                      {post.title || post.snippet || 'LinkedIn Post'}
                                    </a>
                                  ) : (
                                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2">
                                      {post.title || post.snippet || 'LinkedIn Post'}
                                    </p>
                                  )}
                                  {(post.description || post.snippet) && (
                                    <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3">
                                      {post.description || post.snippet}
                                    </p>
                                  )}
                                  {post.published_date && (
                                    <p className="mt-1 text-xs text-zinc-500">
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
                                    <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3">
                                      {article.description}
                                    </p>
                                  )}
                                  <p className="mt-1 text-xs text-zinc-500">
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
                                      <p className="text-sm italic text-zinc-700 dark:text-zinc-300">
                                        "{item.quote}"
                                      </p>
                                      <p className="mt-1 text-xs text-zinc-500">
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
                                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2">
                                          {item.title || 'Media Mention'}
                                        </p>
                                      )}
                                      {item.description && !item.quote && (
                                        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3">
                                          {item.description}
                                        </p>
                                      )}
                                      <p className="mt-1 text-xs text-zinc-500">
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
                                  <p className="mt-1 text-xs text-zinc-500">
                                    Patent • {new Date(patent.published_date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Work Experience */}
                  {selectedLead.work_experience && selectedLead.work_experience.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-xs text-zinc-500 uppercase tracking-wide">Work Experience</span>
                      <div className="space-y-3">
                        {selectedLead.work_experience.map((exp, idx) => (
                          <div key={`exp-${idx}`} className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{exp.role}</h4>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">{exp.company}</p>
                              </div>
                              {exp.is_current && (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-600/20 text-green-400">
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-zinc-500">
                              {exp.start_date} - {exp.end_date || 'Present'}
                            </p>
                            {exp.description && (
                              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">{exp.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {selectedLead.education && selectedLead.education.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-xs text-zinc-500 uppercase tracking-wide">Education</span>
                      <div className="space-y-3">
                        {selectedLead.education.map((edu, idx) => (
                          <div key={`edu-${idx}`} className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg">
                            <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{edu.institution}</h4>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                              {edu.degree} {edu.field_of_study && `in ${edu.field_of_study}`}
                            </p>
                            {(edu.start_year || edu.end_year) && (
                              <p className="mt-1 text-xs text-zinc-500">
                                {edu.start_year} - {edu.end_year}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Engagement Details */}
                  <div className="space-y-3">
                    <span className="text-xs text-zinc-500 uppercase tracking-wide">Engagement Details</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg">
                        <p className="text-xs text-zinc-500 mb-1">Session Duration</p>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {selectedLead?.sessionDuration ? `${selectedLead.sessionDuration}s` : 'Unknown'}
                        </p>
                      </div>
                      <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg">
                        <p className="text-xs text-zinc-500 mb-1">Pages Viewed</p>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {selectedLead?.pagesViewed || 'Unknown'}
                        </p>
                      </div>
                      <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg">
                        <p className="text-xs text-zinc-500 mb-1">First Seen</p>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {selectedLead ? new Date(selectedLead.timestamp).toLocaleDateString() : ''}
                        </p>
                      </div>
                      <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg">
                        <p className="text-xs text-zinc-500 mb-1">Time</p>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {selectedLead ? new Date(selectedLead.timestamp).toLocaleTimeString() : ''}
                        </p>
                      </div>
                    </div>
                  </div>


                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-zinc-200 dark:border-zinc-800/50">
                <Button
                  variant="outline" 
                  className="w-full"
                  onClick={() => setSelectedLead(null)}
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Globe, 
  Search, 
  MapPin, 
  Upload, 
  Zap, 
  ExternalLink,
  ChevronDown,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Play,
  Settings,
  Eye,
  Target,
  TrendingUp,
  X,
  FileText,
  BarChart3,
  Link2,
  Image,
  Hash,
  CheckCircle,
  XCircle,
  Minus,
  TrendingDown,
  Lightbulb
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell
} from 'recharts'
import { cn } from '@/lib/utils'
import { ChartSkeleton, ListSkeleton, TableSkeleton } from '@/components/skeletons'
import { Skeleton } from '@/components/ui/skeleton'

interface Project {
  id: string
  name: string
  root_domain: string
  created_at: string
  last_analyzed_at?: string
  url_count?: number
  status: 'active' | 'paused'
}

interface ProjectUrl {
  id: string
  url: string
  priority: number
  tags: string[]
  status: 'pending' | 'processing' | 'analyzed' | 'failed'
  last_analyzed_at?: string
  next_analysis_at?: string
  // Snapshot preview data
  snapshot_id?: string
  visibility_score?: number
  technical_score?: number
  combined_score?: number
  issues_count?: number
  topic?: string
  // Comprehensive audit data
  page_summary?: string
  technical_recommendations?: string
  content_recommendations?: string
  page_score?: number
  crawlable?: boolean
  ssr_rendered?: boolean
  faq_schema_present?: boolean
  itemlist_schema_present?: boolean
  article_schema_present?: boolean
  breadcrumb_schema_present?: boolean
  speakable_schema_present?: boolean
  jsonld_valid?: boolean
  canonical_tag_valid?: boolean
  meta_description_present?: boolean
  h1_present?: boolean
  heading_depth?: number
  word_count?: number
  external_eeat_links?: number
  internal_link_count?: number
  image_alt_present?: number
  promotional_sentiment?: number
}

interface VisibilityData {
  overallScore: number
  scoreHistory: Array<{ date: string; score: number }>
  trend: number
  rank: number
  shareOfVoice: number
  topics: Array<{
    topic: string
    score: number
    mentions: number
  }>
  citations: {
    owned: number
    operated: number
    earned: number
    competitor: number
  }
  competitors: Array<{
    name: string
    score: number
    trend: number
  }>
  suggestions: Array<{
    topic: string
    suggestion: string
    priority: string
  }>
  lastUpdated: string
}

export default function ProjectsPage() {
  const { user } = useAuth()
  
  // State management
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projectUrls, setProjectUrls] = useState<ProjectUrl[]>([])
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set())
  const [processingUrls, setProcessingUrls] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState('pages')
  
  // Loading states
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loadingUrls, setLoadingUrls] = useState(false)
  const [creatingProject, setCreatingProject] = useState(false)
  const [runningAudit, setRunningAudit] = useState(false)
  
  // Dialog states
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [selectedUrlDetail, setSelectedUrlDetail] = useState<ProjectUrl | null>(null)
  const [snapshotDetail, setSnapshotDetail] = useState<any>(null)
  const [loadingSnapshot, setLoadingSnapshot] = useState(false)
  
  // Form states
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDomain, setNewProjectDomain] = useState('')
  const [newUrlInput, setNewUrlInput] = useState('')
  
  // Visibility data
  const [visibilityData, setVisibilityData] = useState<VisibilityData | null>(null)
  const [loadingVisibility, setLoadingVisibility] = useState(false)
  
  // Detailed audit data for side drawer
  const [detailedAudit, setDetailedAudit] = useState<any>(null)
  const [loadingDetailedAudit, setLoadingDetailedAudit] = useState(false)

  // Load projects on mount
  useEffect(() => {
    loadProjects()
  }, [])

  // Load URLs when project selected
  useEffect(() => {
    if (selectedProject) {
      loadProjectUrls(selectedProject.id)
      if (activeTab === 'visibility') {
        loadVisibilityData(selectedProject.id)
      }
    }
  }, [selectedProject])

  // Load visibility data when tab changes
  useEffect(() => {
    if (selectedProject && activeTab === 'visibility' && !visibilityData) {
      loadVisibilityData(selectedProject.id)
    }
  }, [activeTab, selectedProject])

  const loadProjects = async () => {
    setLoadingProjects(true)
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.data)
        if (data.data.length > 0 && !selectedProject) {
          setSelectedProject(data.data[0])
        }
      }
    } catch (error) {
      toast.error('Failed to load projects')
    } finally {
      setLoadingProjects(false)
    }
  }

  const loadProjectUrls = async (projectId: string) => {
    setLoadingUrls(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/urls`)
      if (response.ok) {
        const data = await response.json()
        setProjectUrls(data.data)
      }
    } catch (error) {
      toast.error('Failed to load project URLs')
    } finally {
      setLoadingUrls(false)
    }
  }

  const loadVisibilityData = async (projectId: string) => {
    setLoadingVisibility(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/visibility`)
      if (response.ok) {
        const data = await response.json()
        setVisibilityData(data.data)
      }
    } catch (error) {
      toast.error('Failed to load visibility data')
    } finally {
      setLoadingVisibility(false)
    }
  }

  const loadDetailedAudit = async (urlId: string) => {
    if (!selectedProject) return
    
    setLoadingDetailedAudit(true)
    try {
      const response = await fetch(`/api/projects/${selectedProject.id}/urls/${urlId}/audit`)
      if (response.ok) {
        const data = await response.json()
        setDetailedAudit(data.data?.audit)
      }
    } catch (error) {
      console.error('Failed to load detailed audit:', error)
      setDetailedAudit(null)
    } finally {
      setLoadingDetailedAudit(false)
    }
  }

  const createProject = async () => {
    if (!newProjectName.trim() || !newProjectDomain.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    setCreatingProject(true)
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName.trim(),
          root_domain: newProjectDomain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
        })
      })

      if (response.ok) {
        const data = await response.json()
        setProjects(prev => [data.data, ...prev])
        setSelectedProject(data.data)
        setNewProjectName('')
        setNewProjectDomain('')
        setShowCreateProject(false)
        toast.success('Project created successfully')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to create project')
      }
    } catch (error) {
      toast.error('Failed to create project')
    } finally {
      setCreatingProject(false)
    }
  }

  const addUrlToProject = async () => {
    if (!selectedProject || !newUrlInput.trim()) return

    const urls = newUrlInput.split('\n').filter(url => url.trim())
    if (urls.length === 0) return

    try {
      for (const url of urls) {
        const response = await fetch(`/api/projects/${selectedProject.id}/urls`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url.trim() })
        })

        if (!response.ok) {
          const data = await response.json()
          toast.error(`Failed to add ${url}: ${data.error}`)
        }
      }
      
      toast.success(`Added ${urls.length} URL(s) to project`)
      setNewUrlInput('')
      loadProjectUrls(selectedProject.id)
    } catch (error) {
      toast.error('Failed to add URLs')
    }
  }

  const runLinkAudit = async () => {
    if (!selectedProject || selectedUrls.size === 0) {
      toast.error('Please select URLs to audit')
      return
    }

    setRunningAudit(true)
    const urlsToAudit = projectUrls.filter(url => selectedUrls.has(url.id))
    
    // Mark URLs as processing
    setProcessingUrls(new Set(urlsToAudit.map(url => url.id)))
    
    // Update URL statuses to 'processing'
    setProjectUrls(prev => prev.map(url => 
      selectedUrls.has(url.id) 
        ? { ...url, status: 'processing' as const }
        : url
    ))

    try {
      // Call the real comprehensive audit API
      const response = await fetch(`/api/projects/${selectedProject.id}/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          urlIds: Array.from(selectedUrls)
          // No topic - link audits are technical only
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Audit failed')
      }

      const data = await response.json()
      
      // Reload project URLs to get updated data
      await loadProjectUrls(selectedProject.id)
      
      toast.success(`Completed audit for ${urlsToAudit.length} URLs`)
      setSelectedUrls(new Set())
      setProcessingUrls(new Set())
      
    } catch (error: any) {
      console.error('Link audit error:', error)
      toast.error(error.message || 'Failed to run link audit')
      
      // Mark URLs as failed
      setProjectUrls(prev => prev.map(url => 
        selectedUrls.has(url.id) 
          ? { ...url, status: 'failed' as const }
          : url
      ))
      setProcessingUrls(new Set())
    } finally {
      setRunningAudit(false)
    }
  }

  const toggleUrlSelection = (urlId: string) => {
    const newSelection = new Set(selectedUrls)
    if (newSelection.has(urlId)) {
      newSelection.delete(urlId)
    } else {
      newSelection.add(urlId)
    }
    setSelectedUrls(newSelection)
  }

  const selectAllUrls = () => {
    if (selectedUrls.size === projectUrls.length) {
      setSelectedUrls(new Set())
    } else {
      setSelectedUrls(new Set(projectUrls.map(url => url.id)))
    }
  }

  const getBooleanIcon = (value?: boolean | null) => {
    if (value === undefined || value === null) return <Minus className="h-4 w-4 text-gray-300" />
    if (value) return <CheckCircle className="h-4 w-4 text-green-500" />
    return <XCircle className="h-4 w-4 text-red-500" />
  }

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400'
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loadingProjects) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-gray-900">AI Visibility</h1>
              {projects.length > 0 && (
                <Select
                  value={selectedProject?.id || ''}
                  onValueChange={(value) => {
                    const project = projects.find(p => p.id === value)
                    setSelectedProject(project || null)
                  }}
                >
                  <SelectTrigger className="w-64 bg-white border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200">
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id} className="text-gray-900">
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">{project.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-gray-200">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white border border-gray-200">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>
                    Set up a new project for your website domain
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Project Name</label>
                    <Input
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="My Website Project"
                      className="bg-white border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Root Domain</label>
                    <Input
                      value={newProjectDomain}
                      onChange={(e) => setNewProjectDomain(e.target.value)}
                      placeholder="example.com"
                      className="bg-white border-gray-200"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={createProject}
                      disabled={creatingProject}
                      className="flex-1 bg-gray-900 text-white hover:bg-gray-800"
                    >
                      {creatingProject ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Globe className="h-4 w-4 mr-2" />
                      )}
                      Create Project
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCreateProject(false)}
                      className="border-gray-200"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabs */}
        {selectedProject && (
          <div className="border-b border-gray-200">
            <div className="px-6">
              <div className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('visibility')}
                  className={cn(
                    "py-4 px-1 border-b-2 font-medium text-sm transition-all",
                    activeTab === 'visibility'
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  Visibility
                </button>
                <button
                  onClick={() => setActiveTab('pages')}
                  className={cn(
                    "py-4 px-1 border-b-2 font-medium text-sm transition-all",
                    activeTab === 'pages'
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  Pages
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {!selectedProject ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Globe className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">No projects yet</h3>
            <p className="text-gray-500 text-center mb-6 max-w-md">
              Create your first project to start tracking AI visibility
            </p>
            <Button onClick={() => setShowCreateProject(true)} className="bg-gray-900 text-white hover:bg-gray-800">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Project
            </Button>
          </div>
        ) : (
          <>
            {activeTab === 'visibility' && (
              <>
                {/* Visibility Tab Content */}
                {loadingVisibility ? (
                <div className="space-y-6">
                  {/* Loading skeleton */}
                  <ChartSkeleton 
                    showHeader={true}
                    showStats={true}
                    className="h-96"
                  />
                  <div className="grid grid-cols-2 gap-6">
                    <ListSkeleton 
                      itemType="basic"
                      items={3}
                      showProgress={true}
                      className="h-64"
                    />
                    <ListSkeleton 
                      itemType="basic"
                      items={4}
                      showProgress={false}
                      className="h-64"
                    />
                  </div>
                  <TableSkeleton 
                    rows={5}
                    columns={[
                      { span: 1, align: 'center' },
                      { span: 5, align: 'left' },
                      { span: 3, align: 'right' },
                      { span: 3, align: 'right' }
                    ]}
                    showExpandableRows={false}
                  />
                </div>
              ) : !visibilityData ? (
                /* Empty state */
                <div className="border border-gray-200 rounded-lg p-12 text-center">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No visibility data yet</h3>
                  <p className="text-gray-500 mb-6">Run your first AI visibility test to see how your content performs</p>
                  <Button 
                    onClick={() => {
                      // TODO: Trigger visibility test
                      toast.info('Visibility test feature coming soon!')
                    }}
                    className="bg-gray-900 text-white hover:bg-gray-800"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Run Visibility Test
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Visibility Score Card with Chart */}
                  <div className="border border-gray-200 rounded-lg p-6 bg-white">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">AI Visibility Score</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          How often {selectedProject.name} appears in AI-generated answers
                        </p>
                      </div>
                      <Badge variant="outline" className="border-gray-200 text-gray-600">
                        Last 30 Days
                      </Badge>
                    </div>
                    
                    {/* Score Metrics */}
                    <div className="grid grid-cols-4 gap-6 mb-8">
                      <div>
                        <div className="text-3xl font-semibold text-gray-900">
                          {visibilityData.overallScore}%
                          {visibilityData.trend !== 0 && (
                            <span className={cn(
                              "text-sm font-normal ml-2",
                              visibilityData.trend > 0 ? 'text-green-600' : 'text-red-600'
                            )}>
                              {visibilityData.trend > 0 ? '+' : ''}{visibilityData.trend}%
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Visibility Score</p>
                      </div>
                      <div>
                        <div className="text-3xl font-semibold text-gray-900">
                          #{visibilityData.rank}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Market Rank</p>
                      </div>
                      <div>
                        <div className="text-3xl font-semibold text-gray-900">
                          {visibilityData.shareOfVoice}%
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Share of Voice</p>
                      </div>
                      <div>
                        <div className="text-3xl font-semibold text-gray-900">
                          {visibilityData.citations.owned + visibilityData.citations.operated + visibilityData.citations.earned}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Total Citations</p>
                      </div>
                    </div>

                    {/* Visibility Chart */}
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={visibilityData.scoreHistory}
                          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                        >
                          <defs>
                            <linearGradient id="visibilityGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#6B7280" stopOpacity={0.1} />
                              <stop offset="100%" stopColor="#6B7280" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            vertical={false}
                            horizontal={true}
                            strokeDasharray="0"
                            stroke="#E5E7EB"
                            strokeOpacity={1}
                          />
                          <XAxis
                            dataKey="date"
                            axisLine={{ stroke: '#E5E7EB', strokeWidth: 1 }}
                            tickLine={false}
                            tick={{ 
                              fill: '#6B7280', 
                              fontSize: 12
                            }}
                            tickMargin={12}
                          />
                          <YAxis
                            axisLine={{ stroke: '#E5E7EB', strokeWidth: 1 }}
                            tickLine={false}
                            tick={{ 
                              fill: '#6B7280', 
                              fontSize: 12
                            }}
                            domain={[0, 100]}
                            tickMargin={12}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #E5E7EB',
                              borderRadius: '6px'
                            }}
                            labelStyle={{ color: '#111827' }}
                          />
                          <Area
                            type="monotone"
                            dataKey="score"
                            stroke="#6B7280"
                            strokeWidth={2}
                            fill="url(#visibilityGradient)"
                            animationDuration={800}
                            animationEasing="ease-out"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Topics and Citations Row */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Topics Performance */}
                    <div className="border border-gray-200 rounded-lg p-6 bg-white">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Topic Performance</h3>
                      <div className="space-y-3">
                        {visibilityData.topics.map((topic, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-900">{topic.topic}</span>
                                <span className="text-sm text-gray-500">{topic.score}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gray-600 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${topic.score}%` }}
                                />
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{topic.mentions} mentions</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Citation Breakdown */}
                    <div className="border border-gray-200 rounded-lg p-6 bg-white">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Citation Sources</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-700">Owned Content</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{visibilityData.citations.owned}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-sm text-gray-700">Operated Content</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{visibilityData.citations.operated}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                            <span className="text-sm text-gray-700">Earned Mentions</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{visibilityData.citations.earned}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                            <span className="text-sm text-gray-700">Competitor Citations</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{visibilityData.citations.competitor}</span>
                        </div>
                      </div>
                      
                      {/* Citation Bar Chart */}
                      <div className="mt-6 h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { name: 'Owned', value: visibilityData.citations.owned, fill: '#10B981' },
                              { name: 'Operated', value: visibilityData.citations.operated, fill: '#3B82F6' },
                              { name: 'Earned', value: visibilityData.citations.earned, fill: '#8B5CF6' },
                              { name: 'Competitor', value: visibilityData.citations.competitor, fill: '#9CA3AF' }
                            ]}
                            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                          >
                            <XAxis 
                              dataKey="name" 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: '#6B7280', fontSize: 11 }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                              {[0, 1, 2, 3].map((index) => (
                                <Cell key={`cell-${index}`} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Competitors Table */}
                  <div className="border border-gray-200 rounded-lg bg-white">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">Competitive Analysis</h3>
                    </div>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rank
                          </th>
                          <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Company
                          </th>
                          <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Visibility Score
                          </th>
                          <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Change
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {visibilityData.competitors.map((competitor, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium text-gray-600">
                                    {competitor.name.charAt(0)}
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  {competitor.name}
                                </span>
                                {competitor.name === selectedProject.name && (
                                  <Badge variant="outline" className="text-xs border-gray-200 text-gray-600">
                                    You
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm font-medium text-gray-900">
                                {competitor.score}%
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end space-x-1">
                                {competitor.trend > 0 ? (
                                  <TrendingUp className="h-4 w-4 text-green-500" />
                                ) : competitor.trend < 0 ? (
                                  <TrendingDown className="h-4 w-4 text-red-500" />
                                ) : null}
                                <span className={cn(
                                  "text-sm font-medium",
                                  competitor.trend > 0 ? 'text-green-600' : 
                                  competitor.trend < 0 ? 'text-red-600' : 'text-gray-500'
                                )}>
                                  {competitor.trend > 0 ? '+' : ''}{competitor.trend}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Recommendations */}
                  <div className="border border-gray-200 rounded-lg p-6 bg-white">
                    <div className="flex items-center space-x-2 mb-4">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      <h3 className="text-lg font-medium text-gray-900">AI Visibility Recommendations</h3>
                    </div>
                    <div className="space-y-3">
                      {visibilityData.suggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className={cn(
                            "px-2 py-1 rounded text-xs font-medium",
                            suggestion.priority === 'high' ? 'bg-red-100 text-red-700' :
                            suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          )}>
                            {suggestion.priority}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{suggestion.topic}</p>
                            <p className="text-sm text-gray-600 mt-1">{suggestion.suggestion}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div className="text-center text-sm text-gray-500">
                    Last updated: {new Date(visibilityData.lastUpdated).toLocaleString()}
                  </div>
                </div>
              )}
              </>
            )}

            {activeTab === 'pages' && (
              <div className="space-y-4">
                {/* Action Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllUrls}
                      className="border-gray-200"
                    >
                      {selectedUrls.size === projectUrls.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    {selectedUrls.size > 0 && (
                      <span className="text-sm text-gray-500">
                        {selectedUrls.size} selected
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Input
                        value={newUrlInput}
                        onChange={(e) => setNewUrlInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            addUrlToProject()
                          }
                        }}
                        placeholder="Add URLs (one per line)"
                        className="w-64 bg-white border-gray-200"
                      />
                      <Button
                        onClick={addUrlToProject}
                        variant="outline"
                        className="border-gray-200"
                      >
                        Add
                      </Button>
                    </div>
                    
                    <Button 
                      onClick={runLinkAudit}
                      disabled={runningAudit || selectedUrls.size === 0}
                      className="bg-gray-900 text-white hover:bg-gray-800"
                    >
                      {runningAudit ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Audit Links
                    </Button>
                  </div>
                </div>

                {/* Data Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1200px]">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="w-10 px-4 py-3"></th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            URL
                          </th>
                          <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Score
                          </th>
                          <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Crawl
                          </th>
                          <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            SSR
                          </th>
                          <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            FAQ
                          </th>
                          <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            H1
                          </th>
                          <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Words
                          </th>
                          <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Links
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {loadingUrls ? (
                          <tr>
                            <td colSpan={10} className="px-4 py-8 text-center">
                              <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto" />
                            </td>
                          </tr>
                        ) : projectUrls.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                              No URLs added yet. Add your first URL above.
                            </td>
                          </tr>
                        ) : (
                          projectUrls.map((url) => (
                            <tr 
                              key={url.id} 
                              className={cn(
                                "hover:bg-gray-50 cursor-pointer transition-colors"
                              )}
                              onClick={() => {
                                setSelectedUrlDetail(url)
                                if (url.status === 'analyzed') {
                                  loadDetailedAudit(url.id)
                                }
                              }}
                            >
                              {processingUrls.has(url.id) ? (
                                /* Skeleton Row */
                                <>
                                  <td className="px-4 py-4">
                                    <Checkbox disabled />
                                  </td>
                                  <td className="px-4 py-4">
                                    <Skeleton className="h-4 w-3/4" />
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    <Skeleton className="h-4 w-12 mx-auto" />
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    <Skeleton className="h-4 w-8 mx-auto" />
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    <Skeleton className="h-4 w-8 mx-auto" />
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    <Skeleton className="h-4 w-8 mx-auto" />
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    <Skeleton className="h-4 w-8 mx-auto" />
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    <Skeleton className="h-4 w-16 mx-auto" />
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    <Skeleton className="h-4 w-12 mx-auto" />
                                  </td>
                                  <td className="px-4 py-4">
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                      Processing
                                    </Badge>
                                  </td>
                                </>
                              ) : (
                                /* Normal Row */
                                <>
                                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                      checked={selectedUrls.has(url.id)}
                                      onCheckedChange={() => toggleUrlSelection(url.id)}
                                    />
                                  </td>
                                  <td className="px-4 py-4">
                                    <div className="flex items-center space-x-2">
                                      <ExternalLink className="h-4 w-4 text-gray-400" />
                                      <span className="text-sm text-gray-900 truncate max-w-md">
                                        {url.url}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    {url.page_score ? (
                                      <span className={cn("font-medium", getScoreColor(url.page_score))}>
                                        {url.page_score}
                                      </span>
                                    ) : (
                                      <Minus className="h-4 w-4 text-gray-300 mx-auto" />
                                    )}
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    {getBooleanIcon(url.crawlable)}
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    {getBooleanIcon(url.ssr_rendered)}
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    {getBooleanIcon(url.faq_schema_present)}
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    {getBooleanIcon(url.h1_present)}
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    {url.word_count ? (
                                      <span className="text-sm text-gray-600">{url.word_count}</span>
                                    ) : (
                                      <Minus className="h-4 w-4 text-gray-300 mx-auto" />
                                    )}
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    {url.internal_link_count !== undefined && url.external_eeat_links !== undefined ? (
                                      <span className="text-sm text-gray-600">
                                        {url.internal_link_count}/{url.external_eeat_links}
                                      </span>
                                    ) : (
                                      <Minus className="h-4 w-4 text-gray-300 mx-auto" />
                                    )}
                                  </td>
                                  <td className="px-4 py-4">
                                    {url.status === 'analyzed' ? (
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Analyzed
                                      </Badge>
                                    ) : url.status === 'failed' ? (
                                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Failed
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                                        <Clock className="h-3 w-3 mr-1" />
                                        Pending
                                      </Badge>
                                    )}
                                  </td>
                                </>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Side Drawer */}
      <Sheet open={!!selectedUrlDetail} onOpenChange={() => {
        setSelectedUrlDetail(null)
        setDetailedAudit(null)
      }}>
        <SheetContent className="bg-white border-l border-gray-200 max-w-2xl w-full overflow-y-auto">
          <SheetHeader className="border-b border-gray-200 pb-4">
            <SheetTitle className="text-lg font-medium">
              Page Analysis
            </SheetTitle>
            <SheetDescription className="text-sm text-gray-500">
              {selectedUrlDetail?.url}
            </SheetDescription>
          </SheetHeader>

          <div className="py-6 space-y-6">
            {selectedUrlDetail?.status === 'analyzed' ? (
              loadingDetailedAudit ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : detailedAudit ? (
                <>
                  {/* Score Overview */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="text-2xl font-semibold text-gray-900">
                        {detailedAudit.pageScore || selectedUrlDetail.page_score || '-'}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Overall Score</p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="text-2xl font-semibold text-gray-900">
                        {detailedAudit.seoAnalysis?.wordCount || selectedUrlDetail.word_count || '-'}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Word Count</p>
                    </div>
                  </div>

                  {/* Category Scores */}
                  {detailedAudit.categoryScores && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-900">Category Scores</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Content Quality</span>
                          <span className={cn("text-sm font-medium", getScoreColor(detailedAudit.categoryScores.content_quality))}>
                            {detailedAudit.categoryScores.content_quality}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Technical Health</span>
                          <span className={cn("text-sm font-medium", getScoreColor(detailedAudit.categoryScores.technical_health))}>
                            {detailedAudit.categoryScores.technical_health}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">AI Optimization</span>
                          <span className={cn("text-sm font-medium", getScoreColor(detailedAudit.categoryScores.ai_optimization))}>
                            {detailedAudit.categoryScores.ai_optimization}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Schema Markup</span>
                          <span className={cn("text-sm font-medium", getScoreColor(detailedAudit.categoryScores.schema_markup))}>
                            {detailedAudit.categoryScores.schema_markup}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Technical Details */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-900">Technical Analysis</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Crawlable</span>
                        {getBooleanIcon(detailedAudit.crawlable)}
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">SSR Rendered</span>
                        <div className="flex items-center space-x-2">
                          {getBooleanIcon(detailedAudit.ssrRendered)}
                          <span className="text-xs text-gray-500">
                            ({detailedAudit.technicalMetrics?.renderingMode || 'Unknown'})
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">H1 Present</span>
                        <div className="flex items-center space-x-2">
                          {getBooleanIcon(detailedAudit.seoAnalysis?.h1Present)}
                          {detailedAudit.seoAnalysis?.h1Count > 0 && (
                            <span className="text-xs text-gray-500">
                              ({detailedAudit.seoAnalysis.h1Count} found)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Schema Valid</span>
                        {getBooleanIcon(detailedAudit.schemaAnalysis?.jsonldValid)}
                      </div>
                    </div>
                  </div>

                  {/* Link Analysis */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-900">Link Analysis</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {detailedAudit.linkAnalysis?.internalLinkCount ?? '-'}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Internal</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {detailedAudit.linkAnalysis?.externalEeatLinks ?? '-'}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">E-E-A-T</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {detailedAudit.linkAnalysis?.totalLinks ?? '-'}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Total</p>
                      </div>
                    </div>
                  </div>

                  {/* Issues */}
                  {detailedAudit.issues && detailedAudit.issues.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-900">
                        Issues ({detailedAudit.issues.length})
                      </h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {detailedAudit.issues.map((issue: any, index: number) => (
                          <div key={index} className="p-3 bg-red-50 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-red-900">{issue.rule_id}</p>
                                <p className="text-sm text-red-700 mt-1">{issue.message}</p>
                                {issue.severity && (
                                  <span className="text-xs text-red-600 mt-1">
                                    Severity: {issue.severity}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {detailedAudit.recommendations && detailedAudit.recommendations.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-900">
                        Recommendations ({detailedAudit.recommendations.length})
                      </h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {detailedAudit.recommendations.map((rec: any, index: number) => (
                          <div key={index} className="p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-blue-900">{rec.title}</p>
                                <p className="text-sm text-blue-700 mt-1">{rec.description}</p>
                                {rec.priority && (
                                  <span className={cn(
                                    "text-xs mt-1 inline-block px-2 py-0.5 rounded",
                                    rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                                  )}>
                                    {rec.priority} priority
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Performance Metrics */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-900">Performance Metrics</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs text-gray-500">HTML Size</span>
                        <p className="text-sm font-medium text-gray-900">
                          {detailedAudit.htmlSizeKb ? `${detailedAudit.htmlSizeKb} KB` : '-'}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs text-gray-500">DOM Size</span>
                        <p className="text-sm font-medium text-gray-900">
                          {detailedAudit.domSizeKb ? `${detailedAudit.domSizeKb} KB` : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Basic data from project_urls table */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="text-2xl font-semibold text-gray-900">
                        {selectedUrlDetail.page_score || '-'}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Page Score</p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="text-2xl font-semibold text-gray-900">
                        {selectedUrlDetail.word_count || '-'}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Word Count</p>
                    </div>
                  </div>

                  {/* Technical Details */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-900">Technical Analysis</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Crawlable</span>
                        {getBooleanIcon(selectedUrlDetail.crawlable)}
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">SSR Rendered</span>
                        {getBooleanIcon(selectedUrlDetail.ssr_rendered)}
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">FAQ Schema</span>
                        {getBooleanIcon(selectedUrlDetail.faq_schema_present)}
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">H1 Present</span>
                        {getBooleanIcon(selectedUrlDetail.h1_present)}
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {selectedUrlDetail.technical_recommendations && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-900">Recommendations</h4>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-900">
                          {selectedUrlDetail.technical_recommendations}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )
            ) : (
              <div className="text-center py-12">
                <FileText className="h-8 w-8 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Analysis Data</h3>
                <p className="text-gray-500 mb-6">
                  Run a link audit on this page to see full analysis
                </p>
                <Button
                  onClick={() => {
                    if (selectedUrlDetail) {
                      setSelectedUrls(new Set([selectedUrlDetail.id]))
                      setSelectedUrlDetail(null)
                      runLinkAudit()
                    }
                  }}
                  className="bg-gray-900 text-white hover:bg-gray-800"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Run Audit
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
} 
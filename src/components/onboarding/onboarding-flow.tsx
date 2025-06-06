'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  ArrowLeft,
  BarChart3, 
  Globe, 
  FileText, 
  Zap,
  Copy,
  Check,
  AlertCircle,
  Upload,
  X,
  Plus,
  Sparkles,
  Clock,
  Target,
  Brain
} from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

interface OnboardingFlowProps {
  onComplete?: () => void
}

type OnboardingStep = 'workspace' | 'analytics' | 'content' | 'scanning'

interface WorkspaceData {
  name: string
  email: string
  provider: 'google' | 'github' | 'email' | null
}

interface AnalyticsData {
  provider: 'vercel' | 'ga4' | 'plausible' | null
  domain: string
  isConnected: boolean
  sdkInstalled: boolean
}

interface ContentData {
  cms: string
  keywords: string[]
  competitors: string[]
}

const providers = [
  { id: 'vercel', name: 'Vercel Analytics', logo: '/images/vercel.svg', description: 'Web vitals & traffic data' },
  { id: 'ga4', name: 'Google Analytics 4', logo: '/images/google-analytics.svg', description: 'Comprehensive user insights' },
  { id: 'plausible', name: 'Plausible Analytics', logo: '/images/plausible.svg', description: 'Privacy-focused analytics' }
]

const cmsOptions = [
  { id: 'notion', name: 'Notion', logo: '/images/notion.svg' },
  { id: 'contentful', name: 'Contentful', logo: '/images/contentful.svg' },
  { id: 'wordpress', name: 'WordPress', logo: '/images/wordpress.svg' },
  { id: 'webflow', name: 'Webflow', logo: '/images/webflow.svg' },
  { id: 'ghost', name: 'Ghost', logo: '/images/ghost.svg' },
  { id: 'other', name: 'Other', logo: null }
]

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('workspace')
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [copiedSdk, setCopiedSdk] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanStage, setScanStage] = useState('Crawling your site...')

  // Form data
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData>({
    name: '',
    email: '',
    provider: null
  })
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    provider: null,
    domain: '',
    isConnected: false,
    sdkInstalled: false
  })
  
  const [contentData, setContentData] = useState<ContentData>({
    cms: '',
    keywords: [],
    competitors: []
  })

  const [newKeyword, setNewKeyword] = useState('')
  const [newCompetitor, setNewCompetitor] = useState('')

  // Progress calculation
  useEffect(() => {
    switch (currentStep) {
      case 'workspace':
        setProgress(0)
        break
      case 'analytics':
        setProgress(33)
        break
      case 'content':
        setProgress(66)
        break
      case 'scanning':
        setProgress(100)
        break
    }
  }, [currentStep])

  // Mock scanning simulation
  useEffect(() => {
    if (currentStep === 'scanning') {
      const stages = [
        'Crawling your site...',
        'Running 100 AI prompts...',
        'Analyzing competitor landscape...',
        'Calculating visibility score...',
        'Generating content gaps...'
      ]
      
      let stageIndex = 0
      let progressValue = 0
      
      const interval = setInterval(() => {
        progressValue += Math.random() * 15 + 5
        
        if (progressValue >= 100) {
          progressValue = 100
          setScanProgress(100)
          clearInterval(interval)
          setTimeout(() => onComplete?.(), 1000)
          return
        }
        
        setScanProgress(progressValue)
        
        // Update stage every 20% progress
        const newStageIndex = Math.floor(progressValue / 20)
        if (newStageIndex !== stageIndex && newStageIndex < stages.length) {
          stageIndex = newStageIndex
          setScanStage(stages[stageIndex])
        }
      }, 800)
      
      return () => clearInterval(interval)
    }
  }, [currentStep, onComplete])

  const handleNext = async () => {
    setIsLoading(true)
    
    // Simulate API calls
    await new Promise(resolve => setTimeout(resolve, 500))
    
    switch (currentStep) {
      case 'workspace':
        setCurrentStep('analytics')
        break
      case 'analytics':
        setCurrentStep('content')
        break
      case 'content':
        setCurrentStep('scanning')
        break
    }
    
    setIsLoading(false)
  }

  const handleBack = () => {
    switch (currentStep) {
      case 'analytics':
        setCurrentStep('workspace')
        break
      case 'content':
        setCurrentStep('analytics')
        break
    }
  }

  const handleProviderAuth = (provider: 'google' | 'github' | 'email') => {
    setWorkspaceData(prev => ({ ...prev, provider }))
    // Simulate auth success
    setTimeout(() => {
      setWorkspaceData(prev => ({ 
        ...prev, 
        email: provider === 'google' ? 'user@gmail.com' : provider === 'github' ? 'user@github.com' : prev.email,
        name: prev.name || 'My Workspace'
      }))
    }, 1000)
  }

  const handleAnalyticsConnect = (provider: 'vercel' | 'ga4' | 'plausible') => {
    setAnalyticsData(prev => ({ ...prev, provider }))
    // Simulate connection
    setTimeout(() => {
      setAnalyticsData(prev => ({ ...prev, isConnected: true }))
    }, 1500)
  }

  const handleDomainCheck = () => {
    if (analyticsData.domain) {
      // Simulate DNS check
      setTimeout(() => {
        setAnalyticsData(prev => ({ ...prev, isConnected: true }))
      }, 1000)
    }
  }

  const copySdkCommand = () => {
    navigator.clipboard.writeText('npx create-split@latest')
    setCopiedSdk(true)
    setTimeout(() => setCopiedSdk(false), 2000)
    
    // Simulate SDK installation detection
    setTimeout(() => {
      setAnalyticsData(prev => ({ ...prev, sdkInstalled: true }))
    }, 3000)
  }

  const addKeyword = () => {
    if (newKeyword.trim()) {
      setContentData(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }))
      setNewKeyword('')
    }
  }

  const removeKeyword = (index: number) => {
    setContentData(prev => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index)
    }))
  }

  const addCompetitor = () => {
    if (newCompetitor.trim()) {
      setContentData(prev => ({
        ...prev,
        competitors: [...prev.competitors, newCompetitor.trim()]
      }))
      setNewCompetitor('')
    }
  }

  const removeCompetitor = (index: number) => {
    setContentData(prev => ({
      ...prev,
      competitors: prev.competitors.filter((_, i) => i !== index)
    }))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 'workspace':
        return workspaceData.provider && workspaceData.name && workspaceData.email
      case 'analytics':
        return analyticsData.provider && analyticsData.domain
      case 'content':
        return contentData.keywords.length > 0
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">Split Setup</h1>
                <p className="text-sm text-[#666]">Get your AEO engine running in under 5 minutes</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-[#666] mb-1">{Math.round(progress)}% complete</div>
              <div className="w-32 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-white rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className={currentStep === 'workspace' ? 'text-white' : 'text-[#666]'}>
              Create Workspace
            </span>
            <span className="text-[#333]">→</span>
            <span className={currentStep === 'analytics' ? 'text-white' : 'text-[#666]'}>
              Connect Analytics
            </span>
            <span className="text-[#333]">→</span>
            <span className={currentStep === 'content' ? 'text-white' : 'text-[#666]'}>
              Describe Content
            </span>
            <span className="text-[#333]">→</span>
            <span className={currentStep === 'scanning' ? 'text-white' : 'text-[#666]'}>
              First Scan
            </span>
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {/* Step 1: Create Workspace */}
          {currentStep === 'workspace' && (
            <motion.div
              key="workspace"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-[#0a0a0a] border-[#1a1a1a]">
                <CardContent className="p-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-white mb-2">Create Your Workspace</h2>
                    <p className="text-[#888]">One account, unlimited projects. You can invite teammates later.</p>
                  </div>

                  {/* Auth Buttons */}
                  <div className="space-y-3 mb-6">
                    <Button
                      onClick={() => handleProviderAuth('google')}
                      className="w-full h-12 bg-white hover:bg-gray-100 text-black font-medium flex items-center gap-3"
                      disabled={workspaceData.provider === 'google'}
                    >
                      {workspaceData.provider === 'google' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <div className="w-5 h-5 bg-red-500 rounded" />
                      )}
                      Continue with Google
                    </Button>
                    
                    <Button
                      onClick={() => handleProviderAuth('github')}
                      className="w-full h-12 bg-[#1a1a1a] hover:bg-[#222] text-white font-medium flex items-center gap-3 border border-[#333]"
                      disabled={workspaceData.provider === 'github'}
                    >
                      {workspaceData.provider === 'github' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      ) : (
                        <div className="w-5 h-5 bg-gray-800 rounded" />
                      )}
                      Continue with GitHub
                    </Button>
                  </div>

                  {/* Workspace Name */}
                  {workspaceData.provider && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Workspace Name
                        </label>
                        <Input
                          value={workspaceData.name}
                          onChange={(e) => setWorkspaceData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="My Company"
                          className="bg-[#1a1a1a] border-[#333] text-white"
                        />
                      </div>
                      
                      {workspaceData.provider === 'email' && (
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Email Address
                          </label>
                          <Input
                            type="email"
                            value={workspaceData.email}
                            onChange={(e) => setWorkspaceData(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="you@company.com"
                            className="bg-[#1a1a1a] border-[#333] text-white"
                          />
                        </div>
                      )}
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Connect Analytics */}
          {currentStep === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-[#0a0a0a] border-[#1a1a1a]">
                <CardContent className="p-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-white mb-2">Connect Your Site & Analytics</h2>
                    <p className="text-[#888]">We pull only read-only traffic data to analyze your visibility.</p>
                  </div>

                  {/* Provider Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-white mb-3">
                      Select Analytics Provider
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {providers.map((provider) => (
                        <button
                          key={provider.id}
                          onClick={() => handleAnalyticsConnect(provider.id as any)}
                          className={`p-4 rounded-lg border text-left transition-all ${
                            analyticsData.provider === provider.id
                              ? 'border-white bg-[#1a1a1a]'
                              : 'border-[#333] hover:border-[#444] bg-[#0a0a0a]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#1a1a1a] rounded border border-[#333] flex items-center justify-center">
                              {analyticsData.provider === provider.id && analyticsData.isConnected ? (
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                              ) : (
                                <div className="w-3 h-3 bg-[#666] rounded" />
                              )}
                            </div>
                            <div>
                              <div className="text-white font-medium">{provider.name}</div>
                              <div className="text-[#666] text-sm">{provider.description}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Domain Input */}
                  {analyticsData.provider && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6"
                    >
                      <label className="block text-sm font-medium text-white mb-2">
                        Your Domain
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={analyticsData.domain}
                          onChange={(e) => setAnalyticsData(prev => ({ ...prev, domain: e.target.value }))}
                          placeholder="yoursite.com"
                          className="bg-[#1a1a1a] border-[#333] text-white flex-1"
                        />
                        <Button
                          onClick={handleDomainCheck}
                          variant="outline"
                          className="border-[#333] hover:border-[#444]"
                          disabled={!analyticsData.domain}
                        >
                          {analyticsData.isConnected ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                          ) : (
                            'Verify'
                          )}
                        </Button>
                      </div>
                      <p className="text-[#666] text-xs mt-1">Use root domain — sub-pages auto-found.</p>
                    </motion.div>
                  )}

                  {/* SDK Installation */}
                  {analyticsData.isConnected && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-white font-medium">Install SDK</h3>
                          <p className="text-[#666] text-sm">Run this command in your project</p>
                        </div>
                        {analyticsData.sdkInstalled && (
                          <div className="flex items-center gap-2 text-green-400 text-sm">
                            <CheckCircle2 className="w-4 h-4" />
                            Connected
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-[#0a0a0a] border border-[#333] rounded p-3 font-mono text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[#ccc]">npx create-split@latest</span>
                          <Button
                            onClick={copySdkCommand}
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                          >
                            {copiedSdk ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      {!analyticsData.sdkInstalled && (
                        <div className="flex items-center gap-2 mt-3 text-[#666] text-sm">
                          <div className="w-2 h-2 bg-[#666] rounded-full animate-pulse" />
                          Waiting for first heartbeat...
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Skip Option */}
                  <div className="mt-6 pt-4 border-t border-[#1a1a1a]">
                    <button className="text-[#666] text-sm hover:text-white transition-colors">
                      Skip for now → Limited insights until data connected
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Describe Content */}
          {currentStep === 'content' && (
            <motion.div
              key="content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-[#0a0a0a] border-[#1a1a1a]">
                <CardContent className="p-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-white mb-2">Describe Your Content</h2>
                    <p className="text-[#888]">Help our AI understand your domain and content strategy.</p>
                  </div>

                  <div className="space-y-6">
                    {/* CMS Selection */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-3">
                        Content Management System
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {cmsOptions.map((cms) => (
                          <button
                            key={cms.id}
                            onClick={() => setContentData(prev => ({ ...prev, cms: cms.id }))}
                            className={`p-3 rounded-lg border text-center transition-all ${
                              contentData.cms === cms.id
                                ? 'border-white bg-[#1a1a1a]'
                                : 'border-[#333] hover:border-[#444] bg-[#0a0a0a]'
                            }`}
                          >
                            <div className="text-white text-sm font-medium">{cms.name}</div>
                          </button>
                        ))}
                      </div>
                      <p className="text-[#666] text-xs mt-1">Enables 1-click export later.</p>
                    </div>

                    {/* Keywords */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Keywords & Topics
                      </label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={newKeyword}
                          onChange={(e) => setNewKeyword(e.target.value)}
                          placeholder="Add keyword..."
                          className="bg-[#1a1a1a] border-[#333] text-white flex-1"
                          onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                        />
                        <Button
                          onClick={addKeyword}
                          size="sm"
                          variant="outline"
                          className="border-[#333] hover:border-[#444]"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {contentData.keywords.map((keyword, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1 bg-[#1a1a1a] border border-[#333] rounded px-2 py-1"
                          >
                            <span className="text-white text-sm">{keyword}</span>
                            <button
                              onClick={() => removeKeyword(index)}
                              className="text-[#666] hover:text-white"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-[#666] text-xs">Guides our gap analysis.</p>
                    </div>

                    {/* Competitors */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Competitors (Optional)
                      </label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={newCompetitor}
                          onChange={(e) => setNewCompetitor(e.target.value)}
                          placeholder="competitor.com"
                          className="bg-[#1a1a1a] border-[#333] text-white flex-1"
                          onKeyPress={(e) => e.key === 'Enter' && addCompetitor()}
                        />
                        <Button
                          onClick={addCompetitor}
                          size="sm"
                          variant="outline"
                          className="border-[#333] hover:border-[#444]"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {contentData.competitors.map((competitor, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1 bg-[#1a1a1a] border border-[#333] rounded px-2 py-1"
                          >
                            <span className="text-white text-sm">{competitor}</span>
                            <button
                              onClick={() => removeCompetitor(index)}
                              className="text-[#666] hover:text-white"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-[#666] text-xs">Benchmarks visibility score.</p>
                    </div>
                  </div>

                  {/* Skip Note */}
                  <div className="mt-6 pt-4 border-t border-[#1a1a1a]">
                    <p className="text-[#666] text-sm">
                      💡 Skip any field — you can refine later in Settings › Knowledge Base.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Scanning */}
          {currentStep === 'scanning' && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-[#0a0a0a] border-[#1a1a1a]">
                <CardContent className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <Sparkles className="w-8 h-8 text-black" />
                  </motion.div>

                  <h2 className="text-2xl font-semibold text-white mb-2">First Visibility Scan</h2>
                  <p className="text-[#888] mb-8">Analyzing your content across 100+ AI prompts...</p>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="w-full bg-[#1a1a1a] rounded-full h-2 overflow-hidden mb-2">
                      <motion.div 
                        className="h-full bg-white rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${scanProgress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                    <div className="text-[#666] text-sm">{Math.round(scanProgress)}% complete</div>
                  </div>

                  {/* Current Stage */}
                  <div className="flex items-center justify-center gap-2 text-white">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Brain className="w-4 h-4" />
                    </motion.div>
                    <span className="text-sm">{scanStage}</span>
                  </div>

                  {/* What's Happening Sidebar */}
                  <div className="mt-8 bg-[#1a1a1a] border border-[#333] rounded-lg p-4 text-left">
                    <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      What's happening
                    </h3>
                    <div className="space-y-2 text-sm text-[#888]">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${scanProgress > 20 ? 'bg-green-400' : 'bg-[#333]'}`} />
                        Crawling your site structure
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${scanProgress > 40 ? 'bg-green-400' : 'bg-[#333]'}`} />
                        Running 100 AI prompts
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${scanProgress > 60 ? 'bg-green-400' : 'bg-[#333]'}`} />
                        Analyzing competitor landscape
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${scanProgress > 80 ? 'bg-green-400' : 'bg-[#333]'}`} />
                        Calculating visibility score
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${scanProgress > 95 ? 'bg-green-400' : 'bg-[#333]'}`} />
                        Generating content gaps
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        {currentStep !== 'scanning' && (
          <div className="flex items-center justify-between mt-8">
            <Button
              onClick={handleBack}
              variant="ghost"
              className="text-[#666] hover:text-white"
              disabled={currentStep === 'workspace'}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed() || isLoading}
              className="bg-white text-black hover:bg-gray-100 font-medium"
            >
              {isLoading ? (
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
              ) : (
                <>
                  {currentStep === 'content' ? 'Start Scan' : 'Continue'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
} 
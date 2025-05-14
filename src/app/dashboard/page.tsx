'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

import { 
  PlusCircle, 
  FileText, 
  Search, 
  Globe, 
  Calendar, 
  ArrowRight,
  Rocket,
  X,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  HelpCircleIcon
} from 'lucide-react'

interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'pending' | 'completed' | 'archived';
  visibility_score?: number;
  created_at: string;
  updated_at: string;
}

export default function Dashboard() {
  const { user, supabase, loading } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [showWelcomePopup, setShowWelcomePopup] = useState(true)
  const [tempProjects, setTempProjects] = useState<Project[]>([])
  
  // Onboarding state - in real app, would be stored in database
  const [onboardingStep, setOnboardingStep] = useState(1) // 1: Connect site, 2: Run audit, 3: Create project
  const [siteConnected, setSiteConnected] = useState(false)
  const [auditRun, setAuditRun] = useState(false)
  
  useEffect(() => {
    const fetchProjects = async () => {
      if (!supabase || !user) return
      
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('Error fetching projects:', error)
          return
        }
        
        // In demo mode, don't load actual projects from database
        setProjects([])
      } catch (err) {
        console.error('Failed to fetch projects:', err)
      } finally {
        setIsLoadingProjects(false)
      }
    }
    
    if (user && supabase) {
      fetchProjects()
    } else {
      setIsLoadingProjects(false)
    }
  }, [user, supabase])

  // Update onboarding step when actions are completed
  useEffect(() => {
    if (siteConnected && !auditRun) {
      setOnboardingStep(2)
    } else if (siteConnected && auditRun) {
      setOnboardingStep(3)
    }
  }, [siteConnected, auditRun])

  const createNewProject = async () => {
    // Create a temporary project without saving to database
    const newProject = {
      id: Math.random().toString(36).substring(2, 9),
      name: 'New AEO Project',
      description: 'My new optimization project',
      status: 'active' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    setTempProjects([newProject, ...tempProjects])
  }

  const connectSite = () => {
    setSiteConnected(true)
  }

  const runAudit = () => {
    setAuditRun(true)
  }

  // CSS styles for custom badges to match the screenshot
  const customBadgeClass = "bg-transparent border border-[#FF914D] text-white h-7 px-3";
  const customBadgeStyle = {
    background: "linear-gradient(to bottom, rgba(255, 145, 77, 0.3), rgba(255, 236, 159, 0.3))"
  };

  if (loading || isLoadingProjects) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0c0c0c]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-white" />
      </div>
    )
  }

  // Combine actual projects and temporary ones
  const displayProjects = [...tempProjects, ...projects]

  return (
    <main className="flex flex-1 flex-col gap-8 p-8 overflow-auto bg-[#0c0c0c] bg-[radial-gradient(#222222_0.7px,transparent_0.7px)] bg-[size:24px_24px] relative">
      {/* Welcome Popup */}
      <AnimatePresence>
        {showWelcomePopup && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-6 right-6 bg-[#0f0f0f] border border-[#222222] shadow-lg rounded-lg p-4 max-w-sm z-50"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-xs text-gray-400 font-medium">Welcome to Split</p>
                <h3 className="text-white text-lg pt-2 font-semibold">Getting Started</h3>
              </div>
              <button 
                onClick={() => setShowWelcomePopup(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-300 mb-3">
              We're excited to have you here! If you're ready to get started, follow our onboarding guide to get your first project up and running. If you have questions, our community is here to help.
            </p>
            <div className="flex justify-between items-center">
              <button 
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                onClick={() => setShowWelcomePopup(false)}
              >
                <HelpCircleIcon size={14} />
                <span>Get Help</span>
              </button>
              <Button 
                className="bg-gradient-to-r from-[#222222] to-[#2a2a2a] text-white hover:from-[#282828] hover:to-[#333333] border border-[#333333]"
                size="sm"
                onClick={() => setShowWelcomePopup(false)}
              >
                Got it
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        
        <Button 
          className="bg-gradient-to-r from-[#222222] to-[#2a2a2a] text-white hover:from-[#282828] hover:to-[#333333] border border-[#333333]"
          onClick={createNewProject}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Getting Started Card */}
      <Card className="bg-[#101010] border-[#222222] border shadow-md relative">
        <CardHeader className="border-b border-[#222222]/50 pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium text-white">Onboarding Guide</CardTitle>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${onboardingStep >= 1 ? 'bg-gradient-to-b from-[#FF914D] to-[#FFEC9F]' : 'bg-[#333333]'}`}></div>
                <div className={`w-2.5 h-2.5 rounded-full ${onboardingStep >= 2 ? 'bg-gradient-to-b from-[#FF914D] to-[#FFEC9F]' : 'bg-[#333333]'}`}></div>
                <div className={`w-2.5 h-2.5 rounded-full ${onboardingStep >= 3 ? 'bg-gradient-to-b from-[#FF914D] to-[#FFEC9F]' : 'bg-[#333333]'}`}></div>
              </div>
              <span className="text-sm text-gray-400">Step {onboardingStep} of 3</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Step 1: Connect Site */}
            <div 
              className={`flex items-start p-5 rounded-lg border shadow-sm relative ${
                onboardingStep === 1 
                  ? "bg-[#171717] border-white/20 ring-1 ring-white/10" 
                  : siteConnected 
                    ? "bg-[#171717] border-[#222222]/70 opacity-75" 
                    : "bg-[#171717] border-[#222222]/70"
              }`}
            >
              <div className="absolute -top-3 -left-3 h-7 w-7 rounded-full bg-[#1d1d1d] flex items-center justify-center border border-[#333333]">
                <span className="text-sm font-medium text-white">1</span>
              </div>
              <div className="h-10 w-10 rounded-full bg-[#222222] flex items-center justify-center mr-3 mt-1">
                <Globe className="h-5 w-5 text-white/90" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-white">Connect Your Site</p>
                  {siteConnected && <CheckCircle className="h-4 w-4 text-green-400" />}
                </div>
                <p className="text-xs text-gray-400 mb-3">Connect your website to allow Split to analyze and optimize your content</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`border-[#333333] w-full ${
                    siteConnected
                      ? "bg-[#222222] text-gray-300"
                      : "bg-gradient-to-r from-[#222222] to-[#2a2a2a] text-white hover:from-[#282828] hover:to-[#333333]"
                  }`}
                  onClick={connectSite}
                  disabled={siteConnected}
                >
                  {siteConnected ? "Connected" : "Connect Site"}
                </Button>
              </div>
              {onboardingStep === 1 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute -right-3 top-1/2 transform -translate-y-1/2 text-white"
                >
                  <ChevronRight size={20} />
                </motion.div>
              )}
            </div>
            
            {/* Step 2: Run Audit */}
            <div 
              className={`flex items-start p-5 rounded-lg border shadow-sm relative ${
                onboardingStep === 2 
                  ? "bg-[#171717] border-white/20 ring-1 ring-white/10" 
                  : auditRun 
                    ? "bg-[#171717] border-[#222222]/70 opacity-75" 
                    : onboardingStep < 2 
                      ? "bg-[#171717]/60 border-[#222222]/70 opacity-50" 
                      : "bg-[#171717] border-[#222222]/70"
              }`}
            >
              <div className="absolute -top-3 -left-3 h-7 w-7 rounded-full bg-[#1d1d1d] flex items-center justify-center border border-[#333333]">
                <span className="text-sm font-medium text-white">2</span>
              </div>
              <div className="h-10 w-10 rounded-full bg-[#222222] flex items-center justify-center mr-3 mt-1">
                <Search className="h-5 w-5 text-white/90" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-white">Run Site Audit</p>
                  {auditRun && <CheckCircle className="h-4 w-4 text-green-400" />}
                </div>
                <p className="text-xs text-gray-400 mb-3">Analyze your content for AI visibility opportunities and get recommendations</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`border-[#333333] w-full ${
                    auditRun
                      ? "bg-[#222222] text-gray-300"
                      : "bg-gradient-to-r from-[#222222] to-[#2a2a2a] text-white hover:from-[#282828] hover:to-[#333333]"
                  }`}
                  onClick={runAudit}
                  disabled={!siteConnected || auditRun}
                >
                  {auditRun ? "Audit Complete" : "Run Audit"}
                </Button>
              </div>
              {onboardingStep === 2 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute -right-3 top-1/2 transform -translate-y-1/2 text-white"
                >
                  <ChevronRight size={20} />
                </motion.div>
              )}
            </div>
            
            {/* Step 3: Create Project */}
            <div 
              className={`flex items-start p-5 rounded-lg border shadow-sm relative ${
                onboardingStep === 3 
                  ? "bg-[#171717] border-white/20 ring-1 ring-white/10" 
                  : displayProjects.length > 0 
                    ? "bg-[#171717] border-[#222222]/70 opacity-75" 
                    : onboardingStep < 3 
                      ? "bg-[#171717]/60 border-[#222222]/70 opacity-50" 
                      : "bg-[#171717] border-[#222222]/70"
              }`}
            >
              <div className="absolute -top-3 -left-3 h-7 w-7 rounded-full bg-[#1d1d1d] flex items-center justify-center border border-[#333333]">
                <span className="text-sm font-medium text-white">3</span>
              </div>
              <div className="h-10 w-10 rounded-full bg-[#222222] flex items-center justify-center mr-3 mt-1">
                <FileText className="h-5 w-5 text-white/90" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-white">Create AEO Project</p>
                  {displayProjects.length > 0 && <CheckCircle className="h-4 w-4 text-green-400" />}
                </div>
                <p className="text-xs text-gray-400 mb-3">Set up your first optimization project based on audit results</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`border-[#333333] w-full ${
                    displayProjects.length > 0
                      ? "bg-[#222222] text-gray-300"
                      : "bg-gradient-to-r from-[#222222] to-[#2a2a2a] text-white hover:from-[#282828] hover:to-[#333333]"
                  }`}
                  onClick={createNewProject}
                  disabled={!auditRun || displayProjects.length > 0}
                >
                  {displayProjects.length > 0 ? "Project Created" : "Create Project"}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Onboarding progress bar */}
          <div className="mt-6 bg-[#161616] h-2 rounded-full overflow-hidden">
            <div 
              className="h-full"
              style={{ 
                width: `${(onboardingStep / 3) * 100}%`,
                background: "linear-gradient(to right, #FF914D, #FFEC9F)" 
              }}
            ></div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Site Overview */}
        <Card className="bg-[#101010] border-[#222222] border shadow-md">
          <CardHeader className="border-b border-[#222222]/50 pb-4">
            <CardTitle className="text-lg font-medium text-white">Site Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between py-3 border-b border-[#222222]/40">
              <div className="flex items-center">
                <Globe className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-sm text-white">Site Status</span>
              </div>
              {siteConnected ? (
                <Badge className={customBadgeClass} style={customBadgeStyle}>
                  Connected
                </Badge>
              ) : (
                <Badge className="bg-[#222222] text-gray-400 border-[#333333]/30 h-7 px-3">
                  Not Connected
                </Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-[#222222]/40">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-sm text-white">Audit Status</span>
              </div>
              {auditRun ? (
                <Badge className={customBadgeClass} style={customBadgeStyle}>
                  Complete
                </Badge>
              ) : (
                <Badge className="bg-[#222222] text-gray-400 border-[#333333]/30 h-7 px-3">
                  Not Started
                </Badge>
              )}
            </div>
            
            <div className="flex items-center justify-center py-6">
              {!siteConnected ? (
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 text-gray-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 mb-3">Complete step 1 to connect your site</p>
                  <Button 
                    className="border border-[#333333] bg-gradient-to-r from-[#222222] to-[#2a2a2a] text-white hover:from-[#282828] hover:to-[#333333] font-medium"
                    onClick={connectSite}
                  >
                    Connect Site
                  </Button>
                </div>
              ) : !auditRun ? (
                <div className="text-center">
                  <Search className="h-8 w-8 text-gray-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 mb-3">Site connected. Run an audit to continue</p>
                  <Button 
                    className="border border-[#333333] bg-gradient-to-r from-[#222222] to-[#2a2a2a] text-white hover:from-[#282828] hover:to-[#333333] font-medium"
                    onClick={runAudit}
                  >
                    Run Audit
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-300 mb-3">Site audit complete!</p>
                  {displayProjects.length === 0 && (
                    <Button 
                      className="border border-[#333333] bg-gradient-to-r from-[#222222] to-[#2a2a2a] text-white hover:from-[#282828] hover:to-[#333333] font-medium"
                      onClick={createNewProject}
                    >
                      Create Project
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Projects */}
        <Card className="bg-[#101010] border-[#222222] border shadow-md">
          <CardHeader className="border-b border-[#222222]/50 pb-4">
            <CardTitle className="text-lg font-medium text-white">Projects</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {displayProjects.length > 0 ? (
              <div className="space-y-3">
                {displayProjects.slice(0, 3).map((project) => (
                  <div 
                    key={project.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-[#171717] border border-[#222222]/70 hover:border-[#333333]/70 transition-colors"
                  >
                    <div>
                      <span className="text-sm font-medium text-white">{project.name}</span>
                      <p className="text-xs text-gray-400 mt-0.5">Last updated: {new Date(project.updated_at).toLocaleDateString()}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 bg-gradient-to-r from-[#222222] to-[#1d1d1d] text-gray-400 hover:text-white rounded-full"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : !siteConnected || !auditRun ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-16 w-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4 border border-[#222222]">
                  <Rocket className="h-8 w-8 text-gray-500" />
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  {!siteConnected 
                    ? "Connect your site to get started" 
                    : !auditRun 
                      ? "Run an audit to analyze your site" 
                      : "Ready to create your first project"}
                </p>
                <Button 
                  className="bg-gradient-to-r from-[#222222] to-[#2a2a2a] text-white hover:from-[#282828] hover:to-[#333333] border border-[#333333]"
                  onClick={onboardingStep === 1 ? connectSite : onboardingStep === 2 ? runAudit : createNewProject}
                  disabled={onboardingStep === 2 && !siteConnected || onboardingStep === 3 && !auditRun}
                >
                  {onboardingStep === 1 
                    ? "Connect Site" 
                    : onboardingStep === 2 
                      ? "Run Audit"
                      : "Create Project"}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-16 w-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4 border border-[#222222]">
                  <Rocket className="h-8 w-8 text-gray-500" />
                </div>
                <p className="text-sm text-gray-400 mb-4">Site audit complete! Create your first project</p>
                <Button 
                  className="bg-gradient-to-r from-[#222222] to-[#2a2a2a] text-white hover:from-[#282828] hover:to-[#333333] border border-[#333333]"
                  onClick={createNewProject}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
 
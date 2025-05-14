'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

import { 
  PlusCircle, 
  FileText, 
  BarChart2, 
  Search, 
  Globe, 
  CheckCircle, 
  Bot, 
  MessageSquare, 
  Calendar, 
  TrendingUp,
  FileCheck,
  ArrowRight,
  Upload,
  Code,
  Settings,
  AlertCircle,
  Rocket
} from 'lucide-react'

// Import shadcn dashboard components
import { SectionCards } from "@/components/section-cards"

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
        
        setProjects(data || [])
      } catch (err) {
        console.error('Failed to fetch projects:', err)
      } finally {
        setIsLoadingProjects(false)
      }
    }
    
    if (user && supabase) {
      fetchProjects()
    } else {
      // For empty state demo, don't show loading if no user
      setIsLoadingProjects(false)
    }
  }, [user, supabase])

  const createNewProject = async () => {
    if (!supabase || !user) return
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([
          { 
            name: 'New AEO Project', 
            description: 'My new optimization project',
            status: 'active',
            user_id: user.id 
          }
        ])
        .select()
      
      if (error) {
        console.error('Error creating project:', error)
        return
      }
      
      // Refresh projects
      const { data: updatedProjects, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
        
      if (!fetchError) {
        setProjects(updatedProjects || [])
      }
    } catch (err) {
      console.error('Failed to create project:', err)
    }
  }

  if (loading || isLoadingProjects) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0c0c0c]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-white" />
      </div>
    )
  }

  return (
    <main className="flex flex-1 flex-col gap-8 p-8 overflow-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400">Welcome to Split - AI Engine Optimization platform</p>
        </div>
        
        <Button 
          className="flex items-center gap-2 self-start md:self-auto bg-white hover:bg-gray-100 text-[#0c0c0c]"
          onClick={createNewProject}
        >
          <PlusCircle className="h-4 w-4" />
          New AEO Project
        </Button>
      </div>

      {/* Getting Started Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-[#161616] to-[#1a1a1a] border-[#333333] text-white">
          <CardHeader>
            <CardTitle className="text-xl font-medium text-white">Welcome to Split! Let's get started</CardTitle>
            <CardDescription className="text-gray-400">
              Complete these steps to start optimizing your content for AI engines
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="flex flex-col items-center gap-4 rounded-lg border border-[#333333] bg-[#161616] p-6 text-center">
                <div className="rounded-full bg-blue-900/20 p-3">
                  <Globe className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-medium text-white">Connect Your Site</h3>
                <p className="text-sm text-gray-400">Link your website to start monitoring AI engine visibility</p>
                <Button variant="outline" className="mt-auto border-[#333333] text-white hover:bg-[#222222]">
                  Connect Site
                </Button>
              </div>
              
              <div className="flex flex-col items-center gap-4 rounded-lg border border-[#333333] bg-[#161616] p-6 text-center">
                <div className="rounded-full bg-purple-900/20 p-3">
                  <Search className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-medium text-white">Run Site Audit</h3>
                <p className="text-sm text-gray-400">Analyze your content for AI visibility opportunities</p>
                <Button variant="outline" className="mt-auto border-[#333333] text-white hover:bg-[#222222]">
                  Start Audit
                </Button>
              </div>
              
              <div className="flex flex-col items-center gap-4 rounded-lg border border-[#333333] bg-[#161616] p-6 text-center">
                <div className="rounded-full bg-green-900/20 p-3">
                  <FileText className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-white">Create First Project</h3>
                <p className="text-sm text-gray-400">Set up your first AEO optimization project</p>
                <Button variant="outline" className="mt-auto border-[#333333] text-white hover:bg-[#222222]" 
                  onClick={createNewProject}>
                  Create Project
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Overview Section - Empty State */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 bg-[#161616] border-[#333333] text-white">
          <CardHeader>
            <CardTitle className="text-xl font-medium text-white">Site Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Site Connection Status - Empty */}
            <div className="flex items-center justify-between border-b border-[#222222] pb-4">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-white">Site Status</p>
                  <p className="text-sm text-gray-400">Connect your website to start</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-yellow-900/30 text-yellow-400 border-yellow-800/50">
                Not Connected
              </Badge>
            </div>

            {/* Weekly Post Cadence - Empty */}
            <div className="flex items-center justify-between border-b border-[#222222] pb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-white">Content Schedule</p>
                  <p className="text-sm text-gray-400">No data available yet</p>
                </div>
              </div>
              <Badge className="bg-[#222222] text-gray-400 border-[#333333]">
                Not Set
              </Badge>
            </div>

            {/* Last Indexed Post - Empty */}
            <div className="flex items-center justify-between border-b border-[#222222] pb-4">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-white">Last Indexed Post</p>
                  <p className="text-sm text-gray-400">No posts indexed yet</p>
                </div>
              </div>
              <p className="text-sm text-gray-400">-</p>
            </div>

            {/* LLM Reach Summary - Empty */}
            <div>
              <h3 className="font-medium text-white mb-3">LLM Reach Summary</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-white">Indexed by Google</p>
                  </div>
                  <Badge variant="outline" className="bg-[#222222] text-gray-400 border-[#333333]">
                    No Data
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-white">Visible on Perplexity</p>
                  </div>
                  <Badge variant="outline" className="bg-[#222222] text-gray-400 border-[#333333]">
                    No Data
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-white">Mentions in OpenAI Chat</p>
                  </div>
                  <Badge variant="outline" className="bg-[#222222] text-gray-400 border-[#333333]">
                    No Data
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Glance - Empty */}
        <Card className="bg-[#161616] border-[#333333] text-white">
          <CardHeader>
            <CardTitle className="text-xl font-medium text-white">Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center text-center h-[300px] space-y-4">
              <div className="rounded-full bg-[#222222] p-4">
                <BarChart2 className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-white">No Performance Data Yet</h3>
              <p className="text-sm text-gray-400">Connect your site and run your first audit to see performance metrics</p>
              <Button variant="outline" className="mt-2 border-[#333333] text-white hover:bg-[#222222]">
                Run Site Audit
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Projects List - Empty State */}
      <Card className="bg-[#161616] border-[#333333] text-white">
        <CardHeader className="flex flex-row items-center justify-between px-6">
          <CardTitle className="font-semibold text-white">Your AEO Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-[#222222] p-4 mb-4">
              <Rocket className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No Projects Created Yet</h3>
            <p className="text-sm text-gray-400 max-w-md mb-6">
              Create your first AEO project to start optimizing your content for AI engines and improve your visibility
            </p>
            <Button 
              className="flex items-center gap-2 bg-white hover:bg-gray-100 text-[#0c0c0c]"
              onClick={createNewProject}
            >
              <PlusCircle className="h-4 w-4" />
              Create Your First Project
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  PlusCircle, 
  FileText, 
  BarChart2, 
  Search, 
  Globe, 
  CheckCircle, 
  Robot, 
  MessageSquare, 
  Calendar, 
  Zap,
  TrendingUp,
  AlertTriangle,
  FileCheck,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'

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
    <main className="flex flex-1 flex-col gap-8 p-8 bg-[#0c0c0c] overflow-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400">Monitor your site's visibility across AI platforms</p>
        </div>
        
        <Button 
          className="flex items-center gap-2 self-start md:self-auto bg-white hover:bg-gray-100 text-[#0c0c0c]"
          onClick={createNewProject}
        >
          <PlusCircle className="h-4 w-4" />
          New AEO Project
        </Button>
      </div>

      {/* Overview Section */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 bg-[#161616] border-[#333333] text-white">
          <CardHeader>
            <CardTitle className="text-xl font-medium text-white">Site Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Site Connection Status */}
            <div className="flex items-center justify-between border-b border-[#222222] pb-4">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-white">Site Status</p>
                  <p className="text-sm text-gray-400">Connected via Webflow</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-900/30 text-green-400 border-green-800/50">
                Connected
              </Badge>
            </div>

            {/* Weekly Post Cadence */}
            <div className="flex items-center justify-between border-b border-[#222222] pb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-white">Weekly Post Cadence</p>
                  <p className="text-sm text-gray-400">Optimized for consistency</p>
                </div>
              </div>
              <Badge className="bg-[#222222] text-white border-[#333333]">
                2 articles/week
              </Badge>
            </div>

            {/* Last Indexed Post */}
            <div className="flex items-center justify-between border-b border-[#222222] pb-4">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-white">Last Indexed Post</p>
                  <p className="text-sm text-gray-400">"Understanding AI-First Content Strategy"</p>
                </div>
              </div>
              <p className="text-sm text-gray-400">June 15, 2023</p>
            </div>

            {/* LLM Reach Summary */}
            <div>
              <h3 className="font-medium text-white mb-3">LLM Reach Summary</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <p className="text-sm text-white">Indexed by Google</p>
                  </div>
                  <Badge variant="outline" className="bg-green-900/30 text-green-400 border-green-800/50">
                    Yes
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Robot className="h-4 w-4 text-blue-400" />
                    <p className="text-sm text-white">Visible on Perplexity</p>
                  </div>
                  <Badge variant="outline" className="bg-blue-900/30 text-blue-400 border-blue-800/50">
                    73%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-purple-400" />
                    <p className="text-sm text-white">Mentions in OpenAI Chat</p>
                  </div>
                  <Badge variant="outline" className="bg-purple-900/30 text-purple-400 border-purple-800/50">
                    42%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Glance */}
        <Card className="bg-[#161616] border-[#333333] text-white">
          <CardHeader>
            <CardTitle className="text-xl font-medium text-white">Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Posts published this month</p>
                <p className="text-2xl font-bold text-white">8</p>
              </div>
              
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400">Indexed</p>
                  <p className="text-sm font-medium text-white">87%</p>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-[#222222]">
                  <div className="h-2 rounded-full bg-green-500" style={{ width: '87%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400">Estimated reach</p>
                  <p className="text-sm font-medium text-white">12.5K</p>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-[#222222]">
                  <div className="h-2 rounded-full bg-blue-500" style={{ width: '65%' }}></div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-white mb-3">Long-tail Keyword Wins</h3>
              <div className="space-y-2">
                <div className="rounded-md bg-[#222222] px-3 py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white">"AI content strategy"</p>
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  </div>
                </div>
                <div className="rounded-md bg-[#222222] px-3 py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white">"LLM optimization tips"</p>
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  </div>
                </div>
                <div className="rounded-md bg-[#222222] px-3 py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white">"AI index visibility"</p>
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Projects List */}
      <div className="rounded-lg border border-[#333333] bg-[#161616]">
        <div className="border-b border-[#333333] px-4 py-3 flex justify-between items-center">
          <h2 className="font-semibold text-white">Recent AEO Projects</h2>
          <Button variant="ghost" size="sm" className="text-sm text-gray-400 hover:text-gray-200 hover:bg-[#222222]">
            View all
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <div className="p-0">
          {projects.length > 0 ? (
            <div className="divide-y divide-[#333333]">
              {projects.slice(0, 5).map((project) => (
                <motion.div 
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 hover:bg-[#222222] transition-colors"
                >
                  <div>
                    <div className="font-medium text-white">{project.name}</div>
                    <div className="text-sm text-gray-400">
                      Last updated: {new Date(project.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className={cn(
                      "px-2 py-1 text-xs rounded-full",
                      project.status === 'active' ? "bg-blue-900/30 text-blue-400 border border-blue-800/50" : 
                      project.status === 'pending' ? "bg-yellow-900/30 text-yellow-400 border border-yellow-800/50" : 
                      "bg-green-900/30 text-green-400 border border-green-800/50"
                    )}>
                      {project.status}
                    </div>
                    <Button variant="outline" size="sm" className="border-[#333333] text-white hover:bg-[#222222]">View</Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-400">No projects found</p>
              <Button 
                variant="outline" 
                className="mt-4 border-[#333333] text-white hover:bg-[#222222]"
                onClick={createNewProject}
              >
                Create your first project
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
} 
'use client'
import { Card, CardContent } from "@/components/ui/card"
import { motion, useAnimation, useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { BarChart3, FileText, Zap, ExternalLink, BookOpen, HelpCircle, Rocket, ArrowRight, TrendingUp } from "lucide-react"
import Link from "next/link"

interface UserProfile {
  first_name: string | null
  workspace_name: string | null
}

interface VisibilityScore {
  id: string
  total_score: number
  created_at: string
  status: string
}

export function WelcomeCard() {
  const { user } = useAuth()
  const { currentWorkspace } = useWorkspace()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [visibilityScore, setVisibilityScore] = useState<VisibilityScore | null>(null)
  const [loadingScore, setLoadingScore] = useState(true)
  const shouldReduceMotion = useReducedMotion()
  const controls = useAnimation()
  
  const supabase = createClient()

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user || !supabase) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, workspace_name')
          .eq('id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error)
        }

        setProfile(data || null)
      } catch (err) {
        console.error('Error in profile fetch:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user, supabase])

  // Fetch latest visibility score
  useEffect(() => {
    const fetchVisibilityScore = async () => {
      if (!user || !supabase || !currentWorkspace) {
        setLoadingScore(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('max_visibility_runs')
          .select('id, total_score, created_at, status')
          .eq('triggered_by', user.id)
          .eq('workspace_id', currentWorkspace.id)
          .order('created_at', { ascending: false })
          .limit(1)

        if (error) {
          console.error('Error fetching visibility score:', error)
          setVisibilityScore(null)
        } else {
          // Get the first result or null if no results
          setVisibilityScore(data && data.length > 0 ? data[0] : null)
        }
      } catch (err) {
        console.error('Error in visibility score fetch:', err)
        setVisibilityScore(null)
      } finally {
        setLoadingScore(false)
      }
    }

    fetchVisibilityScore()
  }, [user, supabase, currentWorkspace])

  useEffect(() => {
    if (shouldReduceMotion) {
      controls.start({ opacity: 1, y: 0 })
      return
    }
    controls.start({
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.4,
        ease: "easeOut"
      },
    })
  }, [controls, shouldReduceMotion])

  // Generate welcome message based on visibility score
  const getWelcomeMessage = (score: number | null) => {
    if (score === null) {
      return "Ready to analyze your AEO performance? Run your first visibility scan to get started."
    }
    
    if (score < 30) {
      return "Your AEO foundation needs attention, but that's exactly why you're here."
    } else if (score < 50) {
      return "You're making progress with solid elements and clear improvement areas."
    } else if (score < 70) {
      return "Your AEO strategy is working well. Let's fine-tune the remaining gaps."
    } else if (score < 85) {
      return "Strong AEO structure across the board with optimization opportunities ahead."
    } else {
      return "Outstanding AEO performance. You're in the top tier of LLM visibility."
    }
  }

  // Get user's display name
  const getDisplayName = () => {
    if (loading) return "..."
    return profile?.first_name || "there"
  }

  // Format the last scan date
  const getLastScanDate = () => {
    if (!visibilityScore) return null
    return new Date(visibilityScore.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const quickActions = [
    { 
      icon: BarChart3, 
      label: "Visibility Scoring", 
      desc: visibilityScore ? "Run a new AEO analysis" : "Analyze your AEO performance", 
      href: "/visibility",
      primary: true
    },
    { 
      icon: FileText, 
      label: "Content Library", 
      desc: "Browse published content", 
      href: "/content",
      primary: false
    },
    { 
      icon: Zap, 
      label: "Content Queue", 
      desc: "Manage your pipeline", 
      href: "/queue",
      primary: false
    },
    { 
      icon: BookOpen, 
      label: "Documentation", 
      desc: "Learn best practices", 
      href: "https://docs.split.dev",
      external: true,
      primary: false
    },
  ]

  return (
    <Card className="bg-transparent border-[#1a1a1a] h-full">
      <CardContent className="p-8 h-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={controls}
          className="h-full flex flex-col"
        >
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-medium text-white mb-3 font-mono tracking-tight">
              Welcome back, {getDisplayName()}
            </h1>
            <p className="text-[#888] text-lg leading-relaxed mb-4 max-w-2xl">
              {getWelcomeMessage(visibilityScore?.total_score || null)}
            </p>
            
            {/* Visibility Score Badge or Empty State */}
            <div className="inline-flex items-center gap-3 mb-6">
              {loadingScore ? (
                <div className="flex items-center gap-2 bg-[#111] border border-[#1a1a1a] rounded-sm px-3 py-2">
                  <div className="w-2 h-2 bg-[#333] rounded-full animate-pulse"></div>
                  <span className="text-sm text-[#666] font-mono tracking-tight">
                    Loading score...
                  </span>
                </div>
              ) : visibilityScore ? (
                <>
                  <div className="flex items-center gap-2 bg-[#111] border border-[#1a1a1a] rounded-sm px-3 py-2">
                    <div className={`w-2 h-2 rounded-full ${
                      visibilityScore.total_score >= 70 ? 'bg-green-400' :
                      visibilityScore.total_score >= 50 ? 'bg-yellow-400' :
                      'bg-red-400'
                    }`}></div>
                    <span className="text-sm text-white font-mono tracking-tight">
                      Visibility Score: {Math.round(visibilityScore.total_score)}%
                    </span>
                  </div>
                  <div className="text-xs text-[#666] font-mono tracking-tight">
                    Last scan: {getLastScanDate()}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-transparent border-[#333] text-[#888] hover:text-white hover:border-[#444] h-8 px-3 text-xs font-mono tracking-tight"
                    asChild
                  >
                    <Link href="/visibility" className="flex items-center gap-1">
                      View Details
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 bg-[#111] border border-[#1a1a1a] border-dashed rounded-sm px-3 py-2">
                    <TrendingUp className="w-4 h-4 text-[#666]" />
                    <span className="text-sm text-[#666] font-mono tracking-tight">
                      No visibility data yet
                    </span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-transparent border-[#333] text-[#888] hover:text-white hover:border-[#444] h-8 px-3 text-xs font-mono tracking-tight"
                    asChild
                  >
                    <Link href="/visibility" className="flex items-center gap-1">
                      Run First Scan
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex-1">
            <div className="mb-4">
              <h2 className="text-sm text-[#666] font-mono tracking-tight uppercase">Quick Actions</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  {action.external ? (
                    <a
                      href={action.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`group block p-4 bg-[#111] border border-[#1a1a1a] hover:border-[#333] hover:bg-[#151515] transition-all duration-200 rounded-sm ${
                        action.primary ? 'md:col-span-2' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-[#1a1a1a] rounded-sm flex items-center justify-center group-hover:bg-[#222] transition-colors">
                          <action.icon className="w-4 h-4 text-[#666] group-hover:text-white transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-medium text-white group-hover:text-white transition-colors font-mono tracking-tight">
                              {action.label}
                            </h3>
                            <ExternalLink className="w-3 h-3 text-[#666] group-hover:text-[#888] transition-colors" />
                          </div>
                          <p className="text-xs text-[#666] group-hover:text-[#888] transition-colors">
                            {action.desc}
                          </p>
                        </div>
                      </div>
                    </a>
                  ) : (
                    <Link
                      href={action.href}
                      className={`group block p-4 bg-[#111] border border-[#1a1a1a] hover:border-[#333] hover:bg-[#151515] transition-all duration-200 rounded-sm ${
                        action.primary ? 'md:col-span-2' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-[#1a1a1a] rounded-sm flex items-center justify-center group-hover:bg-[#222] transition-colors">
                          <action.icon className="w-4 h-4 text-[#666] group-hover:text-white transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-white group-hover:text-white transition-colors font-mono tracking-tight mb-1">
                            {action.label}
                          </h3>
                          <p className="text-xs text-[#666] group-hover:text-[#888] transition-colors">
                            {action.desc}
                          </p>
                        </div>
                        <ArrowRight className="w-3 h-3 text-[#444] group-hover:text-[#666] transition-colors mt-0.5" />
                      </div>
                    </Link>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-8 pt-6 border-t border-[#1a1a1a]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link 
                  href="/changelog" 
                  className="text-xs text-[#666] hover:text-white transition-colors font-mono tracking-tight flex items-center gap-1"
                >
                  <Rocket className="w-3 h-3" />
                  What's New
                </Link>
                <Link 
                  href="/support" 
                  className="text-xs text-[#666] hover:text-white transition-colors font-mono tracking-tight flex items-center gap-1"
                >
                  <HelpCircle className="w-3 h-3" />
                  Get Support
                </Link>
              </div>
              <div className="text-xs text-[#666] font-mono tracking-tight">
                {visibilityScore ? `Last scan: ${getLastScanDate()}` : 'Ready to get started'}
              </div>
            </div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  )
} 
'use client'
import { Card, CardContent } from "@/components/ui/card"
import { motion, useAnimation, useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { createClient } from "@/lib/supabase/client"
import { DomainSelector } from "@/components/custom/domain-selector"
import { Button } from "@/components/ui/button"
import { BarChart3, FileText, Zap, ExternalLink, BookOpen, Settings, HelpCircle, Rocket } from "lucide-react"

interface UserProfile {
  first_name: string | null
  workspace_name: string | null
}

export function WelcomeCard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const shouldReduceMotion = useReducedMotion()
  const controls = useAnimation()
  
  // Hardcoded visibility score for now - will be dynamic later
  const visibilityScore = 42

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

  useEffect(() => {
    if (shouldReduceMotion) {
      controls.start({ opacity: 1, y: 0 })
      return
    }
    controls.start({
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.3,
        ease: "easeOut"
      },
    })
  }, [controls, shouldReduceMotion])

  // Generate welcome message based on visibility score
  const getWelcomeMessage = (score: number) => {
    if (score < 30) {
      return "We're off to a good start, but there's plenty of room to grow. Your AEO foundation needs some work, but that's exactly why you're here."
    } else if (score < 50) {
      return "You're making progress! Your AEO structure has some solid elements, but we've identified key areas where you can significantly improve your visibility."
    } else if (score < 70) {
      return "Looking good! Your AEO strategy is working well in most areas. Let's fine-tune the remaining gaps to maximize your LLM visibility."
    } else if (score < 85) {
      return "Impressive work! Your AEO structure is strong across the board. We've spotted a few optimization opportunities to push you into the top tier."
    } else {
      return "Outstanding! Your AEO game is incredibly strong. You're in the top tier of LLM visibility. Let's keep you there and explore advanced strategies."
    }
  }

  // Get user's display name - simplified to just first name
  const getDisplayName = () => {
    if (loading) return "..."
    return profile?.first_name || "there"
  }

  const quickActions = [
    { icon: BarChart3, label: "Visibility Scoring", desc: "Run AEO visibility scans", href: "/visibility" },
    { icon: FileText, label: "Content Pages", desc: "View completed content", href: "/content" },
    { icon: Zap, label: "Content Queue", desc: "Manage content pipeline", href: "/queue" },
    { icon: BookOpen, label: "Read Documentation", desc: "Learn best practices", href: "/docs" },
    { icon: Rocket, label: "What's New", desc: "Latest features & updates", href: "/changelog" },
    { icon: HelpCircle, label: "Get Support", desc: "Contact our team", href: "/support" },
  ]

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-8 h-full flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={controls}
          className="flex h-full"
        >
          {/* Left Side - Welcome Content */}
          <div className="flex-1 flex flex-col justify-center pr-12">
            <div className="mb-4">
              <DomainSelector />
            </div>
            
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
                Welcome back, {getDisplayName()}.
              </h1>
              <p className="text-xl text-[#ccc] mb-6 leading-relaxed">
                {getWelcomeMessage(visibilityScore)}
              </p>
              <button className="text-lg text-[#888] hover:text-white transition-colors flex items-center gap-2 group">
                See detailed analysis
                <ExternalLink className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Side - Quick Actions Hub */}
          <div className="w-80 flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Quick Actions</h3>
              <p className="text-sm text-[#888]">Everything you need to get started</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 flex-1">
              {quickActions.map((action, index) => (
                <Button
                  key={action.label}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start gap-2 bg-[#0f0f0f] border-[#2a2a2a] hover:bg-[#1a1a1a] hover:border-[#444] text-left group w-full transition-all duration-200"
                >
                  <action.icon className="w-5 h-5 text-[#888] group-hover:text-white transition-colors" />
                  <div>
                    <div className="text-sm font-medium text-white group-hover:text-white">
                      {action.label}
                    </div>
                    <div className="text-xs text-[#666] group-hover:text-[#888]">
                      {action.desc}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  )
} 
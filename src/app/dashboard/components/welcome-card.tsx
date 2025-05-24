'use client'
import { Card, CardContent } from "@/components/ui/card"
import { motion, useAnimation, useReducedMotion } from "framer-motion"
import { useEffect } from "react"
import { DomainSelector } from "@/components/custom/domain-selector"
import { Button } from "@/components/ui/button"
import { BarChart3, FileText, Zap, ExternalLink, BookOpen, Settings, HelpCircle, Rocket } from "lucide-react"

export function WelcomeCard() {
  const shouldReduceMotion = useReducedMotion();
  const controls = useAnimation();

  useEffect(() => {
    if (shouldReduceMotion) {
      controls.start({ opacity: 1, y: 0 });
      return;
    }
    controls.start({
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.3,
        ease: "easeOut"
      },
    });
  }, [controls, shouldReduceMotion]);

  const quickActions = [
    { icon: BarChart3, label: "View Analytics", desc: "Deep dive into your data", href: "/analytics" },
    { icon: FileText, label: "Generate Report", desc: "Export insights", href: "/reports" },
    { icon: Zap, label: "Optimize AEO", desc: "Improve your rankings", href: "/optimization" },
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
                Glad you're back, Sam.
              </h1>
              <p className="text-xl text-[#ccc] mb-6 leading-relaxed">
                Your AEO structure is solid overall, with strong meta descriptions and clean crawling across 28 pages. However, missing llms.txt and inconsistent JSON-LD schema are reducing your LLM visibility.
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
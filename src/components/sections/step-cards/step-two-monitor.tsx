'use client'

import { motion, useInView, useReducedMotion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { Eye, TrendingUp, Activity, Search } from "lucide-react"
import { ProgressBar } from "@/components/ui/progress-bar"
import Image from "next/image"

const platformData = [
  { 
    name: "ChatGPT", 
    mentions: 124, 
    lastMention: "2 mins ago", 
    trend: 35,
    logo: "/images/chatgpt.svg"
  },
  { 
    name: "Perplexity", 
    mentions: 91, 
    lastMention: "7 mins ago", 
    trend: 28,
    logo: "/images/perplexity.svg"
  },
  { 
    name: "Claude", 
    mentions: 88, 
    lastMention: "4 mins ago", 
    trend: 42,
    logo: "/images/claude.svg"
  }
]

const latestMention = {
  platform: "ChatGPT",
  query: "AI automation tools",
  context: "User asked about workflow optimization solutions",
  time: "2 mins ago"
}

export function StepTwoMonitor() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const shouldReduceMotion = useReducedMotion()
  const [animatedMentions, setAnimatedMentions] = useState([0, 0, 0])

  useEffect(() => {
    if (isInView && !shouldReduceMotion) {
      // Animate mention counts
      platformData.forEach((platform, index) => {
        setTimeout(() => {
          const duration = 1200
          const startTime = performance.now()
          
          function animate(now: number) {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            // Use ease-out curve for more natural feel
            const easeOut = 1 - Math.pow(1 - progress, 3)
            const currentValue = Math.round(platform.mentions * easeOut)
            
            setAnimatedMentions(prev => {
              const newValues = [...prev]
              newValues[index] = currentValue
              return newValues
            })

            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }, index * 200)
      })

    } else if (isInView && shouldReduceMotion) {
      setAnimatedMentions(platformData.map(p => p.mentions))
    }
  }, [isInView, shouldReduceMotion])

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.12
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  }

  return (
    <div ref={ref} className="dashboard-mockup bg-[#1a1a1a] border border-[#2f2f2f] p-6 relative overflow-hidden">
      <motion.div
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={containerVariants}
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between pb-4 border-b border-[#333333]">
          <div>
            <h4 className="text-white font-semibold text-base flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Mention Tracking
            </h4>
            <div className="text-xs text-gray-500 mt-1">Real-time AI visibility monitoring</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400 font-mono">Scanning</span>
          </div>
        </motion.div>

        {/* Latest Mention */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">Latest Mention</span>
          </div>
          <div className="bg-[#0c0c0c] border border-[#333333] p-3">
            <div className="flex items-center gap-2 mb-2">
              <Image src="/images/chatgpt.svg" alt="ChatGPT" width={16} height={16} className="w-4 h-4" />
              <span className="text-sm text-white font-medium">{latestMention.platform}</span>
              <span className="text-xs text-gray-500">{latestMention.time}</span>
            </div>
            <div className="text-xs text-gray-400 mb-1">Query: "{latestMention.query}"</div>
            <div className="text-xs text-gray-500">{latestMention.context}</div>
          </div>
        </motion.div>

        {/* Platform Mentions */}
        <div className="space-y-3">
          {platformData.map((platform, index) => (
            <motion.div
              key={platform.name}
              variants={itemVariants}
              className="group p-4 bg-[#0c0c0c] border border-[#333333] transition-all duration-200 hover:border-[#444444] relative overflow-hidden"
            >
              <div className="relative flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 border border-[#444444] flex items-center justify-center bg-[#1a1a1a]">
                    <Image 
                      src={platform.logo} 
                      alt={platform.name} 
                      width={16} 
                      height={16} 
                      className="w-4 h-4 opacity-70" 
                    />
                  </div>
                  <div>
                    <span className="text-gray-300 text-sm font-medium">{platform.name}</span>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      Last mention: {platform.lastMention}
                      <span className="flex items-center gap-1 text-green-400">
                        <TrendingUp className="w-3 h-3" />
                        {platform.trend}%
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Animated counter */}
                <motion.div
                  className="text-white font-mono text-xl"
                  initial={{ scale: 1 }}
                  animate={isInView ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                  transition={{ delay: index * 0.2 + 0.8, duration: 0.4, ease: "easeOut" }}
                >
                  {animatedMentions[index]}
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>


      </motion.div>
    </div>
  )
} 
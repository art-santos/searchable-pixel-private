'use client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, useReducedMotion } from "framer-motion"
import { Sparkles, LinkIcon } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

// AI Engine crawler data - actual bot names from server logs (top 5)
const crawlerData = [
  { 
    name: 'GPTBot', 
    percentage: 34.8, 
    crawls: 1268,
    icon: '/images/chatgpt.svg',
    color: '#555'
  },
  { 
    name: 'ChatGPT-User', 
    percentage: 26.2, 
    crawls: 954,
    icon: '/images/chatgpt.svg',
    color: '#555'
  },
  { 
    name: 'PerplexityBot', 
    percentage: 19.5, 
    crawls: 710,
    icon: '/images/perplexity.svg',
    color: '#555'
  },
  { 
    name: 'Google-Extended', 
    percentage: 12.3, 
    crawls: 448,
    icon: '/images/gemini.svg',
    color: '#555'
  },
  { 
    name: 'Claude-Web', 
    percentage: 7.2, 
    crawls: 262,
    icon: '/images/claude.svg',
    color: '#555'
  }
]

export function AttributionBySourceCard() {
  const shouldReduceMotion = useReducedMotion()
  // Simulate analytics connection state - would come from actual data/context
  const [isConnected] = useState(true)

  const cardVariants = shouldReduceMotion ? {
    hidden: { opacity: 1, y: 0 },
    visible: { opacity: 1, y: 0 }
  } : {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  }

  const itemVariants = shouldReduceMotion ? {
    hidden: { opacity: 1 },
    visible: { opacity: 1 }
  } : {
    hidden: { opacity: 0 },
    visible: (i: number) => ({
      opacity: 1,
      transition: { delay: i * 0.05, duration: 0.3, ease: 'easeOut' }
    })
  }

  const progressVariants = shouldReduceMotion ? {
    hidden: { width: "var(--target-width)" },
    visible: { width: "var(--target-width)" }
  } : {
    hidden: { width: "0%" },
    visible: { 
      width: "var(--target-width)",
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
        delay: 0.3
      }
    }
  }

  return (
    <Card className="h-full flex flex-col relative overflow-hidden">
      <CardContent className="p-6 h-full flex flex-col">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="flex flex-col h-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-shrink-0">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Crawls by Source</h3>
              <p className="text-sm text-[#888]">AI engine activity - Last 30 days</p>
            </div>
          </div>

          {/* Crawler List */}
          <div className="flex-1 space-y-3 min-h-0">
            {crawlerData.map((source, index) => (
              <motion.div
                key={source.name}
                custom={index}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                      {source.icon === 'sparkles' ? (
                        <Sparkles className="w-3.5 h-3.5 text-[#888]" />
                      ) : source.icon ? (
                        <Image 
                          src={source.icon} 
                          alt={source.name}
                          width={14}
                          height={14}
                        />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#666]" />
                      )}
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{source.name}</div>
                      <div className="text-[#666] text-xs">
                        {source.crawls.toLocaleString()} crawls
                      </div>
                    </div>
                  </div>
                  <motion.div 
                    className="text-white font-semibold text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 + 0.2, duration: 0.3 }}
                  >
                    {source.percentage}%
                  </motion.div>
                </div>
                <div className="w-full h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full rounded-full"
                    style={{ 
                      "--target-width": `${source.percentage}%`,
                      backgroundColor: source.color
                    } as any}
                    variants={progressVariants}
                    initial="hidden"
                    animate="visible"
                    custom={index}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Total */}
          <div className="pt-4 border-t border-[#2a2a2a] mt-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[#666] text-sm font-medium">Total Crawls</span>
              <motion.span 
                className="text-white font-semibold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.3 }}
              >
                {crawlerData.reduce((sum, source) => sum + source.crawls, 0).toLocaleString()}
              </motion.span>
            </div>
          </div>
        </motion.div>
      </CardContent>

      {/* Empty State Overlay */}
      {!isConnected && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          {/* Blur/Darken Overlay - more subtle */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
          
          {/* Connect Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="relative"
          >
            <button className="bg-[#0c0c0c] border border-[#333] hover:border-[#444] rounded-lg px-4 py-3 flex items-center gap-3 transition-all duration-200 hover:bg-[#1a1a1a] group shadow-lg">
              <LinkIcon className="w-4 h-4 text-[#888] group-hover:text-white transition-colors" />
              <span className="text-sm font-medium text-white">Connect your analytics</span>
            </button>
          </motion.div>
        </div>
      )}
    </Card>
  )
} 
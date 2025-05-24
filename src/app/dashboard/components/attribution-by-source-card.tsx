'use client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, useReducedMotion } from "framer-motion"
import { Sparkles } from "lucide-react"
import Image from "next/image"

const attributionData = [
  { 
    name: 'ChatGPT', 
    percentage: 34.2, 
    visits: 1247,
    icon: '/images/chatgpt.svg',
    color: '#555'
  },
  { 
    name: 'Perplexity', 
    percentage: 28.7, 
    visits: 1045,
    icon: '/images/perplexity.svg',
    color: '#555'
  },
  { 
    name: 'Gemini', 
    percentage: 19.1, 
    visits: 697,
    icon: '/images/gemini.svg',
    color: '#555'
  },
  { 
    name: 'Claude', 
    percentage: 12.4, 
    visits: 452,
    icon: '/images/claude.svg',
    color: '#555'
  },
  { 
    name: 'Other', 
    percentage: 5.6, 
    visits: 204,
    icon: 'sparkles',
    color: '#555'
  }
]

export function AttributionBySourceCard() {
  const shouldReduceMotion = useReducedMotion()

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
      transition: { delay: i * 0.1, duration: 0.3, ease: 'easeOut' }
    })
  }

  return (
    <Card className="h-full flex flex-col">
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
              <h3 className="text-lg font-semibold text-white mb-1">Attribution by Source</h3>
              <p className="text-sm text-[#888]">Last 30 days</p>
            </div>
          </div>

          {/* Attribution List */}
          <div className="flex-1 space-y-4 min-h-0">
            {attributionData.map((source, index) => (
              <motion.div
                key={source.name}
                custom={index}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="group"
              >
                <div className="flex items-center justify-between mb-2">
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
                        {source.visits.toLocaleString()} visits
                      </div>
                    </div>
                  </div>
                  <div className="text-white font-semibold">{source.percentage}%</div>
                </div>
                <div className="w-full h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${source.percentage}%`,
                      backgroundColor: source.color
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Total */}
          <div className="pt-4 border-t border-[#2a2a2a] mt-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[#666] text-sm font-medium">Total Visits</span>
              <span className="text-white font-semibold">
                {attributionData.reduce((sum, source) => sum + source.visits, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  )
} 
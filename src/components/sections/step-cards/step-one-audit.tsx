'use client'

import { motion, useAnimation, useReducedMotion, useInView } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react"

const auditData = [
  { label: "Schema Coverage", value: 23, impact: "+41% citation chance" },
  { label: "LLM Readability", value: 67, impact: "+23% visibility" },
  { label: "Citation Potential", value: 41, impact: "+35% mentions" }
]

const topIssue = {
  title: "Missing FAQ Schema",
  description: "AI crawlers can't understand your Q&A content structure",
  fix: "Deploy structured data for instant AI visibility"
}

export function StepOneAudit() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const shouldReduceMotion = useReducedMotion()
  const controls = useAnimation()
  const [circleValues, setCircleValues] = useState([0, 0, 0])

  useEffect(() => {
    if (isInView) {
      if (shouldReduceMotion) {
        setCircleValues([23, 67, 41])
        controls.start({ opacity: 1, y: 0 })
        return
      }

      // Animate the scorecard in
      controls.start({
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: "easeOut" }
      })

      // Animate progress circles with staggered timing
      auditData.forEach((item, index) => {
        setTimeout(() => {
          const duration = 1500
          const startTime = performance.now()
          const startValue = 0
          const endValue = item.value

          function animate(now: number) {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            // Use ease-out curve for more natural feel
            const easeOut = 1 - Math.pow(1 - progress, 3)
            const currentValue = Math.round(startValue + (endValue - startValue) * easeOut)
            
            setCircleValues(prev => {
              const newValues = [...prev]
              newValues[index] = currentValue
              return newValues
            })

            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }, index * 300)
      })
    }
  }, [isInView, controls, shouldReduceMotion])

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.15
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
              <Sparkles className="w-4 h-4" />
              Site Audit Results
            </h4>
            <div className="text-xs text-gray-500 mt-1">Comprehensive AEO analysis</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400 font-mono">Live Scan</span>
          </div>
        </motion.div>

        {/* Score Circles */}
        <div className="grid grid-cols-3 gap-4">
          {auditData.map((item, index) => (
            <motion.div
              key={item.label}
              variants={itemVariants}
              className="flex flex-col items-center space-y-3"
            >
              {/* Circular Progress */}
              <div className="relative w-16 h-16">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="#333333"
                    strokeWidth="4"
                  />
                  <motion.circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="#666666"
                    strokeWidth="4"
                    strokeDasharray={`${(circleValues[index] * 175.93) / 100} 175.93`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-mono text-white">{circleValues[index]}%</span>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-xs text-gray-300 font-medium">{item.label}</div>
                <div className="text-[10px] text-gray-500 mt-1">{item.impact}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Top Issue */}
        <motion.div variants={itemVariants} className="pt-4 border-t border-[#333333]">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">Top Priority</span>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
            transition={{ delay: 1.2, duration: 0.6, ease: "easeOut" }}
            className="space-y-2"
          >
            <div className="text-sm text-white font-medium">{topIssue.title}</div>
            <div className="text-xs text-gray-400">{topIssue.description}</div>
            <div className="text-xs text-gray-300 bg-[#1a1a1a] border border-[#333333] px-2 py-1 inline-block">
              {topIssue.fix}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
} 
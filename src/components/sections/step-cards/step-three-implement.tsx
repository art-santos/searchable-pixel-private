'use client'

import { motion, useInView, useReducedMotion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { Zap, Rocket, Target, CheckCircle2, ArrowRight, Clock } from "lucide-react"

const topTask = {
  id: 1,
  title: "Deploy FAQ Schema",
  description: "Add structured data to your Q&A content",
  impact: "+41% citation chance",
  estimatedTime: "2 min",
  steps: [
    "Scan existing FAQ content",
    "Generate schema markup", 
    "Deploy to production",
    "Verify with testing tool"
  ]
}

const deploymentSteps = [
  "Schema validation",
  "Content analysis",
  "Deployment queue",
  "Live monitoring"
]

export function StepThreeImplement() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const shouldReduceMotion = useReducedMotion()
  const [isDeployed, setIsDeployed] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [impact, setImpact] = useState(0)

  const handleDeploy = () => {
    if (isDeployed) return

    setIsDeployed(true)
    
    // Animate through deployment steps
    let step = 0
    const stepInterval = setInterval(() => {
      if (step >= topTask.steps.length - 1) {
        clearInterval(stepInterval)
        // Calculate final impact immediately after final step
        setTimeout(() => {
          animateImpact()
        }, 200)
        return
      }
      step++
      setCurrentStep(step)
    }, 400)
  }

  const animateImpact = () => {
    const duration = 1000
    const startTime = performance.now()
    const targetImpact = 41

    function animate(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const currentValue = Math.round(targetImpact * progress)
      
      setImpact(currentValue)

      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }

  useEffect(() => {
    // Auto-trigger deployment when component comes into view
    if (isInView && !isDeployed && !shouldReduceMotion) {
      const timer = setTimeout(() => {
        handleDeploy()
      }, 1500) // Slower delay to let user see the initial state
      
      return () => clearTimeout(timer)
    } else if (isInView && isDeployed) {
      setCurrentStep(topTask.steps.length - 1)
    } else if (isInView && shouldReduceMotion) {
      // For reduced motion, instantly show deployed state
      setIsDeployed(true)
      setCurrentStep(topTask.steps.length - 1)
      setImpact(41)
    }
  }, [isInView, isDeployed, shouldReduceMotion])

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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'schema': return <Target className="w-3 h-3" />
      case 'config': return <Zap className="w-3 h-3" />
      case 'content': return <Rocket className="w-3 h-3" />
      default: return <CheckCircle2 className="w-3 h-3" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'schema': return '#10b981'
      case 'config': return '#f59e0b'
      case 'content': return '#6366f1'
      default: return '#6b7280'
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
              <Rocket className="w-4 h-4" />
              Implementation Queue
            </h4>
            <div className="text-xs text-gray-500 mt-1">Ready for deployment</div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 border flex items-center justify-center text-xs font-mono transition-all duration-500 ${
              isDeployed 
                ? 'bg-[#333333] border-[#444444] text-white' 
                : 'bg-[#333333] border-[#444444] text-white'
            }`}>
              {isDeployed ? '✓' : '1'}
            </div>
            <span className={`text-xs transition-colors duration-500 ${
              isDeployed ? 'text-gray-400' : 'text-gray-400'
            }`}>{isDeployed ? 'deployed' : 'ready'}</span>
          </div>
        </motion.div>

        {/* Main Task */}
        <motion.div
          variants={itemVariants}
          className={`p-4 border transition-all duration-500 relative overflow-hidden ${
            isDeployed 
              ? 'bg-[#0c0c0c] border-[#333333]' 
              : 'bg-[#0c0c0c] border-[#333333] hover:border-[#444444]'
          }`}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 border flex items-center justify-center transition-all duration-500 ${
                  isDeployed 
                    ? 'bg-[#1a1a1a] border-[#444444]' 
                    : 'bg-[#1a1a1a] border-[#444444]'
                }`}>
                  {isDeployed ? (
                    <CheckCircle2 className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Rocket className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div>
                  <span className={`text-sm font-medium transition-colors duration-500 ${isDeployed ? 'text-white' : 'text-white'}`}>
                    {topTask.title}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {topTask.estimatedTime}
                  </div>
                </div>
              </div>
              <div className={`text-xs mb-3 ${isDeployed ? 'text-gray-400' : 'text-gray-500'}`}>
                {topTask.description}
              </div>
            </div>
            
            {/* Deploy Button */}
            <motion.button
              onClick={handleDeploy}
              disabled={isDeployed}
              className={`px-4 py-2 border text-xs font-medium transition-all duration-500 ${
                isDeployed
                  ? 'bg-green-600/10 border-green-600/60 text-green-400 cursor-not-allowed'
                  : 'bg-[#2a2a2a] border-[#444444] text-white hover:bg-[#333333] hover:border-[#555555]'
              }`}
              whileHover={!isDeployed ? { scale: 1.02 } : {}}
              whileTap={!isDeployed ? { scale: 0.98 } : {}}
            >
              {isDeployed ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" />
                  Deployed
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Deploy Now
                  <ArrowRight className="w-3 h-3" />
                </span>
              )}
            </motion.button>
          </div>

          {/* Deployment Steps */}
          <div className="space-y-2">
            {topTask.steps.map((step, index) => (
              <motion.div
                key={step}
                initial={{ opacity: 0.3 }}
                animate={{ 
                  opacity: isDeployed && index <= currentStep ? 1 : 0.3,
                }}
                transition={{ 
                  duration: 0.3, 
                  ease: "easeOut",
                  delay: isDeployed ? index * 0.4 : 0 
                }}
                className={`flex items-center gap-2 text-xs transition-colors duration-500 ${
                  isDeployed && index <= currentStep ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                <div className={`w-1 h-1 rounded-full transition-colors duration-500 ${
                  isDeployed && index <= currentStep ? 'bg-gray-400' : 'bg-gray-700'
                }`} />
                {step}
                {isDeployed && index <= currentStep && (
                  <CheckCircle2 className="w-3 h-3 ml-auto text-gray-400" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Impact Display */}
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={isDeployed ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
          transition={{ 
            height: { duration: 0.6, ease: "easeOut", delay: isDeployed ? 2.5 : 0 },
            opacity: { duration: 0.5, ease: "easeOut", delay: isDeployed ? 2.6 : 0 }
          }}
          className="overflow-hidden"
        >
          {isDeployed && (
            <div className="pt-4 border-t border-[#333333]">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400 uppercase tracking-wider">Impact Applied</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300">Citation chance improvement</span>
                <motion.span 
                  className="text-lg text-white font-mono"
                  key={impact}
                  initial={{ scale: 1.2, color: '#666666' }}
                  animate={{ scale: 1, color: '#ffffff' }}
                  transition={{ duration: 0.6 }}
                >
                  +{impact}%
                </motion.span>
              </div>
              <div className="w-full h-2 bg-[#333333] overflow-hidden">
                <motion.div
                  className="h-full bg-gray-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${impact}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
        </motion.div>

      </motion.div>
    </div>
  )
} 
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { PageViewCard } from './components/page-view-card'
import { WelcomeCard } from './components/welcome-card'
import { AttributionBySourceCard } from './components/attribution-by-source-card'
import { CrawlerActivityCard } from './components/crawler-activity-card'
import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, X } from 'lucide-react'

export default function Dashboard() {
  const { user, supabase, loading } = useAuth()
  const shouldReduceMotion = useReducedMotion()
  const [setupStatus, setSetupStatus] = useState<'success' | 'canceled' | null>(null)

  // Check for setup status from URL parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const setup = urlParams.get('setup')
      
      if (setup === 'success') {
        setSetupStatus('success')
        // Clean up URL
        window.history.replaceState({}, '', '/dashboard')
      } else if (setup === 'canceled') {
        setSetupStatus('canceled')
        // Clean up URL
        window.history.replaceState({}, '', '/dashboard')
      }
    }
  }, [])

  const containerVariants = shouldReduceMotion ? {
    hidden: { opacity: 1 },
    visible: { opacity: 1 }
  } : {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  }

  const cardVariants = shouldReduceMotion ? {
    hidden: { opacity: 1, y: 0 },
    visible: { opacity: 1, y: 0 }
  } : {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0c0c0c]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-white" />
      </div>
    )
  }

  return (
    <motion.main 
      className="min-h-screen bg-[#0c0c0c] pl-6 pr-4 md:pr-6 lg:pr-8 pb-8 md:pb-12"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Setup Status Banner */}
      {setupStatus && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-3 rounded-lg border flex items-center gap-3 ${
            setupStatus === 'success' 
              ? 'bg-green-900/20 border-green-500/30 text-green-300' 
              : 'bg-red-900/20 border-red-500/30 text-red-300'
          }`}
        >
          {setupStatus === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">
            {setupStatus === 'success' 
              ? 'Payment method added successfully!' 
              : 'Payment setup was canceled'}
          </span>
          <button
            onClick={() => setSetupStatus(null)}
            className="ml-2 hover:opacity-70 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      <div className="mx-auto max-w-[1600px] flex flex-col gap-4 md:gap-6 lg:gap-8">
        {/* Welcome Card - Responsive height */}
        <motion.div 
          variants={cardVariants}
          className="min-h-[300px] md:min-h-[350px] lg:min-h-[400px]"
        >
          <WelcomeCard />
        </motion.div>

        {/* Analytics Cards - Responsive grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
          <motion.div 
            variants={cardVariants}
            className="h-[440px] md:h-[495px] lg:h-[550px]"
          >
            <PageViewCard />
          </motion.div>
          <motion.div 
            variants={cardVariants}
            className="h-[440px] md:h-[495px] lg:h-[550px]"
          >
            <AttributionBySourceCard />
          </motion.div>
        </div>
      </div>
    </motion.main>
  )
}
 
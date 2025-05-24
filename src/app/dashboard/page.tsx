'use client'

import { useAuth } from '@/contexts/AuthContext'
import { PageViewCard } from './components/page-view-card'
import { WelcomeCard } from './components/welcome-card'
import { AttributionBySourceCard } from './components/attribution-by-source-card'
import { CrawlerActivityCard } from './components/crawler-activity-card'
import { motion, useReducedMotion } from 'framer-motion'

export default function Dashboard() {
  const { user, supabase, loading } = useAuth()
  const shouldReduceMotion = useReducedMotion()

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
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-[#0c0c0c]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-white" />
      </div>
    )
  }

  return (
    <div className="h-full bg-[#0c0c0c] overflow-hidden">
      <motion.main 
        className="h-full flex flex-col p-3"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Top Row - 35% of available height */}
        <motion.div 
          className="h-[35%] mb-16"
          variants={cardVariants}
        >
          <div className="h-[40vh]">
            <WelcomeCard />
          </div>
        </motion.div>

        {/* Bottom Row - 50% of available height */}
        <div className="h-[50%] grid xl:grid-cols-2 grid-cols-1 gap-12">
          <motion.div 
            className="h-[50vh]"
            variants={cardVariants}
          >
            <PageViewCard />
          </motion.div>
          <motion.div 
            className="h-[50vh]"
            variants={cardVariants}
          >
            <AttributionBySourceCard />
          </motion.div>
        </div>
      </motion.main>
    </div>
  )
}
 
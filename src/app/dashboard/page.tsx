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
 
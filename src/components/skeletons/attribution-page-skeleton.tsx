import { motion, useReducedMotion } from "framer-motion"
import { ChartSkeleton } from "./chart-skeleton"
import { ListSkeleton } from "./list-skeleton"

export function AttributionPageSkeleton() {
  const shouldReduceMotion = useReducedMotion()

  const containerVariants = shouldReduceMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            duration: 0.2,
            staggerChildren: 0.1
          }
        }
      }

  const itemVariants = shouldReduceMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.3,
            ease: "easeOut"
          }
        }
      }

  return (
    <div className="min-h-screen min-w-screen bg-white dark:bg-[#0c0c0c] text-black dark:text-white">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex h-[calc(100vh-80px)] gap-6 p-6"
      >
        {/* Large Chart - 60% width */}
        <motion.div
          variants={itemVariants}
          className="w-[60%]"
        >
          <ChartSkeleton 
            showHeader={true}
            showStats={true}
            className="h-full"
          />
        </motion.div>

        {/* Right Side Cards - 40% width */}
        <div className="w-[40%] flex flex-col gap-6">
          {/* Attribution by Source Card */}
          <motion.div
            variants={itemVariants}
            className="flex-1"
          >
            <ListSkeleton 
              itemType="crawler"
              items={5}
              showProgress={true}
              className="h-full"
            />
          </motion.div>

          {/* Crawls by Page Card */}
          <motion.div
            variants={itemVariants}
            className="flex-1"
          >
            <ListSkeleton 
              itemType="page"
              items={6}
              showProgress={true}
              className="h-full"
            />
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
} 
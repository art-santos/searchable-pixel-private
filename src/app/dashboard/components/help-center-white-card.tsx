'use client'
import { Card, CardContent } from "@/components/ui/card"
import { motion, useReducedMotion } from "framer-motion"
import { useState, useEffect } from "react"
import { ArrowUpRight } from "lucide-react"

interface Article {
  title: string
  date: string
  readingTime: string
  slug: string
  coverImage: string
  tags: string[]
}

// Real articles from the resources
const ARTICLES: Article[] = [
  {
    title: "10 Quick Wins to Get Your Site Cited by ChatGPT & AI Engines",
    date: "May 11, 2025",
    readingTime: "8 min read",
    slug: "quick-wins-for-aeo",
    coverImage: "/blog/article-cover-2.png",
    tags: ["AEO", "Quick Wins", "AI Visibility"]
  },
  {
    title: "Building Domain Trust and Authority to Get Cited by AI",
    date: "May 21, 2025", 
    readingTime: "12 min read",
    slug: "building-domain-trust-for-ai",
    coverImage: "/blog/article-cover-4.png",
    tags: ["AEO", "Domain Authority", "AI Citations"]
  },
  {
    title: "How to Track If AI Engines Are Seeing Your Content",
    date: "May 11, 2025",
    readingTime: "10 min read", 
    slug: "monitoring-ai-traffic",
    coverImage: "/blog/article-cover-3.png",
    tags: ["AEO", "AI Monitoring", "Analytics"]
  },
  {
    title: "Next.js AEO: Get Your Site Seen by ChatGPT & AI Crawlers",
    date: "May 10, 2025",
    readingTime: "15 min read",
    slug: "optimizing-nextjs-for-ai-crawlers", 
    coverImage: "/blog/article-cover-9.png",
    tags: ["Next.js", "AEO", "Performance"]
  },
  {
    title: "How AI Engines Choose Which Content to Cite",
    date: "May 05, 2025",
    readingTime: "7 min read",
    slug: "how-ai-engines-choose-citations",
    coverImage: "/blog/article-cover-5.png", 
    tags: ["AI Citations", "Content Strategy"]
  },
  {
    title: "Understanding How LLM Crawlers Work",
    date: "May 02, 2025",
    readingTime: "6 min read",
    slug: "how-llm-crawlers-work",
    coverImage: "/blog/article-cover-6.png",
    tags: ["Technical", "AI Crawlers"]
  },
  {
    title: "Vector Embeddings and Semantic Content Recall",
    date: "April 28, 2025",
    readingTime: "9 min read",
    slug: "embeddings-and-semantic-recall", 
    coverImage: "/blog/article-cover-7.png",
    tags: ["Technical", "AI Search", "Embeddings"]
  },
  {
    title: "Advanced Next.js Patterns for AI Optimization",
    date: "April 25, 2025",
    readingTime: "14 min read",
    slug: "nextjs-patterns-for-ai",
    coverImage: "/blog/article-cover-8.png",
    tags: ["Next.js", "Advanced", "AEO"]
  },
  {
    title: "Technical Controls for Managing AI Crawler Access",
    date: "April 20, 2025", 
    readingTime: "11 min read",
    slug: "technical-controls-for-ai-crawlers",
    coverImage: "/blog/article-cover-1.png",
    tags: ["Technical", "Crawler Management"]
  }
]

// White Skeleton for loading state
function HelpCenterSkeleton() {
  const shouldReduceMotion = useReducedMotion()

  const WhiteSkeleton = ({ className }: { className?: string }) => (
    <motion.div
      className={`bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-sm bg-[length:200%_100%] ${className}`}
      style={{ backgroundPosition: '-200% 0' }}
      animate={shouldReduceMotion ? {} : {
        backgroundPosition: ['200% 0', '-200% 0']
      }}
      transition={{
        duration: 2.5,
        repeat: Infinity,
        ease: [0.25, 0.1, 0.25, 1], // Very smooth ease for shimmer
        repeatType: "loop"
      }}
    />
  )

  return (
    <div className="h-full flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
      >
        <WhiteSkeleton className="h-[180px] w-full rounded-lg mb-3 flex-shrink-0" />
      </motion.div>
      <div className="space-y-2 flex-shrink-0">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3, ease: [0.42, 0, 0.58, 1] }}>
          <WhiteSkeleton className="h-4 w-full" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.3, ease: [0.42, 0, 0.58, 1] }}>
          <WhiteSkeleton className="h-4 w-3/4" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.3, ease: [0.42, 0, 0.58, 1] }} className="flex items-center gap-2">
          <WhiteSkeleton className="h-3 w-16" />
          <WhiteSkeleton className="h-3 w-20" />
          <WhiteSkeleton className="h-3 w-12" />
        </motion.div>
      </div>
    </div>
  )
}

export function HelpCenterWhiteCard() {
  const shouldReduceMotion = useReducedMotion()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Auto-rotate articles every 7 seconds
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isLoading) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ARTICLES.length)
    }, 7000)

    return () => clearInterval(interval)
  }, [isLoading])

  const currentArticle = ARTICLES[currentIndex]

  const cardVariants = shouldReduceMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, y: 8, scale: 0.99 },
        visible: { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          transition: { 
            duration: 0.4, 
            ease: [0.42, 0, 0.58, 1], // Smooth ease for natural feel
            type: "spring",
            stiffness: 200,
            damping: 25
          } 
        }
      }

  const contentVariants = shouldReduceMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, scale: 0.98 },
        visible: { 
          opacity: 1, 
          scale: 1,
          transition: { 
            duration: 0.8, 
            ease: [0.42, 0, 0.58, 1], // Very smooth ease
            type: "spring",
            stiffness: 120,
            damping: 20
          } 
        }
      }

  return (
    <Card className="h-full bg-white border-0">
      <CardContent className="p-0 h-full flex flex-col">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="flex flex-col h-full"
        >
          {/* Header */}
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex-shrink-0">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
              className="flex items-center justify-between"
            >
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-lg font-medium text-black">Help Center</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Top Resources</p>
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.42, 0, 0.58, 1] }}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors flex-shrink-0 hidden sm:flex"
              >
                Get help/support
                <ArrowUpRight className="w-3 h-3" />
              </motion.button>
            </motion.div>
          </div>

          {/* Content */}
          <div className="flex-1 px-3 sm:px-6 py-3 sm:py-4 min-h-0">
            {isLoading ? (
              <HelpCenterSkeleton />
            ) : (
              <motion.div
                key={currentIndex}
                initial="hidden"
                animate="visible" 
                variants={contentVariants}
                className="h-full"
              >
                {/* Featured Article */}
                <div className="flex flex-col h-full">
                  {/* Image with responsive height that scales with card */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4, ease: [0.42, 0, 0.58, 1] }}
                    className="relative flex-1 mb-3 sm:mb-4 flex-shrink-0 min-h-[180px]"
                  >
                    <img 
                      src={currentArticle.coverImage}
                      alt={currentArticle.title}
                      className="w-full h-full object-cover rounded-lg bg-gray-100"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const fallback = target.nextElementSibling as HTMLElement
                        if (fallback) fallback.style.display = 'flex'
                      }}
                    />
                    <div className="hidden w-full h-full bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg items-center justify-center">
                      <span className="text-gray-400 text-sm">Article Cover</span>
                    </div>
                  </motion.div>

                  {/* Text Content at bottom - guaranteed space */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4, ease: [0.42, 0, 0.58, 1] }}
                    className="space-y-2 sm:space-y-3 flex-shrink-0"
                  >
                    <motion.a 
                      href={`/resources/${currentArticle.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                      whileHover={{ 
                        scale: 1.005,
                        transition: { 
                          duration: 0.3, 
                          ease: [0.42, 0, 0.58, 1]
                        }
                      }}
                      whileTap={{ scale: 0.995 }}
                    >
                      <h4 className="text-xs sm:text-sm font-medium text-gray-900 hover:text-gray-700 transition-colors duration-200 ease-out relative overflow-hidden whitespace-nowrap">
                        <span className="relative z-10">{currentArticle.title}</span>
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-20" />
                      </h4>
                    </motion.a>

                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-gray-500">
                      <span>{currentArticle.date}</span>
                      <span>•</span>
                      <span>{currentArticle.readingTime}</span>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </CardContent>
    </Card>
  )
} 
'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { FileText, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { useEffect, useState } from "react"

interface PageData {
  url: string
  sessions: number
  referringPlatforms: string[]
  bounceRate: number
  avgDuration: string
}

export function MostVisitedPagesCard() {
  const { currentWorkspace } = useWorkspace()
  const [data, setData] = useState<PageData[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(8)

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.42, 0, 0.58, 1] } }
  }

  useEffect(() => {
    const fetchPagesData = async () => {
      if (!currentWorkspace) {
        setLoading(false)
        return
      }

      try {
        // Mock data - replace with actual API call
        setTimeout(() => {
          const mockData: PageData[] = [
            {
              url: '/blog/ai-vs-seo',
              sessions: 2847,
              referringPlatforms: ['ChatGPT', 'Claude', 'Perplexity'],
              bounceRate: 23.4,
              avgDuration: '4m 32s'
            },
            {
              url: '/pricing',
              sessions: 1923,
              referringPlatforms: ['ChatGPT', 'Gemini'],
              bounceRate: 45.7,
              avgDuration: '2m 15s'
            },
            {
              url: '/docs/searchable-api',
              sessions: 1456,
              referringPlatforms: ['Claude', 'Perplexity', 'ChatGPT'],
              bounceRate: 18.9,
              avgDuration: '6m 42s'
            },
            {
              url: '/about',
              sessions: 1234,
              referringPlatforms: ['ChatGPT'],
              bounceRate: 67.2,
              avgDuration: '1m 34s'
            },
            {
              url: '/blog/llm-tracking-guide',
              sessions: 987,
              referringPlatforms: ['Claude', 'ChatGPT', 'Perplexity'],
              bounceRate: 28.1,
              avgDuration: '5m 18s'
            },
            {
              url: '/features',
              sessions: 876,
              referringPlatforms: ['Gemini', 'ChatGPT'],
              bounceRate: 52.3,
              avgDuration: '3m 07s'
            },
            {
              url: '/contact',
              sessions: 654,
              referringPlatforms: ['ChatGPT'],
              bounceRate: 78.9,
              avgDuration: '0m 45s'
            },
            {
              url: '/blog/seo-future-ai',
              sessions: 543,
              referringPlatforms: ['Perplexity', 'Claude'],
              bounceRate: 31.2,
              avgDuration: '4m 51s'
            },
            {
              url: '/dashboard',
              sessions: 432,
              referringPlatforms: ['ChatGPT', 'Claude'],
              bounceRate: 12.3,
              avgDuration: '12m 34s'
            },
            {
              url: '/integrations',
              sessions: 321,
              referringPlatforms: ['Gemini'],
              bounceRate: 48.7,
              avgDuration: '2m 56s'
            }
          ]
          setData(mockData)
          setLoading(false)
        }, 700)
      } catch (error) {
        console.error('Error fetching pages data:', error)
        setLoading(false)
      }
    }

    fetchPagesData()
  }, [currentWorkspace])

  const totalPages = Math.ceil(data.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = data.slice(startIndex, endIndex)

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      'ChatGPT': 'bg-green-100 text-green-700',
      'Claude': 'bg-indigo-100 text-indigo-700', 
      'Perplexity': 'bg-amber-100 text-amber-700',
      'Gemini': 'bg-pink-100 text-pink-700'
    }
    return colors[platform] || 'bg-gray-100 text-gray-700'
  }

  const getBounceRateColor = (bounceRate: number) => {
    if (bounceRate < 30) return 'text-green-600'
    if (bounceRate < 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <motion.div
        key="loading-skeleton"
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="h-full"
      >
        <Card className="bg-white border border-gray-200 shadow-sm h-full">
          <CardContent className="p-6 h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-6 w-48 bg-gray-200 animate-pulse rounded"></div>
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="h-4 w-48 bg-gray-200 animate-pulse rounded mb-2"></div>
                    <div className="h-3 w-32 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                  <div className="flex gap-8">
                    <div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div>
                    <div className="h-4 w-12 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      className="h-full"
    >
      <Card className="bg-white border border-gray-200 shadow-sm h-full">
        <CardContent className="p-6 h-full flex flex-col">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
            className="flex items-center justify-between mb-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 flex items-center justify-center rounded">
                <FileText className="w-4 h-4 text-gray-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Most Visited Pages</h2>
            </div>
          </motion.div>

          {/* Table Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
            className="grid grid-cols-12 gap-4 pb-3 mb-4 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide"
          >
            <div className="col-span-5">Page URL</div>
            <div className="col-span-2">Sessions</div>
            <div className="col-span-3">Referring AI Platforms</div>
            <div className="col-span-2">Bounce Rate</div>
          </motion.div>

          {/* Table Body */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.4 } }
            }}
            className="flex-1 space-y-2"
          >
            {currentData.map((page, index) => (
              <motion.div
                key={page.url}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.2, ease: [0.42, 0, 0.58, 1] }}
                className="grid grid-cols-12 gap-4 items-center py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
              >
                {/* Page URL */}
                <div className="col-span-5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate" title={page.url}>
                        {page.url}
                      </div>
                      <div className="text-xs text-gray-500">
                        {page.avgDuration} avg duration
                      </div>
                    </div>
                    <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  </div>
                </div>

                {/* Sessions */}
                <div className="col-span-2">
                  <div className="text-sm font-semibold text-gray-900">
                    {page.sessions.toLocaleString()}
                  </div>
                </div>

                {/* Referring Platforms */}
                <div className="col-span-3">
                  <div className="flex flex-wrap gap-1">
                    {page.referringPlatforms.slice(0, 3).map((platform, i) => (
                      <span
                        key={platform}
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPlatformColor(platform)}`}
                      >
                        {platform}
                      </span>
                    ))}
                    {page.referringPlatforms.length > 3 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        +{page.referringPlatforms.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bounce Rate */}
                <div className="col-span-2">
                  <div className={`text-sm font-medium ${getBounceRateColor(page.bounceRate)}`}>
                    {page.bounceRate.toFixed(1)}%
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        page.bounceRate < 30 ? 'bg-green-500' :
                        page.bounceRate < 50 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(page.bounceRate, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
              className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100"
            >
              <p className="text-sm text-gray-500">
                Showing {startIndex + 1}-{Math.min(endIndex, data.length)} of {data.length} pages
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-3"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-3"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Footer Insight */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
            className="mt-4 pt-4 border-t border-gray-100"
          >
            <p className="text-xs text-gray-500">
              💡 <strong>Insight:</strong> Documentation pages show low bounce rates, indicating high engagement. 
              Cross-platform referral patterns suggest diverse AI user preferences.
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
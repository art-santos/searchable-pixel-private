'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, CheckCircle2, AlertTriangle, Globe, FileText, Code, MessageSquare, Zap, ArrowRight } from 'lucide-react'

// Type definitions for audit results
interface AuditItem {
  name: string
  status: 'pass' | 'fail'
  description: string
  upgrade?: boolean
}

interface AuditCategory {
  category: string
  items: AuditItem[]
}

interface AuditResults {
  url: string
  timestamp: string
  overall_score: number
  checks: AuditCategory[]
}

// Mock audit data - replace with real API
const mockAuditResults: AuditResults = {
  url: 'https://example.com',
  timestamp: '2025-01-23T10:30:00Z',
  overall_score: 72,
  checks: [
    {
      category: 'AI Crawlability',
      items: [
        { name: 'Robots.txt accessible', status: 'pass', description: 'Search engines can access your robots.txt file' },
        { name: 'Meta robots tags', status: 'pass', description: 'Proper indexing directives found' },
        { name: 'Sitemap.xml present', status: 'fail', description: 'No XML sitemap detected', upgrade: true },
        { name: 'Page load speed', status: 'pass', description: 'Page loads in under 2 seconds' },
      ]
    },
    {
      category: 'AI Understanding',
      items: [
        { name: 'llms.txt file', status: 'fail', description: 'No llms.txt file found for AI engine instructions', upgrade: true },
        { name: 'Structured data', status: 'fail', description: 'Missing schema markup for better AI comprehension', upgrade: true },
        { name: 'Semantic HTML', status: 'pass', description: 'Good use of semantic HTML elements' },
        { name: 'Content hierarchy', status: 'pass', description: 'Clear heading structure detected' },
      ]
    },
    {
      category: 'Content Optimization',
      items: [
        { name: 'FAQ markup', status: 'fail', description: 'No FAQ schema found for Q&A optimization', upgrade: true },
        { name: 'Key topics coverage', status: 'pass', description: 'Main topics clearly defined' },
        { name: 'Internal linking', status: 'pass', description: 'Good internal link structure' },
        { name: 'Content depth', status: 'fail', description: 'Content could be more comprehensive', upgrade: true },
      ]
    }
  ]
}

export default function SiteAuditPage() {
  const { loading } = useAuth()
  const [url, setUrl] = useState('')
  const [isAuditing, setIsAuditing] = useState(false)
  const [auditResults, setAuditResults] = useState<AuditResults | null>(null)

  const handleAudit = async () => {
    if (!url) return
    
    setIsAuditing(true)
    // Simulate API call
    setTimeout(() => {
      setAuditResults(mockAuditResults)
      setIsAuditing(false)
    }, 2000)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0c0c0c]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-white" />
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#0c0c0c] overflow-hidden">
      <motion.main 
        className="h-full flex flex-col"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="border-b border-[#222] p-6">
          <h1 className="text-2xl font-semibold text-white mb-2">Site Audit</h1>
          <p className="text-[#888] text-sm">Test your site's readiness for AI engines</p>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-6">
          {/* URL Input Section */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#666]" />
                <input
                  type="url"
                  placeholder="Enter URL to audit (e.g., https://example.com)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-[#555] text-sm"
                  disabled={isAuditing}
                />
              </div>
              <button
                onClick={handleAudit}
                disabled={!url || isAuditing}
                className="px-6 py-4 bg-white text-black rounded-lg font-medium hover:bg-[#f5f5f5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center gap-2"
              >
                {isAuditing ? (
                  <>
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Auditing...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Audit Site
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Results Section */}
          <AnimatePresence>
            {auditResults && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1"
              >
                {/* Score Overview */}
                <div className="mb-8 p-6 border border-[#333] rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">Audit Results</h3>
                      <p className="text-[#666] text-sm">{auditResults.url}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-white">{auditResults.overall_score}</div>
                      <div className="text-[#666] text-sm">AI Readiness Score</div>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="flex gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                      <span className="text-[#aaa]">
                        {auditResults.checks.flatMap((c: AuditCategory) => c.items).filter((i: AuditItem) => i.status === 'pass').length} passing
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-white" />
                      <span className="text-[#aaa]">
                        {auditResults.checks.flatMap((c: AuditCategory) => c.items).filter((i: AuditItem) => i.status === 'fail').length} issues found
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detailed Results */}
                <div className="space-y-6">
                  {auditResults.checks.map((category: AuditCategory, idx: number) => (
                    <motion.div
                      key={category.category}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + idx * 0.1 }}
                      className="border border-[#333] rounded-lg"
                    >
                      <div className="p-4 border-b border-[#333]">
                        <h4 className="text-white font-medium">{category.category}</h4>
                      </div>
                      <div className="p-4 space-y-3">
                        {category.items.map((item: AuditItem, itemIdx: number) => (
                          <div key={itemIdx} className="flex items-start justify-between py-2">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="mt-0.5">
                                {item.status === 'pass' ? (
                                  <CheckCircle2 className="h-4 w-4 text-white" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 text-white" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="text-white text-sm font-medium mb-1">{item.name}</div>
                                <div className="text-[#888] text-sm">{item.description}</div>
                              </div>
                            </div>
                            {item.upgrade && (
                              <button className="ml-4 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] rounded-md text-white text-xs font-medium transition-colors flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                Fix
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Upgrade CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 p-6 border border-[#333] rounded-lg bg-[#0a0a0a]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium mb-1">Ready to optimize your entire site?</h4>
                      <p className="text-[#888] text-sm">Get comprehensive AI visibility analysis and automated fixes</p>
                    </div>
                    <button className="px-4 py-2 bg-white text-black rounded-md font-medium hover:bg-[#f5f5f5] transition-colors flex items-center gap-2 text-sm">
                      Upgrade to Pro
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!auditResults && !isAuditing && (
            <motion.div
              variants={itemVariants}
              className="flex-1 flex items-center justify-center"
            >
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-[#1a1a1a] border border-[#333] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-[#666]" />
                </div>
                <h3 className="text-white font-medium mb-2">Test your site's AI readiness</h3>
                <p className="text-[#888] text-sm leading-relaxed">
                  Enter any URL to check crawlability, structured data, AI-specific optimizations, and content quality. 
                  Get actionable insights to improve your visibility in AI search results.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.main>
    </div>
  )
} 
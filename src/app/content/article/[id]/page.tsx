'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { motion, useReducedMotion } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  Copy,
  Download,
  Edit3,
  Archive,
  Sparkles,
  FileText,
  Calendar,
  Clock,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// Mock data - same as in content page
const mockCompletedArticles = [
  {
    id: 1,
    title: "AI Prospecting Frameworks for B2B Sales Teams",
    subtitle: "A comprehensive guide to modern prospecting strategies",
    primaryKeyword: "ai prospecting frameworks",
    scoreUplift: 23,
    createdBecause: "Fills missing brand mention in 12/100 direct prompts targeting sales automation queries.",
    gapAddressed: "Missing prompt coverage for 'AI prospecting best practices' cluster",
    strategicFit: "Boosts direct brand mentions in sales-focused AI conversations",
    content: "# AI Prospecting Frameworks for B2B Sales Teams\n\nIn today's competitive B2B landscape, sales teams need sophisticated approaches to identify and engage potential customers. This comprehensive guide explores proven AI-powered prospecting frameworks that can transform your sales process.\n\n## The Evolution of B2B Prospecting\n\nTraditional prospecting methods are becoming increasingly ineffective. Cold calling has a success rate of less than 2%, and generic email campaigns often end up in spam folders. Modern buyers expect personalized, value-driven interactions from the very first touchpoint.\n\n## Framework 1: Intent-Based Prospecting\n\nIntent-based prospecting leverages AI to identify prospects who are actively researching solutions in your space. This approach focuses on:\n\n- Monitoring buyer intent signals across digital channels\n- Analyzing content consumption patterns\n- Identifying prospects in active buying cycles\n- Timing outreach for maximum impact\n\n## Framework 2: Predictive Lead Scoring\n\nAI-powered lead scoring goes beyond traditional demographic and firmographic data to include:\n\n- Behavioral patterns and engagement history\n- Lookalike modeling based on your best customers\n- Real-time scoring updates as prospects interact with your brand\n- Integration with sales automation tools\n\n## Implementation Best Practices\n\n1. **Data Quality Foundation**: Ensure your CRM data is clean and comprehensive\n2. **Multi-Channel Approach**: Combine email, social, and phone outreach\n3. **Continuous Optimization**: Regularly analyze and refine your approach\n4. **Sales and Marketing Alignment**: Ensure both teams work from the same playbook\n\n## Measuring Success\n\nKey metrics to track include:\n- Response rates by channel and message type\n- Time from first contact to qualified opportunity\n- Conversion rates at each stage of the funnel\n- Revenue attribution to prospecting activities\n\n## Conclusion\n\nAI-powered prospecting frameworks represent the future of B2B sales. By implementing these strategies, sales teams can increase efficiency, improve conversion rates, and build stronger relationships with prospects from the very first interaction.",
    createdAt: "2024-01-15",
    status: "Published",
    wordCount: 2400,
    readTime: "8 min",
    views: 1247,
    engagement: 94,
    category: "Sales Strategy"
  },
  {
    id: 2,
    title: "Enterprise AI Implementation Roadmap",
    subtitle: "Strategic planning for large-scale AI adoption",
    primaryKeyword: "enterprise ai implementation",
    scoreUplift: 18,
    createdBecause: "Targets long-tail query cluster addressing enterprise adoption challenges.",
    gapAddressed: "Competitor edge in enterprise AI guidance content",
    strategicFit: "Positions brand as enterprise AI thought leader",
    content: "# Enterprise AI Implementation Roadmap\n\nImplementing AI at enterprise scale requires careful planning and strategic execution...",
    createdAt: "2024-01-14",
    status: "Published",
    wordCount: 3200,
    readTime: "12 min",
    views: 892,
    engagement: 87,
    category: "Enterprise"
  },
  {
    id: 3,
    title: "Cold Email Personalization at Scale",
    subtitle: "Balancing automation with authentic outreach",
    primaryKeyword: "cold email personalization",
    scoreUplift: 31,
    createdBecause: "High-converting topic with strong search intent and low competition.",
    gapAddressed: "Personalization gap in automated outreach content",
    strategicFit: "Showcases product capabilities through educational content",
    content: "# Cold Email Personalization at Scale\n\nPersonalization is the key to successful cold email campaigns...",
    createdAt: "2024-01-13",
    status: "Published",
    wordCount: 1800,
    readTime: "6 min",
    views: 2156,
    engagement: 96,
    category: "Email Marketing"
  },
  {
    id: 4,
    title: "B2B Lead Scoring with Machine Learning",
    subtitle: "Advanced techniques for qualifying prospects",
    primaryKeyword: "b2b lead scoring",
    scoreUplift: 15,
    createdBecause: "Addresses technical implementation questions from enterprise prospects.",
    gapAddressed: "Technical depth missing in competitor content",
    strategicFit: "Demonstrates technical expertise and product capabilities",
    content: "# B2B Lead Scoring with Machine Learning\n\nMachine learning transforms how we identify and prioritize prospects...",
    createdAt: "2024-01-12",
    status: "Published",
    wordCount: 2800,
    readTime: "10 min",
    views: 743,
    engagement: 89,
    category: "Technology"
  },
  {
    id: 5,
    title: "Sales Automation ROI Calculator",
    subtitle: "Measuring the impact of automated outreach",
    primaryKeyword: "sales automation roi",
    scoreUplift: 27,
    createdBecause: "High-intent commercial queries from decision makers evaluating tools.",
    gapAddressed: "ROI calculation framework missing in market",
    strategicFit: "Supports sales conversations with concrete value metrics",
    content: "# Sales Automation ROI Calculator\n\nCalculating return on investment for sales automation requires...",
    createdAt: "2024-01-11",
    status: "Published",
    wordCount: 2100,
    readTime: "7 min",
    views: 1534,
    engagement: 92,
    category: "Business"
  }
]

export default function ArticlePage() {
  const { loading } = useAuth()
  const shouldReduceMotion = useReducedMotion()
  const params = useParams()
  const router = useRouter()
  const [article, setArticle] = useState<any>(null)

  useEffect(() => {
    // Find article by ID
    const articleId = parseInt(params.id as string)
    const foundArticle = mockCompletedArticles.find(a => a.id === articleId)
    setArticle(foundArticle)
  }, [params.id])

  const containerVariants = shouldReduceMotion ? {
    hidden: { opacity: 1 },
    visible: { opacity: 1 }
  } : {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = shouldReduceMotion ? {
    hidden: { opacity: 1, y: 0 },
    visible: { opacity: 1, y: 0 }
  } : {
    hidden: { opacity: 0, y: 12 },
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

  if (!article) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0c0c0c]">
        <div className="text-center">
          <h2 className="text-lg font-medium text-white mb-2">Article not found</h2>
          <p className="text-sm text-[#666] mb-4">The article you're looking for doesn't exist.</p>
          <Button 
            onClick={() => router.push('/content')}
            className="bg-white text-black hover:bg-[#f5f5f5]"
          >
            Back to Content
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[95vh] bg-[#0c0c0c] overflow-hidden">
      <motion.main 
        className="h-full flex"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Left Panel - Article Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Back Button */}
            <motion.div variants={itemVariants}>
              <Button
                variant="ghost"
                onClick={() => router.push('/content')}
                className="text-[#666] hover:text-white hover:bg-[#1a1a1a] mb-6 p-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Content
              </Button>
            </motion.div>

            {/* Header */}
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="border-[#333] text-[#888] bg-[#0a0a0a] text-xs px-2 py-1">
                    {article.category}
                  </Badge>
                  <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 bg-emerald-500/10 text-xs px-2 py-1">
                    +{article.scoreUplift}% impact
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#666]">
                  <Clock className="w-4 h-4" />
                  <span>{article.readTime}</span>
                  <span>•</span>
                  <span>{article.wordCount} words</span>
                  <span>•</span>
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* SEO Information */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-[#888] uppercase tracking-wide">Suggested Slug</label>
                  <p className="text-sm text-white mt-1 font-mono bg-[#0a0a0a] px-3 py-2 border border-[#1a1a1a] inline-block">
                    /{article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}
                  </p>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-[#888] uppercase tracking-wide">Title</label>
                  <h1 className="text-3xl font-semibold text-white mt-2 leading-tight">
                    {article.title}
                  </h1>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-[#888] uppercase tracking-wide">Meta Description</label>
                  <p className="text-base text-[#ccc] mt-2 leading-relaxed">
                    {article.subtitle}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Article Content */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="border-t border-[#1a1a1a] pt-8">
                <h2 className="text-lg font-medium text-white mb-6">Article Content</h2>
                <div className="prose prose-invert prose-lg max-w-none">
                  <div className="text-[#ccc] leading-relaxed whitespace-pre-wrap">
                    {article.content}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Panel - Strategic Overview */}
        <motion.div variants={itemVariants} className="w-80 border-l border-[#1a1a1a] p-8 bg-[#0a0a0a] overflow-y-auto">
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium text-white mb-6">Strategic Overview</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-white mb-3">Purpose</h4>
                  <p className="text-sm text-[#ccc] leading-relaxed">
                    {article.createdBecause}
                  </p>
                </div>

                <div className="border-t border-[#1a1a1a] pt-6">
                  <h4 className="text-sm font-medium text-white mb-3">Gap Analysis</h4>
                  <p className="text-sm text-[#888] leading-relaxed">
                    {article.gapAddressed}
                  </p>
                </div>

                <div className="border-t border-[#1a1a1a] pt-6">
                  <h4 className="text-sm font-medium text-white mb-3">Strategic Fit</h4>
                  <p className="text-sm text-[#888] leading-relaxed">
                    {article.strategicFit}
                  </p>
                </div>

                <div className="border-t border-[#1a1a1a] pt-6">
                  <h4 className="text-sm font-medium text-white mb-3">Target Keywords</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#ccc]">{article.primaryKeyword}</span>
                      <span className="text-xs text-[#666]">Primary</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#1a1a1a] pt-6">
                  <h4 className="text-sm font-medium text-white mb-3">Performance</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#888]">Views</span>
                      <span className="text-sm text-white">{article.views.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#888]">Engagement</span>
                      <span className="text-sm text-emerald-400">{article.engagement}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#1a1a1a] pt-8">
              <h3 className="text-lg font-medium text-white mb-4">Actions</h3>
              <div className="space-y-3">
                <Button className="w-full bg-white text-black hover:bg-[#f5f5f5] h-9 text-sm justify-start">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Give Feedback
                </Button>
                <Button variant="outline" className="w-full border-[#333] hover:border-[#444] text-[#888] hover:text-white h-9 text-sm justify-start">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Markdown
                </Button>
                <Button variant="outline" className="w-full border-[#333] hover:border-[#444] text-[#888] hover:text-white h-9 text-sm justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Copy Plain Text
                </Button>
                <Button variant="outline" className="w-full border-[#333] hover:border-[#444] text-[#888] hover:text-white h-9 text-sm justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Download HTML
                </Button>
                <div className="border-t border-[#1a1a1a] pt-3 mt-3">
                  <Button variant="outline" className="w-full border-[#333] hover:border-[#444] text-[#888] hover:text-white h-9 text-sm justify-start">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Article
                  </Button>
                  <Button variant="outline" className="w-full border-[#333] hover:border-[#444] text-[#888] hover:text-white h-9 text-sm justify-start mt-2">
                    <Archive className="w-4 h-4 mr-2" />
                    Archive
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.main>
    </div>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { 
  Search, 
  Download,
  Copy,
  ExternalLink,
  TrendingUp,
  Calendar,
  Sparkles,
  CheckCircle2,
  X,
  MoreHorizontal,
  Edit3,
  Share2,
  Archive,
  SortAsc,
  SortDesc,
  ChevronDown,
  Eye,
  Clock,
  FileText,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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
    content: "# AI Prospecting Frameworks for B2B Sales Teams\n\nIn today's competitive B2B landscape, sales teams need sophisticated approaches to identify and engage potential customers...",
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

const tabs = [
  { id: 'completed', label: 'Completed Articles' },
  { id: 'queue', label: 'Content Queue' },
  { id: 'knowledge', label: 'Knowledge Base' }
]

export default function ContentPage() {
  const { loading } = useAuth()
  const shouldReduceMotion = useReducedMotion()
  const [activeTab, setActiveTab] = useState('completed')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<string>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedArticles, setSelectedArticles] = useState<number[]>([])

  // TODO: Connect to real backend
  // - Fetch completed articles from /api/content/completed

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

  // Filter and sort articles
  const filteredArticles = mockCompletedArticles
    .filter(article => 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.primaryKeyword.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField as keyof typeof a]
      const bValue = b[sortField as keyof typeof b]
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const handleSelectArticle = (articleId: number) => {
    setSelectedArticles(prev => 
      prev.includes(articleId) 
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    )
  }

  const handleSelectAll = () => {
    if (selectedArticles.length === filteredArticles.length) {
      setSelectedArticles([])
    } else {
      setSelectedArticles(filteredArticles.map(article => article.id))
    }
  }

  const handleBulkExport = (format: string) => {
    console.log(`Exporting ${selectedArticles.length} articles as ${format}`)
    // TODO: Implement bulk export
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0c0c0c]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-white" />
      </div>
    )
  }

  return (
    <div className="h-[95vh] bg-[#0c0c0c] overflow-hidden">
      <motion.main 
        className="h-full flex flex-col"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Tab Navigation */}
        <motion.div variants={itemVariants} className="border-b border-[#1a1a1a] px-8 py-6">
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-4 py-2 text-sm font-medium tracking-tight transition-colors border
                    ${activeTab === tab.id 
                      ? 'bg-[#222] text-white border-[#444]' 
                      : 'text-[#666] hover:text-white hover:bg-[#1a1a1a] border-[#333]'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => {
                // Add refresh logic here
                console.log('Refreshing content...')
              }}
              className="px-4 py-2 text-sm font-medium tracking-tight transition-colors border text-[#666] hover:text-white hover:bg-[#1a1a1a] border-[#333] flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Generate Content
            </button>
          </div>

          {/* Page Header */}
          {activeTab === 'completed' && (
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-medium text-white">Completed Articles</h1>
                <p className="text-sm text-[#666] mt-0.5">
                  {filteredArticles.length} articles ready for distribution
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {selectedArticles.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="border-[#333] hover:border-[#444] text-[#666] hover:text-white h-8 px-3 text-sm">
                        Export {selectedArticles.length}
                        <ChevronDown className="w-4 h-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                      <DropdownMenuItem onClick={() => handleBulkExport('markdown')} className="hover:bg-[#2a2a2a] cursor-pointer">
                        <FileText className="w-4 h-4 mr-2" />
                        Markdown
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkExport('html')} className="hover:bg-[#2a2a2a] cursor-pointer">
                        <FileText className="w-4 h-4 mr-2" />
                        HTML
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkExport('json')} className="hover:bg-[#2a2a2a] cursor-pointer">
                        <FileText className="w-4 h-4 mr-2" />
                        JSON
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                      <DropdownMenuItem onClick={() => handleBulkExport('zip')} className="hover:bg-[#2a2a2a] cursor-pointer">
                        <Archive className="w-4 h-4 mr-2" />
                        ZIP Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#666]" />
                  <Input
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[#0c0c0c] border-[#1a1a1a] hover:border-[#2a2a2a] focus:border-[#3a3a3a] text-white h-8 pl-10 pr-4 w-64 text-sm transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Completed Articles Tab */}
        {activeTab === 'completed' && (
          <motion.div variants={itemVariants} className="flex-1 overflow-hidden p-8">
            <div className="bg-[#0c0c0c] border border-[#1a1a1a] overflow-hidden">
              {/* Table Header with Title and Search */}
              <div className="flex items-center justify-between p-6 border-b border-[#1a1a1a]">
                <div>
                  <h1 className="text-lg font-medium text-white">Completed Articles</h1>
                  <p className="text-sm text-[#666] mt-0.5">
                    {filteredArticles.length} articles ready for distribution
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  {selectedArticles.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="border-[#333] hover:border-[#444] text-[#666] hover:text-white h-8 px-3 text-sm">
                          Export {selectedArticles.length}
                          <ChevronDown className="w-4 h-4 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                        <DropdownMenuItem onClick={() => handleBulkExport('markdown')} className="hover:bg-[#2a2a2a] cursor-pointer">
                          <FileText className="w-4 h-4 mr-2" />
                          Markdown
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkExport('html')} className="hover:bg-[#2a2a2a] cursor-pointer">
                          <FileText className="w-4 h-4 mr-2" />
                          HTML
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkExport('json')} className="hover:bg-[#2a2a2a] cursor-pointer">
                          <FileText className="w-4 h-4 mr-2" />
                          JSON
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                        <DropdownMenuItem onClick={() => handleBulkExport('zip')} className="hover:bg-[#2a2a2a] cursor-pointer">
                          <Archive className="w-4 h-4 mr-2" />
                          ZIP Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#666]" />
                    <Input
                      placeholder="Search articles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-[#0c0c0c] border-[#1a1a1a] hover:border-[#2a2a2a] focus:border-[#3a3a3a] text-white h-8 pl-10 pr-4 w-64 text-sm transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[#1a1a1a] hover:bg-transparent">
                    <TableHead className="w-12 text-center h-12">
                      <input
                        type="checkbox"
                        checked={selectedArticles.length === filteredArticles.length && filteredArticles.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-[#333] bg-transparent text-white focus:ring-0 focus:ring-offset-0"
                      />
                    </TableHead>
                    <TableHead 
                      className="text-[#888] font-medium cursor-pointer hover:text-white transition-colors h-12"
                      onClick={() => handleSort('title')}
                    >
                      <div className="flex items-center gap-2">
                        Title
                        {sortField === 'title' && (
                          sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-[#888] font-medium cursor-pointer hover:text-white transition-colors h-12"
                      onClick={() => handleSort('subtitle')}
                    >
                      <div className="flex items-center gap-2">
                        Content
                        {sortField === 'subtitle' && (
                          sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-[#888] font-medium cursor-pointer hover:text-white transition-colors h-12 w-24"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-2">
                        Status
                        {sortField === 'status' && (
                          sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-[#888] font-medium cursor-pointer hover:text-white transition-colors h-12 w-20"
                      onClick={() => handleSort('scoreUplift')}
                    >
                      <div className="flex items-center gap-2">
                        Impact
                        {sortField === 'scoreUplift' && (
                          sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-[#888] font-medium cursor-pointer hover:text-white transition-colors h-12 w-20"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center gap-2">
                        Created
                        {sortField === 'createdAt' && (
                          sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="w-16 h-12 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredArticles.map((article, index) => (
                    <TableRow 
                      key={article.id}
                      className="border-b border-[#1a1a1a] hover:bg-[#0a0a0a] transition-colors cursor-pointer group"
                      onClick={() => {
                        // Navigate to dedicated article page
                        window.location.href = `/content/article/${article.id}`
                      }}
                    >
                      <TableCell className="text-center h-14" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedArticles.includes(article.id)}
                          onChange={() => handleSelectArticle(article.id)}
                          className="w-4 h-4 rounded border-[#333] bg-transparent text-white focus:ring-0 focus:ring-offset-0"
                        />
                      </TableCell>
                      <TableCell className="h-14">
                        <div className="space-y-1">
                          <h3 className="text-white font-medium text-sm leading-tight group-hover:text-white/90 transition-colors truncate">
                            {article.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-[#555]">
                            <span>{article.wordCount} words</span>
                            <span>•</span>
                            <span>{article.readTime}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="h-14">
                        <p className="text-[#666] text-xs leading-relaxed line-clamp-2 pr-4">
                          {article.subtitle}
                        </p>
                      </TableCell>
                      <TableCell className="h-14">
                        <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 bg-emerald-500/10 text-xs font-normal">
                          Ready
                        </Badge>
                      </TableCell>
                      <TableCell className="h-14">
                        <span className="text-emerald-400 font-medium text-sm">
                          +{article.scoreUplift}%
                        </span>
                      </TableCell>
                      <TableCell className="h-14">
                        <span className="text-[#888] text-xs">
                          {new Date(article.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </TableCell>
                      <TableCell className="h-14 text-center" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-[#666] hover:text-white hover:bg-[#1a1a1a] opacity-0 group-hover:opacity-100 transition-all duration-200"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white" align="end">
                            <DropdownMenuItem 
                              className="hover:bg-[#2a2a2a] cursor-pointer"
                              onClick={() => {
                                // Navigate to dedicated article page
                                window.location.href = `/content/article/${article.id}`
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Article
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                            <DropdownMenuItem className="hover:bg-[#2a2a2a] cursor-pointer">
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Markdown
                            </DropdownMenuItem>
                            <DropdownMenuItem className="hover:bg-[#2a2a2a] cursor-pointer">
                              <FileText className="w-4 h-4 mr-2" />
                              Copy Plain Text
                            </DropdownMenuItem>
                            <DropdownMenuItem className="hover:bg-[#2a2a2a] cursor-pointer">
                              <Download className="w-4 h-4 mr-2" />
                              Download HTML
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                            <DropdownMenuItem className="hover:bg-[#2a2a2a] cursor-pointer">
                              <Sparkles className="w-4 h-4 mr-2" />
                              Give Feedback
                            </DropdownMenuItem>
                            <DropdownMenuItem className="hover:bg-[#2a2a2a] cursor-pointer">
                              <Archive className="w-4 h-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        )}

        {/* Placeholder for other tabs */}
        {activeTab === 'queue' && (
          <motion.div variants={itemVariants} className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-medium text-white mb-2">Content Queue</h3>
              <p className="text-sm text-[#666]">Coming soon</p>
            </div>
          </motion.div>
        )}

        {activeTab === 'knowledge' && (
          <motion.div variants={itemVariants} className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-medium text-white mb-2">Knowledge Base</h3>
              <p className="text-sm text-[#666]">Coming soon</p>
            </div>
          </motion.div>
        )}
      </motion.main>
    </div>
  )
} 
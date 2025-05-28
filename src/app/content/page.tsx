'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Download,
  Copy,
  ExternalLink,
  Calendar,
  Sparkles,
  CheckCircle2,
  X,
  MoreHorizontal,
  Edit3,
  Share2,
  Archive,
  Eye,
  Clock,
  FileText,
  Zap,
  Link,
  Hash,
  Type,
  AlignLeft,
  TrendingUp,
  EyeOff,
  Circle,
  ChevronLeft,
  ChevronRight,
  Filter,
  SortAsc,
  RefreshCw,
  Plus,
  Upload,
  Settings,
  GripVertical,
  Check,
  RotateCw,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const mockCompletedArticles = [
  {
    id: 1,
    title: "AI Prospecting Frameworks for B2B Sales Teams",
    metaDescription: "A comprehensive guide to modern prospecting strategies that leverage AI to identify, engage, and convert high-quality prospects in today's competitive B2B landscape.",
    suggestedSlug: "ai-prospecting-frameworks-b2b-sales-teams",
    primaryKeyword: "ai prospecting frameworks",
    scoreUplift: 23,
    createdBecause: "Fills missing brand mention in 12/100 direct prompts targeting sales automation queries.",
    gapAddressed: "Missing prompt coverage for 'AI prospecting best practices' cluster",
    strategicFit: "Boosts direct brand mentions in sales-focused AI conversations",
    contentPreview: "In today's competitive B2B landscape, sales teams need sophisticated approaches to identify and engage potential customers. This comprehensive guide explores proven AI-powered prospecting frameworks that can transform your sales process and increase conversion rates...",
    content: "# AI Prospecting Frameworks for B2B Sales Teams\n\nIn today's competitive B2B landscape, sales teams need sophisticated approaches to identify and engage potential customers...",
    createdAt: "2024-01-15",
    status: "Published",
    wordCount: 2400,
    readTime: "8 min",
    views: 1247,
    engagement: 94,
    category: "Sales Strategy",
    isNew: true,
    isViewed: false,
    lastUpdated: "2024-01-15",
    trending: true
  },
  {
    id: 2,
    title: "Enterprise AI Implementation Roadmap",
    metaDescription: "Strategic planning guide for large-scale AI adoption in enterprise environments, covering assessment, planning, implementation, and optimization phases.",
    suggestedSlug: "enterprise-ai-implementation-roadmap",
    primaryKeyword: "enterprise ai implementation",
    scoreUplift: 18,
    createdBecause: "Targets long-tail query cluster addressing enterprise adoption challenges.",
    gapAddressed: "Competitor edge in enterprise AI guidance content",
    strategicFit: "Positions brand as enterprise AI thought leader",
    contentPreview: "Implementing AI at enterprise scale requires careful planning and strategic execution. This roadmap provides a structured approach to AI adoption that minimizes risk while maximizing business value and organizational readiness...",
    content: "# Enterprise AI Implementation Roadmap\n\nImplementing AI at enterprise scale requires careful planning and strategic execution...",
    createdAt: "2024-01-14",
    status: "Published",
    wordCount: 3200,
    readTime: "12 min",
    views: 892,
    engagement: 87,
    category: "Enterprise",
    isNew: true,
    isViewed: false,
    lastUpdated: "2024-01-14",
    trending: false
  },
  {
    id: 3,
    title: "Cold Email Personalization at Scale",
    metaDescription: "Learn how to balance automation with authentic outreach through advanced personalization techniques that increase response rates and build meaningful connections.",
    suggestedSlug: "cold-email-personalization-at-scale",
    primaryKeyword: "cold email personalization",
    scoreUplift: 31,
    createdBecause: "High-converting topic with strong search intent and low competition.",
    gapAddressed: "Personalization gap in automated outreach content",
    strategicFit: "Showcases product capabilities through educational content",
    contentPreview: "Personalization is the key to successful cold email campaigns, but scaling authentic outreach remains a challenge. This guide reveals advanced techniques for personalizing emails at scale while maintaining genuine human connection...",
    content: "# Cold Email Personalization at Scale\n\nPersonalization is the key to successful cold email campaigns...",
    createdAt: "2024-01-13",
    status: "Published",
    wordCount: 1800,
    readTime: "6 min",
    views: 2156,
    engagement: 96,
    category: "Email Marketing",
    isNew: false,
    isViewed: true,
    lastUpdated: "2024-01-16",
    trending: true
  },
  {
    id: 4,
    title: "B2B Lead Scoring with Machine Learning",
    metaDescription: "Advanced techniques for qualifying prospects using machine learning algorithms to improve sales efficiency and focus on high-value opportunities.",
    suggestedSlug: "b2b-lead-scoring-machine-learning",
    primaryKeyword: "b2b lead scoring",
    scoreUplift: 15,
    createdBecause: "Addresses technical implementation questions from enterprise prospects.",
    gapAddressed: "Technical depth missing in competitor content",
    strategicFit: "Demonstrates technical expertise and product capabilities",
    contentPreview: "Machine learning transforms how we identify and prioritize prospects by analyzing behavioral patterns, engagement history, and predictive indicators to focus sales efforts on the most promising opportunities...",
    content: "# B2B Lead Scoring with Machine Learning\n\nMachine learning transforms how we identify and prioritize prospects...",
    createdAt: "2024-01-12",
    status: "Published",
    wordCount: 2800,
    readTime: "10 min",
    views: 743,
    engagement: 89,
    category: "Technology",
    isNew: false,
    isViewed: true,
    lastUpdated: "2024-01-12",
    trending: false
  },
  {
    id: 5,
    title: "Sales Automation ROI Calculator",
    metaDescription: "Comprehensive framework for measuring the impact of automated outreach with concrete metrics and calculation methods for sales automation investments.",
    suggestedSlug: "sales-automation-roi-calculator",
    primaryKeyword: "sales automation roi",
    scoreUplift: 27,
    createdBecause: "High-intent commercial queries from decision makers evaluating tools.",
    gapAddressed: "ROI calculation framework missing in market",
    strategicFit: "Supports sales conversations with concrete value metrics",
    contentPreview: "Calculating return on investment for sales automation requires a structured approach to measuring efficiency gains, cost savings, and revenue impact. This calculator provides the framework you need...",
    content: "# Sales Automation ROI Calculator\n\nCalculating return on investment for sales automation requires...",
    createdAt: "2024-01-11",
    status: "Published",
    wordCount: 2100,
    readTime: "7 min",
    views: 1534,
    engagement: 92,
    category: "Business",
    isNew: false,
    isViewed: true,
    lastUpdated: "2024-01-11",
    trending: false
  },
  {
    id: 6,
    title: "Account-Based Marketing Strategies",
    metaDescription: "Targeted marketing approaches for high-value accounts using personalized campaigns and multi-channel engagement to drive enterprise sales.",
    suggestedSlug: "account-based-marketing-strategies",
    primaryKeyword: "account based marketing",
    scoreUplift: 22,
    createdBecause: "Addresses enterprise marketing team needs for ABM guidance.",
    gapAddressed: "Comprehensive ABM strategy content gap",
    strategicFit: "Positions brand in enterprise marketing conversations",
    contentPreview: "Account-based marketing transforms how enterprises approach high-value prospects by creating personalized experiences that resonate with specific accounts and decision-makers...",
    content: "# Account-Based Marketing Strategies\n\nAccount-based marketing transforms how enterprises approach high-value prospects...",
    createdAt: "2024-01-10",
    status: "Published",
    wordCount: 2600,
    readTime: "9 min",
    views: 1089,
    engagement: 91,
    category: "Marketing",
    isNew: false,
    isViewed: true,
    lastUpdated: "2024-01-16",
    trending: false
  },
  {
    id: 7,
    title: "Customer Success Automation Playbook",
    metaDescription: "Streamline customer success operations with automated workflows, proactive engagement strategies, and data-driven retention techniques.",
    suggestedSlug: "customer-success-automation-playbook",
    primaryKeyword: "customer success automation",
    scoreUplift: 19,
    createdBecause: "Growing demand for CS automation content from SaaS companies.",
    gapAddressed: "Lack of comprehensive CS automation guides",
    strategicFit: "Expands into customer success market segment",
    contentPreview: "Customer success automation enables teams to scale personalized experiences while maintaining high-touch relationships. This playbook covers proven strategies for automating key touchpoints...",
    content: "# Customer Success Automation Playbook\n\nCustomer success automation enables teams to scale personalized experiences...",
    createdAt: "2024-01-09",
    status: "Published",
    wordCount: 2900,
    readTime: "11 min",
    views: 756,
    engagement: 88,
    category: "Customer Success",
    isNew: false,
    isViewed: true,
    lastUpdated: "2024-01-09",
    trending: false
  },
  {
    id: 8,
    title: "Revenue Operations Framework",
    metaDescription: "Build a unified revenue operations strategy that aligns sales, marketing, and customer success teams for predictable growth.",
    suggestedSlug: "revenue-operations-framework",
    primaryKeyword: "revenue operations framework",
    scoreUplift: 25,
    createdBecause: "RevOps is a high-growth keyword with strong commercial intent.",
    gapAddressed: "Missing comprehensive RevOps implementation guide",
    strategicFit: "Positions brand as thought leader in revenue operations",
    contentPreview: "Revenue operations creates alignment across go-to-market teams by establishing shared processes, metrics, and technology. This framework provides a step-by-step approach to building RevOps...",
    content: "# Revenue Operations Framework\n\nRevenue operations creates alignment across go-to-market teams...",
    createdAt: "2024-01-08",
    status: "Published",
    wordCount: 3100,
    readTime: "13 min",
    views: 1342,
    engagement: 93,
    category: "Revenue Operations",
    isNew: false,
    isViewed: true,
    lastUpdated: "2024-01-17",
    trending: true
  }
]

interface QueueSuggestion {
  id: number
  title: string
  keyword: string
  wordCount: number
  priority: string
  reason: string
  status: 'pending' | 'accepted'
  order?: number
  description: string
  keywords: string[]
}

const mockQueueSuggestions: QueueSuggestion[] = [
  {
    id: 1,
    title: "The Complete Guide to AI-Powered Sales Outreach",
    keyword: "ai sales outreach",
    wordCount: 2500,
    priority: "High Priority",
    reason: "Trending topic with 45% increase in search volume. Competitors lack comprehensive coverage.",
    status: "accepted",
    order: 1,
    description: "A comprehensive guide covering AI tools for prospecting, automated email sequences, personalization at scale, and measuring ROI. Includes case studies from successful B2B companies and step-by-step implementation frameworks.",
    keywords: ["ai sales tools", "automated prospecting", "sales automation", "email personalization", "b2b outreach", "sales roi"]
  },
  {
    id: 2,
    title: "Building Your First Revenue Operations Dashboard",
    keyword: "revops dashboard",
    wordCount: 1800,
    priority: "Medium Priority",
    reason: "Knowledge gap identified: No existing content on dashboard implementation.",
    status: "accepted",
    order: 2,
    description: "Step-by-step tutorial for creating a RevOps dashboard that tracks key metrics across sales, marketing, and customer success. Covers tool selection, data integration, and actionable insights.",
    keywords: ["revenue operations", "sales dashboard", "marketing metrics", "data visualization", "kpi tracking", "business intelligence"]
  },
  {
    id: 3,
    title: "Email Deliverability Best Practices for 2024",
    keyword: "email deliverability",
    wordCount: 2200,
    priority: "High Priority",
    reason: "Core topic for audience. Recent algorithm changes require updated guidance.",
    status: "pending",
    description: "Updated guide covering the latest email deliverability standards, authentication protocols (SPF, DKIM, DMARC), reputation management, and avoiding spam filters. Includes 2024 updates from major email providers.",
    keywords: ["email deliverability", "spam prevention", "email authentication", "sender reputation", "inbox placement", "email marketing"]
  },
  {
    id: 4,
    title: "Scaling Customer Success with Automation",
    keyword: "customer success automation",
    wordCount: 3000,
    priority: "Medium Priority",
    reason: "Expanding into CS market. Strategic content for new segment.",
    status: "pending",
    description: "Comprehensive playbook for automating customer success workflows including onboarding sequences, health score monitoring, churn prediction, and expansion opportunities. Features real-world automation examples.",
    keywords: ["customer success", "cs automation", "customer onboarding", "churn prevention", "customer health", "expansion revenue"]
  },
  {
    id: 5,
    title: "B2B Buyer Intent Signals: A Data-Driven Approach",
    keyword: "buyer intent signals",
    wordCount: 2400,
    priority: "High Priority",
    reason: "High commercial intent keyword. Direct product tie-in opportunity.",
    status: "accepted",
    order: 3,
    description: "Deep dive into identifying and acting on buyer intent signals using first-party and third-party data. Covers intent scoring models, timing optimization, and converting intent into pipeline.",
    keywords: ["buyer intent", "intent data", "sales intelligence", "lead scoring", "prospect research", "sales timing"]
  },
  {
    id: 6,
    title: "Sales Enablement Content Strategy",
    keyword: "sales enablement content",
    wordCount: 2000,
    priority: "Medium Priority",
    reason: "Supports product positioning in sales enablement category.",
    status: "pending",
    description: "Framework for creating and organizing sales enablement content that actually gets used. Includes content audit methodology, buyer journey mapping, and measuring content effectiveness.",
    keywords: ["sales enablement", "sales content", "buyer journey", "sales materials", "content strategy", "sales productivity"]
  }
]

interface KnowledgeItem {
  id: number
  content: string
  tag: string
  createdAt: string
  wordCount: number
}

const mockKnowledgeItems: KnowledgeItem[] = [
  {
    id: 1,
    content: "Split is an AI-powered content generation platform that helps B2B companies create high-quality, SEO-optimized articles at scale. Our platform combines advanced AI with strategic content planning to drive organic growth and establish thought leadership.",
    tag: "company-overview",
    createdAt: "2024-01-15",
    wordCount: 42
  },
  {
    id: 2,
    content: "Target audience: B2B SaaS companies with 50-500 employees, marketing teams struggling with content consistency, sales teams needing better enablement materials, and growth-stage startups looking to establish thought leadership.",
    tag: "target-audience",
    createdAt: "2024-01-14",
    wordCount: 38
  },
  {
    id: 3,
    content: "Key pain points: Manual content creation is time-consuming, maintaining consistent brand voice across content, scaling content production without sacrificing quality, measuring content ROI and performance.",
    tag: "pain-points",
    createdAt: "2024-01-13",
    wordCount: 32
  },
  {
    id: 4,
    content: "Competitive positioning: Unlike generic AI writing tools, Split focuses specifically on B2B content strategy. We provide end-to-end content planning, not just writing assistance. Our AI understands business context and industry nuances.",
    tag: "positioning",
    createdAt: "2024-01-12",
    wordCount: 39
  },
  {
    id: 5,
    content: "Common sales objections: 'AI content lacks authenticity' - Response: Our AI is trained on your specific brand voice and industry expertise. 'Content quality concerns' - Response: Every piece goes through quality checks and can be customized.",
    tag: "sales-objections",
    createdAt: "2024-01-11",
    wordCount: 45
  }
]

const availableTags = [
  "company-overview",
  "target-audience", 
  "pain-points",
  "positioning",
  "sales-objections",
  "product-features",
  "use-cases",
  "keywords",
  "competitor-notes",
  "brand-voice",
  "other"
]

const tabs = [
  { id: 'completed', label: 'Completed Articles' },
  { id: 'queue', label: 'Content Queue' },
  { id: 'knowledge', label: 'Knowledge Base' }
]

export default function ContentPage() {
  const { loading } = useAuth()
  const shouldReduceMotion = useReducedMotion()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('completed')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedArticles, setSelectedArticles] = useState<number[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const articlesPerPage = 9
  const [autoAccept, setAutoAccept] = useState(false)
  const [selectedSuggestions, setSelectedSuggestions] = useState<number[]>([])
  const [queueSuggestions, setQueueSuggestions] = useState(mockQueueSuggestions)
  const [queueFilter, setQueueFilter] = useState<'all' | 'accepted' | 'pending'>('all')
  const [expandedSuggestion, setExpandedSuggestion] = useState<number | null>(null)
  const [knowledgeItems, setKnowledgeItems] = useState(mockKnowledgeItems)
  const [newKnowledgeContent, setNewKnowledgeContent] = useState('')
  const [editingItem, setEditingItem] = useState<number | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [editingTag, setEditingTag] = useState('')
  const [knowledgeFilter, setKnowledgeFilter] = useState<string>('all')
  const [knowledgeSearch, setKnowledgeSearch] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const containerVariants = shouldReduceMotion ? {
    hidden: { opacity: 1 },
    visible: { opacity: 1 }
  } : {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = shouldReduceMotion ? {
    hidden: { opacity: 1, y: 0 },
    visible: { opacity: 1, y: 0 }
  } : {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  }

  const cardVariants = shouldReduceMotion ? {
    hidden: { opacity: 1, y: 0 },
    visible: { opacity: 1, y: 0 }
  } : {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  }

  // Filter articles
  const filteredArticles = mockCompletedArticles.filter(article => 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.primaryKeyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.metaDescription.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Pagination logic
  const totalPages = Math.ceil(filteredArticles.length / articlesPerPage)
  const startIndex = (currentPage - 1) * articlesPerPage
  const endIndex = startIndex + articlesPerPage
  const currentArticles = filteredArticles.slice(startIndex, endIndex)

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const handleExportArticle = (article: any, format: string) => {
    console.log(`Exporting article "${article.title}" as ${format}`)
    // TODO: Implement export functionality
  }

  const handleViewArticle = (articleId: number) => {
    router.push(`/content/article/${articleId}`)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSuggestionSelect = (id: number) => {
    if (selectedSuggestions.includes(id)) {
      setSelectedSuggestions(selectedSuggestions.filter(i => i !== id))
      } else {
      setSelectedSuggestions([...selectedSuggestions, id])
    }
  }

  const handleBatchAccept = () => {
    // Implement batch accept logic
  }

  const handleBatchDismiss = () => {
    // Implement batch dismiss logic
  }

  const handleAcceptSuggestion = (id: number) => {
    setQueueSuggestions(prev => {
      const maxOrder = Math.max(...prev.filter(s => s.status === 'accepted').map(s => s.order || 0), 0)
      return prev.map(s => 
        s.id === id 
          ? { ...s, status: 'accepted', order: maxOrder + 1 } 
          : s
      )
    })
    setSelectedSuggestions(prev => prev.filter(sid => sid !== id))
  }

  const handleRerollSuggestion = (id: number) => {
    // Implement reroll suggestion logic
    console.log('Rerolling suggestion:', id)
  }

  const handleDismissSuggestion = (id: number) => {
    setQueueSuggestions(prev => prev.filter(s => s.id !== id))
    setSelectedSuggestions(prev => prev.filter(sid => sid !== id))
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setQueueSuggestions((items) => {
        const acceptedItems = items.filter(s => s.status === 'accepted')
        const oldIndex = acceptedItems.findIndex(item => item.id === active.id)
        const newIndex = acceptedItems.findIndex(item => item.id === over.id)
        
        const reorderedAccepted = arrayMove(acceptedItems, oldIndex, newIndex)
        
        // Update order for reordered items
        const updatedItems = items.map(item => {
          if (item.status === 'accepted') {
            const index = reorderedAccepted.findIndex(a => a.id === item.id)
            return { ...item, order: index + 1 }
          }
          return item
        })
        
        return updatedItems
      })
    }
  }

  const handleRerollAll = () => {
    console.log('Rerolling all suggestions')
    // Implement reroll all logic
  }

  const handleAddKnowledgeItem = () => {
    if (!newKnowledgeContent.trim()) return
    
    const autoTag = autoDetectTag(newKnowledgeContent)
    const newItem: KnowledgeItem = {
      id: Math.max(...knowledgeItems.map(item => item.id), 0) + 1,
      content: newKnowledgeContent.trim(),
      tag: autoTag,
      createdAt: new Date().toISOString().split('T')[0],
      wordCount: newKnowledgeContent.trim().split(' ').length
    }
    
    setKnowledgeItems([newItem, ...knowledgeItems])
    setNewKnowledgeContent('')
  }

  const autoDetectTag = (content: string): string => {
    const lowerContent = content.toLowerCase()
    
    if (lowerContent.includes('target audience') || lowerContent.includes('customer') || lowerContent.includes('persona')) {
      return 'target-audience'
    }
    if (lowerContent.includes('pain point') || lowerContent.includes('challenge') || lowerContent.includes('problem')) {
      return 'pain-points'
    }
    if (lowerContent.includes('competitor') || lowerContent.includes('vs ') || lowerContent.includes('alternative')) {
      return 'competitor-notes'
    }
    if (lowerContent.includes('objection') || lowerContent.includes('concern') || lowerContent.includes('response')) {
      return 'sales-objections'
    }
    if (lowerContent.includes('feature') || lowerContent.includes('capability') || lowerContent.includes('functionality')) {
      return 'product-features'
    }
    if (lowerContent.includes('company') || lowerContent.includes('about us') || lowerContent.includes('mission')) {
      return 'company-overview'
    }
    
    return 'other'
  }

  const handleDeleteKnowledgeItem = (id: number) => {
    setKnowledgeItems(items => items.filter(item => item.id !== id))
  }

  const handleStartEdit = (item: KnowledgeItem) => {
    setEditingItem(item.id)
    setEditingContent(item.content)
    setEditingTag(item.tag)
  }

  const handleSaveEdit = () => {
    if (!editingItem) return
    
    setKnowledgeItems(items =>
      items.map(item =>
        item.id === editingItem
          ? {
              ...item,
              content: editingContent,
              tag: editingTag,
              wordCount: editingContent.trim().split(' ').length
            }
          : item
      )
    )
    
    setEditingItem(null)
    setEditingContent('')
    setEditingTag('')
  }

  const handleCancelEdit = () => {
    setEditingItem(null)
    setEditingContent('')
    setEditingTag('')
  }

  const handleCopyKnowledgeItem = (content: string) => {
    navigator.clipboard.writeText(content)
    // Could add a toast notification here
  }

  // SortableItem component for drag and drop
  function SortableItem({ suggestion }: { suggestion: QueueSuggestion }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: suggestion.id })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }

    const isExpanded = expandedSuggestion === suggestion.id

    return (
      <div ref={setNodeRef} style={style} className="group flex items-center gap-2">
        {/* Drag Handle */}
        <div 
          {...attributes} 
          {...listeners} 
          className="flex-shrink-0 cursor-move"
        >
          <GripVertical className="w-4 h-4 text-[#333] hover:text-[#666] transition-colors duration-200" />
        </div>

        {/* Card */}
        <div className="flex-1 bg-[#0a0a0a] rounded-md border border-[#1a1a1a] transition-all duration-200 hover:border-[#2a2a2a]">
          {/* Main Content */}
          <div 
            className="px-4 py-3 cursor-pointer"
            onClick={() => setExpandedSuggestion(isExpanded ? null : suggestion.id)}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 flex items-center gap-3">
                <h3 className="text-sm font-medium text-white">
                  {suggestion.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-[#666]">
                  <span>{suggestion.wordCount.toLocaleString()} words</span>
                  <span className="text-[#333]">•</span>
                  <span>{Math.ceil(suggestion.wordCount / 200)} min read</span>
                </div>
                <ChevronDown 
                  className={`w-4 h-4 text-[#666] transition-transform duration-200 ease-out ${
                    isExpanded ? 'rotate-180' : ''
                  }`} 
                />
              </div>

              {/* Remove Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDismissSuggestion(suggestion.id)
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 hover:bg-[#1a1a1a] rounded"
              >
                <X className="w-4 h-4 text-[#666] hover:text-white transition-colors duration-200" />
              </button>
            </div>
          </div>

          {/* Expanded Content */}
          <div 
            className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className={`border-t border-[#1a1a1a] px-4 py-3 transition-all duration-300 ease-out ${
              isExpanded ? 'translate-y-0' : '-translate-y-2'
            }`}>
              <p className="text-sm text-[#999] leading-relaxed mb-3">
                {suggestion.description}
              </p>
              
              <div className="flex flex-wrap gap-1">
                {suggestion.keywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className={`px-2 py-1 bg-[#1a1a1a] text-xs text-[#666] rounded transition-all duration-200 hover:bg-[#2a2a2a] ${
                      isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                    }`}
                    style={{ transitionDelay: `${idx * 30}ms` }}
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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
      className="bg-[#0c0c0c] flex flex-col"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
      {/* Streamlined Header */}
      <motion.div variants={itemVariants} className="px-6 pt-6 pb-4">
        {/* Tab Navigation - Visibility Page Style */}
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                  px-4 py-2 rounded-md text-sm font-medium tracking-tight transition-colors border
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
          </div>

        {/* Minimalist Utility Bar - Only show for completed tab */}
          {activeTab === 'completed' && (
          <div className="flex items-center justify-between gap-4">
            {/* Left: Simple article count */}
            <p className="text-sm text-[#666]">
              {filteredArticles.length} TOTAL ARTICLES
            </p>
            
            {/* Right: Filter, Sort, and Search */}
              <div className="flex items-center gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#666] hover:text-white h-8 px-2 text-sm"
                  >
                    <Filter className="w-4 h-4 mr-1.5" />
                    Filter
                      </Button>
                    </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white" align="end">
                  <DropdownMenuItem className="hover:bg-[#2a2a2a] cursor-pointer">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Published Only
                      </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-[#2a2a2a] cursor-pointer">
                    <Clock className="w-4 h-4 mr-2" />
                    Recent First
                      </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-[#2a2a2a] cursor-pointer">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    High Engagement
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                  <DropdownMenuItem className="hover:bg-[#2a2a2a] cursor-pointer">
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#666] hover:text-white h-8 px-2 text-sm"
                  >
                    <SortAsc className="w-4 h-4 mr-1.5" />
                    Sort
                        </Button>
                      </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white" align="end">
                  <DropdownMenuItem className="hover:bg-[#2a2a2a] cursor-pointer">
                    Date Created
                        </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-[#2a2a2a] cursor-pointer">
                    Last Updated
                        </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-[#2a2a2a] cursor-pointer">
                    Engagement Rate
                        </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-[#2a2a2a] cursor-pointer">
                    Word Count
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#666]" />
                  <Input
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#0a0a0a] border-[#1a1a1a] hover:border-[#2a2a2a] focus:border-[#3a3a3a] text-white h-8 pl-9 pr-3 w-56 text-sm transition-all duration-200 rounded-md"
                  />
                </div>
              </div>
            </div>
          )}
        </motion.div>

      {/* Content */}
        {activeTab === 'completed' && (
        <motion.div variants={itemVariants} className="px-6 pb-6">
          <div className="grid grid-cols-3 gap-6 w-full">
            {currentArticles.map((article, index) => (
              <motion.div
                      key={article.id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.05 }}
                className={`group relative bg-[#0a0a0a] rounded-lg p-5 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 cursor-pointer flex flex-col ${
                  article.isNew 
                    ? 'border border-[#3a3a3a] hover:border-[#4a4a4a]' 
                    : 'border border-[#1a1a1a] hover:border-[#2a2a2a]'
                }`}
                onClick={() => handleViewArticle(article.id)}
              >
                {/* Export Dropdown - Always Visible */}
                <div className="absolute top-4 right-4 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                        className="h-7 w-7 p-0 text-[#666] hover:text-white hover:bg-[#1a1a1a] rounded-md opacity-60 hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white" align="end">
                            <DropdownMenuItem 
                              className="hover:bg-[#2a2a2a] cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleExportArticle(article, 'plain-text')
                        }}
                      >
                        <Type className="w-4 h-4 mr-2" />
                        Copy as Plain Text
                        </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="hover:bg-[#2a2a2a] cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleExportArticle(article, 'markdown')
                        }}
                      >
                        <Hash className="w-4 h-4 mr-2" />
                        Copy as Markdown
                        </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="hover:bg-[#2a2a2a] cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleExportArticle(article, 'json')
                        }}
                      >
                          <FileText className="w-4 h-4 mr-2" />
                        Copy as JSON
                        </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="hover:bg-[#2a2a2a] cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleExportArticle(article, 'html')
                        }}
                      >
                              <Download className="w-4 h-4 mr-2" />
                        Copy as HTML
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Card Content */}
                <div className="space-y-4 flex-1 flex flex-col">
                  {/* Header */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-[#333] text-[#888] bg-transparent text-xs px-2 py-0.5">
                        {article.category}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-[#666]">
                        <Clock className="w-3 h-3" />
                        <span>{article.readTime}</span>
                  </div>
                </div>
                    
                    <h3 className={`text-base font-semibold leading-tight group-hover:text-white/90 transition-colors line-clamp-2 pr-8 ${
                      article.isNew ? 'text-white' : 'text-[#999]'
                    }`}>
                      {article.title}
                    </h3>
              </div>

                  {/* Meta Description */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 text-xs text-[#666]">
                      <AlignLeft className="w-3 h-3" />
                      <span>Meta Description</span>
                      </div>
                    <p className="text-sm text-[#888] leading-relaxed line-clamp-3">
                      {article.metaDescription}
                    </p>
                      </div>

                  {/* Suggested Slug */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[#666]">
                      <Link className="w-3 h-3" />
                      <span>Suggested URL</span>
                      </div>
                    <p className="text-xs text-[#666] font-mono bg-[#0c0c0c] px-2 py-1 rounded border border-[#1a1a1a] truncate">
                      /{article.suggestedSlug}
                    </p>
                      </div>

                  {/* Content Preview */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[#666]">
                      <FileText className="w-3 h-3" />
                      <span>Content Preview</span>
                      </div>
                    <p className="text-sm text-[#777] leading-relaxed line-clamp-2">
                      {article.contentPreview}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#1a1a1a] mt-auto">
                    <div className="flex items-center gap-3 text-xs text-[#666]">
                            <span>{article.wordCount} words</span>
                            <span>•</span>
                      <span>{new Date(article.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}</span>
                          </div>
                    {article.isNew && (
                      <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 bg-emerald-500/10 text-xs px-2 py-0.5">
                        New
                      </Badge>
                        )}
                      </div>
                </div>
              </motion.div>
            ))}
            </div>

          {currentArticles.length === 0 && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <FileText className="w-12 h-12 text-[#333] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No articles found</h3>
                <p className="text-sm text-[#666]">
                  {searchQuery ? 'Try adjusting your search terms' : 'No completed articles yet'}
                </p>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && currentArticles.length > 0 && (
            <div className="flex items-center justify-between mt-8 pb-4">
              <p className="text-sm text-[#666]">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredArticles.length)} of {filteredArticles.length} articles
              </p>
                      <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="border-[#333] hover:border-[#444] text-[#666] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className={
                      currentPage === page
                        ? "bg-white text-black hover:bg-[#f5f5f5] h-8 w-8 p-0 text-sm"
                        : "border-[#333] hover:border-[#444] text-[#666] hover:text-white h-8 w-8 p-0 text-sm"
                    }
                  >
                    {page}
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="border-[#333] hover:border-[#444] text-[#666] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          </motion.div>
        )}

        {/* Content Queue Tab */}
        {activeTab === 'queue' && (
          <motion.div variants={itemVariants} className="flex flex-col h-full">
            {/* Queue Header */}
            <div className="px-6 pb-4">
              <div className="flex items-center justify-between">
                {/* Left: Count and Filter */}
                <div className="flex items-center gap-4">
                  <p className="text-sm text-[#666]">
                    {queueSuggestions.length} SUGGESTIONS
                  </p>
                  
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                        variant="outline"
                        className="w-fit border border-[#333] bg-transparent hover:bg-[#1a1a1a] px-2 py-1 text-sm text-[#999] hover:text-white transition-all duration-200"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">
                            {queueFilter === 'all' ? 'All' : 
                             queueFilter === 'accepted' ? 'Accepted' : 
                             'Pending'}
                          </span>
                          <ChevronDown className="h-3 w-3 text-[#666]" />
                      </div>
                            </Button>
                          </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      className="bg-[#1a1a1a] border border-[#333] text-white w-fit"
                      align="start"
                      alignOffset={-1}
                      sideOffset={4}
                    >
                            <DropdownMenuItem 
                        className="hover:bg-[#222] cursor-pointer text-sm px-2 py-1.5"
                        onClick={() => setQueueFilter('all')}
                      >
                        All
                            </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="hover:bg-[#222] cursor-pointer text-sm px-2 py-1.5"
                        onClick={() => setQueueFilter('accepted')}
                      >
                        Accepted
                            </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="hover:bg-[#222] cursor-pointer text-sm px-2 py-1.5"
                        onClick={() => setQueueFilter('pending')}
                      >
                        Pending
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                {/* Right: Reroll and Auto-Accept */}
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRerollAll}
                    className="h-8 w-8 p-0 text-[#666] hover:text-white hover:bg-[#1a1a1a] transition-all duration-200"
                  >
                    <RotateCw className="w-4 h-4" />
                  </Button>

                      <div className="flex items-center gap-2">
                    <span className="text-sm text-[#666]">Auto-Accept</span>
                    <button
                      onClick={() => setAutoAccept(!autoAccept)}
                      className={`relative w-12 h-7 rounded-sm border transition-all duration-200 ${
                        autoAccept 
                          ? 'bg-white border-white' 
                          : 'bg-transparent border-[#333] hover:border-[#444]'
                      }`}
                    >
                      <div className={`absolute top-1/2 left-1 -translate-y-1/2 w-5 h-5 rounded-sm transition-all duration-200 ${
                        autoAccept 
                          ? 'bg-black translate-x-5' 
                          : 'bg-[#666] translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Queue Content */}
            <div className="flex-1 px-6 pb-6 overflow-y-auto">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <div className="space-y-2">
                  {/* Accepted Items - Draggable */}
                  {queueFilter !== 'pending' && queueSuggestions.filter(s => s.status === 'accepted').length > 0 && (
                    <SortableContext
                      items={queueSuggestions.filter(s => s.status === 'accepted').map(s => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {queueSuggestions
                        .filter(s => s.status === 'accepted')
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map((suggestion) => (
                          <SortableItem key={suggestion.id} suggestion={suggestion} />
                        ))}
                    </SortableContext>
                  )}

                  {/* Pending Items - Not Draggable */}
                  {queueFilter !== 'accepted' && queueSuggestions
                    .filter(s => s.status === 'pending')
                    .map((suggestion) => (
                      <div key={suggestion.id} className="group flex items-center gap-2">
                        {/* Spacer for alignment */}
                        <div className="w-4 h-4 flex-shrink-0" />

                        {/* Card */}
                        <div className="flex-1 bg-[#0a0a0a] rounded-md border border-[#1a1a1a] transition-all duration-200 hover:border-[#2a2a2a]">
                          {/* Main Content */}
                          <div 
                            className="px-4 py-3 cursor-pointer"
                            onClick={() => setExpandedSuggestion(
                              expandedSuggestion === suggestion.id ? null : suggestion.id
                            )}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 flex items-center gap-3">
                                <h3 className="text-sm font-medium text-white">
                                  {suggestion.title}
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-[#666]">
                                  <span>{suggestion.wordCount.toLocaleString()} words</span>
                                  <span className="text-[#333]">•</span>
                                  <span>{Math.ceil(suggestion.wordCount / 200)} min read</span>
                      </div>
                                <ChevronDown 
                                  className={`w-4 h-4 text-[#666] transition-transform duration-200 ease-out ${
                                    expandedSuggestion === suggestion.id ? 'rotate-180' : ''
                                  }`} 
                                />
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDismissSuggestion(suggestion.id)
                                  }}
                                  className="p-1.5 hover:bg-red-500/10 rounded transition-all duration-200"
                                >
                                  <X className="w-5 h-5 text-red-500 hover:text-red-400 transition-colors duration-200" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleAcceptSuggestion(suggestion.id)
                                  }}
                                  className="p-1.5 hover:bg-green-500/10 rounded transition-all duration-200"
                                >
                                  <Check className="w-5 h-5 text-green-500 hover:text-green-400 transition-colors duration-200" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Expanded Content */}
                          <div 
                            className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                              expandedSuggestion === suggestion.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                            }`}
                          >
                            <div className={`border-t border-[#1a1a1a] px-4 py-3 transition-all duration-300 ease-out ${
                              expandedSuggestion === suggestion.id ? 'translate-y-0' : '-translate-y-2'
                            }`}>
                              <p className="text-sm text-[#999] leading-relaxed mb-3">
                                {suggestion.description}
                              </p>
                              
                              <div className="flex flex-wrap gap-1">
                                {suggestion.keywords.map((keyword, idx) => (
                                  <span
                                    key={idx}
                                    className={`px-2 py-1 bg-[#1a1a1a] text-xs text-[#666] rounded transition-all duration-200 hover:bg-[#2a2a2a] ${
                                      expandedSuggestion === suggestion.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                                    }`}
                                    style={{ transitionDelay: `${idx * 30}ms` }}
                                  >
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </DndContext>

              {/* Empty State */}
              {queueSuggestions.filter(s => queueFilter === 'all' || s.status === queueFilter).length === 0 && (
                <div className="flex items-center justify-center h-64">
            <div className="text-center">
                    <Sparkles className="w-12 h-12 text-[#333] mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                      {queueFilter === 'accepted' ? 'No accepted suggestions' : 
                       queueFilter === 'pending' ? 'No pending suggestions' : 
                       'No content suggestions'}
                    </h3>
                    <p className="text-sm text-[#666]">
                      {queueFilter === 'accepted' ? 'Accept suggestions to see them here' : 
                       'Check back soon for AI-generated content ideas'}
                    </p>
                  </div>
                </div>
                        )}
                      </div>
          </motion.div>
        )}

        {activeTab === 'knowledge' && (
          <motion.div variants={itemVariants} className="flex flex-col h-full">
            {/* Knowledge Base Header */}
            <div className="px-6 pb-4">
              <div className="flex items-center justify-between">
                {/* Left: Count only */}
                <div className="flex items-center gap-4">
                  <p className="text-sm text-[#666]">
                    {knowledgeItems.filter(item => 
                      (knowledgeFilter === 'all' || item.tag === knowledgeFilter) &&
                      (knowledgeSearch === '' || 
                       item.content.toLowerCase().includes(knowledgeSearch.toLowerCase()) ||
                       item.tag.toLowerCase().includes(knowledgeSearch.toLowerCase()))
                    ).length} KNOWLEDGE ITEMS
                  </p>
                </div>

                {/* Right: Search and Add */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#666]" />
                    <Input
                      placeholder="Search knowledge..."
                      value={knowledgeSearch}
                      onChange={(e) => setKnowledgeSearch(e.target.value)}
                      className="bg-[#0a0a0a] border-[#1a1a1a] hover:border-[#2a2a2a] focus:border-[#3a3a3a] text-white h-8 pl-9 pr-3 w-48 text-sm transition-all duration-200 rounded-md"
                    />
                  </div>
                  
                  <Button
                    onClick={handleAddKnowledgeItem}
                    disabled={!newKnowledgeContent.trim()}
                    className="h-8 px-3 text-sm bg-white text-black hover:bg-[#f5f5f5] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add Knowledge
                  </Button>
                </div>
              </div>
            </div>

            {/* Large Knowledge Input Area */}
            <div className="px-6 pb-6">
              <motion.div 
                className="relative"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <textarea
                  placeholder="Paste anything your content engine should know. Product blurbs, positioning, FAQs, target audiences, pain points, competitive notes — it all helps the AI understand your business better."
                  value={newKnowledgeContent}
                  onChange={(e) => setNewKnowledgeContent(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#1a1a1a] hover:border-[#2a2a2a] focus:border-[#3a3a3a] text-white p-4 rounded-md text-sm transition-all duration-200 resize-none leading-relaxed focus:scale-[1.01] focus:shadow-lg focus:shadow-black/20"
                  rows={6}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleAddKnowledgeItem()
                    }
                  }}
                />
                {newKnowledgeContent && (
                  <motion.div 
                    className="absolute bottom-3 right-3 text-xs text-[#666] bg-[#0a0a0a] px-2 py-1 rounded"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    {newKnowledgeContent.trim().split(' ').length} words • ⌘+Enter to add
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Knowledge Table */}
            <div className="flex-1 px-6 pb-6 overflow-hidden">
              {knowledgeItems.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <FileText className="w-12 h-12 text-[#333] mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No knowledge items yet</h3>
                    <p className="text-sm text-[#666]">
                      Add your first piece of company knowledge above
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg overflow-hidden">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-0 border-b border-[#1a1a1a] bg-[#0c0c0c]">
                    <div className="col-span-6 px-3 py-2 text-xs font-medium text-[#666] uppercase tracking-wide border-r border-[#1a1a1a] flex items-center gap-2">
                      Content
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-0.5 hover:bg-[#1a1a1a] rounded transition-all duration-200 hover:scale-110 active:scale-95">
                            <Search className="w-3 h-3 text-[#555] hover:text-[#888] transition-colors duration-200" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#1a1a1a] border-[#333] text-white w-48" align="start">
                          <div className="p-2">
                            <Input
                              placeholder="Search content..."
                              value={knowledgeSearch}
                              onChange={(e) => setKnowledgeSearch(e.target.value)}
                              className="bg-[#0a0a0a] border-[#333] text-white h-7 text-xs transition-all duration-200 focus:border-[#555]"
                            />
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="col-span-3 px-3 py-2 text-xs font-medium text-[#666] uppercase tracking-wide border-r border-[#1a1a1a] flex items-center gap-2">
                      Category
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-0.5 hover:bg-[#1a1a1a] rounded transition-all duration-200 hover:scale-110 active:scale-95">
                            <Filter className="w-3 h-3 text-[#555] hover:text-[#888] transition-colors duration-200" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#1a1a1a] border-[#333] text-white" align="start">
                          <DropdownMenuItem 
                            className="hover:bg-[#222] cursor-pointer text-sm px-2 py-1.5 transition-colors duration-150"
                            onClick={() => setKnowledgeFilter('all')}
                          >
                            All Categories
                          </DropdownMenuItem>
                          {availableTags.map((tag) => (
                            <DropdownMenuItem 
                              key={tag}
                              className="hover:bg-[#222] cursor-pointer text-sm px-2 py-1.5 transition-colors duration-150"
                              onClick={() => setKnowledgeFilter(tag)}
                            >
                              {tag.replace('-', ' ')}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="col-span-1 px-3 py-2 text-xs font-medium text-[#666] uppercase tracking-wide border-r border-[#1a1a1a]">
                      Words
                    </div>
                    <div className="col-span-1 px-3 py-2 text-xs font-medium text-[#666] uppercase tracking-wide border-r border-[#1a1a1a]">
                      Date
                    </div>
                    <div className="col-span-1 px-3 py-2 text-xs font-medium text-[#666] uppercase tracking-wide text-center">
                      Actions
                    </div>
                  </div>

                  {/* Table Body */}
                  <div className="overflow-y-auto max-h-[calc(100vh-400px)]">
                    {knowledgeItems
                      .filter(item => 
                        (knowledgeFilter === 'all' || item.tag === knowledgeFilter) &&
                        (knowledgeSearch === '' || 
                         item.content.toLowerCase().includes(knowledgeSearch.toLowerCase()) ||
                         item.tag.toLowerCase().includes(knowledgeSearch.toLowerCase()))
                      )
                      .map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.01 }}
                          className="group grid grid-cols-12 gap-0 border-b border-[#111] hover:bg-[#0c0c0c] transition-all duration-150"
                        >
                          {/* Content Cell */}
                          <div className="col-span-6 px-3 py-2 border-r border-[#111] flex items-center min-h-[40px]">
                            {editingItem === item.id ? (
                              <motion.div 
                                className="w-full"
                                initial={{ scale: 0.98, opacity: 0.8 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                              >
                                <textarea
                                  value={editingContent}
                                  onChange={(e) => setEditingContent(e.target.value)}
                                  className="w-full bg-[#0a0a0a] border border-[#333] text-white p-2 rounded text-sm resize-none leading-relaxed focus:border-[#555] transition-colors duration-200"
                                  rows={3}
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                      handleSaveEdit()
                                    }
                                    if (e.key === 'Escape') {
                                      handleCancelEdit()
                                    }
                                  }}
                                />
                              </motion.div>
                            ) : (
                              <div 
                                className="relative w-full cursor-pointer hover:bg-[#0c0c0c] rounded p-1 -m-1 transition-colors duration-200"
                                onDoubleClick={() => handleStartEdit(item)}
                                title="Double-click to edit"
                              >
                                <p className="text-sm text-white leading-relaxed line-clamp-2 overflow-hidden">
                                  {item.content}
                                </p>
                                {item.content.length > 120 && (
                                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0a0a0a] to-transparent pointer-events-none" />
                                )}
                              </div>
                            )}
                          </div>

                          {/* Category Cell */}
                          <div className="col-span-3 px-3 py-2 border-r border-[#111] flex items-center min-h-[40px]">
                            {editingItem === item.id ? (
                              <motion.div
                                initial={{ scale: 0.98, opacity: 0.8 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                              >
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className="h-8 px-3 text-sm border-[#333] bg-transparent hover:bg-[#1a1a1a] text-[#999] hover:text-white transition-colors duration-200"
                                    >
                                      {editingTag.replace('-', ' ')}
                                      <ChevronDown className="w-3 h-3 ml-2" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="bg-[#1a1a1a] border-[#333] text-white">
                                    {availableTags.map((tag) => (
                                      <DropdownMenuItem
                                        key={tag}
                                        onClick={() => setEditingTag(tag)}
                                        className="hover:bg-[#222] cursor-pointer text-sm transition-colors duration-150"
                                      >
                                        {tag.replace('-', ' ')}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </motion.div>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-xs border border-[#333] text-[#888] bg-[#0c0c0c] whitespace-nowrap">
                                {item.tag.replace('-', ' ')}
                              </span>
                            )}
                          </div>

                          {/* Word Count Cell */}
                          <div className="col-span-1 px-3 py-2 border-r border-[#111] flex items-center min-h-[40px]">
                            <span className="text-sm text-[#666]">
                              {editingItem === item.id ? editingContent.trim().split(' ').length : item.wordCount}
                            </span>
                          </div>

                          {/* Date Cell */}
                          <div className="col-span-1 px-3 py-2 border-r border-[#111] flex items-center min-h-[40px]">
                            <span className="text-sm text-[#666]">
                              {new Date(item.createdAt).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: '2-digit'
                              })}
                            </span>
                          </div>

                          {/* Actions Cell */}
                          <div className="col-span-1 px-3 py-2 flex items-center justify-center min-h-[40px]">
                            {editingItem === item.id ? (
                              <motion.div 
                                className="flex items-center gap-1"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                              >
                                <Button
                                  onClick={handleCancelEdit}
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-[#666] hover:text-white transition-colors duration-200"
                                  title="Cancel (Esc)"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                                <Button
                                  onClick={handleSaveEdit}
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-green-500 hover:text-green-400 transition-colors duration-200"
                                  title="Save (⌘+Enter)"
                                >
                                  <Check className="w-3 h-3" />
                                </Button>
                              </motion.div>
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="h-6 w-6 p-0 transition-all duration-200 hover:scale-110"
                                  >
                                    <MoreHorizontal className="w-4 h-4 text-[#666]" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-[#1a1a1a] border-[#333] text-white" align="end">
                                  <DropdownMenuItem 
                                    onClick={() => handleStartEdit(item)}
                                    className="hover:bg-[#222] cursor-pointer text-sm transition-colors duration-150"
                                  >
                                    <Edit3 className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleCopyKnowledgeItem(item.content)}
                                    className="hover:bg-[#222] cursor-pointer text-sm transition-colors duration-150"
                                  >
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copy
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-[#333]" />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteKnowledgeItem(item.id)}
                                    className="hover:bg-red-500/10 cursor-pointer text-red-400 text-sm transition-colors duration-150"
                                  >
                                    <X className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.main>
  )
} 
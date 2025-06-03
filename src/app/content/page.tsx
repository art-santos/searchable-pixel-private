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
import { useSubscription } from '@/hooks/useSubscription'
import { UsageDisplay } from '@/components/subscription/usage-display'
import { PlanType } from '@/lib/subscription/config'
import { toast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { useKnowledgeBase } from '@/hooks/useKnowledgeBase'
import { useCompany } from '@/hooks/useCompany'
import { KnowledgeExtractionEngine } from '@/lib/knowledge-base/extraction-engine'
import { AVAILABLE_TAGS, TAG_METADATA } from '@/lib/knowledge-base/types'
import { KnowledgeTable } from '@/components/knowledge-base/knowledge-table'

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

// Remove old mock knowledge items
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
    content: "Split provides a comprehensive AI content generation platform specifically designed for B2B SaaS companies looking to scale their content marketing efforts.",
    tag: "company-overview",
    createdAt: "2024-01-15",
    wordCount: 24
  },
  {
    id: 2,
    content: "Primary target audience includes marketing teams at B2B SaaS companies with 50-500 employees who struggle with consistent content production and maintaining brand voice across multiple content creators.",
    tag: "target-audience",
    createdAt: "2024-01-14",
    wordCount: 32
  },
  {
    id: 3,
    content: "Main pain point: Creating high-quality, SEO-optimized content at scale while maintaining brand consistency and avoiding generic AI-generated content that lacks authenticity.",
    tag: "pain-points",
    createdAt: "2024-01-13",
    wordCount: 26
  },
  {
    id: 4,
    content: "Unlike Jasper and Copy.ai which focus on generic content generation, Split specializes in strategic content planning with built-in SEO optimization and brand voice training.",
    tag: "positioning",
    createdAt: "2024-01-12",
    wordCount: 27
  },
  {
    id: 5,
    content: "Key features include AI-powered content planning, brand voice training, SEO optimization, content calendar management, and multi-format content generation (blogs, social posts, emails).",
    tag: "product-features",
    createdAt: "2024-01-11",
    wordCount: 27
  },
  {
    id: 6,
    content: "Common use cases: Blog content creation, social media content planning, email newsletter writing, product marketing content, and content repurposing across different channels.",
    tag: "use-cases",
    createdAt: "2024-01-10",
    wordCount: 26
  },
  {
    id: 7,
    content: "Main competitors include Jasper (focuses on generic writing), Copy.ai (template-based approach), and Writesonic (broader target market). Our differentiation is B2B SaaS specialization.",
    tag: "competitor-notes",
    createdAt: "2024-01-09",
    wordCount: 28
  },
  {
    id: 8,
    content: "Common objection: 'AI content lacks authenticity.' Response: Split trains on your specific brand voice and requires human oversight for quality control, ensuring authentic, on-brand content.",
    tag: "sales-objections",
    createdAt: "2024-01-08",
    wordCount: 29
  }
]

const availableTags = [
  { value: 'company-overview', label: 'Company Overview' },
  { value: 'target-audience', label: 'Target Audience' },
  { value: 'pain-points', label: 'Pain Points' },
  { value: 'positioning', label: 'Positioning' },
  { value: 'product-features', label: 'Product Features' },
  { value: 'use-cases', label: 'Use Cases' },
  { value: 'competitor-notes', label: 'Competitor Notes' },
  { value: 'sales-objections', label: 'Sales Objections' },
  { value: 'brand-voice', label: 'Brand Voice' },
  { value: 'keywords', label: 'Keywords' },
  { value: 'other', label: 'Other' }
]

const tabs = [
  { id: 'completed', label: 'Completed Articles' },
  { id: 'queue', label: 'Content Queue' },
  { id: 'knowledge', label: 'Knowledge Base' }
]

export default function ContentPage() {
  const { loading } = useAuth()
  const { subscription, usage, canPerformAction, getRemainingUsage, refresh } = useSubscription()
  const { company, createCompany, isLoading: companyLoading } = useCompany()
  const knowledgeBase = useKnowledgeBase()
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
  const [newKnowledgeContent, setNewKnowledgeContent] = useState('')
  const [qualityTier, setQualityTier] = useState<'standard' | 'premium'>('standard')
  const [isGenerating, setIsGenerating] = useState(false)
  const [estimatedExtractions, setEstimatedExtractions] = useState(0)

  const isPro = subscription?.plan === 'pro'

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

  // Load knowledge items when component mounts or company changes
  useEffect(() => {
    if (company?.id) {
      knowledgeBase.loadItems(company.id, { 
        tag: undefined,
        search: undefined
      })
    }
  }, [company?.id])

  // Update extraction estimate when text changes
  useEffect(() => {
    if (newKnowledgeContent.trim()) {
      const estimate = KnowledgeExtractionEngine.estimateExtractionCount(newKnowledgeContent)
      setEstimatedExtractions(estimate)
    } else {
      setEstimatedExtractions(0)
    }
  }, [newKnowledgeContent])

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

  const handleAddKnowledgeItem = async () => {
    console.log('handleAddKnowledgeItem called', {
      hasContent: !!newKnowledgeContent.trim(),
      contentLength: newKnowledgeContent.length,
      companyId: company?.id,
      hasCompany: !!company,
      isExtracting: knowledgeBase.isExtracting,
      companyLoading
    })
    
    if (!newKnowledgeContent.trim()) {
      console.log('No content provided')
      toast({
        title: 'No content provided',
        description: 'Please enter some content to extract knowledge from',
        variant: 'destructive'
      })
      return
    }
    
    if (companyLoading) {
      console.log('Company is still loading')
      toast({
        title: 'Please wait',
        description: 'Company is still being set up. Please try again in a moment.',
        variant: 'default'
      })
      return
    }
    
    if (!company?.id) {
      console.log('No company ID available', { company })
      toast({
        title: 'Company not found',
        description: 'Please refresh the page to complete your workspace setup.',
        variant: 'destructive'
      })
      return
    }

    try {
      console.log('Starting knowledge processing...')
      // If it's a large text dump, use intelligent extraction
      if (newKnowledgeContent.length > 100) {
        console.log('Using extraction for large text')
        await knowledgeBase.extractFromText(company.id, newKnowledgeContent)
      } else {
        console.log('Using manual creation for short text')
        // For short content, add manually with auto-detected tag
        const tag = autoDetectTag(newKnowledgeContent)
        await knowledgeBase.createItem(company.id, newKnowledgeContent, tag)
      }
      
    setNewKnowledgeContent('')
      console.log('Knowledge processing completed successfully')
    } catch (error) {
      console.error('Error in handleAddKnowledgeItem:', error)
      // Error handling is done in the hook
    }
  }

  const autoDetectTag = (content: string): string => {
    const lowerContent = content.toLowerCase()
    
    // Enhanced tag detection logic
    const tagPatterns = {
      'company-overview': ['company', 'business', 'overview', 'about', 'what we do'],
      'target-audience': ['customer', 'client', 'user', 'audience', 'demographic'],
      'pain-points': ['problem', 'challenge', 'issue', 'pain', 'struggle'],
      'positioning': ['unique', 'different', 'competitive', 'advantage', 'unlike'],
      'product-features': ['feature', 'capability', 'function', 'tool', 'platform'],
      'use-cases': ['use case', 'scenario', 'application', 'example', 'implementation'],
      'competitor-notes': ['competitor', 'vs', 'compared to', 'alternative', 'versus'],
      'sales-objections': ['objection', 'concern', 'worry', 'response', 'address'],
      'brand-voice': ['tone', 'voice', 'messaging', 'communication', 'style'],
      'keywords': ['keyword', 'term', 'phrase', 'seo', 'search']
    }

    for (const [tag, patterns] of Object.entries(tagPatterns)) {
      if (patterns.some(pattern => lowerContent.includes(pattern))) {
        return tag
      }
    }
    
    return 'other'
  }

  const handleCopyKnowledgeItem = (content: string) => {
    navigator.clipboard.writeText(content)
    toast({
      title: 'Copied to clipboard',
      description: 'Knowledge item content copied'
    })
  }

  const handleUpdateKnowledgeItem = async (id: string, updates: Partial<any>) => {
    try {
      // Find the current item to get existing values
      const currentItem = knowledgeBase.items.find(item => item.id === id)
      if (!currentItem) {
        throw new Error('Item not found')
      }

      // Merge updates with existing data
      const content = updates.content !== undefined ? updates.content : currentItem.content
      const tag = updates.tag !== undefined ? updates.tag : currentItem.tag

      await knowledgeBase.updateItem(id, content, tag)
      toast({
        title: 'Updated successfully',
        description: 'Knowledge item has been updated'
      })
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'There was an error updating the item',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteKnowledgeItem = async (id: string) => {
    try {
      await knowledgeBase.deleteItem(id)
      toast({
        title: 'Deleted successfully',
        description: 'Knowledge item has been deleted'
      })
    } catch (error) {
      toast({
        title: 'Delete failed', 
        description: 'There was an error deleting the item',
        variant: 'destructive'
      })
    }
  }

  // Get filtered knowledge items
  const filteredKnowledgeItems = knowledgeBase.items.filter(item => {
    const matchesTag = true
    const matchesSearch = true
    return matchesTag && matchesSearch
  })

  // Helper functions for tag styling
  const getTagColor = (tag: string) => {
    const colors: Record<string, string> = {
      'company-overview': 'bg-blue-500/20 text-blue-300',
      'target-audience': 'bg-green-500/20 text-green-300',
      'pain-points': 'bg-red-500/20 text-red-300',
      'positioning': 'bg-purple-500/20 text-purple-300',
      'product-features': 'bg-orange-500/20 text-orange-300',
      'use-cases': 'bg-cyan-500/20 text-cyan-300',
      'competitor-notes': 'bg-yellow-500/20 text-yellow-300',
      'sales-objections': 'bg-pink-500/20 text-pink-300',
      'brand-voice': 'bg-indigo-500/20 text-indigo-300',
      'keywords': 'bg-emerald-500/20 text-emerald-300',
      'other': 'bg-gray-500/20 text-gray-300'
    }
    return colors[tag] || colors['other']
  }

  const getTagLabel = (tag: string) => {
    const labels: Record<string, string> = {
      'company-overview': 'Company Overview',
      'target-audience': 'Target Audience',
      'pain-points': 'Pain Points',
      'positioning': 'Positioning',
      'product-features': 'Product Features',
      'use-cases': 'Use Cases',
      'competitor-notes': 'Competitor Notes',
      'sales-objections': 'Sales Objections',
      'brand-voice': 'Brand Voice',
      'keywords': 'Keywords',
      'other': 'Other'
    }
    return labels[tag] || 'Other'
  }

  // Show loading spinner while auth or company is loading
  if (loading || companyLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0c0c0c]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-white mx-auto mb-4" />
          <p className="text-sm text-[#666]">
            {loading ? 'Loading user...' : 'Setting up company...'}
          </p>
        </div>
      </div>
    )
  }

  return (
      <motion.main 
      className="bg-[#0c0c0c] flex flex-col h-screen overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
      {/* Streamlined Header */}
      <motion.div variants={itemVariants} className="px-6 pt-6 pb-4 flex-shrink-0">
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
      </motion.div>

      {/* Content */}
          {activeTab === 'completed' && (
        <motion.div variants={itemVariants} className="flex-1 overflow-auto">
          {currentArticles.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md mx-auto px-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-2xl flex items-center justify-center border border-[#333]">
                    <FileText className="w-12 h-12 text-[#666]" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    No articles yet
                  </h3>
                  <p className="text-[#888] text-lg leading-relaxed mb-6">
                    Your completed articles will appear here. Start by building your knowledge base to generate intelligent content suggestions.
                  </p>
                  <Button
                    onClick={() => setActiveTab('knowledge')}
                    className="bg-white text-black hover:bg-[#f5f5f5] px-6 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-105"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Build Knowledge Base
                      </Button>
                </motion.div>
                </div>
              </div>
          ) : (
            <div className="px-6 pb-6">
          <div className="grid grid-cols-3 gap-6 w-full">
            {currentArticles.map((article, index) => (
              <motion.div
                      key={article.id}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.05 }}
                    className="bg-[#0a0a0a] rounded-lg p-5 border border-[#1a1a1a] hover:border-[#2a2a2a] transition-all duration-300 hover:shadow-lg hover:shadow-black/20"
                  >
                    <p className="text-sm text-white">Article content placeholder</p>
              </motion.div>
            ))}
              </div>
            </div>
          )}
          </motion.div>
        )}

        {/* Content Queue Tab */}
        {activeTab === 'queue' && (
        <motion.div variants={itemVariants} className="flex-1 overflow-auto">
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md mx-auto px-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-2xl flex items-center justify-center border border-[#333]">
                  <Calendar className="w-12 h-12 text-[#666]" />
                      </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Content queue is empty
                </h3>
                <p className="text-[#888] text-lg leading-relaxed mb-6">
                  AI-generated content suggestions will appear here based on your knowledge base and market analysis.
                </p>
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => setActiveTab('knowledge')}
                    className="bg-white text-black hover:bg-[#f5f5f5] px-6 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-105"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Add Company Knowledge
                  </Button>
                      <Button
                    variant="outline"
                    className="border-[#333] text-[#999] hover:text-white hover:bg-[#1a1a1a] px-6 py-2.5 text-sm transition-all duration-200"
                      >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate Suggestions
                      </Button>
                    </div>
              </motion.div>
                </div>
                      </div>
          </motion.div>
        )}

      {/* Knowledge Base Tab */}
        {activeTab === 'knowledge' && (
        <motion.div variants={itemVariants} className="flex flex-col flex-1 overflow-hidden">
            {/* Knowledge Base Header */}
          <div className="px-6 pb-4 flex-shrink-0">
              <div className="flex items-center justify-between">
              {/* Left: Count and completeness indicator */}
                <div className="flex items-center gap-4">
                  <p className="text-sm text-[#666]">
                  {filteredKnowledgeItems.length} KNOWLEDGE ITEMS
                </p>
                {knowledgeBase.statistics && (
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      knowledgeBase.statistics.completenessScore > 0.7 ? 'bg-green-500' : 
                      knowledgeBase.statistics.completenessScore > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="text-xs text-[#666]">
                      {Math.round(knowledgeBase.statistics.completenessScore * 100)}% Complete
                    </span>
                  </div>
                )}
                </div>

                {/* Right: Add Button */}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleAddKnowledgeItem}
                    disabled={!newKnowledgeContent.trim() || knowledgeBase.isExtracting || companyLoading || !company?.id}
                    className="h-8 px-3 text-sm bg-white text-black hover:bg-[#f5f5f5] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    {knowledgeBase.isExtracting ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full mr-1.5" />
                        Extracting...
                      </>
                    ) : companyLoading ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full mr-1.5" />
                        Setting up...
                      </>
                    ) : !company?.id ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-1.5" />
                        Refresh to Complete Setup
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-1.5" />
                        {newKnowledgeContent.length > 100 ? 'Extract Knowledge' : 'Add Knowledge'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

          {/* Enhanced Knowledge Input Area */}
          <div className="px-6 pb-6 flex-shrink-0">
              <motion.div 
                className="relative"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <textarea
                placeholder="Paste anything about your company - marketing materials, product descriptions, competitor analysis, customer feedback, positioning docs, sales decks, etc. Our AI will automatically organize it into your knowledge base."
                  value={newKnowledgeContent}
                  onChange={(e) => setNewKnowledgeContent(e.target.value)}
                disabled={knowledgeBase.isExtracting}
                className="w-full bg-[#0a0a0a] border border-[#1a1a1a] hover:border-[#2a2a2a] focus:border-[#3a3a3a] text-white p-4 rounded-md transition-all duration-200 resize-none leading-relaxed focus:scale-[1.01] focus:shadow-lg focus:shadow-black/20 disabled:opacity-50"
                  rows={6}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleAddKnowledgeItem()
                    }
                  }}
                />
                {newKnowledgeContent && (
                  <motion.div 
                  className="absolute bottom-3 right-3 text-sm text-[#666] bg-[#0a0a0a] px-2 py-1 rounded"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                  {newKnowledgeContent.trim().split(' ').length} words
                  {estimatedExtractions > 1 && (
                    <> • ~{estimatedExtractions} items expected</>
                  )}
                  <> • ⌘+Enter to {newKnowledgeContent.length > 100 ? 'extract' : 'add'}</>
                  </motion.div>
                )}
              </motion.div>

            {/* Only show debug info if there's an actual issue */}
            {(!company?.id && !companyLoading) && (
              <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-md">
                <div className="text-xs text-red-300 mb-2">Setup Issue Detected:</div>
                <div className="text-xs text-red-200">
                  No company found. This usually means onboarding wasn't completed properly.
                  <br />Please refresh the page - the onboarding should appear automatically.
                </div>
              </div>
            )}
            </div>

            {/* Knowledge Table */}
          <div className="flex-1 px-6 pb-6 overflow-auto">
            <KnowledgeTable
              items={knowledgeBase.items}
              availableTags={availableTags}
              onUpdateItem={handleUpdateKnowledgeItem}
              onDeleteItem={handleDeleteKnowledgeItem}
              onCopyItem={handleCopyKnowledgeItem}
              isLoading={knowledgeBase.isLoading}
            />
          </div>
          </motion.div>
        )}
      </motion.main>
  )
} 
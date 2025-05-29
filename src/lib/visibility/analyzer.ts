import { createClient } from '@supabase/supabase-js'
import type { PostgrestError } from '@supabase/supabase-js'

// Types
export interface CrawlResult {
  id: string
  url: string
  status: string
  content: string
  markdown: string
  title: string
  metadata: {
    description?: string
    og?: {
      title?: string
      description?: string
      image?: string
      url?: string
    }
    links?: {
      url: string
      text: string
      isExternal: boolean
    }[]
  }
  urls: string[]
}

export interface VisibilityAnalysisResult {
  userId: string
  siteUrl: string
  aeoScore: number
  ownedCitations: number
  operatedCitations: number
  topicVisibility: {
    topic: string
    score: number
  }[]
  suggestions: {
    topic: string
    suggestion: string
  }[]
}

/**
 * Analyzes a website's crawl results to determine visibility metrics
 */
export async function analyzeCrawlResults(crawlResults: CrawlResult[], domainUrl: string): Promise<VisibilityAnalysisResult> {
  console.log('Starting visibility analysis for:', domainUrl)
  console.log('Crawl results count:', crawlResults.length)
  
  // Extract base domain for comparison
  const domain = extractDomain(domainUrl)
  console.log('Extracted domain:', domain)
  
  // Count citation types
  const { ownedCitations, operatedCitations } = categorizeCitations(
    crawlResults, 
    domain
  )
  console.log('Citations found - Owned:', ownedCitations, 'Operated:', operatedCitations)
  
  // Calculate topic relevance scores
  const topicVisibility = await analyzeTopicRelevance(crawlResults)
  console.log('Topic visibility analysis complete:', topicVisibility.length, 'topics scored')
  
  // Generate improvement suggestions
  const suggestions = generateSuggestions(topicVisibility)
  console.log('Generated suggestions:', suggestions.length)
  
  // Calculate overall AEO score (0-100)
  const aeoScore = calculateAEOScore({
    ownedCitations,
    operatedCitations,
    topicVisibility
  })
  console.log('Calculated AEO Score:', aeoScore)
  
  return {
    userId: '', // Will be set by the API route
    siteUrl: domainUrl,
    aeoScore,
    ownedCitations,
    operatedCitations,
    topicVisibility,
    suggestions
  }
}

/**
 * Extracts the base domain from a URL
 */
function extractDomain(url: string | undefined): string {
  if (!url || typeof url !== 'string') {
    return 'unknown-domain'
  }
  
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace(/^www\./, '')
  } catch (e) {
    // Handle invalid URLs or URLs without protocol
    const cleaned = url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]
    return cleaned || 'unknown-domain'
  }
}

/**
 * Categorizes link citations found in crawl results
 */
function categorizeCitations(crawlResults: CrawlResult[], baseDomain: string) {
  let ownedCitations = 0
  let operatedCitations = 0
  
  // Extract links from both metadata AND markdown content
  const allLinks: { url: string; text: string; isExternal: boolean }[] = []
  
  crawlResults.forEach(result => {
    // Get links from metadata (if available)
    const metadataLinks = result.metadata?.links || []
    allLinks.push(...metadataLinks)
    
    // Extract links from markdown content using regex
    const markdownContent = result.markdown || result.content || ''
    const urlRegex = /\[([^\]]*)\]\(([^)]+)\)/g // Markdown links [text](url)
    const httpRegex = /https?:\/\/[^\s<>"]+/g // Plain HTTP(S) URLs
    
    let match
    while ((match = urlRegex.exec(markdownContent)) !== null) {
      allLinks.push({
        url: match[2],
        text: match[1],
        isExternal: !match[2].includes(baseDomain)
      })
    }
    
    // Also extract plain URLs
    while ((match = httpRegex.exec(markdownContent)) !== null) {
      allLinks.push({
        url: match[0],
        text: '',
        isExternal: !match[0].includes(baseDomain)
      })
    }
    
    // Add the page's own URL as an owned citation
    if (result.url && result.url.includes(baseDomain)) {
      allLinks.push({
        url: result.url,
        text: result.title || '',
        isExternal: false
      })
    }
  })
  
  // Deduplicate links
  const uniqueLinks = [...new Map(allLinks.map(link => [link.url, link])).values()]
  console.log('Processing', uniqueLinks.length, 'unique links for citation analysis')
  
  uniqueLinks.forEach(link => {
    try {
      const linkDomain = extractDomain(link.url)
      
      if (linkDomain === baseDomain) {
        // Same domain - owned citation
        ownedCitations++
      } else if (isSubdomainOf(linkDomain, baseDomain) || isRelatedDomain(linkDomain, baseDomain)) {
        // Subdomain or related property - operated citation
        operatedCitations++
      }
    } catch (e) {
      // Skip invalid URLs
      console.warn('Skipping invalid URL:', link.url)
    }
  })
  
  return { ownedCitations, operatedCitations }
}

/**
 * Checks if domain is a subdomain of the base domain
 */
function isSubdomainOf(domain: string, baseDomain: string): boolean {
  return domain.endsWith(`.${baseDomain}`)
}

/**
 * Check if domain is likely related to the base domain
 * This is a simplistic implementation and would need enhancement
 */
function isRelatedDomain(domain: string, baseDomain: string): boolean {
  const baseWithoutTLD = baseDomain.split('.')[0]
  return domain.includes(baseWithoutTLD) && domain !== baseDomain
}

/**
 * Analyze topic relevance in the crawled content
 * Uses a keyword-based approach as fallback when OpenAI isn't available
 */
async function analyzeTopicRelevance(crawlResults: CrawlResult[]) {
  // Default topics to analyze based on common business/tech areas
  const defaultTopics = [
    'artificial intelligence',
    'machine learning',
    'productivity tools',
    'software development',
    'content creation',
    'business automation',
    'data analytics',
    'cloud computing',
    'cybersecurity',
    'digital marketing'
  ]
  
  // Combine all content for analysis
  const combinedContent = crawlResults
    .map(result => {
      const content = result.markdown || result.content || ''
      const title = result.title || ''
      const description = result.metadata?.description || ''
      return [title, description, content].join(' ')
    })
    .join('\n\n')
    .slice(0, 15000) // Limit content size for processing
  
  console.log('Analyzing content length:', combinedContent.length, 'characters')
  
  try {
    // For now, use fallback method since OpenAI integration needs to be set up
    // In the future, this could call OpenAI API for more sophisticated analysis
    return await fallbackTopicScoring(combinedContent, defaultTopics)
  } catch (error) {
    console.error('Error analyzing topics:', error)
    return await fallbackTopicScoring(combinedContent, defaultTopics)
  }
}

/**
 * Enhanced fallback method for topic relevance scoring
 */
async function fallbackTopicScoring(content: string, topics: string[]) {
  // Normalize content
  const normalizedContent = content.toLowerCase()
  
  // Enhanced keyword mapping with synonyms and related terms
  const topicKeywords: { [key: string]: string[] } = {
    'artificial intelligence': ['ai', 'artificial intelligence', 'machine intelligence', 'intelligent systems', 'neural networks', 'deep learning', 'ai-powered', 'ai agents', 'intelligent agents'],
    'machine learning': ['machine learning', 'ml', 'predictive analytics', 'algorithms', 'models', 'training data', 'supervised learning', 'unsupervised learning'],
    'business automation': ['automation', 'workflow', 'process automation', 'automated', 'streamline', 'efficiency', 'optimize', 'business process'],
    'productivity tools': ['productivity', 'tools', 'software', 'platform', 'solution', 'efficiency', 'optimize', 'streamline'],
    'content creation': ['content', 'creation', 'writing', 'generate', 'blog', 'articles', 'copywriting', 'marketing content'],
    'data analytics': ['analytics', 'data analysis', 'insights', 'metrics', 'reporting', 'dashboard', 'business intelligence', 'data-driven'],
    'software development': ['development', 'software', 'coding', 'programming', 'api', 'integration', 'platform', 'technical'],
    'cloud computing': ['cloud', 'saas', 'infrastructure', 'deployment', 'hosting', 'scalable', 'serverless'],
    'cybersecurity': ['security', 'privacy', 'protection', 'secure', 'encryption', 'compliance', 'data protection'],
    'digital marketing': ['marketing', 'lead generation', 'b2b', 'sales', 'prospecting', 'outreach', 'campaigns', 'lead gen']
  }

  const scoredTopics = topics.map(topic => {
    const keywords = topicKeywords[topic.toLowerCase()] || topic.toLowerCase().split(' ')
    let score = 0
    
    keywords.forEach(keyword => {
      if (keyword.length <= 2) return // Skip short words
      
      // Count exact word matches (highest weight)
      const exactRegex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')
      const exactMatches = normalizedContent.match(exactRegex)
      if (exactMatches) {
        score += exactMatches.length * 10
      }
      
      // Count partial matches (medium weight)
      const partialRegex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
      const partialMatches = normalizedContent.match(partialRegex)
      if (partialMatches) {
        score += Math.max(0, partialMatches.length - (exactMatches?.length || 0)) * 4
      }
    })
    
    // Boost score for topics found in titles or headers
    const titleBoostRegex = new RegExp(`(^|\\n)#+\\s.*${topic.toLowerCase().split(' ')[0]}`, 'g')
    if (titleBoostRegex.test(normalizedContent)) {
      score += 25
    }
    
    // Boost for page titles (first 200 characters)
    const topicInTitle = normalizedContent.slice(0, 200).includes(topic.toLowerCase())
    if (topicInTitle) {
      score += 20
    }
    
    // Context bonus: if multiple related keywords appear together
    const contextBonus = keywords.filter(k => normalizedContent.includes(k)).length
    if (contextBonus > 2) {
      score += contextBonus * 5
    }
    
    // Normalize score to 0-100 range with better distribution
    score = Math.min(100, Math.max(0, Math.round(score * 1.2)))
    
    return {
      topic,
      score
    }
  })
  
  // Sort by score descending and return top results
  return scoredTopics
    .sort((a, b) => b.score - a.score)
    .slice(0, 8) // Return top 8 topics
}

/**
 * Generates improvement suggestions based on topic scores
 */
function generateSuggestions(topicScores: { topic: string; score: number }[]) {
  const suggestions = []
  
  // Find low-scoring topics that could be improved
  const lowScoringTopics = topicScores.filter(topic => topic.score < 30)
  
  if (lowScoringTopics.length > 0) {
    suggestions.push(...lowScoringTopics.slice(0, 3).map(topic => ({
      topic: topic.topic,
      suggestion: `Create more content focused on ${topic.topic} to improve visibility in this area`
    })))
  }
  
  // Add general suggestions based on overall performance
  const avgScore = topicScores.length > 0 
    ? topicScores.reduce((sum, t) => sum + t.score, 0) / topicScores.length 
    : 0
    
  if (avgScore < 40) {
    suggestions.push({
      topic: 'Content Strategy',
      suggestion: 'Consider expanding content depth and breadth to improve overall topic coverage'
    })
  }
  
  if (suggestions.length === 0) {
    suggestions.push({
      topic: 'Content Optimization',
      suggestion: 'Continue creating high-quality content to maintain strong visibility'
    })
  }
  
  return suggestions.slice(0, 5) // Limit to top 5 suggestions
}

/**
 * Calculate overall AEO score based on various metrics
 * This uses a weighted formula to produce a score between 0-100
 */
function calculateAEOScore({
  ownedCitations,
  operatedCitations,
  topicVisibility
}: {
  ownedCitations: number
  operatedCitations: number
  topicVisibility: { topic: string; score: number }[]
}) {
  // Citation scoring with more realistic caps and weights
  const maxOwnedCitations = 20  // Reduced from 25
  const maxOperatedCitations = 10  // Reduced from 15
  
  const ownedScore = Math.min(ownedCitations, maxOwnedCitations) / maxOwnedCitations * 100
  const operatedScore = Math.min(operatedCitations, maxOperatedCitations) / maxOperatedCitations * 100
  
  // Weighted citation score (owned citations are more valuable)
  const citationScore = (ownedScore * 0.8) + (operatedScore * 0.2)
  
  // Topic relevance scoring (average of all topic scores)
  const avgTopicScore = topicVisibility.length > 0
    ? topicVisibility.reduce((sum, t) => sum + t.score, 0) / topicVisibility.length
    : 0
  
  // Content quality bonus based on number of pages analyzed
  const contentQualityBonus = Math.min(10, topicVisibility.length * 1.5)
  
  // Adjust weighting based on citation availability
  let finalScore: number
  if (ownedCitations + operatedCitations === 0) {
    // If no citations found, rely heavily on content quality
    finalScore = (avgTopicScore * 0.85) + contentQualityBonus
  } else {
    // Normal weighting: citations 25%, topics 70%, quality bonus 5%
    finalScore = (citationScore * 0.25) + (avgTopicScore * 0.70) + contentQualityBonus
  }
  
  // Ensure minimum score for sites with substantial content
  const minimumScore = topicVisibility.length >= 5 ? 20 : 10
  
  // Cap the final score and ensure it's reasonable
  const cappedScore = Math.min(95, Math.max(minimumScore, Math.round(finalScore)))
  
  console.log('AEO Score Calculation Breakdown:')
  console.log(`  Citation Score: ${Math.round(citationScore)}/100 (${ownedCitations} owned, ${operatedCitations} operated)`)
  console.log(`  Average Topic Score: ${Math.round(avgTopicScore)}/100`)
  console.log(`  Content Quality Bonus: +${Math.round(contentQualityBonus)}`)
  console.log(`  Final Score: ${cappedScore}/100`)
  
  return cappedScore
}

/**
 * Saves the visibility analysis results to the database
 * This is now optional and handled by the API route
 */
export async function saveVisibilityResults(
  analysis: VisibilityAnalysisResult,
  userId: string
): Promise<{ data: any; error: any }> {
  // This function is kept for backward compatibility
  // The actual saving is now handled in the API route
  console.log('saveVisibilityResults called - delegating to API route')
  return { data: null, error: null }
} 
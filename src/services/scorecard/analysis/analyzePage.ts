import { parse } from 'node-html-parser'
import { PageData } from '../../crawler/firecrawl-client'
import {
  AEOIssue,
  analyzeContentStructure,
  analyzeHeadingHierarchy,
  analyzeMediaAccessibility,
  analyzeSemantics,
  calculateContentStructureScore,
  calculateDocumentQualityScore,
  calculateDocumentStructureScore,
  calculateStructuredDataScore,
  checkIfMarkdownRendered,
  countMediaElements,
  generateRecommendations
} from './analysisUtils'

export interface AEOAnalysisResult {
  url: string
  title: string
  statusCode: number
  scores: {
    overall: number
    llmsTxt: number
    structuredData: number
    contentStructure: number
    semantics: number
    mediaAccess: number
    documentQuality?: number
  }
  hasLlmsTxt: boolean
  hasSchema: boolean
  isMarkdownRendered: boolean
  isDocument: boolean
  documentType?: string
  schemaTypes: string[]
  mediaCount: number
  issues: AEOIssue[]
  recommendations: string[]
}

/**
 * Analyze a page for AEO (AI Engine Optimization)
 */
export function analyzePageForAEO(page: PageData, llmsTxtData?: any, robotsTxtData?: any): AEOAnalysisResult {
  let isDocument = page.metadata?.isDocument || false
  let documentType = page.metadata?.contentType || null
  let isMarkdownRendered = false
  let contentStructure: any = null
  let headingIssues: AEOIssue[] = []
  let semantics: { score: number; issues: AEOIssue[] } = { score: 0, issues: [] }
  let mediaCount = 0
  let schemaTypes: string[] = []
  let mediaAccessibilityScore = 0

  if (!isDocument) {
    const root = parse(page.html)

    isMarkdownRendered = checkIfMarkdownRendered(root)
    contentStructure = analyzeContentStructure(root)
    headingIssues = analyzeHeadingHierarchy(root)
    semantics = analyzeSemantics(root, page.title)
    mediaCount = countMediaElements(root)
    mediaAccessibilityScore = analyzeMediaAccessibility(root)
  } else {
    contentStructure = {
      h1Count: 0,
      h2Count: 0,
      h3Count: 0,
      paragraphCount: 0,
      listCount: 0,
      listItemCount: 0,
      hasTable: false,
      hasImages: false
    }

    if (page.markdown) {
      const headings = page.markdown.match(/^#\s+.+$/gm) || []
      const subheadings = page.markdown.match(/^##\s+.+$/gm) || []
      const paragraphs = page.markdown.split('\n\n').length

      contentStructure.h1Count = headings.length
      contentStructure.h2Count = subheadings.length
      contentStructure.paragraphCount = paragraphs

      contentStructure.hasTable = page.markdown.includes('|---') || page.markdown.includes('| ---')
      contentStructure.hasImages = page.markdown.includes('!')
      mediaCount = (page.markdown.match(/!\[.*?\]\(.*?\)/g) || []).length
      isMarkdownRendered = true
    }
  }

  const schemaData = page.metadata?.structuredData || []
  const hasSchema = schemaData.length > 0

  if (hasSchema) {
    schemaTypes = schemaData.map(schema => schema['@type'] || 'Unknown').filter(Boolean)
  }

  if (!hasSchema && !isDocument && page.html) {
    const jsonLdMatches = page.html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)
    if (jsonLdMatches && jsonLdMatches.length > 0) {
      schemaTypes = ['DetectedInScript']
    }
  }

  const hasRobotsTxtBlocksAI = robotsTxtData?.blocksAI || false
  const llmsTxtScore = llmsTxtData?.exists ? 100 : 0
  const hasLlmsTxt = !!llmsTxtData?.exists

  const structuredDataScore = calculateStructuredDataScore(schemaData, schemaTypes)
  const contentStructureScore = isDocument
    ? calculateDocumentStructureScore(page.markdown, contentStructure)
    : calculateContentStructureScore(contentStructure, headingIssues)
  const semanticsScore = isDocument ? 70 : semantics.score

  let documentQualityScore: number | null = null
  if (isDocument) {
    documentQualityScore = calculateDocumentQualityScore(page)
  }

  const overallScore = Math.round(
    llmsTxtScore * 0.25 +
    structuredDataScore * 0.25 +
    contentStructureScore * 0.25 +
    semanticsScore * 0.15 +
    mediaAccessibilityScore * 0.10
  )

  const issues: AEOIssue[] = [
    ...(!hasLlmsTxt ? [{
      type: 'critical' as const,
      message: 'No llms.txt file found',
      fixSuggestion: 'Create an llms.txt file in your root directory to specify AI crawler permissions'
    }] : []),
    ...(hasRobotsTxtBlocksAI ? [{
      type: 'critical' as const,
      message: 'robots.txt blocks AI crawlers',
      url: `${new URL(page.url).origin}/robots.txt`,
      fixSuggestion: 'Update your robots.txt to allow AI crawlers like ChatGPT, Claude, etc.'
    }] : []),
    ...(!hasSchema && !isDocument ? [{
      type: 'warning' as const,
      message: 'No structured data/schema found',
      fixSuggestion: 'Add structured data using schema.org JSON-LD format'
    }] : []),
    ...(isDocument && documentQualityScore && documentQualityScore < 50 ? [{
      type: 'warning' as const,
      message: 'Low-quality document format for AI consumption',
      fixSuggestion: 'Convert document to a more accessible format or provide HTML/text alternatives'
    }] : []),
    ...headingIssues,
    ...semantics.issues
  ]

  if (mediaCount > 0 && mediaAccessibilityScore < 50) {
    issues.push({
      type: 'warning',
      message: 'Media elements lack proper accessibility for AI understanding',
      fixSuggestion: 'Add descriptive alt text to images and provide transcripts for audio/video'
    })
  }

  const recommendations = generateRecommendations(
    hasLlmsTxt,
    hasSchema,
    isMarkdownRendered,
    headingIssues,
    isDocument,
    mediaAccessibilityScore
  )

  return {
    url: page.url,
    title: page.title,
    statusCode: page.metadata?.statusCode || 200,
    scores: {
      overall: overallScore,
      llmsTxt: llmsTxtScore,
      structuredData: structuredDataScore,
      contentStructure: contentStructureScore,
      semantics: semanticsScore,
      mediaAccess: mediaAccessibilityScore,
      documentQuality: documentQualityScore || undefined
    },
    hasLlmsTxt,
    hasSchema,
    isMarkdownRendered,
    isDocument,
    documentType: documentType || undefined,
    schemaTypes,
    mediaCount,
    issues,
    recommendations
  }
}

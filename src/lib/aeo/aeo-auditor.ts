import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

interface PageData {
  url: string
  html: string
  content: string
  metadata: {
    title?: string
    description?: string
    headings: { level: number; text: string }[]
    links: { url: string; text: string; isInternal: boolean; isEEAT: boolean }[]
    images: { src: string; alt: string; hasAlt: boolean }[]
    hasJsonLd: boolean
    schemaTypes: string[]
    htmlSize: number
    domNodes: number
  }
}

interface AEOAuditResult {
  page_summary: string
  technical_recommendations: string
  content_recommendations: string
  render_mode: string
  crawlable: boolean
  semantic_url: string
  meta_description: string
  meta_description_feedback: string
  h1_present: string
  heading_depth: string
  word_count: number
  passage_slicing: string
  corporate_jargon_flags: string
  schema_present: boolean
  schema_types: string
  schema_suggestions: string
  recency_signal: string
  micro_niche_specificity: string
  external_eeat_links: number
  internal_link_count: number
}

/**
 * Detect render mode from HTML content
 */
function detectRenderMode(html: string, content: string): string {
  // Check if content is visible without JS
  const hasInitialContent = content.trim().length > 100
  
  // Check for SPA indicators
  const hasSPAIndicators = html.includes('data-reactroot') || 
                          html.includes('ng-app') || 
                          html.includes('data-vue-root') ||
                          html.includes('__NEXT_DATA__') ||
                          html.includes('_app.js') ||
                          html.includes('app.bundle.js')
  
  // Check for SSR indicators
  const hasSSRContent = html.includes('<script id="__NEXT_DATA__"') ||
                       html.includes('window.__INITIAL_STATE__') ||
                       (hasInitialContent && html.length > 10000)
  
  if (hasSSRContent && hasInitialContent) {
    return 'SSR'
  } else if (hasSPAIndicators && !hasInitialContent) {
    return 'CSR-JS'
  } else if (hasInitialContent && !hasSPAIndicators) {
    return 'STATIC'
  } else {
    return 'CSR-JS'
  }
}

/**
 * Analyze semantic URL quality
 */
function analyzeSemanticURL(url: string): string {
  try {
    const urlObj = new URL(url)
    const path = urlObj.pathname
    
    // Check for good practices
    const hasDescriptiveWords = /[a-z-]+/.test(path)
    const hasHyphens = path.includes('-')
    const hasNoNumbers = !/\d{5,}/.test(path) // Avoid long ID numbers
    const isReasonableLength = path.length < 100
    const hasNoSpecialChars = !/[%&=\?]/.test(path)
    
    const goodPractices = [hasDescriptiveWords, hasHyphens, hasNoNumbers, isReasonableLength, hasNoSpecialChars]
    const score = goodPractices.filter(Boolean).length
    
    if (score >= 4) {
      return 'Good - URL is descriptive and follows SEO best practices'
    } else if (score >= 2) {
      return 'Fair - URL could be more descriptive with hyphens instead of underscores'
    } else {
      return 'Poor - URL contains IDs, special characters, or lacks descriptive keywords'
    }
  } catch {
    return 'Poor - Invalid URL structure'
  }
}

/**
 * Find strong and weak passage examples
 */
function analyzePassageSlicing(content: string): string {
  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 50)
  
  // Find a good single-topic paragraph
  const strongExample = paragraphs.find(p => 
    p.length > 100 && p.length < 300 && 
    !p.includes(' and ') && !p.includes(' or ') &&
    p.split('.').length <= 3
  )
  
  // Find weak multi-topic paragraphs
  const weakExamples = paragraphs.filter(p => 
    p.length > 200 && (
      p.split(' and ').length > 3 ||
      p.split(',').length > 4 ||
      p.includes('various') ||
      p.includes('multiple') ||
      p.includes('different')
    )
  ).slice(0, 2)
  
  let result = ''
  if (strongExample) {
    result += `Strong: "${strongExample.substring(0, 100)}..."`
  } else {
    result += 'Strong: No clear single-topic sections found'
  }
  
  if (weakExamples.length > 0) {
    result += ` | Weak: "${weakExamples[0].substring(0, 80)}..."`
    if (weakExamples[1]) {
      result += `, "${weakExamples[1].substring(0, 80)}..."`
    }
  }
  
  return result
}

/**
 * Detect corporate jargon
 */
function detectCorporateJargon(content: string): string {
  const jargonPhrases = [
    'synergy', 'leverage', 'paradigm', 'disruptive', 'innovative solutions',
    'cutting-edge', 'state-of-the-art', 'best-in-class', 'world-class',
    'scalable solutions', 'robust platform', 'seamless integration',
    'optimize efficiency', 'streamline processes', 'maximize ROI',
    'next-generation', 'revolutionary', 'game-changing', 'industry-leading'
  ]
  
  const foundJargon = jargonPhrases.filter(phrase => 
    content.toLowerCase().includes(phrase.toLowerCase())
  ).slice(0, 3)
  
  return foundJargon.length > 0 ? foundJargon.join(', ') : 'N/A'
}

/**
 * Detect recency signals
 */
function detectRecencySignals(html: string, content: string): string {
  const currentYear = new Date().getFullYear()
  const recentYears = [currentYear, currentYear - 1, currentYear - 2]
  
  // Look for date patterns
  const datePatterns = [
    /updated\s+(\d{4}-\d{2}-\d{2})/i,
    /last\s+updated\s+([a-z]+\s+\d{1,2},?\s+\d{4})/i,
    /(\d{4}-\d{2}-\d{2})/g,
    /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/gi
  ]
  
  for (const pattern of datePatterns) {
    const matches = content.match(pattern)
    if (matches) {
      const dateStr = matches[0]
      // Check if it's a recent date
      if (recentYears.some(year => dateStr.includes(year.toString()))) {
        return `Updated ${dateStr}`
      }
    }
  }
  
  return 'None visible'
}

/**
 * Analyze micro-niche specificity
 */
function analyzeMicroNicheSpecificity(content: string, url: string): string {
  const hasHowTo = /how\s+to|step\s+by\s+step|guide|tutorial/i.test(content)
  const hasComparison = /vs\s|versus|compare|comparison|best\s|top\s\d+/i.test(content)
  const hasTroubleshooting = /error|fix|solve|troubleshoot|problem|issue/i.test(content)
  const hasSpecificTerms = /specific|detailed|comprehensive|complete/i.test(content)
  
  if (hasHowTo) {
    return 'Addresses specific how-to need with actionable steps'
  } else if (hasComparison) {
    return 'Provides comparison/evaluation for decision-making'
  } else if (hasTroubleshooting) {
    return 'Solves specific troubleshooting or problem-solving need'
  } else if (hasSpecificTerms) {
    return 'Covers topic comprehensively with detailed information'
  } else {
    return 'General content - could be more focused on specific user needs'
  }
}

/**
 * Generate AI-powered AEO audit using GPT-4o
 */
export async function generateAEOAudit(pageData: PageData): Promise<AEOAuditResult> {
  try {
    // First, do basic analysis
    const renderMode = detectRenderMode(pageData.html, pageData.content)
    const crawlable = pageData.content.trim().length > 100
    const semanticUrl = analyzeSemanticURL(pageData.url)
    const passageSlicing = analyzePassageSlicing(pageData.content)
    const jargonFlags = detectCorporateJargon(pageData.content)
    const recencySignal = detectRecencySignals(pageData.html, pageData.content)
    const microNiche = analyzeMicroNicheSpecificity(pageData.content, pageData.url)
    
    // Extract H1 info
    const h1Headings = pageData.metadata.headings.filter(h => h.level === 1)
    const h1Present = h1Headings.length > 0 ? `Yes • "${h1Headings[0]?.text || ''}"` : 'No'
    
    // Extract meta description
    const metaDesc = pageData.metadata.description
    const metaDescription = metaDesc ? `Yes • "${metaDesc}"` : 'No'
    
    // Word count
    const wordCount = pageData.content.split(/\s+/).filter(word => word.length > 0).length
    
    // Heading depth
    const headingDepth = pageData.metadata.headings.length > 0 
      ? `H1-H${Math.max(...pageData.metadata.headings.map(h => h.level))}`
      : 'None'
    
    // Schema info
    const schemaPresent = pageData.metadata.hasJsonLd
    const schemaTypes = pageData.metadata.schemaTypes.length > 0 
      ? pageData.metadata.schemaTypes.join(', ')
      : 'N/A'
    
    // Link counts
    const externalEeatLinks = pageData.metadata.links.filter(l => l.isEEAT).length
    const internalLinkCount = pageData.metadata.links.filter(l => l.isInternal).length
    
    // Now use AI for the strategic recommendations
    const prompt = `You are AEO-Auditor, an expert Answer Engine Optimization analyst. Analyze this webpage data and provide strategic recommendations.

URL: ${pageData.url}
Title: ${pageData.metadata.title || 'N/A'}
Meta Description: ${metaDesc || 'None'}
Word Count: ${wordCount}
H1: ${h1Headings[0]?.text || 'None'}
Schema Types: ${schemaTypes}
Internal Links: ${internalLinkCount}
External EEAT Links: ${externalEeatLinks}
Render Mode: ${renderMode}

Content Preview (first 1000 chars):
${pageData.content.substring(0, 1000)}

Provide exactly 3 responses, each 2-4 sentences:

1. Page_Summary: Plain-language summary of what this page is about and its primary purpose.

2. Technical_Recommendations: Focus ONLY on technical AI visibility improvements like adding specific schema types, implementing SSR, adding EEAT links, improving meta descriptions, etc.

3. Content_Recommendations: Focus ONLY on content improvements like removing jargon, better section organization, adding FAQ sections, improving passage clarity, etc.

4. Meta_Description_Feedback: If meta description exists, analyze if it's phrased like a question, answers page content semantically, and provide specific feedback.

5. Schema_Suggestions: List 2-3 specific schema types this page should add (FAQPage, HowTo, BreadcrumbList, Product, Article, etc.).

Keep each response concise and actionable.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1000
    })

    const aiResponse = completion.choices[0]?.message?.content || ''
    
    // Parse AI response
    const lines = aiResponse.split('\n').filter(line => line.trim())
    let pageSummary = 'AI analysis not available'
    let technicalRecs = 'Add structured data and improve technical SEO elements'
    let contentRecs = 'Improve content clarity and organization'
    let metaFeedback = 'N/A'
    let schemaSuggestions = 'Article, BreadcrumbList'
    
    lines.forEach(line => {
      if (line.includes('Page_Summary:')) {
        pageSummary = line.replace(/.*Page_Summary:\s*/, '').trim()
      } else if (line.includes('Technical_Recommendations:')) {
        technicalRecs = line.replace(/.*Technical_Recommendations:\s*/, '').trim()
      } else if (line.includes('Content_Recommendations:')) {
        contentRecs = line.replace(/.*Content_Recommendations:\s*/, '').trim()
      } else if (line.includes('Meta_Description_Feedback:')) {
        metaFeedback = line.replace(/.*Meta_Description_Feedback:\s*/, '').trim()
      } else if (line.includes('Schema_Suggestions:')) {
        schemaSuggestions = line.replace(/.*Schema_Suggestions:\s*/, '').trim()
      }
    })

    return {
      page_summary: pageSummary,
      technical_recommendations: technicalRecs,
      content_recommendations: contentRecs,
      render_mode: renderMode,
      crawlable,
      semantic_url: semanticUrl,
      meta_description: metaDescription,
      meta_description_feedback: metaFeedback,
      h1_present: h1Present,
      heading_depth: headingDepth,
      word_count: wordCount,
      passage_slicing: passageSlicing,
      corporate_jargon_flags: jargonFlags,
      schema_present: schemaPresent,
      schema_types: schemaTypes,
      schema_suggestions: schemaSuggestions,
      recency_signal: recencySignal,
      micro_niche_specificity: microNiche,
      external_eeat_links: externalEeatLinks,
      internal_link_count: internalLinkCount
    }

  } catch (error) {
    console.error('AEO Auditor error:', error)
    
    // Return fallback analysis without AI
    const renderMode = detectRenderMode(pageData.html, pageData.content)
    const h1Headings = pageData.metadata.headings.filter(h => h.level === 1)
    
    return {
      page_summary: 'AI analysis unavailable - manual review required',
      technical_recommendations: 'Implement proper schema markup, ensure SSR rendering, add canonical tags',
      content_recommendations: 'Improve content structure, add FAQ sections, reduce jargon',
      render_mode: renderMode,
      crawlable: pageData.content.trim().length > 100,
      semantic_url: analyzeSemanticURL(pageData.url),
      meta_description: pageData.metadata.description ? `Yes • "${pageData.metadata.description}"` : 'No',
      meta_description_feedback: 'N/A',
      h1_present: h1Headings.length > 0 ? `Yes • "${h1Headings[0]?.text || ''}"` : 'No',
      heading_depth: pageData.metadata.headings.length > 0 
        ? `H1-H${Math.max(...pageData.metadata.headings.map(h => h.level))}`
        : 'None',
      word_count: pageData.content.split(/\s+/).filter(word => word.length > 0).length,
      passage_slicing: analyzePassageSlicing(pageData.content),
      corporate_jargon_flags: detectCorporateJargon(pageData.content),
      schema_present: pageData.metadata.hasJsonLd,
      schema_types: pageData.metadata.schemaTypes.join(', ') || 'N/A',
      schema_suggestions: 'Article, BreadcrumbList, FAQPage',
      recency_signal: detectRecencySignals(pageData.html, pageData.content),
      micro_niche_specificity: analyzeMicroNicheSpecificity(pageData.content, pageData.url),
      external_eeat_links: pageData.metadata.links.filter(l => l.isEEAT).length,
      internal_link_count: pageData.metadata.links.filter(l => l.isInternal).length
    }
  }
} 
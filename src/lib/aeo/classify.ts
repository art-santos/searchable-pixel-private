import OpenAI from 'openai'
import type { SerpResults, SerperResult } from './serper'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface ClassificationResult {
  url: string
  title: string
  snippet: string
  bucket: 'Owned' | 'Operated' | 'Earned'
  confidence?: number
  reasoning?: string
}

export interface ClassifiedResults {
  classifications: ClassificationResult[]
  metadata: {
    total_urls: number
    owned_count: number
    operated_count: number
    earned_count: number
    classified_at: string
    target_domain: string
  }
}

/**
 * Classifies all URLs from SERP results into Owned/Operated/Earned buckets
 */
export async function classifyResults(
  serpResults: SerpResults,
  targetDomain: string,
  onProgress?: (completed: number, total: number) => void
): Promise<ClassifiedResults> {
  console.log('🏷️ Starting URL classification for target:', targetDomain)
  
  // Extract all unique URLs with metadata
  const urlsToClassify = extractUniqueUrls(serpResults)
  console.log(`📊 Found ${urlsToClassify.length} unique URLs to classify`)
  
  const classifications: ClassificationResult[] = []
  const batchSize = 50 // Reduced for faster processing with more batches
  
  for (let i = 0; i < urlsToClassify.length; i += batchSize) {
    const batch = urlsToClassify.slice(i, i + batchSize)
    const batchNum = Math.floor(i / batchSize) + 1
    const totalBatches = Math.ceil(urlsToClassify.length / batchSize)
    console.log(`🔄 Processing batch ${batchNum}/${totalBatches} (${batch.length} URLs)`)
    console.log(`🤖 Using GPT-4o-mini for fast classification...`)
    
    const startTime = Date.now()
    try {
      const batchResults = await classifyBatch(batch, targetDomain)
      const duration = Date.now() - startTime
      console.log(`✅ Batch ${batchNum} completed in ${(duration/1000).toFixed(1)}s`)
      classifications.push(...batchResults)
      
      onProgress?.(classifications.length, urlsToClassify.length)
      
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`❌ Batch ${batchNum} failed after ${(duration/1000).toFixed(1)}s:`, error)
      
      // Fallback: rule-based classification for this batch
      const fallbackResults = batch.map(item => classifyByRules(item, targetDomain))
      classifications.push(...fallbackResults)
      
      onProgress?.(classifications.length, urlsToClassify.length)
    }
    
    // Minimal delay between batches
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  // Generate summary statistics
  const owned = classifications.filter(c => c.bucket === 'Owned').length
  const operated = classifications.filter(c => c.bucket === 'Operated').length
  const earned = classifications.filter(c => c.bucket === 'Earned').length
  
  console.log(`✅ Classification complete: ${owned} Owned, ${operated} Operated, ${earned} Earned`)
  
  return {
    classifications,
    metadata: {
      total_urls: classifications.length,
      owned_count: owned,
      operated_count: operated,
      earned_count: earned,
      classified_at: new Date().toISOString(),
      target_domain: targetDomain
    }
  }
}

/**
 * Extracts unique URLs from SERP results with their metadata
 */
function extractUniqueUrls(serpResults: SerpResults): Array<{
  url: string
  title: string
  snippet: string
  questions: string[]
}> {
  const urlMap = new Map<string, { 
    url: string
    title: string
    snippet: string
    questions: Set<string>
  }>()
  
  Object.entries(serpResults).forEach(([question, data]) => {
    data.results.forEach(result => {
      if (!result.url || !result.url.startsWith('http')) return
      
      const existing = urlMap.get(result.url)
      if (existing) {
        existing.questions.add(question)
        // Use the longest/best title and snippet
        if (result.title.length > existing.title.length) {
          existing.title = result.title
        }
        if (result.snippet.length > existing.snippet.length) {
          existing.snippet = result.snippet
        }
      } else {
        urlMap.set(result.url, {
          url: result.url,
          title: result.title,
          snippet: result.snippet,
          questions: new Set([question])
        })
      }
    })
  })
  
  return Array.from(urlMap.values()).map(item => ({
    url: item.url,
    title: item.title,
    snippet: item.snippet,
    questions: Array.from(item.questions)
  }))
}

/**
 * Classifies a batch of URLs using hybrid approach: rule-based first, then GPT for unclear cases
 */
async function classifyBatch(
  urls: Array<{ url: string; title: string; snippet: string }>,
  targetDomain: string
): Promise<ClassificationResult[]> {
  const rootDomain = extractRootDomain(targetDomain)
  
  // First pass: rule-based classification
  const ruleBasedResults = urls.map(url => {
    const result = classifyByRules(url, targetDomain)
    return {
      ...result,
      confidence: getClassificationConfidence(url, targetDomain)
    }
  })
  
  // Separate high-confidence vs low-confidence classifications
  const highConfidence = ruleBasedResults.filter(r => r.confidence! >= 0.8)
  const lowConfidence = ruleBasedResults.filter(r => r.confidence! < 0.8)
  
  console.log(`📊 Rule-based: ${highConfidence.length} confident, ${lowConfidence.length} need AI review`)
  
  // Only send unclear cases to GPT (much faster!)
  if (lowConfidence.length === 0) {
    console.log(`⚡ All ${urls.length} URLs classified with high confidence - skipping GPT`)
    return ruleBasedResults.map(r => ({ ...r, confidence: undefined })) // Remove confidence from final result
  }
  
  // Use GPT only for unclear cases
  const unclearUrls = lowConfidence.map(r => ({
    url: r.url,
    title: r.title,
    snippet: r.snippet
  }))
  
  console.log(`🤖 Sending ${unclearUrls.length} unclear URLs to GPT-4o-mini...`)
  
  try {
    const gptResults = await classifyWithGPT(unclearUrls, targetDomain)
    
    // Merge results: high-confidence rule-based + GPT-reviewed
    const finalResults = [
      ...highConfidence.map(r => ({ ...r, confidence: undefined })),
      ...gptResults
    ]
    
    // Restore original order
    return urls.map(originalUrl => 
      finalResults.find(result => result.url === originalUrl.url)!
    )
    
  } catch (error) {
    console.log('⚡ GPT failed, using all rule-based results')
    return ruleBasedResults.map(r => ({ ...r, confidence: undefined }))
  }
}

/**
 * Gets confidence score for rule-based classification
 */
function getClassificationConfidence(
  item: { url: string; title: string; snippet: string },
  targetDomain: string
): number {
  const rootDomain = extractRootDomain(targetDomain)
  const urlObj = new URL(item.url)
  const urlDomain = urlObj.hostname.replace(/^www\./, '')
  
  // Very high confidence for exact/subdomain matches
  if (urlDomain === rootDomain || urlDomain.endsWith(`.${rootDomain}`)) {
    return 0.95
  }
  
  // High confidence for clear third-party domains
  const clearThirdParty = ['wikipedia.org', 'reddit.com', 'youtube.com', 'amazon.com', 'cnet.com']
  if (clearThirdParty.some(domain => urlDomain.includes(domain))) {
    return 0.9
  }
  
  // Medium confidence for likely operated domains
  if (isLikelyOperatedDomain(item.url, item.title, rootDomain)) {
    return 0.7
  }
  
  // Low confidence - needs GPT review
  return 0.5
}

/**
 * GPT classification for unclear cases only
 */
async function classifyWithGPT(
  urls: Array<{ url: string; title: string; snippet: string }>,
  targetDomain: string
): Promise<ClassificationResult[]> {
  const rootDomain = extractRootDomain(targetDomain)
  
  const systemPrompt = `URL classification for ${rootDomain}:

Owned: ${rootDomain} + subdomains  
Operated: Official social/business profiles
Earned: Everything else

JSON only: [{"url":"...","bucket":"Owned|Operated|Earned"}]`

  const userPrompt = `${urls.map((item, i) => `${i + 1}. ${item.url}`).join('\n')}`

  try {
    // GPT-4o-mini with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000) // 20 second timeout
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0,
      max_tokens: 3000,
    }, {
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)

    const content = response.choices[0]?.message?.content?.trim()
    if (!content) {
      throw new Error('Empty response from OpenAI')
    }

    // Extract JSON from content (handle markdown code blocks)
    let jsonContent = content
    
    // Remove markdown code blocks if present
    if (content.includes('```')) {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim()
      } else {
        jsonContent = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
      }
    }
    
    // Additional cleanup - ensure we start with [ and end with ]
    jsonContent = jsonContent.trim()
    if (!jsonContent.startsWith('[')) {
      const arrayStart = jsonContent.indexOf('[')
      if (arrayStart !== -1) {
        jsonContent = jsonContent.substring(arrayStart)
      } else {
        throw new Error('Incomplete JSON response - missing opening bracket')
      }
    }
    if (!jsonContent.endsWith(']')) {
      const arrayEnd = jsonContent.lastIndexOf(']')
      if (arrayEnd !== -1) {
        jsonContent = jsonContent.substring(0, arrayEnd + 1)
      } else {
        throw new Error('Incomplete JSON response - missing closing bracket')
      }
    }

    console.log('🔍 GPT JSON preview:', jsonContent.substring(0, 100) + '...')
    
    // Validate JSON structure before parsing
    if (!jsonContent.startsWith('[') || !jsonContent.endsWith(']')) {
      throw new Error('Invalid JSON structure - not a proper array')
    }

    const parsed = JSON.parse(jsonContent)
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid response format from OpenAI')
    }

    // Map back to our format with validation
    return urls.map((url, index) => {
      const classification = parsed[index]
      
      return {
        url: url.url,
        title: url.title,
        snippet: url.snippet,
        bucket: validateBucket(classification?.bucket) as 'Owned' | 'Operated' | 'Earned',
        reasoning: classification?.reasoning || 'AI classification'
      }
    })

  } catch (error) {
    console.error('GPT classification error:', error)
    throw error // Let the calling function handle fallback
  }
}

/**
 * Rule-based classification fallback
 */
function classifyByRules(
  item: { url: string; title: string; snippet: string },
  targetDomain: string
): ClassificationResult {
  const rootDomain = extractRootDomain(targetDomain)
  const urlObj = new URL(item.url)
  const urlDomain = urlObj.hostname.replace(/^www\./, '')
  
  let bucket: 'Owned' | 'Operated' | 'Earned'
  let reasoning: string
  
  // Check for exact domain match OR subdomain match
  if (urlDomain === rootDomain || urlDomain.endsWith(`.${rootDomain}`)) {
    bucket = 'Owned'
    reasoning = urlDomain === rootDomain ? 'Exact domain match' : `Subdomain of ${rootDomain}`
  } else if (isLikelyOperatedDomain(item.url, item.title, rootDomain)) {
    bucket = 'Operated'
    reasoning = 'Likely company-operated channel'
  } else {
    bucket = 'Earned'
    reasoning = 'Independent third-party content'
  }
  
  return {
    url: item.url,
    title: item.title,
    snippet: item.snippet,
    bucket,
    reasoning
  }
}

/**
 * Checks if a domain is likely operated by the company
 */
function isLikelyOperatedDomain(url: string, title: string, rootDomain: string): boolean {
  const lowerUrl = url.toLowerCase()
  const lowerTitle = title.toLowerCase()
  const brandName = rootDomain.split('.')[0].toLowerCase()
  
  // Social media platforms where companies have official profiles
  const operatedPatterns = [
    // Social media
    `linkedin.com/company/${brandName}`,
    `linkedin.com/in/${brandName}`,
    `twitter.com/${brandName}`,
    `x.com/${brandName}`,
    `facebook.com/${brandName}`,
    `instagram.com/${brandName}`,
    `youtube.com/@${brandName}`,
    `youtube.com/channel/`,
    `youtube.com/c/${brandName}`,
    
    // Business directories
    `g2.com/products/${brandName}`,
    `capterra.com/p/`,
    `trustpilot.com/review/`,
    `glassdoor.com/Overview/Working-at-${brandName}`,
    
    // Developer platforms
    `github.com/${brandName}`,
    `npmjs.com/package/${brandName}`,
    
    // App stores
    `apps.apple.com/`,
    `play.google.com/store/apps/`,
    
    // Professional networks
    `crunchbase.com/organization/${brandName}`,
    `angel.co/company/${brandName}`
  ]
  
  // Check if URL matches known operated patterns
  if (operatedPatterns.some(pattern => lowerUrl.includes(pattern))) {
    return true
  }
  
  // Check if title suggests official company presence
  const officialTitlePatterns = [
    `${brandName} -`,
    `${brandName} |`,
    `${brandName} on `,
    `${brandName} - official`,
    `${brandName} company`
  ]
  
  return officialTitlePatterns.some(pattern => lowerTitle.includes(pattern))
}

/**
 * Extracts root domain from URL
 */
function extractRootDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
    return urlObj.hostname.replace(/^www\./, '')
  } catch {
    return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]
  }
}

/**
 * Validates and normalizes bucket classification
 */
function validateBucket(bucket: any): string {
  const normalized = String(bucket).toLowerCase()
  
  if (normalized.includes('owned')) return 'Owned'
  if (normalized.includes('operated')) return 'Operated'
  if (normalized.includes('earned')) return 'Earned'
  
  // Default to Earned for safety
  return 'Earned'
} 
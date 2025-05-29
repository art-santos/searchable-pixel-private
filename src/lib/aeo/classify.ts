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
  const batchSize = 100 // Process in batches of 100 URLs
  
  for (let i = 0; i < urlsToClassify.length; i += batchSize) {
    const batch = urlsToClassify.slice(i, i + batchSize)
    console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(urlsToClassify.length / batchSize)}`)
    
    try {
      const batchResults = await classifyBatch(batch, targetDomain)
      classifications.push(...batchResults)
      
      onProgress?.(classifications.length, urlsToClassify.length)
      
    } catch (error) {
      console.error('❌ Batch classification failed:', error)
      
      // Fallback: rule-based classification for this batch
      const fallbackResults = batch.map(item => classifyByRules(item, targetDomain))
      classifications.push(...fallbackResults)
      
      onProgress?.(classifications.length, urlsToClassify.length)
    }
    
    // Small delay between batches to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 200))
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
 * Classifies a batch of URLs using OpenAI
 */
async function classifyBatch(
  urls: Array<{ url: string; title: string; snippet: string }>,
  targetDomain: string
): Promise<ClassificationResult[]> {
  const rootDomain = extractRootDomain(targetDomain)
  
  const systemPrompt = `You are a domain classification expert. Your task is to classify URLs into three categories:

**Owned**: Same root domain as the target (including ALL subdomains)
**Operated**: Company-controlled channels that the target company likely operates (social media profiles, marketplace listings, etc.)
**Earned**: Independent third-party content

Target domain: ${rootDomain}

Classification Rules:
- Owned: ${rootDomain} or ANY subdomain like platform.${rootDomain}, community.${rootDomain}, help.${rootDomain}, api.${rootDomain}, etc.
- Operated: Official company presence on external platforms (LinkedIn company pages, Twitter accounts, YouTube channels, etc.)
- Earned: All other independent third-party content (tutorials, reviews, news articles, etc.)

IMPORTANT: Subdomains like community.${rootDomain}, platform.${rootDomain}, help.${rootDomain} are OWNED, not earned!

Respond with a JSON array preserving the input order:
[{"url": "...", "bucket": "Owned|Operated|Earned", "reasoning": "brief explanation"}, ...]

JSON ONLY - NO OTHER TEXT.`

  const userPrompt = `Classify these ${urls.length} URLs for target domain: ${rootDomain}

URLs to classify:
${urls.map((item, i) => `${i + 1}. ${item.url}\n   Title: ${item.title}\n   Snippet: ${item.snippet.substring(0, 100)}...`).join('\n\n')}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 3000,
    })

    const content = response.choices[0]?.message?.content?.trim()
    if (!content) {
      throw new Error('Empty response from OpenAI')
    }

    // Extract JSON from content (handle markdown code blocks)
    let jsonContent = content
    const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/)
    if (jsonMatch) {
      jsonContent = jsonMatch[1]
    } else if (content.startsWith('```') && content.endsWith('```')) {
      jsonContent = content.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
    }

    console.log('🔍 OpenAI classification response preview:', jsonContent.substring(0, 200) + '...')

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
    console.error('OpenAI classification error:', error)
    
    // Fallback to rule-based classification
    console.log('🔄 Using fallback rule-based classification...')
    return urls.map(url => classifyByRules(url, targetDomain))
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
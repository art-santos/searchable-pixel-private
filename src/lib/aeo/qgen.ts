import OpenAI from 'openai'
import { saveAeoQuestions } from '../onboarding/database'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface CrawlSnapshot {
  url: string
  results: Array<{
    url: string
    title: string
    content: string
    markdown: string
    metadata?: {
      description?: string
      [key: string]: any
    }
  }>
}

export interface QuestionSet {
  questions: string[]
  metadata: {
    generated_at: string
    source_url: string
    total_questions: number
    content_analyzed_chars: number
  }
}

/**
 * Generates 50 diverse search questions from crawl data (30% direct, 70% indirect)
 * Optionally saves to database if runId is provided
 */
export async function generateQuestions(
  crawlData: CrawlSnapshot, 
  runId?: string
): Promise<QuestionSet> {
  console.log('🧠 Starting question generation for:', crawlData.url)
  
  // Prepare site summary (first 12k tokens of content + titles)
  const siteSummary = prepareSiteSummary(crawlData)
  console.log(`📊 Prepared site summary: ${siteSummary.length} characters`)
  
  // Generate questions using OpenAI (now with improved direct/indirect mix)
  const questions = await callOpenAI(siteSummary, crawlData.url)
  
  // Post-process: deduplicate and validate
  const processedQuestions = await postProcessQuestions(questions)
  
  const result: QuestionSet = {
    questions: processedQuestions,
    metadata: {
      generated_at: new Date().toISOString(),
      source_url: crawlData.url,
      total_questions: processedQuestions.length,
      content_analyzed_chars: siteSummary.length
    }
  }
  
  // Save to database if runId is provided
  if (runId && processedQuestions.length > 0) {
    try {
      console.log(`💾 Saving ${processedQuestions.length} questions to database...`)
      const saveResult = await saveAeoQuestions(runId, processedQuestions)
      
      if (saveResult.success) {
        console.log('✅ Questions saved to database successfully')
      } else {
        console.error('❌ Failed to save questions to database:', saveResult.error)
      }
    } catch (error) {
      console.error('❌ Error saving questions to database:', error)
    }
  }
  
  console.log(`✅ Generated ${processedQuestions.length} total questions (mix of direct brand-specific + indirect competitive)`)
  return result
}

/**
 * Prepares a concise site summary for question generation
 */
function prepareSiteSummary(crawlData: CrawlSnapshot): string {
  let summary = ''
  let charCount = 0
  const maxChars = 12000 // ~3k tokens
  
  // Add site URL and main titles first
  summary += `Target Website: ${crawlData.url}\n\n`
  
  // Extract titles (up to 25)
  const titles = crawlData.results
    .map(r => r.title)
    .filter(Boolean)
    .slice(0, 25)
  
  if (titles.length > 0) {
    summary += `Page Titles:\n${titles.map(t => `- ${t}`).join('\n')}\n\n`
  }
  
  // Add content from pages, prioritizing main content
  summary += `Content Overview:\n`
  
  for (const result of crawlData.results) {
    if (charCount >= maxChars) break
    
    const content = result.content || result.markdown || ''
    const description = result.metadata?.description || ''
    
    // Prioritize structured content
    let pageContent = ''
    if (description) {
      pageContent += `Description: ${description}\n`
    }
    
    // Add main content (first 1000 chars per page)
    const mainContent = content
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 1000)
    
    if (mainContent) {
      pageContent += `Content: ${mainContent}\n`
    }
    
    if (pageContent && (charCount + pageContent.length) <= maxChars) {
      summary += `\nPage: ${result.url}\n${pageContent}\n`
      charCount += pageContent.length
    }
  }
  
  return summary.substring(0, maxChars)
}

/**
 * Calls OpenAI to generate questions with improved direct/indirect mix
 */
async function callOpenAI(siteSummary: string, siteUrl: string): Promise<string[]> {
  // Extract company/brand name for direct questions
  const domain = siteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  const brandName = domain.split('.')[0]
  
  // Determine question counts (50% direct, 50% indirect for more balanced analysis) 
  const totalQuestions = 50
  const directCount = Math.ceil(totalQuestions * 0.5) // ~25 questions
  const indirectCount = totalQuestions - directCount // ~25 questions

  const systemPrompt = `You are an expert AEO (Answer Engine Optimization) analyst. Your task is to generate exactly 50 high-quality search questions for competitive visibility analysis.

CRITICAL REQUIREMENTS:
1. Generate EXACTLY 50 questions total
2. Split: 25 direct (brand-specific) + 25 indirect (competitive)
3. Each question must be 10-75 characters
4. Questions must be realistic search queries that real users would type
5. Direct questions MUST mention "${brandName}" explicitly
6. Indirect questions must NOT mention any brand names

DIRECT QUESTIONS (25 total):
- About ${brandName} specifically: pricing, features, reviews, comparisons
- Examples: "What is ${brandName}?", "${brandName} pricing", "${brandName} vs competitors"

INDIRECT QUESTIONS (25 total):  
- Generic industry/use case searches where competitors fight for visibility
- Examples: "best AI platforms", "enterprise automation tools", "AI customer service solutions"
- NO brand names mentioned

OUTPUT FORMAT:
Return ONLY valid JSON in this exact format:
{"questions": ["question 1", "question 2", ..., "question 50"]}

NO explanatory text. NO markdown. ONLY the JSON object.`

  const userPrompt = `Analyze this website and generate 50 search questions:

TARGET: ${siteUrl}
BRAND: ${brandName}

CONTENT SUMMARY:
${siteSummary}

Generate 25 ${brandName}-specific questions + 25 competitive industry questions.`

  try {
    console.log(`🤖 Calling OpenAI GPT-4o to generate questions for ${brandName}...`)
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Upgraded from gpt-4o-mini for better quality
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8, // Higher creativity for diverse questions
      max_tokens: 2000,
    })

    const content = response.choices[0]?.message?.content?.trim()
    if (!content) {
      throw new Error('Empty response from OpenAI')
    }

    console.log('🔍 Raw OpenAI response:', content.substring(0, 300) + '...')

    // Extract JSON from content (handle markdown code blocks)
    let jsonContent = content
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
    if (jsonMatch) {
      jsonContent = jsonMatch[1]
    } else if (content.startsWith('```') && content.endsWith('```')) {
      jsonContent = content.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
    }

    console.log('🔍 Extracted JSON preview:', jsonContent.substring(0, 200) + '...')

    // Parse JSON response
    let parsed
    try {
      parsed = JSON.parse(jsonContent)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      throw new Error(`Failed to parse JSON: ${parseError}`)
    }

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error(`Invalid response format. Expected {questions: [...]} but got: ${JSON.stringify(parsed).substring(0, 200)}`)
    }

    // Validate question quality
    const validQuestions = parsed.questions.filter((q: string) => 
      typeof q === 'string' && 
      q.length >= 10 && 
      q.length <= 75 &&
      q.includes(' ') && // Must have spaces (not single words)
      !q.match(/^(what is \w+|how to \w+)$/i) // Not overly generic
    )

    if (validQuestions.length < 30) {
      throw new Error(`Only ${validQuestions.length} valid questions generated, need at least 30`)
    }

    console.log(`🤖 OpenAI generated ${validQuestions.length} valid questions`)
    return validQuestions

  } catch (error) {
    console.error('🚨 OpenAI API error:', error)
    
    // Improved fallback: try again with simpler prompt first
    console.log('🔄 Retrying with simplified prompt...')
    return await retryWithSimplifiedPrompt(siteSummary, siteUrl)
  }
}

/**
 * Post-processes questions: deduplicate, validate, trim
 */
async function postProcessQuestions(questions: string[]): Promise<string[]> {
  // Clean and validate questions
  const cleaned = questions
    .map(q => q.trim())
    .filter(q => q.length > 5 && q.length <= 75)
    .filter(q => /^[a-zA-Z0-9\s\?\-\_\.\,\'\"\(\)]+$/.test(q)) // Basic validation
  
  // Simple deduplication (case-insensitive)
  const seen = new Set<string>()
  const unique = cleaned.filter(q => {
    const key = q.toLowerCase().replace(/[^\w\s]/g, '').trim()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  
  // Ensure we have at least 30 questions
  if (unique.length < 30) {
    console.warn(`⚠️ Only ${unique.length} unique questions generated`)
  }
  
  // Return up to 50 questions
  return unique.slice(0, 50)
}

/**
 * Fallback question generation when OpenAI fails
 */
function generateFallbackQuestions(siteSummary: string, siteUrl: string): string[] {
  const domain = siteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  const brandName = domain.split('.')[0]
  
  // Use the improved fallback instead of the broken topic extraction
  console.log('🔄 Using improved fallback question generation...')
  return generateImprovedFallbackQuestions(brandName)
}

/**
 * Retry with simplified prompt when main generation fails
 */
async function retryWithSimplifiedPrompt(siteSummary: string, siteUrl: string): Promise<string[]> {
  const domain = siteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  const brandName = domain.split('.')[0]

  const simplifiedPrompt = `Generate 50 search questions about ${brandName} and ${brandName}'s industry.

Mix of:
- 25 brand questions mentioning "${brandName}" (examples: "What is ${brandName}?", "${brandName} pricing", "${brandName} features")  
- 25 industry questions NOT mentioning any brand names (examples: "best AI tools", "enterprise software platforms", "automation solutions")

Return as JSON: {"questions": ["question 1", "question 2", ...]}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [{ role: 'user', content: simplifiedPrompt }],
      temperature: 0.7,
      max_tokens: 1500,
    })

    const content = response.choices[0]?.message?.content?.trim()
    if (content) {
      const parsed = JSON.parse(content)
      if (parsed.questions && Array.isArray(parsed.questions)) {
        console.log(`🔄 Simplified prompt generated ${parsed.questions.length} questions`)
        return parsed.questions.slice(0, 50)
      }
    }
  } catch (retryError) {
    console.error('Simplified prompt also failed:', retryError)
  }

  // Final fallback: generate decent questions manually
  console.log('🔄 Using improved manual fallback...')
  return generateImprovedFallbackQuestions(brandName)
}

/**
 * Generates improved fallback questions when AI fails
 */
function generateImprovedFallbackQuestions(brandName: string): string[] {
  // High-quality brand questions
  const brandQuestions = [
    `What is ${brandName}?`,
    `${brandName} pricing`,
    `${brandName} vs competitors`,
    `How does ${brandName} work?`,
    `${brandName} features`,
    `${brandName} API documentation`,
    `How to get started with ${brandName}`,
    `${brandName} customer support`,
    `${brandName} use cases`,
    `${brandName} integration guide`,
    `${brandName} review`,
    `${brandName} tutorial`,
    `${brandName} login`,
    `${brandName} account setup`,
    `${brandName} business solutions`,
    `${brandName} enterprise pricing`,
    `${brandName} security features`,
    `${brandName} updates and news`,
    `${brandName} partnerships`,
    `${brandName} success stories`,
    `${brandName} trial version`,
    `${brandName} implementation guide`,
    `${brandName} best practices`,
    `${brandName} troubleshooting`,
    `${brandName} alternatives`
  ]

  // High-quality industry questions (competitive)
  const industryQuestions = [
    'best AI platforms for business',
    'enterprise automation tools',
    'top artificial intelligence solutions',
    'business intelligence software',
    'cloud-based AI services',
    'AI tools for productivity',
    'machine learning platforms',
    'data analysis software',
    'customer service automation',
    'AI content generation tools',
    'intelligent chatbot platforms',
    'automated workflow solutions',
    'business process automation',
    'AI-powered analytics',
    'enterprise AI integration',
    'artificial intelligence APIs',
    'AI development platforms',
    'smart business tools',
    'AI customer engagement',
    'automated decision making',
    'AI project management',
    'intelligent data processing',
    'AI marketing automation',
    'business AI implementation',
    'AI software comparison'
  ]

  // Combine and ensure we have 50 questions
  const allQuestions = [...brandQuestions, ...industryQuestions]
  return allQuestions.slice(0, 50)
} 
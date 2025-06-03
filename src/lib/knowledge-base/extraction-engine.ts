// GPT-4o Knowledge Extraction Engine
import { ExtractedKnowledge, ExtractionResult, AVAILABLE_TAGS } from './types'
import { randomUUID } from 'crypto'

interface GPT4oResponse {
  extracted_items: {
    content: string
    tag: string
    confidence: number
    reasoning: string
  }[]
}

export class KnowledgeExtractionEngine {
  private openaiApiKey: string | null

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || null
  }

  /**
   * Extract knowledge items from a text dump using GPT-4o or fallback method
   */
  async extractFromTextDump(textDump: string): Promise<ExtractionResult> {
    const startTime = Date.now()
    const batchId = this.generateBatchId()
    const uploadTimestamp = new Date().toISOString()
    
    try {
      // Pre-process the text
      const processedText = this.preprocessText(textDump)
      
      let extractedItems: ExtractedKnowledge[]
      
      // Try GPT-4o extraction if API key is available, otherwise use fallback
      if (this.openaiApiKey) {
        try {
          extractedItems = await this.callGPT4oExtraction(processedText, uploadTimestamp)
        } catch (error) {
          console.warn('GPT-4o extraction failed, falling back to rule-based extraction:', error)
          extractedItems = this.fallbackExtraction(processedText, uploadTimestamp)
        }
      } else {
        console.info('No OpenAI API key found, using rule-based extraction')
        extractedItems = this.fallbackExtraction(processedText, uploadTimestamp)
      }
      
      // Post-process and validate
      const validatedItems = this.validateExtractions(extractedItems, processedText, uploadTimestamp)
      
      const processingTime = Date.now() - startTime
      
      return {
        extractedItems: validatedItems,
        batchId,
        processingTime,
        totalWordCount: textDump.trim().split(' ').length
      }
    } catch (error) {
      console.error('Knowledge extraction failed:', error)
      throw new Error(`Extraction failed: ${(error as Error).message}`)
    }
  }

  /**
   * Call GPT-4o for intelligent extraction
   */
  private async callGPT4oExtraction(text: string, uploadTimestamp: string): Promise<ExtractedKnowledge[]> {
    const prompt = this.buildExtractionPrompt(text)
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert business analyst who extracts structured insights from company information. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content received from GPT-4o')
    }

    try {
      const parsed: GPT4oResponse = JSON.parse(content)
      
      return parsed.extracted_items.map(item => ({
        content: item.content.trim(),
        tag: this.validateTag(item.tag),
        confidence: Math.max(0, Math.min(1, item.confidence)),
        reasoning: item.reasoning,
        sourceContext: this.extractSourceContext(item.content, text),
        created_at: uploadTimestamp,
        updated_at: uploadTimestamp
      }))
    } catch (error) {
      throw new Error(`Failed to parse GPT-4o response: ${content}`)
    }
  }

  /**
   * Build the extraction prompt for GPT-4o
   */
  private buildExtractionPrompt(text: string): string {
    return `
Analyze this company information and extract knowledge items while preserving as much detail and context as possible. The goal is to maintain comprehensive information for future AI analysis.

TEXT TO ANALYZE:
"${text}"

EXTRACTION INSTRUCTIONS:
1. Extract meaningful sections/paragraphs of information as complete knowledge items
2. Preserve full context, details, and nuance - DO NOT summarize or condense
3. Keep natural paragraph length - can be multiple sentences when the information belongs together
4. Assign each section to the most appropriate category:
   - company-overview: Core business description, what the company does, company story
   - target-audience: Who the customers/users are, demographics, company types, market segments
   - pain-points: Problems customers face, challenges addressed, market gaps
   - positioning: How company differentiates, unique value props, competitive advantages
   - product-features: Specific capabilities, features, functionalities, technical details
   - use-cases: How customers use the product, scenarios, applications, case studies
   - competitor-notes: Mentions of competitors, competitive positioning, market analysis
   - sales-objections: Common objections and responses, pricing concerns, feature comparisons
   - brand-voice: Tone, messaging style, communication guidelines, copy examples
   - keywords: Important terms, phrases, industry jargon, technical terminology (SEPARATE WITH COMMA)
   - other: Information that doesn't fit other categories

5. Maintain full detail and context - this is a knowledge base for AI context, not human summaries
6. Split only when topics clearly change, not to artificially create more items
7. Provide confidence score (0-1) for each categorization

RESPOND IN THIS EXACT JSON FORMAT:
{
  "extracted_items": [
    {
      "content": "Full detailed section with complete context preserved",
      "tag": "appropriate-category",
      "confidence": 0.95,
      "reasoning": "Why this categorization makes sense"
    }
  ]
}
`
  }

  /**
   * Pre-process text to clean and optimize for extraction
   */
  private preprocessText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s.,!?;:()"'-]/g, '') // Remove unusual characters
      .substring(0, 4000) // Limit length for API
  }

  /**
   * Validate and clean extracted items
   */
  private validateExtractions(items: ExtractedKnowledge[], originalText: string, uploadTimestamp: string): ExtractedKnowledge[] {
    return items
      .filter(item => {
        // Must have content
        if (!item.content || item.content.length < 10) return false
        
        // Must have valid tag
        if (!AVAILABLE_TAGS.includes(item.tag as any)) return false
        
        // Must have reasonable confidence
        if (item.confidence < 0.3) return false
        
        return true
      })
      .map(item => ({
        ...item,
        content: this.cleanContent(item.content),
        sourceContext: item.sourceContext || this.extractSourceContext(item.content, originalText),
        created_at: item.created_at || uploadTimestamp,
        updated_at: item.updated_at || uploadTimestamp
      }))
      .slice(0, 20) // Limit to 20 items per extraction
  }

  /**
   * Validate tag is in allowed list
   */
  private validateTag(tag: string): string {
    const normalizedTag = tag.toLowerCase().replace(/[^a-z-]/g, '-')
    return AVAILABLE_TAGS.includes(normalizedTag as any) ? normalizedTag : 'other'
  }

  /**
   * Clean extracted content
   */
  private cleanContent(content: string): string {
    return content
      .trim()
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/\s+/g, ' ') // Normalize whitespace
  }

  /**
   * Extract source context for an item
   */
  private extractSourceContext(content: string, originalText: string): string {
    // Find the content in the original text and extract surrounding context
    const contentWords = content.toLowerCase().split(' ').slice(0, 3)
    const originalLower = originalText.toLowerCase()
    
    for (const word of contentWords) {
      if (word.length > 3) {
        const index = originalLower.indexOf(word)
        if (index !== -1) {
          const start = Math.max(0, index - 50)
          const end = Math.min(originalText.length, index + 100)
          return originalText.substring(start, end).trim()
        }
      }
    }
    
    // Fallback: return first 100 characters of original text
    return originalText.substring(0, 100).trim()
  }

  /**
   * Generate a unique batch ID for grouped extractions
   */
  private generateBatchId(): string {
    return randomUUID()
  }

  /**
   * Estimate number of items that might be extracted
   */
  static estimateExtractionCount(text: string): number {
    const wordCount = text.trim().split(' ').length
    const sentenceCount = text.split(/[.!?]+/).length
    
    // Rough estimation: 1 item per 20-50 words, or 1 per 2-3 sentences
    const wordEstimate = Math.floor(wordCount / 30)
    const sentenceEstimate = Math.floor(sentenceCount / 2.5)
    
    return Math.min(20, Math.max(1, Math.max(wordEstimate, sentenceEstimate)))
  }

  /**
   * Fallback extraction method using rule-based approach
   */
  private fallbackExtraction(text: string, uploadTimestamp: string): ExtractedKnowledge[] {
    const items: ExtractedKnowledge[] = []
    
    // Split text into sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20)
    
    for (const sentence of sentences) {
      const cleanSentence = sentence.trim()
      if (cleanSentence.length < 20 || cleanSentence.length > 300) continue
      
      // Simple rule-based categorization
      const tag = this.categorizeTextRuleBased(cleanSentence)
      
      items.push({
        content: cleanSentence,
        tag,
        confidence: 0.7, // Medium confidence for rule-based extraction
        reasoning: 'Rule-based categorization',
        sourceContext: this.extractSourceContext(cleanSentence, text),
        created_at: uploadTimestamp,
        updated_at: uploadTimestamp
      })
      
      // Limit to 15 items
      if (items.length >= 15) break
    }
    
    // If we got very few items, try paragraph-based extraction
    if (items.length < 3) {
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 50)
      
      for (const paragraph of paragraphs) {
        const cleanParagraph = paragraph.trim()
        if (cleanParagraph.length > 500) continue
        
        const tag = this.categorizeTextRuleBased(cleanParagraph)
        
        items.push({
          content: cleanParagraph,
          tag,
          confidence: 0.6,
          reasoning: 'Paragraph-based categorization',
          sourceContext: cleanParagraph.substring(0, 100),
          created_at: uploadTimestamp,
          updated_at: uploadTimestamp
        })
        
        if (items.length >= 10) break
      }
    }
    
    return items
  }

  /**
   * Simple rule-based text categorization
   */
  private categorizeTextRuleBased(text: string): string {
    const lowerText = text.toLowerCase()
    
    // Company overview keywords
    if (this.containsKeywords(lowerText, ['company', 'business', 'organization', 'we are', 'founded', 'startup', 'platform', 'solution'])) {
      return 'company-overview'
    }
    
    // Target audience keywords
    if (this.containsKeywords(lowerText, ['customers', 'users', 'clients', 'target', 'audience', 'market', 'demographic', 'enterprise', 'b2b', 'b2c'])) {
      return 'target-audience'
    }
    
    // Pain points keywords
    if (this.containsKeywords(lowerText, ['problem', 'challenge', 'issue', 'struggle', 'difficulty', 'pain', 'frustration', 'obstacle'])) {
      return 'pain-points'
    }
    
    // Product features keywords
    if (this.containsKeywords(lowerText, ['feature', 'capability', 'function', 'tool', 'integration', 'api', 'dashboard', 'analytics', 'reporting'])) {
      return 'product-features'
    }
    
    // Use cases keywords
    if (this.containsKeywords(lowerText, ['use case', 'scenario', 'example', 'application', 'implementation', 'workflow', 'process'])) {
      return 'use-cases'
    }
    
    // Positioning keywords
    if (this.containsKeywords(lowerText, ['unique', 'different', 'competitive', 'advantage', 'unlike', 'better', 'superior', 'leading'])) {
      return 'positioning'
    }
    
    // Competitor keywords
    if (this.containsKeywords(lowerText, ['competitor', 'competition', 'vs', 'compared', 'alternative', 'versus', 'rival'])) {
      return 'competitor-notes'
    }
    
    // Sales objections keywords
    if (this.containsKeywords(lowerText, ['objection', 'concern', 'worry', 'doubt', 'hesitation', 'risk', 'cost', 'price'])) {
      return 'sales-objections'
    }
    
    // Brand voice keywords
    if (this.containsKeywords(lowerText, ['tone', 'voice', 'messaging', 'communication', 'brand', 'style', 'personality'])) {
      return 'brand-voice'
    }
    
    // Keywords category
    if (this.containsKeywords(lowerText, ['keyword', 'seo', 'search', 'term', 'phrase', 'optimization'])) {
      return 'keywords'
    }
    
    // Default to other
    return 'other'
  }

  /**
   * Check if text contains any of the given keywords
   */
  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword))
  }
} 
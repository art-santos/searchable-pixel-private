import { MaxQuestionAnalysis, MaxQuestionType, MaxAssessmentRequest } from '@/types/max-visibility'
import { GPT4oAnalysisData } from '../types/pipeline-types'

export class GPT4oAnalyzer {
  private gpt4oAnalysisCache: Map<string, any>

  constructor() {
    this.gpt4oAnalysisCache = new Map()
  }

  /**
   * Analyze responses with GPT-4o
   */
  async analyzeWithGPT4o(
    responses: Array<{ question: any, response: string, citations: string[] }>,
    request: MaxAssessmentRequest,
    assessmentId: string
  ): Promise<MaxQuestionAnalysis[]> {
    console.log(`🤖 Starting GPT-4o analysis for ${responses.length} responses`)
    
    const analyses: MaxQuestionAnalysis[] = []
    
    for (const [index, responseData] of responses.entries()) {
      console.log(`📝 Analyzing response ${index + 1}/${responses.length}`)
      
      try {
        const analysis = await this.callGPT4oAnalyzer({
          company: request.company,
          question: responseData.question.question,
          aiResponse: responseData.response,
          citations: responseData.citations
        })
        
        // Validate and create structured analysis
        this.validateGPT4oAnalysis(analysis)
        
        const structuredAnalysis: MaxQuestionAnalysis = {
          question_id: responseData.question.id,
          question_text: responseData.question.question,
          question_type: responseData.question.type,
          ai_response: responseData.response,
          citations: responseData.citations,
          mention_analysis: {
            mentions: analysis.mention_analysis?.mentions || 0,
            quality_score: analysis.mention_analysis?.quality_score || 0,
            sentiment: analysis.mention_analysis?.sentiment || 'neutral',
            context_relevance: analysis.mention_analysis?.context_relevance || 0,
            influence_score: analysis.mention_analysis?.influence_score || 0,
            credibility_indicators: analysis.mention_analysis?.credibility_indicators || []
          },
          competitive_analysis: {
            competitors: analysis.competitive_analysis?.competitors || [],
            positioning: analysis.competitive_analysis?.positioning || 'unknown',
            differentiation: analysis.competitive_analysis?.differentiation || [],
            market_gaps: analysis.competitive_analysis?.market_gaps || []
          },
          question_metadata: {
            difficulty: analysis.question_metadata?.difficulty || 'medium',
            topic_area: analysis.question_metadata?.topic_area || 'general',
            business_relevance: analysis.question_metadata?.business_relevance || 50
          }
        }
        
        analyses.push(structuredAnalysis)
        console.log(`✅ Analysis ${index + 1} completed`)
        
      } catch (error) {
        console.error(`❌ Failed to analyze response ${index + 1}:`, error)
        
        // Create fallback analysis
        const fallbackAnalysis = this.createFallbackAnalysis({
          company: request.company,
          question: responseData.question.question,
          aiResponse: responseData.response,
          citations: responseData.citations
        })
        
        analyses.push(fallbackAnalysis)
      }
      
      // Rate limiting
      if (index < responses.length - 1) {
        await this.sleep(1000) // 1 second between calls
      }
    }
    
    console.log(`🎯 GPT-4o analysis completed: ${analyses.length} analyses`)
    return analyses
  }

  /**
   * Call GPT-4o analyzer with structured prompt
   */
  private async callGPT4oAnalyzer(data: GPT4oAnalysisData): Promise<any> {
    const cacheKey = `${data.company.name}-${data.question.substring(0, 50)}`
    
    if (this.gpt4oAnalysisCache.has(cacheKey)) {
      console.log('📋 Using cached GPT-4o analysis')
      return this.gpt4oAnalysisCache.get(cacheKey)
    }

    const prompt = this.buildAnalysisPrompt(data)
    
    try {
      // Note: This would be replaced with actual OpenAI API call
      const response = await this.callOpenAI(prompt)
      
      let analysis
      try {
        analysis = JSON.parse(response)
      } catch (parseError) {
        console.error('❌ Failed to parse GPT-4o response as JSON:', parseError)
        throw new Error('Invalid JSON response from GPT-4o')
      }
      
      // Cache the result
      this.gpt4oAnalysisCache.set(cacheKey, analysis)
      
      return analysis
      
    } catch (error) {
      console.error('❌ GPT-4o API call failed:', error)
      throw error
    }
  }

  /**
   * Build structured analysis prompt for GPT-4o
   */
  private buildAnalysisPrompt(data: GPT4oAnalysisData): string {
    return `
You are an expert business intelligence analyst. Analyze this AI-generated response about a company's visibility in search results.

**Company:** ${data.company.name}
**Domain:** ${data.company.domain}
**Question:** ${data.question}

**AI Response to Analyze:**
${data.aiResponse}

**Citations:**
${data.citations.map((citation, index) => `${index + 1}. ${citation}`).join('\n')}

Please provide a comprehensive analysis in the following JSON format:

{
  "mention_analysis": {
    "mentions": <number of company mentions>,
    "quality_score": <0-100 score for mention quality>,
    "sentiment": "<positive|neutral|negative>",
    "context_relevance": <0-100 score for context relevance>,
    "influence_score": <0-100 score for influence/authority>,
    "credibility_indicators": ["<indicator1>", "<indicator2>"]
  },
  "competitive_analysis": {
    "competitors": [
      {
        "name": "<competitor name>",
        "domain": "<competitor domain if mentioned>",
        "positioning": "<how they're positioned vs the company>",
        "mentions": <number of mentions>
      }
    ],
    "positioning": "<underdog|leader|challenger|niche>",
    "differentiation": ["<key differentiator1>", "<key differentiator2>"],
    "market_gaps": ["<gap1>", "<gap2>"]
  },
  "question_metadata": {
    "difficulty": "<easy|medium|hard|expert>",
    "topic_area": "<category like 'product features', 'pricing', 'integration'>",
    "business_relevance": <0-100 score for business importance>
  }
}

Focus on:
1. Accurate counting of company mentions vs competitors
2. Quality assessment based on context and authority
3. Competitive positioning and differentiation
4. Business relevance and difficulty assessment

Respond with valid JSON only.
`
  }

  /**
   * Mock OpenAI API call (replace with actual implementation)
   */
  private async callOpenAI(prompt: string): Promise<string> {
    // This is a mock implementation
    // In production, this would call the actual OpenAI API
    return JSON.stringify({
      mention_analysis: {
        mentions: Math.floor(Math.random() * 5) + 1,
        quality_score: Math.floor(Math.random() * 40) + 60,
        sentiment: 'positive',
        context_relevance: Math.floor(Math.random() * 30) + 70,
        influence_score: Math.floor(Math.random() * 40) + 60,
        credibility_indicators: ['authoritative source', 'detailed explanation']
      },
      competitive_analysis: {
        competitors: [
          {
            name: 'Competitor A',
            domain: 'competitor-a.com',
            positioning: 'alternative solution',
            mentions: 2
          }
        ],
        positioning: 'challenger',
        differentiation: ['unique feature', 'better pricing'],
        market_gaps: ['enterprise features', 'mobile app']
      },
      question_metadata: {
        difficulty: 'medium',
        topic_area: 'product features',
        business_relevance: 85
      }
    })
  }

  /**
   * Validate GPT-4o analysis structure
   */
  private validateGPT4oAnalysis(analysis: any): void {
    if (!analysis.mention_analysis) {
      throw new Error('Missing mention_analysis in GPT-4o response')
    }
    
    if (!analysis.competitive_analysis) {
      throw new Error('Missing competitive_analysis in GPT-4o response')
    }
    
    if (!analysis.question_metadata) {
      throw new Error('Missing question_metadata in GPT-4o response')
    }
    
    // Additional validation can be added here
  }

  /**
   * Create fallback analysis when GPT-4o fails
   */
  private createFallbackAnalysis(data: GPT4oAnalysisData): MaxQuestionAnalysis {
    console.log('🔧 Creating fallback analysis')
    
    return {
      question_id: `fallback-${Date.now()}`,
      question_text: data.question,
      question_type: 'general' as MaxQuestionType,
      ai_response: data.aiResponse,
      citations: data.citations,
      mention_analysis: {
        mentions: this.countCompanyMentions(data.aiResponse, data.company.name),
        quality_score: 50, // Neutral score
        sentiment: 'neutral',
        context_relevance: 50,
        influence_score: 50,
        credibility_indicators: []
      },
      competitive_analysis: {
        competitors: [],
        positioning: 'unknown',
        differentiation: [],
        market_gaps: []
      },
      question_metadata: {
        difficulty: 'medium',
        topic_area: 'general',
        business_relevance: 50
      }
    }
  }

  /**
   * Simple company mention counter for fallback
   */
  private countCompanyMentions(text: string, companyName: string): number {
    const lowercaseText = text.toLowerCase()
    const lowercaseCompany = companyName.toLowerCase()
    
    const regex = new RegExp(lowercaseCompany, 'g')
    const matches = lowercaseText.match(regex)
    
    return matches ? matches.length : 0
  }

  /**
   * Convert sentiment string to numeric score
   */
  convertSentimentToScore(sentiment: string): number {
    const sentimentMap: Record<string, number> = {
      'positive': 80,
      'neutral': 50,
      'negative': 20
    }
    
    return sentimentMap[sentiment.toLowerCase()] || 50
  }

  /**
   * Sleep utility for rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Clear analysis cache (useful for testing)
   */
  clearCache(): void {
    this.gpt4oAnalysisCache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.gpt4oAnalysisCache.size,
      keys: Array.from(this.gpt4oAnalysisCache.keys())
    }
  }
} 
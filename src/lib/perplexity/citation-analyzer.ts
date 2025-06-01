// Citation Analysis for MAX Visibility System
// Classifies and scores citations from Perplexity responses

import { 
  CitationAnalysisRequest,
  CitationClassificationResult,
  CitationBucket,
  MaxVisibilityError
} from '@/types/max-visibility'

interface DomainClassification {
  bucket: CitationBucket
  confidence: number
  reasoning: string
}

export class CitationAnalyzer {
  private knownPlatforms: Record<string, CitationBucket>
  private socialPlatforms: string[]
  private businessDirectories: string[]

  constructor() {
    this.knownPlatforms = {
      // Social media platforms (typically operated)
      'linkedin.com': 'operated',
      'twitter.com': 'operated', 
      'x.com': 'operated',
      'facebook.com': 'operated',
      'instagram.com': 'operated',
      'youtube.com': 'operated',
      'tiktok.com': 'operated',
      
      // Business directories (typically operated)
      'g2.com': 'operated',
      'capterra.com': 'operated',
      'trustpilot.com': 'operated',
      'glassdoor.com': 'operated',
      'crunchbase.com': 'operated',
      'angel.co': 'operated',
      
      // Developer platforms (typically operated)
      'github.com': 'operated',
      'npmjs.com': 'operated',
      'stackshare.io': 'operated',
      
      // App stores (typically operated)
      'apps.apple.com': 'operated',
      'play.google.com': 'operated',
      
      // News and media (typically earned)
      'techcrunch.com': 'earned',
      'venturebeat.com': 'earned',
      'theverge.com': 'earned',
      'wired.com': 'earned',
      'forbes.com': 'earned',
      'bloomberg.com': 'earned',
      'reuters.com': 'earned',
      'cnn.com': 'earned',
      
      // Industry publications (typically earned)
      'hbr.org': 'earned',
      'mckinsey.com': 'earned',
      'deloitte.com': 'earned',
      'accenture.com': 'earned',
      
      // Wikipedia and reference sites (typically earned)
      'wikipedia.org': 'earned',
      'investopedia.com': 'earned'
    }

    this.socialPlatforms = [
      'linkedin.com', 'twitter.com', 'x.com', 'facebook.com', 
      'instagram.com', 'youtube.com', 'tiktok.com', 'snapchat.com'
    ]

    this.businessDirectories = [
      'g2.com', 'capterra.com', 'trustpilot.com', 'glassdoor.com',
      'crunchbase.com', 'angel.co', 'producthunt.com'
    ]
  }

  /**
   * Analyze and classify multiple citations
   */
  async analyzeCitations(request: CitationAnalysisRequest): Promise<CitationClassificationResult[]> {
    const results: CitationClassificationResult[] = []
    
    for (const citation of request.citations) {
      try {
        const classification = await this.classifyCitation(citation, request.target_company)
        results.push(classification)
      } catch (error) {
        console.error(`Failed to classify citation ${citation}:`, error)
        results.push(this.createErrorClassification(citation, error as Error))
      }
    }
    
    return results
  }

  /**
   * Classify a single citation
   */
  async classifyCitation(
    citationUrl: string, 
    targetCompany: CitationAnalysisRequest['target_company']
  ): Promise<CitationClassificationResult> {
    try {
      const url = new URL(citationUrl)
      const domain = this.extractDomain(url.hostname)
      
      // Check if it's the company's own domain
      if (this.isOwnedDomain(domain, targetCompany)) {
        return {
          citation_url: citationUrl,
          bucket: 'owned',
          influence_score: 0.95, // High influence for owned content
          relevance_score: 0.9,
          reasoning: `Direct company domain: ${domain}`
        }
      }
      
      // Check if it's an operated domain
      if (this.isOperatedDomain(domain, targetCompany)) {
        return {
          citation_url: citationUrl,
          bucket: 'operated',
          influence_score: 0.85, // High influence for operated content
          relevance_score: 0.8,
          reasoning: `Company operated domain: ${domain}`
        }
      }
      
      // Check for known platform classifications
      const platformClassification = this.classifyByPlatform(domain, url, targetCompany)
      if (platformClassification) {
        return {
          citation_url: citationUrl,
          bucket: platformClassification.bucket,
          influence_score: this.calculateInfluenceScore(platformClassification.bucket, domain),
          relevance_score: this.calculateRelevanceScore(url, targetCompany),
          reasoning: platformClassification.reasoning
        }
      }
      
      // Check if it's likely a competitor
      const competitorAnalysis = await this.analyzeCompetitor(domain, targetCompany)
      if (competitorAnalysis.isCompetitor) {
        return {
          citation_url: citationUrl,
          bucket: 'competitor',
          influence_score: 0.3, // Lower influence for competitor content
          relevance_score: competitorAnalysis.relevance,
          reasoning: competitorAnalysis.reasoning
        }
      }
      
      // Default to earned media
      return {
        citation_url: citationUrl,
        bucket: 'earned',
        influence_score: this.calculateEarnedInfluenceScore(domain),
        relevance_score: this.calculateRelevanceScore(url, targetCompany),
        reasoning: `Third-party content from ${domain}`
      }
      
    } catch (error) {
      throw new Error(`Invalid URL: ${citationUrl}`)
    }
  }

  // Private classification methods

  private extractDomain(hostname: string): string {
    // Remove www. prefix and extract main domain
    return hostname.replace(/^www\./, '').toLowerCase()
  }

  private isOwnedDomain(
    domain: string, 
    targetCompany: CitationAnalysisRequest['target_company']
  ): boolean {
    const companyDomain = this.extractDomain(targetCompany.domain)
    const ownedDomains = targetCompany.owned_domains || []
    
    // Check exact match
    if (domain === companyDomain) return true
    
    // Check owned domains list
    if (ownedDomains.some(owned => this.extractDomain(owned) === domain)) return true
    
    // Check subdomain relationship
    if (domain.endsWith(`.${companyDomain}`)) return true
    
    return false
  }

  private isOperatedDomain(
    domain: string,
    targetCompany: CitationAnalysisRequest['target_company']
  ): boolean {
    const operatedDomains = targetCompany.operated_domains || []
    
    // Check operated domains list
    return operatedDomains.some(operated => this.extractDomain(operated) === domain)
  }

  private classifyByPlatform(
    domain: string, 
    url: URL,
    targetCompany: CitationAnalysisRequest['target_company']
  ): DomainClassification | null {
    // Check known platform classifications
    if (domain in this.knownPlatforms) {
      const bucket = this.knownPlatforms[domain]
      
      // For operated platforms, check if URL indicates company presence
      if (bucket === 'operated') {
        const hasCompanyPresence = this.detectCompanyPresence(url, targetCompany)
        if (hasCompanyPresence) {
          return {
            bucket: 'operated',
            confidence: 0.9,
            reasoning: `Company presence detected on ${domain}`
          }
        } else {
          return {
            bucket: 'earned',
            confidence: 0.7,
            reasoning: `Third-party content on ${domain}`
          }
        }
      }
      
      return {
        bucket,
        confidence: 0.8,
        reasoning: `Known platform: ${domain} (${bucket})`
      }
    }
    
    return null
  }

  private detectCompanyPresence(
    url: URL,
    targetCompany: CitationAnalysisRequest['target_company']
  ): boolean {
    const urlString = url.toString().toLowerCase()
    const companyName = targetCompany.name.toLowerCase()
    const domain = this.extractDomain(targetCompany.domain)
    const brandName = domain.split('.')[0]
    
    // Check for company name or brand in URL path
    const indicators = [
      companyName.replace(/\s+/g, ''),
      companyName.replace(/\s+/g, '-'),
      companyName.replace(/\s+/g, '_'),
      brandName
    ]
    
    return indicators.some(indicator => 
      urlString.includes(`/${indicator}`) || 
      urlString.includes(`=${indicator}`) ||
      urlString.includes(`-${indicator}`) ||
      urlString.includes(`_${indicator}`)
    )
  }

  private async analyzeCompetitor(
    domain: string,
    targetCompany: CitationAnalysisRequest['target_company']
  ): Promise<{ isCompetitor: boolean; relevance: number; reasoning: string }> {
    // Simple heuristic-based competitor detection
    // In a full implementation, this could use AI or a competitor database
    
    const companyDomain = this.extractDomain(targetCompany.domain)
    const companyName = targetCompany.name.toLowerCase()
    
    // Check for obvious competitor patterns
    const competitorIndicators = [
      'vs-', 'versus-', 'alternative-to-', 'competitor-', 
      'compare-', 'review-', 'best-'
    ]
    
    const hasCompetitorIndicators = competitorIndicators.some(indicator =>
      domain.includes(indicator) || domain.includes(companyName)
    )
    
    if (hasCompetitorIndicators) {
      return {
        isCompetitor: false, // Conservative approach
        relevance: 0.6,
        reasoning: `Potential competitor analysis site: ${domain}`
      }
    }
    
    // Check if domain structure suggests it's a competitor
    const domainParts = domain.split('.')
    const isBusinessDomain = domainParts.length === 2 && 
                           !this.knownPlatforms[domain] &&
                           !this.businessDirectories.includes(domain) &&
                           !this.socialPlatforms.includes(domain)
    
    if (isBusinessDomain) {
      return {
        isCompetitor: false, // Would need AI analysis for accurate detection
        relevance: 0.5,
        reasoning: `Business domain requiring further analysis: ${domain}`
      }
    }
    
    return {
      isCompetitor: false,
      relevance: 0.7,
      reasoning: `Not identified as competitor: ${domain}`
    }
  }

  private calculateInfluenceScore(bucket: CitationBucket, domain: string): number {
    const baseScores = {
      owned: 0.95,
      operated: 0.85,
      earned: 0.7,
      competitor: 0.3
    }
    
    let score = baseScores[bucket]
    
    // Adjust based on domain authority (simplified)
    if (this.isHighAuthorityDomain(domain)) {
      score = Math.min(score + 0.1, 1.0)
    }
    
    return Number(score.toFixed(4))
  }

  private calculateRelevanceScore(
    url: URL,
    targetCompany: CitationAnalysisRequest['target_company']
  ): number {
    const urlString = url.toString().toLowerCase()
    const companyName = targetCompany.name.toLowerCase()
    const domain = this.extractDomain(targetCompany.domain)
    const brandName = domain.split('.')[0]
    
    let score = 0.5 // Base relevance
    
    // Increase score for company name mentions
    if (urlString.includes(companyName.replace(/\s+/g, ''))) score += 0.3
    if (urlString.includes(brandName)) score += 0.2
    
    // Increase score for business-related keywords
    const businessKeywords = ['review', 'comparison', 'alternative', 'pricing', 'features']
    const matchedKeywords = businessKeywords.filter(keyword => 
      urlString.includes(keyword)
    ).length
    
    score += matchedKeywords * 0.1
    
    return Math.min(Number(score.toFixed(4)), 1.0)
  }

  private calculateEarnedInfluenceScore(domain: string): number {
    // Base score for earned media
    let score = 0.7
    
    // Increase for high-authority domains
    if (this.isHighAuthorityDomain(domain)) {
      score = 0.85
    }
    
    // Increase for news/media domains
    if (this.isNewsMediaDomain(domain)) {
      score = 0.8
    }
    
    return Number(score.toFixed(4))
  }

  private isHighAuthorityDomain(domain: string): boolean {
    const highAuthorityDomains = [
      'techcrunch.com', 'venturebeat.com', 'theverge.com', 'wired.com',
      'forbes.com', 'bloomberg.com', 'reuters.com', 'wsj.com',
      'nytimes.com', 'washingtonpost.com', 'cnn.com', 'bbc.com',
      'wikipedia.org', 'investopedia.com', 'hbr.org'
    ]
    
    return highAuthorityDomains.includes(domain)
  }

  private isNewsMediaDomain(domain: string): boolean {
    const newsKeywords = ['news', 'times', 'post', 'herald', 'journal', 'tribune']
    return newsKeywords.some(keyword => domain.includes(keyword)) ||
           domain.endsWith('.news') ||
           this.isHighAuthorityDomain(domain)
  }

  private createErrorClassification(url: string, error: Error): CitationClassificationResult {
    return {
      citation_url: url,
      bucket: 'earned', // Default fallback
      influence_score: 0.5,
      relevance_score: 0.5,
      reasoning: `Classification error: ${error.message}`
    }
  }

  // Public utility methods

  /**
   * Batch analyze citations with progress tracking
   */
  async batchAnalyzeCitations(
    requests: CitationAnalysisRequest[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<CitationClassificationResult[][]> {
    const results: CitationClassificationResult[][] = []
    
    for (let i = 0; i < requests.length; i++) {
      const result = await this.analyzeCitations(requests[i])
      results.push(result)
      
      if (onProgress) {
        onProgress(i + 1, requests.length)
      }
    }
    
    return results
  }

  /**
   * Get classification statistics
   */
  getClassificationStats(results: CitationClassificationResult[]): {
    total: number
    by_bucket: Record<CitationBucket, number>
    avg_influence_score: number
    avg_relevance_score: number
  } {
    const stats = {
      total: results.length,
      by_bucket: {
        owned: 0,
        operated: 0,
        earned: 0,
        competitor: 0
      } as Record<CitationBucket, number>,
      avg_influence_score: 0,
      avg_relevance_score: 0
    }
    
    if (results.length === 0) return stats
    
    let totalInfluence = 0
    let totalRelevance = 0
    
    for (const result of results) {
      stats.by_bucket[result.bucket]++
      totalInfluence += result.influence_score
      totalRelevance += result.relevance_score
    }
    
    stats.avg_influence_score = Number((totalInfluence / results.length).toFixed(4))
    stats.avg_relevance_score = Number((totalRelevance / results.length).toFixed(4))
    
    return stats
  }

  /**
   * Add custom domain classifications
   */
  addCustomClassifications(classifications: Record<string, CitationBucket>): void {
    Object.assign(this.knownPlatforms, classifications)
  }
} 
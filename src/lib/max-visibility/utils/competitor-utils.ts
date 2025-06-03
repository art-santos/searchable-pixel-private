/**
 * Utility functions for competitor analysis and domain extraction
 */

export class CompetitorUtils {
  /**
   * Extract domain from URL and build citation-to-company mapping
   */
  static buildCitationDomainMapping(citations: string[]): Map<string, string> {
    const domainMapping = new Map<string, string>()
    
    citations.forEach(url => {
      try {
        const domain = CompetitorUtils.extractDomainFromUrl(url)
        if (domain && domain !== 'unknown.com') {
          domainMapping.set(domain, url)
        }
      } catch (error) {
        // Skip invalid URLs
      }
    })
    
    return domainMapping
  }

  /**
   * Smart competitor extraction from citations
   * Maps competitors mentioned in text to their actual domains from citations
   */
  static extractCompetitorDomainsFromCitations(
    aiResponse: string,
    citations: string[]
  ): Map<string, string> {
    const competitorDomains = new Map<string, string>()
    
    // Extract domains from all citations
    const citationDomains = new Set<string>()
    citations.forEach(url => {
      try {
        const domain = CompetitorUtils.extractDomainFromUrl(url)
        if (domain && !CompetitorUtils.isGenericDomain(domain)) {
          citationDomains.add(domain)
        }
      } catch (error) {
        // Skip invalid URLs
      }
    })
    
    console.log(`🔗 Found ${citationDomains.size} unique domains in citations:`, Array.from(citationDomains))
    
    // For each citation domain, check if it's mentioned in the AI response
    citationDomains.forEach(domain => {
      // Extract company name from domain (basic approach)
      const companyName = CompetitorUtils.extractCompanyNameFromDomain(domain)
      
      // Check if this company/domain is mentioned in the response
      if (CompetitorUtils.isDomainRelevantToResponse(domain, companyName, aiResponse)) {
        competitorDomains.set(companyName, domain)
        console.log(`✅ Mapped competitor: "${companyName}" → ${domain}`)
      } else {
        console.log(`⚠️ Domain ${domain} not mentioned in response, skipping`)
      }
    })
    
    return competitorDomains
  }
  
  /**
   * Check if a domain is generic/not a company domain
   */
  static isGenericDomain(domain: string): boolean {
    const genericDomains = [
      'google.com', 'wikipedia.org', 'youtube.com', 'github.com',
      'stackoverflow.com', 'reddit.com', 'medium.com', 'linkedin.com',
      'twitter.com', 'facebook.com', 'amazon.com', 'microsoft.com',
      'apple.com', 'forbes.com', 'techcrunch.com', 'venturebeat.com'
    ]
    
    return genericDomains.includes(domain) || 
           domain.includes('wikipedia') || 
           domain.includes('blog.') ||
           domain.includes('news.')
  }
  
  /**
   * Extract company name from domain
   */
  static extractCompanyNameFromDomain(domain: string): string {
    // Remove common TLDs and get the main part
    const mainPart = domain.replace(/\.(com|io|ai|net|org|co|dev)$/, '')
    
    // Convert to title case
    return mainPart.charAt(0).toUpperCase() + mainPart.slice(1)
  }
  
  /**
   * Check if a domain/company is mentioned in the AI response
   */
  static isDomainRelevantToResponse(domain: string, companyName: string, aiResponse: string): boolean {
    const lowerResponse = aiResponse.toLowerCase()
    const lowerDomain = domain.toLowerCase()
    const lowerCompanyName = companyName.toLowerCase()
    
    // Check for exact domain mention
    if (lowerResponse.includes(lowerDomain)) {
      return true
    }
    
    // Check for company name mention (but be more careful about partial matches)
    const words = lowerResponse.split(/\s+/)
    const isNameMentioned = words.some(word => {
      // Remove punctuation for comparison
      const cleanWord = word.replace(/[.,!?;:()]/g, '')
      return cleanWord === lowerCompanyName || 
             (lowerCompanyName.length > 4 && cleanWord.includes(lowerCompanyName))
    })
    
    if (!isNameMentioned) {
      return false
    }
    
    // Additional check: make sure it's mentioned in a competitive context
    // Look for surrounding context that suggests competition
    const competitiveKeywords = [
      'competitor', 'alternative', 'versus', 'vs', 'compare', 'similar', 
      'rival', 'competing', 'against', 'instead of', 'rather than',
      'other options', 'other tools', 'other platforms', 'other solutions'
    ]
    
    // Split response into sentences
    const sentences = lowerResponse.split(/[.!?]+/)
    
    // Check if the company is mentioned in a sentence with competitive context
    const isInCompetitiveContext = sentences.some(sentence => {
      const mentionsCompany = sentence.includes(lowerCompanyName) || sentence.includes(lowerDomain)
      const hasCompetitiveContext = competitiveKeywords.some(keyword => sentence.includes(keyword))
      return mentionsCompany && hasCompetitiveContext
    })
    
    // Also check if it's mentioned alongside other known business software/tools
    const businessSoftwareKeywords = [
      'crm', 'sales', 'marketing', 'automation', 'software', 'platform', 
      'tool', 'solution', 'service', 'technology', 'system', 'api',
      'integration', 'workflow', 'analytics', 'dashboard'
    ]
    
    const isInBusinessContext = sentences.some(sentence => {
      const mentionsCompany = sentence.includes(lowerCompanyName) || sentence.includes(lowerDomain)
      const hasBusinessContext = businessSoftwareKeywords.some(keyword => sentence.includes(keyword))
      return mentionsCompany && hasBusinessContext
    })
    
    // Return true only if mentioned in competitive OR business context
    return isInCompetitiveContext || isInBusinessContext
  }

  /**
   * Extract domain from URL
   */
  static extractDomainFromUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace(/^www\./, '')
    } catch (error) {
      // Fallback for malformed URLs
      const match = url.match(/^https?:\/\/(?:www\.)?([^\/]+)/)
      return match ? match[1] : 'unknown.com'
    }
  }

  /**
   * Extract competitors from competitor notes
   */
  static extractCompetitorsFromNotes(competitorNotes: string[]): string[] {
    if (!competitorNotes || competitorNotes.length === 0) return []
    
    const competitors: string[] = []
    competitorNotes.forEach(note => {
      // Simple extraction - in real implementation, this would be more sophisticated
      const words = note.split(/\s+/)
      words.forEach(word => {
        if (word.length > 3 && /^[A-Z]/.test(word)) {
          competitors.push(word.replace(/[.,!?]$/, ''))
        }
      })
    })
    
    return [...new Set(competitors)] // Remove duplicates
  }

  /**
   * Validate competitor domain
   */
  static isValidCompetitorDomain(domain: string): boolean {
    // Check if domain format is valid
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/
    if (!domainRegex.test(domain)) {
      return false
    }

    // Check if it's not a generic domain
    return !CompetitorUtils.isGenericDomain(domain)
  }

  /**
   * Normalize company name for comparison
   */
  static normalizeCompanyName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\b(inc|llc|ltd|corp|corporation|company|co)\b/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
  }

  /**
   * Calculate similarity between two company names
   */
  static calculateNameSimilarity(name1: string, name2: string): number {
    const normalized1 = CompetitorUtils.normalizeCompanyName(name1)
    const normalized2 = CompetitorUtils.normalizeCompanyName(name2)
    
    if (normalized1 === normalized2) return 1.0
    
    // Simple Levenshtein distance approximation
    const longer = normalized1.length > normalized2.length ? normalized1 : normalized2
    const shorter = normalized1.length > normalized2.length ? normalized2 : normalized1
    
    if (longer.length === 0) return 1.0
    
    const matches = shorter.split('').filter((char, index) => 
      longer[index] && longer[index] === char
    ).length
    
    return matches / longer.length
  }
} 
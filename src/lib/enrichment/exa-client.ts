export interface ExaSearchResult {
  url: string;
  title: string;
  text?: string;
  publishedDate?: string;
  author?: string;
}

export interface ExaContentsResult {
  url: string;
  title: string;
  text: string;
  highlights?: string[];
  author?: string;
}

export interface ExaSearchResponse {
  results: ExaSearchResult[];
  autopromptString?: string;
}

export interface LinkedInContact {
  name: string;
  title: string;
  company: string;
  linkedinUrl: string;
  location?: string;
  titleMatchScore: number;
  confidenceScore?: number;
  highlights?: string[];
  // Enhanced profile data
  headline?: string;
  summary?: string;
  experiences?: Array<{
    title: string;
    company: string;
    startDate?: string;
    endDate?: string;
    isCurrent: boolean;
  }>;
  education?: Array<{
    degree: string;
    school: string;
    year?: string;
  }>;
  connectionCount?: number;
  lastActivityDate?: string;
}

const TARGET_TITLES = ['CEO', 'CFO', 'Chief Executive Officer', 'Chief Financial Officer'];

export class ExaClient {
  private apiKey: string;
  private baseUrl = 'https://api.exa.ai';

  constructor() {
    this.apiKey = process.env.EXA_API_KEY!;
    if (!this.apiKey) {
      throw new Error('EXA_API_KEY environment variable is required');
    }
  }

  async fetchContents(urls: string[]): Promise<ExaContentsResult[]> {
    try {
      console.log(`[EXA] Fetching contents for ${urls.length} URLs`);

      const response = await fetch(`${this.baseUrl}/contents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Split-Leads/1.0'
        },
        body: JSON.stringify({
          urls,
          text: true,
          livecrawl: 'preferred', // Use live crawl to avoid LinkedIn cache issues
          highlights: {
            numSentences: 2
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Exa contents API error: ${response.status}`, errorText);
        return [];
      }

      const data = await response.json();
      console.log(`[EXA] Fetched contents for ${data.results.length} profiles`);
      
      return data.results;

    } catch (error) {
      console.error('Exa contents fetch error:', error);
      return [];
    }
  }

  async searchLinkedInByICP(company: string, icpDescription: string, location?: string): Promise<ExaSearchResult[]> {
    try {
      // Build a natural language query emphasizing CURRENT employment
      const query = `site:linkedin.com/in "${icpDescription}" currently working at "${company}" OR "present" "${company}" -jobs -careers -former -ex- -"used to work"`;
      
      console.log(`[EXA] ICP Search: Finding "${icpDescription}" CURRENTLY working at ${company}`);

      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Split-Leads/1.0'
        },
        body: JSON.stringify({
          query,
          numResults: 5, // Limit to 5 for cost efficiency
          includeDomains: ['linkedin.com'],
          useAutoprompt: true // Let Exa help with natural language understanding
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Exa API error: ${response.status} ${response.statusText}`, errorText);
        return [];
      }

      const data: ExaSearchResponse = await response.json();
      
      console.log(`[EXA] Found ${data.results.length} profiles matching ICP`);
      
      if (data.results.length > 0) {
        console.log('[EXA] First result:', JSON.stringify(data.results[0], null, 2));
      }
      
      return data.results;

    } catch (error) {
      console.error('Exa ICP search error:', error);
      return [];
    }
  }

  async searchLinkedIn(company: string, titles: string[] = TARGET_TITLES, city?: string): Promise<ExaSearchResult[]> {
    try {
      const query = this.buildLinkedInQuery(company, titles, city);
      
      console.log(`[EXA] Searching LinkedIn: ${query}`);

      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Split-Leads/1.0'
        },
        body: JSON.stringify({
          query,
          numResults: 6, // Hard-coded as per spec
          includeDomains: ['linkedin.com'],
          useAutoprompt: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Exa API error: ${response.status} ${response.statusText}`, errorText);
        return [];
      }

      const data: ExaSearchResponse = await response.json();
      
      console.log(`[EXA] Found ${data.results.length} LinkedIn profiles`);
      
      // Log first result to debug structure
      if (data.results.length > 0) {
        console.log('[EXA] First result structure:', JSON.stringify(data.results[0], null, 2));
      }
      
      return data.results;

    } catch (error) {
      console.error('Exa LinkedIn search error:', error);
      return [];
    }
  }

  private buildLinkedInQuery(company: string, titles: string[], city?: string): string {
    // Build title query with expanded variations
    const expandedTitles = titles.flatMap(title => [
      `"${title}"`,
      title.replace(/Chief|Officer/g, '').trim() // CFO from Chief Financial Officer
    ]).filter(Boolean);

    // Build a more natural query that emphasizes current employment
    let queryParts = [
      'site:linkedin.com/in OR site:linkedin.com/pub'
    ];

    // Add title search
    queryParts.push('(' + expandedTitles.join(' OR ') + ')');

    // Skip location filtering to cast wider net
    // if (city) {
    //   queryParts.push(`"${city}"`);
    // }

    // Add company - emphasize CURRENT employment
    queryParts.push(`"currently working at ${company}" OR "${company}" "present" OR "${company}" "current"`);

    // Exclude job postings and former employees
    queryParts.push('-jobs -careers -hiring -former -"used to" -previously -ex- -"worked at" -"past experience" -"former employee"');

    const query = queryParts.filter(Boolean).join(' ');
    
    console.log(`[EXA] Query built: Find ${titles.join('/')} who currently work at ${company} (no location filter)`);
    
    return query;
  }

  async deepEnrichPerson(name: string, company: string, title?: string): Promise<any> {
    try {
      console.log(`[EXA] Deep enrichment for ${name} at ${company}`);

      // Run multiple enrichment queries in parallel
      const [thoughtLeadership, socialPresence, patents, pressQuotes] = await Promise.all([
        // Thought leadership content
        this.searchThoughtLeadership(name, company),
        // Social media presence
        this.searchSocialProfiles(name, company),
        // Patents (if any)
        this.searchPatents(name),
        // Recent press quotes
        this.searchPressQuotes(name, company)
      ]);

      const insights = {
        thoughtLeadership: thoughtLeadership.slice(0, 3),
        socialProfiles: socialPresence,
        patents: patents.slice(0, 2),
        pressQuotes: pressQuotes.slice(0, 3),
        totalPublicMentions: thoughtLeadership.length + pressQuotes.length
      };

      console.log(`[EXA] Deep enrichment complete:`, {
        thoughtLeadership: insights.thoughtLeadership.length,
        socialProfiles: insights.socialProfiles.length,
        patents: insights.patents.length,
        pressQuotes: insights.pressQuotes.length
      });

      return insights;

    } catch (error) {
      console.error('Deep enrichment error:', error);
      return null;
    }
  }

  private async searchThoughtLeadership(name: string, company: string): Promise<any[]> {
    try {
      const query = `"${name}" "${company}" (podcast OR blog OR interview OR keynote OR webinar OR talk OR conference)`;
      
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Split-Leads/1.0'
        },
        body: JSON.stringify({
          query,
          numResults: 5,
          useAutoprompt: true,
          type: 'auto',
          startPublishedDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString() // Last year
        })
      });

      if (!response.ok) return [];

      const data: ExaSearchResponse = await response.json();
      
      return data.results.map(r => ({
        type: this.detectContentType(r.title, r.url),
        title: r.title,
        url: r.url,
        date: r.publishedDate,
        snippet: r.text?.substring(0, 200)
      }));
    } catch (error) {
      console.error('Thought leadership search error:', error);
      return [];
    }
  }

  private async searchSocialProfiles(name: string, company: string): Promise<any[]> {
    try {
      const profiles = [];
      
      // Search for Twitter/X
      const twitterQuery = `"${name}" site:twitter.com "${company}"`;
      const twitterResponse = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Split-Leads/1.0'
        },
        body: JSON.stringify({
          query: twitterQuery,
          numResults: 1,
          includeDomains: ['twitter.com', 'x.com']
        })
      });

      if (twitterResponse.ok) {
        const data: ExaSearchResponse = await twitterResponse.json();
        if (data.results.length > 0) {
          const handle = this.extractTwitterHandle(data.results[0].url);
          profiles.push({
            platform: 'Twitter/X',
            url: data.results[0].url,
            handle: handle
          });
        }
      }

      // Could add more social platforms here (Threads, GitHub, etc.)

      return profiles;
    } catch (error) {
      console.error('Social profile search error:', error);
      return [];
    }
  }

  private async searchPatents(name: string): Promise<any[]> {
    try {
      const query = `"${name}" patent (USPTO OR "patent application" OR inventor)`;
      
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Split-Leads/1.0'
        },
        body: JSON.stringify({
          query,
          numResults: 3,
          useAutoprompt: false
        })
      });

      if (!response.ok) return [];

      const data: ExaSearchResponse = await response.json();
      
      return data.results.map(r => ({
        title: r.title,
        url: r.url,
        date: r.publishedDate
      }));
    } catch (error) {
      console.error('Patent search error:', error);
      return [];
    }
  }

  private async searchPressQuotes(name: string, company: string): Promise<any[]> {
    try {
      const query = `"${name}" "${company}" (announced OR launches OR said OR "press release" OR quoted)`;
      
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Split-Leads/1.0'
        },
        body: JSON.stringify({
          query,
          numResults: 5,
          useAutoprompt: true,
          type: 'news',
          startPublishedDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString() // Last 6 months
        })
      });

      if (!response.ok) return [];

      const data: ExaSearchResponse = await response.json();
      
      return data.results.map(r => ({
        publication: this.extractPublication(r.url),
        title: r.title,
        url: r.url,
        date: r.publishedDate,
        snippet: r.text?.substring(0, 200)
      }));
    } catch (error) {
      console.error('Press quotes search error:', error);
      return [];
    }
  }

  private detectContentType(title: string, url: string): string {
    const lower = title.toLowerCase();
    if (lower.includes('podcast')) return 'podcast';
    if (lower.includes('interview')) return 'interview';
    if (lower.includes('keynote') || lower.includes('talk')) return 'talk';
    if (lower.includes('webinar')) return 'webinar';
    if (url.includes('blog')) return 'blog';
    return 'article';
  }

  private extractTwitterHandle(url: string): string {
    const match = url.match(/twitter\.com\/([^\/\?]+)|x\.com\/([^\/\?]+)/);
    return match ? `@${match[1] || match[2]}` : '';
  }

  private extractPublication(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '').split('.')[0];
    } catch {
      return 'Unknown';
    }
  }

  // Enhanced scoring with full profile text
  scoreAndSelectBestContact(
    searchResults: ExaSearchResult[],
    contentsResults: ExaContentsResult[],
    company: string,
    location?: string,
    icpDescription?: string
  ): LinkedInContact | null {
    if (!contentsResults.length) return null;

    const scoredContacts = contentsResults.map((content, idx) => {
      const searchResult = searchResults[idx];
      
      // Parse basic contact info
      const contact = this.parseLinkedInProfile({
        ...searchResult,
        text: content.text
      });

      // Calculate comprehensive score
      const scores = {
        title: this.calculateTitleMatchFromText(content.text, content.title, icpDescription),
        company: this.calculateCompanyMatch(content.text, company),
        location: this.calculateLocationMatch(content.text, location),
        recency: this.calculateRecencyScore(content.text)
      };

      // HARD GATE: If not currently employed at company, score is 0
      if (scores.company === 0) {
        console.log(`[EXA] Rejecting ${contact.name}: Not currently employed at ${company}`);
        return {
          ...contact,
          confidenceScore: 0,
          highlights: content.highlights || []
        };
      }

      // New weights with hard-gated company match
      const totalScore = (
        scores.title * 0.60 +      // Title match (most important after company gate)
        scores.company * 0.30 +     // Current employment (already 1.0 if we're here)
        scores.location * 0.05 +    // Location match (minor boost)
        scores.recency * 0.05       // Recent activity (minor boost)
      );

      console.log(`[EXA] Scoring ${contact.name}: title=${scores.title.toFixed(2)}, company=${scores.company.toFixed(2)}, location=${scores.location.toFixed(2)}, recency=${scores.recency.toFixed(2)}, total=${totalScore.toFixed(2)}`);

      return {
        ...contact,
        confidenceScore: totalScore,
        highlights: content.highlights || []
      };
    });

    // Filter out anyone not currently at the company (score 0)
    const validContacts = scoredContacts.filter(c => c.confidenceScore && c.confidenceScore > 0);

    if (!validContacts.length) {
      console.log('[EXA] No contacts currently employed at the target company');
      return null;
    }

    // Sort by score and return best match
    const bestContact = validContacts
      .filter(c => c.confidenceScore && c.confidenceScore > 0.3) // Lower threshold since we hard-gate on company
      .sort((a, b) => (b.confidenceScore || 0) - (a.confidenceScore || 0))[0];

    if (!bestContact) {
      console.log('[EXA] No contacts met minimum confidence threshold of 0.3');
      return null;
    }

    console.log(`[EXA] Best contact: ${bestContact.name} with confidence ${bestContact.confidenceScore?.toFixed(2)}`);
    return bestContact;
  }

  private calculateTitleMatchFromText(text: string, title: string, icpDescription?: string): number {
    const lowerText = text.toLowerCase();
    const lowerTitle = title.toLowerCase();

    // Extract key concepts from ICP description
    if (icpDescription) {
      const icpLower = icpDescription.toLowerCase();
      
      // Define concept mappings
      const conceptMappings: Record<string, string[]> = {
        'product': ['product', 'pm', 'prod', 'offering'],
        'technology': ['technology', 'tech', 'engineering', 'technical', 'software', 'hardware'],
        'executive': ['executive', 'chief', 'vp', 'vice president', 'svp', 'evp', 'head', 'director'],
        'senior': ['senior', 'sr', 'principal', 'lead'],
        'design': ['design', 'ux', 'ui', 'user experience', 'creative'],
        'marketing': ['marketing', 'growth', 'brand', 'demand'],
        'sales': ['sales', 'revenue', 'business development', 'bd'],
        'engineering': ['engineering', 'engineer', 'development', 'dev'],
        'decisions': ['decision', 'strategy', 'leadership', 'strategic']
      };
      
      // Score based on concept matches
      let conceptScore = 0;
      let conceptCount = 0;
      
      for (const [concept, keywords] of Object.entries(conceptMappings)) {
        if (keywords.some(k => icpLower.includes(k))) {
          conceptCount++;
          // Check if this concept appears in title or text
          if (keywords.some(k => lowerTitle.includes(k) || lowerText.includes(k))) {
            conceptScore++;
          }
        }
      }
      
      // Also check for exact title matches
      const titleWords = lowerTitle.split(/\s+/);
      const icpWords = icpLower.split(/\s+/);
      const exactMatches = icpWords.filter(word => 
        word.length > 3 && titleWords.some(tw => tw.includes(word))
      ).length;
      
      // Combine concept matching and exact matching
      const conceptMatchRatio = conceptCount > 0 ? conceptScore / conceptCount : 0;
      const exactMatchRatio = exactMatches / Math.max(icpWords.length, 1);
      
      const finalScore = (conceptMatchRatio * 0.7) + (exactMatchRatio * 0.3);
      
      console.log(`[SCORING] Title match for "${title}": concepts=${conceptMatchRatio.toFixed(2)}, exact=${exactMatchRatio.toFixed(2)}, final=${finalScore.toFixed(2)}`);
      
      return Math.min(finalScore, 1);
    }

    // Fallback to executive scoring
    if (lowerTitle.includes('chief') || lowerTitle.includes('ceo') || lowerTitle.includes('cto')) return 1.0;
    if (lowerTitle.includes('vp') || lowerTitle.includes('vice president')) return 0.8;
    if (lowerTitle.includes('director') || lowerTitle.includes('head')) return 0.6;
    return 0.3;
  }

  private calculateCompanyMatch(text: string, company: string): number {
    const lowerText = text.toLowerCase();
    const lowerCompany = company.toLowerCase();
    
    // Remove common suffixes for better matching
    const companyVariants = [
      lowerCompany,
      lowerCompany.replace(/\s*(inc|llc|corp|corporation|ltd|limited)\.?$/i, '').trim()
    ];
    
    // More flexible patterns for current employment
    const currentEmploymentPatterns = [
      // Standard patterns
      /(\d{4})\s*[-–]\s*(present|current|now)/i,
      /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}\s*[-–]\s*(present|current|now)/i,
      /\d{1,2}\/\d{4}\s*[-–]\s*(present|current|now)/i,
      
      // LinkedIn-specific patterns with duration
      /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}\s*[-–]\s*present\s*·\s*\d+\s*(yr|year|mo|month)/i,
      /\d{4}\s*[-–]\s*present\s*·\s*\d+\s*(yr|year|mo|month)/i,
      
      // Present without specific date format
      /present\s*·\s*\d+\s*(yr|year|mo|month)/i,
      
      // Current role indicators
      /current\s*(role|position|job)/i,
      /currently\s*(working|employed)/i
    ];
    
    // Look for company name with employment patterns
    for (const variant of companyVariants) {
      // Check if company appears in text
      if (!lowerText.includes(variant)) continue;
      
      // Find all occurrences of the company name
      let index = lowerText.indexOf(variant);
      while (index !== -1) {
        // Get larger context around the company name (500 chars before, 500 after)
        const contextStart = Math.max(0, index - 500);
        const contextEnd = Math.min(lowerText.length, index + variant.length + 500);
        const context = lowerText.substring(contextStart, contextEnd);
        
        // Check for current employment patterns
        let foundCurrentRole = false;
        for (const pattern of currentEmploymentPatterns) {
          const match = context.match(pattern);
          if (match) {
            console.log(`[SCORING] Found current employment pattern: "${match[0]}" for ${company}`);
            foundCurrentRole = true;
            break;
          }
        }
        
        if (foundCurrentRole) {
          // Additional check: make sure this isn't in a "previous experience" section
          const negativeIndicators = ['previous', 'former', 'past', 'prior', 'ex-', 'left', 'departed', 'ended'];
          const hasNegativeIndicator = negativeIndicators.some(indicator => {
            const indicatorIndex = context.indexOf(indicator);
            return indicatorIndex !== -1 && indicatorIndex < (index - contextStart + variant.length);
          });
          
          if (!hasNegativeIndicator) {
            return 1.0;
          } else {
            console.log(`[SCORING] Found negative indicator for ${company}, skipping`);
          }
        }
        
        // Look for next occurrence
        index = lowerText.indexOf(variant, index + 1);
      }
    }
    
    // If company is mentioned but no current employment patterns found
    if (companyVariants.some(v => lowerText.includes(v))) {
      console.log(`[SCORING] Company ${company} mentioned but no current employment pattern found`);
      return 0; // HARD ZERO - not currently employed
    }
    
    return 0;
  }

  private calculateLocationMatch(text: string, location?: string): number {
    if (!location) return 0.5; // Neutral if no location specified
    
    const lowerText = text.toLowerCase();
    const locationParts = location.toLowerCase().split(/[,\s]+/);
    
    const matchCount = locationParts.filter(part => 
      part.length > 2 && lowerText.includes(part)
    ).length;
    
    return Math.min(matchCount / locationParts.length, 1);
  }

  private calculateRecencyScore(text: string): number {
    // Look for recent activity indicators
    const currentYear = new Date().getFullYear();
    const recentYears = [currentYear, currentYear - 1, currentYear - 2];
    
    if (recentYears.some(year => text.includes(year.toString()))) return 1.0;
    return 0.5;
  }

  parseLinkedInResults(results: ExaSearchResult[], targetTitles: string[] = TARGET_TITLES): LinkedInContact[] {
    return results.map(result => {
      const contact = this.parseLinkedInProfile(result);
      contact.titleMatchScore = this.calculateTitleMatchScore(contact.title, targetTitles);
      return contact;
    })
    .filter(contact => contact.name && contact.title)
    .sort((a, b) => b.titleMatchScore - a.titleMatchScore);
  }

  private parseLinkedInProfile(result: ExaSearchResult): LinkedInContact {
    console.log('[EXA] Parsing result:', { title: result.title, url: result.url, hasText: !!result.text });
    
    // Extract name from LinkedIn title format: "Name - Title at Company | LinkedIn"
    const titleMatch = result.title?.match(/^(.+?)\s*[-–]\s*(.+?)\s*(?:at|@)\s*(.+?)\s*\|\s*LinkedIn/i);
    
    let name = '';
    let title = '';
    let company = '';

    if (titleMatch) {
      name = titleMatch[1].trim();
      title = titleMatch[2].trim();
      company = titleMatch[3].trim();
    } else if (result.title) {
      // Try simpler parsing of title
      // Sometimes format is just "Name | LinkedIn" or "Name - Title | LinkedIn"
      const simpleTitleMatch = result.title.match(/^(.+?)\s*(?:[-–]\s*(.+?))?\s*\|\s*LinkedIn/i);
      if (simpleTitleMatch) {
        name = simpleTitleMatch[1].trim();
        title = simpleTitleMatch[2]?.trim() || '';
      }
    }
    
    // If we still don't have a name, try parsing from text if available
    if (!name && result.text) {
      const lines = result.text.split('\n').map(line => line.trim()).filter(Boolean);
      name = lines[0] || '';
      title = title || lines[1] || '';
    }

    // Extract location from text if available
    const locationMatch = result.text?.match(/(?:Located in|Based in|Location:)\s*([^.\n]+)/i);
    const location = locationMatch ? locationMatch[1].trim() : undefined;

    return {
      name: this.cleanName(name),
      title: this.cleanTitle(title),
      company: company || '',
      linkedinUrl: result.url,
      location,
      titleMatchScore: 0 // Will be calculated later
    };
  }

  private calculateTitleMatchScore(title: string, targetTitles: string[]): number {
    const normalizedTitle = title.toLowerCase();
    
    // Heavily penalize former employees
    if (normalizedTitle.includes('former') || normalizedTitle.includes('ex-') || normalizedTitle.includes('previously')) {
      return 0.05; // Very low score for former employees
    }
    
    // Exact matches get highest score
    for (const target of targetTitles) {
      if (normalizedTitle.includes(target.toLowerCase())) {
        if (target.length <= 3) return 1.0; // CEO, CFO, CTO
        return 0.9; // Chief Executive Officer, etc.
      }
    }

    // Partial matches
    if (normalizedTitle.includes('chief') || normalizedTitle.includes('ceo') || normalizedTitle.includes('cfo')) {
      return 0.8;
    }
    
    if (normalizedTitle.includes('president') || normalizedTitle.includes('vp') || normalizedTitle.includes('vice president')) {
      return 0.6;
    }

    if (normalizedTitle.includes('director') || normalizedTitle.includes('head')) {
      return 0.4;
    }

    return 0.1; // Default low score
  }

  private cleanName(name: string): string {
    return name
      .replace(/[^\w\s'-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private cleanTitle(title: string): string {
    return title
      .replace(/\|.*$/, '') // Remove everything after |
      .replace(/at\s+.+$/i, '') // Remove "at Company"
      .trim();
  }
}

// Singleton instance
export const exaClient = new ExaClient(); 
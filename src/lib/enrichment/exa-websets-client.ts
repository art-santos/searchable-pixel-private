/* ------------------------------------------------------------------
   Exa Websets Client – Split Leads
   ------------------------------------------------------------------
   Responsibilities
   1. createWebsetSearch   – builds a Webset with criteria + enrichment
   2. pollWebsetResults    – waits (≤10 s) for completion
   3. pickBestContact      – scores top ≤5 people & returns the winner
   ------------------------------------------------------------------ */

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

interface WebsetCreateResponse {
  id: string;
  status?: string;
  created_at?: string;
}

interface WebsetItem {
  id: string;
  score?: number;
  // Make properties optional and flexible to handle different formats
  properties?: any;
  enrichments?: Array<{
    name?: string;
    description?: string;
    result?: any;
  }>;
  // Additional fields that might come from the API
  url?: string;
  title?: string;
  content?: string;
  [key: string]: any; // Allow any additional properties
}

export interface LeadCandidate {
  name: string;
  title: string;
  company: string;
  linkedinUrl: string;
  location?: string;
  pictureUrl?: string;
  headline?: string;
  enrichment?: any;        // JSON from Webset enrichment block
  confidence: number;      // 0-1 combined score
  summary?: string;
  focusAreas?: string;
  _raw?: any;              // Full raw webset item
}

// ────────────────────────────────────────────────────────────
// Client
// ────────────────────────────────────────────────────────────

export class ExaWebsetsClient {
  private readonly apiKey = process.env.EXA_API_KEY!;
  private readonly base = 'https://api.exa.ai/websets/v0';

  // Build and POST a Webset
  async createWebsetSearch(
    company: string,
    icpTitles: string[],
    city?: string
  ): Promise<string> {
    console.log(`[EXA-WEBSETS] Creating webset for ${icpTitles.join('/')} at ${company}`);

    const titleList = icpTitles.join(', ');
    const query = `${titleList} at ${company}`;

    const body = {
      search: {
        query,
        count: 3,  // Limit to 3 results as requested
        entity: { type: 'person' }  // Specify we're looking for people
      },
      enrichments: [
        {
          description: `LinkedIn profile URL for ${titleList}`,
          format: 'text'
        },
        {
          description: 'Current job title and company',
          format: 'text'
        },
        {
          description: 'Professional headline and summary from LinkedIn',
          format: 'text'
        },
        {
          description: 'List the 3 most recent LinkedIn posts with title, date, URL, and snippet',
          format: 'text'
        },
        {
          description: 'Recent media mentions and articles featuring this person (2023-2025) with title, publication, date, and URL',
          format: 'text'
        },
        {
          description: 'Recent press quotes by this person with the actual quote, article title, publication, and date',
          format: 'text'
        },
        {
          description: 'Speaking appearances, podcasts, or conferences this person participated in with event name, date, and topic',
          format: 'text'
        },
        {
          description: 'Patents, research papers, or key projects by this person with title, type, year, and brief description',
          format: 'text'
        },
        {
          description: 'Current key focus areas and initiatives this person is working on based on recent public activity',
          format: 'text'
        },
        {
          description: 'Work experience history with company names, roles, and dates',
          format: 'text'
        },
        {
          description: 'Education background including degrees, institutions, and graduation years',
          format: 'text'
        }
      ]
    };

    const res = await fetch(`${this.base}/websets/`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[EXA-WEBSETS] Create failed: ${res.status}`, errorText);
      
      // Handle specific error cases
      if (res.status === 401) {
        // Parse the error message if possible
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message?.includes('does not have access')) {
            console.error(`[EXA-WEBSETS] Account needs Pro plan for Websets API access`);
            throw new Error('Websets API requires Pro plan access');
          }
        } catch (e) {
          // If parsing fails, use generic message
        }
        throw new Error(`Websets API authentication failed: ${res.status}`);
      }
      
      throw new Error(`Webset create failed: ${res.status}`);
    }

    const { id } = (await res.json()) as WebsetCreateResponse;
    console.log(`[EXA-WEBSETS] Created webset: ${id}`);
    return id;
  }

  // Poll until completion (≤ 30 s) then return ≤ 5 items
  async pollWebsetResults(websetId: string): Promise<WebsetItem[]> {
    console.log(`[EXA-WEBSETS] Polling webset: ${websetId}`);
    const deadline = Date.now() + 30_000; // Increased to 30 seconds
    
    while (Date.now() < deadline) {
      // Check webset status
      const statusRes = await fetch(
        `${this.base}/websets/${websetId}`,
        { headers: this.headers() }
      );
      
      if (!statusRes.ok) {
        console.error(`[EXA-WEBSETS] Status check failed: ${statusRes.status}`);
        throw new Error(`Webset status check failed ${statusRes.status}`);
      }
      
      const statusData = await statusRes.json();
      console.log(`[EXA-WEBSETS] Status: ${statusData.status}`);
      
      if (statusData.status === 'idle' || statusData.status === 'completed') {
        // Get items
        const itemsRes = await fetch(
          `${this.base}/websets/${websetId}/items?limit=5`,
          { headers: this.headers() }
        );
        
        if (!itemsRes.ok) {
          console.error(`[EXA-WEBSETS] Items fetch failed: ${itemsRes.status}`);
          throw new Error(`Webset items fetch failed ${itemsRes.status}`);
        }
        
        const itemsData = await itemsRes.json();
        console.log(`[EXA-WEBSETS] Completed! Found ${itemsData.data?.length || 0} items`);
        
        // LOG RAW WEBSETS RESPONSE
        console.log('\n🔍 RAW WEBSETS API RESPONSE:');
        console.log('=====================================');
        console.log(JSON.stringify(itemsData, null, 2));
        console.log('=====================================\n');
        
        return itemsData.data as WebsetItem[];
      }
      
      await this.sleep(1500); // Increased polling interval
    }
    
    // If we timeout, try to get partial results anyway
    console.log(`[EXA-WEBSETS] Timeout reached, attempting to fetch partial results...`);
    
    try {
      const itemsRes = await fetch(
        `${this.base}/websets/${websetId}/items?limit=5`,
        { headers: this.headers() }
      );
      
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        if (itemsData.data && itemsData.data.length > 0) {
          console.log(`[EXA-WEBSETS] Retrieved ${itemsData.data.length} partial results`);
          return itemsData.data as WebsetItem[];
        }
      }
    } catch (e) {
      console.error(`[EXA-WEBSETS] Failed to get partial results:`, e);
    }
    
    console.error(`[EXA-WEBSETS] Timeout after 30s for webset: ${websetId}`);
    throw new Error('Webset timed-out (>30 s)');
  }

  // Combine Exa score + our weighting (title heavy)
  pickBestContact(
    items: WebsetItem[],
    targetCompany: string,
    icpTitles: string[]
  ): LeadCandidate | null {
    console.log(`[EXA-WEBSETS] Scoring ${items.length} candidates for ${targetCompany}`);
    
    const norm = (s: string) => s.toLowerCase();

    const scored = items
      .map(i => {
        // Extract person info - be flexible with structure
        let name = '';
        let title = '';
        let linkedinUrl = '';
        let pictureUrl = '';
        let location = '';
        
        // Try to extract from properties.person first
        if (i.properties?.person) {
          const p = i.properties.person;
          name = p.name || '';
          title = p.position || p.headline || p.title || '';
          linkedinUrl = i.properties?.url || p.linkedinUrl || '';
          pictureUrl = p.pictureUrl || '';
          location = p.location || '';
        }
        
        // Fall back to top-level fields if needed
        if (!name && i.title) name = i.title;
        if (!linkedinUrl && i.url) linkedinUrl = i.url;
        
        // Skip if no name found
        if (!name) {
          console.log(`[EXA-WEBSETS] Skipping item without name`);
          return null;
        }
        
        // Process ALL enrichment data with proper structure
        let enrichmentData: Record<string, any> = {
          raw_enrichments: i.enrichments || [],
          webset_id: i.websetId,
          item_id: i.id,
          properties: i.properties || {}
        };
        
        // Parse each enrichment type properly
        if (i.enrichments && Array.isArray(i.enrichments)) {
          i.enrichments.forEach((e, idx) => {
            if (e.result && e.result.length > 0) {
              const resultText = e.result[0];
              const description = e.description || '';
              
              // Map enrichments by type
              if (description.includes('LinkedIn URL') || description.includes('Linkedin Url')) {
                enrichmentData.linkedin_url = resultText;
              }
              else if (description.includes('Current Title & Company')) {
                enrichmentData.current_title = resultText;
              }
              else if (description.includes('Headline & Summary')) {
                enrichmentData.headline_summary = resultText;
              }
              else if (description.includes('Recent LinkedIn Posts')) {
                enrichmentData.linkedin_posts = resultText;
              }
              else if (description.includes('Media Mentions')) {
                enrichmentData.media_mentions = resultText;
              }
              else if (description.includes('Press Quotes')) {
                enrichmentData.press_quotes = resultText;
              }
              else if (description.includes('Speaking Engagements')) {
                enrichmentData.speaking_engagements = resultText;
              }
              else if (description.includes('Key Works')) {
                enrichmentData.key_works = resultText;
              }
              else if (description.includes('Work History')) {
                enrichmentData.work_history = resultText;
              }
              else if (description.includes('Education History')) {
                enrichmentData.education_history = resultText;
              }
              else if (description.includes('Current Focus Areas')) {
                enrichmentData.focus_areas = resultText;
              }
              
              // Try to extract job title from enrichments if not in properties
              if (!title && description.includes('Current Title')) {
                title = resultText;
              }
            }
          });
        }

        // Title match – weight 65%
        const hit = icpTitles.some(t => norm(title).includes(norm(t)));
        const titleScore = hit ? 1 : 0.4;

        // Freshness – whether enrichment exists (10%)
        const hasEnrich = i.enrichments && i.enrichments.length > 0;
        const freshScore = hasEnrich ? 1 : 0.5;

        // Combined confidence score
        const confidence =
          (titleScore * 0.65) +
          ((i.score ?? 0.5) * 0.25) +
          (freshScore * 0.10);

        const candidate = {
          name,
          title: title || 'Unknown Title',
          company: targetCompany,
          linkedinUrl: linkedinUrl || i.id,
          location,
          pictureUrl,
          headline: title,
          enrichment: enrichmentData,
          confidence,
          // Add additional parsed data
          summary: enrichmentData.headline_summary,
          focusAreas: enrichmentData.focus_areas,
          // Include the full raw item for complete data retention
          _raw: i
        } as LeadCandidate;

        console.log(`[EXA-WEBSETS] Scored ${candidate.name}: title=${titleScore.toFixed(2)}, exa=${(i.score ?? 0.5).toFixed(2)}, fresh=${freshScore.toFixed(2)}, total=${confidence.toFixed(2)}`);
        
        return candidate;
      })
      .filter(c => c !== null) as LeadCandidate[];

    if (!scored.length) {
      console.log(`[EXA-WEBSETS] No valid candidates found`);
      return null;
    }

    const best = scored.sort((a, b) => b.confidence - a.confidence)[0];
    console.log(`[EXA-WEBSETS] Best candidate: ${best.name} (confidence: ${best.confidence.toFixed(2)})`);
    
    // LOG FULL ENRICHMENT DATA FOR BEST CANDIDATE
    console.log('\n🏆 BEST CANDIDATE FULL DATA:');
    console.log('=====================================');
    console.log('Name:', best.name);
    console.log('Title:', best.title);
    console.log('LinkedIn:', best.linkedinUrl);
    console.log('\n📋 Enrichment Data:');
    console.log(JSON.stringify(best.enrichment, null, 2));
    console.log('\n🔍 Raw Item:');
    console.log(JSON.stringify(best._raw, null, 2));
    console.log('=====================================\n');
    
    return best;
  }

  // Helper to get "one good contact or null"
  async getBestContact(
    company: string,
    icpTitles: string[],
    city?: string
  ): Promise<LeadCandidate | null> {
    try {
      const wid = await this.createWebsetSearch(company, icpTitles, city);
      const items = await this.pollWebsetResults(wid);
      return this.pickBestContact(items, company, icpTitles);
    } catch (error) {
      console.error(`[EXA-WEBSETS] getBestContact failed:`, error);
      return null;
    }
  }

  // ────────── util ──────────
  private headers() {
    return {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
      'User-Agent': 'Split-Leads/1.1'
    };
  }
  
  private sleep(ms: number) { 
    return new Promise(r => setTimeout(r, ms)); 
  }
}

// Export singleton
export const exaWebsetsClient = new ExaWebsetsClient(); 
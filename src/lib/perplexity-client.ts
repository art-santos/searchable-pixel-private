// Compatibility helper for AbortSignal.timeout (Node 18+)
function createTimeoutSignal(timeoutMs: number): AbortSignal {
  if (typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(timeoutMs);
  }
  
  // Fallback for older Node versions
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

interface PerplexitySearchResult {
  citations: Array<{
    url: string;
    title: string;
    rank: number;
  }>;
  answer: string;
}

interface VisibilityTest {
  targetFound: boolean;
  position: number | null;
  citedDomains: string[];
  competitors: string[]; // Domain names for backward compatibility
  competitorNames: string[]; // Actual product/tool names
  competitorDomains: string[]; // Mapped domains for competitor products
  citationSnippet: string | null; // How the target is mentioned
  reasoning: string;
  topCitations: any[]; // Only top 5, not full response
  apiCallDuration: number;
  retryCount: number;
}

export async function searchWithPerplexity(
  question: string, 
  retryCount: number = 0
): Promise<PerplexitySearchResult | null> {
  console.log(`🔍 Searching Perplexity for: "${question}" (attempt ${retryCount + 1})`);
  
  const startTime = Date.now();
  
  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "user",
            content: question
          }
        ]
      }),
      signal: createTimeoutSignal(30000) // 30 second timeout
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️ Perplexity API call took ${duration}ms`);

    if (!response.ok) {
      if (response.status === 429 && retryCount < 3) {
        // Rate limited - exponential backoff
        const delay = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s
        console.log(`⏳ Rate limited, retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return searchWithPerplexity(question, retryCount + 1);
      }
      
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Debug: Log the actual data structure
    console.log(`📊 Raw Perplexity response keys:`, Object.keys(data));
    console.log(`📊 Search results found:`, data.search_results?.length || 0);
    console.log(`📊 First search result keys:`, data.search_results?.[0] ? Object.keys(data.search_results[0]) : 'None');
    
    // Get the AI-generated answer content (this is where the real content is)
    const aiAnswer = data.choices?.[0]?.message?.content || '';
    console.log(`📊 AI answer length:`, aiAnswer.length);
    console.log(`📊 AI answer preview:`, aiAnswer.substring(0, 200) + '...');
    
    // Transform search_results to citations format with AI answer as snippet
    const citations = (data.search_results || []).map((result: any, index: number) => ({
      url: result.url,
      title: result.title,
      snippet: aiAnswer, // Use the full AI answer as the "snippet" context
      rank: index + 1
    }));
    
    console.log(`📊 Transformed citations:`, citations.length);
    
    return {
      citations,
      answer: data.choices?.[0]?.message?.content || ''
    };
  } catch (error: any) {
    console.error(`❌ Perplexity search failed (attempt ${retryCount + 1}):`, error);
    
    // Retry on network errors
    if (retryCount < 2 && (error.code === 'ECONNRESET' || error.name === 'TimeoutError')) {
      const delay = Math.pow(2, retryCount) * 1000;
      console.log(`⏳ Network error, retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return searchWithPerplexity(question, retryCount + 1);
    }
    
    return null;
  }
}

export async function testVisibilityWithPerplexity(
  question: string, 
  targetDomain: string
): Promise<VisibilityTest> {
  console.log(`🎯 Testing visibility for "${targetDomain}" on question: "${question}"`);
  
  const startTime = Date.now();
  let retryCount = 0;
  
  const searchResult = await searchWithPerplexity(question, retryCount);
  const duration = Date.now() - startTime;
  
  if (!searchResult) {
    return {
      targetFound: false,
      position: null,
      citedDomains: [],
      competitors: [],
      competitorNames: [],
      competitorDomains: [],
      citationSnippet: 'Search failed - no AI response available',
      reasoning: 'Search failed after retries',
      topCitations: [],
      apiCallDuration: duration,
      retryCount
    };
  }

  const citations = searchResult.citations || [];
  const aiAnswer = searchResult.answer || '';
  const lowerTarget = targetDomain.toLowerCase();

  // Helper function to safely extract and normalize hostname
  function extractHostname(url: string): string | null {
    try {
      if (!url || typeof url !== 'string') return null;
      // Add protocol if missing
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      const hostname = new URL(fullUrl).hostname.toLowerCase();
      // Normalize by removing www.
      return hostname.replace(/^www\./, '');
    } catch (error) {
      console.log(`⚠️ Failed to parse URL: "${url}":`, error.message);
      return null;
    }
  }

  // Normalize target domain (remove www and get base name)
  const normalizedTarget = lowerTarget.replace(/^www\./, '');
  const targetBrandName = normalizedTarget.split('.')[0]; // e.g., "mercury" from "mercury.com"
  
  // Debug: Log first few citations
  console.log(`🔍 First 3 citations:`, citations.slice(0, 3).map(c => ({ url: c.url, title: c.title })));

  // === PART 1: CITATION SNIPPET CAPTURE (for all questions) ===
  
  // ALWAYS capture citation snippet from AI answer (not just when target found)
  let citationSnippet = null;
  if (aiAnswer && aiAnswer.length > 0) {
    // Extract first 1-2 sentences or first 200 characters
    const sentences = aiAnswer.split(/[.!?]+/).filter(s => s.trim().length > 20);
    if (sentences.length >= 2) {
      citationSnippet = (sentences[0] + '.' + sentences[1] + '.').trim();
    } else if (sentences.length >= 1) {
      citationSnippet = (sentences[0] + '.').trim();
    } else {
      // Fallback to first 200 characters
      citationSnippet = aiAnswer.substring(0, 200).trim() + '...';
    }
    
    // Ensure reasonable length (50-300 characters)
    if (citationSnippet.length > 300) {
      citationSnippet = citationSnippet.substring(0, 297) + '...';
    }
    
    console.log(`📄 Captured citation snippet (${citationSnippet.length} chars):`, citationSnippet.substring(0, 100) + '...');
  } else {
    citationSnippet = 'No AI response content available';
  }

  // === PART 2: TARGET VISIBILITY ANALYSIS ===
  
  // Check if target brand is mentioned in the AI answer
  const targetBrandLower = targetBrandName.toLowerCase();
  const answerLower = aiAnswer.toLowerCase();
  const brandMentionIndex = answerLower.indexOf(targetBrandLower);
  
  let targetFound = false;
  let targetPosition = null;
  
  if (brandMentionIndex !== -1) {
    targetFound = true;
    targetPosition = 1; // AI mentioned the brand in its answer
    console.log(`🎯 Target "${targetBrandName}" found in AI answer at position 1`);
  } else {
    // Check if any search result URLs contain the target domain
    for (let i = 0; i < citations.length; i++) {
      const citation = citations[i];
      const hostname = extractHostname(citation.url);
      
      if (hostname && (hostname.includes(normalizedTarget) || normalizedTarget.includes(hostname))) {
        targetFound = true;
        targetPosition = i + 1;
        console.log(`🎯 Target found via domain match at position ${targetPosition}: ${hostname}`);
        break;
      }
    }
  }

  // === PART 3: COMPETITOR EXTRACTION AND DOMAIN MAPPING ===
  
  console.log(`📝 AI answer length: ${aiAnswer.length} chars`);
  console.log(`📝 AI answer preview:`, aiAnswer.substring(0, 300) + '...');

  // Extract competitor product names from the AI answer (limit to top 5)
  const rawCompetitorNames = aiAnswer.length > 0 
    ? await extractCompetitorsFromSnippets([aiAnswer], targetBrandName)
    : [];
  
  const competitorNames = rawCompetitorNames.slice(0, 5); // Limit to top 5
  console.log(`🏆 Limited competitor names to top 5:`, competitorNames);

  // === PART 4: COMPETITOR DOMAIN MAPPING ===
  
  // Map competitor names to their likely domains
  const competitorDomains = await mapCompetitorsToDomains(competitorNames);
  console.log(`🌐 Mapped competitor domains:`, competitorDomains);

  // === PART 5: CITED DOMAINS (separate from competitors) ===
  
  // Extract all domains from citations (this is separate from competitor domains)
  const citedDomains = citations
    .map((citation: any) => extractHostname(citation.url))
    .filter(Boolean);

  console.log(`📚 Cited domains from search results:`, citedDomains);

  // Legacy competitors field (domains that cited but aren't the target)
  const legacyCompetitors = citedDomains
    .filter((domain: string) => {
      return !domain.includes(normalizedTarget) && !normalizedTarget.includes(domain);
    })
    .slice(0, 5);

  // Store only top 5 citations to save space
  const topCitations = citations.slice(0, 5).map((citation: any) => ({
    url: citation.url,
    title: citation.title?.substring(0, 200), // Truncate titles
    snippet: citationSnippet, // Use the captured snippet
    rank: citation.rank
  }));

  const result: VisibilityTest = {
    targetFound,
    position: targetPosition,
    citedDomains,
    competitors: legacyCompetitors, // Legacy field (cited domains minus target)
    competitorNames, // AI-extracted product names (limited to 5)
    competitorDomains, // Mapped domains for competitor products
    citationSnippet, // Always captured now
    reasoning: targetFound
      ? `Target found at position ${targetPosition}. Citation: "${citationSnippet?.substring(0, 100)}..."`
      : `Target not found. AI mentioned competitors: ${competitorNames.slice(0, 3).join(', ')}. Top cited domains: ${citedDomains.slice(0, 3).join(', ')}`,
    topCitations,
    apiCallDuration: duration,
    retryCount
  };

  console.log(`📋 Visibility test result:`, {
    ...result,
    citationSnippet: `"${result.citationSnippet?.substring(0, 50)}..."`,
    topCitations: `${result.topCitations.length} citations`
  });
  
  return result;
}

// Extract competitor product/tool names from search result snippets
async function extractCompetitorsFromSnippets(
  snippets: string[],
  targetBrand: string
): Promise<string[]> {
  // Skip if no snippets
  if (!snippets.length || snippets.every(s => !s)) {
    console.log('📝 No snippets available for competitor extraction');
    return [];
  }

  const prompt = `
You are analyzing search results about "${targetBrand}" to find competing products or services mentioned.

Extract ONLY the product/service names (not website domains) that are mentioned as alternatives, competitors, or comparisons to "${targetBrand}".

Examples of what to extract:
- "Brex" (not brex.com)
- "Silicon Valley Bank" (not svb.com)  
- "Chase Business Banking" (not chase.com)
- "QuickBooks" (not intuit.com)

Do NOT include:
- Website domains (mercury.com, stripe.com, etc.)
- Generic terms (banking, fintech, startup)
- The target brand "${targetBrand}" itself

Return ONLY a JSON array of product names. If no competitors are mentioned, return [].

Search result snippets to analyze:
${snippets.map((s,i) => `${i+1}. "${s}"`).join('\n\n')}

JSON array of competitor product names:`.trim();

  try {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Extract product/tool names from text snippets. Return only a JSON array of strings.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 150,
      temperature: 0.0
    });

    const content = response.choices[0]?.message?.content || '[]';
    console.log(`🤖 Competitor extraction response:`, content);
    
    // Strip markdown code blocks if present
    const cleanContent = content.replace(/```json\s*|\s*```/g, '').trim();
    console.log(`🧹 Cleaned content:`, cleanContent);
    
    const competitors = JSON.parse(cleanContent);
    console.log(`🏆 Extracted competitors:`, competitors);
    
    return Array.isArray(competitors) ? competitors.slice(0, 10) : [];
  } catch (error: any) {
    console.error('❌ Competitor extraction failed:', error.message);
    return [];
  }
}

// Map competitor product names to their likely domains
async function mapCompetitorsToDomains(competitorNames: string[]): Promise<string[]> {
  if (!competitorNames.length) {
    return [];
  }

  console.log(`🗺️ Mapping ${competitorNames.length} competitors to domains:`, competitorNames);

  const domains: string[] = [];
  
  // Common domain mapping patterns
  const commonMappings: Record<string, string> = {
    // Financial/Banking
    'brex': 'brex.com',
    'stripe': 'stripe.com', 
    'mercury': 'mercury.com',
    'silicon valley bank': 'svb.com',
    'chase': 'chase.com',
    'bank of america': 'bankofamerica.com',
    
    // AI/Research Tools
    'semantic scholar': 'semanticscholar.org',
    'research rabbit': 'researchrabbit.ai',
    'zotero': 'zotero.org',
    'mendeley': 'mendeley.com',
    'pubmed': 'pubmed.ncbi.nlm.nih.gov',
    'litmaps': 'litmaps.com',
    'paperpile': 'paperpile.com',
    'endnote': 'endnote.com',
    
    // Project Management  
    'asana': 'asana.com',
    'trello': 'trello.com',
    'monday.com': 'monday.com',
    'notion': 'notion.so',
    'clickup': 'clickup.com',
    'jira': 'atlassian.com',
    
    // General Business Tools
    'salesforce': 'salesforce.com',
    'hubspot': 'hubspot.com',
    'slack': 'slack.com',
    'microsoft teams': 'microsoft.com',
    'zoom': 'zoom.us',
    'google workspace': 'workspace.google.com'
  };

  for (const competitor of competitorNames) {
    const lowerName = competitor.toLowerCase().trim();
    
    // Check for exact mapping first
    if (commonMappings[lowerName]) {
      domains.push(commonMappings[lowerName]);
      console.log(`  ✅ Mapped "${competitor}" → ${commonMappings[lowerName]}`);
      continue;
    }
    
    // Check for partial matches
    let found = false;
    for (const [key, domain] of Object.entries(commonMappings)) {
      if (lowerName.includes(key) || key.includes(lowerName)) {
        domains.push(domain);
        console.log(`  ✅ Partial match "${competitor}" → ${domain} (via "${key}")`);
        found = true;
        break;
      }
    }
    
    if (!found) {
      // Heuristic: try converting product name to domain
      const heuristicDomain = generateHeuristicDomain(competitor);
      if (heuristicDomain) {
        domains.push(heuristicDomain);
        console.log(`  🔮 Heuristic "${competitor}" → ${heuristicDomain}`);
      } else {
        console.log(`  ❓ No mapping found for "${competitor}"`);
      }
    }
  }

  // Remove duplicates and limit to 10
  const uniqueDomains = [...new Set(domains)].slice(0, 10);
  console.log(`🗺️ Final mapped domains:`, uniqueDomains);
  
  return uniqueDomains;
}

// Generate a heuristic domain from a product name
function generateHeuristicDomain(productName: string): string | null {
  if (!productName || productName.length < 3) {
    return null;
  }
  
  // Clean the product name
  const cleaned = productName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, '') // Remove spaces
    .trim();
  
  // Skip very common words that aren't likely to be domains
  const skipWords = ['the', 'and', 'for', 'with', 'tool', 'app', 'software', 'platform', 'system', 'service'];
  if (skipWords.includes(cleaned) || cleaned.length < 3) {
    return null;
  }
  
  // Generate potential domain
  const domain = `${cleaned}.com`;
  
  // Basic validation: must be reasonable length
  if (domain.length > 30 || domain.length < 6) {
    return null;
  }
  
  return domain;
} 
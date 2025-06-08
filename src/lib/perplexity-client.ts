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
      citationSnippet: null,
      reasoning: 'Search failed after retries',
      topCitations: [],
      apiCallDuration: duration,
      retryCount
    };
  }

  const citations = searchResult.citations || [];
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

  // === PART 1: CITATION ANALYSIS (how is target mentioned?) ===
  
  // Get the AI answer content for analysis
  const aiAnswer = citations[0]?.snippet || ''; // AI answer is stored as snippet
  
  // Check if target brand is mentioned in the AI answer
  const targetBrandLower = targetBrandName.toLowerCase();
  const answerLower = aiAnswer.toLowerCase();
  const brandMentionIndex = answerLower.indexOf(targetBrandLower);
  
  let targetFound = false;
  let targetPosition = null;
  let citationSnippet = null;
  
  if (brandMentionIndex !== -1) {
    targetFound = true;
    targetPosition = 1; // AI mentioned the brand in its answer
    
    // Extract the paragraph or section that mentions the target
    const sentences = aiAnswer.split(/[.!?]+/);
    const mentionSentence = sentences.find(sentence => 
      sentence.toLowerCase().includes(targetBrandLower)
    );
    
    if (mentionSentence) {
      citationSnippet = mentionSentence.trim() + '.';
    } else {
      // Fallback: extract 200 characters around the mention
      const start = Math.max(0, brandMentionIndex - 100);
      const end = Math.min(aiAnswer.length, brandMentionIndex + 200);
      citationSnippet = aiAnswer.substring(start, end).trim();
    }
    
    console.log(`🎯 Target "${targetBrandName}" found in AI answer`);
    console.log(`📄 Citation snippet captured:`, citationSnippet.substring(0, 150) + '...');
  } else {
    // Check if any search result URLs contain the target domain
    for (let i = 0; i < citations.length; i++) {
      const citation = citations[i];
      const hostname = extractHostname(citation.url);
      
      if (hostname && (hostname.includes(normalizedTarget) || normalizedTarget.includes(hostname))) {
        targetFound = true;
        targetPosition = i + 1;
        citationSnippet = `Search result from ${hostname}: ${citation.title}`;
        console.log(`🎯 Target found via domain match at position ${targetPosition}: ${hostname}`);
        break;
      }
    }
  }

  // === PART 2: COMPETITOR EXTRACTION (what tools are recommended?) ===
  
  // Use the AI answer for competitor analysis (this is where the actual content is)
  console.log(`📝 Using AI answer for competitor analysis`);
  console.log(`📝 AI answer length:`, aiAnswer.length);
  console.log(`📝 AI answer preview:`, aiAnswer.substring(0, 300) + '...');

  // Extract competitor product names from the AI answer
  const competitorNames = aiAnswer.length > 0 
    ? await extractCompetitorsFromSnippets([aiAnswer], targetBrandName)
    : [];
  
  // === PART 3: DOMAIN ANALYSIS (for backward compatibility) ===
  
  // Extract all domains for legacy compatibility
  const allDomains = citations
    .map((citation: any) => extractHostname(citation.url))
    .filter(Boolean);

  console.log(`🌐 Extracted domains:`, allDomains);

  // Extract competitor domains (not matching target)
  const competitors = allDomains
    .filter((domain: string) => {
      return !domain.includes(normalizedTarget) && !normalizedTarget.includes(domain);
    })
    .slice(0, 5);

  const citedDomains = allDomains;

  // Store only top 5 citations to save space
  const topCitations = citations.slice(0, 5).map((citation: any) => ({
    url: citation.url,
    title: citation.title?.substring(0, 200), // Truncate titles
    snippet: citation.snippet?.substring(0, 300), // Include snippet
    rank: citation.rank
  }));

  const result: VisibilityTest = {
    targetFound,
    position: targetPosition,
    citedDomains,
    competitors, // Domain-based competitors (legacy)
    competitorNames, // AI-extracted product names (new)
    citationSnippet,
    reasoning: targetFound
      ? `Target found at position ${targetPosition}. Citation: "${citationSnippet?.substring(0, 100)}..."`
      : `Target not found in search results. AI identified competitors: ${competitorNames.slice(0, 3).join(', ')}`,
    topCitations,
    apiCallDuration: duration,
    retryCount
  };

  console.log(`📋 Visibility test result:`, {
    ...result,
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
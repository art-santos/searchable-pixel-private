const PERPLEXITY_URL = 'https://api.perplexity.ai/chat/completions'

interface PerplexityCitation {
  url: string
  title: string
  snippet: string
}

interface PerplexityResponse {
  text?: string
  citations?: PerplexityCitation[]
  choices?: { message?: { content?: string } }[]
}

// Enhanced mention type with tiers
export type MentionTier = 'tier1' | 'tier2' | 'tier3' | 'none' | 'competitor';
export type PromptType = 'high_intent' | 'medium_intent' | 'direct' | 'general';

export interface Mention {
  source: 'Perplexity'
  query: string
  mention_type: 'direct' | 'indirect' | 'competitor' | 'none'
  mention_tier: MentionTier
  prompt_type: PromptType
  prompt_weight: number
  tier_score: number
  weighted_score: number
  position_in_response: number
  snippet: string
  sentiment?: 'positive' | 'neutral' | 'negative'
  brandMentions?: Map<string, number>
  isDirectBrandQuery?: boolean
}

export interface ScoreBreakdown {
  authority_score: number // Score from indirect prompts (how often you show up when not directly asked about)
  recall_score: number    // Score from direct prompts (how consistently you're returned when asked about)
  citation_depth_score: number // How prominently you're featured in results
  visibility_score: number     // Overall weighted composite score
}

export interface VisibilityCheckResult {
  domain: string
  scores: ScoreBreakdown
  brand_rank: number
  rank_total: number
  brand_position: string
  industry_brands_detected: number
  mention_quality: {
    tier1_mentions: number
    tier2_mentions: number
    tier3_mentions: number
    no_mentions: number
  }
  prompt_performance: {
    high_intent: number
    medium_intent: number
    direct: number
    general: number
  }
  top_ranked_companies: string[]
  mentions_found: Mention[]
  last_rerolled: string
  action_plan: string[]
}

export interface VisibilityOptions {
  domain: string
  category: string
  custom_brand_terms?: string[]
  competitor_domains?: string[]
  maxQueries?: number
}

// Batch process API requests with concurrency control
async function processBatch<T, R>(
  items: T[],
  processFn: (item: T) => Promise<R>,
  batchSize: number = 5,
  onProgress?: (completed: number, total: number) => void
): Promise<R[]> {
  const results: R[] = [];
  const totalItems = items.length;
  let processedCount = 0;

  console.log(`Starting batch processing of ${totalItems} items with batch size ${batchSize}`);

  // Process in batches
  for (let i = 0; i < totalItems; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    console.log(`Processing batch ${i/batchSize + 1}/${Math.ceil(totalItems/batchSize)}, items ${i+1}-${Math.min(i+batchSize, totalItems)}`);
    
    // Process batch in parallel
    const batchPromises = batch.map(async (item, idx) => {
      try {
        console.log(`Starting item ${i + idx + 1}/${totalItems}`);
        const result = await processFn(item);
        processedCount++;
        
        if (onProgress) {
          onProgress(processedCount, totalItems);
        }
        
        console.log(`Completed item ${i + idx + 1}/${totalItems}`);
        return result;
      } catch (error) {
        console.error(`Error processing item ${i + idx + 1}/${totalItems}:`, error);
        processedCount++;
        
        if (onProgress) {
          onProgress(processedCount, totalItems);
        }
        
        throw error;
      }
    });
    
    // Wait for current batch to complete before moving to next batch
    console.log(`Waiting for batch ${i/batchSize + 1} to complete...`);
    const batchResults = await Promise.allSettled(batchPromises);
    console.log(`Batch ${i/batchSize + 1} completed with ${batchResults.filter(r => r.status === 'fulfilled').length} successful and ${batchResults.filter(r => r.status === 'rejected').length} failed results`);
    
    // Extract values from fulfilled promises
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        // Add a placeholder for rejected promises
        console.error(`Batch promise was rejected:`, result.reason);
        results.push(null as unknown as R);
      }
    }
    
    // Small delay between batches to prevent rate limiting
    if (i + batchSize < totalItems) {
      console.log(`Adding delay before next batch...`);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  console.log(`Batch processing complete. ${results.filter(Boolean).length} successful results out of ${totalItems} total items.`);
  return results.filter(Boolean); // Remove null values
}

// Function to call the Perplexity API with timeout
async function callPerplexityWithTimeout(query: string, timeoutMs: number = 10000): Promise<PerplexityResponse> {
  const apiKey = process.env.PERPLEXITY_API_KEY
  
  if (!apiKey) {
    throw new Error('Perplexity API key not configured')
  }
  
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const res = await fetch(PERPLEXITY_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: 'You are a research assistant who uses real-time web search to answer questions accurately. Always cite your sources, prioritize high-quality references, and keep your answers concise and focused.' },
          { role: 'user', content: query }
        ],
        max_tokens: 1000
      }),
      signal: controller.signal
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(`Perplexity API error: ${res.status} - ${JSON.stringify(errorData)}`)
    }

    return (await res.json()) as PerplexityResponse
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error(`Perplexity API request timed out after ${timeoutMs}ms`);
    }
    console.error('Perplexity API call failed:', error)
    throw error
  } finally {
    clearTimeout(timeoutId);
  }
}

// Simplified version of callPerplexity for the main export
async function callPerplexity(query: string): Promise<PerplexityResponse> {
  return callPerplexityWithTimeout(query);
}

// Function to categorize prompts by their type and weight
interface PromptMetadata {
  type: PromptType;
  weight: number;
}

function categorizePrompt(query: string, domain: string, category: string): PromptMetadata {
  const lowerQuery = query.toLowerCase();
  const lowerDomain = domain.toLowerCase();
  
  // Check if this is a direct brand query
  if (lowerQuery.includes(lowerDomain)) {
    return { type: 'direct', weight: 1.0 };
  }
  
  // High-intent category searches
  const highIntentPatterns = [
    `best ${category}`,
    `top ${category}`,
    `leading ${category}`,
    `most popular ${category}`,
    `recommended ${category}`,
    `${category} market leaders`,
    `compare ${category}`,
    `${category} comparison`
  ];
  
  if (highIntentPatterns.some(pattern => lowerQuery.includes(pattern))) {
    return { type: 'high_intent', weight: 1.5 };
  }
  
  // Medium-intent comparison or features queries
  const mediumIntentPatterns = [
    'vs',
    'versus',
    'compared to',
    'alternative',
    'alternatives',
    'review',
    'reviews',
    'pricing',
    'features'
  ];
  
  if (mediumIntentPatterns.some(pattern => lowerQuery.includes(pattern))) {
    return { type: 'medium_intent', weight: 1.2 };
  }
  
  // Default to general query
  return { type: 'general', weight: 1.0 };
}

// Generate dynamic prompts with balanced distribution of types
async function generateDynamicPrompts(domain: string, category: string, count: number = 100): Promise<{query: string, metadata: PromptMetadata}[]> {
  try {
    // Define targets for each prompt type
    const targetDistribution = {
      high_intent: Math.floor(count * 0.35), // 35% high-intent category queries
      medium_intent: Math.floor(count * 0.30), // 30% medium-intent comparison queries
      direct: Math.floor(count * 0.20), // 20% direct brand queries
      general: Math.floor(count * 0.15)  // 15% general industry queries
    };
    
    const promptGenerationQuery = `
    I need to test how well a company named '${domain}' shows up in AI answer engines and search results for the ${category} industry.
    
    Create a varied set of search queries across these four categories:
    
    1. HIGH-INTENT CATEGORY QUERIES (${targetDistribution.high_intent} queries): Questions about top/best/leading tools in ${category} where the brand might be mentioned if well-known.
    Example: "What are the best ${category} tools for small businesses?"
    
    2. MEDIUM-INTENT COMPARISON QUERIES (${targetDistribution.medium_intent} queries): Questions comparing solutions or alternatives in the space.
    Example: "Compare top ${category} platforms" or "${category} tool X vs Y"
    
    3. DIRECT BRAND QUERIES (${targetDistribution.direct} queries): Questions explicitly about ${domain}.
    Example: "What is ${domain}?" or "How does ${domain} work for ${category}?"
    
    4. GENERAL INDUSTRY QUERIES (${targetDistribution.general} queries): General questions about ${category} where brands might be mentioned.
    Example: "Latest trends in ${category}" or "How are companies using ${category}?"
    
    Format your response as a numbered list with just the queries, nothing else.
    `;

    const response = await callPerplexity(promptGenerationQuery);
    const content = response.choices?.[0]?.message?.content || "";
    
    // Extract queries from the numbered list
    const rawQueries = content
      .split("\n")
      .map(line => line.trim())
      .filter(line => /^\d+\./.test(line)) // Lines starting with a number and period
      .map(line => line.replace(/^\d+\.\s*/, "").trim()) // Remove the numbering
      .filter(query => query.length > 0);
    
    // Categorize all queries
    const queriesWithMetadata = rawQueries.map(query => ({
      query,
      metadata: categorizePrompt(query, domain, category)
    }));
    
    // If we have enough queries, balance them according to our target distribution
    if (queriesWithMetadata.length >= count / 2) {
      const categorizedQueries: Record<PromptType, {query: string, metadata: PromptMetadata}[]> = {
        high_intent: [],
        medium_intent: [],
        direct: [],
        general: []
      };
      
      // Sort queries into their categories
      queriesWithMetadata.forEach(item => {
        categorizedQueries[item.metadata.type].push(item);
      });
      
      // Create a balanced set
      let result: {query: string, metadata: PromptMetadata}[] = [];
      
      // Take queries from each category up to the target distribution
      Object.entries(targetDistribution).forEach(([type, target]) => {
        const typeQueries = categorizedQueries[type as PromptType];
        const toTake = Math.min(target, typeQueries.length);
        result = result.concat(typeQueries.slice(0, toTake));
      });
      
      // If we're still short on queries, fill with what we have
      if (result.length < count) {
        const remaining = queriesWithMetadata
          .filter(item => !result.includes(item))
          .slice(0, count - result.length);
        result = result.concat(remaining);
      }
      
      return result.slice(0, count);
    }
    
    // If we didn't get enough queries, fall back to default prompts
    return getDefaultPrompts(domain, category);
  } catch (error) {
    console.error("Error generating dynamic prompts:", error);
    return getDefaultPrompts(domain, category);
  }
}

// Default prompts as fallback
function getDefaultPrompts(domain: string, category: string): {query: string, metadata: PromptMetadata}[] {
  const defaultQueries = [
    // High-intent category queries
    `What are the top tools for ${category}?`,
    `Best ${category} solutions for small businesses`,
    `${category} market leaders review`,
    `Most reliable ${category} tools`,
    `${category} platforms used by Fortune 500`,
    `Enterprise-grade ${category} solutions`,
    `${category} tools with best ROI`,
    `Most popular ${category} software in 2025`,
    `Trending ${category} platforms`,
    `Leading ${category} providers`,
    
    // Medium-intent comparison queries
    `${domain} vs competitors`,
    `Compare top ${category} platforms`,
    `Alternatives to leading ${category} tools`,
    `${category} tools comparison`,
    `What's better than current ${category} solutions`,
    `${category} tools feature comparison`,
    `Pros and cons of different ${category} providers`,
    `${category} pricing comparison`,
    `Which ${category} platform has the best UX`,
    `${category} solution with best integration options`,
    
    // Direct brand queries
    `Tell me about ${domain}`,
    `What is ${domain}?`,
    `How does ${domain} work?`,
    `${domain} pricing and features`,
    `${domain} reviews from users`,
    `Is ${domain} worth it for ${category}?`,
    `${domain} pros and cons`,
    `${domain} customer support quality`,
    `${domain} use cases`,
    `${domain} API capabilities`,
    
    // General industry queries
    `What AI tools are helping companies with ${category}?`,
    `What companies are building ${category} tools in 2025?`,
    `${category} emerging trends and leaders`,
    `Who are the innovators in ${category}?`,
    `How to choose a ${category} provider`,
    `${category} industry disruption`,
    `Who is changing the game in ${category}?`,
    `Future of ${category} technology`,
    `How are startups approaching ${category}`,
    `${category} adoption challenges`
  ];
  
  return defaultQueries.map(query => ({
    query,
    metadata: categorizePrompt(query, domain, category)
  }));
}

// Extract and count brand mentions from text
function extractBrandMentions(text: string, ownBrand: string, knownCompetitors: string[] = []): Map<string, number> {
  const brandMentions = new Map<string, number>();
  const lowerText = text.toLowerCase();
  
  // First check for the client's brand and known competitors
  const knownBrands = [ownBrand, ...knownCompetitors];
  
  for (const brand of knownBrands) {
    if (brand && lowerText.includes(brand.toLowerCase())) {
      const count = brandMentions.get(brand) || 0;
      brandMentions.set(brand, count + 1);
    }
  }
  
  // Enhanced list of common words and headings to exclude
  const commonWords = [
    // Pronouns
    'I', 'The', 'A', 'An', 'This', 'That', 'These', 'Those', 'It', 'They',
    'Here', 'There', 'Where', 'When', 'Why', 'How', 'Who', 'What', 'Which',
    
    // Common content headings in AI responses
    'Pricing', 'Key Features', 'Features', 'Best', 'Key', 'Both',
    'Tool', 'Tools', 'Feature', 'Using', 'Comparison', 'Summary', 
    'While', 'Because', 'However', 'Therefore', 'Thus', 'Such',
    'Example', 'Examples', 'Focus', 'Offers', 'Benefits', 'Pros',
    'Cons', 'Strengths', 'Use Cases', 'Use Case', 'Overview',
    'Introduction', 'Conclusion', 'Summary', 'Background', 'Context',
    
    // Common marketing words
    'Premium', 'Free', 'Basic', 'Enterprise', 'Professional', 'Standard',
    'Solution', 'Platform', 'Service', 'Software', 'Product', 'Integration',
    'First', 'Second', 'Third', 'Options', 'Alternative', 'Alternatives',
    'Core', 'Popular', 'Leading', 'Modern', 'Advanced', 'Simple'
  ];

  // Common section headings or formatting markers in AI responses
  const sectionPatterns = [
    /^Key Features/i, 
    /^Pricing/i,
    /^Best for/i,
    /^Conclusion/i,
    /^Summary/i,
    /^Comparison/i,
    /^Features/i,
    /^Use Cases?/i,
    /^Benefits/i,
    /^Advantages/i,
    /^Recommended for/i,
    /^Ideal for/i,
    /^Perfect for/i,
    /^Introduction/i,
    /^Overview/i,
    /^Purpose/i,
    /^Target/i,
    /^When to Use/i,
    /^How it Works/i
  ];
  
  // Then look for potential brand patterns using regex
  // Look for capitalized terms that might be brands - more strict pattern
  const potentialBrandRegex = /\b([A-Z][a-z]+(?:\.?(?:ai|io|com|co|net|org))?(?:\s[A-Z][a-z]+)*)\b/g;
  const potentialBrands = [...text.matchAll(potentialBrandRegex)].map(m => m[1]);
  
  // Filter out common non-brand capitalized words
  for (const potentialBrand of potentialBrands) {
    // Skip if it's a common word, heading, or too short
    if (
      potentialBrand.length <= 3 || 
      commonWords.some(w => w.toLowerCase() === potentialBrand.toLowerCase()) ||
      sectionPatterns.some(pattern => pattern.test(potentialBrand)) ||
      knownBrands.some(b => potentialBrand.toLowerCase().includes(b.toLowerCase()))
    ) {
      continue;
    }
    
    // Skip terms with certain patterns that indicate they're likely not brands
    const nonBrandPatterns = [
      /^[A-Z][a-z]+ [a-z]+/, // "Key features", "Main benefits" - capitalized first word only
      /^[0-9]/, // Starts with a number
      /^Specific/, // Words that often start descriptions rather than brand names
      /^Custom/,
      /^Automated/,
      /Example/i,
      /Comparison/i,
      /^Best/i,
      /^Most/i,
      /^Top/i,
      /^Popular/i,
      /^Premium/i,
      /^Free/i,
      /^Based/i,
      /^Full/i,
      /^Great/i,
      /^More/i
    ];
    
    if (nonBrandPatterns.some(pattern => pattern.test(potentialBrand))) {
      continue;
    }
    
    // Check if the term appears at least twice - likely more meaningful
    const matches = text.match(new RegExp(`\\b${potentialBrand}\\b`, 'g'));
    const occurrences = matches ? matches.length : 0;
    
    // Add to the map with the occurrence count if it appears multiple times
    if (occurrences >= 1) {
      const count = brandMentions.get(potentialBrand) || 0;
      brandMentions.set(potentialBrand, count + occurrences);
    }
  }
  
  // Additional filter to remove any non-company-like names based on character patterns
  for (const [brand] of Array.from(brandMentions.entries())) {
    // Remove entries with suspicious patterns
    if (
      brand.length <= 2 || // Too short
      /[a-z][A-Z]/.test(brand) || // camelCase (unlikely in brand names)
      /\d{3,}/.test(brand) || // Contains 3+ consecutive digits
      /^[^A-Za-z0-9]/.test(brand) || // Starts with a non-alphanumeric character
      /^(If|When|Then|And|Or|But|So|As)[ \.]/.test(brand) // Starts with a conjunction
    ) {
      brandMentions.delete(brand);
    }
  }
  
  return brandMentions;
}

// Analyze sentiment in a text
function analyzeSentiment(text: string, brandTerms: string[]): 'positive' | 'neutral' | 'negative' {
  const lowerText = text.toLowerCase();
  
  const positivePhrases = [
    'best', 'excellent', 'top', 'leading', 'recommended', 'innovative', 
    'reliable', 'trusted', 'secure', 'advanced', 'powerful', 'effective',
    'seamless', 'impressive', 'exceptional', 'outstanding', 'preferred'
  ];
  
  const negativePhrases = [
    'avoid', 'poor', 'bad', 'terrible', 'worst', 'issue', 'problem', 
    'disappointing', 'expensive', 'overpriced', 'difficult', 'complex',
    'outdated', 'unreliable', 'avoid', 'lacking', 'limitation'
  ];
  
  // Check for brand terms near sentiment indicators
  let positiveScore = 0;
  let negativeScore = 0;
  
  for (const term of brandTerms) {
    if (!lowerText.includes(term.toLowerCase())) continue;
    
    // Get the context around brand mention (30 words before and after)
    const words = lowerText.split(/\s+/);
    const brandIndices = [];
    
    // Find all occurrences of the brand term
    for (let i = 0; i < words.length; i++) {
      if (words[i].includes(term.toLowerCase())) {
        brandIndices.push(i);
      }
    }
    
    // Analyze sentiment around each mention
    for (const index of brandIndices) {
      const contextStart = Math.max(0, index - 30);
      const contextEnd = Math.min(words.length, index + 30);
      const context = words.slice(contextStart, contextEnd).join(' ');
      
      for (const phrase of positivePhrases) {
        if (context.includes(phrase)) positiveScore++;
      }
      
      for (const phrase of negativePhrases) {
        if (context.includes(phrase)) negativeScore++;
      }
    }
  }
  
  if (positiveScore > negativeScore + 1) return 'positive';
  if (negativeScore > positiveScore + 1) return 'negative';
  return 'neutral';
}

// Determine the mention tier based on position and context
function determineMentionTier(
  text: string, 
  brandTerms: string[], 
  mentionType: 'direct' | 'indirect' | 'competitor' | 'none'
): { tier: MentionTier, position: number, tierScore: number } {
  if (mentionType === 'none') {
    return { tier: 'none', position: -1, tierScore: 0 };
  }
  
  if (mentionType === 'competitor') {
    return { tier: 'competitor', position: -1, tierScore: 0 };
  }
  
  // Search for earliest brand mention
  const lowerText = text.toLowerCase();
  const paragraphs = text.split(/\n\n+/);
  
  let earliestPosition = Infinity;
  let mentionParagraphIndex = -1;
  
  // Find the earliest paragraph containing brand mention
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i].toLowerCase();
    for (const term of brandTerms) {
      if (paragraph.includes(term.toLowerCase())) {
        mentionParagraphIndex = i;
        earliestPosition = Math.min(earliestPosition, paragraph.indexOf(term.toLowerCase()));
        break;
      }
    }
    if (mentionParagraphIndex !== -1) break;
  }
  
  if (mentionParagraphIndex === -1) {
    // For indirect mentions where the brand isn't explicitly named
    if (mentionType === 'indirect') {
      return { tier: 'tier3', position: -1, tierScore: 2 };
    }
    return { tier: 'none', position: -1, tierScore: 0 };
  }
  
  // Determine tier based on paragraph position and prominence
  if (mentionParagraphIndex === 0) {
    // First paragraph mention (very prominent)
    return { tier: 'tier1', position: 1, tierScore: 10 };
  } else if (mentionParagraphIndex <= 2) {
    // Early mention (moderately prominent)
    return { tier: 'tier2', position: mentionParagraphIndex + 1, tierScore: 5 };
  } else {
    // Later mention (less prominent)
    return { tier: 'tier3', position: mentionParagraphIndex + 1, tierScore: 2 };
  }
}

// Generate personalized action plan based on scores
function generateActionPlan(
  scores: ScoreBreakdown,
  domain: string,
  category: string,
  mentionQuality: {
    tier1_mentions: number
    tier2_mentions: number
    tier3_mentions: number
    no_mentions: number
  },
  promptPerformance: {
    high_intent: number
    medium_intent: number
    direct: number
    general: number
  }
): string[] {
  const actionPlan: string[] = [];
  
  // Base recommendations
  actionPlan.push('Publish more comparison articles that position your brand alongside top competitors.');
  actionPlan.push('Add FAQ schema to pricing and product pages for improved answer engine indexing.');
  
  // Low authority score (not showing up in category searches)
  if (scores.authority_score < 40) {
    actionPlan.push(`Create detailed guides about "${category}" that naturally mention your brand.`);
    actionPlan.push('Develop thought leadership content aimed at common industry questions.');
    actionPlan.push(`Submit guest posts to industry publications mentioning ${domain} as a solution.`);
  }
  
  // Low recall score (not showing up consistently when asked about directly)
  if (scores.recall_score < 60) {
    actionPlan.push(`Ensure your website has clear, structured information about what ${domain} does.`);
    actionPlan.push('Create a Wikipedia page or update existing listings on directory sites.');
    actionPlan.push('Generate more customer testimonials and case studies with specific keywords.');
  }
  
  // Low citation depth (not prominent enough in results)
  if (scores.citation_depth_score < 50) {
    actionPlan.push('Work on getting more first-paragraph mentions in industry articles.');
    actionPlan.push(`Position ${domain} as a category leader in PR releases and media coverage.`);
    actionPlan.push('Create distinctive feature comparisons that highlight your unique value.');
  }
  
  // Low performance in high-intent queries
  if (promptPerformance.high_intent < 30) {
    actionPlan.push(`Target "best ${category}" keywords in your content strategy.`);
    actionPlan.push('Submit to industry rankings and "top tools" lists.');
    actionPlan.push(`Create content comparing the top ${category} tools including yours.`);
  }
  
  // Few tier1 mentions
  if (mentionQuality.tier1_mentions < mentionQuality.tier2_mentions + mentionQuality.tier3_mentions) {
    actionPlan.push('Focus on getting more prominent mentions rather than just more mentions.');
    actionPlan.push('Create definitive category resources that position your brand as an authority.');
  }
  
  return actionPlan.slice(0, 10); // Limit to 10 recommendations
}

// New function to validate brands using LLM
async function validateBrandsWithLLM(
  potentialBrands: [string, number][],
  category: string
): Promise<[string, number][]> {
  if (potentialBrands.length === 0) return [];
  
  // Limit to top 50 mentions to avoid excessive API calls
  const brandsToValidate = potentialBrands
    .filter(([brand, count]) => count > 1 && brand.length > 2)
    .slice(0, 50);
  
  if (brandsToValidate.length === 0) return [];
  
  console.log(`Validating ${brandsToValidate.length} potential brands with LLM`);
  
  // Create a validation prompt for the Perplexity API
  const brandNames = brandsToValidate.map(([brand]) => brand).join(', ');
  const prompt = `From the following list of potential company or product names in the ${category} industry, return only the actual company or product names and remove any common words, headings, or phrases that aren't real brands. Format the response as a comma-separated list of just the valid brand names:

${brandNames}`;

  try {
    // Call Perplexity API to validate
    const response = await callPerplexity(prompt);
    const result = response.choices?.[0]?.message?.content || 
                  response.text || 
                  '';
    
    // Extract the validated brands
    const validatedBrandsList = result
      .split(',')
      .map(b => b.trim())
      .filter(b => b.length > 2);
    
    console.log(`LLM validated brands: ${validatedBrandsList.join(', ')}`);
    
    // Return only the validated brands with their counts
    return brandsToValidate.filter(([brand]) => 
      validatedBrandsList.some(validBrand => 
        brand.toLowerCase() === validBrand.toLowerCase() ||
        validBrand.toLowerCase().includes(brand.toLowerCase()) ||
        brand.toLowerCase().includes(validBrand.toLowerCase())
      )
    );
  } catch (error) {
    console.error('Error validating brands with LLM:', error);
    
    // Fallback to basic filtering in case of API error
    return brandsToValidate.filter(([brand, count]) => {
      const commonTermsToFilter = [
        'pricing', 'key features', 'features', 'key', 'best', 'here', 'both',
        'comparison', 'tool', 'tools', 'when', 'while', 'feature', 'example',
        'summary', 'overview', 'conclusion', 'benefits', 'advantages',
        'use case', 'use cases', 'pros', 'cons', 'strengths'
      ];
      
      return !commonTermsToFilter.some(term => brand.toLowerCase() === term.toLowerCase());
    });
  }
}

// Updated checkVisibility function with parallel processing and tiered scoring
export async function checkVisibility(
  options: VisibilityOptions,
  onProgress?: (completed: number, total: number) => void
): Promise<VisibilityCheckResult> {
  const {
    domain,
    category,
    custom_brand_terms = [],
    competitor_domains = [],
    maxQueries = 100
  } = options

  if (!domain || !category) {
    throw new Error('domain and category are required')
  }

  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error('Perplexity API key not configured')
  }

  // Generate dynamic prompts with metadata
  const promptsWithMetadata = await generateDynamicPrompts(domain, category, maxQueries);
  
  // Add the domain name and custom brand terms to the search terms
  const brandTerms = [domain, ...custom_brand_terms].filter(Boolean);
  
  const mentions: Mention[] = [];
  
  // Store metrics for each prompt type
  const promptTypeScores: Record<PromptType, number[]> = {
    high_intent: [],
    medium_intent: [],
    direct: [],
    general: []
  };
  
  // Store metrics for tiered mentions
  const mentionQuality = {
    tier1_mentions: 0,
    tier2_mentions: 0,
    tier3_mentions: 0,
    no_mentions: 0
  };
  
  // Track all brand mentions across all queries
  const globalBrandMentions = new Map<string, number>();
  
  // Track brand mentions specifically from indirect queries (excluding direct brand queries)
  const indirectBrandMentions = new Map<string, number>();
  
  // Add the client's brand to ensure it's in the ranking even with 0 mentions
  globalBrandMentions.set(domain, 0);
  indirectBrandMentions.set(domain, 0);
  competitor_domains.forEach(comp => {
    globalBrandMentions.set(comp, 0);
    indirectBrandMentions.set(comp, 0);
  });

  // Define the processing function for each query
  const processQuery = async (queryData: {query: string, metadata: PromptMetadata}): Promise<Mention> => {
    try {
      const { query, metadata } = queryData;
      const data = await callPerplexityWithTimeout(query);
      const snippet =
        data.choices?.[0]?.message?.content ||
        data.text ||
        data.citations?.[0]?.snippet ||
        '';
      
      const textLower = snippet.toLowerCase();
      
      // Extract all brand mentions from this response
      const brandMentionsInResponse = extractBrandMentions(snippet, domain, competitor_domains);
      
      // Check for direct brand mentions
      const directMention = brandTerms.some(term =>
        textLower.includes(term.toLowerCase())
      );
      
      // Check for competitor mentions
      let competitorMention = false;
      let mentionedCompetitor = '';
      
      for (const comp of competitor_domains) {
        if (textLower.includes(comp.toLowerCase())) {
          competitorMention = true;
          mentionedCompetitor = comp;
          break;
        }
      }
      
      // Determine mention type
      let mentionType: 'direct' | 'indirect' | 'competitor' | 'none' = 'none';
      
      if (directMention) {
        mentionType = 'direct';
      } else if (competitorMention) {
        mentionType = 'competitor';
      } else if (snippet.length > 10) {  // Has content but no direct mention
        mentionType = 'indirect';
      }
      
      // Flag whether this was a direct brand query (not just a direct mention)
      const isDirectBrandQuery = metadata.type === 'direct';
      
      // Determine mention tier and position
      const { tier, position, tierScore } = determineMentionTier(snippet, brandTerms, mentionType);
      
      // Calculate weighted score
      const weightedScore = tierScore * metadata.weight;
      
      // Analyze sentiment if direct mention
      const sentiment = directMention ? analyzeSentiment(snippet, brandTerms) : undefined;
      
      return {
        source: 'Perplexity',
        query,
        mention_type: mentionType,
        mention_tier: tier,
        prompt_type: metadata.type,
        prompt_weight: metadata.weight,
        tier_score: tierScore,
        weighted_score: weightedScore,
        position_in_response: position,
        snippet,
        sentiment,
        brandMentions: brandMentionsInResponse,
        isDirectBrandQuery
      };
    } catch (err: any) {
      return {
        source: 'Perplexity',
        query: queryData.query,
        mention_type: 'none',
        mention_tier: 'none',
        prompt_type: queryData.metadata.type,
        prompt_weight: queryData.metadata.weight,
        tier_score: 0,
        weighted_score: 0,
        position_in_response: -1,
        snippet: `Error: ${err.message || String(err)}`,
        isDirectBrandQuery: queryData.metadata.type === 'direct'
      };
    }
  };

  // Process all queries in parallel with batching
  const batchSize = 5; // Adjust based on your rate limits
  console.log(`Starting to process ${promptsWithMetadata.length} prompts in batches of ${batchSize}`);
  const results = await processBatch(promptsWithMetadata, processQuery, batchSize, onProgress);
  console.log(`Finished processing all prompts, got ${results.length} results`);
  
  // Combine results
  for (const result of results) {
    if (!result) continue;
    
    mentions.push(result);
    
    // Update tier counts
    if (result.mention_tier === 'tier1') mentionQuality.tier1_mentions++;
    else if (result.mention_tier === 'tier2') mentionQuality.tier2_mentions++;
    else if (result.mention_tier === 'tier3') mentionQuality.tier3_mentions++;
    else if (result.mention_tier === 'none') mentionQuality.no_mentions++;
    
    // Add score to prompt type tracking
    promptTypeScores[result.prompt_type].push(result.weighted_score);
    
    // Update global brand mentions
    if (result.brandMentions) {
      // Convert Map to Object before logging to avoid circular reference issues
      console.log(`Processing brand mentions from ${result.isDirectBrandQuery ? 'direct' : 'indirect'} query: ${JSON.stringify(Object.fromEntries(result.brandMentions))}`);
      
      result.brandMentions.forEach((count, brand) => {
        // Always update the global brand mentions count
        const currentCount = globalBrandMentions.get(brand) || 0;
        globalBrandMentions.set(brand, currentCount + count);
        
        // Only update indirect brand mentions if this wasn't a direct brand query
        if (!result.isDirectBrandQuery) {
          const currentIndirectCount = indirectBrandMentions.get(brand) || 0;
          indirectBrandMentions.set(brand, currentIndirectCount + count);
        }
      });
    }
  }

  // Calculate metrics by prompt type
  const getAverageScore = (scores: number[]) => 
    scores.length ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length)) : 0;
  
  const promptPerformance = {
    high_intent: getAverageScore(promptTypeScores.high_intent),
    medium_intent: getAverageScore(promptTypeScores.medium_intent),
    direct: getAverageScore(promptTypeScores.direct),
    general: getAverageScore(promptTypeScores.general)
  };
  
  // Calculate the different score components
  const authorityScore = Math.round(
    (getAverageScore(promptTypeScores.high_intent) * 1.5 + 
     getAverageScore(promptTypeScores.medium_intent) * 1.0 + 
     getAverageScore(promptTypeScores.general) * 0.8) / 3.3 * 100 / 10
  );
  
  const recallScore = Math.round(
    getAverageScore(promptTypeScores.direct) * 10
  );
  
  const citationDepthScore = Math.round(
    ((mentionQuality.tier1_mentions * 10 + mentionQuality.tier2_mentions * 5 + mentionQuality.tier3_mentions * 2) / 
     (mentions.length * 10)) * 100
  );
  
  // Weighted composite score
  const visibilityScore = Math.round(
    (authorityScore * 0.4 + recallScore * 0.3 + citationDepthScore * 0.3)
  );
  
  // Use indirectBrandMentions for brand ranking, not globalBrandMentions
  // Create sorted brand ranking from all detected brands in indirect queries
  const brandRankingList = Array.from(indirectBrandMentions.entries())
    .sort((a, b) => b[1] - a[1]); // Sort by count, descending
    
  console.log('Using only indirect brand mentions for ranking, excluding direct brand queries');
  console.log('Top companies from indirect mentions:', 
    brandRankingList.slice(0, 5).map(([brand, count]) => `${brand}: ${count}`)
  );
  
  // First apply basic filtering for definitely non-brand terms
  const basicFilteredBrands = brandRankingList.filter(([brand, count]) => {
    // List of common terms wrongly detected as brands
    const commonTermsToFilter = [
      'pricing', 'key features', 'features', 'key', 'best', 'here', 'both',
      'comparison', 'tool', 'tools', 'when', 'while', 'feature', 'example',
      'summary', 'overview', 'conclusion', 'benefits', 'advantages',
      'use case', 'use cases', 'pros', 'cons', 'strengths', 'about', 'more',
      'what', 'why', 'how', 'who', 'where', 'when', 'options', 'solution',
      'solutions', 'platform', 'service', 'services', 'software'
    ];
    
    // Reject common terms regardless of case
    if (commonTermsToFilter.some(term => brand.toLowerCase() === term.toLowerCase())) {
      return false;
    }
    
    // Reject if starts with certain patterns
    const rejectPatterns = [
      /^[0-9]/, // Starts with number
      /^comparison/i,
      /^feature/i,
      /^key/i,
      /^best/i,
      /^pricing/i,
      /^summary/i,
      /^overview/i,
      /^premium/i,
      /^free/i,
      /^online/i,
      /^specific/i,
      /^additional/i,
      /^first/i, 
      /^second/i,
      /^third/i
    ];
    
    if (rejectPatterns.some(pattern => pattern.test(brand))) {
      return false;
    }
    
    // Reject single letters or very short terms
    if (brand.length <= 2) {
      return false;
    }
    
    // Require minimum mentions to be included in ranking
    return count > 1 && brand.length > 3;
  });
  
  // Report progress of starting brand validation
  if (onProgress) {
    onProgress(promptsWithMetadata.length, promptsWithMetadata.length + 1);
  }
  
  // Now use LLM to validate the remaining potential brands
  console.log(`Applying LLM validation to ${basicFilteredBrands.length} potential brands`);
  const validatedBrands = await validateBrandsWithLLM(basicFilteredBrands, category);
  
  // Report complete progress after brand validation
  if (onProgress) {
    onProgress(promptsWithMetadata.length + 1, promptsWithMetadata.length + 1);
  }
  
  console.log(`After LLM validation: ${validatedBrands.length} valid brands identified`);
  const filteredBrandRankingList = validatedBrands.length > 0 ? validatedBrands : basicFilteredBrands;
    
  // Find client's position in the ranking
  let clientPosition = filteredBrandRankingList.findIndex(([brand]) => 
    brand.toLowerCase() === domain.toLowerCase()) + 1;
  
  // If client's brand isn't in the list, add it as the last position
  if (clientPosition === 0) {
    clientPosition = filteredBrandRankingList.length + 1;
  }
  
  // Format position as #X out of Y
  const brandPosition = `#${clientPosition} of ${filteredBrandRankingList.length}`;
  
  // Get top 5 brands (or fewer if there aren't 5)
  const topCompanies = filteredBrandRankingList
    .slice(0, 5)
    .map(([brand]) => brand);
  
  // Scores breakdown
  const scores: ScoreBreakdown = {
    authority_score: authorityScore,
    recall_score: recallScore,
    citation_depth_score: citationDepthScore,
    visibility_score: visibilityScore
  };
  
  // Generate personalized action plan based on scores
  const actionPlan = generateActionPlan(
    scores,
    domain,
    category,
    mentionQuality,
    promptPerformance
  );

  // Log the visibility result structure before returning
  console.log('Finished calculating all metrics');
  console.log('Number of mentions:', mentions.length);
  console.log('Top companies discovered:', 
    Array.from(globalBrandMentions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([brand, count]) => `${brand}: ${count}`)
  );
  
  // Test serialization before returning
  try {
    // Create the result object
    const result = {
      domain,
      scores,
      brand_rank: clientPosition,
      rank_total: filteredBrandRankingList.length,
      brand_position: brandPosition,
      industry_brands_detected: filteredBrandRankingList.length,
      mention_quality: mentionQuality,
      prompt_performance: promptPerformance,
      top_ranked_companies: topCompanies,
      mentions_found: mentions,
      last_rerolled: new Date().toISOString(),
      action_plan: actionPlan
    };
    
    // Test serialization before returning
    const serialized = JSON.stringify(result);
    console.log(`Successfully serialized result (${serialized.length} characters)`);
    
    // Log some debug info about the mentions
    const longestSnippet = mentions.reduce((max, m) => 
      m.snippet && m.snippet.length > max ? m.snippet.length : max, 0);
    console.log(`Longest snippet: ${longestSnippet} characters`);
    
    // Return the validated result
    return result;
  } catch (err) {
    console.error('ERROR: Could not serialize the result', err);
    
    // Try to identify problematic mentions
    mentions.forEach((mention, idx) => {
      try {
        JSON.stringify(mention);
      } catch (e) {
        console.error(`Problematic mention at index ${idx}:`, e);
        // Truncate problematic snippets
        if (mention.snippet && mention.snippet.length > 1000) {
          mention.snippet = mention.snippet.substring(0, 1000) + "... [truncated]";
        }
      }
    });
    
    // Return a simplified result if serialization failed
    return {
      domain,
      scores,
      brand_rank: clientPosition,
      rank_total: filteredBrandRankingList.length,
      brand_position: brandPosition,
      industry_brands_detected: filteredBrandRankingList.length,
      mention_quality: mentionQuality,
      prompt_performance: promptPerformance,
      top_ranked_companies: topCompanies,
      mentions_found: mentions.map(m => ({
        ...m,
        snippet: m.snippet ? (m.snippet.substring(0, 500) + "... [truncated]") : "",
        brandMentions: undefined // Remove potentially problematic Map objects
      })),
      last_rerolled: new Date().toISOString(),
      action_plan: actionPlan
    };
  }
}

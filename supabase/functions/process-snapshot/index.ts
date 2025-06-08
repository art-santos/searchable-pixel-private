import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseServer = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_KEY')!
);

export default async function handler(req: Request) {
  console.log('🔄 Snapshot processor starting...');
  
  try {
    return new Response(JSON.stringify({ 
      message: 'Snapshot processor is ready!',
      timestamp: new Date().toISOString()
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ Error:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Helper functions for Edge Function context

async function checkRateLimit(userId: string): Promise<{
  allowed: boolean;
  requestsToday: number;
  limit: number;
}> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabaseServer
    .from('user_rate_limits')
    .select('*')
    .eq('user_id', userId)
    .eq('day', today)
    .single();
    
  if (error && error.code !== 'PGRST116') {
    console.error('Rate limit check failed:', error);
    return { allowed: false, requestsToday: 0, limit: 5 };
  }
  
  const currentCount = data?.requests_count || 0;
  const limit = 5;
  
  return {
    allowed: currentCount < limit,
    requestsToday: currentCount,
    limit
  };
}

async function incrementRateLimit(userId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const { error } = await supabaseServer.rpc('increment_user_rate_limit', {
      p_user_id: userId,
      p_target_day: today
    });
      
    return !error;
  } catch (error) {
    console.error('Rate limit increment error:', error);
    return false;
  }
}

async function storeQuestions(
  requestId: string, 
  questions: string[]
): Promise<{ success: boolean; questionIds: string[] }> {
  try {
    const questionData = questions.map((question, index) => ({
      request_id: requestId,
      question,
      question_number: index + 1
    }));

    const { data, error } = await supabaseServer
      .from('snapshot_questions')
      .insert(questionData)
      .select('id');

    if (error) {
      console.error('❌ Failed to store questions:', error);
      return { success: false, questionIds: [] };
    }

    return { success: true, questionIds: data.map(q => q.id) };
  } catch (error) {
    console.error('❌ Store questions error:', error);
    return { success: false, questionIds: [] };
  }
}

async function scrapePageContent(requestId: string, url: string): Promise<void> {
  console.log(`🕷️ Scraping content for: ${url}`);
  const startTime = Date.now();
  const domain = new URL(url).hostname;
  
  try {
    const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('FIRECRAWL_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown', 'html'],
        includeTags: ['title', 'meta'],
        excludeTags: ['script', 'style', 'nav', 'footer'],
        waitFor: 2000, // Wait 2s for dynamic content
        timeout: 15000 // 15s timeout
      })
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`Firecrawl API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Scraped ${url} in ${duration}ms`);

    // Extract content and metadata
    const content = data.data?.content || '';
    const markdown = data.data?.markdown || '';
    const html = data.data?.html || '';
    const metadata = data.data?.metadata || {};
    
    // Truncate HTML if too large (keep under 100KB)
    const truncatedHtml = html.length > 100000 ? html.substring(0, 100000) + '...[truncated]' : html;
    
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

    // Store in database
    const { error } = await supabaseServer
      .from('page_content')
      .insert({
        request_id: requestId,
        url,
        domain,
        title: metadata.title || '',
        meta_description: metadata.description || '',
        raw_content: content,
        raw_markdown: markdown,
        raw_html: truncatedHtml,
        word_count: wordCount,
        firecrawl_metadata: {
          statusCode: metadata.statusCode,
          error: metadata.error,
          sourceURL: metadata.sourceURL,
          ogTitle: metadata.ogTitle,
          ogDescription: metadata.ogDescription,
          scrapedAt: new Date().toISOString()
        },
        scrape_duration_ms: duration,
        scrape_success: true
      });

    if (error) {
      console.error(`Failed to store page content for ${url}:`, error);
    } else {
      console.log(`💾 Stored ${wordCount} words of content for ${domain}`);
    }

  } catch (error: any) {
    console.error(`❌ Failed to scrape ${url}:`, error.message);
    
    // Store error record
    const { error: storeError } = await supabaseServer
      .from('page_content')
      .insert({
        request_id: requestId,
        url,
        domain,
        title: '',
        meta_description: '',
        raw_content: '',
        raw_markdown: '',
        raw_html: '',
        word_count: 0,
        firecrawl_metadata: { error: error.message },
        scrape_duration_ms: Date.now() - startTime,
        scrape_success: false,
        scrape_error: error.message
      });

    if (storeError) {
      console.error(`Failed to store error record for ${url}:`, storeError);
    }
  }
}

// Core tested functions - using our production-ready implementations

async function generateQuestions(topic: string): Promise<{
  questions: string[];
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You create realistic user questions for AI assistants based on topics. Focus on recommendation/comparison scenarios that would surface product mentions.' 
          },
          { 
            role: 'user', 
            content: `Topic: "${topic}"\n\nGenerate exactly 5 questions that users might ask ChatGPT/Perplexity about this topic. Make them:\n- Natural, human language\n- Recommendation-focused ("what's the best...", "compare X vs Y")\n- Different angles (pricing, features, use cases)\n\nFormat as numbered list:\n1. [question]\n2. [question]\n3. [question]\n4. [question]\n5. [question]` 
          }
        ],
        max_tokens: 400,
        temperature: 0.7
      })
    });

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    const questions = content.split('\n')
      .filter(line => /^\d+\./.test(line.trim()))
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(q => q.length > 10);

    // Ensure we have at least 3 questions, pad with fallbacks if needed
    const finalQuestions = questions.slice(0, 5);
    while (finalQuestions.length < 5) {
      const fallbacks = [
        `What's the best ${topic}?`,
        `Compare top ${topic} options for businesses`,
        `${topic} recommendations and reviews`,
        `Most popular ${topic} tools in 2024`,
        `${topic} pricing and features comparison`
      ];
      finalQuestions.push(fallbacks[finalQuestions.length % fallbacks.length]);
    }

    return {
      questions: finalQuestions,
      success: true
    };
  } catch (error) {
    return {
      questions: [
        `What's the best ${topic}?`,
        `Compare top ${topic} options for businesses`,
        `${topic} recommendations and reviews`,
        `Most popular ${topic} tools in 2024`,
        `${topic} pricing and features comparison`
      ],
      success: false,
      error: error.message
    };
  }
}

async function testVisibilityWithPerplexity(question: string, targetDomain: string): Promise<{
  targetFound: boolean;
  position: number | null;
  citedDomains: string[];
  competitors: string[];
  competitorNames: string[];
  citationSnippet: string | null;
  reasoning: string;
  topCitations: any[];
  apiCallDuration: number;
  retryCount: number;
}> {
  const startTime = Date.now();
  
  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get('PERPLEXITY_API_KEY')}`,
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
      })
    });

    const data = await response.json();
    const citations = data.search_results || [];
    const aiAnswer = data.choices?.[0]?.message?.content || '';
    
    // Helper function to safely extract and normalize hostname
    function extractHostname(url: string): string | null {
      try {
        if (!url || typeof url !== 'string') return null;
        const fullUrl = url.startsWith('http') ? url : `https://${url}`;
        const hostname = new URL(fullUrl).hostname.toLowerCase();
        return hostname.replace(/^www\./, '');
      } catch (error) {
        return null;
      }
    }

    // Normalize target domain
    const normalizedTarget = targetDomain.toLowerCase().replace(/^www\./, '');
    const targetBrandName = normalizedTarget.split('.')[0];
    
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
    } else {
      // Check if any search result URLs contain the target domain
      for (let i = 0; i < citations.length; i++) {
        const citation = citations[i];
        const hostname = extractHostname(citation.url);
        
        if (hostname && (hostname.includes(normalizedTarget) || normalizedTarget.includes(hostname))) {
          targetFound = true;
          targetPosition = i + 1;
          citationSnippet = `Search result from ${hostname}: ${citation.title}`;
          break;
        }
      }
    }

    // Extract competitor product names from the AI answer
    const competitorNames = aiAnswer.length > 0 
      ? await extractCompetitorsFromSnippets([aiAnswer], targetBrandName)
      : [];
    
    // Extract all domains for legacy compatibility
    const allDomains = citations
      .map((citation: any) => extractHostname(citation.url))
      .filter(Boolean);

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
      title: citation.title?.substring(0, 200),
      rank: citation.rank || 1
    }));

    return {
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
      apiCallDuration: Date.now() - startTime,
      retryCount: 0
    };
  } catch (error) {
    return {
      targetFound: false,
      position: null,
      citedDomains: [],
      competitors: [],
      competitorNames: [],
      citationSnippet: null,
      reasoning: 'Search failed: ' + error.message,
      topCitations: [],
      apiCallDuration: Date.now() - startTime,
      retryCount: 0
    };
  }
}

// Extract competitor product/tool names from search result snippets
async function extractCompetitorsFromSnippets(
  snippets: string[],
  targetBrand: string
): Promise<string[]> {
  // Skip if no snippets
  if (!snippets.length || snippets.every(s => !s)) {
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
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'Extract product/tool names from text snippets. Return only a JSON array of strings.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 150,
        temperature: 0.0
      })
    });

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '[]';
    
    // Strip markdown code blocks if present
    const cleanContent = content.replace(/```json\s*|\s*```/g, '').trim();
    
    const competitors = JSON.parse(cleanContent);
    
    return Array.isArray(competitors) ? competitors.slice(0, 10) : [];
  } catch (error) {
    console.error('❌ Competitor extraction failed:', error.message);
    return [];
  }
} 
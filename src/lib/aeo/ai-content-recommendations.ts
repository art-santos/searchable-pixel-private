import OpenAI from 'openai';
import { PageContent, AEOAnalysisResult } from './technical-analyzer';

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export interface AIContentRecommendations {
  quickWin: string;
  bullets: string[];
  aiGeneratedInsights?: {
    competitorGaps: string[];
    contentOpportunities: string[];
    keywordTargets: string[];
  };
}

/**
 * Generate AI-powered content recommendations using GPT-4
 */
export async function generateAIContentRecommendations(
  pageContent: PageContent,
  analysisResult: AEOAnalysisResult,
  topic?: string
): Promise<AIContentRecommendations> {
  
  // Extract h1 from HTML
  let h1Text = '';
  const html = pageContent.html || '';
  const h1Matches = html.match(/<h1[^>]*>(.*?)<\/h1>/gi) || [];
  if (h1Matches.length > 0) {
    h1Text = h1Matches[0]?.replace(/<[^>]+>/g, '').trim() || '';
  }
  
  // Prepare context for AI analysis
  const context = {
    url: pageContent.url,
    title: pageContent.title || '',
    metaDescription: pageContent.meta_description || '',
    h1: h1Text,
    wordCount: pageContent.word_count || 0,
    content: (pageContent.content || '').substring(0, 2000), // Limit for API
    renderingMode: analysisResult.rendering_mode,
    overallScore: analysisResult.overall_score,
    issues: analysisResult.issues.filter(i => i.category === 'content').slice(0, 5),
    topic: topic || 'general visibility'
  };
  
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert SEO/AEO content strategist and AI search visibility expert. Analyze web content and provide actionable, specific content recommendations that will improve AI engine visibility and search performance.

Return a JSON object with:
{
  "quickWin": "One immediately actionable content improvement with specific implementation details",
  "bullets": ["Array of 5-8 specific content recommendations with metrics and implementation details"],
  "competitorGaps": ["3-5 content gaps competitors are likely missing"],
  "contentOpportunities": ["3-5 untapped content opportunities for this topic"],
  "keywordTargets": ["5-10 specific long-tail keywords to target"]
}

Focus on:
- Specific, measurable improvements (not generic advice)
- AI-era content optimization (featured snippets, answer targeting, entity optimization)
- Competitive differentiation opportunities
- User intent alignment
- EEAT signal improvements`
        },
        {
          role: 'user',
          content: `Analyze this page for content improvements:

URL: ${context.url}
Title: ${context.title}
Meta Description: ${context.metaDescription}
H1: ${context.h1}
Word Count: ${context.wordCount}
Topic Focus: ${context.topic}
Current Score: ${context.overallScore}/100
Rendering: ${context.renderingMode}

Content Preview:
${context.content}

Current Issues:
${context.issues.map(i => `- ${i.title}: ${i.description}`).join('\n')}

Generate specific, actionable content recommendations that will improve AI visibility and search performance.`
        }
      ],
      max_tokens: 1500,
      temperature: 0.7
    });
    
    const content = response.choices[0]?.message?.content || '';
    console.log('🤖 AI Content Recommendations response received');
    
    // Parse AI response
    let aiResults;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      aiResults = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (parseError) {
      console.warn('Failed to parse AI content recommendations, using fallback');
      return getFallbackRecommendations(pageContent, analysisResult);
    }
    
    if (aiResults && aiResults.quickWin && aiResults.bullets) {
      return {
        quickWin: aiResults.quickWin,
        bullets: aiResults.bullets.slice(0, 8), // Ensure max 8 bullets
        aiGeneratedInsights: {
          competitorGaps: aiResults.competitorGaps || [],
          contentOpportunities: aiResults.contentOpportunities || [],
          keywordTargets: aiResults.keywordTargets || []
        }
      };
    }
    
  } catch (error: any) {
    console.error('AI content recommendations failed:', error.message);
  }
  
  // Return fallback recommendations if AI fails
  return getFallbackRecommendations(pageContent, analysisResult);
}

/**
 * Fallback content recommendations when AI is unavailable
 */
function getFallbackRecommendations(
  pageContent: PageContent,
  analysisResult: AEOAnalysisResult
): AIContentRecommendations {
  const bullets: string[] = [];
  const wordCount = pageContent.word_count || 0;
  
  // Extract h1 from HTML for fallback
  let h1Text = '';
  const html = pageContent.html || '';
  const h1Matches = html.match(/<h1[^>]*>(.*?)<\/h1>/gi) || [];
  if (h1Matches.length > 0) {
    h1Text = h1Matches[0]?.replace(/<[^>]+>/g, '').trim() || '';
  }
  
  // Quick win selection
  let quickWin = '';
  
  if (wordCount < 300) {
    quickWin = `*Quick Win:* Content depth only ${wordCount} words → expand to 800+ with comprehensive topic coverage → add FAQ section, use cases, and step-by-step guides.`;
  } else if (!h1Text) {
    quickWin = `*Quick Win:* Missing H1 headline → add keyword-rich H1 targeting user search intent → place above fold for maximum impact.`;
  } else {
    quickWin = `*Quick Win:* Add FAQ schema markup → structure existing Q&A content → unlock featured snippet opportunities in AI overviews.`;
  }
  
  // Generate specific bullets based on analysis
  if (wordCount < 800) {
    bullets.push(
      `Content depth at ${wordCount} words falls short of 800-word competitive baseline → expand with detailed sections on implementation, benefits, and common questions.`
    );
  }
  
  if (!pageContent.content?.includes('?')) {
    bullets.push(
      `No question-based content detected → add "How to", "What is", "Why" sections → directly answer user queries for AI snippet eligibility.`
    );
  }
  
  bullets.push(
    `Implement entity optimization → mention brand names, product names, and industry terms with proper capitalization → improve knowledge graph connections.`,
    `Add numbered lists and bullet points → structure content for AI extraction → use "Steps:", "Benefits:", "Features:" as list introducers.`,
    `Create comparison content → "X vs Y" or "Best X for Y" formats → capture high-intent comparison queries.`,
    `Include current year references → add "in 2024" or "2024 Guide" → signal content freshness to AI systems.`,
    `Add expert quotes and citations → link to authoritative sources → strengthen EEAT signals for AI trust.`,
    `Optimize for voice search → use conversational long-tail phrases → "how do I..." and "what's the best way to..." formats.`
  );
  
  return {
    quickWin,
    bullets: bullets.slice(0, 8),
    aiGeneratedInsights: {
      competitorGaps: [],
      contentOpportunities: [],
      keywordTargets: []
    }
  };
} 
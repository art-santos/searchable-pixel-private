import OpenAI from 'openai';

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Configurable scoring weights (business priorities)
const SCORING_WEIGHTS = {
  content_quality: 0.25,    // Content is king for AEO
  technical_health: 0.20,   // Technical SEO foundation
  ai_optimization: 0.20,    // AI-specific optimizations
  media_accessibility: 0.15, // Accessibility for broader reach
  schema_markup: 0.20       // Structured data for AI understanding
};

/**
 * Enhanced detection of rendering mode with detailed analysis
 */
function detectRenderingMode(html: string, markdown: string): {
  mode: 'SSR' | 'CSR' | 'HYBRID';
  confidence: number; // 0-100
  indicators: string[];
  ssrContent: boolean;
  csrWarnings: string[];
} {
  if (!html) {
    return {
      mode: 'HYBRID',
      confidence: 0,
      indicators: ['No HTML content available'],
      ssrContent: false,
      csrWarnings: ['Cannot analyze rendering without HTML']
    };
  }
  
  const indicators: string[] = [];
  const csrWarnings: string[] = [];
  
  // Check for meaningful server-rendered content BEFORE script tags
  const htmlBeforeScripts = html.split(/<script[\s\S]*?<\/script>/i)[0] || '';
  const hasSSRContent = /<(h1|h2|h3|article|main|section)[\s>]/i.test(htmlBeforeScripts) ||
                       /<p[^>]*>[^<]{20,}/i.test(htmlBeforeScripts); // Paragraph with meaningful content
  
  if (hasSSRContent) {
    indicators.push('Server-rendered semantic content detected');
  } else {
    csrWarnings.push('No meaningful content found before JavaScript execution');
  }
  
  // Remove scripts and styles, get text content
  const textOnly = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const meaningfulWords = textOnly.split(/\s+/).filter(word => 
    word.length > 3 && 
    !/^(the|and|for|are|but|not|you|all|can|had|her|was|one|our|out|day|get|has|him|his|how|man|new|now|old|see|two|way|who|boy|did|its|let|put|say|she|too|use)$/i.test(word)
  );
  
  // Check for typical CSR indicators
  const emptyReactRoot = /<div[^>]*id=["']?root["']?[^>]*>(\s*<\/div>|\s*$)/i.test(html);
  const emptyVueApp = /<div[^>]*id=["']?app["']?[^>]*>(\s*<\/div>|\s*$)/i.test(html);
  const loadingStates = /Loading\.\.\.|Please enable JavaScript|Loading\s*$/i.test(html);
  const hasNoScript = /<noscript>/i.test(html);
  
  if (emptyReactRoot) {
    indicators.push('Empty React root div detected');
    csrWarnings.push('React app with no server-rendered content');
  }
  
  if (emptyVueApp) {
    indicators.push('Empty Vue app div detected');
    csrWarnings.push('Vue app with no server-rendered content');
  }
  
  if (loadingStates) {
    indicators.push('Client-side loading states found');
    csrWarnings.push('Page shows loading indicators suggesting client-side rendering');
  }
  
  if (hasNoScript && meaningfulWords.length < 20) {
    indicators.push('NoScript warning with minimal content');
    csrWarnings.push('Page requires JavaScript with minimal fallback content');
  }
  
  // Check content richness and structure
  const hasRichContent = meaningfulWords.length > 50;
  const hasStructuredContent = html.includes('<h1') || html.includes('<h2') || html.includes('<nav') || html.includes('<main');
  const hasSemantic = /<(article|section|aside|header|footer|nav|main)[\s>]/i.test(html);
  
  if (hasRichContent) {
    indicators.push(`Rich content: ${meaningfulWords.length} meaningful words`);
  } else {
    csrWarnings.push(`Thin content: only ${meaningfulWords.length} meaningful words`);
  }
  
  if (hasStructuredContent) {
    indicators.push('Proper heading structure detected');
  } else {
    csrWarnings.push('Missing heading structure (H1-H6)');
  }
  
  if (hasSemantic) {
    indicators.push('Semantic HTML5 elements found');
  } else {
    csrWarnings.push('No semantic HTML5 elements detected');
  }
  
  // Determine mode and confidence
  let mode: 'SSR' | 'CSR' | 'HYBRID';
  let confidence: number;
  
  const csrScore = (emptyReactRoot ? 25 : 0) + 
                   (emptyVueApp ? 25 : 0) + 
                   (loadingStates ? 20 : 0) + 
                   (!hasRichContent ? 30 : 0);
  
  const ssrScore = (hasSSRContent ? 40 : 0) + 
                   (hasRichContent ? 30 : 0) + 
                   (hasStructuredContent ? 20 : 0) + 
                   (hasSemantic ? 10 : 0);
  
  if (csrScore > 50 && ssrScore < 30) {
    mode = 'CSR';
    confidence = Math.min(95, csrScore + 20);
  } else if (ssrScore > 70 && csrScore < 30) {
    mode = 'SSR';
    confidence = Math.min(95, ssrScore + 10);
  } else {
    mode = 'HYBRID';
    confidence = Math.abs(ssrScore - csrScore) < 20 ? 60 : 80;
  }
  
  return {
    mode,
    confidence,
    indicators,
    ssrContent: hasSSRContent,
    csrWarnings
  };
}

/**
 * Generates AI-powered diagnostic for a technical issue
 */
async function generateDiagnostic(issue: TechnicalIssue): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return `${issue.title}: ${issue.description}`;
  }
  
  try {
    const openai = getOpenAIClient();
    
    const systemPrompt = `You are an expert SEO/AEO technical specialist. For each error, provide a one-sentence explanation of why it matters and a one-sentence actionable fix. Keep it under 60 words total.`;
    
    const userPrompt = `Error: ${issue.title}
Description: ${issue.description}
Impact: ${issue.impact}
Category: ${issue.category}
${issue.rule_parameters ? `Parameters: ${JSON.stringify(issue.rule_parameters)}` : ''}
${issue.html_snippet ? `HTML Snippet: ${issue.html_snippet.substring(0, 200)}` : ''}

Provide a concise 1-2 sentence diagnostic and fix.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: 60
    });

    const diagnostic = response.choices[0]?.message?.content?.trim() || '';
    return diagnostic || `${issue.title}: ${issue.description}`;
    
  } catch (error: any) {
    console.warn(`Failed to generate diagnostic for "${issue.title}":`, error.message);
    return `${issue.title}: ${issue.description}`;
  }
}

export interface PageContent {
  url: string;
  title?: string;
  meta_description?: string;
  content: string;
  markdown: string;
  html?: string;
  word_count?: number;
  metadata?: {
    statusCode?: number;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
    language?: string;
    author?: string;
    publishDate?: string;
    modifiedDate?: string;
    schema?: any;
  };
}

export interface TechnicalIssue {
  severity: 'critical' | 'warning' | 'info';
  category: 'seo' | 'performance' | 'accessibility' | 'content' | 'schema' | 'metadata';
  title: string;
  description: string;
  impact: string;
  fix_priority: number; // 1-10, 10 being highest
  html_snippet?: string; // Raw HTML where issue was detected
  rule_parameters?: Record<string, any>; // Parameters used in rule check
  diagnostic?: string; // AI-generated explanation and fix
}

export interface TechnicalRecommendation {
  category: 'content' | 'technical' | 'seo' | 'accessibility' | 'performance';
  title: string;
  description: string;
  implementation: string;
  expected_impact: string;
  effort_level: 'low' | 'medium' | 'high';
  priority_score: number; // 1-10
}

export interface AEOAnalysisResult {
  url: string;
  overall_score: number; // Simple average: 0-100
  weighted_score: number; // Business-weighted score: 0-100
  category_scores: {
    content_quality: number;
    technical_health: number;
    media_accessibility: number;
    schema_markup: number;
    ai_optimization: number;
  };
  rendering_mode: 'SSR' | 'CSR' | 'HYBRID';
  ssr_score_penalty: number;
  issues: TechnicalIssue[];
  recommendations: TechnicalRecommendation[];
  analysis_metadata: {
    analyzed_at: string;
    analysis_duration_ms: number;
    content_length: number;
    ai_analysis_used: boolean;
    total_rules_evaluated: number;
    diagnostics_generated: number;
    scoring_weights: {
      content_quality: number;
      technical_health: number;
      media_accessibility: number;
      schema_markup: number;
      ai_optimization: number;
    };
  };
}

/**
 * Performs comprehensive technical analysis of a page
 */
export async function analyzePageWithAEO(pageContent: PageContent): Promise<AEOAnalysisResult> {
  console.log(`🔍 Starting AEO analysis for: ${pageContent.url}`);
  const startTime = Date.now();
  
  const issues: TechnicalIssue[] = [];
  const recommendations: TechnicalRecommendation[] = [];
  
  // Core technical analysis
  const contentAnalysis = analyzeContentQuality(pageContent);
  const technicalAnalysis = analyzeTechnicalHealth(pageContent);
  const mediaAnalysis = analyzeMediaAccessibility(pageContent);
  const schemaAnalysis = analyzeSchemaMarkup(pageContent);
  
  // Combine all issues and recommendations
  issues.push(...contentAnalysis.issues, ...technicalAnalysis.issues, ...mediaAnalysis.issues, ...schemaAnalysis.issues);
  recommendations.push(...contentAnalysis.recommendations, ...technicalAnalysis.recommendations, ...mediaAnalysis.recommendations, ...schemaAnalysis.recommendations);
  
  // AI-powered analysis for advanced insights
  let aiAnalysis = null;
  let aiOptimizationScore = 50; // Default fallback score
  
  if (process.env.OPENAI_API_KEY) {
    try {
      aiAnalysis = await performAIAnalysis(pageContent);
      aiOptimizationScore = aiAnalysis.optimization_score;
      issues.push(...aiAnalysis.issues);
      recommendations.push(...aiAnalysis.recommendations);
    } catch (aiError: any) {
      console.warn('AI analysis failed, using fallback:', aiError.message);
    }
  }
  
  // Detect rendering mode with enhanced analysis
  const renderingAnalysis = detectRenderingMode(pageContent.html || '', pageContent.markdown);
  const renderingMode = renderingAnalysis.mode;
  
  // Calculate SSR penalty
  const ssrPenalty = renderingMode === 'CSR' ? 15 : (renderingMode === 'HYBRID' ? 5 : 0);
  
  // Add CSR-specific issues based on analysis
  if (renderingAnalysis.csrWarnings.length > 0 && !renderingAnalysis.ssrContent) {
    issues.push({
      severity: 'warning',
      category: 'performance',
      title: 'Client-side rendering detected',
      description: `Page appears to be client-side rendered only—no server-rendered HTML detected. ${renderingAnalysis.csrWarnings.join('; ')}`,
      impact: 'Poor SEO performance, slower initial page loads, and reduced AI crawler accessibility',
      fix_priority: 7,
      html_snippet: (pageContent.html || '').substring(0, 300),
      rule_parameters: {
        rendering_mode: renderingMode,
        confidence: renderingAnalysis.confidence,
        csr_warnings: renderingAnalysis.csrWarnings,
        ssr_content_detected: renderingAnalysis.ssrContent
      }
    });
  }
  
  // Calculate category scores
  const categoryScores = {
    content_quality: contentAnalysis.score,
    technical_health: technicalAnalysis.score,
    media_accessibility: mediaAnalysis.score,
    schema_markup: schemaAnalysis.score,
    ai_optimization: aiOptimizationScore
  };
  
  // Calculate overall score (simple average)
  const simpleAverage = Math.round(
    (categoryScores.content_quality + 
     categoryScores.technical_health + 
     categoryScores.media_accessibility + 
     categoryScores.schema_markup + 
     categoryScores.ai_optimization) / 5
  );
  
  // Calculate weighted score with business priorities
  const weightedScore = Math.round(
    (categoryScores.content_quality * SCORING_WEIGHTS.content_quality) +
    (categoryScores.technical_health * SCORING_WEIGHTS.technical_health) +
    (categoryScores.ai_optimization * SCORING_WEIGHTS.ai_optimization) +
    (categoryScores.media_accessibility * SCORING_WEIGHTS.media_accessibility) +
    (categoryScores.schema_markup * SCORING_WEIGHTS.schema_markup)
  );
  
  // Apply SSR penalty to both scores
  const finalSimpleScore = Math.max(0, simpleAverage - ssrPenalty);
  const finalWeightedScore = Math.max(0, weightedScore - ssrPenalty);
  
  console.log(`✅ AEO analysis complete for ${pageContent.url}: ${finalWeightedScore}/100 (weighted), ${finalSimpleScore}/100 (average)`);
  console.log(`   Rendering mode: ${renderingMode} (confidence: ${renderingAnalysis.confidence}%, penalty: -${ssrPenalty})`);
  console.log(`   Rendering indicators: ${renderingAnalysis.indicators.slice(0, 2).join(', ')}`);
  if (renderingAnalysis.csrWarnings.length > 0) {
    console.log(`   CSR warnings: ${renderingAnalysis.csrWarnings.length} detected`);
  }
  console.log(`   Issues found: ${issues.length} (${issues.filter(i => i.severity === 'critical').length} critical)`);
  console.log(`   Recommendations: ${recommendations.length}`);
  
  // Generate AI diagnostics for issues
  let diagnosticsGenerated = 0;
  if (process.env.OPENAI_API_KEY && issues.length > 0) {
    console.log(`🤖 Generating AI diagnostics for ${issues.length} issues...`);
    
    for (const issue of issues) {
      try {
        issue.diagnostic = await generateDiagnostic(issue);
        diagnosticsGenerated++;
      } catch (error: any) {
        console.warn(`Failed to generate diagnostic for "${issue.title}":`, error.message);
      }
    }
    
    console.log(`✅ Generated ${diagnosticsGenerated} AI diagnostics`);
  }
  
  return {
    url: pageContent.url,
    overall_score: finalSimpleScore,
    weighted_score: finalWeightedScore,
    category_scores: categoryScores,
    rendering_mode: renderingMode,
    ssr_score_penalty: ssrPenalty,
    issues: issues.sort((a, b) => b.fix_priority - a.fix_priority), // Sort by priority
    recommendations: recommendations.sort((a, b) => b.priority_score - a.priority_score),
    analysis_metadata: {
      analyzed_at: new Date().toISOString(),
      analysis_duration_ms: Date.now() - startTime,
      content_length: pageContent.content?.length || 0,
      ai_analysis_used: !!aiAnalysis,
      total_rules_evaluated: issues.length + recommendations.length,
      diagnostics_generated: diagnosticsGenerated,
      scoring_weights: SCORING_WEIGHTS
    }
  };
}

/**
 * Analyzes content quality and readability
 */
function analyzeContentQuality(page: PageContent): {
  score: number;
  issues: TechnicalIssue[];
  recommendations: TechnicalRecommendation[];
} {
  const issues: TechnicalIssue[] = [];
  const recommendations: TechnicalRecommendation[] = [];
  let score = 100;
  
  const content = page.content || '';
  const title = page.title || '';
  const metaDescription = page.meta_description || '';
  const wordCount = page.word_count || content.split(/\s+/).filter(w => w.length > 0).length;
  
  // Title analysis
  if (!title) {
    issues.push({
      severity: 'critical',
      category: 'seo',
      title: 'Missing page title',
      description: 'Page has no title tag, which is critical for SEO and user experience',
      impact: 'Major negative impact on search rankings and click-through rates',
      fix_priority: 10,
      html_snippet: '<head><!-- Missing <title> tag --></head>',
      rule_parameters: { expected_length: '30-60', actual_length: 0 }
    });
    score -= 25;
  } else {
    if (title.length < 30) {
      issues.push({
        severity: 'warning',
        category: 'seo',
        title: 'Title too short',
        description: `Title is only ${title.length} characters. Recommended: 30-60 characters`,
        impact: 'Missed opportunity for keyword optimization and user engagement',
        fix_priority: 7,
        html_snippet: `<title>${title}</title>`,
        rule_parameters: { min_length: 30, actual_length: title.length, title_text: title }
      });
      score -= 10;
    } else if (title.length > 60) {
      issues.push({
        severity: 'warning',
        category: 'seo',
        title: 'Title too long',
        description: `Title is ${title.length} characters. May be truncated in search results`,
        impact: 'Title may be cut off in search results, reducing effectiveness',
        fix_priority: 6,
        html_snippet: `<title>${title}</title>`,
        rule_parameters: { max_length: 60, actual_length: title.length, truncated_at: 60 }
      });
      score -= 5;
    }
  }
  
  // Meta description analysis
  if (!metaDescription) {
    issues.push({
      severity: 'warning',
      category: 'seo',
      title: 'Missing meta description',
      description: 'Page has no meta description for search result snippets',
      impact: 'Search engines will generate their own snippet, potentially less compelling',
      fix_priority: 8
    });
    score -= 15;
  } else {
    if (metaDescription.length < 120) {
      recommendations.push({
        category: 'seo',
        title: 'Expand meta description',
        description: `Meta description is only ${metaDescription.length} characters`,
        implementation: 'Expand to 150-160 characters to maximize search result real estate',
        expected_impact: 'Improved click-through rates from search results',
        effort_level: 'low',
        priority_score: 6
      });
    } else if (metaDescription.length > 160) {
      issues.push({
        severity: 'info',
        category: 'seo',
        title: 'Meta description too long',
        description: `Meta description is ${metaDescription.length} characters and may be truncated`,
        impact: 'Description may be cut off in search results',
        fix_priority: 4
      });
      score -= 3;
    }
  }
  
  // Content length analysis
  if (wordCount < 100) {
    issues.push({
      severity: 'critical',
      category: 'content',
      title: 'Very thin content',
      description: `Page has only ${wordCount} words, which is insufficient for most purposes`,
      impact: 'Severe negative impact on search rankings and user value',
      fix_priority: 9,
      html_snippet: content.substring(0, 200) + '...',
      rule_parameters: { min_words: 300, actual_words: wordCount, content_preview: content.substring(0, 100) }
    });
    score -= 30;
  } else if (wordCount < 300) {
    issues.push({
      severity: 'warning',
      category: 'content',
      title: 'Thin content',
      description: `Page has only ${wordCount} words. Recommended: 300+ words for substantial content`,
      impact: 'May be considered thin content by search engines and AI systems',
      fix_priority: 7,
      html_snippet: content.substring(0, 200) + '...',
      rule_parameters: { recommended_words: 300, actual_words: wordCount, deficit: 300 - wordCount }
    });
    score -= 20;
  }
  
  // Content structure analysis
  const headingMatches = content.match(/^#{1,6}\s+/gm) || [];
  if (headingMatches.length === 0) {
    issues.push({
      severity: 'warning',
      category: 'content',
      title: 'No heading structure',
      description: 'Page appears to lack clear heading structure (H1-H6)',
      impact: 'Poor content organization affects readability and SEO',
      fix_priority: 6
    });
    score -= 10;
  }
  
  // AI-friendly content check
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
  
  if (avgSentenceLength > 25) {
    recommendations.push({
      category: 'content',
      title: 'Simplify sentence structure',
      description: `Average sentence length is ${avgSentenceLength.toFixed(1)} words`,
      implementation: 'Break down complex sentences into shorter, clearer statements',
      expected_impact: 'Improved readability for both humans and AI systems',
      effort_level: 'medium',
      priority_score: 5
    });
  }
  
  return { score: Math.max(0, score), issues, recommendations };
}

/**
 * Analyzes technical health and SEO fundamentals
 */
function analyzeTechnicalHealth(page: PageContent): {
  score: number;
  issues: TechnicalIssue[];
  recommendations: TechnicalRecommendation[];
} {
  const issues: TechnicalIssue[] = [];
  const recommendations: TechnicalRecommendation[] = [];
  let score = 100;
  
  const html = page.html || '';
  const metadata = page.metadata || {};
  
  // Status code check
  if (metadata.statusCode && metadata.statusCode !== 200) {
    issues.push({
      severity: 'critical',
      category: 'performance',
      title: `HTTP ${metadata.statusCode} status`,
      description: `Page returns ${metadata.statusCode} status code instead of 200`,
      impact: 'Page may not be indexed properly by search engines',
      fix_priority: 10
    });
    score -= 40;
  }
  
  // Canonical URL analysis
  if (!metadata.canonicalUrl) {
    issues.push({
      severity: 'warning',
      category: 'seo',
      title: 'Missing canonical URL',
      description: 'Page lacks canonical URL specification',
      impact: 'May lead to duplicate content issues',
      fix_priority: 6
    });
    score -= 10;
  }
  
  // HTTPS check
  if (page.url.startsWith('http://')) {
    issues.push({
      severity: 'critical',
      category: 'performance',
      title: 'Non-secure HTTP connection',
      description: 'Page is served over HTTP instead of HTTPS',
      impact: 'Security risk and negative SEO impact',
      fix_priority: 9
    });
    score -= 25;
  }
  
  return { score: Math.max(0, score), issues, recommendations };
}

/**
 * Analyzes media accessibility
 */
function analyzeMediaAccessibility(page: PageContent): {
  score: number;
  issues: TechnicalIssue[];
  recommendations: TechnicalRecommendation[];
} {
  const issues: TechnicalIssue[] = [];
  const recommendations: TechnicalRecommendation[] = [];
  let score = 100;
  
  const content = page.content || '';
  const html = page.html || '';
  
  // Image analysis
  const imageMatches = html.match(/<img[^>]*>/gi) || [];
  const markdownImages = content.match(/!\[[^\]]*\]\([^)]+\)/g) || [];
  const totalImages = imageMatches.length + markdownImages.length;
  
  if (totalImages > 0) {
    // Check for alt text
    const imagesWithoutAlt = imageMatches.filter(img => !img.includes('alt=') || img.includes('alt=""'));
    const altTextCoverage = Math.max(0, (totalImages - imagesWithoutAlt.length) / totalImages);
    
    if (altTextCoverage < 0.8) {
      issues.push({
        severity: 'warning',
        category: 'accessibility',
        title: 'Missing image alt text',
        description: `${Math.round((1 - altTextCoverage) * 100)}% of images lack descriptive alt text`,
        impact: 'Poor accessibility and reduced AI understanding of visual content',
        fix_priority: 7
      });
      score -= 20;
    }
  }
  
  return { score: Math.max(0, score), issues, recommendations };
}

/**
 * Analyzes schema markup and structured data
 */
function analyzeSchemaMarkup(page: PageContent): {
  score: number;
  issues: TechnicalIssue[];
  recommendations: TechnicalRecommendation[];
} {
  const issues: TechnicalIssue[] = [];
  const recommendations: TechnicalRecommendation[] = [];
  let score = 80; // Start with good score since schema is optional but valuable
  
  const html = page.html || '';
  const metadata = page.metadata || {};
  
  // Check for JSON-LD schema
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>/gi) || [];
  const hasSchema = jsonLdMatches.length > 0 || metadata.schema;
  
  if (!hasSchema) {
    recommendations.push({
      category: 'seo',
      title: 'Add structured data',
      description: 'Page lacks structured data markup',
      implementation: 'Add JSON-LD schema markup relevant to content type (Article, Organization, Product, etc.)',
      expected_impact: 'Enhanced search results and better AI understanding',
      effort_level: 'medium',
      priority_score: 7
    });
    score -= 20;
  }
  
  return { score: Math.max(0, score), issues, recommendations };
}

/**
 * AI-powered analysis for advanced insights
 */
async function performAIAnalysis(page: PageContent): Promise<{
  optimization_score: number;
  issues: TechnicalIssue[];
  recommendations: TechnicalRecommendation[];
}> {
  const issues: TechnicalIssue[] = [];
  const recommendations: TechnicalRecommendation[] = [];
  
  // Prepare content for AI analysis (limit size)
  const analysisContent = {
    url: page.url,
    title: page.title || '',
    meta_description: page.meta_description || '',
    content: (page.content || '').substring(0, 3000), // Limit for API efficiency
    word_count: page.word_count || 0
  };
  
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an AI Engine Optimization expert. Analyze web page content for AI visibility and optimization. Return a JSON object with:
- optimization_score (0-100)
- key_strengths (array of strings)
- improvement_areas (array of strings)
- ai_citation_potential (0-100)`
        },
        {
          role: 'user',
          content: `Analyze this page content:\n\nURL: ${analysisContent.url}\nTitle: ${analysisContent.title}\nMeta Description: ${analysisContent.meta_description}\nWord Count: ${analysisContent.word_count}\n\nContent:\n${analysisContent.content}`
        }
      ],
      max_tokens: 800,
      temperature: 0.3
    });
    
    const content = response.choices[0]?.message?.content || '';
    console.log('🤖 AI Analysis response:', content);
    
    // Parse AI response
    let aiResults;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      aiResults = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (parseError) {
      console.warn('Failed to parse AI analysis JSON, using fallback');
      aiResults = null;
    }
    
    if (aiResults) {
      const optimizationScore = aiResults.optimization_score || 50;
      
      // Convert AI insights to recommendations
      if (aiResults.improvement_areas) {
        aiResults.improvement_areas.forEach((area: string, index: number) => {
          recommendations.push({
            category: 'content',
            title: 'AI optimization improvement',
            description: area,
            implementation: 'Address the identified improvement area based on AI analysis',
            expected_impact: 'Enhanced AI visibility and citation potential',
            effort_level: 'medium',
            priority_score: 7 - index
          });
        });
      }
      
      return {
        optimization_score: optimizationScore,
        issues,
        recommendations
      };
    }
    
  } catch (error: any) {
    console.error('AI analysis failed:', error.message);
  }
  
  // Fallback analysis
  return {
    optimization_score: 50,
    issues,
    recommendations: [{
      category: 'content',
      title: 'AI optimization opportunity',
      description: 'Content could be optimized for AI understanding',
      implementation: 'Use clear headings, bullet points, factual statements, and answer common questions directly',
      expected_impact: 'Improved AI visibility and citation potential',
      effort_level: 'medium',
      priority_score: 6
    }]
  };
} 
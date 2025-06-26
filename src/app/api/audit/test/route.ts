import { NextRequest, NextResponse } from 'next/server';
import { enhancedFirecrawl } from '@/lib/services/enhanced-firecrawl-client';
import { contentAuditClient, ContentAuditClient } from '@/lib/services/content-audit-client';

export async function POST(request: NextRequest) {
  try {
    const { url, options = {} } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    console.log(`🧪 TEST: Starting comprehensive audit for: ${url}`);

    // Pre-flight check
    console.log(`🔍 Pre-flight check for: ${url}`);
    const preflightResult = await enhancedFirecrawl.preflightCheck(url);
    
    if (!preflightResult.ok) {
      return NextResponse.json(
        { 
          error: 'Pre-flight check failed',
          details: preflightResult.error,
          statusCode: preflightResult.statusCode
        },
        { status: 400 }
      );
    }

    // Step 1: Enhanced Firecrawl scraping
    console.log(`📡 Step 1: Scraping with enhanced Firecrawl...`);
    const pageData = await enhancedFirecrawl.scrapeWithMetrics(url, {
      waitFor: options.waitFor || 3000,
      timeout: options.timeout || 30000,
      onlyMainContent: false // Changed to false to get full HTML
    });

    if (!pageData.success) {
      throw new Error(`Firecrawl failed: ${pageData.error}`);
    }

    // DEBUG: Log what we actually got
    console.log(`🔍 DEBUG: HTML length: ${pageData.html.length}`);
    console.log(`🔍 DEBUG: Content length: ${pageData.content.length}`);
    console.log(`🔍 DEBUG: Headings found: ${pageData.metadata.headings.length}`);
    console.log(`🔍 DEBUG: Links found: ${pageData.metadata.links.length}`);
    console.log(`🔍 DEBUG: Images found: ${pageData.metadata.images.length}`);
    console.log(`🔍 DEBUG: DOM nodes: ${pageData.metadata.domNodes}`);
    
    // Log first few headings for debugging
    if (pageData.metadata.headings.length > 0) {
      console.log(`🔍 DEBUG: First heading:`, pageData.metadata.headings[0]);
    }

    // Step 2: Basic technical analysis
    console.log(`🔍 Step 2: Running basic technical analysis...`);
    const basicAnalysis = await runBasicAnalysis(pageData);

    // Step 3: Calculate lightweight performance score
    console.log(`⚡ Step 3: Calculating performance score...`);
    const performanceScore = calculateLightweightPerformanceScore({
      htmlKb: pageData.metadata.htmlSize / 1024,
      domNodes: pageData.metadata.domNodes,
      avgImageKb: calculateAverageImageSize(pageData.metadata.images)
    });

    // Step 4: Content audit with LLM
    let contentAudit = null;
    let contentMetrics = null;
    
    try {
      if (options.includeContentAudit !== false) { // Default to true unless explicitly disabled
        console.log(`🧠 Step 4: Running content audit with AI SDK...`);
        contentAudit = await contentAuditClient.auditContent({
          url,
          title: pageData.metadata.title,
          markdown: pageData.markdown || pageData.content
        });
        
        contentMetrics = ContentAuditClient.calculateContentMetrics(contentAudit);
        console.log(`📊 Content audit completed - Overall: ${contentAudit.overall_score}/100, Red flags: ${contentMetrics.redFlagCount}/${contentMetrics.totalParagraphs}`);
      } else {
        console.log(`⏭️ Step 4: Content audit skipped (disabled in options)`);
      }
    } catch (error) {
      console.warn(`⚠️ Content audit failed, continuing with technical audit only:`, error);
    }

    // Step 5: Calculate preliminary page score (incorporating content score if available)
    const technicalScore = calculatePreliminaryScore(basicAnalysis, performanceScore);
    const finalPageScore = contentAudit 
      ? Math.round((technicalScore * 0.4) + (contentAudit.overall_score * 0.6)) // 60% content, 40% technical (Link Audit internal weighting)
      : technicalScore;

    const duration = Date.now() - startTime;

    console.log(`✅ TEST: Comprehensive audit completed for ${url} (Score: ${finalPageScore}/100) in ${duration}ms`);

    // Return comprehensive results
    return NextResponse.json({
      status: 'completed',
      url,
      pageScore: finalPageScore,
      performanceScore,
      htmlSizeKb: Math.round((pageData.metadata.htmlSize / 1024) * 100) / 100,
      domSizeKb: Math.round((pageData.metadata.domNodes / 1000) * 100) / 100,
      crawlable: true,
      ssrRendered: detectSSR(pageData.html),
      pageTitle: pageData.metadata.title,
      metaDescription: pageData.metadata.description,
      
      // Technical SEO Analysis
      seoAnalysis: {
        metaDescriptionPresent: !!pageData.metadata.description,
        h1Present: basicAnalysis.h1Present,
        h1Count: basicAnalysis.h1Count,
        headingDepth: basicAnalysis.headingDepth,
        wordCount: basicAnalysis.wordCount
      },

      // Link Analysis
      linkAnalysis: {
        internalLinkCount: basicAnalysis.internalLinks,
        externalEeatLinks: basicAnalysis.eeatLinks,
        totalLinks: pageData.metadata.links.length
      },

      // Image Analysis
      imageAnalysis: {
        totalImages: pageData.metadata.images.length,
        imageAltPresentPercent: basicAnalysis.altTextPercentage
      },

      // Schema Analysis
      schemaAnalysis: {
        jsonldValid: pageData.metadata.hasJsonLd
      },

      // Performance metrics
      technicalMetrics: {
        htmlSize: pageData.metadata.htmlSize,
        domNodes: pageData.metadata.domNodes,
        estimatedImageSizeKb: calculateAverageImageSize(pageData.metadata.images) * pageData.metadata.images.length
      },

      // Content Quality Analysis (if available)
      contentAnalysis: contentAudit ? {
        overallScore: contentAudit.overall_score,
        totalParagraphs: contentMetrics?.totalParagraphs || 0,
        avgClarity: contentMetrics?.avgClarity || 0,
        avgFactual: contentMetrics?.avgFactual || 0,
        avgAuthority: contentMetrics?.avgAuthority || 0,
        redFlagCount: contentMetrics?.redFlagCount || 0,
        redFlagPercentage: contentMetrics?.redFlagPercentage || 0,
        keyTakeaways: contentAudit.key_takeaways,
        topIssues: contentMetrics?.topIssues || []
      } : null,

      // Combined recommendations
      recommendations: {
        technicalQuickWin: generateQuickWin(basicAnalysis, performanceScore, pageData.metadata),
        contentImprovements: contentAudit?.key_takeaways?.slice(0, 3) || [],
        priorityActions: generatePriorityActions(basicAnalysis, performanceScore, contentMetrics)
      },

      // DEBUG: Add raw data for analysis
      debugData: {
        htmlLength: pageData.html.length,
        contentLength: pageData.content.length,
        headingsCount: pageData.metadata.headings.length,
        linksCount: pageData.metadata.links.length,
        imagesCount: pageData.metadata.images.length,
        firstHeading: pageData.metadata.headings[0] || null,
        sampleLinks: pageData.metadata.links.slice(0, 3),
        sampleImages: pageData.metadata.images.slice(0, 3),
        contentAuditEnabled: !!contentAudit,
        technicalScore,
        contentScore: contentAudit?.overall_score || null
      },

      duration,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ TEST: Comprehensive audit failed:', error);
    return NextResponse.json(
      { 
        error: 'Audit processing failed',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * Basic analysis functions (same as main endpoint)
 */
async function runBasicAnalysis(pageData: any) {
  const headings = pageData.metadata.headings;
  const links = pageData.metadata.links;
  const images = pageData.metadata.images;
  const content = pageData.content;

  // H1 analysis
  const h1Headings = headings.filter((h: any) => h.level === 1);
  const h1Present = h1Headings.length > 0;
  const h1Count = h1Headings.length;

  // Heading depth
  const headingDepth = headings.length > 0 ? Math.max(...headings.map((h: any) => h.level)) : 0;

  // Word count
  const wordCount = content.split(/\s+/).filter((word: string) => word.length > 0).length;

  // Link analysis
  const internalLinks = links.filter((link: any) => link.isInternal).length;
  const eeatLinks = links.filter((link: any) => link.isEEAT).length;

  // Image alt text analysis
  const imagesWithAlt = images.filter((img: any) => img.hasAlt).length;
  const altTextPercentage = images.length > 0 ? Math.round((imagesWithAlt / images.length) * 100) : 0;

  return {
    h1Present,
    h1Count,
    headingDepth,
    wordCount,
    internalLinks,
    eeatLinks,
    altTextPercentage
  };
}

/**
 * Calculate lightweight performance score
 */
function calculateLightweightPerformanceScore({ htmlKb, domNodes, avgImageKb }: {
  htmlKb: number;
  domNodes: number;
  avgImageKb: number;
}) {
  const htmlPenalty = Math.min(htmlKb / 50, 1);
  const domPenalty = Math.min(domNodes / 1500, 1);
  const imagePenalty = Math.min(avgImageKb / 200, 1);

  const raw = 1 - (0.4 * htmlPenalty + 0.3 * domPenalty + 0.3 * imagePenalty);
  return Math.round(raw * 100);
}

/**
 * Calculate average image size
 */
function calculateAverageImageSize(images: any[]): number {
  if (images.length === 0) return 0;
  return 50; // Placeholder
}

/**
 * Detect server-side rendering
 */
function detectSSR(html: string): boolean {
  if (!html) return false;
  
  if (html.includes('__NEXT_DATA__')) return true;
  
  const htmlBeforeScripts = html.split(/<script[\s\S]*?<\/script>/i)[0] || '';
  const hasSSRContent = /<(h1|h2|h3|article|main|section)[\s>]/i.test(htmlBeforeScripts) ||
                       /<p[^>]*>[^<]{20,}/i.test(htmlBeforeScripts);
  
  return hasSSRContent;
}

/**
 * Calculate preliminary page score
 */
function calculatePreliminaryScore(analysis: any, performanceScore: number): number {
  let score = 0;
  
  // Content factors (40%)
  score += analysis.wordCount > 300 ? 20 : (analysis.wordCount / 300) * 20;
  score += analysis.h1Present ? 10 : 0;
  score += analysis.headingDepth > 1 ? 10 : 0;
  
  // Technical factors (30%)
  score += 15; // Base score for being crawlable
  score += analysis.altTextPercentage > 80 ? 15 : (analysis.altTextPercentage / 80) * 15;
  
  // Performance (10%)
  score += (performanceScore / 100) * 10;
  
  // Links (20%)
  score += Math.min(analysis.internalLinks / 5, 1) * 10;
  score += Math.min(analysis.eeatLinks / 2, 1) * 10;
  
  return Math.round(Math.min(score, 100));
}

/**
 * Generate a quick recommendation
 */
function generateQuickWin(analysis: any, performanceScore: number, metadata: any): string {
  if (!analysis.h1Present) {
    return "Add an H1 heading to improve SEO structure";
  }
  if (analysis.altTextPercentage < 50) {
    return "Add alt text to images for better accessibility";
  }
  if (performanceScore < 70) {
    return "Optimize page size - consider compressing images or reducing HTML";
  }
  if (analysis.wordCount < 300) {
    return "Add more content - pages with 300+ words typically rank better";
  }
  if (analysis.internalLinks < 3) {
    return "Add internal links to improve site navigation";
  }
  return "Great job! Consider adding structured data for enhanced search results";
}

/**
 * Generate priority actions based on technical and content analysis
 */
function generatePriorityActions(basicAnalysis: any, performanceScore: number, contentMetrics: any): string[] {
  const actions: string[] = [];

  // Technical priorities
  if (!basicAnalysis.h1Present) {
    actions.push("🎯 HIGH: Add H1 heading for SEO structure");
  }
  if (performanceScore < 70) {
    actions.push("⚡ HIGH: Optimize page performance (images, HTML size)");
  }
  if (basicAnalysis.altTextPercentage < 80) {
    actions.push("♿ MED: Improve image accessibility with alt text");
  }

  // Content priorities
  if (contentMetrics) {
    if (contentMetrics.redFlagPercentage > 20) {
      actions.push("🚨 HIGH: Fix content red flags (promotional language, citations)");
    }
    if (contentMetrics.avgAuthority < 3) {
      actions.push("📚 MED: Add more authoritative sources and citations");
    }
    if (contentMetrics.avgClarity < 3) {
      actions.push("✍️ MED: Improve content clarity and readability");
    }
  }

  return actions.slice(0, 5); // Top 5 priorities
} 
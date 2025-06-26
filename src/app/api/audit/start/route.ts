import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enhancedFirecrawl } from '@/lib/services/enhanced-firecrawl-client';

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

    // Get authenticated user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

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

    // Extract domain
    const domain = new URL(url).hostname.toLowerCase();

    // Check for existing audit (prevent duplicates)
    const { data: existingAudit } = await supabase
      .from('comprehensive_audits')
      .select('id, status, created_at')
      .eq('url', url)
      .eq('user_id', user.id)
      .single();

    // If there's a recent audit (< 24 hours), return it
    if (existingAudit && existingAudit.status === 'completed') {
      const auditAge = Date.now() - new Date(existingAudit.created_at).getTime();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      if (auditAge < twentyFourHours) {
        return NextResponse.json({
          jobId: existingAudit.id,
          status: 'completed',
          message: 'Recent audit found, returning existing results',
          url
        });
      }
    }

    // Create new audit job
    const jobId = crypto.randomUUID();
    
    const { data: auditJob, error: insertError } = await supabase
      .from('comprehensive_audits')
      .insert({
        url,
        domain,
        user_id: user.id,
        job_id: jobId,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select('id, job_id')
      .single();

    if (insertError) {
      console.error('Failed to create audit job:', insertError);
      return NextResponse.json(
        { error: 'Failed to create audit job' },
        { status: 500 }
      );
    }

    // Trigger background processing
    // Note: In production, you'd use a proper queue like Supabase Edge Functions
    // For now, we'll use a simple background process
    processAuditInBackground(auditJob.id, url, user.id, options);

    return NextResponse.json({
      jobId: auditJob.job_id,
      auditId: auditJob.id,
      status: 'pending',
      message: 'Audit job created successfully',
      url,
      estimatedDuration: '30-60 seconds'
    }, { status: 202 });

  } catch (error: any) {
    console.error('Error in audit start endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Background processing function
 * In production, this would be moved to a separate worker/queue
 */
async function processAuditInBackground(
  auditId: string, 
  url: string, 
  userId: string, 
  options: any
) {
  // Don't await this - let it run in background
  setTimeout(async () => {
    try {
      await processAuditJob(auditId, url, userId, options);
    } catch (error) {
      console.error('Background audit processing failed:', error);
    }
  }, 100);
}

/**
 * Main audit processing function
 */
async function processAuditJob(
  auditId: string,
  url: string, 
  userId: string,
  options: any
) {
  const supabase = createClient();
  const startTime = Date.now();

  try {
    console.log(`🚀 Starting audit processing for: ${url}`);

    // Update status to processing
    await supabase
      .from('comprehensive_audits')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', auditId);

    // Step 1: Enhanced Firecrawl scraping
    console.log(`📡 Step 1: Scraping with enhanced Firecrawl...`);
    const pageData = await enhancedFirecrawl.scrapeWithMetrics(url, {
      waitFor: options.waitFor || 3000,
      timeout: options.timeout || 30000,
      onlyMainContent: true
    });

    if (!pageData.success) {
      throw new Error(`Firecrawl failed: ${pageData.error}`);
    }

    // Step 2: Basic analysis (we'll add more analyzers in Week 2)
    console.log(`🔍 Step 2: Running basic analysis...`);
    const basicAnalysis = await runBasicAnalysis(pageData);

    // Step 3: Calculate lightweight performance score
    console.log(`⚡ Step 3: Calculating performance score...`);
    const performanceScore = calculateLightweightPerformanceScore({
      htmlKb: pageData.metadata.htmlSize / 1024,
      domNodes: pageData.metadata.domNodes,
      avgImageKb: calculateAverageImageSize(pageData.metadata.images)
    });

    // Step 4: Calculate preliminary page score
    const pageScore = calculatePreliminaryScore(basicAnalysis, performanceScore);

    // Step 5: Update database with results
    const analysisResults = {
      status: 'completed',
      page_title: pageData.metadata.title,
      html_size_kb: Math.round((pageData.metadata.htmlSize / 1024) * 100) / 100,
      dom_size_kb: Math.round((pageData.metadata.domNodes / 1000) * 100) / 100, // Convert to "kB equivalent"
      performance_score: performanceScore,
      crawlable: true, // If we got here, it's crawlable
      ssr_rendered: detectSSR(pageData.html),
      meta_description_present: !!pageData.metadata.description,
      h1_present: basicAnalysis.h1Present,
      h1_count: basicAnalysis.h1Count,
      heading_depth: basicAnalysis.headingDepth,
      word_count: basicAnalysis.wordCount,
      internal_link_count: basicAnalysis.internalLinks,
      external_eeat_links: basicAnalysis.eeatLinks,
      total_images: pageData.metadata.images.length,
      image_alt_present_percent: basicAnalysis.altTextPercentage,
      jsonld_valid: pageData.metadata.hasJsonLd,
      page_score: pageScore,
      analyzed_at: new Date().toISOString(),
      analysis_duration_ms: Date.now() - startTime,
      updated_at: new Date().toISOString()
    };

    await supabase
      .from('comprehensive_audits')
      .update(analysisResults)
      .eq('id', auditId);

    console.log(`✅ Audit completed successfully for ${url} (Score: ${pageScore}/100)`);

  } catch (error: any) {
    console.error(`❌ Audit processing failed for ${url}:`, error);

    // Update status to failed
    await supabase
      .from('comprehensive_audits')
      .update({
        status: 'failed',
        error_message: error.message,
        analysis_duration_ms: Date.now() - startTime,
        updated_at: new Date().toISOString()
      })
      .eq('id', auditId);
  }
}

/**
 * Basic analysis functions (Week 1 implementation)
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
  // Crude but fast: smaller is better
  const htmlPenalty = Math.min(htmlKb / 50, 1);      // ≥50 kB = full penalty
  const domPenalty = Math.min(domNodes / 1500, 1);   // ≥1500 nodes = full penalty
  const imagePenalty = Math.min(avgImageKb / 200, 1); // ≥200 kB avg = full penalty

  const raw = 1 - (0.4 * htmlPenalty + 0.3 * domPenalty + 0.3 * imagePenalty);
  return Math.round(raw * 100); // 0-100 score
}

/**
 * Calculate average image size
 */
function calculateAverageImageSize(images: any[]): number {
  if (images.length === 0) return 0;
  // For now, estimate based on image count (we'll improve this in Week 2)
  return 50; // Placeholder: assume 50kB average
}

/**
 * Detect server-side rendering
 */
function detectSSR(html: string): boolean {
  if (!html) return false;
  
  // Check for Next.js SSR indicators
  if (html.includes('__NEXT_DATA__')) return true;
  
  // Check for meaningful content before scripts
  const htmlBeforeScripts = html.split(/<script[\s\S]*?<\/script>/i)[0] || '';
  const hasSSRContent = /<(h1|h2|h3|article|main|section)[\s>]/i.test(htmlBeforeScripts) ||
                       /<p[^>]*>[^<]{20,}/i.test(htmlBeforeScripts);
  
  return hasSSRContent;
}

/**
 * Calculate preliminary page score (basic version for Week 1)
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
  score += Math.min(analysis.internalLinks / 5, 1) * 10; // Up to 10 points for internal links
  score += Math.min(analysis.eeatLinks / 2, 1) * 10; // Up to 10 points for EEAT links
  
  return Math.round(Math.min(score, 100));
} 
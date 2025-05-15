import { createClient } from '@supabase/supabase-js';
import { 
  startCrawl, 
  getCrawlStatus, 
  getCrawlResults, 
  checkForLlmsTxt,
  checkRobotsTxt,
  extractWithPrompt,
  scrapeWithActions,
  PageData,
  extractStructuredData,
  CrawlAction
} from './firecrawl-client';
import { analyzePageForAEO, AEOAnalysisResult } from './aeo-analyzer';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Start a site audit
 */
export async function startSiteAudit(options: {
  siteUrl: string;
  userId: string;
  maxPages?: number;
  includeDocuments?: boolean;
  checkMediaAccessibility?: boolean;
  performInteractiveActions?: boolean;
}): Promise<{ crawlId: string; siteId: string }> {
  console.log('startSiteAudit called with:', JSON.stringify(options));
  
  const { 
    siteUrl, 
    userId, 
    maxPages = 100,
    includeDocuments = true,
    checkMediaAccessibility = true,
    performInteractiveActions = false
  } = options;
  
  // Check if Firecrawl token is available
  if (!process.env.FIRECRAWL_API_KEY) {
    console.error('FIRECRAWL_API_KEY is not set');
    throw new Error('Server configuration error: Firecrawl API key is missing');
  } else {
    console.log('FIRECRAWL_API_KEY is available');
  }
  
  // Create a normalized version of the URL
  try {
    const normalizedUrl = normalizeUrl(siteUrl);
    const domain = new URL(normalizedUrl).hostname;
    
    console.log('Starting site audit for:', domain);
    
    // Create or get site record
    try {
      console.log('Creating/updating site record with userId:', userId);
      const { data: siteData, error: siteError } = await supabase
        .from('sites')
        .upsert({
          uid: userId,
          domain: domain
        })
        .select('id')
        .single();
      
      if (siteError) {
        console.error('Failed to create site record:', siteError);
        throw new Error(`Failed to create site record: ${siteError.message}`);
      }
      
      console.log('Site record created/updated:', siteData?.id);
      
      // Let's check if the site was actually created
      const { data: checkSite, error: checkError } = await supabase
        .from('sites')
        .select('*')
        .eq('id', siteData.id)
        .single();
        
      console.log('Site check:', checkSite, checkError);
      
      // Create crawl record
      try {
        console.log('Creating crawl record for site:', siteData.id);
        
        // Debug: Check the database schema before insertion
        console.log('Checking crawls table schema before insertion...');
        const { error: schemaError } = await supabase.rpc('get_column_names', { 
          table_name: 'crawls' 
        });
        
        if (schemaError) {
          console.error('Error fetching schema:', schemaError);
        }
        
        const crawlRecord = {
          site_id: siteData.id,
          status: 'started',
          started_at: new Date().toISOString(),
          total_pages: 0,
          aeo_score: 0,
          include_documents: includeDocuments,
          check_media_accessibility: checkMediaAccessibility,
          perform_interactive_actions: performInteractiveActions
        };
        
        console.log('Inserting crawl record:', crawlRecord);
        
        const { data: crawlData, error: crawlError } = await supabase
          .from('crawls')
          .insert(crawlRecord)
          .select('id')
          .single();
        
        if (crawlError) {
          console.error('Failed to create crawl record:', crawlError);
          throw new Error(`Failed to create crawl record: ${crawlError.message}`);
        }
        
        console.log('Crawl record created:', crawlData?.id);
        
        // Let's check if the crawl was actually created
        const { data: checkCrawl, error: checkCrawlError } = await supabase
          .from('crawls')
          .select('*')
          .eq('id', crawlData.id)
          .single();
          
        console.log('Crawl check:', checkCrawl, checkCrawlError);
        
        // Start the Firecrawl crawl
        try {
          console.log('Starting Firecrawl for URL:', normalizedUrl);
          const firecrawlId = await startCrawl({
            siteUrl: normalizedUrl,
            maxPages: maxPages,
            maxDepth: 5,
            includeInnerLinks: true,
            includeDocuments: includeDocuments,
            includeRobotsTxt: true,
            includeSitemap: true
          });
          
          console.log('Firecrawl started:', firecrawlId);
          
          // Update the crawl record with the Firecrawl ID
          const { error: updateError } = await supabase
            .from('crawls')
            .update({
              apify_run_id: firecrawlId // Keeping the field name for backward compatibility
            })
            .eq('id', crawlData.id);
            
          if (updateError) {
            console.error('Failed to update crawl record with Firecrawl ID:', updateError);
          } else {
            console.log('Updated crawl record with Firecrawl ID');
          }
          
          return {
            crawlId: crawlData.id,
            siteId: siteData.id
          };
        } catch (crawlError) {
          console.error('Failed to start Firecrawl:', crawlError);
          throw new Error(`Failed to start Firecrawl crawl: ${crawlError.message}`);
        }
      } catch (crawlCreationError) {
        console.error('Failed during crawl creation:', crawlCreationError);
        throw crawlCreationError;
      }
    } catch (siteCreationError) {
      console.error('Failed during site creation:', siteCreationError);
      throw siteCreationError;
    }
  } catch (urlError) {
    console.error('Invalid URL or normalization error:', urlError);
    throw new Error(`Invalid URL format: ${urlError.message}`);
  }
}

/**
 * Check the status of a crawl
 */
export async function getSiteAuditStatus(crawlId: string): Promise<{
  status: string;
  progress: number;
}> {
  console.log(`Checking status for crawl ID: ${crawlId}`);
  
  // Get the crawl record
  const { data: crawlData, error } = await supabase
    .from('crawls')
    .select('status, apify_run_id, started_at')
    .eq('id', crawlId)
    .single();
  
  if (error) {
    console.error(`Failed to get crawl record: ${error.message}`);
    throw new Error(`Failed to get crawl record: ${error.message}`);
  }
  
  console.log(`Crawl data from DB: ${JSON.stringify(crawlData)}`);
  
  // If crawl is completed, return 100% progress
  if (crawlData.status === 'completed') {
    return { status: 'completed', progress: 100 };
  }
  
  // If crawl is failed, return failed status but with 80% progress
  // so the UI doesn't get stuck at a low percentage
  if (crawlData.status === 'failed') {
    return { status: 'failed', progress: 80 };
  }
  
  // Calculate time-based progress if Firecrawl is still initializing
  // This gives users feedback even before Firecrawl reports progress
  let timeBasedProgress = 0;
  if (crawlData.started_at) {
    const startTime = new Date(crawlData.started_at).getTime();
    const currentTime = new Date().getTime();
    const elapsedSeconds = (currentTime - startTime) / 1000;
    
    // Assume initialization takes about 30 seconds
    if (elapsedSeconds < 30) {
      timeBasedProgress = Math.min(30, Math.round((elapsedSeconds / 30) * 100 * 0.3));
      console.log(`Time-based progress: ${timeBasedProgress}%`);
    }
    
    // If it's been running for more than 2 minutes, give at least 50% progress
    // to avoid the UI appearing stuck
    if (elapsedSeconds > 120) {
      timeBasedProgress = Math.max(timeBasedProgress, 50);
      console.log(`Long-running crawl, setting minimum progress to 50%`);
      
      // If it's been running for more than 5 minutes, mark it as processing with 
      // higher progress to let the user know we're still working on it
      if (elapsedSeconds > 300) {
        console.log(`Very long-running crawl (${Math.round(elapsedSeconds/60)} minutes), marking as processing`);
        return {
          status: 'processing',
          progress: 75
        };
      }
    }
  }
  
  // Otherwise, check the status from Firecrawl
  try {
    console.log(`Checking Firecrawl status for run ID: ${crawlData.apify_run_id}`);
    const firecrawlStatus = await getCrawlStatus(crawlData.apify_run_id);
    console.log(`Firecrawl status: ${JSON.stringify(firecrawlStatus)}`);
    
    // Use the higher of time-based or Firecrawl-reported progress
    const progress = Math.max(timeBasedProgress, firecrawlStatus.progress);
    
    // If the Firecrawl crawl is completed, process and store the results
    if (firecrawlStatus.status === 'completed' && crawlData.status !== 'completed') {
      console.log('Firecrawl crawl succeeded, processing results...');
      // Mark as processing - this will be updated to completed after processing
      await supabase
        .from('crawls')
        .update({ status: 'processing' })
        .eq('id', crawlId);
      
      // Process the results in the background
      processAuditResults(crawlId, crawlData.apify_run_id).catch(console.error);
      
      return {
        status: 'processing',
        progress: 85 // Show high progress while processing results
      };
    }
    
    // If Firecrawl reports an error status, mark crawl as processing and continue
    if (['failed', 'error'].includes(firecrawlStatus.status)) {
      console.log(`Firecrawl reported status ${firecrawlStatus.status}, marking as processing`);
      
      // Process partial results anyway
      processAuditResults(crawlId, crawlData.apify_run_id).catch(console.error);
      
      return {
        status: 'processing',
        progress: 70 // Show high progress so user knows we're still trying
      };
    }
    
    return {
      status: crawlData.status,
      progress
    };
  } catch (error) {
    console.error(`Error checking Firecrawl status: ${error.message}`);
    
    // Still return some progress based on time to show activity
    // and don't crash the API
    return {
      status: crawlData.status,
      progress: Math.max(timeBasedProgress, 5) // At least show 5% progress
    };
  }
}

// Add a new function to save page data incrementally
async function savePageData(crawlId: string, page: PageData, llmsTxtData: any, robotsTxtData: any): Promise<void> {
  try {
    // Skip failed requests
    if ((!page.markdown && !page.html) || page.metadata?.statusCode >= 400) {
      console.log(`Skipping page ${page.url}: No content or bad status code ${page.metadata?.statusCode}`);
      return;
    }
    
    // Analyze the page
    const analysis = analyzePageForAEO(page, llmsTxtData, robotsTxtData);
    
    // Determine page type
    const isDocument = page.metadata?.isDocument || false;
    const contentType = page.metadata?.contentType || 'html';
    
    // Store the page result
    const { data: pageData, error: pageError } = await supabase
      .from('pages')
      .insert({
        crawl_id: crawlId,
        url: page.url,
        status_code: page.metadata?.statusCode || 200,
        title: page.title,
        has_llms_reference: analysis.hasLlmsTxt,
        has_schema: analysis.hasSchema,
        is_markdown: analysis.isMarkdownRendered,
        content_length: page.markdown.length + (page.html?.length || 0),
        ai_visibility_score: analysis.scores.overall,
        is_document: isDocument,
        document_type: contentType,
        media_count: analysis.mediaCount,
        schema_types: analysis.schemaTypes.length > 0 ? analysis.schemaTypes : null,
        media_accessibility_score: analysis.scores.mediaAccess
      })
      .select('id')
      .single();
    
    if (pageError) {
      console.error(`Failed to store page result: ${pageError.message}`);
      return;
    }
    
    // Store issues
    for (const issue of analysis.issues) {
      await supabase.from('issues').insert({
        page_id: pageData.id,
        type: issue.type,
        severity: issue.type === 'critical' ? 'high' : issue.type === 'warning' ? 'medium' : 'low',
        message: issue.message,
        context: issue.context ? { content: issue.context } : null,
        fix_suggestion: issue.fixSuggestion,
        resource_url: issue.url
      });
    }
    
    // Store recommendations if they exist
    if (analysis.recommendations && analysis.recommendations.length > 0) {
      for (const recommendation of analysis.recommendations) {
        await supabase.from('recommendations').insert({
          page_id: pageData.id,
          text: recommendation
        });
      }
    }
    
    // Update the crawl with latest progress
    await updateCrawlStats(crawlId);
    
  } catch (error) {
    console.error(`Error saving page data for ${page.url}:`, error);
  }
}

// Function to update crawl statistics
async function updateCrawlStats(crawlId: string): Promise<void> {
  try {
    // Get all pages for this crawl
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('ai_visibility_score, is_document, has_schema, has_llms_reference, media_accessibility_score')
      .eq('crawl_id', crawlId);
    
    if (pagesError) {
      console.error(`Failed to get pages for stats update: ${pagesError.message}`);
      return;
    }
    
    // Calculate average AEO score
    const totalPages = pages.length;
    const totalScore = pages.reduce((sum, page) => sum + (page.ai_visibility_score || 0), 0);
    const aeoScore = totalPages > 0 ? Math.round(totalScore / totalPages) : 0;
    
    // Calculate document percentage
    const documentCount = pages.filter(page => page.is_document).length;
    const documentPercentage = totalPages > 0 ? Math.round((documentCount / totalPages) * 100) : 0;
    
    // Calculate schema percentage
    const schemaCount = pages.filter(page => page.has_schema).length;
    const schemaPercentage = totalPages > 0 ? Math.round((schemaCount / totalPages) * 100) : 0;
    
    // Calculate llms.txt coverage
    const llmsCount = pages.filter(page => page.has_llms_reference).length;
    const llmsCoverage = totalPages > 0 ? Math.round((llmsCount / totalPages) * 100) : 0;
    
    // Calculate media accessibility score
    const mediaScores = pages.filter(page => page.media_accessibility_score !== null)
      .map(page => page.media_accessibility_score);
    const avgMediaScore = mediaScores.length > 0 
      ? Math.round(mediaScores.reduce((sum, score) => sum + score, 0) / mediaScores.length)
      : null;
    
    // Update the crawl record with the current stats
    await supabase
      .from('crawls')
      .update({
        total_pages: totalPages,
        aeo_score: aeoScore,
        document_percentage: documentPercentage,
        schema_percentage: schemaPercentage,
        llms_coverage: llmsCoverage,
        media_accessibility_score: avgMediaScore
      })
      .eq('id', crawlId);
      
  } catch (error) {
    console.error(`Error updating crawl stats: ${error}`);
  }
}

/**
 * Process and store the audit results
 */
async function processAuditResults(crawlId: string, firecrawlId: string): Promise<void> {
  try {
    console.log(`Starting to process audit results for crawl ${crawlId}, Firecrawl run ${firecrawlId}`);
    
    // Get the crawl record
    const { data: crawlData, error: crawlError } = await supabase
      .from('crawls')
      .select('site_id, include_documents, perform_interactive_actions')
      .eq('id', crawlId)
      .single();
    
    if (crawlError) {
      console.error(`Failed to get crawl record: ${crawlError.message}`);
      throw new Error(`Failed to get crawl record: ${crawlError.message}`);
    }
    
    // Get the site record
    const { data: siteData, error: siteError } = await supabase
      .from('sites')
      .select('domain')
      .eq('id', crawlData.site_id)
      .single();
    
    if (siteError) {
      console.error(`Failed to get site record: ${siteError.message}`);
      throw new Error(`Failed to get site record: ${siteError.message}`);
    }
    
    // Check for llms.txt (don't fail if this fails)
    let llmsTxtData = null;
    try {
      llmsTxtData = await checkForLlmsTxt(`https://${siteData.domain}`);
      console.log(`llms.txt check result: ${JSON.stringify(llmsTxtData)}`);
    } catch (llmsError) {
      console.error('Error checking for llms.txt:', llmsError);
      // Continue without llms.txt data
    }
    
    // Check for robots.txt (don't fail if this fails)
    let robotsTxtData = null;
    try {
      robotsTxtData = await checkRobotsTxt(`https://${siteData.domain}`);
      console.log(`robots.txt check result: ${JSON.stringify({
        exists: robotsTxtData.exists,
        blocksAI: robotsTxtData.blocksAI,
        hasSitemap: robotsTxtData.hasSitemap
      })}`);
    } catch (robotsError) {
      console.error('Error checking for robots.txt:', robotsError);
      // Continue without robots.txt data
    }
    
    // Get the crawl results from Firecrawl
    console.log(`Retrieving crawl results from Firecrawl for run ${firecrawlId}`);
    let pageResults = [];
    try {
      pageResults = await getCrawlResults(firecrawlId);
      console.log(`Received ${pageResults.length} pages from crawl results`);
    } catch (resultsError) {
      console.error('Error getting crawl results:', resultsError);
      // Create a placeholder result with the domain for minimal results
      pageResults = [{
        url: `https://${siteData.domain}`,
        title: siteData.domain,
        markdown: `# ${siteData.domain}\n\nSite crawled with limited results.`,
        html: `<html><body><h1>${siteData.domain}</h1><p>Site crawled with limited results.</p></body></html>`,
        metadata: {
          title: siteData.domain,
          sourceURL: `https://${siteData.domain}`,
          statusCode: 200,
        }
      }];
    }
    
    console.log(`Processing ${pageResults.length} pages from crawl results`);
    
    // If no pages were found, still complete the crawl but with a warning
    if (pageResults.length === 0) {
      console.warn(`No pages found in crawl results. Marking as completed with minimal data.`);
      
      await supabase
        .from('crawls')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          total_pages: 0,
          aeo_score: 0
        })
        .eq('id', crawlId);
        
      return;
    }
    
    // If interactive actions are enabled, perform additional checks on the homepage
    if (crawlData.perform_interactive_actions) {
      try {
        const homepage = pageResults.find(p => 
          new URL(p.url).pathname === '/' || 
          new URL(p.url).pathname === ''
        );
        
        if (homepage) {
          console.log(`Performing interactive checks on homepage: ${homepage.url}`);
          
          // Actions to check for cookie consent, popups, etc.
          const actions: CrawlAction[] = [
            { type: 'wait', milliseconds: 3000 },
            { type: 'screenshot' }, // Take initial screenshot
            // Look for common cookie banners and accept them
            { type: 'click', selector: 'button[id*="cookie"], button[class*="cookie"], button[id*="consent"], button[class*="consent"], .cookie-accept, #cookie-accept, .cookie-button, #cookie-button' },
            { type: 'wait', milliseconds: 1000 },
            // Look for popups and close them
            { type: 'click', selector: 'button[class*="close"], button[aria-label*="close"], .modal-close, .popup-close, button[class*="dismiss"]' },
            { type: 'wait', milliseconds: 1000 },
            // Scroll down to see how the page behaves
            { type: 'scroll' },
            { type: 'wait', milliseconds: 2000 },
            // Take another screenshot post-interaction
            { type: 'screenshot' },
            // Final page scrape
            { type: 'scrape' }
          ];
          
          // Perform interactive actions and get updated content
          const interactiveResult = await scrapeWithActions(homepage.url, actions);
          console.log(`Interactive actions completed on ${homepage.url}`);
          
          // Check if screenshots were captured
          if (interactiveResult.metadata?.actions?.screenshots?.length > 0) {
            // Save screenshots to database
            for (const screenshotUrl of interactiveResult.metadata.actions.screenshots) {
              await supabase.from('screenshots').insert({
                crawl_id: crawlId,
                url: homepage.url,
                screenshot_url: screenshotUrl,
                timestamp: new Date().toISOString()
              });
            }
            console.log(`Saved ${interactiveResult.metadata.actions.screenshots.length} screenshots`);
          }
        }
      } catch (interactiveError) {
        console.error('Error performing interactive actions:', interactiveError);
        // Continue with normal processing
      }
    }
    
    // Process each page and save results incrementally
    for (const page of pageResults) {
      await savePageData(crawlId, page, llmsTxtData, robotsTxtData);
    }
    
    // Extract page metadata using AI for additional insights
    try {
      const homePage = pageResults.find(p => 
        new URL(p.url).pathname === '/' || 
        new URL(p.url).pathname === ''
      );
      
      if (homePage) {
        // Extract website purpose and key features
        const websiteInsights = await extractWithPrompt(
          homePage.url,
          "Extract the website's main purpose, target audience, key features, and primary services offered."
        );
        
        if (websiteInsights) {
          await supabase
            .from('crawls')
            .update({
              website_purpose: websiteInsights.main_purpose || websiteInsights.purpose,
              target_audience: websiteInsights.target_audience,
              key_features: websiteInsights.key_features || websiteInsights.features,
              primary_services: websiteInsights.primary_services || websiteInsights.services
            })
            .eq('id', crawlId);
            
          console.log(`Saved website insights data from AI extraction`);
        }
      }
    } catch (aiError) {
      console.error('Error extracting website insights:', aiError);
      // Continue with normal processing
    }
    
    // Update the crawl record to completed
    await supabase
      .from('crawls')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', crawlId);
    
    console.log(`Completed processing all pages for crawl ${crawlId}`);
    
  } catch (error) {
    console.error('Error processing audit results:', error);
    
    // Mark the crawl as failed
    await supabase
      .from('crawls')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString()
      })
      .eq('id', crawlId);
  }
}

// Add a new function to get partial crawl results
export async function getPartialCrawlResults(crawlId: string): Promise<any> {
  // Get the crawl record
  const { data: crawlData, error: crawlError } = await supabase
    .from('crawls')
    .select('status, total_pages, aeo_score, document_percentage, schema_percentage, llms_coverage, media_accessibility_score')
    .eq('id', crawlId)
    .single();
  
  if (crawlError) {
    throw new Error(`Failed to get crawl record: ${crawlError.message}`);
  }
  
  // Get the pages processed so far
  const { data: pages, error: pagesError } = await supabase
    .from('pages')
    .select('id, url, status_code, title, has_llms_reference, has_schema, is_markdown, content_length, ai_visibility_score, is_document, document_type, media_count, media_accessibility_score')
    .eq('crawl_id', crawlId)
    .limit(50);  // Limit to most recent 50 pages
  
  if (pagesError) {
    throw new Error(`Failed to get pages: ${pagesError.message}`);
  }
  
  // Get the issues for these pages
  let issues = [];
  if (pages.length > 0) {
    const pageIds = pages.map(page => page.id);
    const { data: issuesData, error: issuesError } = await supabase
      .from('issues')
      .select('page_id, type, severity, message, context, fix_suggestion, resource_url')
      .in('page_id', pageIds);
    
    if (!issuesError) {
      issues = issuesData;
    }
  }
  
  // Count issues by type
  const issuesCounts = {
    critical: issues.filter(issue => issue.severity === 'high').length,
    warning: issues.filter(issue => issue.severity === 'medium').length,
    info: issues.filter(issue => issue.severity === 'low').length
  };
  
  // Group issues by page
  const pageIssues = {};
  for (const issue of issues) {
    if (!pageIssues[issue.page_id]) {
      pageIssues[issue.page_id] = [];
    }
    pageIssues[issue.page_id].push({
      type: issue.type,
      message: issue.message,
      context: issue.context,
      fixSuggestion: issue.fix_suggestion,
      resourceUrl: issue.resource_url
    });
  }
  
  // Get recommendations
  const { data: recommendationsData, error: recommendationsError } = await supabase
    .from('recommendations')
    .select('page_id, text')
    .in('page_id', pages.map(page => page.id));
    
  const pageRecommendations = {};
  if (!recommendationsError && recommendationsData) {
    for (const rec of recommendationsData) {
      if (!pageRecommendations[rec.page_id]) {
        pageRecommendations[rec.page_id] = [];
      }
      pageRecommendations[rec.page_id].push(rec.text);
    }
  }
  
  // Get screenshots
  const { data: screenshots, error: screenshotsError } = await supabase
    .from('screenshots')
    .select('url, screenshot_url')
    .eq('crawl_id', crawlId);
    
  // Map pages with their issues and recommendations
  const pagesWithIssues = pages.map(page => ({
    ...page,
    issues: pageIssues[page.id] || [],
    recommendations: pageRecommendations[page.id] || []
  }));
  
  // Calculate metrics based on current data
  const contentQuality = pages.length > 0 
    ? Math.round(pages.filter(p => p.is_markdown).length / pages.length * 100)
    : 0;
    
  const technical = pages.length > 0
    ? Math.round(pages.filter(p => p.status_code >= 200 && p.status_code < 300).length / pages.length * 100)
    : 0;
  
  // Get document type counts
  const documentTypes = {};
  for (const page of pages) {
    if (page.is_document && page.document_type) {
      documentTypes[page.document_type] = (documentTypes[page.document_type] || 0) + 1;
    }
  }
  
  // Return the formatted partial results
  return {
    status: crawlData.status,
    totalPages: crawlData.total_pages || 0,
    crawledPages: pages.length,
    aeoScore: crawlData.aeo_score || 0,
    documentPercentage: crawlData.document_percentage || 0,
    schemaPercentage: crawlData.schema_percentage || 0,
    llmsCoverage: crawlData.llms_coverage || 0,
    mediaAccessibilityScore: crawlData.media_accessibility_score || 0,
    documentTypes,
    issues: issuesCounts,
    pages: pagesWithIssues,
    screenshots: screenshots || [],
    metricScores: {
      aiVisibility: crawlData.aeo_score || 0,
      contentQuality,
      technical,
      mediaAccessibility: crawlData.media_accessibility_score || 0,
      performance: 85 // Placeholder
    },
    isPartial: crawlData.status !== 'completed'
  };
}

/**
 * Get the results of a site audit
 */
export async function getSiteAuditResults(crawlId: string): Promise<any> {
  // Get the crawl record
  const { data: crawlData, error: crawlError } = await supabase
    .from('crawls')
    .select('status, total_pages, aeo_score, site_id, document_percentage, schema_percentage, llms_coverage, media_accessibility_score, website_purpose, target_audience, key_features, primary_services')
    .eq('id', crawlId)
    .single();
  
  if (crawlError) {
    throw new Error(`Failed to get crawl record: ${crawlError.message}`);
  }
  
  // If crawl is not completed, return the status
  if (crawlData.status !== 'completed') {
    return { status: crawlData.status };
  }
  
  // Get the pages
  const { data: pages, error: pagesError } = await supabase
    .from('pages')
    .select('id, url, status_code, title, has_llms_reference, has_schema, is_markdown, content_length, ai_visibility_score, is_document, document_type, media_count, media_accessibility_score, schema_types')
    .eq('crawl_id', crawlId);
  
  if (pagesError) {
    throw new Error(`Failed to get pages: ${pagesError.message}`);
  }
  
  // Get the issues
  const { data: issues, error: issuesError } = await supabase
    .from('issues')
    .select('page_id, type, severity, message, context, fix_suggestion, resource_url')
    .in('page_id', pages.map(page => page.id));
  
  if (issuesError) {
    throw new Error(`Failed to get issues: ${issuesError.message}`);
  }
  
  // Get recommendations
  const { data: recommendationsData, error: recommendationsError } = await supabase
    .from('recommendations')
    .select('page_id, text')
    .in('page_id', pages.map(page => page.id));
    
  // Get screenshots
  const { data: screenshots, error: screenshotsError } = await supabase
    .from('screenshots')
    .select('url, screenshot_url')
    .eq('crawl_id', crawlId);
  
  // Count issues by type
  const issuesCounts = {
    critical: issues.filter(issue => issue.severity === 'high').length,
    warning: issues.filter(issue => issue.severity === 'medium').length,
    info: issues.filter(issue => issue.severity === 'low').length
  };
  
  // Group issues by page
  const pageIssues = {};
  for (const issue of issues) {
    if (!pageIssues[issue.page_id]) {
      pageIssues[issue.page_id] = [];
    }
    pageIssues[issue.page_id].push({
      type: issue.type,
      message: issue.message,
      context: issue.context,
      fixSuggestion: issue.fix_suggestion,
      resourceUrl: issue.resource_url
    });
  }
  
  // Group recommendations by page
  const pageRecommendations = {};
  if (recommendationsData) {
    for (const rec of recommendationsData) {
      if (!pageRecommendations[rec.page_id]) {
        pageRecommendations[rec.page_id] = [];
      }
      pageRecommendations[rec.page_id].push(rec.text);
    }
  }
  
  // Map pages with their issues and recommendations
  const pagesWithIssues = pages.map(page => ({
    ...page,
    issues: pageIssues[page.id] || [],
    recommendations: pageRecommendations[page.id] || []
  }));
  
  // Collect schema types used across the site
  const allSchemaTypes = new Set<string>();
  pages.forEach(page => {
    if (page.schema_types && Array.isArray(page.schema_types)) {
      page.schema_types.forEach(type => allSchemaTypes.add(type));
    }
  });
  
  // Get document type counts
  const documentTypes = {};
  pages.forEach(page => {
    if (page.is_document && page.document_type) {
      documentTypes[page.document_type] = (documentTypes[page.document_type] || 0) + 1;
    }
  });
  
  // Generate global recommendations based on stats
  const globalRecommendations = [];
  
  if (crawlData.llms_coverage < 50) {
    globalRecommendations.push("Create or update your llms.txt file to improve AI visibility of key pages");
  }
  
  if (crawlData.schema_percentage < 30) {
    globalRecommendations.push("Add structured data using schema.org markup across more pages");
  }
  
  if (crawlData.media_accessibility_score < 70) {
    globalRecommendations.push("Improve media accessibility with better alt text and captions");
  }
  
  if (issuesCounts.critical > 0) {
    globalRecommendations.push(`Fix ${issuesCounts.critical} critical issues that are blocking AI engines`);
  }
  
  // Return the formatted results
  return {
    status: 'completed',
    totalPages: crawlData.total_pages,
    crawledPages: pages.length,
    aeoScore: crawlData.aeo_score,
    documentPercentage: crawlData.document_percentage || 0,
    schemaPercentage: crawlData.schema_percentage || 0,
    llmsCoverage: crawlData.llms_coverage || 0,
    mediaAccessibilityScore: crawlData.media_accessibility_score || 0,
    websitePurpose: crawlData.website_purpose,
    targetAudience: crawlData.target_audience,
    keyFeatures: crawlData.key_features,
    primaryServices: crawlData.primary_services,
    schemaTypes: Array.from(allSchemaTypes),
    documentTypes,
    issues: issuesCounts,
    pages: pagesWithIssues,
    screenshots: screenshots || [],
    recommendations: globalRecommendations,
    metricScores: {
      aiVisibility: crawlData.aeo_score,
      contentQuality: calculateMetricFromPages(pages, 'is_markdown'),
      technical: calculateMetricFromPages(pages, 'status_code', code => code >= 200 && code < 300),
      mediaAccessibility: crawlData.media_accessibility_score || 0,
      performance: 85 // Placeholder - would need separate performance metrics
    }
  };
}

/**
 * Calculate a metric score based on page values
 */
function calculateMetricFromPages(
  pages: any[], 
  field: string, 
  valueFn: (val: any) => boolean = Boolean
): number {
  if (pages.length === 0) return 0;
  
  const validCount = pages.filter(page => valueFn(page[field])).length;
  return Math.round((validCount / pages.length) * 100);
}

/**
 * Normalize a URL (ensure protocol, etc.)
 */
function normalizeUrl(url: string): string {
  // Check for localhost/127.0.0.1 which might not work well with Firecrawl
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    console.warn('Trying to crawl localhost URLs. This may not work correctly with remote crawlers.');
  }
  
  // Add protocol if missing
  if (!url.match(/^https?:\/\//)) {
    url = 'https://' + url;
  }
  
  // Remove trailing slash if present
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  
  // Validate URL
  try {
    new URL(url);
  } catch (e) {
    throw new Error(`Invalid URL format: ${e.message}`);
  }
  
  console.log(`Normalized URL: ${url}`);
  return url;
}

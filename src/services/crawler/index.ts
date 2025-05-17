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
  CrawlAction,
  mapSite,
  scrapeSingleUrl
} from './firecrawl-client';
import { scorePageWithLLM, LLMScoreResult } from "../aeo/scorecard";
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
        
        // NEW APPROACH: Map the site to get all URLs first
        console.log(`[startSiteAudit] Mapping site: ${normalizedUrl}`);
        const mappedUrls = await mapSite(normalizedUrl);

        if (!mappedUrls || mappedUrls.length === 0) {
          console.error(`[startSiteAudit] Failed to map site or no URLs found for ${normalizedUrl}.`);
          await supabase.from('crawls').update({ status: 'failed', completed_at: new Date().toISOString() }).eq('id', crawlData.id);
          throw new Error('Failed to map site or no URLs found.');
        }
        
        console.log(`[startSiteAudit] Found ${mappedUrls.length} URLs for site ${normalizedUrl}. Updating crawl record and starting processing.`);

        // Update crawl record with total_pages and set status to 'processing'
        const { error: updateCrawlError } = await supabase
          .from('crawls')
          .update({ 
            total_pages: mappedUrls.length,
            status: 'processing' // Indicate that we are now processing these mapped URLs
            // apify_run_id will no longer be set here
          })
          .eq('id', crawlData.id);

        if (updateCrawlError) {
          console.error('[startSiteAudit] Failed to update crawl record with total_pages and status:', updateCrawlError);
          // Don't necessarily fail the whole operation, but log it. Processing might still work.
        }
        
        // Process these URLs in the background
        // Note: processAuditResults will need to be adapted to take urlsToScrape instead of firecrawlId
        processAuditResults(crawlData.id, mappedUrls).catch(err => {
          console.error(`[startSiteAudit] Error during background processAuditResults for crawl ${crawlData.id}:`, err);
          // Optionally mark crawl as failed here if background processing fails critically
          supabase.from('crawls').update({ status: 'failed', completed_at: new Date().toISOString(), aeo_score: -2 }).eq('id', crawlData.id)
            .then(({error: failUpdateError}) => {
              if (failUpdateError) console.error(`[startSiteAudit] Failed to mark crawl as failed after processAuditResults error:`, failUpdateError);
            });
        });

        return {
          crawlId: crawlData.id,
          siteId: siteData.id
        };

        /* OLD Firecrawl asyncCrawlUrl logic - to be removed
        try {
          console.log('Starting Firecrawl for URL:', normalizedUrl);
          const firecrawlId = await startCrawl({ // startCrawl is from firecrawl-client
            siteUrl: normalizedUrl,
            maxPages: maxPages, // This maxPages might be redundant if we scrape all mapped URLs
            // Other options like maxDepth, includeInnerLinks are implicitly handled by mapSite + individual scrapes
            includeDocuments: includeDocuments, // This option might need to be passed to scrapeSingleUrl if relevant
          });
          
          console.log('Firecrawl started:', firecrawlId);
          
          // Update the crawl record with the Firecrawl ID
          const { error: updateError } = await supabase
            .from('crawls')
            .update({
              apify_run_id: firecrawlId 
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
        } catch (crawlError: any) {
          console.error('Failed to start Firecrawl:', crawlError);
          throw new Error(`Failed to start Firecrawl crawl: ${crawlError?.message || crawlError}`);
        }
        */
      } catch (crawlCreationError: any) {
        console.error('Failed during crawl creation:', crawlCreationError);
        throw crawlCreationError;
      }
    } catch (siteCreationError: any) {
      console.error('Failed during site creation:', siteCreationError);
      throw siteCreationError;
    }
  } catch (urlError: any) {
    console.error('Invalid URL or normalization error:', urlError);
    throw new Error(`Invalid URL format: ${urlError?.message || urlError}`);
  }
}

/**
 * Check the status of a crawl
 */
export async function getSiteAuditStatus(crawlId: string): Promise<{
  status: string;
  progress: number;
}> {
  console.log(`[getSiteAuditStatus] Checking status for crawl ID: ${crawlId}`);
  
  const { data: crawlData, error: crawlError } = await supabase
    .from('crawls')
    .select('status, total_pages, started_at') // Ensure total_pages is selected
    .eq('id', crawlId)
    .single();
  
  if (crawlError || !crawlData) {
    console.error(`[getSiteAuditStatus] Failed to get crawl record for ${crawlId}:`, crawlError);
    throw new Error(`Failed to get crawl record for ${crawlId}: ${crawlError?.message}`);
  }
  
  console.log(`[getSiteAuditStatus] Crawl data from DB:`, crawlData);
  
  if (crawlData.status === 'completed') {
    return { status: 'completed', progress: 100 };
  }
  if (crawlData.status === 'failed') {
    return { status: 'failed', progress: 100 }; // Show 100% for failed to indicate it has finished trying
  }

  // If status is 'started' or 'mapping', it means mapping is in progress or queued.
  // (We might need a distinct 'mapping' status if mapSite is very long)
  // For now, if it's 'started', let's show small progress.
  if (crawlData.status === 'started') {
      // You could add time-based progress here for the mapping phase if desired
      // For example, estimate mapping takes X seconds and show progress towards that.
      // For now, just a small fixed progress for 'started'.
      let mappingProgress = 5; // Initial progress when mapping starts
      if (crawlData.started_at) {
        const startTime = new Date(crawlData.started_at).getTime();
        const currentTime = new Date().getTime();
        const elapsedSeconds = (currentTime - startTime) / 1000;
        if (elapsedSeconds > 10) mappingProgress = 10; // Slightly more if it's been a bit
        if (elapsedSeconds > 20) mappingProgress = 15;
      }
      return { status: 'mapping', progress: mappingProgress }; 
  }

  // If status is 'processing', calculate progress based on saved pages vs total_pages
  if (crawlData.status === 'processing') {
    if (crawlData.total_pages && crawlData.total_pages > 0) {
      const { count: savedPagesCount, error: countError } = await supabase
        .from('pages')
        .select('id', { count: 'exact', head: true })
        .eq('crawl_id', crawlId);

      if (countError) {
        console.error(`[getSiteAuditStatus] Error counting saved pages for crawl ${crawlId}:`, countError);
        // Fallback to a generic processing progress if count fails
        return { status: 'processing', progress: 50 }; 
      }
      
      const progress = Math.round(((savedPagesCount || 0) / crawlData.total_pages) * 100);
      console.log(`[getSiteAuditStatus] Processing progress for ${crawlId}: ${savedPagesCount}/${crawlData.total_pages} = ${progress}%`);
      // Ensure progress doesn't exceed 99% until fully completed by processAuditResults
      return { status: 'processing', progress: Math.min(progress, 99) }; 
    } else {
      // total_pages might be 0 if mapping found no URLs but didn't fail.
      // or if mapping hasn't updated total_pages yet (less likely if status is processing)
      console.warn(`[getSiteAuditStatus] Crawl ${crawlId} is 'processing' but total_pages is ${crawlData.total_pages}.`);
      return { status: 'processing', progress: 20 }; // Default if total_pages is not set
    }
  }
  
  // Fallback for any other statuses or unexpected scenarios
  console.warn(`[getSiteAuditStatus] Unexpected crawl status '${crawlData.status}' for crawlId ${crawlId}.`);
  return { status: crawlData.status, progress: 0 };

  /* OLD LOGIC to be removed
  // Calculate time-based progress if Firecrawl is still initializing
  // ... (timeBasedProgress calculation was here) ...
  
  // Otherwise, check the status from Firecrawl
  try {
    console.log(`Checking Firecrawl status for run ID: ${crawlData.apify_run_id}`);
    const firecrawlStatus = await getCrawlStatus(crawlData.apify_run_id); // getCrawlStatus from firecrawl-client
    console.log(`Firecrawl status: ${JSON.stringify(firecrawlStatus)}`);
    
    const progress = Math.max(timeBasedProgress, firecrawlStatus.progress);
    
    if (firecrawlStatus.status === 'completed' && crawlData.status !== 'completed') {
      console.log('Firecrawl crawl succeeded, processing results...');
      await supabase.from('crawls').update({ status: 'processing' }).eq('id', crawlId);
      processAuditResults(crawlId, crawlData.apify_run_id).catch(console.error);
      return { status: 'processing', progress: 85 };
    }
    
    if (['failed', 'error'].includes(firecrawlStatus.status)) {
      console.log(`Firecrawl reported status ${firecrawlStatus.status}, marking as processing`);
      processAuditResults(crawlId, crawlData.apify_run_id).catch(console.error);
      return { status: 'processing', progress: 70 };
    }
    
    return { status: crawlData.status, progress };
  } catch (error: any) {
    console.error(`Error checking Firecrawl status: ${error?.message || error}`);
    return { status: crawlData.status, progress: Math.max(timeBasedProgress, 5) };
  }
  */
}

// Add a new function to save page data incrementally
async function savePageData(crawlId: string, page: PageData, llmsTxtData: any, robotsTxtData: any): Promise<void> {
  console.log(`[savePageData] Entered for page: ${page.url}, crawlId: ${crawlId}`);
  try {
    if ((!page.markdown && !page.html) || (page.metadata?.statusCode && page.metadata.statusCode >= 400)) {
      console.log(`[savePageData] Skipping page ${page.url}: No content or bad status code ${page.metadata?.statusCode}`);
      return;
    }
    
    console.log(`[savePageData] Scoring page with LLM for: ${page.url}`);
    const llmResult: LLMScoreResult = await scorePageWithLLM(page);
    console.log(`[savePageData] LLM score result for ${page.url}:`, JSON.stringify(llmResult, null, 2));

    // Basic heuristics previously derived from analyzePageForAEO
    const hasLlmsTxt = !!llmsTxtData?.exists;
    const hasSchema = (page.metadata?.structuredData && page.metadata.structuredData.length > 0) || false;
    const isMarkdownRendered = !!page.markdown;
    const schemaTypes = hasSchema ? page.metadata!.structuredData!.map((s: any) => s['@type']).filter(Boolean) : [];
    const mediaCount = (page.html.match(/<img\b[^>]*>/gi) || []).length +
      (page.html.match(/<video\b[^>]*>/gi) || []).length +
      (page.html.match(/<audio\b[^>]*>/gi) || []).length;
    const imagesWithAlt = (page.html.match(/<img\b[^>]*alt=[^>]*>/gi) || []).length;
    const mediaAccessibilityScore = mediaCount === 0 ? 100 : Math.round((imagesWithAlt / mediaCount) * 100);
    
    const isDocument = page.metadata?.isDocument || false;
    const contentType = page.metadata?.contentType || 'html';
    
    const pageRecordToUpsert = {
      crawl_id: crawlId,
      url: page.url,
      status_code: page.metadata?.statusCode || 200,
      title: page.title,
      has_llms_reference: hasLlmsTxt,
      has_schema: hasSchema,
      is_markdown: isMarkdownRendered,
      content_length: (page.markdown?.length || 0) + (page.html?.length || 0),
      ai_visibility_score: llmResult.aeoScore,
      seo_score: llmResult.seoScore,
      total_score: llmResult.total,
      is_document: isDocument,
      document_type: contentType,
      media_count: mediaCount,
      schema_types: schemaTypes.length > 0 ? schemaTypes : null,
      media_accessibility_score: mediaAccessibilityScore
    };
    console.log(`[savePageData] Attempting to upsert page record for ${page.url}:`, JSON.stringify(pageRecordToUpsert, null, 2));
    
    const { data: pageUpsertResult, error: pageError } = await supabase
      .from('pages')
      .upsert(pageRecordToUpsert, {
        onConflict: 'crawl_id,url', // Specify conflict columns
        // ignoreDuplicates: false // Default is false, explicitly setting to ensure it updates
      })
      .select('id') // Select the ID, whether inserted or updated
      .single();
    
    if (pageError) {
      console.error(`[savePageData] CRITICAL: Failed to upsert page result for ${page.url}:`, JSON.stringify(pageError, null, 2));
      return; 
    }
    // pageUpsertResult will contain the id of the inserted or updated row.
    const pageId = pageUpsertResult?.id;
    if (!pageId) {
        console.error(`[savePageData] CRITICAL: Upsert for page ${page.url} did not return an ID.`);
        return;
    }
    console.log(`[savePageData] Successfully upserted page record for ${page.url}, ID: ${pageId}`);
    
    // For issues and recommendations, it's generally safer to delete existing ones for this pageId and re-insert.
    // This avoids accumulating old issues/recommendations if the page is re-analyzed.
    
    // Delete existing issues for this page
    const { error: deleteIssuesError } = await supabase.from('issues').delete().eq('page_id', pageId);
    if (deleteIssuesError) {
      console.warn(`[savePageData] Failed to delete existing issues for page ${pageId}:`, JSON.stringify(deleteIssuesError, null, 2));
    }

    // Save LLM issues and suggestions in the pages table
    await supabase.from('pages').update({
      llm_issues: llmResult.issues,
      llm_suggestions: llmResult.suggestions
    }).eq('id', pageId);
    
    console.log(`[savePageData] Calling updateCrawlStats for crawlId: ${crawlId}`);
    await updateCrawlStats(crawlId);
    console.log(`[savePageData] Finished for page: ${page.url}`);
    
  } catch (error: any) {
    console.error(`[savePageData] CRITICAL UNHANDLED ERROR for ${page.url}:`, error);
  }
}

// Function to update crawl statistics
async function updateCrawlStats(crawlId: string): Promise<void> {
  try {
    // Get all pages for this crawl
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('aeo_score, seo_score, ai_visibility_score, is_document, has_schema, has_llms_reference, media_accessibility_score')
      .eq('crawl_id', crawlId);
    
    if (pagesError) {
      console.error(`Failed to get pages for stats update: ${pagesError.message}`);
      return;
    }
    
    // Calculate average scores
    const totalPages = pages.length;
    const totalAeoScore = pages.reduce(
      (sum, page) => sum + (page.aeo_score ?? page.ai_visibility_score ?? 0),
      0
    );
    const aeoScore = totalPages > 0 ? Math.round(totalAeoScore / totalPages) : 0;

    const totalSeoScore = pages.reduce(
      (sum, page) => sum + (page.seo_score ?? 0),
      0
    );
    const seoScore = totalPages > 0 ? Math.round(totalSeoScore / totalPages) : 0;
    
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
        seo_score: seoScore,
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
async function processAuditResults(crawlId: string, urlsToScrape: string[]): Promise<void> {
  console.log(`[processAuditResults] Entered for crawlId: ${crawlId}, ${urlsToScrape.length} URLs to process.`);
  try {
    // Get the crawl record for site_id and other options
    const { data: crawlData, error: crawlError } = await supabase
      .from('crawls')
      .select('site_id, include_documents, perform_interactive_actions') // Keep existing selections
      .eq('id', crawlId)
      .single();
    
    if (crawlError || !crawlData) {
      console.error(`[processAuditResults] Failed to get crawl record for ${crawlId}:`, crawlError);
      throw new Error(`Failed to get crawl record for ${crawlId}: ${crawlError?.message}`);
    }
    
    const { data: siteData, error: siteError } = await supabase
      .from('sites')
      .select('domain')
      .eq('id', crawlData.site_id)
      .single();
    
    if (siteError || !siteData) {
      console.error(`[processAuditResults] Failed to get site record for site_id ${crawlData.site_id}:`, siteError);
      throw new Error(`Failed to get site record for site_id ${crawlData.site_id}: ${siteError?.message}`);
    }

    const domain = siteData.domain;
    let llmsTxtData = null;
    try {
      llmsTxtData = await checkForLlmsTxt(`https://${domain}`);
      console.log(`[processAuditResults] llms.txt check for ${domain}:`, llmsTxtData ? `Exists, ${llmsTxtData.urls?.length} URLs` : 'Not found or error');
    } catch (llmsError) {
      console.error(`[processAuditResults] Error checking for llms.txt on ${domain}:`, llmsError);
    }

    let robotsTxtData = null;
    try {
      robotsTxtData = await checkRobotsTxt(`https://${domain}`);
      console.log(`[processAuditResults] robots.txt check for ${domain}:`, robotsTxtData ? `Exists, hasSitemap: ${robotsTxtData.hasSitemap}` : 'Not found or error');
    } catch (robotsError) {
      console.error(`[processAuditResults] Error checking for robots.txt on ${domain}:`, robotsError);
    }

    if (!urlsToScrape || urlsToScrape.length === 0) {
      console.warn(`[processAuditResults] No URLs provided to scrape for crawlId ${crawlId}. Marking as completed.`);
      await supabase.from('crawls').update({ status: 'completed', completed_at: new Date().toISOString(), total_pages: 0 }).eq('id', crawlId);
      return;
    }

    console.log(`[processAuditResults] Starting to scrape ${urlsToScrape.length} URLs for crawlId ${crawlId}.`);
    let pagesProcessedSuccessfully = 0;

    for (let i = 0; i < urlsToScrape.length; i++) {
      const url = urlsToScrape[i];
      console.log(`[processAuditResults] Processing URL ${i + 1}/${urlsToScrape.length}: ${url}`);
      try {
        const pageData = await scrapeSingleUrl(url);
        if (pageData) {
          // TODO: Pass include_documents, checkMediaAccessibility to scrapeSingleUrl if they are per-page options
          // For now, these are crawl-level options, AEO analyzer uses them via llmsTxtData, robotsTxtData
          await savePageData(crawlId, pageData, llmsTxtData, robotsTxtData);
          pagesProcessedSuccessfully++;
          console.log(`[processAuditResults] Successfully processed and saved data for URL: ${url}`);
        } else {
          console.warn(`[processAuditResults] Failed to get page data from scrapeSingleUrl for: ${url}`);
        }
      } catch (pageScrapeError) {
        console.error(`[processAuditResults] Error scraping or saving page ${url}:`, pageScrapeError);
        // Optionally, log this specific page failure to a different table or update page status if exists
      }
      // Update progress in DB - this will be reflected by getSiteAuditStatus
      // No direct update to crawl record's progress field here, as getSiteAuditStatus calculates it
    }
    
    console.log(`[processAuditResults] Finished processing ${urlsToScrape.length} URLs for crawlId ${crawlId}. ${pagesProcessedSuccessfully} successful.`);
    
    // Final update to mark crawl as completed and update final stats.
    // updateCrawlStats is called by savePageData, so stats should be up-to-date.
    await supabase
      .from('crawls')
      .update({ 
        status: 'completed', 
        completed_at: new Date().toISOString()
        // total_pages was set at the start from mappedUrls.length
        // aeo_score and other percentages are updated by updateCrawlStats via savePageData
      })
      .eq('id', crawlId);
    console.log(`[processAuditResults] Crawl ${crawlId} marked as completed.`);

  } catch (error: any) {
    console.error(`[processAuditResults] CRITICAL UNHANDLED ERROR for crawlId ${crawlId}:`, error);
    try {
      await supabase.from('crawls').update({ status: 'failed', completed_at: new Date().toISOString(), aeo_score: -1 }).eq('id', crawlId);
    } catch (dbError) {
      console.error(`[processAuditResults] CRITICAL: Failed to mark crawl ${crawlId} as failed after error:`, dbError);
    }
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
  let issues: any[] = []; // Explicitly typed as any[]
  if (pages.length > 0) {
    const pageIds = pages.map(page => page.id);
    const { data: issuesData, error: issuesError } = await supabase
      .from('issues')
      .select('page_id, type, severity, message, context, fix_suggestion, resource_url')
      .in('page_id', pageIds);
    
    if (!issuesError && issuesData) {
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
  const pageIssues: { [key: string | number]: any[] } = {}; // Explicit index signature
  for (const issue of issues) {
    const pageId = issue.page_id as string | number; 
    if (!pageIssues[pageId]) {
      pageIssues[pageId] = [];
    }
    pageIssues[pageId].push({
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
    
  // Group recommendations by page
  const pageRecommendations: { [key: string | number]: any[] } = {}; // Explicit index signature
  if (recommendationsData) {
    for (const rec of recommendationsData) {
      const pageId = rec.page_id as string | number; 
      if (!pageRecommendations[pageId]) {
        pageRecommendations[pageId] = [];
      }
      pageRecommendations[pageId].push(rec.text);
    }
  }
  
  // Get screenshots
  const { data: screenshots, error: screenshotsError } = await supabase
    .from('screenshots')
    .select('url, screenshot_url')
    .eq('crawl_id', crawlId);
    
  // Map pages with their issues and recommendations
  const pagesWithIssues = pages.map((page: { id: string | number; [key: string]: any }) => ({
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
  const documentTypes: { [key: string]: number } = {}; // Explicit index signature
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
  const pageIssues: { [key: string | number]: any[] } = {}; // Explicit index signature
  for (const issue of issues) {
    const pageId = issue.page_id as string | number; 
    if (!pageIssues[pageId]) {
      pageIssues[pageId] = [];
    }
    pageIssues[pageId].push({
      type: issue.type,
      message: issue.message,
      context: issue.context,
      fixSuggestion: issue.fix_suggestion,
      resourceUrl: issue.resource_url
    });
  }
  
  // Group recommendations by page
  const pageRecommendations: { [key: string | number]: any[] } = {}; // Explicit index signature
  if (recommendationsData) {
    for (const rec of recommendationsData) {
      const pageId = rec.page_id as string | number; 
      if (!pageRecommendations[pageId]) {
        pageRecommendations[pageId] = [];
      }
      pageRecommendations[pageId].push(rec.text);
    }
  }
  
  // Map pages with their issues and recommendations
  const pagesWithIssues = pages.map((page: { id: string | number; [key: string]: any }) => ({
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
  const documentTypes: { [key: string]: number } = {}; // Explicit index signature
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
  } catch (e: any) { // Typed catch block error
    throw new Error(`Invalid URL format: ${e.message}`);
  }
  
  console.log(`Normalized URL: ${url}`);
  return url;
}

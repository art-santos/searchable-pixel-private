import { ApifyClient } from 'apify-client';

// Check for Apify token
if (!process.env.APIFY_API_TOKEN) {
  console.warn('APIFY_API_TOKEN environment variable is not set. Crawling functionality will not work.');
}

// Initialize the ApifyClient with API token
const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

export interface CrawlOptions {
  startUrls: string[];
  maxCrawlPages?: number;
  maxCrawlDepth?: number;
  includeInnerLinks?: boolean;
}

export interface CrawlResult {
  id: string;
  status: string;
  startedAt: string;
  finishedAt?: string;
  items: PageData[];
}

export interface PageData {
  url: string;
  title: string;
  html: string;
  loadedUrl: string;
  statusCode: number;
  metadata?: {
    llmsTxt?: any;
    structuredData?: any[];
    contentStructure?: any;
  };
}

/**
 * Start a website crawl using Apify WebScraper
 */
export async function startCrawl(options: CrawlOptions): Promise<string> {
  if (!process.env.APIFY_API_TOKEN) {
    throw new Error('APIFY_API_TOKEN is not set. Cannot start crawl.');
  }

  const { startUrls, maxCrawlPages = 100, maxCrawlDepth = 5, includeInnerLinks = true } = options;
  
  console.log('Starting Apify crawl with options:', JSON.stringify({
    startUrls,
    maxCrawlPages,
    maxCrawlDepth,
    includeInnerLinks
  }));
  
  try {
    // Run the Actor and wait for it to finish
    const run = await apifyClient.actor("apify/web-scraper").call({
      startUrls: startUrls.map(url => ({ url })),
      pseudoUrls: includeInnerLinks ? [{ purl: `[${startUrls[0]}].*` }] : [],
      linkSelector: "a",
      pageFunction: async function pageFunction({ request, html, body, $, response }) {
        // Extract structured data
        const structuredData = Array.from(
          document.querySelectorAll('script[type="application/ld+json"]')
        ).map(el => {
          try {
            return JSON.parse(el.textContent || '{}');
          } catch (e) {
            return {};
          }
        });

        // Basic page metadata
        return {
          url: request.url,
          loadedUrl: request.loadedUrl,
          html,
          title: $('title').text(),
          statusCode: response.statusCode,
          metadata: {
            structuredData,
          },
        };
      },
      maxCrawlDepth,
      maxPagesPerCrawl: maxCrawlPages,
      navigationTimeoutSecs: 120,
      pageLoadTimeoutSecs: 120,
      maxRequestRetries: 5,
      maxConcurrency: 2,
      waitUntil: ["networkidle2"],
      additionalMimeTypes: ["text/plain"]
    });

    console.log('Apify crawl started successfully with ID:', run.id);
    return run.id;
  } catch (error) {
    console.error('Error starting Apify crawl:', error);
    throw new Error(`Failed to start Apify crawl: ${error.message}`);
  }
}

/**
 * Check the status of a crawl
 */
export async function getCrawlStatus(runId: string): Promise<{
  status: string;
  progress: number;
}> {
  try {
    console.log(`Checking Apify run status for ID: ${runId}`);
    const run = await apifyClient.run(runId).get();
    console.log(`Raw Apify status: ${JSON.stringify({
      id: run.id,
      status: run.status,
      statusMessage: run.statusMessage,
      progress: run.progress
    })}`);
    
    // Handle various statuses
    let progress = 0;
    
    switch (run.status) {
      case 'READY':
      case 'RUNNING':
        // If progress is reported, use it
        if (run.progress && run.progress.value) {
          progress = Math.round(run.progress.value * 100);
        } else {
          // If no progress reported yet, use timing estimate
          const startedAt = new Date(run.startedAt || Date.now()).getTime();
          const elapsedSeconds = (Date.now() - startedAt) / 1000;
          // Give some progress indication based on time (max 30%)
          progress = Math.min(30, Math.round(elapsedSeconds / 2));
        }
        break;
        
      case 'SUCCEEDED':
        progress = 100;
        break;
        
      case 'FAILED':
        console.error(`Apify run failed: ${run.statusMessage || 'Unknown error'}`);
        // Instead of throwing, return at least 50% progress to show partial results
        progress = 50;
        break;
        
      case 'TIMING_OUT':
      case 'TIMED_OUT':
        console.error(`Apify run timed out: ${run.statusMessage || 'Unknown error'}`);
        // Instead of throwing, return at least 50% progress to show partial results
        progress = 50;
        break;
        
      case 'ABORTING':
      case 'ABORTED':
        console.error(`Apify run aborted: ${run.statusMessage || 'Unknown error'}`);
        // Instead of throwing, return at least 50% progress to show partial results
        progress = 50;
        break;
        
      default:
        // For any other status, show minimal progress
        progress = 5;
    }
    
    console.log(`Calculated progress: ${progress}%`);
    
    return {
      status: run.status,
      progress: progress,
    };
  } catch (error) {
    console.error(`Error getting Apify status: ${error}`);
    throw error;
  }
}

/**
 * Get the results of a completed crawl
 */
export async function getCrawlResults(runId: string): Promise<PageData[]> {
  try {
    console.log(`Getting results for Apify run ID: ${runId}`);
    
    // Get run details to find the default dataset ID
    const run = await apifyClient.run(runId).get();
    console.log(`Run details: ${JSON.stringify({
      id: run.id,
      status: run.status,
      defaultDatasetId: run.defaultDatasetId
    })}`);
    
    if (!run.defaultDatasetId) {
      console.warn(`No default dataset ID found for run ${runId}`);
      return [];
    }
    
    // Use the default dataset ID instead of the run ID
    console.log(`Fetching items from dataset: ${run.defaultDatasetId}`);
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    console.log(`Retrieved ${items.length} items from dataset`);
    
    // If no items, log warning
    if (items.length === 0) {
      console.warn(`No items found in dataset ${run.defaultDatasetId}`);
    }
    
    return items as PageData[];
  } catch (error) {
    console.error(`Error retrieving crawl results: ${error}`);
    // Return empty array instead of failing
    return [];
  }
}

/**
 * Check for llms.txt file and analyze it
 */
export async function checkForLlmsTxt(domain: string): Promise<any> {
  try {
    // Run a dedicated actor to check for llms.txt
    const run = await apifyClient.actor("apify/web-scraper").call({
      startUrls: [{ url: `${domain}/llms.txt` }],
      pageFunction: async function pageFunction({ request, html, body, $, response }) {
        return {
          exists: response.statusCode === 200,
          status: response.statusCode,
          content: body,
          urls: body ? body.trim().split('\n').filter(line => line && !line.startsWith('#')) : []
        };
      },
    });

    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    return items[0] || { exists: false, status: 404 };
  } catch (error) {
    console.error('Error checking for llms.txt:', error);
    return { exists: false, status: 500, error: error.message };
  }
} 
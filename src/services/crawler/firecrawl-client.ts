import FirecrawlApp from '@mendable/firecrawl-js';

// Create a new Firecrawl client instance with the API key
const app = new FirecrawlApp({apiKey: process.env.FIRECRAWL_API_KEY || ''});

// Interface for crawl options
export interface CrawlOptions {
  siteUrl: string;
  maxPages?: number;
  maxDepth?: number;
  includeInnerLinks?: boolean;
  includeRobotsTxt?: boolean;
  includeSitemap?: boolean;
  includeDocuments?: boolean; // PDF, DOCX, etc.
}

// Interface for page data returned by Firecrawl
export interface PageData {
  url: string;
  title: string;
  markdown: string;
  html: string;
  metadata: {
    title?: string;
    description?: string;
    language?: string;
    sourceURL?: string;
    statusCode?: number;
    ogTitle?: string;
    ogDescription?: string;
    ogUrl?: string;
    ogImage?: string;
    ogLocaleAlternate?: string[];
    ogSiteName?: string;
    structuredData?: any[];
    contentType?: string; // For identifying PDFs, images, etc.
    isDocument?: boolean;
  };
  // New field for extracted structured data
  structuredData?: any;
}

// Action types for interactive crawling
export interface CrawlAction {
  type: 'click' | 'wait' | 'scroll' | 'write' | 'press' | 'screenshot' | 'scrape';
  selector?: string;
  milliseconds?: number;
  text?: string;
  key?: string;
}

/**
 * Start a website crawl using Firecrawl
 */
export async function startCrawl(options: CrawlOptions): Promise<string> {
  if (!process.env.FIRECRAWL_API_KEY) {
    throw new Error('FIRECRAWL_API_KEY is not set. Cannot start crawl.');
  }

  const {
    siteUrl,
    maxPages = 100,
    // All other options (maxDepth, includeDocuments, etc.) are removed from this call
    // to use Firecrawl's defaults and ensure basic job submission works.
  } = options;

  // Parameters strictly based on minimal Node.js SDK examples for asyncCrawlUrl
  const paramsForFirecrawl: any = {
    limit: maxPages, 
    scrapeOptions: {  
      formats: ['markdown', 'html'],
    },
  };

  console.log('Firecrawl app.asyncCrawlUrl PARAMS (strictly minimal SDK):', JSON.stringify(paramsForFirecrawl, null, 2));
  
  try {
    const crawlJob = await app.asyncCrawlUrl(siteUrl, paramsForFirecrawl);

    if (crawlJob.success && 'id' in crawlJob && crawlJob.id) {
      console.log('Firecrawl asyncCrawlUrl job submitted successfully with ID:', crawlJob.id);
      return crawlJob.id;
    } else {
      let errorDetails = 'Unknown error submitting Firecrawl job.';
      if (!crawlJob.success && 'error' in crawlJob) {
        errorDetails = typeof crawlJob.error === 'object' ? JSON.stringify(crawlJob.error) : String(crawlJob.error);
      } else if (crawlJob.success && (!('id' in crawlJob) || !crawlJob.id)) {
        errorDetails = "Firecrawl job submission reported success but no job ID was returned.";
      }
      console.error('Firecrawl asyncCrawlUrl submission failed:', errorDetails);
      throw new Error(`Failed to submit Firecrawl async crawl job: ${errorDetails}`);
    }

  } catch (error) {
    console.error('Error in firecrawl-client startCrawl during asyncCrawlUrl:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Firecrawl client error: ${errorMessage}`);
  }
}

/**
 * Check the status of a crawl
 */
export async function getCrawlStatus(crawlId: string): Promise<{
  status: string;
  progress: number;
  total?: number;
  completed?: number;
}> {
  try {
    const statusResult = await app.checkCrawlStatus(crawlId);

    if (!statusResult.success) {
      console.error('Firecrawl checkCrawlStatus failed:', statusResult.error);
      return { status: 'error', progress: 0 };
    }
    
    // Assuming statusResult.data contains the status object when success is true
    const firecrawlStatusData = statusResult.data;

    if (typeof firecrawlStatusData !== 'object' || firecrawlStatusData === null || !('status' in firecrawlStatusData)) {
        console.error('Firecrawl checkCrawlStatus returned unexpected data structure:', firecrawlStatusData);
        return { status: 'error', progress: 0, total: 0, completed: 0 };
    }

    const total = typeof (firecrawlStatusData as any).total === 'number' ? (firecrawlStatusData as any).total : 0;
    const completed = typeof (firecrawlStatusData as any).completed === 'number' ? (firecrawlStatusData as any).completed : 0;

    const progress = total > 0 
      ? Math.min(100, Math.round((completed / total) * 100)) 
      : 0;
    
    return {
      status: String((firecrawlStatusData as any).status), // Ensure status is a string
      progress,
      total,
      completed
    };
  } catch (error) {
    console.error('Error checking crawl status:', error);
    return {
      status: 'error',
      progress: 0
    };
  }
}

/**
 * Get the results of a completed crawl
 */
export async function getCrawlResults(crawlId: string): Promise<PageData[]> {
  try {
    const result = await app.checkCrawlStatus(crawlId);

    console.log(`[firecrawl-client.ts] app.checkCrawlStatus response in getCrawlResults for job ${crawlId}:`, JSON.stringify(result, null, 2));

    if (!result.success) {
      console.error('[firecrawl-client.ts] getCrawlResults (via checkCrawlStatus) failed:', result.error);
      return [];
    }
    
    const firecrawlData = result.data;
    if (typeof firecrawlData === 'object' && firecrawlData !== null && 
        'status' in firecrawlData && (firecrawlData as any).status === 'completed') {
      
      if (Array.isArray((firecrawlData as any).data)) {
        const pageArrayFromFirecrawl = (firecrawlData as any).data;
        if (pageArrayFromFirecrawl.length === 0) {
          console.warn(`[firecrawl-client.ts] Firecrawl job ${crawlId} completed but returned 0 pages in its data array.`);
        }
        const formattedData: PageData[] = pageArrayFromFirecrawl.map((page: any) => {
          // Detect document types
          const url = page.metadata?.sourceURL || '';
          const isDocument = /\.(pdf|docx?|xlsx?|pptx?|txt)$/i.test(url);
          const contentType = isDocument 
            ? url.split('.').pop()?.toLowerCase() 
            : 'html';
          
          return {
            url,
            title: page.metadata?.title || '',
            markdown: page.markdown || '',
            html: page.html || '',
            metadata: {
              title: page.metadata?.title,
              description: page.metadata?.description,
              language: page.metadata?.language,
              sourceURL: page.metadata?.sourceURL,
              statusCode: page.metadata?.statusCode,
              ogTitle: page.metadata?.ogTitle,
              ogDescription: page.metadata?.ogDescription,
              ogUrl: page.metadata?.ogUrl,
              ogImage: page.metadata?.ogImage,
              ogLocaleAlternate: page.metadata?.ogLocaleAlternate,
              ogSiteName: page.metadata?.ogSiteName,
              structuredData: page.metadata?.structuredData,
              contentType,
              isDocument
            },
            structuredData: page.json // Include any structured data extracted
          };
        });
        
        return formattedData;
      } else {
        console.error('[firecrawl-client.ts] Firecrawl getCrawlResults returned unexpected data structure or status not completed. Data:', firecrawlData);
        return [];
      }
    } else {
      console.error('[firecrawl-client.ts] Firecrawl getCrawlResults returned unexpected data structure or status not completed. Data:', firecrawlData);
      return [];
    }
  } catch (error: any) { // Added type for error
    console.error(`[firecrawl-client.ts] Error in getCrawlResults for job ${crawlId}:`, error);
    throw new Error(`Failed to get crawl results from Firecrawl: ${error?.message || error}`); // Re-throw or handle as appropriate
  }
}

/**
 * Extract structured data from a URL using Firecrawl's LLM extraction
 */
export async function extractStructuredData(url: string, schema: any): Promise<any> {
  try {
    // Use the client instance to scrape
    const scrapeResult = await app.scrapeUrl(url, {
      formats: ['json'],
      // Corrected based on documentation: jsonOptions with schema for LLM extraction
      jsonOptions: { 
          schema: schema, 
          mode: 'llm-extraction' // Retaining mode as it's commonly used, though docs only show schema
      }
    });

    if (!scrapeResult.success) {
        console.error('Firecrawl extractStructuredData failed:', scrapeResult.error);
        return {};
    }
    
    // The extracted data might be in `scrapeResult.data.json` or `scrapeResult.data.llm_extraction`
    // Checking both as per different documentation examples
    return scrapeResult.data?.json || scrapeResult.data?.llm_extraction || {};
  } catch (error) {
    console.error('Error extracting structured data:', error);
    return {};
  }
}

/**
 * Open-ended extraction from a URL using prompt-based extraction
 */
export async function extractWithPrompt(url: string, prompt: string): Promise<any> {
  try {
    // Use the client instance to scrape
    const scrapeResult = await app.scrapeUrl(url, {
      formats: ['json'],
      // Corrected based on documentation: jsonOptions with prompt
      jsonOptions: { 
        prompt
      }
    });

    if (!scrapeResult.success) {
        console.error('Firecrawl extractWithPrompt failed:', scrapeResult.error);
        return {};
    }
    
    return scrapeResult.data?.json || {}; // Access data object
  } catch (error) {
    console.error('Error extracting with prompt:', error);
    return {};
  }
}

/**
 * Perform interactive actions on a page before scraping
 */
export async function scrapeWithActions(url: string, actions: CrawlAction[]): Promise<PageData> {
  try {
    // Use the client instance to scrape with actions
    const scrapeResult = await app.scrapeUrl(url, {
      formats: ['markdown', 'html'],
      actions
    });

    if (!scrapeResult.success) {
        console.error('Firecrawl scrapeWithActions failed:', scrapeResult.error);
        throw new Error(`Failed to scrape with actions: ${scrapeResult.error}`);
    }
    const resultData = scrapeResult.data; // Access data object
    
    return {
      url: resultData.metadata?.sourceURL || url,
      title: resultData.metadata?.title || '',
      markdown: resultData.markdown || '',
      html: resultData.html || '',
      metadata: resultData.metadata || {},
      structuredData: resultData.json || null
    };
  } catch (error) {
    console.error('Error scraping with actions:', error);
    throw new Error(`Failed to scrape with actions: ${error.message}`);
  }
}

/**
 * Check if a website has an llms.txt file
 */
export async function checkForLlmsTxt(domain: string): Promise<any> {
  try {
    // Try to scrape the llms.txt file
    const llmsTxtUrl = `${domain}/llms.txt`;
    // Use the client instance to scrape
    const scrapeResult = await app.scrapeUrl(llmsTxtUrl, {
      formats: ['markdown']
    });

    if (!scrapeResult.success) {
        console.error('Firecrawl checkForLlmsTxt failed:', scrapeResult.error);
        return { exists: false, status: 404 }; // Mimic previous error structure
    }
    const resultData = scrapeResult.data; // Access data object
    
    // Process the llms.txt content
    const content = resultData.markdown || '';
    const lines = content.split('\n').filter(line => line && !line.startsWith('#'));
    
    return {
      exists: true,
      status: 200,
      content,
      urls: lines
    };
  } catch (error) {
    console.error('Error checking for llms.txt:', error);
    return { exists: false, status: 404 };
  }
}

/**
 * Check robots.txt file
 */
export async function checkRobotsTxt(domain: string): Promise<any> {
  try {
    // Try to scrape the robots.txt file
    const robotsTxtUrl = `${domain}/robots.txt`;
    // Use the client instance to scrape
    const scrapeResult = await app.scrapeUrl(robotsTxtUrl, {
      formats: ['markdown']
    });

    if (!scrapeResult.success) {
        console.error('Firecrawl checkRobotsTxt failed:', scrapeResult.error);
        return { exists: false, status: 404 }; // Mimic previous error structure
    }
    const resultData = scrapeResult.data; // Access data object
    
    // Process the robots.txt content
    const content = resultData.markdown || '';
    
    // Simple parser for robots.txt
    const userAgents = [];
    const disallows = [];
    const allows = [];
    const sitemaps = [];
    
    const lines = content.split('\n');
    let currentUserAgent = '*';
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      if (trimmed.toLowerCase().startsWith('user-agent:')) {
        currentUserAgent = trimmed.substring(11).trim();
        userAgents.push(currentUserAgent);
      } else if (trimmed.toLowerCase().startsWith('disallow:')) {
        disallows.push({
          userAgent: currentUserAgent,
          path: trimmed.substring(9).trim()
        });
      } else if (trimmed.toLowerCase().startsWith('allow:')) {
        allows.push({
          userAgent: currentUserAgent,
          path: trimmed.substring(6).trim()
        });
      } else if (trimmed.toLowerCase().startsWith('sitemap:')) {
        sitemaps.push(trimmed.substring(8).trim());
      }
    }
    
    return {
      exists: true,
      status: 200,
      content,
      userAgents,
      disallows,
      allows,
      sitemaps,
      hasSitemap: sitemaps.length > 0,
      blocksAI: content.toLowerCase().includes('gpt') || 
                content.toLowerCase().includes('chatgpt') || 
                content.toLowerCase().includes('openai') ||
                content.toLowerCase().includes('claude') ||
                content.toLowerCase().includes('ai-bot') ||
                content.toLowerCase().includes('ai-crawler')
    };
  } catch (error) {
    console.error('Error checking robots.txt:', error);
    return { exists: false, status: 404 };
  }
} 
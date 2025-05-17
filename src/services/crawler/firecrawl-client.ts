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
  /** Number of words extracted from the markdown content */
  wordCount?: number;
  /** Size of the HTML in bytes */
  htmlSize?: number;
  /** Ratio of text length to HTML length */
  textToCodeRatio?: number;
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
    structuredData?: any[]; // This is from Firecrawl's metadata
    contentType?: string; 
    isDocument?: boolean;
  };
  extractedStructuredData?: any; // Renamed to avoid conflict, for data from extractStructuredData
}

// Helper to calculate basic metrics about the scraped page
function computePageMetrics(markdown: string, html: string) {
  const textLength = markdown ? markdown.length : 0;
  const htmlSize = html ? Buffer.byteLength(html, 'utf8') : 0;
  const wordCount = markdown
    ? markdown.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const textToCodeRatio = htmlSize > 0 ? textLength / htmlSize : 0;
  return { wordCount, htmlSize, textToCodeRatio };
}

// Action types for interactive crawling - making this a discriminated union
export type CrawlAction =
  | { type: 'click'; selector: string; all?: boolean }
  | { type: 'wait'; milliseconds?: number; selector?: string } // selector can be optional for a general wait
  | { type: 'scroll'; x?: number; y?: number; selector?: string } // scroll window or element
  | { type: 'write'; selector: string; text: string }
  | { type: 'press'; key: string } // e.g. 'Enter', 'Escape'
  | { type: 'screenshot'; fullPage?: boolean; filename?: string } // filename might be a useful addition if SDK supports custom name
  | { type: 'scrape'; selector?: string }; // scrape a specific part or the whole page again

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
    // All other advanced options (maxDepth, includeDocuments, etc.) are intentionally
    // OMITTED from this call for now. We must use the most basic SDK signature
    // to avoid the 'unrecognized_keys' error from the Firecrawl API.
    // If these features are needed, we must find how the Node SDK expects them (e.g., nested options)
    // or if it supports them at all for asyncCrawlUrl.
  } = options;

  const paramsForFirecrawl: any = {
    limit: maxPages, // This is a documented parameter
    scrapeOptions: {  // This is a documented parameter
      formats: ['markdown', 'html'],
      // We cannot reliably pass include_docs here either without knowing if scrapeOptions supports it
    },
  };

  console.log('Firecrawl app.asyncCrawlUrl PARAMS (MINIMAL FOR DEBUGGING):', JSON.stringify(paramsForFirecrawl, null, 2));
  
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

    // Summary logging (already improved)
    let pageCount = 0;
    let crawlStatusInData = 'N/A';
    let firecrawlWarningInData = null;
    let isDataDirectlyAnArray = false;

    if (result.success && result.data) {
      if (Array.isArray(result.data)) { // Check if result.data IS the array of pages
        pageCount = result.data.length;
        isDataDirectlyAnArray = true;
        crawlStatusInData = 'completed'; // If data is an array, assume completed for this path
      } else if (typeof result.data === 'object' && result.data !== null) {
        const statusResponseData = result.data as any;
        if ('data' in statusResponseData && Array.isArray(statusResponseData.data)) {
          pageCount = statusResponseData.data.length;
        }
        if ('status' in statusResponseData) {
          crawlStatusInData = statusResponseData.status;
        }
        if ('warning' in statusResponseData) {
          firecrawlWarningInData = statusResponseData.warning;
        }
      }
    }

    console.log(
      `[firecrawl-client.ts] app.checkCrawlStatus response summary for job ${crawlId}:`,
      {
        success: result.success,
        status: 'status' in result ? result.status : 'N/A',
        crawlStatusInData: crawlStatusInData,
        pageArrayLength: pageCount,
        isDataDirectlyAnArray: isDataDirectlyAnArray,
        error: 'error' in result && result.error ? result.error : null,
        warning: 'warning' in result && result.warning ? result.warning : null,
      }
    );

    if ('warning' in result && result.warning) {
      console.warn(`[firecrawl-client.ts] Firecrawl top-level warning for job ${crawlId}: ${result.warning}`);
      // Handle throttling as per suggestion
      if (typeof result.warning === 'string' && result.warning.includes('throttled')) {
        console.warn(`[firecrawl-client.ts] Firecrawl job ${crawlId} was throttled. Consider this a temporary error or prompt for plan upgrade.`);
        // Depending on desired behavior, you might want to throw a specific error here
        // or return a special status that the calling function can use to pause/retry.
        // For now, returning empty array as it was before for error cases, but logging is key.
        return []; 
      }
    }
    if (firecrawlWarningInData) {
      console.warn(`[firecrawl-client.ts] Firecrawl warning in result.data for job ${crawlId}: ${firecrawlWarningInData}`);
    }

    if (!result.success) {
      console.error('[firecrawl-client.ts] getCrawlResults (via checkCrawlStatus) failed:', 'error' in result ? result.error : 'Unknown error');
      // Additional check for throttling if success is false but a warning is present
      if ('warning' in result && typeof result.warning === 'string' && result.warning.includes('throttled')) {
         console.warn(`[firecrawl-client.ts] Firecrawl job ${crawlId} failed but also reported throttling. Warning: ${result.warning}`);
      }
      return [];
    }
    
    // Handle the case where result.data is directly the array of pages
    if (isDataDirectlyAnArray && Array.isArray(result.data)) {
      console.log(`[firecrawl-client.ts] Processing ${result.data.length} pages directly from result.data for job ${crawlId}`);
      const pageArrayFromFirecrawl = result.data as any[];
      const formattedData: PageData[] = pageArrayFromFirecrawl.map((page: any) => {
        const url = page.metadata?.sourceURL || page.url || '';
        const isDocument = /\.(pdf|docx?|xlsx?|pptx?|txt)$/i.test(url);
        const contentType = isDocument ? url.split('.').pop()?.toLowerCase() : (page.metadata?.contentType || 'html');
        const markdown = page.markdown || '';
        const html = page.html || '';
        const metrics = computePageMetrics(markdown, html);
        return {
          url,
          title: page.metadata?.title || page.title || '',
          markdown,
          html,
          wordCount: metrics.wordCount,
          htmlSize: metrics.htmlSize,
          textToCodeRatio: metrics.textToCodeRatio,
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
          extractedStructuredData: page.json || page.structured_data || null
        };
      });
      return formattedData;
    }

    // Original logic path: result.data is an object, and result.data.data contains the pages
    const firecrawlStatusObject = result.data as any; // Cast to any, as its structure varies based on success

    if (firecrawlStatusObject && typeof firecrawlStatusObject === 'object' && firecrawlStatusObject.status === 'completed') {
      const pageArrayFromFirecrawl = firecrawlStatusObject.data;
      if (Array.isArray(pageArrayFromFirecrawl)) {
        if (pageArrayFromFirecrawl.length === 0) {
          console.warn(`[firecrawl-client.ts] Firecrawl job ${crawlId} completed but returned 0 pages in its data array (firecrawlStatusObject.data).`);
        }
        const formattedData: PageData[] = pageArrayFromFirecrawl.map((page: any) => {
          const url = page.metadata?.sourceURL || page.url || '';
          const isDocument = /\.(pdf|docx?|xlsx?|pptx?|txt)$/i.test(url);
          const contentType = isDocument ? url.split('.').pop()?.toLowerCase() : (page.metadata?.contentType || 'html');
          const markdown = page.markdown || '';
          const html = page.html || '';
          const metrics = computePageMetrics(markdown, html);
          return {
            url,
            title: page.metadata?.title || page.title || '',
            markdown,
            html,
            wordCount: metrics.wordCount,
            htmlSize: metrics.htmlSize,
            textToCodeRatio: metrics.textToCodeRatio,
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
            extractedStructuredData: page.json || page.structured_data || null
          };
        });
        return formattedData;
      } else {
        console.error('[firecrawl-client.ts] Firecrawl getCrawlResults: status is completed, but firecrawlStatusObject.data is not an array. Data:', firecrawlStatusObject);
        return [];
      }
    } else if (firecrawlStatusObject && typeof firecrawlStatusObject === 'object' && 'status' in firecrawlStatusObject) {
      console.warn(`[firecrawl-client.ts] Firecrawl job ${crawlId} status is not 'completed' (was ${firecrawlStatusObject.status}). Full status object:`, firecrawlStatusObject);
      return [];
    } else {
      console.error('[firecrawl-client.ts] Firecrawl getCrawlResults returned unexpected data structure (result.data was not an object or not structured as expected). Full result:', result);
      return [];
    }
  } catch (error: any) { 
    console.error(`[firecrawl-client.ts] Error in getCrawlResults for job ${crawlId}:`, error);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get crawl results from Firecrawl: ${message}`);
  }
}

/**
 * Extract structured data from a URL using Firecrawl's LLM extraction
 */
export async function extractStructuredData(url: string, schema: any): Promise<any> {
  try {
    const scrapeResult = await app.scrapeUrl(url, {
      formats: ['json'], // Requesting JSON output
      jsonOptions: { 
          schema: schema, 
          // mode: 'llm-extraction' // Removed: 'mode' is not a recognized key
      }
    });

    if (!scrapeResult.success) {
        console.error('Firecrawl extractStructuredData failed:', 'error' in scrapeResult ? scrapeResult.error : 'Unknown error');
        return {};
    }
    
    // Assuming the LLM extracted data is in scrapeResult.json or scrapeResult.llm_extraction
    // The SDK type for ScrapeResponse<T, never> suggests formats like .markdown, .html, .json are top-level
    return scrapeResult.json || (scrapeResult as any).llm_extraction || {};
  } catch (error) {
    console.error('Error extracting structured data:', error);
    const message = error instanceof Error ? error.message : String(error);
    return { error: `Extraction failed: ${message}` };
  }
}

/**
 * Open-ended extraction from a URL using prompt-based extraction
 */
export async function extractWithPrompt(url: string, prompt: string): Promise<any> {
  try {
    const scrapeResult = await app.scrapeUrl(url, {
      formats: ['json'], // Requesting JSON output
      jsonOptions: { 
        prompt
      }
    });

    if (!scrapeResult.success) {
        console.error('Firecrawl extractWithPrompt failed:', 'error' in scrapeResult ? scrapeResult.error : 'Unknown error');
        return {};
    }
    
    return scrapeResult.json || {}; // Access json property directly
  } catch (error) {
    console.error('Error extracting with prompt:', error);
    const message = error instanceof Error ? error.message : String(error);
    return { error: `Extraction with prompt failed: ${message}` };
  }
}

/**
 * Perform interactive actions on a page before scraping
 */
export async function scrapeWithActions(url: string, actions: CrawlAction[]): Promise<PageData> {
  try {
    // Use the client instance to scrape with actions
    // The 'actions' type needs to align with FirecrawlApp's expected Action[] type.
    // Our redefined CrawlAction should be closer.
    const scrapeResult = await app.scrapeUrl(url, {
      formats: ['markdown', 'html', 'json'], // also get json if available
      actions: actions as any, // Using 'as any' for now if CrawlAction is not perfectly matching SDK's Action[]
                               // TODO: Ensure CrawlAction perfectly matches Firecrawl SDK's exported Action type or structure
    });

    if (!scrapeResult.success) {
        const errorDetails = 'error' in scrapeResult ? scrapeResult.error : 'Unknown error';
        console.error('Firecrawl scrapeWithActions failed:', errorDetails);
        throw new Error(`Failed to scrape with actions: ${JSON.stringify(errorDetails)}`);
    }
    
    // Access properties like .markdown, .html, .metadata directly from scrapeResult
    const metadata = (scrapeResult as any).metadata || {}; // Cast if metadata is not on base ScrapeResponse
    const structuredData = scrapeResult.json || null;
    const markdown = scrapeResult.markdown || '';
    const html = scrapeResult.html || '';
    const metrics = computePageMetrics(markdown, html);

    return {
      url: metadata.sourceURL || url,
      title: metadata.title || '',
      markdown,
      html,
      wordCount: metrics.wordCount,
      htmlSize: metrics.htmlSize,
      textToCodeRatio: metrics.textToCodeRatio,
      metadata: metadata,
      extractedStructuredData: structuredData
    };
  } catch (error) {
    console.error('Error scraping with actions:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to scrape with actions: ${error.message}`);
    }
    throw new Error(`Failed to scrape with actions: ${String(error)}`);
  }
}

/**
 * Check if a website has an llms.txt file
 */
export async function checkForLlmsTxt(domain: string): Promise<any> {
  try {
    const llmsTxtUrl = `${domain.startsWith('http') ? '' : 'https://'}${domain}/llms.txt`;
    const scrapeResult = await app.scrapeUrl(llmsTxtUrl, {
      formats: ['markdown'] // Requesting markdown content
    });

    if (!scrapeResult.success || !scrapeResult.markdown) { // Check for markdown existence
        console.warn(`[firecrawl-client.ts] checkForLlmsTxt: Failed to scrape ${llmsTxtUrl} or no markdown data. Error: ${'error' in scrapeResult ? scrapeResult.error : 'No markdown content'}`);
        return { exists: false, status: scrapeResult.success ? 404 : 500, content: '', urls: [] }; //
    }
    
    const content = scrapeResult.markdown || '';
    const lines = content.split('\\n').filter((line: string) => line && !line.startsWith('#'));
    
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
    const robotsTxtUrl = `${domain.startsWith('http') ? '' : 'https://'}${domain}/robots.txt`;
    const scrapeResult = await app.scrapeUrl(robotsTxtUrl, {
      formats: ['markdown'] // Requesting markdown content
    });

    if (!scrapeResult.success || !scrapeResult.markdown) { // Check for markdown existence
        console.warn(`[firecrawl-client.ts] checkRobotsTxt: Failed to scrape ${robotsTxtUrl} or no markdown data. Error: ${'error' in scrapeResult ? scrapeResult.error : 'No markdown content'}`);
        return { exists: false, status: scrapeResult.success ? 404 : 500, content: '', userAgents: [], disallows: [], allows: [], sitemaps: [], hasSitemap: false, blocksAI: false };
    }
    
    const content = scrapeResult.markdown || '';
    
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

/**
 * Map a website to get all its URLs using Firecrawl
 */
export async function mapSite(siteUrl: string): Promise<string[] | null> {
  if (!process.env.FIRECRAWL_API_KEY) {
    console.error('[firecrawl-client.ts] FIRECRAWL_API_KEY is not set. Cannot map site.');
    throw new Error('FIRECRAWL_API_KEY is not set. Cannot map site.');
  }
  console.log(`[firecrawl-client.ts] Attempting to map site: ${siteUrl}`);
  try {
    const mapResponse = await app.mapUrl(siteUrl);

    if (mapResponse.success) {
      // Assuming mapResponse directly has a 'links' property on success, based on cURL example.
      const links = (mapResponse as any).links;
      if (links && Array.isArray(links)) {
        console.log(`[firecrawl-client.ts] Successfully mapped site ${siteUrl}, found ${links.length} URLs.`);
        return links;
      } else {
        // Fallback: check if .data contains the links (some SDKs might do this)
        const dataLinks = (mapResponse as any).data;
        if (dataLinks && Array.isArray(dataLinks)) {
          console.log(`[firecrawl-client.ts] Successfully mapped site ${siteUrl} (using .data for links), found ${dataLinks.length} URLs.`);
          return dataLinks;
        }
        console.warn(`[firecrawl-client.ts] mapUrl for ${siteUrl} succeeded but returned no link array in .links or .data:`, mapResponse);
        return []; 
      }
    } else {
      const errorMessage = (mapResponse as any).error || 'Unknown error during site mapping';
      console.error(`[firecrawl-client.ts] Failed to map site ${siteUrl}:`, errorMessage);
      return null; 
    }
  } catch (error) {
    console.error(`[firecrawl-client.ts] Exception during mapSite for ${siteUrl}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Firecrawl client mapSite error: ${errorMessage}`);
  }
}

/**
 * Scrape a single URL using Firecrawl
 */
export async function scrapeSingleUrl(urlToScrape: string): Promise<PageData | null> {
  if (!process.env.FIRECRAWL_API_KEY) {
    console.error('[firecrawl-client.ts] FIRECRAWL_API_KEY is not set. Cannot scrape URL.');
    return null;
  }
  console.log(`[firecrawl-client.ts] Attempting to scrape single URL: ${urlToScrape}`);
  try {
    const scrapeResult = await app.scrapeUrl(urlToScrape, {
      formats: ['markdown', 'html'],
    });

    // Assuming successful scrapeResult has markdown, html, metadata directly on the object
    if (scrapeResult.success) {
      const metadata = (scrapeResult as any).metadata || {};
      const sourceURL = metadata.sourceURL || urlToScrape;
      // Fallback to scrapeResult.data.title if direct title is not present (for SDK variations)
      const title = metadata.title || (scrapeResult as any).title || ((scrapeResult as any).data as any)?.title || '';
      const markdown = (scrapeResult as any).markdown || ((scrapeResult as any).data as any)?.markdown || '';
      const html = (scrapeResult as any).html || ((scrapeResult as any).data as any)?.html || '';
      const extractedStructuredData = (scrapeResult as any).extracted_content || 
                                    (scrapeResult as any).llm_extraction || 
                                    ((scrapeResult as any).data as any)?.extracted_content || 
                                    ((scrapeResult as any).data as any)?.llm_extraction || 
                                    (scrapeResult as any).json || 
                                    ((scrapeResult as any).data as any)?.json || null;

      const isDocument = /\.(pdf|docx?|xlsx?|pptx?|txt)$/i.test(sourceURL);
      const contentType = isDocument 
        ? sourceURL.split('.').pop()?.toLowerCase() 
        : (metadata?.contentType || 'html');

      // Ensure we have at least some content before considering it a success for our PageData
      if (!markdown && !html && !isDocument) {
        console.warn(`[firecrawl-client.ts] Scraped URL ${urlToScrape} successfully but no markdown/html content found and not a document. Result:`, scrapeResult);
        // Depending on strictness, could return null here.
        // For now, proceeding if metadata (like title) might still be useful.
      }

      console.log(`[firecrawl-client.ts] Successfully scraped URL: ${urlToScrape}`);
      const metrics = computePageMetrics(markdown, html);
      return {
        url: sourceURL,
        title: title,
        markdown: markdown,
        html: html,
        wordCount: metrics.wordCount,
        htmlSize: metrics.htmlSize,
        textToCodeRatio: metrics.textToCodeRatio,
        metadata: {
          title: metadata.title, // metadata.title is preferred
          description: metadata.description,
          language: metadata.language,
          sourceURL: sourceURL,
          statusCode: metadata.statusCode || ((scrapeResult as any).data as any)?.metadata?.statusCode, // Check within data as well
          ogTitle: metadata.ogTitle,
          ogDescription: metadata.ogDescription,
          ogUrl: metadata.ogUrl,
          ogImage: metadata.ogImage,
          ogLocaleAlternate: metadata.ogLocaleAlternate,
          ogSiteName: metadata.ogSiteName,
          structuredData: metadata.structuredData,
          contentType: contentType,
          isDocument: isDocument
        },
        extractedStructuredData: extractedStructuredData
      };
    } else {
      const errorDetails = (scrapeResult as any).error || 'Unknown error during scrapeUrl';
      console.error(`[firecrawl-client.ts] Failed to scrape URL ${urlToScrape}:`, errorDetails, scrapeResult);
      return null;
    }
  } catch (error) {
    console.error(`[firecrawl-client.ts] Exception during scrapeSingleUrl for ${urlToScrape}:`, error);
    return null;
  }
} 
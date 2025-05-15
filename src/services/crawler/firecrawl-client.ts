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
    maxDepth = 5, 
    includeInnerLinks = true,
    includeRobotsTxt = true,
    includeSitemap = true,
    includeDocuments = true
  } = options;
  
  console.log('Starting Firecrawl crawl with options:', JSON.stringify({
    siteUrl,
    maxPages,
    maxDepth,
    includeInnerLinks,
    includeRobotsTxt,
    includeSitemap,
    includeDocuments
  }));
  
  try {
    // Corrected parameters for app.crawlUrl
    const paramsForFirecrawl: any = {
      limit: maxPages,
      scrapeOptions: {
        formats: ['markdown', 'html'],
      },
      // Reverting to a flatter structure based on the latest error
      // but keeping the camelCase for now as per typical SDK conventions.
      // The API error will tell us if snake_case is strictly needed for these.
      depth: maxDepth,
      includeDocs: includeDocuments,
      followRobotsTxt: includeRobotsTxt,
      processSitemap: includeSitemap
    };

    // Log the exact parameters being sent
    console.log('Firecrawl app.crawlUrl PARAMS:', JSON.stringify(paramsForFirecrawl, null, 2));

    const crawlJob = await app.crawlUrl(siteUrl, paramsForFirecrawl);

    if (!crawlJob.success) {
      let errorDetails = '';
      if (crawlJob.error && typeof crawlJob.error === 'object') {
        errorDetails = JSON.stringify(crawlJob.error);
      } else if (crawlJob.error) {
        errorDetails = crawlJob.error;
      }
      console.error('Firecrawl crawl submission failed:', errorDetails);
      throw new Error(`Failed to submit Firecrawl crawl job: ${errorDetails}`);
    }

    console.log('Firecrawl crawl job submitted successfully with ID:', crawlJob.id);
    return crawlJob.id;

  } catch (error) {
    console.error('Error starting Firecrawl crawl:', error);
    // It's good practice to check if error.message exists
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to start Firecrawl crawl: ${errorMessage}`);
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
    // Use the client instance to check status
    const statusResult = await app.checkCrawlStatus(crawlId);

    if (!statusResult.success) {
      console.error('Firecrawl checkCrawlStatus failed:', statusResult.error);
      // Even if checking status fails, return an error status but don't crash
      return {
        status: 'error',
        progress: 0,
      };
    }
    
    const firecrawlStatus = statusResult.data; // Access data object

    // Calculate progress as a percentage
    const progress = firecrawlStatus.total > 0 
      ? Math.min(100, Math.round((firecrawlStatus.completed / firecrawlStatus.total) * 100)) 
      : 0;
    
    return {
      status: firecrawlStatus.status,
      progress,
      total: firecrawlStatus.total,
      completed: firecrawlStatus.completed
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
    // Use the client instance to get results. checkCrawlStatus returns data if completed.
    const result = await app.checkCrawlStatus(crawlId);

    if (!result.success) {
      console.error('Firecrawl getCrawlResults (via checkCrawlStatus) failed:', result.error);
      return [];
    }
    
    if (result.data.status !== 'completed') {
      console.log(`Crawl not completed yet. Status: ${result.data.status}`);
      return [];
    }
    
    // Format the data into our PageData interface
    const formattedData: PageData[] = result.data.data.map((page: any) => { // result.data.data is where page array is
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
  } catch (error) {
    console.error('Error getting crawl results:', error);
    return [];
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
import FirecrawlApp from '@mendable/firecrawl-js';

export interface EnhancedCrawlResult {
  success: boolean;
  data?: {
    content: string;
    markdown: string;
    html: string;
    metadata: Record<string, any>;
    screenshot?: string;
    links?: string[];
  };
  error?: string;
  method: 'firecrawl' | 'puppeteer' | 'fetch' | 'failed';
  retryCount: number;
  duration: number;
}

export interface CrawlOptions {
  includeHtml?: boolean;
  includeMarkdown?: boolean;
  includeMetadata?: boolean;
  includeScreenshot?: boolean;
  includeLinks?: boolean;
  timeout?: number;
  maxRetries?: number;
  waitFor?: number;
  userAgent?: string;
  extractMainContent?: boolean;
}

export class EnhancedFirecrawlClientV2 {
  private firecrawlClient: FirecrawlApp | null = null;
  private defaultOptions: CrawlOptions = {
    includeHtml: true,
    includeMarkdown: true,
    includeMetadata: true,
    includeScreenshot: false,
    includeLinks: true,
    timeout: 30000,
    maxRetries: 3,
    waitFor: 2000,
    extractMainContent: true
  };

  constructor() {
    if (process.env.FIRECRAWL_API_KEY) {
      try {
        this.firecrawlClient = new FirecrawlApp({ 
          apiKey: process.env.FIRECRAWL_API_KEY 
        });
      } catch (error) {
        console.warn('Failed to initialize Firecrawl client:', error);
      }
    } else {
      console.warn('FIRECRAWL_API_KEY not found, will use fallback methods');
    }
  }

  /**
   * Enhanced crawl with multiple fallback strategies
   */
  async crawlUrl(url: string, options: CrawlOptions = {}): Promise<EnhancedCrawlResult> {
    const startTime = Date.now();
    const finalOptions = { ...this.defaultOptions, ...options };
    
    console.log(`🕷️ Starting enhanced crawl for: ${url}`);
    
    let lastError: string = '';
    let retryCount = 0;
    
    // Strategy 1: Try Firecrawl API
    if (this.firecrawlClient) {
      const firecrawlResult = await this.tryFirecrawl(url, finalOptions, retryCount);
      if (firecrawlResult.success) {
        return {
          ...firecrawlResult,
          duration: Date.now() - startTime
        };
      }
      lastError = firecrawlResult.error || 'Firecrawl failed';
      retryCount = firecrawlResult.retryCount;
    }

    // Strategy 2: Try Puppeteer fallback
    console.log(`⚡ Firecrawl failed, trying Puppeteer fallback...`);
    const puppeteerResult = await this.tryPuppeteerFallback(url, finalOptions, retryCount);
    if (puppeteerResult.success) {
      return {
        ...puppeteerResult,
        duration: Date.now() - startTime
      };
    }
    lastError = puppeteerResult.error || 'Puppeteer failed';
    retryCount = puppeteerResult.retryCount;

    // Strategy 3: Try simple fetch fallback
    console.log(`📡 Puppeteer failed, trying fetch fallback...`);
    const fetchResult = await this.tryFetchFallback(url, finalOptions, retryCount);
    if (fetchResult.success) {
      return {
        ...fetchResult,
        duration: Date.now() - startTime
      };
    }

    // All strategies failed
    return {
      success: false,
      error: `All crawl strategies failed. Last error: ${lastError}`,
      method: 'failed',
      retryCount,
      duration: Date.now() - startTime
    };
  }

  /**
   * Try Firecrawl API with retry logic
   */
  private async tryFirecrawl(
    url: string, 
    options: CrawlOptions, 
    initialRetryCount: number
  ): Promise<Omit<EnhancedCrawlResult, 'duration'>> {
    let retryCount = initialRetryCount;
    let lastError = '';

    for (let attempt = 0; attempt < (options.maxRetries || 3); attempt++) {
      try {
        console.log(`🔥 Firecrawl attempt ${attempt + 1}/${options.maxRetries} for ${url}`);
        
        const crawlOptions = {
          includeHtml: options.includeHtml,
          includeMarkdown: options.includeMarkdown,
          screenshot: options.includeScreenshot,
          waitFor: options.waitFor,
          timeout: options.timeout,
          extractMainContent: options.extractMainContent
        };

        const response = await this.firecrawlClient!.scrapeUrl(url, crawlOptions);
        
        if (response.success && response.data) {
          console.log(`✅ Firecrawl success for ${url}`);
          
          return {
            success: true,
            data: {
              content: response.data.content || '',
              markdown: response.data.markdown || '',
              html: response.data.html || '',
              metadata: response.data.metadata || {},
              screenshot: response.data.screenshot,
              links: response.data.links || []
            },
            method: 'firecrawl',
            retryCount
          };
        } else {
          lastError = `Firecrawl returned unsuccessful response: ${JSON.stringify(response)}`;
        }
      } catch (error: any) {
        lastError = `Firecrawl error: ${error.message}`;
        console.warn(`❌ Firecrawl attempt ${attempt + 1} failed:`, error.message);
        
        // Check if it's a rate limit error
        if (error.message?.includes('rate limit') || error.status === 429) {
          const backoffDelay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Rate limited, waiting ${backoffDelay}ms before retry...`);
          await this.sleep(backoffDelay);
        }
      }
      
      retryCount++;
      
      // Wait before retry (except on last attempt)
      if (attempt < (options.maxRetries || 3) - 1) {
        await this.sleep(1000 * (attempt + 1)); // Progressive delay
      }
    }

    return {
      success: false,
      error: lastError,
      method: 'firecrawl',
      retryCount
    };
  }

  /**
   * Puppeteer fallback (requires puppeteer to be installed)
   */
  private async tryPuppeteerFallback(
    url: string, 
    options: CrawlOptions, 
    initialRetryCount: number
  ): Promise<Omit<EnhancedCrawlResult, 'duration'>> {
    try {
      // Dynamic import to avoid requiring puppeteer as a hard dependency
      const puppeteer = await import('puppeteer').catch(() => null);
      
      if (!puppeteer) {
        return {
          success: false,
          error: 'Puppeteer not available',
          method: 'puppeteer',
          retryCount: initialRetryCount
        };
      }

      const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      
      // Set user agent if provided
      if (options.userAgent) {
        await page.setUserAgent(options.userAgent);
      }
      
      // Set timeout
      page.setDefaultTimeout(options.timeout || 30000);
      
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: options.timeout 
      });
      
      // Wait for additional time if specified
      if (options.waitFor) {
        await page.waitForTimeout(options.waitFor);
      }
      
      // Extract content
      const content = await page.evaluate(() => {
        // Remove scripts and styles
        const scripts = document.querySelectorAll('script, style');
        scripts.forEach(el => el.remove());
        
        // Get main content
        const main = document.querySelector('main') || 
                    document.querySelector('[role="main"]') || 
                    document.body;
        
        return main?.innerText || document.body.innerText || '';
      });
      
      const html = await page.content();
      
      // Simple markdown conversion (basic)
      const markdown = this.htmlToBasicMarkdown(html);
      
      // Extract metadata
      const metadata = await page.evaluate(() => {
        const meta: Record<string, any> = {};
        
        // Title
        meta.title = document.title;
        
        // Meta tags
        const metaTags = document.querySelectorAll('meta');
        metaTags.forEach(tag => {
          const name = tag.getAttribute('name') || tag.getAttribute('property');
          const content = tag.getAttribute('content');
          if (name && content) {
            meta[name] = content;
          }
        });
        
        return meta;
      });
      
      // Extract links if requested
      let links: string[] = [];
      if (options.includeLinks) {
        links = await page.evaluate(() => {
          const linkElements = document.querySelectorAll('a[href]');
          return Array.from(linkElements).map(link => 
            (link as HTMLAnchorElement).href
          ).filter(href => href.startsWith('http'));
        });
      }
      
      await browser.close();
      
      console.log(`✅ Puppeteer success for ${url}`);
      
      return {
        success: true,
        data: {
          content,
          markdown,
          html,
          metadata,
          links
        },
        method: 'puppeteer',
        retryCount: initialRetryCount
      };
      
    } catch (error: any) {
      console.warn(`❌ Puppeteer failed for ${url}:`, error.message);
      
      return {
        success: false,
        error: `Puppeteer error: ${error.message}`,
        method: 'puppeteer',
        retryCount: initialRetryCount
      };
    }
  }

  /**
   * Simple fetch fallback
   */
  private async tryFetchFallback(
    url: string, 
    options: CrawlOptions, 
    initialRetryCount: number
  ): Promise<Omit<EnhancedCrawlResult, 'duration'>> {
    try {
      console.log(`📡 Trying fetch fallback for ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': options.userAgent || 'Mozilla/5.0 (compatible; AEO-Bot/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        signal: AbortSignal.timeout(options.timeout || 30000)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      const content = this.extractTextFromHtml(html);
      const markdown = this.htmlToBasicMarkdown(html);
      const metadata = this.extractMetadataFromHtml(html);
      
      console.log(`✅ Fetch success for ${url}`);
      
      return {
        success: true,
        data: {
          content,
          markdown,
          html,
          metadata,
          links: this.extractLinksFromHtml(html)
        },
        method: 'fetch',
        retryCount: initialRetryCount
      };
      
    } catch (error: any) {
      console.warn(`❌ Fetch failed for ${url}:`, error.message);
      
      return {
        success: false,
        error: `Fetch error: ${error.message}`,
        method: 'fetch',
        retryCount: initialRetryCount
      };
    }
  }

  /**
   * Extract text content from HTML
   */
  private extractTextFromHtml(html: string): string {
    // Remove scripts, styles, and comments
    const cleanHtml = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '');
    
    // Simple tag removal
    const text = cleanHtml
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return text;
  }

  /**
   * Basic HTML to Markdown conversion
   */
  private htmlToBasicMarkdown(html: string): string {
    return html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
  }

  /**
   * Extract metadata from HTML
   */
  private extractMetadataFromHtml(html: string): Record<string, any> {
    const metadata: Record<string, any> = {};
    
    // Title
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    if (titleMatch) {
      metadata.title = titleMatch[1].trim();
    }
    
    // Meta tags
    const metaMatches = html.matchAll(/<meta\s+([^>]+)>/gi);
    for (const match of metaMatches) {
      const attrs = match[1];
      const nameMatch = attrs.match(/(?:name|property)=["']([^"']+)["']/i);
      const contentMatch = attrs.match(/content=["']([^"']+)["']/i);
      
      if (nameMatch && contentMatch) {
        metadata[nameMatch[1]] = contentMatch[1];
      }
    }
    
    return metadata;
  }

  /**
   * Extract links from HTML
   */
  private extractLinksFromHtml(html: string): string[] {
    const links: string[] = [];
    const linkMatches = html.matchAll(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi);
    
    for (const match of linkMatches) {
      const href = match[1];
      if (href.startsWith('http')) {
        links.push(href);
      }
    }
    
    return [...new Set(links)]; // Remove duplicates
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<{
    firecrawl: boolean;
    puppeteer: boolean;
    fetch: boolean;
  }> {
    const testUrl = 'https://example.com';
    
    const results = {
      firecrawl: false,
      puppeteer: false,
      fetch: true // Fetch is always available
    };
    
    // Test Firecrawl
    if (this.firecrawlClient) {
      try {
        await this.firecrawlClient.scrapeUrl(testUrl, { timeout: 5000 });
        results.firecrawl = true;
      } catch {
        // Expected to fail, just testing if service is available
      }
    }
    
    // Test Puppeteer
    try {
      const puppeteer = await import('puppeteer').catch(() => null);
      results.puppeteer = !!puppeteer;
    } catch {
      results.puppeteer = false;
    }
    
    return results;
  }
} 
import { createServerClient } from '@supabase/ssr';
import { EnhancedFirecrawlClientV2 } from '../services/enhanced-firecrawl-client-v2';
import { ProjectUrl, ProjectUrlInsert } from '../types/database';

export interface ImportResult {
  success: boolean;
  total_urls: number;
  added_urls: number;
  skipped_urls: number;
  invalid_urls: number;
  errors: string[];
  added_url_ids: string[];
}

export interface PrioritizedUrl {
  url: string;
  priority: number; // 1-10
  reasoning: string;
  page_type: 'homepage' | 'product' | 'blog' | 'category' | 'support' | 'about' | 'other';
  estimated_importance: 'high' | 'medium' | 'low';
}

export interface SitemapDiscoveryResult {
  total_urls: number;
  urls: string[];
  errors: string[];
  method: 'firecrawl_map' | 'fallback_crawl';
  discovery_time_ms: number;
}

export interface CrawlDiscoveryResult {
  discovered_urls: string[];
  internal_links: number;
  external_links: number;
  depth_reached: number;
  errors: string[];
}

export class SiteMapper {
  private firecrawl: EnhancedFirecrawlClientV2;

  constructor() {
    this.firecrawl = new EnhancedFirecrawlClientV2();
  }

  /**
   * Discover URLs using Firecrawl's /map endpoint (much faster and more reliable)
   */
  async discoverFromSitemap(domain: string, options: {
    includeSubdomains?: boolean;
    sitemapOnly?: boolean;
    maxUrls?: number;
    searchFilter?: string;
  } = {}): Promise<SitemapDiscoveryResult> {
    const startTime = Date.now();
    console.log(`🗺️ Discovering URLs using Firecrawl /map for: ${domain}`);
    
    const result: SitemapDiscoveryResult = {
      total_urls: 0,
      urls: [],
      errors: [],
      method: 'firecrawl_map',
      discovery_time_ms: 0
    };

    try {
      // Use Firecrawl's map endpoint for fast URL discovery
      const mapResult = await this.mapDomainWithFirecrawl(domain, options);
      
      if (mapResult.success && mapResult.urls) {
        result.urls = mapResult.urls;
        result.total_urls = mapResult.urls.length;
        
        console.log(`✅ Firecrawl /map discovered ${result.total_urls} URLs in ${Date.now() - startTime}ms`);
      } else {
        result.errors.push(`Firecrawl /map failed: ${mapResult.error || 'Unknown error'}`);
        
        // Fallback to crawl-based discovery if map fails
        console.log(`⚡ Firecrawl /map failed, trying fallback crawl discovery...`);
        const fallbackResult = await this.crawlForDiscovery(`https://${domain}`, options.maxUrls || 50);
        
        result.urls = fallbackResult.discovered_urls;
        result.total_urls = fallbackResult.discovered_urls.length;
        result.method = 'fallback_crawl';
        result.errors.push(...fallbackResult.errors);
        
        console.log(`🔄 Fallback crawl discovered ${result.total_urls} URLs`);
      }
    } catch (error: any) {
      result.errors.push(`Discovery failed: ${error.message}`);
      console.error(`❌ URL discovery failed for ${domain}:`, error);
    }

    result.discovery_time_ms = Date.now() - startTime;
    console.log(`🗺️ URL discovery complete: ${result.total_urls} URLs found in ${result.discovery_time_ms}ms`);
    
    return result;
  }

  /**
   * Use Firecrawl's /map endpoint to discover URLs
   */
  private async mapDomainWithFirecrawl(domain: string, options: {
    includeSubdomains?: boolean;
    sitemapOnly?: boolean;
    maxUrls?: number;
    searchFilter?: string;
  }) {
    try {
      // Check if we have Firecrawl available
      if (!process.env.FIRECRAWL_API_KEY) {
        return {
          success: false,
          error: 'FIRECRAWL_API_KEY not configured'
        };
      }

                    // Import Firecrawl dynamically
        const FirecrawlApp = (await import('@mendable/firecrawl-js')).default;
      const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

      const url = `https://${domain}`;
      const mapParams: any = {
        limit: Math.min(options.maxUrls || 5000, 30000), // Firecrawl limit is 30k
        includeSubdomains: options.includeSubdomains || false,
        sitemapOnly: options.sitemapOnly || false,
        ignoreSitemap: options.sitemapOnly ? false : true // If sitemapOnly, don't ignore sitemap
      };

      // Add search filter if provided
      if (options.searchFilter) {
        mapParams.search = options.searchFilter;
      }

      console.log(`🔥 Calling Firecrawl /map with params:`, mapParams);
      
      const response = await app.mapUrl(url, mapParams);
      
      if (response.success && response.links) {
        // Filter URLs to ensure they belong to the domain
        const validUrls = response.links.filter((link: string) => {
          try {
            const urlObj = new URL(link);
            const linkDomain = urlObj.hostname.replace(/^www\./, '');
            const targetDomain = domain.replace(/^www\./, '');
            
            if (options.includeSubdomains) {
              return linkDomain === targetDomain || linkDomain.endsWith(`.${targetDomain}`);
            } else {
              return linkDomain === targetDomain;
            }
          } catch {
            return false;
          }
        });

        return {
          success: true,
          urls: validUrls,
          total: validUrls.length
        };
      } else {
        return {
          success: false,
          error: `Firecrawl /map returned unsuccessful response: ${JSON.stringify(response)}`
        };
      }
    } catch (error: any) {
      console.error('Firecrawl /map error:', error);
      return {
        success: false,
        error: `Firecrawl /map failed: ${error.message}`
      };
    }
  }

  /**
   * Bulk import URLs with validation and deduplication
   */
  async bulkImportUrls(
    urls: string[], 
    projectId: string, 
    supabase: any
  ): Promise<ImportResult> {
    console.log(`📥 Bulk importing ${urls.length} URLs for project ${projectId}`);
    
    const result: ImportResult = {
      success: false,
      total_urls: urls.length,
      added_urls: 0,
      skipped_urls: 0,
      invalid_urls: 0,
      errors: [],
      added_url_ids: []
    };

    // Get project to validate domain
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('root_domain')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      result.errors.push('Project not found');
      return result;
    }

    // Get existing URLs to avoid duplicates
    const { data: existingUrls } = await supabase
      .from('project_urls')
      .select('url')
      .eq('project_id', projectId);

    const existingUrlSet = new Set(existingUrls?.map((u: any) => u.url) || []);

    // Validate and prioritize URLs
    const validatedUrls = await this.validateAndPrioritize(urls, project.root_domain);
    
    // Process URLs in batches
    const batchSize = 50;
    for (let i = 0; i < validatedUrls.length; i += batchSize) {
      const batch = validatedUrls.slice(i, i + batchSize);
      
      const urlsToInsert: ProjectUrlInsert[] = [];
      
      for (const prioritizedUrl of batch) {
        // Skip if already exists
        if (existingUrlSet.has(prioritizedUrl.url)) {
          result.skipped_urls++;
          continue;
        }

        // Validate URL format and domain
        const validation = this.validateUrlForDomain(prioritizedUrl.url, project.root_domain);
        if (!validation.isValid) {
          result.invalid_urls++;
          result.errors.push(`Invalid URL ${prioritizedUrl.url}: ${validation.error}`);
          continue;
        }

        urlsToInsert.push({
          project_id: projectId,
          url: prioritizedUrl.url,
          priority: prioritizedUrl.priority,
          tags: [prioritizedUrl.page_type, prioritizedUrl.estimated_importance],
          next_analysis_at: new Date().toISOString()
        });
      }

      // Insert batch
      if (urlsToInsert.length > 0) {
        const { data: insertedUrls, error: insertError } = await supabase
          .from('project_urls')
          .insert(urlsToInsert)
          .select('id');

        if (insertError) {
          result.errors.push(`Batch insert error: ${insertError.message}`);
        } else {
          result.added_urls += insertedUrls?.length || 0;
          result.added_url_ids.push(...(insertedUrls?.map((u: any) => u.id) || []));
        }
      }
    }

    result.success = result.errors.length === 0 || result.added_urls > 0;
    
    console.log(`📥 Import complete: ${result.added_urls} added, ${result.skipped_urls} skipped, ${result.invalid_urls} invalid`);
    return result;
  }

  /**
   * Crawl site to discover URLs
   */
  async crawlForDiscovery(
    startUrl: string, 
    maxPages: number = 50
  ): Promise<CrawlDiscoveryResult> {
    console.log(`🕷️ Crawling ${startUrl} for URL discovery (max ${maxPages} pages)`);
    
    const result: CrawlDiscoveryResult = {
      discovered_urls: [],
      internal_links: 0,
      external_links: 0,
      depth_reached: 0,
      errors: []
    };

    try {
      const domain = new URL(startUrl).hostname;
      const discovered = new Set<string>();
      const queue = [{ url: startUrl, depth: 0 }];
      const processed = new Set<string>();

      while (queue.length > 0 && discovered.size < maxPages) {
        const { url, depth } = queue.shift()!;
        
        if (processed.has(url)) continue;
        processed.add(url);
        
        result.depth_reached = Math.max(result.depth_reached, depth);

        try {
          const crawlResult = await this.firecrawl.crawlUrl(url, {
            includeLinks: true,
            timeout: 15000
          });

          if (crawlResult.success && crawlResult.data?.links) {
            for (const link of crawlResult.data.links) {
              try {
                const linkUrl = new URL(link, url).href;
                const linkDomain = new URL(linkUrl).hostname;
                
                if (linkDomain === domain || linkDomain.endsWith('.' + domain)) {
                  result.internal_links++;
                  
                  if (!discovered.has(linkUrl) && depth < 3) { // Limit crawl depth
                    discovered.add(linkUrl);
                    queue.push({ url: linkUrl, depth: depth + 1 });
                  }
                } else {
                  result.external_links++;
                }
              } catch {
                // Invalid URL, skip
              }
            }
          }

        } catch (error: any) {
          result.errors.push(`Error crawling ${url}: ${error.message}`);
        }
      }

      result.discovered_urls = Array.from(discovered);
      
    } catch (error: any) {
      result.errors.push(`Crawl setup error: ${error.message}`);
    }

    console.log(`🕷️ Crawl complete: ${result.discovered_urls.length} URLs discovered`);
    return result;
  }

  /**
   * Validate and prioritize URLs based on importance
   */
  async validateAndPrioritize(urls: string[], rootDomain?: string): Promise<PrioritizedUrl[]> {
    const prioritized: PrioritizedUrl[] = [];

    for (const url of urls) {
      try {
        const urlObj = new URL(url);
        
        // Skip if domain doesn't match (when rootDomain provided)
        if (rootDomain) {
          const domain = urlObj.hostname;
          if (domain !== rootDomain && !domain.endsWith('.' + rootDomain)) {
            continue;
          }
        }

        const pathname = urlObj.pathname.toLowerCase();
        let priority = 5; // Default medium priority
        let pageType: PrioritizedUrl['page_type'] = 'other';
        let importance: PrioritizedUrl['estimated_importance'] = 'medium';
        let reasoning = 'Standard page';

        // Homepage
        if (pathname === '/' || pathname === '') {
          priority = 10;
          pageType = 'homepage';
          importance = 'high';
          reasoning = 'Homepage - critical for overall site impression';
        }
        // Product pages
        else if (/\/(product|item|p|shop)\/|\/products\//.test(pathname)) {
          priority = 9;
          pageType = 'product';
          importance = 'high';
          reasoning = 'Product page - directly drives conversions';
        }
        // Category/collection pages
        else if (/\/(category|collection|c|categories)\//.test(pathname)) {
          priority = 8;
          pageType = 'category';
          importance = 'high';
          reasoning = 'Category page - important for navigation and SEO';
        }
        // Blog posts
        else if (/\/(blog|article|post|news)\/|\/\d{4}\//.test(pathname)) {
          priority = 7;
          pageType = 'blog';
          importance = 'medium';
          reasoning = 'Content page - valuable for SEO and engagement';
        }
        // About/company pages
        else if (/\/(about|company|team|contact)/.test(pathname)) {
          priority = 6;
          pageType = 'about';
          importance = 'medium';
          reasoning = 'Company page - important for trust and credibility';
        }
        // Support/help pages
        else if (/\/(help|support|faq|documentation|docs)/.test(pathname)) {
          priority = 5;
          pageType = 'support';
          importance = 'medium';
          reasoning = 'Support page - helps with user experience';
        }
        // Deep nested pages (lower priority)
        else if ((pathname.match(/\//g) || []).length > 4) {
          priority = 3;
          importance = 'low';
          reasoning = 'Deep nested page - lower traffic potential';
        }
        // Query parameters (often lower priority)
        else if (urlObj.search.length > 0) {
          priority = 4;
          importance = 'low';
          reasoning = 'Parameterized URL - may be duplicate content';
        }

        prioritized.push({
          url,
          priority,
          reasoning,
          page_type: pageType,
          estimated_importance: importance
        });

      } catch (error) {
        // Invalid URL, skip
      }
    }

    // Sort by priority (highest first)
    return prioritized.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Validate URL format and domain match
   */
  private validateUrlForDomain(url: string, rootDomain: string): { isValid: boolean; error?: string } {
    try {
      const urlObj = new URL(url);
      
      // Check protocol
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { isValid: false, error: 'URL must use HTTP or HTTPS protocol' };
      }
      
      // Check domain
      const urlDomain = urlObj.hostname.toLowerCase();
      const root = rootDomain.toLowerCase();
      
      if (urlDomain !== root && !urlDomain.endsWith('.' + root)) {
        return { isValid: false, error: `URL domain must match or be a subdomain of ${rootDomain}` };
      }
      
      return { isValid: true };
      
    } catch (error) {
      return { isValid: false, error: 'Invalid URL format' };
    }
  }

  /**
   * Parse bulk URL input (one per line, with cleanup)
   */
  static parseBulkUrlInput(input: string): string[] {
    return input
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#')) // Remove empty lines and comments
      .map(line => {
        // Clean up common issues
        if (line.startsWith('http') || line.startsWith('//')) {
          return line;
        }
        // Add protocol if missing
        return `https://${line}`;
      })
      .filter((url, index, array) => array.indexOf(url) === index); // Remove duplicates
  }
} 
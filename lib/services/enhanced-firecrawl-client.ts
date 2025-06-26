import { JSDOM } from 'jsdom';

export interface EnhancedFirecrawlOptions {
  waitFor?: number;
  timeout?: number;
  onlyMainContent?: boolean;
}

export interface EnhancedPageData {
  url: string;
  html: string;
  markdown: string;
  content: string;
  metadata: {
    title: string;
    description: string;
    canonicalUrl?: string;
    statusCode: number;
    responseTime: number;
    htmlSize: number; // bytes
    domNodes: number; // DOM nodes count
    images: ImageInfo[];
    links: LinkInfo[];
    headings: HeadingInfo[];
    hasJsonLd: boolean;
  };
  success: boolean;
  error?: string;
}

export interface ImageInfo {
  src: string;
  alt: string;
  hasAlt: boolean;
  isDecorative: boolean; // alt="" or role="presentation"
}

export interface LinkInfo {
  href: string;
  text: string;
  isInternal: boolean;
  isExternal: boolean;
  isEEAT: boolean; // Links to authoritative sources
}

export interface HeadingInfo {
  level: number; // 1-6
  text: string;
  id?: string;
}

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const BASE_URL = 'https://api.firecrawl.dev/v0';

// EEAT domains for link analysis
const EEAT_DOMAINS = new Set([
  'wikipedia.org',
  'gov',
  'edu',
  'nih.gov',
  'cdc.gov',
  'who.int',
  'ieee.org',
  'acm.org',
  'nature.com',
  'science.org',
  'pubmed.ncbi.nlm.nih.gov',
  'scholar.google.com',
  'arxiv.org'
]);

export class EnhancedFirecrawlClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || FIRECRAWL_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('FIRECRAWL_API_KEY is required');
    }
  }

  /**
   * Enhanced scrape that captures additional metrics
   */
  async scrapeWithMetrics(url: string, options: EnhancedFirecrawlOptions = {}): Promise<EnhancedPageData> {
    const startTime = Date.now();
    
    try {
      console.log(`🔥 Enhanced Firecrawl scraping: ${url}`);
      
      // Call Firecrawl API
      const response = await fetch(`${BASE_URL}/scrape`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          formats: ['markdown', 'html'],
          onlyMainContent: options.onlyMainContent ?? true,
          waitFor: options.waitFor ?? 3000,
          timeout: options.timeout ?? 30000,
          includeTags: ['title', 'meta', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'a'],
          excludeTags: ['script', 'style', 'nav', 'footer', 'aside']
        })
      });

      if (!response.ok) {
        throw new Error(`Firecrawl API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      // Extract basic data
      const html = data.data?.html || '';
      const markdown = data.data?.markdown || '';
      const content = data.data?.content || '';
      const metadata = data.data?.metadata || {};

      // Enhanced analysis
      const enhancedMetrics = this.analyzePageMetrics(html, content, url);

      return {
        url,
        html,
        markdown,
        content,
        metadata: {
          title: metadata.title || '',
          description: metadata.description || '',
          canonicalUrl: metadata.canonicalUrl,
          statusCode: metadata.statusCode || 200,
          responseTime,
          htmlSize: Buffer.byteLength(html, 'utf8'),
          domNodes: enhancedMetrics.domNodes,
          images: enhancedMetrics.images,
          links: enhancedMetrics.links,
          headings: enhancedMetrics.headings,
          hasJsonLd: enhancedMetrics.hasJsonLd
        },
        success: true
      };

    } catch (error: any) {
      console.error(`❌ Enhanced Firecrawl error for ${url}:`, error.message);
      
      return {
        url,
        html: '',
        markdown: '',
        content: '',
        metadata: {
          title: '',
          description: '',
          statusCode: 0,
          responseTime: Date.now() - startTime,
          htmlSize: 0,
          domNodes: 0,
          images: [],
          links: [],
          headings: [],
          hasJsonLd: false
        },
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze page metrics from HTML
   */
  private analyzePageMetrics(html: string, content: string, baseUrl: string): {
    domNodes: number;
    images: ImageInfo[];
    links: LinkInfo[];
    headings: HeadingInfo[];
    hasJsonLd: boolean;
  } {
    if (!html) {
      return {
        domNodes: 0,
        images: [],
        links: [],
        headings: [],
        hasJsonLd: false
      };
    }

    try {
      // Parse HTML with JSDOM
      const dom = new JSDOM(html);
      const document = dom.window.document;
      const baseDomain = this.extractDomain(baseUrl);

      // Count DOM nodes
      const domNodes = this.countDOMNodes(document);

      // Analyze images
      const images = this.analyzeImages(document);

      // Analyze links
      const links = this.analyzeLinks(document, baseDomain);

      // Analyze headings
      const headings = this.analyzeHeadings(document);

      // Check for JSON-LD
      const hasJsonLd = this.hasJsonLdSchema(document);

      return {
        domNodes,
        images,
        links,
        headings,
        hasJsonLd
      };

    } catch (error) {
      console.warn('Error analyzing page metrics:', error);
      return {
        domNodes: 0,
        images: [],
        links: [],
        headings: [],
        hasJsonLd: false
      };
    }
  }

  /**
   * Count total DOM nodes
   */
  private countDOMNodes(document: Document): number {
    const walker = document.createTreeWalker(
      document.body || document.documentElement,
      1 // NodeFilter.SHOW_ELEMENT
    );

    let count = 0;
    while (walker.nextNode()) {
      count++;
    }
    return count;
  }

  /**
   * Analyze images for alt text and accessibility
   */
  private analyzeImages(document: Document): ImageInfo[] {
    const images = Array.from(document.querySelectorAll('img'));
    
    return images.map(img => {
      const alt = img.getAttribute('alt') || '';
      const role = img.getAttribute('role');
      
      return {
        src: img.getAttribute('src') || '',
        alt,
        hasAlt: alt.length > 0,
        isDecorative: alt === '' || role === 'presentation' || role === 'none'
      };
    });
  }

  /**
   * Analyze links for internal/external and EEAT classification
   */
  private analyzeLinks(document: Document, baseDomain: string): LinkInfo[] {
    const links = Array.from(document.querySelectorAll('a[href]'));
    
    return links.map(link => {
      const href = link.getAttribute('href') || '';
      const text = link.textContent?.trim() || '';
      const linkDomain = this.extractDomain(href);
      
      const isInternal = !href.startsWith('http') || linkDomain === baseDomain;
      const isExternal = !isInternal;
      const isEEAT = this.isEEATDomain(linkDomain);

      return {
        href,
        text,
        isInternal,
        isExternal,
        isEEAT
      };
    });
  }

  /**
   * Analyze heading structure
   */
  private analyzeHeadings(document: Document): HeadingInfo[] {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    
    return headings.map(heading => ({
      level: parseInt(heading.tagName.charAt(1)),
      text: heading.textContent?.trim() || '',
      id: heading.getAttribute('id') || undefined
    }));
  }

  /**
   * Check for JSON-LD structured data
   */
  private hasJsonLdSchema(document: Document): boolean {
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    return jsonLdScripts.length > 0;
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      if (!url.startsWith('http')) {
        return '';
      }
      const urlObj = new URL(url);
      return urlObj.hostname.toLowerCase();
    } catch {
      return '';
    }
  }

  /**
   * Check if domain is an EEAT authority
   */
  private isEEATDomain(domain: string): boolean {
    if (!domain) return false;
    
    // Check exact matches
    if (EEAT_DOMAINS.has(domain)) return true;
    
    // Check TLD matches (.gov, .edu)
    if (domain.endsWith('.gov') || domain.endsWith('.edu')) return true;
    
    // Check subdomain matches
    return Array.from(EEAT_DOMAINS).some(eeatDomain => 
      domain.endsWith(`.${eeatDomain}`)
    );
  }

  /**
   * Pre-flight check for URL accessibility
   */
  async preflightCheck(url: string): Promise<{ ok: boolean; error?: string; statusCode?: number }> {
    try {
      console.log(`🔍 Pre-flight check for: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Split-Audit-Bot/1.0 (+https://split.dev/bot)'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.status === 401 || response.status === 403) {
        return {
          ok: false,
          error: 'Authentication required - page behind login wall',
          statusCode: response.status
        };
      }

      if (response.status >= 400) {
        return {
          ok: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status
        };
      }

      return { ok: true, statusCode: response.status };

    } catch (error: any) {
      return {
        ok: false,
        error: `Network error: ${error.message}`
      };
    }
  }
}

// Export singleton instance
export const enhancedFirecrawl = new EnhancedFirecrawlClient(); 
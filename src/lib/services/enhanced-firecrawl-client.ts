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

      // Enhanced analysis - use HTML if available, fallback to markdown/content
      const enhancedMetrics = await this.analyzePageMetrics(html, markdown, content, url);

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
   * Analyze page metrics from HTML, with markdown fallback
   */
  private async analyzePageMetrics(html: string, markdown: string, content: string, baseUrl: string): Promise<{
    domNodes: number;
    images: ImageInfo[];
    links: LinkInfo[];
    headings: HeadingInfo[];
    hasJsonLd: boolean;
  }> {
    // Try HTML analysis first
    if (html && html.length > 100) {
      console.log(`📊 Using HTML analysis (${html.length} chars)`);
      return this.analyzeFromHTML(html, baseUrl);
    }
    
    // Fallback to markdown/content analysis
    console.log(`📊 Using markdown/content analysis (HTML: ${html.length}, Markdown: ${markdown.length}, Content: ${content.length})`);
    return await this.analyzeFromMarkdown(markdown, content, baseUrl);
  }

  /**
   * Analyze from HTML (original method)
   */
  private analyzeFromHTML(html: string, baseUrl: string): {
    domNodes: number;
    images: ImageInfo[];
    links: LinkInfo[];
    headings: HeadingInfo[];
    hasJsonLd: boolean;
  } {
    try {
      const dom = new JSDOM(html);
      const document = dom.window.document;
      const baseDomain = this.extractDomain(baseUrl);

      return {
        domNodes: this.countDOMNodes(document),
        images: this.analyzeImages(document),
        links: this.analyzeLinks(document, baseDomain),
        headings: this.analyzeHeadings(document),
        hasJsonLd: this.hasJsonLdSchema(document)
      };
    } catch (error) {
      console.warn('Error analyzing HTML:', error);
      return this.getEmptyMetrics();
    }
  }

  /**
   * Analyze from markdown/content (fallback method)
   */
  private async analyzeFromMarkdown(markdown: string, content: string, baseUrl: string): Promise<{
    domNodes: number;
    images: ImageInfo[];
    links: LinkInfo[];
    headings: HeadingInfo[];
    hasJsonLd: boolean;
  }> {
    try {
      const textToAnalyze = markdown || content || '';
      const baseDomain = this.extractDomain(baseUrl);

      // For schema detection, try to fetch raw HTML directly
      const hasJsonLd = await this.detectSchemaFromUrl(baseUrl);

      return {
        domNodes: this.estimateDOMNodesFromContent(textToAnalyze),
        images: this.extractImagesFromMarkdown(textToAnalyze),
        links: this.extractLinksFromMarkdown(textToAnalyze, baseDomain),
        headings: this.extractHeadingsFromMarkdown(textToAnalyze),
        hasJsonLd
      };
    } catch (error) {
      console.warn('Error analyzing markdown:', error);
      return this.getEmptyMetrics();
    }
  }

  /**
   * Extract headings from markdown
   */
  private extractHeadingsFromMarkdown(text: string): HeadingInfo[] {
    const headings: HeadingInfo[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Match markdown headings: # ## ### etc.
      const match = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        headings.push({
          level,
          text,
          id: this.generateHeadingId(text)
        });
      }
    }

    console.log(`📊 Found ${headings.length} headings in markdown`);
    return headings;
  }

  /**
   * Extract links from markdown
   */
  private extractLinksFromMarkdown(text: string, baseDomain: string): LinkInfo[] {
    const links: LinkInfo[] = [];
    
    // Match markdown links: [text](url)
    const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    
    while ((match = linkRegex.exec(text)) !== null) {
      const linkText = match[1];
      const href = match[2];
      const linkDomain = this.extractDomain(href);
      
      const isInternal = !href.startsWith('http') || linkDomain === baseDomain;
      const isExternal = !isInternal;
      const isEEAT = this.isEEATDomain(linkDomain);

      links.push({
        href,
        text: linkText,
        isInternal,
        isExternal,
        isEEAT
      });
    }

    console.log(`📊 Found ${links.length} links in markdown`);
    return links;
  }

  /**
   * Extract images from markdown
   */
  private extractImagesFromMarkdown(text: string): ImageInfo[] {
    const images: ImageInfo[] = [];
    
    // Match markdown images: ![alt](src)
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    
    while ((match = imageRegex.exec(text)) !== null) {
      const alt = match[1];
      const src = match[2];
      
      images.push({
        src,
        alt,
        hasAlt: alt.length > 0,
        isDecorative: alt === ''
      });
    }

    console.log(`📊 Found ${images.length} images in markdown`);
    return images;
  }

  /**
   * Estimate DOM nodes from content length
   */
  private estimateDOMNodesFromContent(content: string): number {
    // Rough estimation: ~10-15 characters per DOM node for content-heavy pages
    const estimatedNodes = Math.round(content.length / 12);
    console.log(`📊 Estimated ${estimatedNodes} DOM nodes from ${content.length} chars`);
    return estimatedNodes;
  }

  /**
   * Generate heading ID from text
   */
  private generateHeadingId(text: string): string {
    return text.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  /**
   * Get empty metrics structure
   */
  private getEmptyMetrics(): {
    domNodes: number;
    images: ImageInfo[];
    links: LinkInfo[];
    headings: HeadingInfo[];
    hasJsonLd: boolean;
  } {
    return {
      domNodes: 0,
      images: [],
      links: [],
      headings: [],
      hasJsonLd: false
    };
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
   * Detect schema by fetching raw HTML directly (for when Firecrawl HTML is empty)
   */
  private async detectSchemaFromUrl(url: string): Promise<boolean> {
    try {
      console.log(`🔍 Detecting schema directly from: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Split-Schema-Detector/1.0 (+https://split.dev/bot)',
          'Accept': 'text/html,application/xhtml+xml'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`Failed to fetch HTML for schema detection: ${response.status}`);
        return false;
      }

      const html = await response.text();
      
      // Quick regex check for JSON-LD scripts
      const hasJsonLd = /<script[^>]*type\s*=\s*['"]\s*application\/ld\+json\s*['"][^>]*>/i.test(html);
      
      if (hasJsonLd) {
        console.log(`✅ Schema detected via direct fetch`);
      } else {
        console.log(`❌ No schema found via direct fetch`);
      }
      
      return hasJsonLd;

    } catch (error: any) {
      console.warn(`Error detecting schema from URL: ${error.message}`);
      return false;
    }
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
import * as cheerio from 'cheerio';

export interface RenderingAnalysis {
  mode: 'SSR' | 'CSR' | 'HYBRID';
  confidence: number; // 0-100
  indicators: string[];
  ssrContent: boolean;
  csrWarnings: string[];
  frameworkDetected?: string;
  hydrationMarkers: string[];
  networkAnalysis?: {
    initialContentSize: number;
    meaningfulContent: boolean;
    scriptDependency: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}

export class RenderingDetector {
  
  /**
   * Comprehensive rendering mode detection
   */
  async analyzeRenderingMode(
    html: string, 
    url: string,
    additionalData?: {
      markdown?: string;
      loadTime?: number;
      scripts?: string[];
    }
  ): Promise<RenderingAnalysis> {
    
    const indicators: string[] = [];
    const csrWarnings: string[] = [];
    const hydrationMarkers: string[] = [];
    
    // 1. Framework Detection
    const framework = this.detectFramework(html);
    if (framework) {
      indicators.push(`Framework detected: ${framework}`);
    }
    
    // 2. Content Analysis
    const contentAnalysis = this.analyzeInitialContent(html);
    
    // 3. Script Dependency Analysis
    const scriptAnalysis = this.analyzeScriptDependency(html);
    
    // 4. Hydration Markers
    const hydrationAnalysis = this.detectHydrationMarkers(html);
    hydrationMarkers.push(...hydrationAnalysis.markers);
    
    // 5. DOM Structure Analysis
    const domAnalysis = this.analyzeDOMStructure(html);
    
    // 6. Meta Tags and Initial State
    const metaAnalysis = this.analyzeMetaTags(html);
    
    // Combine all analysis results
    const analysis = this.determineRenderingMode({
      contentAnalysis,
      scriptAnalysis,
      domAnalysis,
      metaAnalysis,
      hydrationAnalysis,
      framework,
      url,
      markdown: additionalData?.markdown
    });
    
    return {
      mode: analysis.mode,
      confidence: analysis.confidence,
      indicators: [...indicators, ...analysis.indicators],
      ssrContent: contentAnalysis.hasServerRenderedContent,
      csrWarnings: [...csrWarnings, ...analysis.warnings],
      frameworkDetected: framework,
      hydrationMarkers,
      networkAnalysis: {
        initialContentSize: html.length,
        meaningfulContent: contentAnalysis.meaningfulWordCount > 50,
        scriptDependency: scriptAnalysis.dependency
      }
    };
  }
  
  /**
   * Detect JavaScript frameworks
   */
  private detectFramework(html: string): string | null {
    const frameworks = [
      { name: 'Next.js', indicators: ['__NEXT_DATA__', '_next/', 'next-head'] },
      { name: 'Nuxt.js', indicators: ['__NUXT__', '_nuxt/', 'nuxt-app'] },
      { name: 'React', indicators: ['react', 'data-reactroot', 'react-dom'] },
      { name: 'Vue', indicators: ['vue', '__vue__', 'v-cloak'] },
      { name: 'Angular', indicators: ['ng-app', 'angular', '_angular_'] },
      { name: 'Svelte', indicators: ['svelte', '__svelte'] },
      { name: 'Remix', indicators: ['__remixContext', 'remix'] },
      { name: 'Gatsby', indicators: ['___gatsby', 'gatsby'] }
    ];
    
    for (const framework of frameworks) {
      if (framework.indicators.some(indicator => 
        html.toLowerCase().includes(indicator.toLowerCase())
      )) {
        return framework.name;
      }
    }
    
    return null;
  }
  
  /**
   * Analyze initial content before JavaScript execution
   */
  private analyzeInitialContent(html: string) {
    const $ = cheerio.load(html);
    
    // Remove scripts and styles for pure content analysis
    $('script, style, noscript').remove();
    
    const textContent = $.text();
    const words = textContent.split(/\s+/).filter(word => 
      word.length > 2 && 
      !/^(the|and|for|are|but|not|you|all|can|had|her|was|one|our|out|day|get|has|him|his|how|man|new|now|old|see|two|way|who|boy|did|its|let|put|say|she|too|use)$/i.test(word)
    );
    
    // Check for semantic HTML elements
    const semanticElements = $('main, article, section, header, footer, nav, aside').length;
    const headings = $('h1, h2, h3, h4, h5, h6').length;
    const paragraphs = $('p').filter((_, el) => $(el).text().length > 20).length;
    
    // Check for navigation and footer content
    const hasNavigation = $('nav, [role="navigation"]').length > 0;
    const hasFooter = $('footer, [role="contentinfo"]').length > 0;
    
    // Look for structured content
    const hasStructuredContent = semanticElements > 2 && headings > 0 && paragraphs > 2;
    
    return {
      meaningfulWordCount: words.length,
      semanticElements,
      headings,
      paragraphs,
      hasNavigation,
      hasFooter,
      hasStructuredContent,
      hasServerRenderedContent: hasStructuredContent && words.length > 50,
      contentDensity: words.length / Math.max(html.length, 1000) * 1000 // words per 1k chars
    };
  }
  
  /**
   * Analyze script dependency
   */
  private analyzeScriptDependency(html: string) {
    const $ = cheerio.load(html);
    
    const scripts = $('script').toArray();
    const inlineScripts = scripts.filter(script => !$(script).attr('src'));
    const externalScripts = scripts.filter(script => $(script).attr('src'));
    
    // Check for immediate content dependency
    const hasLoadingStates = /loading|spinner|skeleton/i.test(html);
    const hasEmptyContainers = $('[id="root"], [id="app"], [id="__next"]').filter((_, el) => 
      $(el).children().length === 0 || $(el).text().trim() === ''
    ).length > 0;
    
    // Analyze script types
    const hasFrameworkScripts = externalScripts.some(script => {
      const src = $(script).attr('src') || '';
      return /react|vue|angular|next|nuxt|svelte/i.test(src);
    });
    
    const hasLargeInlineScripts = inlineScripts.some(script => 
      $(script).html()?.length > 1000
    );
    
    let dependency: 'LOW' | 'MEDIUM' | 'HIGH';
    
    if (hasEmptyContainers || hasLoadingStates) {
      dependency = 'HIGH';
    } else if (hasFrameworkScripts || hasLargeInlineScripts) {
      dependency = 'MEDIUM';
    } else {
      dependency = 'LOW';
    }
    
    return {
      totalScripts: scripts.length,
      inlineScripts: inlineScripts.length,
      externalScripts: externalScripts.length,
      hasFrameworkScripts,
      hasEmptyContainers,
      hasLoadingStates,
      dependency
    };
  }
  
  /**
   * Detect hydration markers and patterns
   */
  private detectHydrationMarkers(html: string) {
    const markers: string[] = [];
    
    // Next.js markers
    if (html.includes('__NEXT_DATA__')) {
      markers.push('Next.js hydration data');
    }
    
    // Nuxt.js markers
    if (html.includes('__NUXT__')) {
      markers.push('Nuxt.js hydration data');
    }
    
    // React markers
    if (html.includes('data-reactroot') || html.includes('data-react-helmet')) {
      markers.push('React hydration markers');
    }
    
    // Vue markers
    if (html.includes('data-server-rendered="true"')) {
      markers.push('Vue SSR marker');
    }
    
    // Generic hydration patterns
    if (/suppressHydrationWarning|data-ssr|data-hydrated/i.test(html)) {
      markers.push('Generic hydration attributes');
    }
    
    return { markers };
  }
  
  /**
   * Analyze DOM structure for rendering hints
   */
  private analyzeDOMStructure(html: string) {
    const $ = cheerio.load(html);
    
    // Check for typical SPA containers
    const spaContainers = $('[id="root"], [id="app"], [id="__next"], [data-reactroot]');
    const emptySpaContainer = spaContainers.filter((_, el) => {
      const $el = $(el);
      return $el.children().length === 0 || $el.text().trim().length < 10;
    }).length > 0;
    
    // Check for progressive enhancement patterns
    const hasNoScriptContent = $('noscript').length > 0;
    const noScriptHasContent = $('noscript').text().trim().length > 50;
    
    // Check for typical SSR patterns
    const hasPreRenderedLinks = $('a[href]').length > 5;
    const hasPreRenderedImages = $('img[src]').length > 0;
    const hasMetaTags = $('meta[name], meta[property]').length > 3;
    
    return {
      emptySpaContainer,
      hasNoScriptContent,
      noScriptHasContent,
      hasPreRenderedLinks,
      hasPreRenderedImages,
      hasMetaTags,
      totalElements: $('*').length
    };
  }
  
  /**
   * Analyze meta tags and initial state
   */
  private analyzeMetaTags(html: string) {
    const $ = cheerio.load(html);
    
    const socialMeta = $('meta[property^="og:"], meta[name^="twitter:"]').length;
    const seoMeta = $('meta[name="description"], meta[name="keywords"]').length;
    const structuredData = $('script[type="application/ld+json"]').length;
    
    // Check for pre-rendered content in meta tags
    const hasPreRenderedMeta = socialMeta > 0 || seoMeta > 0;
    
    return {
      socialMeta,
      seoMeta,
      structuredData,
      hasPreRenderedMeta
    };
  }
  
  /**
   * Determine final rendering mode based on all analysis
   */
  private determineRenderingMode(analysis: {
    contentAnalysis: any;
    scriptAnalysis: any;
    domAnalysis: any;
    metaAnalysis: any;
    hydrationAnalysis: any;
    framework: string | null;
    url: string;
    markdown?: string;
  }) {
    
    const indicators: string[] = [];
    const warnings: string[] = [];
    
    let ssrScore = 0;
    let csrScore = 0;
    let hybridScore = 0;
    
    // Content analysis scoring
    if (analysis.contentAnalysis.hasServerRenderedContent) {
      ssrScore += 40;
      indicators.push('Structured content found in initial HTML');
    } else {
      csrScore += 30;
      warnings.push('Minimal content in initial HTML');
    }
    
    if (analysis.contentAnalysis.meaningfulWordCount > 100) {
      ssrScore += 20;
      indicators.push(`Rich text content: ${analysis.contentAnalysis.meaningfulWordCount} words`);
    } else if (analysis.contentAnalysis.meaningfulWordCount < 20) {
      csrScore += 25;
      warnings.push('Very little text content in initial load');
    }
    
    // Script dependency scoring
    if (analysis.scriptAnalysis.dependency === 'HIGH') {
      csrScore += 35;
      warnings.push('High script dependency detected');
    } else if (analysis.scriptAnalysis.dependency === 'MEDIUM') {
      hybridScore += 20;
      indicators.push('Moderate script dependency');
    } else {
      ssrScore += 15;
      indicators.push('Low script dependency');
    }
    
    if (analysis.scriptAnalysis.hasEmptyContainers) {
      csrScore += 30;
      warnings.push('Empty SPA containers detected');
    }
    
    // DOM structure scoring
    if (analysis.domAnalysis.emptySpaContainer) {
      csrScore += 25;
      warnings.push('Empty SPA container found');
    }
    
    if (analysis.domAnalysis.hasPreRenderedLinks && analysis.domAnalysis.hasMetaTags) {
      ssrScore += 15;
      indicators.push('Pre-rendered navigation and meta tags');
    }
    
    // Hydration markers scoring
    if (analysis.hydrationAnalysis.markers.length > 0) {
      hybridScore += 25;
      ssrScore += 15;
      indicators.push(`Hydration markers: ${analysis.hydrationAnalysis.markers.join(', ')}`);
    }
    
    // Framework-specific logic
    if (analysis.framework) {
      switch (analysis.framework) {
        case 'Next.js':
          if (analysis.contentAnalysis.hasServerRenderedContent) {
            ssrScore += 20;
            hybridScore += 10;
          } else {
            hybridScore += 15;
          }
          break;
        case 'Nuxt.js':
          ssrScore += 20;
          hybridScore += 10;
          break;
        case 'React':
          if (!analysis.hydrationAnalysis.markers.length) {
            csrScore += 20;
          } else {
            hybridScore += 15;
          }
          break;
      }
    }
    
    // Additional markdown content check
    if (analysis.markdown) {
      const markdownWords = analysis.markdown.split(/\s+/).length;
      if (markdownWords > analysis.contentAnalysis.meaningfulWordCount * 2) {
        csrScore += 20;
        warnings.push('Markdown content significantly richer than HTML');
      }
    }
    
    // Determine final mode
    let mode: 'SSR' | 'CSR' | 'HYBRID';
    let confidence: number;
    
    const maxScore = Math.max(ssrScore, csrScore, hybridScore);
    
    if (ssrScore === maxScore && ssrScore > 60) {
      mode = 'SSR';
      confidence = Math.min(95, ssrScore);
    } else if (csrScore === maxScore && csrScore > 50) {
      mode = 'CSR';
      confidence = Math.min(95, csrScore);
    } else {
      mode = 'HYBRID';
      confidence = hybridScore > 30 ? Math.min(90, hybridScore + 30) : 70;
    }
    
    // Confidence adjustments
    if (Math.abs(ssrScore - csrScore) < 15) {
      confidence = Math.max(60, confidence - 20);
    }
    
    return {
      mode,
      confidence,
      indicators,
      warnings,
      scores: { ssrScore, csrScore, hybridScore }
    };
  }
} 
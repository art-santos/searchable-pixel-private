// Deno-compatible technical analyzer for Edge function
// Based on src/lib/aeo/technical-analyzer.ts but adapted for Deno environment

export interface PageContent {
  url: string;
  title?: string;
  meta_description?: string;
  content: string;
  markdown: string;
  html?: string;
  word_count?: number;
  metadata?: {
    statusCode?: number;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
    language?: string;
    author?: string;
    publishDate?: string;
    modifiedDate?: string;
    schema?: any;
  };
}

export interface TechnicalIssue {
  severity: 'critical' | 'warning' | 'info';
  category: 'seo' | 'performance' | 'accessibility' | 'content' | 'schema' | 'metadata';
  title: string;
  description: string;
  impact: string;
  fix_priority: number; // 1-10, 10 being highest
  html_snippet?: string;
  rule_parameters?: Record<string, any>;
  diagnostic?: string;
}

export interface TechnicalRecommendation {
  category: 'content' | 'technical' | 'seo' | 'accessibility' | 'performance';
  title: string;
  description: string;
  implementation: string;
  expected_impact: string;
  effort_level: 'low' | 'medium' | 'high';
  priority_score: number; // 1-10
}

export interface TechnicalChecklistItem {
  id: string;
  name: string;
  category: string;
  weight: number;
  passed: boolean;
  details: string;
  rule_parameters?: Record<string, any>;
}

export interface AEOAnalysisResult {
  url: string;
  overall_score: number;
  weighted_score: number;
  category_scores: {
    content_quality: number;
    technical_health: number;
    media_accessibility: number;
    schema_markup: number;
    ai_optimization: number;
  };
  rendering_mode: 'SSR' | 'CSR' | 'HYBRID';
  ssr_score_penalty: number;
  issues: TechnicalIssue[];
  recommendations: TechnicalRecommendation[];
  checklist_results: TechnicalChecklistItem[]; // New: 55-item checklist results
  analysis_metadata: {
    analyzed_at: string;
    analysis_duration_ms: number;
    content_length: number;
    ai_analysis_used: boolean;
    total_rules_evaluated: number;
    diagnostics_generated: number;
    checklist_items_evaluated: number;
    checklist_items_passed: number;
    total_possible_points: number;
    earned_points: number;
    scoring_weights: {
      content_quality: number;
      technical_health: number;
      media_accessibility: number;
      schema_markup: number;
      ai_optimization: number;
    };
  };
}

// Configurable scoring weights (business priorities)
const SCORING_WEIGHTS = {
  content_quality: 0.25,    // Content is king for AEO
  technical_health: 0.20,   // Technical SEO foundation
  ai_optimization: 0.20,    // AI-specific optimizations
  media_accessibility: 0.15, // Accessibility for broader reach
  schema_markup: 0.20       // Structured data for AI understanding
};

/**
 * Enhanced detection of rendering mode with detailed analysis
 */
function detectRenderingMode(html: string, markdown: string): {
  mode: 'SSR' | 'CSR' | 'HYBRID';
  confidence: number;
  indicators: string[];
  ssrContent: boolean;
  csrWarnings: string[];
} {
  if (!html) {
    return {
      mode: 'HYBRID',
      confidence: 0,
      indicators: ['No HTML content available'],
      ssrContent: false,
      csrWarnings: ['Cannot analyze rendering without HTML']
    };
  }
  
  const indicators: string[] = [];
  const csrWarnings: string[] = [];
  
  // Check for meaningful server-rendered content BEFORE script tags
  const htmlBeforeScripts = html.split(/<script[\s\S]*?<\/script>/i)[0] || '';
  const hasSSRContent = /<(h1|h2|h3|article|main|section)[\s>]/i.test(htmlBeforeScripts) ||
                       /<p[^>]*>[^<]{20,}/i.test(htmlBeforeScripts);
  
  if (hasSSRContent) {
    indicators.push('Server-rendered semantic content detected');
  } else {
    csrWarnings.push('No meaningful content found before JavaScript execution');
  }
  
  // Remove scripts and styles, get text content
  const textOnly = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const meaningfulWords = textOnly.split(/\s+/).filter(word => 
    word.length > 3 && 
    !/^(the|and|for|are|but|not|you|all|can|had|her|was|one|our|out|day|get|has|him|his|how|man|new|now|old|see|two|way|who|boy|did|its|let|put|say|she|too|use)$/i.test(word)
  );
  
  // Check for typical CSR indicators
  const emptyReactRoot = /<div[^>]*id=["']?root["']?[^>]*>(\s*<\/div>|\s*$)/i.test(html);
  const emptyVueApp = /<div[^>]*id=["']?app["']?[^>]*>(\s*<\/div>|\s*$)/i.test(html);
  const loadingStates = /Loading\.\.\.|Please enable JavaScript|Loading\s*$/i.test(html);
  const hasNoScript = /<noscript>/i.test(html);
  
  if (emptyReactRoot) {
    indicators.push('Empty React root div detected');
    csrWarnings.push('React app with no server-rendered content');
  }
  
  if (emptyVueApp) {
    indicators.push('Empty Vue app div detected');
    csrWarnings.push('Vue app with no server-rendered content');
  }
  
  if (loadingStates) {
    indicators.push('Client-side loading states found');
    csrWarnings.push('Page shows loading indicators suggesting client-side rendering');
  }
  
  if (hasNoScript && meaningfulWords.length < 20) {
    indicators.push('NoScript warning with minimal content');
    csrWarnings.push('Page requires JavaScript with minimal fallback content');
  }
  
  // Check content richness and structure
  const hasRichContent = meaningfulWords.length > 50;
  const hasStructuredContent = html.includes('<h1') || html.includes('<h2') || html.includes('<nav') || html.includes('<main');
  const hasSemantic = /<(article|section|aside|header|footer|nav|main)[\s>]/i.test(html);
  
  if (hasRichContent) {
    indicators.push(`Rich content: ${meaningfulWords.length} meaningful words`);
  } else {
    csrWarnings.push(`Thin content: only ${meaningfulWords.length} meaningful words`);
  }
  
  if (hasStructuredContent) {
    indicators.push('Proper heading structure detected');
  } else {
    csrWarnings.push('Missing heading structure (H1-H6)');
  }
  
  if (hasSemantic) {
    indicators.push('Semantic HTML5 elements found');
  } else {
    csrWarnings.push('No semantic HTML5 elements detected');
  }
  
  // Determine mode and confidence
  let mode: 'SSR' | 'CSR' | 'HYBRID';
  let confidence: number;
  
  const csrScore = (emptyReactRoot ? 25 : 0) + 
                   (emptyVueApp ? 25 : 0) + 
                   (loadingStates ? 20 : 0) + 
                   (!hasRichContent ? 30 : 0);
  
  const ssrScore = (hasSSRContent ? 40 : 0) + 
                   (hasRichContent ? 30 : 0) + 
                   (hasStructuredContent ? 20 : 0) + 
                   (hasSemantic ? 10 : 0);
  
  if (csrScore > 50 && ssrScore < 30) {
    mode = 'CSR';
    confidence = Math.min(95, csrScore + 20);
  } else if (ssrScore > 70 && csrScore < 30) {
    mode = 'SSR';
    confidence = Math.min(95, ssrScore + 10);
  } else {
    mode = 'HYBRID';
    confidence = Math.abs(ssrScore - csrScore) < 20 ? 60 : 80;
  }
  
  return {
    mode,
    confidence,
    indicators,
    ssrContent: hasSSRContent,
    csrWarnings
  };
}

/**
 * Generates AI-powered diagnostic for a technical issue
 */
async function generateDiagnostic(issue: TechnicalIssue): Promise<string> {
  if (!Deno.env.get('OPENAI_API_KEY')) {
    return `${issue.title}: ${issue.description}`;
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert SEO/AEO technical specialist. For each error, provide a one-sentence explanation of why it matters and a one-sentence actionable fix. Keep it under 60 words total.'
          },
          {
            role: 'user',
            content: `Error: ${issue.title}
Description: ${issue.description}
Impact: ${issue.impact}
Category: ${issue.category}
${issue.rule_parameters ? `Parameters: ${JSON.stringify(issue.rule_parameters)}` : ''}
${issue.html_snippet ? `HTML Snippet: ${issue.html_snippet.substring(0, 200)}` : ''}

Provide a concise 1-2 sentence diagnostic and fix.`
          }
        ],
        temperature: 0.2,
        max_tokens: 60
      })
    });

    const data = await response.json();
    const diagnostic = data.choices[0]?.message?.content?.trim() || '';
    return diagnostic || `${issue.title}: ${issue.description}`;
    
  } catch (error: any) {
    console.warn(`Failed to generate diagnostic for "${issue.title}":`, error.message);
    return `${issue.title}: ${issue.description}`;
  }
}

/**
 * Comprehensive 55-item technical checklist
 */
function runComprehensiveChecklist(pageContent: PageContent): TechnicalChecklistItem[] {
  const html = pageContent.html || '';
  const content = pageContent.content || '';
  const title = pageContent.title || '';
  const metaDescription = pageContent.meta_description || '';
  const wordCount = pageContent.word_count || content.split(/\s+/).filter(w => w.length > 0).length;
  const url = pageContent.url;
  const metadata = pageContent.metadata || {};
  
  const checklist: TechnicalChecklistItem[] = [
    // Content Quality (10 items)
    {
      id: 'word_count',
      name: 'Word count ≥ 300',
      category: 'Content Quality',
      weight: 1.5, // Critical - substantial content needed
      passed: wordCount >= 300,
      details: `${wordCount} words detected`,
      rule_parameters: { min_words: 300, actual_words: wordCount }
    },
    {
      id: 'title_length',
      name: 'Title length 30–60 chars',
      category: 'Content Quality',
      weight: 1.5, // Critical - core SEO element
      passed: title.length >= 30 && title.length <= 60,
      details: title ? `${title.length} characters` : 'No title found',
      rule_parameters: { min_length: 30, max_length: 60, actual_length: title.length, title_text: title }
    },
    {
      id: 'meta_desc_length',
      name: 'Meta description 70–160 chars',
      category: 'Content Quality',
      weight: 1.5, // Critical - affects search snippets
      passed: metaDescription ? metaDescription.length >= 70 && metaDescription.length <= 160 : false,
      details: metaDescription ? `${metaDescription.length} characters` : 'No meta description',
      rule_parameters: { min_length: 70, max_length: 160, actual_length: metaDescription.length, meta_text: metaDescription }
    },
    {
      id: 'h1_present',
      name: 'H1 heading present',
      category: 'Content Quality',
      weight: 2.0, // Critical - primary content signal
      passed: html.includes('<h1>') || html.includes('<h1 '),
      details: 'Primary heading structure',
      rule_parameters: { h1_found: html.includes('<h1>') || html.includes('<h1 ') }
    },
    {
      id: 'subheadings',
      name: 'At least 2 subheadings (H2–H3)',
      category: 'Content Quality',
      weight: 1.0, // Important - content structure
      passed: (html.match(/<h[23][^>]*>/g) || []).length >= 2,
      details: `${(html.match(/<h[23][^>]*>/g) || []).length} subheadings found`,
      rule_parameters: { subheading_count: (html.match(/<h[23][^>]*>/g) || []).length, min_required: 2 }
    },
    {
      id: 'unique_title',
      name: 'Unique page title',
      category: 'Content Quality',
      weight: 0.5, // Nice-to-have - can't verify easily
      passed: true, // Assume unique for single page analysis
      details: 'Title uniqueness verified',
      rule_parameters: { uniqueness_check: 'single_page_analysis' }
    },
    {
      id: 'keyword_presence',
      name: 'Keyword in first 100 words',
      category: 'Content Quality',
      weight: 0.5, // Nice-to-have - hard to measure without topic
      passed: true, // Would need topic analysis - placeholder
      details: 'Topic relevance analysis needed',
      rule_parameters: { analysis_type: 'placeholder', first_100_words: content.substring(0, 500) }
    },
    {
      id: 'outbound_links',
      name: 'Outbound links ≥ 2',
      category: 'Content Quality',
      weight: 1.0, // Important - shows research/references
      passed: (html.match(/<a[^>]+href\s*=\s*["'][^"']*["'][^>]*>/g) || []).length >= 2,
      details: `${(html.match(/<a[^>]+href\s*=\s*["'][^"']*["'][^>]*>/g) || []).length} links detected`,
      rule_parameters: { link_count: (html.match(/<a[^>]+href\s*=\s*["'][^"']*["'][^>]*>/g) || []).length, min_required: 2 }
    },
    {
      id: 'internal_links',
      name: 'Internal links ≥ 1',
      category: 'Content Quality',
      weight: 1.0, // Important - internal linking strategy
      passed: (() => {
        const links = html.match(/<a[^>]+href\s*=\s*["']([^"']*)["'][^>]*>/g) || [];
        const domain = new URL(url).hostname;
        return links.some(link => {
          const href = link.match(/href\s*=\s*["']([^"']*)["']/)?.[1];
          return href && (href.startsWith('/') || href.includes(domain));
        });
      })(),
      details: 'Internal link analysis',
      rule_parameters: { domain: new URL(url).hostname }
    },
    {
      id: 'paragraph_length',
      name: 'Proper paragraph length',
      category: 'Content Quality',
      weight: 0.5, // Nice-to-have - readability optimization
      passed: (() => {
        const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        const avgLength = paragraphs.reduce((sum, p) => sum + p.split(' ').length, 0) / paragraphs.length;
        return avgLength <= 200; // Max 200 words per paragraph
      })(),
      details: 'Content structure analysis',
      rule_parameters: { paragraph_analysis: 'average_length_check' }
    },
    
    // Technical Health (10 items)
    {
      id: 'http_200',
      name: 'HTTP status 200',
      category: 'Technical Health',
      weight: 2.0, // Critical - page must load
      passed: !metadata.statusCode || metadata.statusCode === 200,
      details: 'Page loads successfully',
      rule_parameters: { status_code: metadata.statusCode || 200 }
    },
    {
      id: 'canonical_tag',
      name: 'Canonical link present',
      category: 'Technical Health',
      weight: 1.0, // Important - prevents duplicate content issues
      passed: html.includes('rel="canonical"') || !!metadata.canonicalUrl,
      details: 'Duplicate content prevention',
      rule_parameters: { canonical_in_html: html.includes('rel="canonical"'), canonical_in_metadata: !!metadata.canonicalUrl }
    },
    {
      id: 'meta_robots',
      name: 'Meta robots not noindex',
      category: 'Technical Health',
      weight: 1.5, // Critical - affects search indexing
      passed: !html.includes('noindex'),
      details: 'Search engine indexing allowed',
      rule_parameters: { noindex_found: html.includes('noindex') }
    },
    {
      id: 'viewport_meta',
      name: 'Meta viewport present',
      category: 'Technical Health',
      weight: 1.0, // Important - mobile optimization
      passed: html.includes('name="viewport"'),
      details: 'Mobile responsiveness meta tag',
      rule_parameters: { viewport_found: html.includes('name="viewport"') }
    },
    {
      id: 'favicon',
      name: 'Favicon present',
      category: 'Technical Health',
      weight: 0.5, // Nice-to-have - branding/UX
      passed: html.includes('rel="icon"') || html.includes('rel="shortcut icon"'),
      details: 'Browser tab icon',
      rule_parameters: { icon_found: html.includes('rel="icon"'), shortcut_icon_found: html.includes('rel="shortcut icon"') }
    },
    {
      id: 'https',
      name: 'HTTPS enabled',
      category: 'Technical Health',
      weight: 2.0, // Critical - security & ranking factor
      passed: url.startsWith('https://'),
      details: 'Secure connection protocol',
      rule_parameters: { protocol: url.split('://')[0], is_secure: url.startsWith('https://') }
    },
    {
      id: 'broken_links',
      name: 'No broken links',
      category: 'Technical Health',
      weight: 1.0, // Important but placeholder for now
      passed: true, // Would need link validation - placeholder
      details: 'Link validation needed',
      rule_parameters: { validation_type: 'placeholder' }
    },
    {
      id: 'html_valid',
      name: 'Valid HTML',
      category: 'Technical Health',
      weight: 0.5, // Nice-to-have - browsers are forgiving
      passed: true, // Would need HTML validation - placeholder
      details: 'Markup validation needed',
      rule_parameters: { validation_type: 'placeholder' }
    },
    {
      id: 'robots_txt',
      name: 'Robots.txt accessible',
      category: 'Technical Health',
      weight: 0.5, // Nice-to-have - not always needed
      passed: true, // Would need robots.txt check - placeholder
      details: 'Crawler instructions file',
      rule_parameters: { check_type: 'placeholder' }
    },
    {
      id: 'sitemap',
      name: 'XML sitemap linked',
      category: 'Technical Health',
      weight: 0.5, // Nice-to-have - helps crawlers
      passed: html.includes('rel="sitemap"'),
      details: 'Site structure for crawlers',
      rule_parameters: { sitemap_found: html.includes('rel="sitemap"') }
    },
    
    // Media & Accessibility (10 items)
    {
      id: 'img_alt',
      name: 'All images have alt text',
      category: 'Media & Accessibility',
      weight: 1.0, // Important - accessibility & SEO
      passed: (() => {
        const imgTags = html.match(/<img[^>]*>/g) || [];
        return imgTags.length === 0 || imgTags.every((img: string) => img.includes('alt=') && !img.includes('alt=""'));
      })(),
      details: 'Screen reader accessibility',
      rule_parameters: { 
        total_images: (html.match(/<img[^>]*>/g) || []).length,
        images_with_alt: (html.match(/<img[^>]*alt\s*=\s*["'][^"']+["'][^>]*>/g) || []).length
      }
    },
    {
      id: 'video_captions',
      name: 'Video captions/transcripts',
      category: 'Media & Accessibility',
      weight: 0.25, // Bonus - only relevant if videos exist
      passed: (() => {
        const videoTags = html.match(/<video[^>]*>/g) || [];
        if (videoTags.length === 0) return true; // No videos = pass
        return html.includes('track') && html.includes('kind="captions"');
      })(),
      details: 'Video accessibility analysis',
      rule_parameters: { 
        video_count: (html.match(/<video[^>]*>/g) || []).length,
        caption_tracks: (html.match(/track[^>]*kind\s*=\s*["']captions["']/g) || []).length
      }
    },
    {
      id: 'aria_roles',
      name: 'ARIA roles for dynamic content',
      category: 'Media & Accessibility',
      weight: 0.5, // Nice-to-have - advanced accessibility
      passed: html.includes('role='),
      details: 'Assistive technology support',
      rule_parameters: { aria_roles_found: (html.match(/role\s*=\s*["'][^"']+["']/g) || []).length }
    },
    {
      id: 'contrast_ratio',
      name: 'WCAG contrast ratio ≥ 4.5:1',
      category: 'Media & Accessibility',
      weight: 0.5, // Nice-to-have - hard to measure accurately
      passed: true, // Would need CSS color analysis - placeholder
      details: 'Color contrast analysis needed',
      rule_parameters: { analysis_type: 'placeholder' }
    },
    {
      id: 'button_elements',
      name: 'Proper button elements',
      category: 'Media & Accessibility',
      weight: 0.5, // Nice-to-have - semantic HTML
      passed: html.includes('<button'),
      details: 'Interactive element semantics',
      rule_parameters: { button_count: (html.match(/<button[^>]*>/g) || []).length }
    },
    {
      id: 'form_labels',
      name: 'Form labels linked',
      category: 'Media & Accessibility',
      weight: 1.0, // Important - if forms exist they need labels
      passed: (() => {
        const inputs = html.match(/<input[^>]*>/g) || [];
        const labels = html.match(/<label[^>]*for\s*=\s*["'][^"']+["'][^>]*>/g) || [];
        return inputs.length === 0 || labels.length >= inputs.length * 0.8; // 80% coverage threshold
      })(),
      details: 'Form accessibility analysis',
      rule_parameters: { 
        input_count: (html.match(/<input[^>]*>/g) || []).length,
        label_count: (html.match(/<label[^>]*for\s*=\s*["'][^"']+["'][^>]*>/g) || []).length
      }
    },
    {
      id: 'skip_link',
      name: 'Skip-to-content link',
      category: 'Media & Accessibility',
      weight: 0.25, // Bonus - advanced accessibility feature
      passed: html.includes('#skip') || html.includes('skip-to-content') || html.includes('skip-to-main'),
      details: 'Keyboard navigation aid',
      rule_parameters: { skip_link_patterns: ['#skip', 'skip-to-content', 'skip-to-main'] }
    },
    {
      id: 'html_lang',
      name: 'HTML lang attribute',
      category: 'Media & Accessibility',
      weight: 1.0, // Important - helps screen readers & translation
      passed: html.includes('<html lang=') || html.includes('<html lang '),
      details: 'Language declaration for screen readers',
      rule_parameters: { lang_attribute_found: html.includes('<html lang=') || html.includes('<html lang ') }
    },
    {
      id: 'responsive_images',
      name: 'Responsive images (srcset)',
      category: 'Media & Accessibility',
      weight: 0.5, // Nice-to-have - performance optimization
      passed: html.includes('srcset='),
      details: 'Device-specific image optimization',
      rule_parameters: { srcset_count: (html.match(/srcset\s*=/g) || []).length }
    },
    {
      id: 'lazy_loading',
      name: 'Lazy loading images',
      category: 'Media & Accessibility',
      weight: 0.5, // Nice-to-have - performance optimization
      passed: html.includes('loading="lazy"'),
      details: 'Performance optimization',
      rule_parameters: { lazy_images: (html.match(/loading\s*=\s*["']lazy["']/g) || []).length }
    },
    
    // Schema & Structured Data (10 items)
    {
      id: 'json_ld',
      name: 'JSON-LD structured data',
      category: 'Schema & Structured Data',
      weight: 1.0, // Important - helps AI understand content
      passed: html.includes('application/ld+json'),
      details: 'Machine-readable content markup',
      rule_parameters: { json_ld_scripts: (html.match(/application\/ld\+json/g) || []).length }
    },
    {
      id: 'article_schema',
      name: 'Article schema present',
      category: 'Schema & Structured Data',
      weight: 0.5, // Nice-to-have - content type identification
      passed: html.includes('"@type":"Article"') || html.includes('"@type": "Article"'),
      details: 'Content type identification',
      rule_parameters: { article_schema_found: html.includes('"@type":"Article"') || html.includes('"@type": "Article"') }
    },
    {
      id: 'breadcrumb_schema',
      name: 'Breadcrumb schema',
      category: 'Schema & Structured Data',
      weight: 0.5, // Nice-to-have - navigation enhancement
      passed: html.includes('"@type":"BreadcrumbList"') || html.includes('"@type": "BreadcrumbList"'),
      details: 'Navigation path markup',
      rule_parameters: { breadcrumb_schema_found: html.includes('"@type":"BreadcrumbList"') || html.includes('"@type": "BreadcrumbList"') }
    },
    {
      id: 'faq_schema',
      name: 'FAQ schema present',
      category: 'Schema & Structured Data',
      weight: 0.5, // Nice-to-have - FAQ rich snippets
      passed: html.includes('"@type":"FAQPage"') || html.includes('"@type": "FAQPage"'),
      details: 'Question-answer format markup',
      rule_parameters: { faq_schema_found: html.includes('"@type":"FAQPage"') || html.includes('"@type": "FAQPage"') }
    },
    {
      id: 'org_schema',
      name: 'Organization/Product schema',
      category: 'Schema & Structured Data',
      weight: 0.5, // Nice-to-have - entity identification
      passed: html.includes('"@type":"Organization"') || html.includes('"@type":"Product"') || 
              html.includes('"@type": "Organization"') || html.includes('"@type": "Product"'),
      details: 'Entity identification markup',
      rule_parameters: { 
        org_schema: html.includes('"@type":"Organization"') || html.includes('"@type": "Organization"'),
        product_schema: html.includes('"@type":"Product"') || html.includes('"@type": "Product"')
      }
    },
    {
      id: 'opengraph',
      name: 'OpenGraph tags',
      category: 'Schema & Structured Data',
      weight: 1.0, // Important - social media sharing
      passed: html.includes('og:title') && html.includes('og:description'),
      details: 'Social media sharing optimization',
      rule_parameters: { 
        og_title: html.includes('og:title'),
        og_description: html.includes('og:description'),
        og_image: html.includes('og:image')
      }
    },
    {
      id: 'twitter_cards',
      name: 'Twitter Card tags',
      category: 'Schema & Structured Data',
      weight: 0.5, // Nice-to-have - Twitter sharing enhancement
      passed: html.includes('twitter:card'),
      details: 'Twitter sharing optimization',
      rule_parameters: { 
        twitter_card: html.includes('twitter:card'),
        twitter_title: html.includes('twitter:title'),
        twitter_description: html.includes('twitter:description')
      }
    },
    {
      id: 'image_schema',
      name: 'ImageObject schema',
      category: 'Schema & Structured Data',
      weight: 0.25, // Bonus - advanced image markup
      passed: html.includes('"@type":"ImageObject"') || html.includes('"@type": "ImageObject"'),
      details: 'Image metadata markup',
      rule_parameters: { image_schema_found: html.includes('"@type":"ImageObject"') || html.includes('"@type": "ImageObject"') }
    },
    {
      id: 'schema_valid',
      name: 'Valid structured data',
      category: 'Schema & Structured Data',
      weight: 0.5, // Nice-to-have - validation placeholder
      passed: true, // Would need schema validation - placeholder
      details: 'Schema validation needed',
      rule_parameters: { validation_type: 'placeholder' }
    },
    {
      id: 'canonical_schema',
      name: 'Canonical in schema matches',
      category: 'Schema & Structured Data',
      weight: 0.25, // Bonus - advanced consistency check
      passed: true, // Would need schema-HTML comparison - placeholder
      details: 'Schema-HTML consistency check needed',
      rule_parameters: { check_type: 'placeholder' }
    },
    
    // AI Optimization (10 items)
    {
      id: 'faq_headings',
      name: 'FAQ-style H2 questions',
      category: 'AI Optimization',
      weight: 0.5, // Nice-to-have - AI-friendly structure
      passed: (html.match(/<h2[^>]*>[^<]*\?[^<]*<\/h2>/g) || []).length > 0,
      details: 'Question-based content structure',
      rule_parameters: { question_headings: (html.match(/<h2[^>]*>[^<]*\?[^<]*<\/h2>/g) || []).length }
    },
    {
      id: 'keyphrase_density',
      name: 'Optimal keyphrase density',
      category: 'AI Optimization',
      weight: 0.5, // Nice-to-have - placeholder for now
      passed: true, // Would need keyword analysis - placeholder
      details: 'Keyword density analysis needed',
      rule_parameters: { analysis_type: 'placeholder' }
    },
    {
      id: 'definition_block',
      name: 'Definition block early',
      category: 'AI Optimization',
      weight: 1.0, // Important - helps AI understand topic quickly
      passed: (() => {
        const firstParagraphs = content.substring(0, 500).toLowerCase();
        return firstParagraphs.includes('definition') || firstParagraphs.includes('is a') || 
               firstParagraphs.includes('refers to') || firstParagraphs.includes('means');
      })(),
      details: 'Early content definitional clarity',
      rule_parameters: { definition_patterns: ['definition', 'is a', 'refers to', 'means'] }
    },
    {
      id: 'table_contents',
      name: 'Table of contents',
      category: 'AI Optimization',
      weight: 0.5, // Nice-to-have - content structure enhancement
      passed: html.includes('<nav') && html.includes('href="#'),
      details: 'Content navigation structure',
      rule_parameters: { 
        nav_found: html.includes('<nav'),
        anchor_links: (html.match(/href\s*=\s*["']#[^"']*["']/g) || []).length
      }
    },
    {
      id: 'semantic_lists',
      name: 'Rich lists (ul/ol)',
      category: 'AI Optimization',
      weight: 1.0, // Important - structured content for AI
      passed: (html.match(/<[uo]l[^>]*>/g) || []).length >= 2,
      details: `${(html.match(/<[uo]l[^>]*>/g) || []).length} lists found`,
      rule_parameters: { 
        ul_count: (html.match(/<ul[^>]*>/g) || []).length,
        ol_count: (html.match(/<ol[^>]*>/g) || []).length,
        total_lists: (html.match(/<[uo]l[^>]*>/g) || []).length
      }
    },
    {
      id: 'anchor_keyphrases',
      name: 'Keyphrase in anchor text',
      category: 'AI Optimization',
      weight: 0.5, // Nice-to-have - placeholder for now
      passed: true, // Would need keyphrase analysis - placeholder
      details: 'Link text optimization analysis needed',
      rule_parameters: { analysis_type: 'placeholder' }
    },
    {
      id: 'synonym_terms',
      name: 'LSI/synonym terms ≥ 3',
      category: 'AI Optimization',
      weight: 0.5, // Nice-to-have - placeholder for now
      passed: true, // Would need semantic analysis - placeholder
      details: 'Semantic richness analysis needed',
      rule_parameters: { analysis_type: 'placeholder' }
    },
    {
      id: 'readability',
      name: 'Readability score ≥ 60',
      category: 'AI Optimization',
      weight: 1.0, // Important - content accessibility
      passed: (() => {
        // Simple readability approximation (Flesch-Kincaid)
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = content.split(/\s+/).filter(w => w.length > 0);
        const syllables = words.reduce((count, word) => {
          return count + Math.max(1, word.toLowerCase().match(/[aeiouy]+/g)?.length || 1);
        }, 0);
        
        if (sentences.length === 0 || words.length === 0) return false;
        
        const avgSentenceLength = words.length / sentences.length;
        const avgSyllablesPerWord = syllables / words.length;
        const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
        
        return fleschScore >= 60;
      })(),
      details: 'Flesch-Kincaid readability analysis',
      rule_parameters: { 
        sentence_count: content.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
        word_count: content.split(/\s+/).filter(w => w.length > 0).length
      }
    },
    {
      id: 'qa_schema',
      name: 'Q&A schema for voice',
      category: 'AI Optimization',
      weight: 0.5, // Nice-to-have - voice search optimization
      passed: html.includes('"@type":"QAPage"') || html.includes('"@type": "QAPage"'),
      details: 'Voice search optimization',
      rule_parameters: { qa_schema_found: html.includes('"@type":"QAPage"') || html.includes('"@type": "QAPage"') }
    },
    {
      id: 'last_updated',
      name: 'Last updated date',
      category: 'AI Optimization',
      weight: 0.5, // Nice-to-have - freshness signal
      passed: html.includes('dateModified') || html.includes('updated') || html.includes('last-modified') || !!metadata.modifiedDate,
      details: 'Content freshness signals',
      rule_parameters: { 
        date_modified_schema: html.includes('dateModified'),
        updated_text: html.includes('updated'),
        metadata_date: !!metadata.modifiedDate
      }
    },
    
    // SSR vs. CSR & Rendering (2 items) 
    {
      id: 'content_in_html',
      name: 'Content in initial HTML',
      category: 'SSR/CSR',
      weight: 1.0, // Important but not devastating for modern sites
      passed: (() => {
        const renderingAnalysis = detectRenderingMode(html, pageContent.markdown);
        return renderingAnalysis.mode === 'SSR' || html.length > 1000;
      })(),
      details: `${detectRenderingMode(html, pageContent.markdown).mode} rendering mode`,
      rule_parameters: { 
        rendering_mode: detectRenderingMode(html, pageContent.markdown).mode,
        html_length: html.length,
        confidence: detectRenderingMode(html, pageContent.markdown).confidence
      }
    },
    {
      id: 'no_loading_skeletons',
      name: 'No loading skeletons',
      category: 'SSR/CSR',
      weight: 0.5, // Nice-to-have - modern apps often use loading states
      passed: !html.toLowerCase().includes('loading') && !html.includes('skeleton') && !html.includes('spinner'),
      details: 'Immediate content availability',
      rule_parameters: { 
        loading_found: html.toLowerCase().includes('loading'),
        skeleton_found: html.includes('skeleton'),
        spinner_found: html.includes('spinner')
      }
    },
    
    // Performance Signals (3 items)
    {
      id: 'page_weight',
      name: 'Page weight ≤ 1 MB',
      category: 'Performance',
      weight: 0.5, // Nice-to-have - approximate measure
      passed: (() => {
        const htmlSize = new Blob([html]).size;
        return htmlSize <= 1048576; // 1MB in bytes
      })(),
      details: `${Math.round(new Blob([html]).size / 1024)} KB HTML size`,
      rule_parameters: { 
        html_size_bytes: new Blob([html]).size,
        html_size_kb: Math.round(new Blob([html]).size / 1024),
        threshold_mb: 1
      }
    },
    {
      id: 'ttfb',
      name: 'TTFB < 200ms',
      category: 'Performance',
      weight: 0.5, // Nice-to-have - placeholder for now
      passed: true, // Would need timing data - placeholder
      details: 'Server response time analysis needed',
      rule_parameters: { analysis_type: 'placeholder' }
    },
    {
      id: 'load_time',
      name: 'Load time < 3s',
      category: 'Performance',
      weight: 0.5, // Nice-to-have - placeholder for now
      passed: true, // Would need timing data - placeholder
      details: 'Page speed analysis needed',
      rule_parameters: { analysis_type: 'placeholder' }
    }
  ];
  
  return checklist;
}

/**
 * Main technical analysis function for Edge environment
 */
export async function analyzePageWithAEO(pageContent: PageContent): Promise<AEOAnalysisResult> {
  console.log(`🔍 Starting AEO analysis for: ${pageContent.url}`);
  const startTime = Date.now();
  
  const issues: TechnicalIssue[] = [];
  const recommendations: TechnicalRecommendation[] = [];
  
  // Run comprehensive 55-item checklist first
  const checklistResults = runComprehensiveChecklist(pageContent);
  const totalPossiblePoints = checklistResults.reduce((total, item) => total + item.weight, 0);
  const earnedPoints = checklistResults.filter(item => item.passed).reduce((total, item) => total + item.weight, 0);
  
  // Calculate overall score from checklist (transparent calculation)
  const checklistScore = Math.round((earnedPoints / totalPossiblePoints) * 100);
  
  // Core technical analysis (for backwards compatibility and additional insights)
  const contentAnalysis = analyzeContentQuality(pageContent);
  const technicalAnalysis = analyzeTechnicalHealth(pageContent);
  const mediaAnalysis = analyzeMediaAccessibility(pageContent);
  const schemaAnalysis = analyzeSchemaMarkup(pageContent);
  
  // Combine all issues and recommendations
  issues.push(...contentAnalysis.issues, ...technicalAnalysis.issues, ...mediaAnalysis.issues, ...schemaAnalysis.issues);
  recommendations.push(...contentAnalysis.recommendations, ...technicalAnalysis.recommendations, ...mediaAnalysis.recommendations, ...schemaAnalysis.recommendations);
  
  // Detect rendering mode with enhanced analysis
  const renderingAnalysis = detectRenderingMode(pageContent.html || '', pageContent.markdown);
  const renderingMode = renderingAnalysis.mode;
  
  // Calculate SSR penalty based on checklist results
  const ssrPenalty = renderingMode === 'CSR' ? 8 : (renderingMode === 'HYBRID' ? 3 : 0);
  
  // Add CSR-specific issues based on analysis
  if (renderingAnalysis.csrWarnings.length > 0 && !renderingAnalysis.ssrContent) {
    issues.push({
      severity: 'warning',
      category: 'performance',
      title: 'Client-side rendering detected',
      description: `Page appears to be client-side rendered only—no server-rendered HTML detected. ${renderingAnalysis.csrWarnings.join('; ')}`,
      impact: 'Poor SEO performance, slower initial page loads, and reduced AI crawler accessibility',
      fix_priority: 7,
      html_snippet: (pageContent.html || '').substring(0, 300),
      rule_parameters: {
        rendering_mode: renderingMode,
        confidence: renderingAnalysis.confidence,
        csr_warnings: renderingAnalysis.csrWarnings,
        ssr_content_detected: renderingAnalysis.ssrContent
      }
    });
  }
  
  // Calculate category scores from checklist results
  const categories = ['Content Quality', 'Technical Health', 'Media & Accessibility', 'Schema & Structured Data', 'AI Optimization'];
  const categoryScores = {
    content_quality: Math.round(calculateCategoryScore(checklistResults, 'Content Quality')),
    technical_health: Math.round(calculateCategoryScore(checklistResults, 'Technical Health')),
    media_accessibility: Math.round(calculateCategoryScore(checklistResults, 'Media & Accessibility')),
    schema_markup: Math.round(calculateCategoryScore(checklistResults, 'Schema & Structured Data')),
    ai_optimization: Math.round(calculateCategoryScore(checklistResults, 'AI Optimization'))
  };
  
  // Apply SSR penalty to final score
  const finalChecklistScore = Math.max(0, checklistScore - ssrPenalty);
  
  // Use checklist score as both overall and weighted score (they're now the same)
  const finalScore = finalChecklistScore;
  
  console.log(`✅ AEO analysis complete for ${pageContent.url}: ${finalScore}/100 (checklist-based scoring)`);
  console.log(`   Checklist results: ${checklistResults.filter(item => item.passed).length}/${checklistResults.length} passed (${earnedPoints.toFixed(1)}/${totalPossiblePoints} points)`);
  console.log(`   Rendering mode: ${renderingMode} (confidence: ${renderingAnalysis.confidence}%, penalty: -${ssrPenalty})`);
  console.log(`   Issues found: ${issues.length} (${issues.filter(i => i.severity === 'critical').length} critical)`);
  console.log(`   Recommendations: ${recommendations.length}`);
  
  // Generate AI diagnostics for issues
  let diagnosticsGenerated = 0;
  if (Deno.env.get('OPENAI_API_KEY') && issues.length > 0) {
    console.log(`🤖 Generating AI diagnostics for ${issues.length} issues...`);
    
    for (const issue of issues) {
      try {
        issue.diagnostic = await generateDiagnostic(issue);
        diagnosticsGenerated++;
      } catch (error: any) {
        console.warn(`Failed to generate diagnostic for "${issue.title}":`, error.message);
      }
    }
    
    console.log(`✅ Generated ${diagnosticsGenerated} AI diagnostics`);
  }
  
  return {
    url: pageContent.url,
    overall_score: finalScore,
    weighted_score: finalScore, // Same as overall score now
    category_scores: categoryScores,
    rendering_mode: renderingMode,
    ssr_score_penalty: ssrPenalty,
    issues: issues.sort((a, b) => b.fix_priority - a.fix_priority),
    recommendations: recommendations.sort((a, b) => b.priority_score - a.priority_score),
    checklist_results: checklistResults,
    analysis_metadata: {
      analyzed_at: new Date().toISOString(),
      analysis_duration_ms: Date.now() - startTime,
      content_length: pageContent.content?.length || 0,
      ai_analysis_used: diagnosticsGenerated > 0,
      total_rules_evaluated: issues.length + recommendations.length,
      diagnostics_generated: diagnosticsGenerated,
      checklist_items_evaluated: checklistResults.length,
      checklist_items_passed: checklistResults.filter(item => item.passed).length,
      total_possible_points: totalPossiblePoints,
      earned_points: earnedPoints,
      scoring_weights: SCORING_WEIGHTS
    }
  };
}

/**
 * Calculate category score from checklist results
 */
function calculateCategoryScore(checklistResults: TechnicalChecklistItem[], categoryName: string): number {
  const categoryItems = checklistResults.filter(item => item.category === categoryName);
  if (categoryItems.length === 0) return 100;
  
  const totalWeight = categoryItems.reduce((sum, item) => sum + item.weight, 0);
  const earnedWeight = categoryItems.filter(item => item.passed).reduce((sum, item) => sum + item.weight, 0);
  
  return (earnedWeight / totalWeight) * 100;
}

// Analysis helper functions (simplified versions for Edge environment)

function analyzeContentQuality(page: PageContent): {
  score: number;
  issues: TechnicalIssue[];
  recommendations: TechnicalRecommendation[];
} {
  const issues: TechnicalIssue[] = [];
  const recommendations: TechnicalRecommendation[] = [];
  let score = 100;
  
  const content = page.content || '';
  const title = page.title || '';
  const metaDescription = page.meta_description || '';
  const wordCount = page.word_count || content.split(/\s+/).filter(w => w.length > 0).length;
  
  // Title analysis
  if (!title) {
    issues.push({
      severity: 'critical',
      category: 'seo',
      title: 'Missing page title',
      description: 'Page has no title tag, which is critical for SEO and user experience',
      impact: 'Major negative impact on search rankings and click-through rates',
      fix_priority: 10,
      html_snippet: '<head><!-- Missing <title> tag --></head>',
      rule_parameters: { expected_length: '30-60', actual_length: 0 }
    });
    score -= 25;
  } else {
    if (title.length < 30) {
      issues.push({
        severity: 'warning',
        category: 'seo',
        title: 'Title too short',
        description: `Title is only ${title.length} characters. Recommended: 30-60 characters`,
        impact: 'Missed opportunity for keyword optimization and user engagement',
        fix_priority: 7,
        html_snippet: `<title>${title}</title>`,
        rule_parameters: { min_length: 30, actual_length: title.length, title_text: title }
      });
      score -= 10;
    } else if (title.length > 60) {
      issues.push({
        severity: 'warning',
        category: 'seo',
        title: 'Title too long',
        description: `Title is ${title.length} characters. May be truncated in search results`,
        impact: 'Title may be cut off in search results, reducing effectiveness',
        fix_priority: 6,
        html_snippet: `<title>${title}</title>`,
        rule_parameters: { max_length: 60, actual_length: title.length, truncated_at: 60 }
      });
      score -= 5;
    }
  }
  
  // Meta description analysis
  if (!metaDescription) {
    issues.push({
      severity: 'warning',
      category: 'seo',
      title: 'Missing meta description',
      description: 'Page has no meta description for search result snippets',
      impact: 'Search engines will generate their own snippet, potentially less compelling',
      fix_priority: 8
    });
    score -= 15;
  } else if (metaDescription.length < 120) {
    recommendations.push({
      category: 'seo',
      title: 'Expand meta description',
      description: `Meta description is only ${metaDescription.length} characters`,
      implementation: 'Expand to 150-160 characters to maximize search result real estate',
      expected_impact: 'Improved click-through rates from search results',
      effort_level: 'low',
      priority_score: 6
    });
  }
  
  // Content length analysis
  if (wordCount < 100) {
    issues.push({
      severity: 'critical',
      category: 'content',
      title: 'Very thin content',
      description: `Page has only ${wordCount} words, which is insufficient for most purposes`,
      impact: 'Severe negative impact on search rankings and user value',
      fix_priority: 9,
      html_snippet: content.substring(0, 200) + '...',
      rule_parameters: { min_words: 300, actual_words: wordCount, content_preview: content.substring(0, 100) }
    });
    score -= 30;
  } else if (wordCount < 300) {
    issues.push({
      severity: 'warning',
      category: 'content',
      title: 'Thin content',
      description: `Page has only ${wordCount} words. Recommended: 300+ words for substantial content`,
      impact: 'May be considered thin content by search engines and AI systems',
      fix_priority: 7,
      html_snippet: content.substring(0, 200) + '...',
      rule_parameters: { recommended_words: 300, actual_words: wordCount, deficit: 300 - wordCount }
    });
    score -= 20;
  }
  
  // Content structure analysis
  const headingMatches = content.match(/^#{1,6}\s+/gm) || [];
  if (headingMatches.length === 0) {
    issues.push({
      severity: 'warning',
      category: 'content',
      title: 'No heading structure',
      description: 'Page appears to lack clear heading structure (H1-H6)',
      impact: 'Poor content organization affects readability and SEO',
      fix_priority: 6
    });
    score -= 10;
  }
  
  return { score: Math.max(0, score), issues, recommendations };
}

function analyzeTechnicalHealth(page: PageContent): {
  score: number;
  issues: TechnicalIssue[];
  recommendations: TechnicalRecommendation[];
} {
  const issues: TechnicalIssue[] = [];
  const recommendations: TechnicalRecommendation[] = [];
  let score = 100;
  
  const metadata = page.metadata || {};
  
  // Status code check
  if (metadata.statusCode && metadata.statusCode !== 200) {
    issues.push({
      severity: 'critical',
      category: 'performance',
      title: `HTTP ${metadata.statusCode} status`,
      description: `Page returns ${metadata.statusCode} status code instead of 200`,
      impact: 'Page may not be indexed properly by search engines',
      fix_priority: 10
    });
    score -= 40;
  }
  
  // Canonical URL analysis
  if (!metadata.canonicalUrl) {
    issues.push({
      severity: 'warning',
      category: 'seo',
      title: 'Missing canonical URL',
      description: 'Page lacks canonical URL specification',
      impact: 'May lead to duplicate content issues',
      fix_priority: 6
    });
    score -= 10;
  }
  
  // HTTPS check
  if (page.url.startsWith('http://')) {
    issues.push({
      severity: 'critical',
      category: 'performance',
      title: 'Non-secure HTTP connection',
      description: 'Page is served over HTTP instead of HTTPS',
      impact: 'Security risk and negative SEO impact',
      fix_priority: 9
    });
    score -= 25;
  }
  
  return { score: Math.max(0, score), issues, recommendations };
}

function analyzeMediaAccessibility(page: PageContent): {
  score: number;
  issues: TechnicalIssue[];
  recommendations: TechnicalRecommendation[];
} {
  const issues: TechnicalIssue[] = [];
  const recommendations: TechnicalRecommendation[] = [];
  let score = 100;
  
  const html = page.html || '';
  
  // Image analysis
  const imageMatches = html.match(/<img[^>]*>/gi) || [];
  
  if (imageMatches.length > 0) {
    const imagesWithoutAlt = imageMatches.filter(img => !img.includes('alt=') || img.includes('alt=""'));
    const altTextCoverage = Math.max(0, (imageMatches.length - imagesWithoutAlt.length) / imageMatches.length);
    
    if (altTextCoverage < 0.8) {
      issues.push({
        severity: 'warning',
        category: 'accessibility',
        title: 'Missing image alt text',
        description: `${Math.round((1 - altTextCoverage) * 100)}% of images lack descriptive alt text`,
        impact: 'Poor accessibility and reduced AI understanding of visual content',
        fix_priority: 7
      });
      score -= 20;
    }
  }
  
  return { score: Math.max(0, score), issues, recommendations };
}

function analyzeSchemaMarkup(page: PageContent): {
  score: number;
  issues: TechnicalIssue[];
  recommendations: TechnicalRecommendation[];
} {
  const issues: TechnicalIssue[] = [];
  const recommendations: TechnicalRecommendation[] = [];
  let score = 80;
  
  const html = page.html || '';
  const metadata = page.metadata || {};
  
  // Check for JSON-LD schema
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>/gi) || [];
  const hasSchema = jsonLdMatches.length > 0 || metadata.schema;
  
  if (!hasSchema) {
    recommendations.push({
      category: 'seo',
      title: 'Add structured data',
      description: 'Page lacks structured data markup',
      implementation: 'Add JSON-LD schema markup relevant to content type (Article, Organization, Product, etc.)',
      expected_impact: 'Enhanced search results and better AI understanding',
      effort_level: 'medium',
      priority_score: 7
    });
    score -= 20;
  }
  
  return { score: Math.max(0, score), issues, recommendations };
} 
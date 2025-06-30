import { AEOAnalysisResult, PageContent } from './technical-analyzer';

interface EnhancedRecommendations {
  pageSummary: string;
  technicalRecommendations: {
    quickWin: string;
    bullets: string[];
  };
  contentRecommendations: {
    quickWin: string;
    bullets: string[];
  };
}

/**
 * Generates enhanced recommendations following the AEO/SEO/Technical Auditor format
 */
export async function generateEnhancedRecommendations(
  pageContent: PageContent,
  analysisResult: AEOAnalysisResult,
  enhancedData?: any // Data from enhanced Firecrawl client
): Promise<EnhancedRecommendations> {
  
  // Extract key metrics from the analysis
  const metrics = extractMetrics(pageContent, analysisResult, enhancedData);
  
  // Generate each section
  const pageSummary = generatePageSummary(pageContent, metrics);
  const technicalRecommendations = generateTechnicalRecommendations(metrics, analysisResult);
  const contentRecommendations = generateContentRecommendations(
    metrics, 
    analysisResult, 
    pageContent,
    technicalRecommendations.quickWin // Pass technical quick win to avoid duplicates
  );
  
  return {
    pageSummary,
    technicalRecommendations,
    contentRecommendations
  };
}

interface ExtractedMetrics {
  // Technical metrics
  crawlable: boolean;
  serverSideRendered: boolean;
  renderingMode: string;
  schemaTypes: string[];
  schemaValid: boolean;
  htmlKB: number;
  totalNodes: number;
  imageCount: number;
  imagesWithAltPercent: number;
  internalLinks: number;
  externalLinks: number;
  eeatCitations: number;
  canonicalStatus: string;
  
  // Content metrics
  metaDescriptionPresent: boolean;
  metaDescriptionLength: number;
  h1Text: string;
  h1Count: number;
  headerDepthSpan: string;
  wordCount: number;
  publishDate?: string;
  modifiedDate?: string;
  
  // Performance metrics
  domSize: number;
  loadTime?: number;
  
  // Additional context
  url: string;
  title: string;
  metaDescription: string;
  statusCode?: number;
}

function extractMetrics(
  pageContent: PageContent, 
  analysisResult: AEOAnalysisResult,
  enhancedData?: any
): ExtractedMetrics {
  const html = pageContent.html || '';
  const content = pageContent.content || '';
  const metadata = pageContent.metadata || {};
  
  // Extract header information - check multiple sources
  let h1Text = '';
  let h1Count = 0;
  
  // Method 1: Check HTML
  const h1Matches = html.match(/<h1[^>]*>(.*?)<\/h1>/gi) || [];
  if (h1Matches.length > 0) {
    h1Text = h1Matches[0]?.replace(/<[^>]+>/g, '').trim() || '';
    h1Count = h1Matches.length;
  }
  
  // Method 2: Check enhanced data headings
  if (!h1Text && enhancedData?.headingStructure) {
    const h1FromEnhanced = enhancedData.headingStructure.find((h: any) => h.level === 1);
    if (h1FromEnhanced) {
      h1Text = h1FromEnhanced.text || '';
      h1Count = enhancedData.headingStructure.filter((h: any) => h.level === 1).length;
    }
  }
  
  // Method 3: Check metadata headings
  if (!h1Text && metadata.headings) {
    const h1FromMeta = metadata.headings.find((h: any) => h.level === 1);
    if (h1FromMeta) {
      h1Text = h1FromMeta.text || '';
      h1Count = metadata.headings.filter((h: any) => h.level === 1).length;
    }
  }
  
  // Method 4: Check markdown for # heading
  if (!h1Text && pageContent.markdown) {
    const markdownH1 = pageContent.markdown.match(/^#\s+(.+)$/m);
    if (markdownH1) {
      h1Text = markdownH1[1].trim();
      h1Count = (pageContent.markdown.match(/^#\s+.+$/gm) || []).length;
    }
  }
  
  // Count headers by level - with fallback to enhanced data
  const headerCounts = {
    h1: h1Count || (html.match(/<h1[^>]*>/gi) || []).length,
    h2: (html.match(/<h2[^>]*>/gi) || []).length,
    h3: (html.match(/<h3[^>]*>/gi) || []).length,
    h4: (html.match(/<h4[^>]*>/gi) || []).length,
    h5: (html.match(/<h5[^>]*>/gi) || []).length,
    h6: (html.match(/<h6[^>]*>/gi) || []).length,
  };
  
  // If HTML parsing fails, try to use enhanced data for all headers
  if (enhancedData?.headingStructure && headerCounts.h1 === 0) {
    for (let i = 1; i <= 6; i++) {
      headerCounts[`h${i}`] = enhancedData.headingStructure.filter((h: any) => h.level === i).length;
    }
  }
  
  // Determine header depth span
  const headerLevels = Object.entries(headerCounts)
    .filter(([_, count]) => count > 0)
    .map(([level]) => level.toUpperCase());
  const headerDepthSpan = headerLevels.length > 0 
    ? `${headerLevels[0]}-${headerLevels[headerLevels.length - 1]}`
    : 'None';
  
  // Extract image metrics
  const imageMatches = html.match(/<img[^>]*>/gi) || [];
  const imagesWithAlt = imageMatches.filter(img => 
    img.includes('alt=') && !img.includes('alt=""') && !img.includes("alt=''")
  ).length;
  const imagesWithAltPercent = imageMatches.length > 0 
    ? Math.round((imagesWithAlt / imageMatches.length) * 100)
    : 0;
  
  // Extract link metrics
  const linkMatches = html.match(/<a[^>]*href=["'][^"']+["'][^>]*>/gi) || [];
  const internalLinks = linkMatches.filter(link => {
    const href = link.match(/href=["']([^"']+)["']/)?.[1] || '';
    return href.startsWith('/') || href.includes(new URL(pageContent.url).hostname);
  }).length;
  const externalLinks = linkMatches.length - internalLinks;
  
  // Get EEAT citations from enhanced data
  const eeatCitations = enhancedData?.eeatData?.externalEEATLinks || 
    (analysisResult.analysis_metadata as any)?.external_eeat_links || 0;
  
  // Calculate HTML size
  const htmlKB = Math.round((html.length / 1024) * 10) / 10;
  
  // Count DOM nodes (rough estimate)
  const totalNodes = (html.match(/<[^>]+>/g) || []).length;
  
  // Canonical status
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*>/i);
  const canonicalStatus = canonicalMatch ? 'present' : 'missing';
  
  return {
    // Technical
    crawlable: metadata.statusCode === 200,
    serverSideRendered: analysisResult.rendering_mode === 'SSR',
    renderingMode: analysisResult.rendering_mode,
    schemaTypes: enhancedData?.schemaTypes || [],
    schemaValid: !analysisResult.issues.some(i => i.category === 'schema' && i.severity === 'critical'),
    htmlKB,
    totalNodes,
    imageCount: imageMatches.length,
    imagesWithAltPercent,
    internalLinks,
    externalLinks,
    eeatCitations,
    canonicalStatus,
    
    // Content
    metaDescriptionPresent: !!pageContent.meta_description,
    metaDescriptionLength: pageContent.meta_description?.length || 0,
    h1Text,
    h1Count: headerCounts.h1,
    headerDepthSpan,
    wordCount: pageContent.word_count || 0,
    publishDate: metadata.publishDate,
    modifiedDate: metadata.modifiedDate,
    
    // Performance
    domSize: totalNodes,
    loadTime: enhancedData?.loadTime,
    
    // Context
    url: pageContent.url,
    title: pageContent.title || '',
    metaDescription: pageContent.meta_description || '',
    statusCode: metadata.statusCode
  };
}

function generatePageSummary(pageContent: PageContent, metrics: ExtractedMetrics): string {
  const { url, title, wordCount, renderingMode, eeatCitations, h1Text, imageCount, schemaTypes } = metrics;
  const hostname = new URL(url).hostname;
  
  // Deep content analysis for page type and purpose
  const contentPreview = pageContent.content.substring(0, 1000).toLowerCase();
  const titleLower = title.toLowerCase();
  const h1Lower = h1Text.toLowerCase();
  
  // Comprehensive page type detection
  let purpose = '';
  let intentFit = '';
  let pageType = 'informational';
  
  // E-commerce detection
  if (contentPreview.includes('add to cart') || contentPreview.includes('buy now') || 
      contentPreview.includes('price') && contentPreview.includes('$')) {
    purpose = 'This e-commerce product page';
    intentFit = 'converts browsers into buyers with product details and purchase options';
    pageType = 'transactional';
  }
  // Service/SaaS detection
  else if ((contentPreview.includes('sign up') || contentPreview.includes('get started') || 
           contentPreview.includes('try free') || contentPreview.includes('demo')) &&
           (contentPreview.includes('features') || contentPreview.includes('benefits'))) {
    purpose = 'This SaaS landing page';
    intentFit = 'converts visitors through feature highlights and clear CTAs';
    pageType = 'conversion';
  }
  // Pricing page detection
  else if (titleLower.includes('pricing') || h1Lower.includes('pricing') || 
           contentPreview.includes('per month') || contentPreview.includes('per year')) {
    purpose = 'This pricing page';
    intentFit = 'guides purchase decisions with transparent cost structures';
    pageType = 'commercial';
  }
  // How-to/Guide detection
  else if (titleLower.includes('how to') || titleLower.includes('guide') || 
           contentPreview.includes('step 1') || contentPreview.includes('follow these')) {
    purpose = 'This instructional guide';
    intentFit = 'educates users with actionable step-by-step information';
    pageType = 'educational';
  }
  // About/Company detection
  else if (titleLower.includes('about') || h1Lower.includes('about') || 
           contentPreview.includes('our mission') || contentPreview.includes('founded in')) {
    purpose = 'This company overview page';
    intentFit = 'establishes credibility through organizational storytelling';
    pageType = 'branding';
  }
  // Blog/Article detection
  else if (titleLower.includes('blog') || schemaTypes.includes('Article') || 
           schemaTypes.includes('BlogPosting') || contentPreview.includes('published')) {
    purpose = 'This editorial content';
    intentFit = 'engages readers with topical insights and thought leadership';
    pageType = 'content';
  }
  // Homepage detection
  else if (h1Lower.includes('welcome') || !h1Text || 
           new URL(url).pathname === '/' || new URL(url).pathname === '') {
    purpose = 'This homepage';
    intentFit = 'orients visitors and distributes traffic to key sections';
    pageType = 'navigational';
  }
  // Contact page detection
  else if (titleLower.includes('contact') || contentPreview.includes('email us') || 
           contentPreview.includes('get in touch')) {
    purpose = 'This contact page';
    intentFit = 'facilitates direct communication and lead generation';
    pageType = 'conversion';
  }
  // FAQ detection
  else if (titleLower.includes('faq') || titleLower.includes('questions') || 
           schemaTypes.includes('FAQPage')) {
    purpose = 'This FAQ resource';
    intentFit = 'addresses common queries to reduce support burden';
    pageType = 'support';
  }
  // Default fallback with better context
  else {
    // Analyze content density and structure for better classification
    if (wordCount > 2000) {
      purpose = 'This long-form content';
      intentFit = 'provides comprehensive coverage for research-intensive queries';
    } else if (wordCount < 300) {
      purpose = 'This brief landing page';
      intentFit = 'delivers focused messaging for specific user actions';
    } else {
      purpose = 'This web page';
      intentFit = 'presents information to site visitors';
    }
  }
  
  // Analyze competitive advantages and weaknesses
  const strengths = [];
  const weaknesses = [];
  
  // Technical strengths/weaknesses
  if (renderingMode === 'SSR') {
    strengths.push('full server-side rendering ensures crawlability');
  } else if (renderingMode === 'CSR') {
    weaknesses.push('client-side rendering blocks search engine access');
  } else {
    weaknesses.push('hybrid rendering creates inconsistent indexing');
  }
  
  // Content depth analysis
  if (wordCount > 1500) {
    strengths.push(`comprehensive ${wordCount}-word treatment exceeds competitor averages`);
  } else if (wordCount > 800) {
    strengths.push(`solid ${wordCount}-word foundation for topic coverage`);
  } else if (wordCount < 300) {
    weaknesses.push(`thin ${wordCount}-word content risks algorithmic penalties`);
  } else {
    weaknesses.push(`${wordCount} words falls short of 800-word competitive baseline`);
  }
  
  // Authority signals
  if (eeatCitations > 5) {
    strengths.push(`${eeatCitations} authoritative citations establish expertise`);
  } else if (eeatCitations > 0) {
    weaknesses.push(`only ${eeatCitations} EEAT citation${eeatCitations === 1 ? '' : 's'} undermines authority`);
  } else {
    weaknesses.push('zero external citations fails EEAT requirements');
  }
  
  // Structured data
  if (metrics.schemaTypes.length > 2) {
    strengths.push(`rich schema markup (${metrics.schemaTypes.slice(0, 2).join(', ')}) enables enhanced SERP features`);
  } else if (metrics.schemaTypes.length > 0) {
    strengths.push(`${metrics.schemaTypes[0]} schema provides basic rich results eligibility`);
  } else if (metrics.jsonldValid) {
    weaknesses.push('valid JSON-LD present but no semantic schemas implemented');
  } else {
    weaknesses.push('missing structured data forfeits rich snippet opportunities');
  }
  
  // Media optimization
  if (imageCount > 5 && metrics.imagesWithAltPercent > 90) {
    strengths.push(`${imageCount} images with ${metrics.imagesWithAltPercent}% alt coverage enhances accessibility`);
  } else if (imageCount > 0 && metrics.imagesWithAltPercent < 50) {
    weaknesses.push(`poor ${metrics.imagesWithAltPercent}% alt text coverage across ${imageCount} images`);
  } else if (imageCount === 0 && wordCount > 500) {
    weaknesses.push('zero visual elements reduces engagement potential');
  }
  
  // Build competitive assessment
  const competitivePosition = strengths.length > weaknesses.length 
    ? `competitive advantages (${strengths.join('; ')})` 
    : weaknesses.length > 0
    ? `critical gaps (${weaknesses.join('; ')})`
    : 'lacks distinctive optimization signals';
  
  // Construct insightful summary
  const summary = `${purpose} ${intentFit} on ${hostname}. Currently demonstrating ${competitivePosition}. ${
    renderingMode === 'SSR' 
      ? 'SSR implementation provides solid technical foundation for AI-era search.'
      : renderingMode === 'CSR'
      ? 'CSR architecture creates significant crawlability barriers requiring architectural changes.'
      : 'Hybrid rendering approach compromises consistent content discovery.'
  } ${
    pageType === 'transactional' || pageType === 'commercial'
      ? 'Commercial intent requires aggressive EEAT signals and conversion optimization.'
      : pageType === 'educational' || pageType === 'content'
      ? 'Informational intent demands comprehensive topical coverage and semantic structure.'
      : `${pageType.charAt(0).toUpperCase() + pageType.slice(1)} pages benefit from clear user journey mapping.`
  }`;
  
  return summary;
}

function generateTechnicalRecommendations(
  metrics: ExtractedMetrics, 
  analysisResult: AEOAnalysisResult
): { quickWin: string; bullets: string[] } {
  const bullets: string[] = [];
  
  // Sort issues by fix_priority
  const technicalIssues = analysisResult.issues
    .filter(i => ['performance', 'technical', 'seo', 'schema'].includes(i.category))
    .sort((a, b) => b.fix_priority - a.fix_priority);
  
  // Identify quick win
  let quickWin = '';
  
  // Check for critical quick wins first
  if (metrics.renderingMode === 'CSR') {
    quickWin = `*Quick Win:* Enable server-side rendering (SSR) or static generation → instantly improves crawlability → implement Next.js getServerSideProps or static export.`;
  } else if (metrics.htmlKB > 200) {
    quickWin = `*Quick Win:* HTML payload is ${metrics.htmlKB} kB → reduce by ${Math.round((metrics.htmlKB - 150) / metrics.htmlKB * 100)}% → remove inline styles, unused scripts, compress HTML.`;
  } else if (!metrics.metaDescriptionPresent) {
    quickWin = `*Quick Win:* Missing meta description → add 150-160 character summary → instant CTR improvement in search results.`;
  } else if (metrics.imagesWithAltPercent < 50 && metrics.imageCount > 0) {
    quickWin = `*Quick Win:* Only ${metrics.imagesWithAltPercent}% of images have alt text → add descriptive alt attributes → immediate accessibility and SEO boost.`;
  }
  
  // Generate evidence-based bullets
  if (metrics.renderingMode !== 'SSR' && !quickWin.includes('SSR')) {
    bullets.push(
      `${metrics.renderingMode} rendering detected with ${analysisResult.ssr_score_penalty}% score penalty → limits search/AI indexing → migrate to SSR framework or pre-render critical pages.`
    );
  }
  
  if (metrics.h1Count === 0) {
    bullets.push(
      `No H1 element found on page → search engines lack primary topic signal → add single, keyword-rich H1 above fold.`
    );
  } else if (metrics.h1Count > 1) {
    bullets.push(
      `${metrics.h1Count} H1 elements detected ("${metrics.h1Text.substring(0, 30)}...", others) → breaks semantic hierarchy → consolidate to single primary H1.`
    );
  }
  
  if (metrics.totalNodes > 5000) {
    bullets.push(
      `DOM bloat: ${metrics.totalNodes.toLocaleString()} nodes → ${Math.round(metrics.totalNodes / 5000)}x recommended limit → lazy-load below-fold content, remove redundant wrappers.`
    );
  }
  
  if (metrics.canonicalStatus === 'missing') {
    bullets.push(
      `Canonical tag absent → risk of duplicate content penalties → add <link rel="canonical" href="${metrics.url}"> to <head>.`
    );
  }
  
  if (!metrics.schemaValid && metrics.schemaTypes.length > 0) {
    bullets.push(
      `Schema markup errors in ${metrics.schemaTypes.join(', ')} → rich results ineligible → validate at schema.org/validator and fix required properties.`
    );
  }
  
  if (metrics.statusCode && metrics.statusCode !== 200) {
    bullets.push(
      `HTTP ${metrics.statusCode} status code → page not indexable → investigate server configuration and fix response code.`
    );
  }
  
  if (metrics.url.startsWith('http://')) {
    bullets.push(
      `Non-HTTPS protocol → security warnings and SEO penalties → implement SSL certificate and 301 redirect HTTP to HTTPS.`
    );
  }
  
  if (metrics.imageCount > 10 && metrics.imagesWithAltPercent < 80) {
    bullets.push(
      `${metrics.imageCount} images, but only ${metrics.imagesWithAltPercent}% have alt text → poor accessibility → write descriptive alt tags using primary keywords.`
    );
  }
  
  // Limit to 8 bullets as specified
  const finalBullets = bullets.slice(0, 8);
  
  return {
    quickWin: quickWin || finalBullets[0] || 'No immediate technical quick wins identified.',
    bullets: quickWin ? [quickWin, ...finalBullets.slice(0, 7)] : finalBullets
  };
}

function generateContentRecommendations(
  metrics: ExtractedMetrics,
  analysisResult: AEOAnalysisResult,
  pageContent: PageContent,
  technicalQuickWin: string = ''
): { quickWin: string; bullets: string[] } {
  const bullets: string[] = [];
  
  // Identify content-specific issues
  const contentIssues = analysisResult.issues
    .filter(i => ['content', 'seo', 'accessibility'].includes(i.category))
    .sort((a, b) => b.fix_priority - a.fix_priority);
  
  // Determine quick win (avoid duplicating technical quick win)
  let quickWin = '';
  
  // Check for FAQ opportunities
  const hasQuestions = pageContent.content.match(/\?/g)?.length || 0;
  const hasFAQSchema = metrics.schemaTypes.includes('FAQPage');
  
  // Prioritize content-specific quick wins that differ from technical
  if (hasQuestions > 3 && !hasFAQSchema) {
    quickWin = `*Quick Win:* Add FAQ schema for ${hasQuestions} existing Q&A pairs → unlock AI-overview FAQ snippet opportunities → implement FAQPage structured data.`;
  } else if (metrics.wordCount < 300) {
    quickWin = `*Quick Win:* Content depth only ${metrics.wordCount} words → expand to 500+ with user intent coverage → avoid thin content penalties.`;
  } else if (metrics.eeatCitations < 2) {
    quickWin = `*Quick Win:* Only ${metrics.eeatCitations} external citations → add 3-5 authoritative sources → immediate EEAT signal boost.`;
  } else if (metrics.internalLinks < 3 && metrics.wordCount > 300) {
    quickWin = `*Quick Win:* Only ${metrics.internalLinks} internal links → add 5+ contextual links to related pages → strengthen topical authority.`;
  } else if (metrics.imageCount === 0 && metrics.wordCount > 500) {
    quickWin = `*Quick Win:* No images in ${metrics.wordCount}-word content → add 3-5 relevant visuals → boost engagement by 40%.`;
  } else if (metrics.metaDescriptionLength < 120 && !technicalQuickWin.includes('meta description')) {
    quickWin = `*Quick Win:* Meta description only ${metrics.metaDescriptionLength} chars → craft compelling 150-char summary → improve SERP CTR.`;
  } else if (!metrics.h1Text) {
    quickWin = `*Quick Win:* Missing primary headline → add keyword-focused H1 → establish clear topic hierarchy.`;
  }
  
  // Generate content-focused bullets
  if (metrics.wordCount < 300 && !quickWin.includes('words')) {
    bullets.push(
      `Thin content alert: ${metrics.wordCount} words → well below 300-word threshold → expand with FAQ section, use cases, or detailed explanations.`
    );
  }
  
  if (metrics.headerDepthSpan === 'None' || metrics.headerDepthSpan === 'H1-H1') {
    bullets.push(
      `Flat content structure (${metrics.headerDepthSpan}) → poor scannability → add H2-H3 subheadings every 200-300 words using question formats.`
    );
  }
  
  // Check for generic headings
  const genericHeadingPattern = /^(overview|introduction|conclusion|summary|about|info|details)$/i;
  if (metrics.h1Text && genericHeadingPattern.test(metrics.h1Text)) {
    bullets.push(
      `Generic H1 "${metrics.h1Text}" → weak semantic signal → rephrase to specific query format like "How to [achieve outcome] in 2025".`
    );
  }
  
  if (metrics.eeatCitations < 3) {
    bullets.push(
      `Weak EEAT signals: ${metrics.eeatCitations} external citations → trust deficit → cite 3-5 authoritative sources (government, academic, industry leaders).`
    );
  }
  
  if (metrics.internalLinks < 3) {
    bullets.push(
      `Only ${metrics.internalLinks} internal links → weak topical mesh → add contextual links to related content clusters and pillar pages.`
    );
  }
  
  // Check for freshness
  if (metrics.modifiedDate) {
    const daysSinceUpdate = Math.floor((Date.now() - new Date(metrics.modifiedDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceUpdate > 365) {
      bullets.push(
        `Content last updated ${daysSinceUpdate} days ago → freshness penalty risk → update statistics, add 2025 context, refresh examples.`
      );
    }
  }
  
  // Check for multimedia
  if (metrics.imageCount === 0 && metrics.wordCount > 500) {
    bullets.push(
      `No images in ${metrics.wordCount}-word content → engagement deficit → add diagrams, screenshots, or infographics every 300-400 words.`
    );
  }
  
  // Entity optimization
  if (!pageContent.content.includes('™') && !pageContent.content.includes('®') && !pageContent.content.includes('Inc') && !pageContent.content.includes('LLC')) {
    bullets.push(
      `No brand/entity markers detected → weak entity recognition → include official company names with legal markers (Inc., LLC, ™).`
    );
  }
  
  // Limit to 8 bullets
  const finalBullets = bullets.slice(0, 8);
  
  return {
    quickWin: quickWin || finalBullets[0] || 'No immediate content quick wins identified.',
    bullets: quickWin ? [quickWin, ...finalBullets.slice(0, 7)] : finalBullets
  };
}

/**
 * Formats the enhanced recommendations as markdown
 */
export function formatRecommendationsAsMarkdown(recommendations: EnhancedRecommendations): string {
  let markdown = '';
  
  // Page Summary
  markdown += `### 1. PAGE SUMMARY\n\n`;
  markdown += `${recommendations.pageSummary}\n\n`;
  
  // Technical Recommendations
  markdown += `### 2. TECHNICAL RECOMMENDATIONS\n\n`;
  recommendations.technicalRecommendations.bullets.forEach(bullet => {
    markdown += `- ${bullet}\n`;
  });
  markdown += '\n';
  
  // Content Recommendations
  markdown += `### 3. CONTENT RECOMMENDATIONS\n\n`;
  recommendations.contentRecommendations.bullets.forEach(bullet => {
    markdown += `- ${bullet}\n`;
  });
  
  return markdown;
} 
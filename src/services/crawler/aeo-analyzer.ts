import { parse } from 'node-html-parser';
import { PageData } from './firecrawl-client';

export interface AEOAnalysisResult {
  url: string;
  title: string;
  statusCode: number;
  scores: {
    overall: number;
    llmsTxt: number;
    structuredData: number;
    contentStructure: number;
    semantics: number;
    mediaAccess: number;
    documentQuality?: number;
  };
  hasLlmsTxt: boolean;
  hasSchema: boolean;
  isMarkdownRendered: boolean;
  isDocument: boolean;
  documentType?: string;
  schemaTypes: string[];
  mediaCount: number;
  issues: AEOIssue[];
  recommendations: string[];
}

export interface AEOIssue {
  type: 'critical' | 'warning' | 'info';
  message: string;
  context?: string;
  url?: string;
  fixSuggestion?: string;
}

/**
 * Analyze a page for AEO (AI Engine Optimization)
 */
export function analyzePageForAEO(page: PageData, llmsTxtData?: any, robotsTxtData?: any): AEOAnalysisResult {
  let isDocument = page.metadata?.isDocument || false;
  let documentType = page.metadata?.contentType || null;
  let isMarkdownRendered = false;
  let contentStructure = null;
  let headingIssues: AEOIssue[] = [];
  let semantics: { score: number, issues: AEOIssue[] } = { score: 0, issues: [] };
  let mediaCount = 0;
  let schemaTypes = [];
  let mediaAccessibilityScore = 0;
  
  if (!isDocument) {
    const root = parse(page.html);
    
    isMarkdownRendered = checkIfMarkdownRendered(root);
    
    contentStructure = analyzeContentStructure(root);
    
    headingIssues = analyzeHeadingHierarchy(root);
    
    semantics = analyzeSemantics(root, page.title);
    
    mediaCount = countMediaElements(root);
    mediaAccessibilityScore = analyzeMediaAccessibility(root);
  } else {
    contentStructure = {
      h1Count: 0,
      h2Count: 0,
      h3Count: 0,
      paragraphCount: 0,
      listCount: 0,
      listItemCount: 0,
      hasTable: false,
      hasImages: false
    };
    
    if (page.markdown) {
      const headings = page.markdown.match(/^#\s+.+$/gm) || [];
      const subheadings = page.markdown.match(/^##\s+.+$/gm) || [];
      const paragraphs = page.markdown.split('\n\n').length;
      
      contentStructure.h1Count = headings.length;
      contentStructure.h2Count = subheadings.length;
      contentStructure.paragraphCount = paragraphs;
      
      contentStructure.hasTable = page.markdown.includes('|---') || page.markdown.includes('| ---');
      
      contentStructure.hasImages = page.markdown.includes('!');
      
      mediaCount = (page.markdown.match(/!\[.*?\]\(.*?\)/g) || []).length;
      
      isMarkdownRendered = true;
    }
  }
  
  const schemaData = page.metadata?.structuredData || [];
  const hasSchema = schemaData.length > 0;
  
  if (hasSchema) {
    schemaTypes = schemaData.map(schema => schema['@type'] || 'Unknown').filter(Boolean);
  }
  
  if (!hasSchema && !isDocument && page.html) {
    const jsonLdMatches = page.html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
    if (jsonLdMatches && jsonLdMatches.length > 0) {
      schemaTypes = ['DetectedInScript'];
    }
  }
  
  const hasRobotsTxtBlocksAI = robotsTxtData?.blocksAI || false;
  const llmsTxtScore = llmsTxtData?.exists ? 100 : 0;
  const hasLlmsTxt = !!llmsTxtData?.exists;
  
  const structuredDataScore = calculateStructuredDataScore(schemaData, schemaTypes);
  
  const contentStructureScore = isDocument 
    ? calculateDocumentStructureScore(page.markdown, contentStructure) 
    : calculateContentStructureScore(contentStructure, headingIssues);
  
  const semanticsScore = isDocument ? 70 : semantics.score;
  
  let documentQualityScore = null;
  if (isDocument) {
    documentQualityScore = calculateDocumentQualityScore(page);
  }
  
  const overallScore = Math.round(
    (llmsTxtScore * 0.25) +
    (structuredDataScore * 0.25) +
    (contentStructureScore * 0.25) +
    (semanticsScore * 0.15) +
    (mediaAccessibilityScore * 0.10)
  );
  
  const issues: AEOIssue[] = [
    ...(!hasLlmsTxt ? [{
      type: 'critical' as 'critical',
      message: 'No llms.txt file found',
      fixSuggestion: 'Create an llms.txt file in your root directory to specify AI crawler permissions'
    }] : []),
    ...(hasRobotsTxtBlocksAI ? [{
      type: 'critical' as 'critical',
      message: 'robots.txt blocks AI crawlers',
      url: `${new URL(page.url).origin}/robots.txt`,
      fixSuggestion: 'Update your robots.txt to allow AI crawlers like ChatGPT, Claude, etc.'
    }] : []),
    ...(!hasSchema && !isDocument ? [{
      type: 'warning' as 'warning',
      message: 'No structured data/schema found',
      fixSuggestion: 'Add structured data using schema.org JSON-LD format'
    }] : []),
    ...(isDocument && documentQualityScore && documentQualityScore < 50 ? [{
      type: 'warning' as 'warning',
      message: `Low-quality document format for AI consumption`,
      fixSuggestion: 'Convert document to a more accessible format or provide HTML/text alternatives'
    }] : []),
    ...headingIssues,
    ...semantics.issues
  ];
  
  if (mediaCount > 0 && mediaAccessibilityScore < 50) {
    issues.push({
      type: 'warning' as 'warning',
      message: 'Media elements lack proper accessibility for AI understanding',
      fixSuggestion: 'Add descriptive alt text to images and provide transcripts for audio/video'
    });
  }
  
  const recommendations = generateRecommendations(
    hasLlmsTxt, 
    hasSchema, 
    isMarkdownRendered, 
    headingIssues,
    isDocument,
    mediaAccessibilityScore
  );
  
  return {
    url: page.url,
    title: page.title,
    statusCode: page.metadata?.statusCode || 200,
    scores: {
      overall: overallScore,
      llmsTxt: llmsTxtScore,
      structuredData: structuredDataScore,
      contentStructure: contentStructureScore,
      semantics: semanticsScore,
      mediaAccess: mediaAccessibilityScore,
      documentQuality: documentQualityScore || undefined
    },
    hasLlmsTxt,
    hasSchema,
    isMarkdownRendered,
    isDocument,
    documentType: documentType || undefined,
    schemaTypes,
    mediaCount,
    issues,
    recommendations
  };
}

function calculateDocumentQualityScore(page: PageData): number {
  if (!page.metadata?.isDocument) return 0;
  
  const contentType = page.metadata?.contentType || '';
  let score = 50;
  
  switch (contentType.toLowerCase()) {
    case 'pdf':
      score += 20;
      if (page.markdown && page.markdown.length > 200) {
        score += 20;
      } else {
        score -= 20;
      }
      break;
    case 'txt':
      score += 40;
      break;
    case 'doc':
    case 'docx':
      score += 30;
      break;
    case 'ppt':
    case 'pptx':
      score += 10;
      break;
    case 'xls':
    case 'xlsx':
      score -= 10;
      break;
    default:
      score -= 20;
  }
  
  if (page.markdown) {
    if (page.markdown.length > 5000) {
      score += 10;
    } else if (page.markdown.length < 500) {
      score -= 10;
    }
  }
  
  return Math.max(0, Math.min(100, score));
}

function countMediaElements(root: any): number {
  const images = root.querySelectorAll('img').length;
  const videos = root.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length;
  const audio = root.querySelectorAll('audio').length;
  
  return images + videos + audio;
}

function analyzeMediaAccessibility(root: any): number {
  let score = 100;
  const images = root.querySelectorAll('img');
  const videos = root.querySelectorAll('video');
  const audios = root.querySelectorAll('audio');
  
  if (images.length > 0) {
    const imagesWithoutAlt = images.filter((img: any) => !img.getAttribute('alt') || img.getAttribute('alt').trim() === '');
    const imagesWithPoorAlt = images.filter((img: any) => {
      const alt = img.getAttribute('alt');
      return alt && (alt === img.getAttribute('src') || alt.length < 5);
    });
    
    if (images.length > 0) {
      const badAltRatio = (imagesWithoutAlt.length + imagesWithPoorAlt.length) / images.length;
      score -= Math.round(badAltRatio * 40);
    }
  }
  
  if (videos.length > 0) {
    const videosWithTracks = videos.filter((video: any) => video.querySelectorAll('track').length > 0);
    if (videos.length > 0 && videosWithTracks.length < videos.length) {
      score -= 20;
    }
  }
  
  if (audios.length > 0) {
    const hasNearbyTranscript = audios.some((audio: any) => {
      const parent = audio.parentNode;
      if (!parent) return false;
      const siblingDivs = parent.querySelectorAll('div');
      return siblingDivs.some((div: any) => 
        div.textContent.toLowerCase().includes('transcript') || 
        div.innerHTML.length > 200
      );
    });
    
    if (!hasNearbyTranscript) {
      score -= 20;
    }
  }
  
  return Math.max(0, score);
}

function checkIfMarkdownRendered(root: any): boolean {
  const hasFrontMatter = root.querySelector('code.language-yaml, code.language-frontmatter');
  const hasCodeBlocks = root.querySelectorAll('pre code').length > 0;
  const hasMarkedListItems = root.querySelectorAll('ul > li > p, ol > li > p').length > 0;
  
  return [hasFrontMatter, hasCodeBlocks, hasMarkedListItems].filter(Boolean).length >= 2;
}

function analyzeContentStructure(root: any): any {
  const h1Count = root.querySelectorAll('h1').length;
  const h2Count = root.querySelectorAll('h2').length;
  const h3Count = root.querySelectorAll('h3').length;
  const paragraphCount = root.querySelectorAll('p').length;
  const listCount = root.querySelectorAll('ul, ol').length;
  const listItemCount = root.querySelectorAll('li').length;
  const hasTable = root.querySelectorAll('table').length > 0;
  const hasImages = root.querySelectorAll('img').length > 0;
  
  return {
    h1Count,
    h2Count,
    h3Count,
    paragraphCount,
    listCount,
    listItemCount,
    hasTable,
    hasImages,
  };
}

function analyzeHeadingHierarchy(root: any): AEOIssue[] {
  const issues: AEOIssue[] = [];
  const h1Elements = root.querySelectorAll('h1');
  
  if (h1Elements.length === 0) {
    issues.push({
      type: 'warning',
      message: 'No H1 heading found - AI systems use this for main topic identification',
      fixSuggestion: 'Add an H1 heading that clearly identifies the main topic of the page'
    });
  } else if (h1Elements.length > 1) {
    issues.push({
      type: 'warning',
      message: 'Multiple H1 headings found - may confuse AI about the main topic',
      fixSuggestion: 'Use only one H1 heading per page to clearly define the main topic'
    });
  }
  
  const h2Elements = root.querySelectorAll('h2');
  const h3Elements = root.querySelectorAll('h3');
  
  if (h3Elements.length > 0 && h2Elements.length === 0) {
    issues.push({
      type: 'info',
      message: 'H3 headings are used without H2 headings - improper hierarchy may confuse AI',
      fixSuggestion: 'Ensure proper heading hierarchy: H1 > H2 > H3'
    });
  }
  
  return issues;
}

function analyzeSemantics(root: any, title: string): { score: number, issues: AEOIssue[] } {
  const issues: AEOIssue[] = [];
  let score = 100;
  
  const metaDescription = root.querySelector('meta[name="description"]');
  if (!metaDescription) {
    issues.push({
      type: 'warning',
      message: 'No meta description found - important for AI snippet generation',
      fixSuggestion: 'Add a meta description tag with a concise summary of the page content'
    });
    score -= 15;
  }
  
  const textContent = root.text.trim();
  if (textContent.length < 500) {
    issues.push({
      type: 'info',
      message: 'Content may be too short for comprehensive AI understanding',
      fixSuggestion: 'Expand content to provide more context and information'
    });
    score -= 10;
  }
  
  const hasFAQ = 
    root.querySelectorAll('dt, dd').length > 0 || 
    root.innerHTML.includes('FAQ') ||
    root.querySelectorAll('h2, h3, h4').some((el: any) => 
      el.text.toLowerCase().includes('faq') || 
      el.text.toLowerCase().includes('questions')
    );
  
  if (!hasFAQ) {
    issues.push({
      type: 'info',
      message: 'No FAQ section detected - FAQs are valuable for AI retrieval',
      fixSuggestion: 'Add an FAQ section to answer common questions about your content'
    });
    score -= 5;
  }
  
  const hasSemanticElements = 
    root.querySelectorAll('article, section, nav, aside, header, footer, main').length > 0;
  
  if (!hasSemanticElements) {
    issues.push({
      type: 'info',
      message: 'Limited use of semantic HTML5 elements for content structure',
      fixSuggestion: 'Use semantic elements like <article>, <section>, <header> to improve content structure'
    });
    score -= 10;
  }
  
  return { 
    score: Math.max(0, score), 
    issues 
  };
}

function calculateStructuredDataScore(schemas: any[], types: string[] = []): number {
  if (schemas.length === 0 && types.length === 0) return 0;
  if (types.includes('DetectedInScript')) return 70;
  
  let score = 50;
  
  const hasArticle = types.some(t => t === 'Article' || t === 'BlogPosting');
  const hasFAQ = types.some(t => t === 'FAQPage');
  const hasHowTo = types.some(t => t === 'HowTo');
  const hasBreadcrumb = types.some(t => t === 'BreadcrumbList');
  const hasProduct = types.some(t => t === 'Product');
  const hasOrganization = types.some(t => t === 'Organization');
  const hasPerson = types.some(t => t === 'Person');
  
  if (hasArticle) score += 15;
  if (hasFAQ) score += 15;
  if (hasHowTo) score += 10;
  if (hasBreadcrumb) score += 10;
  if (hasProduct) score += 10;
  if (hasOrganization) score += 5;
  if (hasPerson) score += 5;
  
  if (types.length > 2) {
    score += 10;
  }
  
  return Math.min(100, score);
}

function calculateContentStructureScore(structure: any, headingIssues: AEOIssue[]): number {
  let score = 100;
  
  score -= headingIssues.length * 15;
  
  if (structure.h2Count === 0 && structure.h3Count === 0) {
    score -= 30;
  }
  
  if (structure.listCount > 0) score += 10;
  if (structure.hasTable) score += 10;
  
  if (structure.hasImages) score += 5;
  
  return Math.max(0, Math.min(100, score));
}

function calculateDocumentStructureScore(markdown: string, structure: any): number {
  if (!markdown) return 30;
  
  let score = 70;
  
  if (structure.h1Count > 0) score += 10;
  if (structure.h2Count > 0) score += 10;
  
  if (markdown.includes('- ') || markdown.includes('* ') || markdown.includes('1. ')) {
    score += 10;
  }
  
  if (structure.hasTable) {
    score += 10;
  }
  
  if (structure.hasImages) {
    score += 5;
  }
  
  if (markdown.length > 2000) {
    score += 10;
  } else if (markdown.length < 500) {
    score -= 20;
  }
  
  return Math.max(0, Math.min(100, score));
}

function generateRecommendations(
  hasLlmsTxt: boolean, 
  hasSchema: boolean, 
  isMarkdownRendered: boolean,
  headingIssues: AEOIssue[],
  isDocument: boolean,
  mediaAccessScore: number
): string[] {
  const recommendations: string[] = [];
  
  if (!hasLlmsTxt) {
    recommendations.push(
      "Create a llms.txt file in your root directory listing the URLs you want AI to index"
    );
  }
  
  if (!hasSchema && !isDocument) {
    recommendations.push(
      "Add structured data using JSON-LD for better AI understanding of your content"
    );
  }
  
  if (!isMarkdownRendered && !isDocument) {
    recommendations.push(
      "Consider using Markdown for content to improve structure and readability for AI systems"
    );
  }
  
  if (headingIssues.length > 0) {
    recommendations.push(
      "Improve heading hierarchy with a single H1 and logical H2/H3 structure"
    );
  }
  
  if (isDocument) {
    recommendations.push(
      "Ensure document text is extractable and not just scanned images for better AI processing"
    );
  }
  
  if (mediaAccessScore < 60) {
    recommendations.push(
      "Add descriptive alt text to images and provide transcripts for audio/video content"
    );
  }
  
  return recommendations;
}

import { parse } from 'node-html-parser';
import { PageData } from './apify-client';

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
  };
  hasLlmsTxt: boolean;
  hasSchema: boolean;
  isMarkdownRendered: boolean;
  issues: AEOIssue[];
  recommendations: string[];
}

export interface AEOIssue {
  type: 'critical' | 'warning' | 'info';
  message: string;
  context?: string;
}

/**
 * Analyze a page for AEO (AI Engine Optimization)
 */
export function analyzePageForAEO(page: PageData, llmsTxtData?: any): AEOAnalysisResult {
  // Parse HTML
  const root = parse(page.html);
  
  // Check for common markdown-like structures
  const isMarkdownRendered = checkIfMarkdownRendered(root);
  
  // Check structured data
  const schemaData = page.metadata?.structuredData || [];
  const hasSchema = schemaData.length > 0;
  
  // Analyze content structure (headings, paragraphs, etc.)
  const contentStructure = analyzeContentStructure(root);
  
  // Analyze heading hierarchy
  const headingIssues = analyzeHeadingHierarchy(root);
  
  // Check semantics and completeness
  const semantics = analyzeSemantics(root, page.title);
  
  // LLMs.txt existence or references 
  const llmsTxtScore = llmsTxtData?.exists ? 100 : 0;
  const hasLlmsTxt = !!llmsTxtData?.exists;
  
  // Structured data score
  const structuredDataScore = calculateStructuredDataScore(schemaData);
  
  // Content structure score
  const contentStructureScore = calculateContentStructureScore(contentStructure, headingIssues);
  
  // Semantics score
  const semanticsScore = semantics.score;
  
  // Calculate overall score (weighted average)
  const overallScore = Math.round(
    (llmsTxtScore * 0.25) +
    (structuredDataScore * 0.25) +
    (contentStructureScore * 0.30) +
    (semanticsScore * 0.20)
  );
  
  // Collect issues
  const issues: AEOIssue[] = [
    ...(!hasLlmsTxt ? [{ type: 'critical', message: 'No llms.txt file found' }] : []),
    ...(!hasSchema ? [{ type: 'warning', message: 'No structured data/schema found' }] : []),
    ...headingIssues,
    ...semantics.issues
  ];
  
  // Generate recommendations
  const recommendations = generateRecommendations(hasLlmsTxt, hasSchema, isMarkdownRendered, headingIssues);
  
  return {
    url: page.url,
    title: page.title,
    statusCode: page.statusCode,
    scores: {
      overall: overallScore,
      llmsTxt: llmsTxtScore,
      structuredData: structuredDataScore,
      contentStructure: contentStructureScore,
      semantics: semanticsScore,
    },
    hasLlmsTxt,
    hasSchema,
    isMarkdownRendered,
    issues,
    recommendations
  };
}

/**
 * Check if content appears to be rendered from markdown
 */
function checkIfMarkdownRendered(root: any): boolean {
  // Check for features that suggest markdown-rendered content
  const hasFrontMatter = root.querySelector('code.language-yaml, code.language-frontmatter');
  const hasCodeBlocks = root.querySelectorAll('pre code').length > 0;
  const hasMarkedListItems = root.querySelectorAll('ul > li > p, ol > li > p').length > 0;
  
  // Simple heuristic: if 2+ markdown features are found, it's likely markdown
  return [hasFrontMatter, hasCodeBlocks, hasMarkedListItems].filter(Boolean).length >= 2;
}

/**
 * Analyze content structure (headings, paragraphs, lists)
 */
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

/**
 * Analyze heading hierarchy for proper structure
 */
function analyzeHeadingHierarchy(root: any): AEOIssue[] {
  const issues: AEOIssue[] = [];
  const h1Elements = root.querySelectorAll('h1');
  
  if (h1Elements.length === 0) {
    issues.push({
      type: 'warning',
      message: 'No H1 heading found - AI systems use this for main topic identification'
    });
  } else if (h1Elements.length > 1) {
    issues.push({
      type: 'warning',
      message: 'Multiple H1 headings found - may confuse AI about the main topic'
    });
  }
  
  // Check if H3s are used without H2s (skipping levels)
  const h2Elements = root.querySelectorAll('h2');
  const h3Elements = root.querySelectorAll('h3');
  
  if (h3Elements.length > 0 && h2Elements.length === 0) {
    issues.push({
      type: 'info',
      message: 'H3 headings are used without H2 headings - improper hierarchy may confuse AI'
    });
  }
  
  return issues;
}

/**
 * Analyze semantic completeness and SEO factors
 */
function analyzeSemantics(root: any, title: string): { score: number, issues: AEOIssue[] } {
  const issues: AEOIssue[] = [];
  let score = 100; // Start with perfect score and subtract
  
  // Check meta description
  const metaDescription = root.querySelector('meta[name="description"]');
  if (!metaDescription) {
    issues.push({
      type: 'warning',
      message: 'No meta description found - important for AI snippet generation'
    });
    score -= 15;
  }
  
  // Check for too short content
  const textContent = root.text.trim();
  if (textContent.length < 500) {
    issues.push({
      type: 'info',
      message: 'Content may be too short for comprehensive AI understanding'
    });
    score -= 10;
  }
  
  // Check for FAQ section
  const hasFAQ = 
    root.querySelectorAll('dt, dd').length > 0 || 
    root.innerHTML.includes('FAQ') ||
    root.querySelectorAll('h2, h3, h4').some(el => 
      el.text.toLowerCase().includes('faq') || 
      el.text.toLowerCase().includes('questions')
    );
  
  if (!hasFAQ) {
    issues.push({
      type: 'info',
      message: 'No FAQ section detected - FAQs are valuable for AI retrieval'
    });
    score -= 5;
  }
  
  return { 
    score: Math.max(0, score), 
    issues 
  };
}

/**
 * Calculate score for structured data
 */
function calculateStructuredDataScore(schemas: any[]): number {
  if (schemas.length === 0) return 0;
  
  let score = 50; // Base score for having any schema
  
  // Check for AI-friendly schema types
  const hasArticle = schemas.some(s => s['@type'] === 'Article' || s['@type'] === 'BlogPosting');
  const hasFAQ = schemas.some(s => s['@type'] === 'FAQPage');
  const hasHowTo = schemas.some(s => s['@type'] === 'HowTo');
  const hasBreadcrumb = schemas.some(s => s['@type'] === 'BreadcrumbList');
  
  if (hasArticle) score += 15;
  if (hasFAQ) score += 15;
  if (hasHowTo) score += 10;
  if (hasBreadcrumb) score += 10;
  
  return Math.min(100, score); // Cap at 100
}

/**
 * Calculate content structure score
 */
function calculateContentStructureScore(structure: any, headingIssues: AEOIssue[]): number {
  let score = 100;
  
  // Deduct for heading issues
  score -= headingIssues.length * 15;
  
  // Check heading count
  if (structure.h2Count === 0 && structure.h3Count === 0) {
    score -= 30; // No subheadings
  }
  
  // Reward for lists, tables (structured info)
  if (structure.listCount > 0) score += 10;
  if (structure.hasTable) score += 10;
  
  // Reward for images (context)
  if (structure.hasImages) score += 5;
  
  return Math.max(0, Math.min(100, score)); // Keep between 0-100
}

/**
 * Generate specific recommendations based on issues
 */
function generateRecommendations(
  hasLlmsTxt: boolean, 
  hasSchema: boolean, 
  isMarkdownRendered: boolean,
  headingIssues: AEOIssue[]
): string[] {
  const recommendations: string[] = [];
  
  if (!hasLlmsTxt) {
    recommendations.push(
      "Create a llms.txt file in your root directory listing the URLs you want AI to index"
    );
  }
  
  if (!hasSchema) {
    recommendations.push(
      "Add structured data using JSON-LD for better AI understanding of your content"
    );
  }
  
  if (!isMarkdownRendered) {
    recommendations.push(
      "Consider using Markdown for content to improve structure and readability for AI systems"
    );
  }
  
  if (headingIssues.length > 0) {
    recommendations.push(
      "Improve heading hierarchy with a single H1 and logical H2/H3 structure"
    );
  }
  
  return recommendations;
}

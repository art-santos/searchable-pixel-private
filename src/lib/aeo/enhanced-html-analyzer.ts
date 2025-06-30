import { JSDOM } from 'jsdom';
import * as cheerio from 'cheerio';

export interface H1DetectionResult {
  hasH1: boolean;
  h1Text: string | null;
  detectionMethod: 'dom' | 'enhanced-data' | 'metadata' | 'markdown' | 'visual' | 'none';
  confidence: number;
  allHeadings: {
    level: number;
    text: string;
    method: string;
  }[];
}

export class EnhancedHTMLAnalyzer {
  /**
   * Detect H1 using multiple methods with fallbacks
   */
  async detectH1(
    htmlContent: string,
    enhancedData?: any,
    metadata?: any
  ): Promise<H1DetectionResult> {
    const allHeadings: H1DetectionResult['allHeadings'] = [];
    
    // Method 1: Direct DOM parsing
    const domResult = this.detectH1FromDOM(htmlContent);
    if (domResult.hasH1) {
      return { ...domResult, detectionMethod: 'dom' };
    }
    allHeadings.push(...domResult.allHeadings);

    // Method 2: Enhanced data structure
    if (enhancedData) {
      const enhancedResult = this.detectH1FromEnhancedData(enhancedData);
      if (enhancedResult.hasH1) {
        return { ...enhancedResult, detectionMethod: 'enhanced-data', allHeadings };
      }
      allHeadings.push(...enhancedResult.allHeadings);
    }

    // Method 3: Metadata analysis
    if (metadata) {
      const metadataResult = this.detectH1FromMetadata(metadata);
      if (metadataResult.hasH1) {
        return { ...metadataResult, detectionMethod: 'metadata', allHeadings };
      }
      allHeadings.push(...metadataResult.allHeadings);
    }

    // Method 4: Markdown content detection
    const markdownResult = this.detectH1FromMarkdown(htmlContent);
    if (markdownResult.hasH1) {
      return { ...markdownResult, detectionMethod: 'markdown', allHeadings };
    }
    allHeadings.push(...markdownResult.allHeadings);

    // Method 5: Visual detection (largest text at top)
    const visualResult = this.detectH1Visually(htmlContent);
    if (visualResult.hasH1) {
      return { ...visualResult, detectionMethod: 'visual', allHeadings };
    }

    // No H1 found
    return {
      hasH1: false,
      h1Text: null,
      detectionMethod: 'none',
      confidence: 0,
      allHeadings
    };
  }

  private detectH1FromDOM(htmlContent: string): Omit<H1DetectionResult, 'detectionMethod'> {
    const allHeadings: H1DetectionResult['allHeadings'] = [];
    
    try {
      // Try cheerio first (faster)
      const $ = cheerio.load(htmlContent);
      
      // Check for H1
      const h1Elements = $('h1');
      if (h1Elements.length > 0) {
        const h1Text = h1Elements.first().text().trim();
        allHeadings.push({ level: 1, text: h1Text, method: 'dom-cheerio' });
        
        // Collect all headings
        $('h1, h2, h3, h4, h5, h6').each((_, elem) => {
          const $elem = $(elem);
          const level = parseInt(elem.name.substring(1));
          if (level !== 1 || $elem.text().trim() !== h1Text) {
            allHeadings.push({
              level,
              text: $elem.text().trim(),
              method: 'dom-cheerio'
            });
          }
        });
        
        return {
          hasH1: true,
          h1Text,
          confidence: 1.0,
          allHeadings
        };
      }

      // Fallback to JSDOM for more complex cases
      const dom = new JSDOM(htmlContent);
      const h1 = dom.window.document.querySelector('h1');
      
      if (h1) {
        const h1Text = h1.textContent?.trim() || '';
        allHeadings.push({ level: 1, text: h1Text, method: 'dom-jsdom' });
        
        return {
          hasH1: true,
          h1Text,
          confidence: 0.9,
          allHeadings
        };
      }

      // Check for role="heading" with aria-level="1"
      const ariaH1 = dom.window.document.querySelector('[role="heading"][aria-level="1"]');
      if (ariaH1) {
        const h1Text = ariaH1.textContent?.trim() || '';
        allHeadings.push({ level: 1, text: h1Text, method: 'dom-aria' });
        
        return {
          hasH1: true,
          h1Text,
          confidence: 0.8,
          allHeadings
        };
      }

    } catch (error) {
      console.error('Error in DOM detection:', error);
    }

    return {
      hasH1: false,
      h1Text: null,
      confidence: 0,
      allHeadings
    };
  }

  private detectH1FromEnhancedData(enhancedData: any): Omit<H1DetectionResult, 'detectionMethod'> {
    const allHeadings: H1DetectionResult['allHeadings'] = [];
    
    try {
      // Check headingStructure
      if (enhancedData.headingStructure?.h1?.length > 0) {
        const h1Text = enhancedData.headingStructure.h1[0];
        allHeadings.push({ level: 1, text: h1Text, method: 'enhanced-structure' });
        
        // Add other headings
        ['h2', 'h3', 'h4', 'h5', 'h6'].forEach((tag) => {
          const level = parseInt(tag.substring(1));
          enhancedData.headingStructure[tag]?.forEach((text: string) => {
            allHeadings.push({ level, text, method: 'enhanced-structure' });
          });
        });
        
        return {
          hasH1: true,
          h1Text,
          confidence: 0.95,
          allHeadings
        };
      }

      // Check metadata.headings
      if (enhancedData.metadata?.headings) {
        const h1Heading = enhancedData.metadata.headings.find((h: any) => h.level === 1);
        if (h1Heading) {
          allHeadings.push({ level: 1, text: h1Heading.text, method: 'enhanced-metadata' });
          
          return {
            hasH1: true,
            h1Text: h1Heading.text,
            confidence: 0.9,
            allHeadings
          };
        }
      }

      // Check content patterns
      if (enhancedData.content) {
        const lines = enhancedData.content.split('\n');
        for (const line of lines) {
          if (line.trim().length > 10 && line.trim().length < 100) {
            // Heuristic: First substantial line might be H1
            const potentialH1 = line.trim();
            allHeadings.push({ level: 1, text: potentialH1, method: 'enhanced-heuristic' });
            
            return {
              hasH1: true,
              h1Text: potentialH1,
              confidence: 0.6,
              allHeadings
            };
          }
        }
      }

    } catch (error) {
      console.error('Error in enhanced data detection:', error);
    }

    return {
      hasH1: false,
      h1Text: null,
      confidence: 0,
      allHeadings
    };
  }

  private detectH1FromMetadata(metadata: any): Omit<H1DetectionResult, 'detectionMethod'> {
    const allHeadings: H1DetectionResult['allHeadings'] = [];
    
    try {
      // Check title tag (often matches H1)
      if (metadata.title && metadata.title.length > 10) {
        allHeadings.push({ level: 1, text: metadata.title, method: 'metadata-title' });
        
        return {
          hasH1: true,
          h1Text: metadata.title,
          confidence: 0.7,
          allHeadings
        };
      }

      // Check og:title
      if (metadata.ogTitle && metadata.ogTitle.length > 10) {
        allHeadings.push({ level: 1, text: metadata.ogTitle, method: 'metadata-og' });
        
        return {
          hasH1: true,
          h1Text: metadata.ogTitle,
          confidence: 0.65,
          allHeadings
        };
      }

    } catch (error) {
      console.error('Error in metadata detection:', error);
    }

    return {
      hasH1: false,
      h1Text: null,
      confidence: 0,
      allHeadings
    };
  }

  private detectH1FromMarkdown(content: string): Omit<H1DetectionResult, 'detectionMethod'> {
    const allHeadings: H1DetectionResult['allHeadings'] = [];
    
    try {
      // Look for markdown H1 patterns
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Pattern: # Heading
        if (line.startsWith('# ') && !line.startsWith('##')) {
          const h1Text = line.substring(2).trim();
          if (h1Text.length > 5) {
            allHeadings.push({ level: 1, text: h1Text, method: 'markdown-hash' });
            
            return {
              hasH1: true,
              h1Text,
              confidence: 0.8,
              allHeadings
            };
          }
        }
        
        // Pattern: Heading\n======
        if (i < lines.length - 1) {
          const nextLine = lines[i + 1].trim();
          if (nextLine.match(/^=+$/) && line.length > 5) {
            allHeadings.push({ level: 1, text: line, method: 'markdown-underline' });
            
            return {
              hasH1: true,
              h1Text: line,
              confidence: 0.75,
              allHeadings
            };
          }
        }
      }
    } catch (error) {
      console.error('Error in markdown detection:', error);
    }

    return {
      hasH1: false,
      h1Text: null,
      confidence: 0,
      allHeadings
    };
  }

  private detectH1Visually(htmlContent: string): Omit<H1DetectionResult, 'detectionMethod'> {
    const allHeadings: H1DetectionResult['allHeadings'] = [];
    
    try {
      const $ = cheerio.load(htmlContent);
      
      // Look for large text at the top of the page
      const potentialH1s: Array<{ text: string; score: number }> = [];
      
      // Check common H1 patterns
      const selectors = [
        '.hero-title',
        '.page-title',
        '.main-heading',
        '[class*="heading-1"]',
        '[class*="title-large"]',
        '[class*="hero"] h1',
        '[class*="hero"] h2', // Sometimes H2 is styled as H1
        'header h1',
        'header h2',
        '[class*="text-4xl"]',
        '[class*="text-5xl"]',
        '[class*="text-6xl"]',
      ];
      
      selectors.forEach(selector => {
        $(selector).each((_, elem) => {
          const text = $(elem).text().trim();
          if (text.length > 5 && text.length < 200) {
            potentialH1s.push({
              text,
              score: selector.includes('h1') ? 0.9 : 0.7
            });
          }
        });
      });
      
      // Sort by score and return best match
      if (potentialH1s.length > 0) {
        potentialH1s.sort((a, b) => b.score - a.score);
        const best = potentialH1s[0];
        
        allHeadings.push({ level: 1, text: best.text, method: 'visual-pattern' });
        
        return {
          hasH1: true,
          h1Text: best.text,
          confidence: best.score,
          allHeadings
        };
      }
      
    } catch (error) {
      console.error('Error in visual detection:', error);
    }

    return {
      hasH1: false,
      h1Text: null,
      confidence: 0,
      allHeadings
    };
  }

  /**
   * Analyze all headings in the document
   */
  async analyzeHeadingStructure(
    htmlContent: string,
    enhancedData?: any
  ): Promise<{
    hasProperHierarchy: boolean;
    issues: string[];
    headingCounts: Record<string, number>;
    recommendations: string[];
  }> {
    const $ = cheerio.load(htmlContent);
    const headingCounts: Record<string, number> = {
      h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0
    };
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Count headings
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
      headingCounts[tag] = $(tag).length;
    });
    
    // Check for issues
    if (headingCounts.h1 === 0) {
      issues.push('No H1 tag found');
      recommendations.push('Add a clear H1 tag that describes the main topic of the page');
    } else if (headingCounts.h1 > 1) {
      issues.push(`Multiple H1 tags found (${headingCounts.h1})`);
      recommendations.push('Use only one H1 per page, use H2-H6 for subsections');
    }
    
    // Check hierarchy
    let hasProperHierarchy = true;
    let previousLevel = 0;
    
    $('h1, h2, h3, h4, h5, h6').each((_, elem) => {
      const currentLevel = parseInt(elem.name.substring(1));
      if (currentLevel > previousLevel + 1) {
        hasProperHierarchy = false;
        issues.push(`Heading hierarchy skip: H${previousLevel} to H${currentLevel}`);
      }
      previousLevel = currentLevel;
    });
    
    if (!hasProperHierarchy) {
      recommendations.push('Maintain proper heading hierarchy (H1 → H2 → H3, etc.)');
    }
    
    return {
      hasProperHierarchy,
      issues,
      headingCounts,
      recommendations
    };
  }
} 
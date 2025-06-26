import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

// More flexible Zod schemas for better LLM compatibility
const ParagraphScoresSchema = z.object({
  clarity: z.number().min(0).max(5).default(3),
  factual: z.number().min(0).max(5).default(3),
  consistency: z.number().min(0).max(5).default(3),
  depth: z.number().min(0).max(5).default(3),
  authority: z.number().min(0).max(5).default(3),
  tone: z.number().min(0).max(5).default(3),
  terminology: z.number().min(0).max(5).default(3),
});

const ParagraphAuditSchema = z.object({
  index: z.number().default(0),
  text: z.string().default(''),
  scores: ParagraphScoresSchema,
  red_flag: z.boolean().default(false),
  quick_fix: z.string().optional(),
});

const PageAuditSchema = z.object({
  url: z.string(),
  title: z.string(),
  overall_score: z.number().min(0).max(100).default(50),
  paragraphs: z.array(ParagraphAuditSchema).default([]),
  key_takeaways: z.array(z.string()).default([]),
});

export type ParagraphAudit = z.infer<typeof ParagraphAuditSchema>;
export type PageAudit = z.infer<typeof PageAuditSchema>;

export interface ContentAuditInput {
  url: string;
  title: string;
  markdown: string;
}

const AEO_FOCUSED_SYSTEM_PROMPT = `You are Content-Audit-LLM. Audit the supplied Markdown/HTML article for answer-engine optimisation (AEO).
Return a single JSON object only.

1. Per-Paragraph Scoring (0-5)
field | "5" benchmark
clarity | One main idea, short declarative sentences, extractable as snippet
factual | Verifiable claims / data
consistency | No conflict with earlier content
depth | Unique insight, numbers, first-party detail
authority | Cites source, expert quote, or lived experience
tone | Fits context (owned site → persuasive OK, but not hype-only)
terminology | Precise; avoids swapping branded terms with loose synonyms

2. Red-Flag Rules
Set red_flag = true when a paragraph harms AEO clarity:

Uses multiple synonyms for the same branded term in one paragraph.

Blends two or more distinct topics in the same paragraph.

Contains hazy claims ("world-class", "revolutionary") without a concrete fact.

Exceeds three sentences yet fails to answer a single clear question.

3. Page-Level Metrics
overall_score = weighted average
clarity 20% • factual 20% • depth 15% • authority 15% • tone 10% • consistency 10% • terminology 10%.

4. Key Takeaways
Return 3-5 actionable key_takeaways focused on tightening AEO performance (e.g., "AI Visibility vs AI SEO—pick one label per section", "Split the H200 paragraph into GPU cost & network latency paragraphs").

5. Output Schema
{
  "url": "<canonical-url>",
  "overall_score": 0-100,
  "paragraphs": [
    {
      "index": 1,
      "text": "<first 200 chars>",
      "scores": {
        "clarity": 0-5,
        "factual": 0-5,
        "consistency": 0-5,
        "depth": 0-5,
        "authority": 0-5,
        "tone": 0-5,
        "terminology": 0-5
      },
      "red_flag": true|false
    }
  ],
  "key_takeaways": ["..."]
}

6. Style Rules
Do not rewrite content.
Deterministic scoring; no randomness.
Output valid JSON only—no comments, markdown, or extra text.`;

export class ContentAuditClient {
  private openaiProvider: any;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ OPENAI_API_KEY not found - content audit will return fallback results');
      this.openaiProvider = null;
    } else {
      this.openaiProvider = createOpenAI({
        apiKey: apiKey
      });
    }
  }

  /**
   * Perform comprehensive content audit using AI SDK
   */
  async auditContent(input: ContentAuditInput): Promise<PageAudit> {
    const startTime = Date.now();
    
    try {
      console.log(`🧠 Starting content audit for: ${input.url}`);
      
      // Check if OpenAI is available
      if (!this.openaiProvider) {
        console.warn('⚠️ OpenAI not available - returning fallback audit');
        return this.createFallbackAudit(input.url, input.title);
      }
      
      // Prepare the content for analysis
      const cleanedMarkdown = this.preprocessMarkdown(input.markdown);
      
      if (cleanedMarkdown.length < 100) {
        console.warn(`⚠️ Content too short for meaningful audit: ${cleanedMarkdown.length} chars`);
        return this.createFallbackAudit(input.url, input.title, 'Content too short');
      }

      // Split content into paragraphs for analysis
      const paragraphs = this.extractParagraphs(cleanedMarkdown);
      
      if (paragraphs.length === 0) {
        console.warn('⚠️ No paragraphs found in content');
        return this.createFallbackAudit(input.url, input.title, 'No paragraphs found');
      }

      // Call AI SDK for structured content analysis with retry logic
      let auditResult: PageAudit;
      
      try {
        const { object } = await generateObject({
          model: this.openaiProvider('gpt-4o-mini'), // Use cheaper model for content audit
          system: AEO_FOCUSED_SYSTEM_PROMPT,
          prompt: `Analyze this content and return JSON:

Title: ${input.title}
URL: ${input.url}
Paragraphs to analyze: ${paragraphs.length}

Content:
${cleanedMarkdown.substring(0, 4000)}${cleanedMarkdown.length > 4000 ? '\n[truncated]' : ''}

Return JSON with url, title, overall_score (0-100), paragraphs array, and key_takeaways array.`,
          schema: PageAuditSchema,
          temperature: 0.2,
        });
        
        auditResult = object;
        
        // Validate the result
        if (!auditResult.overall_score || auditResult.overall_score < 0 || auditResult.overall_score > 100) {
          auditResult.overall_score = 50; // Default fallback
        }
        
             } catch (schemaError: any) {
         console.warn('⚠️ Schema validation failed, trying simpler approach:', schemaError.message);
         auditResult = this.createFallbackAudit(input.url, input.title, 'Schema validation failed');
       }
      
      const duration = Date.now() - startTime;
      console.log(`✅ Content audit completed in ${duration}ms (Score: ${auditResult.overall_score}/100)`);
      
      return auditResult;

    } catch (error: any) {
      console.error(`❌ Content audit failed for ${input.url}:`, error.message);
      
      // Return a fallback audit result
      return this.createFallbackAudit(input.url, input.title, `Analysis failed: ${error.message}`);
    }
  }

  /**
   * Extract paragraphs from markdown
   */
  private extractParagraphs(markdown: string): string[] {
    return markdown
      .split('\n\n')
      .map(p => p.trim())
      .filter(p => p.length > 50) // Only substantial paragraphs
      .slice(0, 15); // Limit to first 15 paragraphs for cost control
  }

  /**
   * Preprocess markdown to remove noise
   */
  private preprocessMarkdown(markdown: string): string {
    let cleaned = markdown;
    
    // Remove code blocks
    cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
    cleaned = cleaned.replace(/`[^`]+`/g, '');
    
    // Remove common navigation patterns
    cleaned = cleaned.replace(/^(Sign in|Login|Menu|Navigation|Header|Footer).*$/gm, '');
    
    // Remove footer patterns
    cleaned = cleaned.replace(/^(Copyright|©|Terms of Service|Privacy Policy).*$/gm, '');
    
    // Remove excessive whitespace
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    // Trim
    cleaned = cleaned.trim();
    
    // Limit size for cost control
    if (cleaned.length > 6000) {
      cleaned = cleaned.substring(0, 6000) + '\n\n[Content truncated for analysis]';
    }
    
    return cleaned;
  }

  /**
   * Create fallback audit result when AI analysis fails
   */
  private createFallbackAudit(url: string, title: string, reason?: string): PageAudit {
    // Generate a reasonable score based on content length and structure
    const fallbackScore = reason === 'Content too short' ? 30 : 65;
    
    return {
      url,
      title,
      overall_score: fallbackScore,
      paragraphs: [
        {
          index: 1,
          text: 'Content analysis using fallback method',
          scores: {
            clarity: 3,
            factual: 3,
            consistency: 3,
            depth: 3,
            authority: 3,
            tone: 3,
            terminology: 3,
          },
          red_flag: false,
          quick_fix: 'Run detailed AI analysis when API is available'
        }
      ],
      key_takeaways: [
        reason ? `Content audit limited: ${reason}` : 'Content audit completed with fallback analysis',
        'Ensure content has clear structure and headings',
        'Add authoritative sources and citations',
        'Review content for clarity and readability',
        'Consider adding more detailed explanations'
      ]
    };
  }

  /**
   * Calculate content quality metrics for summary
   */
  static calculateContentMetrics(audit: PageAudit): {
    avgClarity: number;
    avgFactual: number;
    avgAuthority: number;
    redFlagCount: number;
    redFlagPercentage: number;
    totalParagraphs: number;
    topIssues: string[];
  } {
    if (!audit.paragraphs.length) {
      return {
        avgClarity: 3,
        avgFactual: 3,
        avgAuthority: 3,
        redFlagCount: 0,
        redFlagPercentage: 0,
        totalParagraphs: 1,
        topIssues: audit.key_takeaways.slice(0, 3)
      };
    }

    const paragraphs = audit.paragraphs;
    const totalParas = paragraphs.length;
    
    // Calculate averages
    const avgClarity = paragraphs.reduce((sum, p) => sum + (p.scores?.clarity || 3), 0) / totalParas;
    const avgFactual = paragraphs.reduce((sum, p) => sum + (p.scores?.factual || 3), 0) / totalParas;
    const avgAuthority = paragraphs.reduce((sum, p) => sum + (p.scores?.authority || 3), 0) / totalParas;
    
    // Count red flags
    const redFlagCount = paragraphs.filter(p => p.red_flag).length;
    const redFlagPercentage = Math.round((redFlagCount / totalParas) * 100);
    
    // Extract top issues
    const topIssues = audit.key_takeaways.slice(0, 3);

    return {
      avgClarity: Math.round(avgClarity * 10) / 10,
      avgFactual: Math.round(avgFactual * 10) / 10,
      avgAuthority: Math.round(avgAuthority * 10) / 10,
      redFlagCount,
      redFlagPercentage,
      totalParagraphs: totalParas,
      topIssues
    };
  }
}

// Export singleton instance
export const contentAuditClient = new ContentAuditClient(); 
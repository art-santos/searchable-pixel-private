import { promises as fs } from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { PageData } from '../crawler/firecrawl-client';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ScoreBreakdown {
  aeoScore: number;
  seoScore: number;
  total: number;
}

export interface IssueDetail {
  severity: 'high' | 'medium' | 'low';
  message: string;
}

export interface LLMScoreResult extends ScoreBreakdown {
  issues: IssueDetail[];
  suggestions: string[];
}

export async function scorePageWithLLM(page: PageData): Promise<LLMScoreResult> {
  const rubricPath = path.join(process.cwd(), 'docs', 'aeo-scorecard.md');
  let rubric = '';
  try {
    rubric = await fs.readFile(rubricPath, 'utf8');
  } catch {
    // If the rubric file isn't found we still continue with an empty rubric
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const prompt = `You are an expert SEO auditor. Using the following rubric from docs/aeo-scorecard.md, score the supplied page.\n\n${rubric}\n\nReturn ONLY a JSON object { aeoScore: number, seoScore: number, total: number, issues: [{ severity: 'high'|'medium'|'low', message: string }], suggestions: string[] }.\n\nPage Metadata:\n${JSON.stringify(page.metadata, null, 2)}\n\nHTML:\n${page.html}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.2
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenAI');

  const parsed = JSON.parse(content);
  return {
    aeoScore: Number(parsed.aeoScore) || 0,
    seoScore: Number(parsed.seoScore) || 0,
    total: Number(parsed.total) || 0,
    issues: Array.isArray(parsed.issues)
      ? parsed.issues.map((i: any) => ({
          severity: (i.severity as 'high' | 'medium' | 'low') || 'low',
          message: String(i.message)
        }))
      : [],
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.map(String) : []
  };
}

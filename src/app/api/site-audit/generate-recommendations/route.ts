import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js'; // Import Supabase client

// Initialize OpenAI client
// Ensure your OPENAI_API_KEY is set in your environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase client (ensure environment variables are set)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const runtime = 'edge'; // Optional: Use edge runtime for faster responses

export async function POST(req: NextRequest) {
  let crawlIdForDb = null; // Variable to hold crawlId for saving
  try {
    const body = await req.json();
    console.log("[API_ROUTE_DEBUG] Received payload for generate-recommendations:", JSON.stringify(body, null, 2));
    const { siteUrl, metricScores, issueSummary, topIssues, crawlId } = body; // Expect crawlId

    crawlIdForDb = crawlId; // Assign for use in catch block if needed, and for saving

    if (!process.env.OPENAI_API_KEY) {
      console.error('[API_ROUTE_ERROR] OpenAI API key not configured');
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    if (!crawlId) {
      console.error('[API_ROUTE_ERROR] Crawl ID not provided for generating recommendations');
      return NextResponse.json({ error: 'Crawl ID is required to save the summary' }, { status: 400 });
    }

    let prompt = `You are an expert SEO and AI Engine Optimization (AEO) consultant.
Analyze the following site audit data for the website: ${siteUrl}

Overall Metric Scores (out of 100):
- AI Visibility: ${metricScores.aiVisibility}
- Content Quality: ${metricScores.contentQuality}
- Technical SEO: ${metricScores.technical}
- Performance: ${metricScores.performance}

Issue Summary:
- Critical Issues: ${issueSummary.critical}
- Warnings: ${issueSummary.warning}

Key Issues Identified (if any, up to 3-4 will be listed):
`;

    if (topIssues && topIssues.length > 0) {
      topIssues.slice(0, 4).forEach((issue: { type: string; message: string; pageUrl: string }, index: number) => { // Limit to top 4 for brevity
        prompt += `${index + 1}. [${issue.type.toUpperCase()}] ${issue.message} (on page: ${issue.pageUrl})\n`;
      });
    } else {
      prompt += "No specific high-priority issues were provided to detail, but consider the overall scores.\n";
    }

    prompt += `\nBased on this data, provide a concise and actionable site audit summary. 
Keep the entire response under 2000 characters. 
Structure your response in Markdown as follows:

### AI-Powered Summary & Key Actions

**Overall Health:** Briefly (1-2 sentences) summarize the site's current SEO/AEO health.

**Top Priorities (Max 2):**
If critical/warning issues exist, identify the 1-2 most impactful areas for improvement.
For each:
  - **Issue:** Briefly state the problem.
  - **Recommendation:** Offer a concise, actionable step.

**Quick Wins (Optional, Max 1):**
If applicable, suggest one quick win or general best practice.

Focus on clarity and actionability. Use Markdown for headings, lists, and bold text. Do not use blockquotes.
`;

    console.log("[API_ROUTE_DEBUG] Prompt being sent to OpenAI for crawlId:", crawlId, "Prompt:", prompt);

    // Create a stream from the OpenAI API response
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o', // Or your preferred model, e.g., gpt-3.5-turbo
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    let accumulatedSummary = "";
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || "";
          accumulatedSummary += text; // Accumulate the summary
          controller.enqueue(new TextEncoder().encode(text));
        }
        controller.close();

        // After stream is complete, save the accumulated summary to Supabase
        if (accumulatedSummary && crawlId) {
          console.log(`[API_ROUTE_INFO] Attempting to save summary for crawlId: ${crawlId}`);
          const { error: dbError } = await supabase
            .from('crawls') // Assuming your table is named 'crawls'
            .update({ ai_summary_markdown: accumulatedSummary })
            .eq('id', crawlId);

          if (dbError) {
            console.error(`[API_ROUTE_ERROR] Failed to save AI summary to Supabase for crawlId ${crawlId}:`, dbError);
            // Decide if you want to let the client know. For now, we just log it.
            // The client will still get the summary, but it won't be saved for next time.
          } else {
            console.log(`[API_ROUTE_INFO] Successfully saved AI summary for crawlId: ${crawlId}`);
          }
        }
      },
    });

    return new Response(readableStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });

  } catch (error: any) { // Ensure error is typed as any or unknown for full object logging
    console.error(`[API_ROUTE_ERROR] Error in generate-recommendations (crawlId: ${crawlIdForDb}):`, error);
    // Log specific properties if they exist, for common OpenAI error structures
    if (error.response) {
      console.error('[API_ROUTE_ERROR] OpenAI Response Error Data:', error.response.data);
      console.error('[API_ROUTE_ERROR] OpenAI Response Error Status:', error.response.status);
    }
    if (error.status) { // For errors from OpenAI API directly (e.g. 401, 429)
        console.error('[API_ROUTE_ERROR] OpenAI Error Status:', error.status);
    }
    if (error.error && error.error.message) { // For structured OpenAI errors
        console.error('[API_ROUTE_ERROR] OpenAI Error Message:', error.error.message);
    }

    return NextResponse.json(
      { 
        error: 'Failed to generate AI recommendations', 
        details: error.message || 'An unknown error occurred during AI recommendation generation.', 
        // Optionally include more error details if safe to expose, e.g., error.type or error.code from OpenAI
        ...(error.status && { openai_status: error.status }),
        ...(error.error && error.error.type && { openai_error_type: error.error.type }),
      }, 
      { status: 500 }
    );
  }
} 
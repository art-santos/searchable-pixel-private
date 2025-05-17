import { NextRequest } from 'next/server'
import { checkVisibility } from '@/services/visibility'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

// Enable streaming for this route
export const dynamic = 'force-dynamic'

// Helper function to safely stringify JSON
function safeJsonStringify(obj: any): string {
  try {
    return JSON.stringify(obj, (key, value) => {
      // Handle circular references and special objects
      if (typeof value === 'object' && value !== null) {
        // Convert Maps to regular objects
        if (value instanceof Map) {
          return Object.fromEntries(value);
        }
        // Handle any other special object types here if needed
      }
      return value;
    });
  } catch (err) {
    console.error('JSON stringify error:', err);
    return JSON.stringify({ error: 'Error serializing data' });
  }
}

// Helper function to split large results into chunks
function chunkResult(result: any, maxSize: number = 32000): any[] {
  // Convert the result to a clean object first
  const cleanedResult = JSON.parse(safeJsonStringify({ type: 'result', result }));
  
  // If the mentions are causing the size issue, split them into chunks
  if (cleanedResult.result && cleanedResult.result.mentions_found && 
      cleanedResult.result.mentions_found.length > 10) {
    
    const chunks: any[] = [];
    const mentions = [...cleanedResult.result.mentions_found];
    
    // Create a copy without mentions for the first chunk
    const firstChunk = { ...cleanedResult };
    firstChunk.result = { ...cleanedResult.result, mentions_found: [] };
    firstChunk.type = 'result_start';
    chunks.push(firstChunk);
    
    // Split mentions into chunks
    while (mentions.length > 0) {
      const chunkMentions = mentions.splice(0, 10); // Take 10 mentions at a time
      chunks.push({ 
        type: mentions.length === 0 ? 'result_end' : 'result_chunk',
        mentions: chunkMentions
      });
    }
    
    return chunks;
  }
  
  // If not too large or no mentions, return as a single chunk
  return [cleanedResult];
}

export async function POST(req: NextRequest) {
  await cookies() // Wait for cookies to be available
  
  // Enable streaming response
  const encoder = new TextEncoder()
  const customReadable = new ReadableStream({
    async start(controller) {
      try {
        const body = await req.json()
        const { domain, category, competitor_domains, custom_brand_terms } = body
        
        // Create progress callback if requested
        const onProgress = body.onProgress ? (completed: number, total: number) => {
          const progressData = {
            type: 'progress',
            completed,
            total
          }
          
          // Send progress update with safe JSON stringification
          controller.enqueue(encoder.encode(`data: ${safeJsonStringify(progressData)}\n\n`))
        } : undefined
        
        // Run the visibility check
        const result = await checkVisibility({
          domain,
          category,
          competitor_domains,
          custom_brand_terms
        }, onProgress)
        
        // Split the result into manageable chunks if needed
        const resultChunks = chunkResult(result);
        
        // Send each chunk
        for (const chunk of resultChunks) {
          controller.enqueue(
            encoder.encode(
              `data: ${safeJsonStringify(chunk)}\n\n`
            )
          )
        }
        
        // Save the result to Supabase if user is logged in
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          await supabase
            .from('visibility_results')
            .insert({
              user_id: user.id,
              domain: result.domain,
              result_data: result,
              created_at: new Date().toISOString()
            })
            .select()
        }
        
        // Complete the stream
        controller.close()
      } catch (error: any) {
        console.error('Error in visibility check:', error)
        
        // Send error message
        controller.enqueue(
          encoder.encode(
            `data: ${safeJsonStringify({ 
              type: 'error', 
              message: error.message || 'An unknown error occurred'
            })}\n\n`
          )
        )
        
        // Close the stream
        controller.close()
      }
    }
  })
  
  return new Response(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
} 
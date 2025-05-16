import { NextRequest, NextResponse } from 'next/server';
import { getSiteAuditResults } from '@/services/crawler';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = await cookies();
  try {
    console.log(`[API Route Debug - ${req.method} ${req.nextUrl.pathname}] Raw params object:`, JSON.stringify(params, null, 2));
    const crawlId = params.id;
    
    if (!crawlId) {
      return NextResponse.json(
        { error: 'Crawl ID is required' },
        { status: 400 }
      );
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      console.error('Missing Supabase URL or Service Key for GET results route');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    // Check authentication
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get: async (name: string) => {
            return cookieStore.get(name)?.value;
          },
          set: (name: string, value: string, options: any) => {
            console.warn(`[Supabase Cookie] Attempted to set cookie in GET route (/api/site-audit/results): ${name}`);
          },
          remove: (name: string, options: any) => {
            console.warn(`[Supabase Cookie] Attempted to remove cookie in GET route (/api/site-audit/results): ${name}`);
          },
        },
      }
    );
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the crawl results
    const results = await getSiteAuditResults(crawlId);

    // Log the structure of the first page and its issues/recommendations, if pages exist
    if (results && results.pages && results.pages.length > 0) {
      console.log('[API Route /results] Sample of first page data being sent to UI:', 
        JSON.stringify({
          url: results.pages[0].url,
          title: results.pages[0].title,
          issuesCount: results.pages[0].issues?.length,
          firstIssue: results.pages[0].issues?.[0],
          recommendationsCount: results.pages[0].recommendations?.length,
          firstRecommendation: results.pages[0].recommendations?.[0]
        }, null, 2)
      );
    } else if (results) {
      console.log('[API Route /results] No pages found in results or results.pages is empty. Full results object:', JSON.stringify(results, null, 2));
    }
    
    // Return the results
    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error getting crawl results:', error);
    return NextResponse.json({ error: 'Failed to get crawl results', details: error?.message || String(error) }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { getPartialCrawlResults } from '@/services/crawler';
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
      console.error('Missing Supabase URL or Service Key for GET partial-results route');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        cookies: {
          get: async (name: string) => {
            return cookieStore.get(name)?.value;
          },
          set: (name: string, value: string, options: any) => {
            console.warn(`[Supabase Cookie] Attempted to set cookie in GET route (/api/site-audit/partial-results): ${name}`);
          },
          remove: (name: string, options: any) => {
            console.warn(`[Supabase Cookie] Attempted to remove cookie in GET route (/api/site-audit/partial-results): ${name}`);
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
    
    // Get the partial crawl results
    const results = await getPartialCrawlResults(crawlId);
    
    // Return the results
    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error getting partial crawl results:', error);
    
    return NextResponse.json(
      { error: 'Failed to get partial crawl results', details: error?.message || String(error) },
      { status: 500 }
    );
  }
} 
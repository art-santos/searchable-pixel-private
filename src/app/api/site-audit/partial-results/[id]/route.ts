import { NextRequest, NextResponse } from 'next/server';
import { getPartialCrawlResults } from '@/services/crawler';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the crawl ID from the URL
    const crawlId = params.id;
    
    if (!crawlId) {
      return NextResponse.json(
        { error: 'Crawl ID is required' },
        { status: 400 }
      );
    }
    
    // Check authentication
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_KEY || '',
      {
        cookies: {
          get: async (name) => {
            const cookie = await cookieStore.get(name);
            return cookie?.value;
          },
          set: async (name, value, options) => {
            await cookieStore.set(name, value, options);
          },
          remove: async (name, options) => {
            await cookieStore.remove(name, options);
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
  } catch (error) {
    console.error('Error getting partial crawl results:', error);
    
    return NextResponse.json(
      { error: 'Failed to get partial crawl results' },
      { status: 500 }
    );
  }
} 
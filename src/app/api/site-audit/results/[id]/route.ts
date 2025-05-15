import { NextRequest, NextResponse } from 'next/server';
import { getSiteAuditResults } from '@/services/crawler';
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
          get(name) {
            return cookieStore.get(name)?.value;
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
    
    // Return the results
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error getting crawl results:', error);
    
    return NextResponse.json(
      { error: 'Failed to get crawl results' },
      { status: 500 }
    );
  }
} 
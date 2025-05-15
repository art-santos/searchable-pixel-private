import { NextRequest, NextResponse } from 'next/server';
import { getSiteAuditStatus } from '@/services/crawler';
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
    
    // Get the crawl status
    const status = await getSiteAuditStatus(crawlId);
    
    // Return the status
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error checking crawl status:', error);
    
    return NextResponse.json(
      { error: 'Failed to check crawl status' },
      { status: 500 }
    );
  }
} 
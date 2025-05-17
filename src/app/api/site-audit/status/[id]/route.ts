import { NextRequest, NextResponse } from 'next/server';
import { getSiteAuditStatus } from '@/services/crawler';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Ensure params are accessed after an await, if necessary by Next.js runtime
    const cookieStore = await cookies(); 
    
    // Access params after the first await
    const crawlId = params.id;
    console.log(`[API Route Debug - ${req.method} ${req.nextUrl.pathname}] Crawl ID:`, crawlId);
    
    if (!crawlId) {
      return NextResponse.json(
        { error: 'Crawl ID is required' },
        { status: 400 }
      );
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      console.error('Missing Supabase URL or Service Key for GET status route');
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
            console.warn(`[Supabase Cookie] Attempted to set cookie in GET route (/api/site-audit/status): ${name}`);
          },
          remove: (name: string, options: any) => {
            console.warn(`[Supabase Cookie] Attempted to remove cookie in GET route (/api/site-audit/status): ${name}`);
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
  } catch (error: any) {
    console.error('Error checking crawl status:', error);
    
    return NextResponse.json(
      { error: 'Failed to check crawl status', details: error?.message || String(error) },
      { status: 500 }
    );
  }
} 
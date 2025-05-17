import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies as nextCookies } from 'next/headers';

export async function GET(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase URL or Service Key for GET history route');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      cookies: {
        get: async (name: string) => {
          const cookieStore = await nextCookies();
          return cookieStore.get(name)?.value;
        },
        set: async (name: string, value: string, options: any) => {
          const cookieStore = await nextCookies();
          cookieStore.set(name, value, options);
        },
        remove: async (name: string, options: any) => {
          const cookieStore = await nextCookies();
          cookieStore.set(name, '', options);
        },
      },
    }
  );

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return NextResponse.json({ error: 'Failed to authenticate session', details: sessionError.message }, { status: 500 });
    }

    if (!session?.user) {
      console.log('[API History Route] No active session or user found.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('[API History Route] Authenticated user ID for history query:', session.user.id);

    // Query the site_audit_summary view, filtering by user_id from the underlying sites table
    // The view definition is: ... FROM crawls c JOIN sites s ON c.site_id = s.id ...
    // So we should be able to filter by s.user_id
    const { data: summaries, error: summariesError } = await supabase
      .from('site_audit_summary') 
      .select(`
        crawl_id,
        domain, 
        started_at,
        status,
        aeo_score,
        critical_issues_count,
        warning_issues_count
      `)
      .eq('user_id', session.user.id) // Changed from 'sites.user_id' to 'user_id' (assuming view exposes it as user_id)
      .order('started_at', { ascending: false })
      .limit(20);

    if (summariesError) {
      console.error('Error fetching from site_audit_summary view:', summariesError);
      console.error('Supabase summariesError object:', JSON.stringify(summariesError, null, 2));
      return NextResponse.json({ error: 'Failed to fetch crawl summaries', details: summariesError.message }, { status: 500 });
    }
    
    console.log('[API History Route] Fetched summaries from view:', JSON.stringify(summaries, null, 2));

    if (!summaries || summaries.length === 0) {
      console.log('[API History Route] No summaries found for user ID:', session.user.id, 'from site_audit_summary view.');
      return NextResponse.json([]);
    }

    const processedCrawls = summaries.map(summary => {
      return {
        crawl_id: summary.crawl_id,
        site_url: summary.domain || 'N/A',
        created_at: summary.started_at,
        status: summary.status,
        ai_visibility_score: summary.aeo_score || 0,
        critical_issues: summary.critical_issues_count || 0,
        warning_issues: summary.warning_issues_count || 0,
      };
    });

    return NextResponse.json(processedCrawls);

  } catch (error: any) {
    console.error('Unexpected error in GET /api/site-audit/history:', error);
    return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
  }
} 
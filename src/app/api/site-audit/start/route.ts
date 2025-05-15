import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { startSiteAudit } from '@/services/crawler';

export async function POST(req: NextRequest) {
  try {
    // Get the request body
    const body = await req.json();
    
    // Validate the site URL
    if (!body.siteUrl) {
      return NextResponse.json(
        { error: 'Site URL is required' },
        { status: 400 }
      );
    }
    
    // Check for environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('Missing NEXT_PUBLIC_SUPABASE_URL');
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase URL' },
        { status: 500 }
      );
    }
    
    if (!process.env.SUPABASE_SERVICE_KEY) {
      console.error('Missing SUPABASE_SERVICE_KEY');
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase service key' },
        { status: 500 }
      );
    }
    
    // Get the user ID from the session
    try {
      const cookieStore = cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY,
        {
          cookies: {
            async get(name) {
              const cookie = await cookieStore.get(name);
              return cookie?.value;
            },
          },
        }
      );
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Supabase session error:', sessionError);
        return NextResponse.json(
          { error: 'Authentication error: ' + sessionError.message },
          { status: 401 }
        );
      }
      
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Unauthorized: No valid session' },
          { status: 401 }
        );
      }
      
      // Extract the audit options from the request body
      const {
        maxPages = 100,
        includeDocuments = true,
        checkMediaAccessibility = true,
        performInteractiveActions = false
      } = body;
      
      // Start the site audit with enhanced options
      try {
        const { crawlId } = await startSiteAudit({
          siteUrl: body.siteUrl,
          userId: session.user.id,
          maxPages,
          includeDocuments,
          checkMediaAccessibility,
          performInteractiveActions
        });
        
        // Return the crawl ID
        return NextResponse.json({ 
          crawlId,
          message: 'Site audit started successfully',
          options: {
            maxPages,
            includeDocuments,
            checkMediaAccessibility,
            performInteractiveActions
          }
        });
      } catch (crawlError) {
        console.error('Error in startSiteAudit:', crawlError);
        return NextResponse.json(
          { error: 'Crawl error: ' + crawlError.message },
          { status: 500 }
        );
      }
    } catch (authError) {
      console.error('Auth setup error:', authError);
      return NextResponse.json(
        { error: 'Authentication setup error: ' + authError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error starting site audit:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to start site audit' },
      { status: 500 }
    );
  }
} 
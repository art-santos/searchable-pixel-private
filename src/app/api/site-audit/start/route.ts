import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { startSiteAudit } from '@/services/crawler';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
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
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      console.error('Missing Supabase URL or Service Key');
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
          set: async (name: string, value: string, options: any) => {
            await cookieStore.set(name, value, options);
          },
          remove: async (name: string, options: any) => {
            await cookieStore.remove(name, options);
          },
        },
      }
    );
    
    // Get the user ID from the session
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
    } catch (crawlError: any) {
      console.error('Error in startSiteAudit:', crawlError);
      return NextResponse.json(
        { error: 'Crawl error: ' + (crawlError?.message || crawlError) },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error starting site audit:', error);
    const message = error?.message || 'Failed to start site audit';
    // Check if the error is from Supabase client instantiation specifically
    if (error.message && error.message.includes('createSupabaseClient')) {
        //This is not an actual Supabase error, but useful for debugging if client creation itself fails.
        console.error('Supabase client creation might have failed in POST route.')
    }
    return NextResponse.json({ error: message, details: error.stack }, { status: 500 });
  }
} 
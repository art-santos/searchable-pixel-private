import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * API endpoint for site management
 * POST /api/sites - Create or get a site
 */
export async function POST(req: NextRequest) {
  try {
    // Create Supabase client
    const supabase = createClient();
    
    // Get the user session to ensure they're authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to manage sites' },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const body = await req.json();
    const { domain } = body;
    
    if (!domain) {
      return NextResponse.json(
        { error: 'Bad request: domain is required' },
        { status: 400 }
      );
    }
    
    // Check if the site already exists for this user
    const { data: existingSite, error: queryError } = await supabase
      .from('sites')
      .select('id, domain')
      .eq('domain', domain)
      .eq('uid', session.user.id)
      .maybeSingle();
      
    if (queryError) {
      console.error('Error querying sites:', queryError);
      return NextResponse.json(
        { error: 'Failed to query sites' },
        { status: 500 }
      );
    }
    
    // If site exists, return it
    if (existingSite) {
      return NextResponse.json({
        success: true,
        site_id: existingSite.id,
        domain: existingSite.domain,
        message: 'Site already registered'
      });
    }
    
    // Otherwise, create a new site
    const { data: newSite, error: insertError } = await supabase
      .from('sites')
      .insert({
        domain,
        uid: session.user.id,
        connection_status: 'unknown'
      })
      .select()
      .single();
      
    if (insertError) {
      console.error('Error creating site:', insertError);
      return NextResponse.json(
        { error: 'Failed to create site' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      site_id: newSite.id,
      domain: newSite.domain,
      message: 'Site registered successfully'
    });
    
  } catch (error) {
    console.error('Error in sites API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sites - List all sites for the current user
 */
export async function GET(req: NextRequest) {
  try {
    // Create Supabase client
    const supabase = createClient();
    
    // Get the user session to ensure they're authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to access sites' },
        { status: 401 }
      );
    }
    
    // Get sites for the current user
    const { data: sites, error } = await supabase
      .from('sites')
      .select('id, domain, connection_status, last_pinged_at, created_at')
      .eq('uid', session.user.id)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching sites:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sites' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      sites
    });
    
  } catch (error) {
    console.error('Error in sites API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
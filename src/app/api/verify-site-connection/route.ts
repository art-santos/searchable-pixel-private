import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * API endpoint to verify site connections
 * GET /api/verify-site-connection?site_id=<site_id>
 * POST /api/verify-site-connection (to verify multiple sites)
 */
export async function GET(req: NextRequest) {
  try {
    // Create Supabase client
    const supabase = createClient();
    
    // Get authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get site ID from query params
    const url = new URL(req.url);
    const siteId = url.searchParams.get('site_id');
    
    if (!siteId) {
      return NextResponse.json(
        { error: 'Missing site_id parameter' },
        { status: 400 }
      );
    }
    
    // Get site data
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, domain, agent_id, webhook_url, last_pinged_at, connection_status')
      .eq('id', siteId)
      .eq('uid', session.user.id)
      .single();
    
    if (siteError || !site) {
      return NextResponse.json(
        { error: 'Site not found or access denied' },
        { status: 404 }
      );
    }
    
    // Perform the verification
    const verificationResult = await verifySiteConnection(site);
    
    // Update site status in database
    const { error: updateError } = await supabase
      .from('sites')
      .update({
        connection_status: verificationResult.status,
        last_pinged_at: new Date().toISOString(),
        last_ping_result: verificationResult.details
      })
      .eq('id', siteId);
    
    if (updateError) {
      console.error('Error updating site status:', updateError);
    }
    
    return NextResponse.json({
      success: true,
      site_id: siteId,
      verification: verificationResult
    });
    
  } catch (error) {
    console.error('Error verifying site connection:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle POST requests to verify multiple sites
 */
export async function POST(req: NextRequest) {
  try {
    // Create Supabase client
    const supabase = createClient();
    
    // Get authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    const { site_ids } = body;
    
    if (!site_ids || !Array.isArray(site_ids) || site_ids.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid site_ids array in request body' },
        { status: 400 }
      );
    }
    
    // Get sites data
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, domain, agent_id, webhook_url, last_pinged_at, connection_status')
      .in('id', site_ids)
      .eq('uid', session.user.id);
    
    if (sitesError || !sites || sites.length === 0) {
      return NextResponse.json(
        { error: 'Sites not found or access denied' },
        { status: 404 }
      );
    }
    
    // Verify each site
    const results = [];
    for (const site of sites) {
      const verificationResult = await verifySiteConnection(site);
      
      // Update site status in database
      const { error: updateError } = await supabase
        .from('sites')
        .update({
          connection_status: verificationResult.status,
          last_pinged_at: new Date().toISOString(),
          last_ping_result: verificationResult.details
        })
        .eq('id', site.id);
      
      if (updateError) {
        console.error(`Error updating site ${site.id} status:`, updateError);
      }
      
      results.push({
        site_id: site.id,
        domain: site.domain,
        verification: verificationResult
      });
    }
    
    return NextResponse.json({
      success: true,
      results
    });
    
  } catch (error) {
    console.error('Error verifying site connections:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Verify a site connection by pinging the webhook
 */
async function verifySiteConnection(site: any) {
  try {
    // Determine the webhook URL
    const webhookUrl = site.webhook_url || `https://${site.domain}/api/split-agent`;
    const pingUrl = `${webhookUrl}?ping=true`;
    
    // Ping the webhook
    const response = await fetch(pingUrl, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      next: { revalidate: 0 } // Bypass cache
    });
    
    // Check if the response is successful
    if (!response.ok) {
      return {
        status: 'disconnected',
        message: `Failed with status: ${response.status}`,
        details: {
          status_code: response.status,
          error: await response.text().catch(() => 'Could not read response')
        }
      };
    }
    
    // Parse the response
    const data = await response.json();
    
    // Validate the response data
    if (!data.success) {
      return {
        status: 'error',
        message: 'Endpoint responded but with an unsuccessful status',
        details: data
      };
    }
    
    // Check if agent ID matches
    if (data.agent_id && data.agent_id !== site.agent_id) {
      return {
        status: 'mismatch',
        message: 'Agent ID mismatch',
        details: {
          expected: site.agent_id,
          received: data.agent_id
        }
      };
    }
    
    // All good
    return {
      status: 'connected',
      message: 'Site connection verified successfully',
      details: data
    };
    
  } catch (error) {
    console.error('Error pinging site:', error);
    return {
      status: 'error',
      message: 'Failed to connect to site',
      details: {
        error: error instanceof Error ? error.message : String(error)
      }
    };
  }
} 
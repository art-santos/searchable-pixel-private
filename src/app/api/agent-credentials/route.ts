import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

/**
 * API endpoint to generate agent credentials for a domain
 * POST /api/agent-credentials
 * 
 * Request body:
 * {
 *   domain: string
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   agent_id: string,
 *   agent_secret: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Create Supabase client with admin privileges
    const supabase = createClient();
    
    // Get the user session to ensure they're authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to generate credentials' },
        { status: 401 }
      );
    }
    
    // Get the user ID from the session
    const userId = session.user.id;
    
    // Parse the request body
    const body = await req.json();
    const { domain } = body;
    
    if (!domain) {
      return NextResponse.json(
        { error: 'Bad request: domain is required' },
        { status: 400 }
      );
    }
    
    // Generate credentials
    const agentId = crypto.randomUUID();
    const agentSecret = crypto.randomBytes(32).toString('hex');
    
    // Use our secure function to store credentials with encryption
    const { data: functionData, error: functionError } = await supabase
      .rpc('create_agent_credentials', {
        domain_param: domain,
        user_id_param: userId,
        agent_id_param: agentId,
        agent_secret_param: agentSecret
      });
      
    if (functionError) {
      console.error('Error in create_agent_credentials function:', functionError);
      return NextResponse.json(
        { error: 'Failed to store credentials securely' },
        { status: 500 }
      );
    }
    
    // Retrieve the new credentials record
    const { data, error } = await supabase
      .from('agent_credentials')
      .select()
      .eq('agent_id', agentId)
      .single();
    
    if (error) {
      console.error('Error storing agent credentials:', error);
      return NextResponse.json(
        { error: 'Failed to store credentials' },
        { status: 500 }
      );
    }
    
    // Return credentials to the user
    return NextResponse.json({
      success: true,
      agent_id: agentId,
      agent_secret: agentSecret, // Only return the raw secret once
    });
  } catch (error) {
    console.error('Error generating agent credentials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Hash the agent secret for storage
 * We don't need to store the raw secret, only a hash to verify it later
 */
function hashSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex');
} 
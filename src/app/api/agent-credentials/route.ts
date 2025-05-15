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
 * API endpoint to delete agent credentials
 * DELETE /api/agent-credentials?id=<credential_id>
 */
export async function DELETE(req: NextRequest) {
  try {
    // Create Supabase client
    const supabase = createClient();
    
    // Get the user session to ensure they're authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to delete credentials' },
        { status: 401 }
      );
    }
    
    // Get the credential ID from the URL
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Bad request: credential ID is required' },
        { status: 400 }
      );
    }
    
    // Delete the credential
    const { error } = await supabase
      .from('agent_credentials')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id); // Ensure the user owns this credential
    
    if (error) {
      console.error('Error deleting agent credentials:', error);
      return NextResponse.json(
        { error: 'Failed to delete credentials' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Credentials deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting agent credentials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * API endpoint to regenerate agent secret
 * PUT /api/agent-credentials?id=<credential_id>
 */
export async function PUT(req: NextRequest) {
  try {
    // Create Supabase client
    const supabase = createClient();
    
    // Get the user session to ensure they're authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to regenerate credentials' },
        { status: 401 }
      );
    }
    
    // Get the credential ID from the URL
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Bad request: credential ID is required' },
        { status: 400 }
      );
    }
    
    // First, get the credential to ensure it exists and belongs to the user
    const { data: credential, error: fetchError } = await supabase
      .from('agent_credentials')
      .select('agent_id, domain')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching credential:', fetchError);
      return NextResponse.json(
        { error: 'Credential not found or access denied' },
        { status: 404 }
      );
    }
    
    // Generate new secret
    const newSecret = crypto.randomBytes(32).toString('hex');
    
    // Update the credential with the new secret
    const { error: updateError } = await supabase.rpc('update_agent_secret', {
      credential_id_param: id,
      agent_secret_param: newSecret
    });
    
    if (updateError) {
      console.error('Error updating agent secret:', updateError);
      return NextResponse.json(
        { error: 'Failed to update credential secret' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      agent_id: credential.agent_id,
      domain: credential.domain,
      agent_secret: newSecret
    });
  } catch (error) {
    console.error('Error regenerating agent secret:', error);
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
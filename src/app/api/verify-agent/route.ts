import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

/**
 * API endpoint to verify agent credentials
 * POST /api/verify-agent
 * 
 * Request body:
 * {
 *   agent_id: string,
 *   agent_secret: string,
 *   domain: string
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   verified: boolean,
 *   message?: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Create Supabase client
    const supabase = createClient();
    
    // Parse the request body
    const body = await req.json();
    const { agent_id, agent_secret, domain } = body;
    
    if (!agent_id || !agent_secret || !domain) {
      return NextResponse.json(
        { 
          success: false, 
          verified: false,
          message: 'Missing required fields: agent_id, agent_secret, and domain are required'
        },
        { status: 400 }
      );
    }
    
    // Find the agent credentials in the database
    const { data, error } = await supabase
      .from('agent_credentials')
      .select('agent_secret_hash, domain')
      .eq('agent_id', agent_id)
      .single();
    
    if (error || !data) {
      return NextResponse.json({
        success: true,
        verified: false,
        message: 'Agent ID not found'
      });
    }
    
    // Verify the domain
    if (data.domain !== domain) {
      return NextResponse.json({
        success: true,
        verified: false,
        message: 'Domain mismatch'
      });
    }
    
    // Verify the secret
    const storedHash = data.agent_secret_hash;
    const providedHash = hashSecret(agent_secret);
    
    const verified = storedHash === providedHash;
    
    return NextResponse.json({
      success: true,
      verified,
      message: verified ? 'Credentials verified' : 'Invalid agent secret'
    });
  } catch (error) {
    console.error('Error verifying agent credentials:', error);
    return NextResponse.json(
      { 
        success: false, 
        verified: false,
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

/**
 * Hash the agent secret for verification
 */
function hashSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex');
} 
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

/**
 * API endpoint to send content to a user's webhook
 * POST /api/send-content
 * 
 * Request body:
 * {
 *   agent_id: string,
 *   domain: string,
 *   content: string, // MDX content
 *   metadata: {
 *     title: string,
 *     description: string,
 *     slug: string,
 *     date: string,
 *     author: string,
 *     tags: string[]
 *   }
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   message?: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Create Supabase client
    const supabase = createClient();
    
    // Only allow authenticated admin users
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to send content' },
        { status: 401 }
      );
    }
    
    // Check if user is admin (you'll need to implement this logic)
    const isAdmin = await checkIfUserIsAdmin(session.user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can send content' },
        { status: 403 }
      );
    }
    
    // Parse the request body
    const body = await req.json();
    const { agent_id, domain, content, metadata } = body;
    
    if (!agent_id || !domain || !content || !metadata || !metadata.slug) {
      return NextResponse.json(
        { error: 'Bad request: Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get the agent secret hash from the database
    const { data, error } = await supabase
      .from('agent_credentials')
      .select('agent_secret_hash, webhook_url')
      .eq('agent_id', agent_id)
      .eq('domain', domain)
      .single();
    
    if (error || !data) {
      return NextResponse.json(
        { error: 'Agent not found for the given domain' },
        { status: 404 }
      );
    }
    
    // Get the webhook URL (for App Router/Pages Router)
    const webhookUrl = data.webhook_url || `https://${domain}/api/split-agent`;
    
    // Prepare the payload
    const payload = {
      content,
      metadata
    };
    
    const payloadString = JSON.stringify(payload);
    
    // Get the actual secret using our secure database function
    const { data: secretData, error: secretError } = await supabase
      .rpc('get_agent_secret', { 
        agent_id_param: agent_id,
        user_id_param: session.user.id 
      });
    
    if (secretError || !secretData) {
      console.error('Error retrieving agent secret:', secretError);
      return NextResponse.json(
        { error: 'Could not retrieve agent secret for signing' },
        { status: 500 }
      );
    }
    
    // Create HMAC signature using the decrypted secret
    const hmac = crypto.createHmac('sha256', secretData);
    hmac.update(payloadString);
    const signature = hmac.digest('hex');
    
    // Send the content to the webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-split-signature': signature,
        'x-split-agent': agent_id
      },
      body: payloadString
    });
    
    // Check if the webhook was successful
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { 
          success: false, 
          message: `Webhook failed: ${response.status} ${errorText}`
        },
        { status: 502 }
      );
    }
    
    // Parse the webhook response
    const webhookResponse = await response.json();
    
    // Log the content delivery
    await supabase
      .from('content_deliveries')
      .insert([
        {
          agent_id,
          domain,
          slug: metadata.slug,
          title: metadata.title || '',
          status: 'delivered',
          delivered_at: new Date().toISOString()
        }
      ]);
    
    return NextResponse.json({
      success: true,
      message: 'Content delivered successfully',
      webhook_response: webhookResponse
    });
  } catch (error) {
    console.error('Error sending content:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

/**
 * Check if a user has admin privileges
 * This is a placeholder - implement your admin checking logic
 */
async function checkIfUserIsAdmin(userId: string): Promise<boolean> {
  // TODO: Implement admin checking logic
  // For example, check a 'roles' table or a user 'is_admin' field
  
  // For now, just return a placeholder result
  return true;
} 
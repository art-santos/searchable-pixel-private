import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    // Check environment variables
    console.log('Environment variables:');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ 
        status: 'error',
        message: 'Missing Supabase environment variables'
      }, { status: 500 });
    }
    
    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    // Check auth
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return NextResponse.json({ 
        status: 'error',
        message: 'Supabase session error',
        error: sessionError.message
      }, { status: 500 });
    }
    
    // Check if user is authenticated
    const isAuthenticated = !!sessionData?.session?.user;
    
    // Test database connection
    let dbConnectionStatus = 'Not tested';
    try {
      const { error: dbError } = await supabase.from('sites').select('count').limit(1);
      dbConnectionStatus = dbError ? `Error: ${dbError.message}` : 'Connected';
    } catch (dbErr: unknown) {
      dbConnectionStatus = `Exception: ${dbErr instanceof Error ? dbErr.message : String(dbErr)}`;
    }
    
    return NextResponse.json({ 
      status: 'ok',
      message: 'Auth test completed',
      isAuthenticated,
      user: isAuthenticated && sessionData.session ? {
        id: sessionData.session.user.id,
        email: sessionData.session.user.email
      } : null,
      dbConnectionStatus,
      time: new Date().toISOString()
    });
  } catch (error: unknown) {
    console.error('Error in auth test API:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
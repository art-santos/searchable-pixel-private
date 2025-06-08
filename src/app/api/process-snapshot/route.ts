import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  console.log('🚀 Process snapshot API called');
  
  try {
    const body = await request.json();
    const { user_id, request_id } = body;
    console.log('📥 Request body:', { user_id, request_id });
    
    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Use service role client for edge function invocation
    const supabase = createServiceRoleClient();
    console.log('🔧 Supabase service role client created');
              
    // Call the edge function to process snapshots
    console.log('📡 Invoking edge function...');
    const { data, error } = await supabase.functions.invoke('process-snapshot', {
      body: { user_id, request_id }
    });

    console.log('📨 Edge function raw response:', { data, error });

    if (error) {
      console.error('❌ Edge function error:', error);
      console.error('   Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { 
          success: false, 
          error: error.message 
        },
        { status: 500 }
      );
    }

    console.log('✅ Edge function response:', data);
    
    return NextResponse.json({ 
      success: true,
      message: data?.message || 'Processing started',
      requestId: data?.requestId || request_id,
      processedCount: data?.processedCount || 0
    });
    
  } catch (error: any) {
    console.error('❌ Process snapshot error:', error);
    console.error('   Stack:', error.stack);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  console.log('🚀 Process ALL snapshots API called');
  
  try {
    // Get Supabase client
    const supabase = createClient();
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Call the edge function to process all snapshots
    const { data, error } = await supabase.functions.invoke('process-snapshot', {
      body: { user_id: user.id }
    });
    
    if (error) {
      console.error('❌ Edge function error:', error);
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
      processedCount: data?.processedCount || 0,
      lastRequestId: data?.lastRequestId
    });
    
  } catch (error: any) {
    console.error('❌ Process all snapshots error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
} 
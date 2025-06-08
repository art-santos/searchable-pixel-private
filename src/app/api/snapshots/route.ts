import { NextRequest, NextResponse } from 'next/server';
import { createSnapshotRequest, triggerSnapshotProcessing } from '@/lib/snapshot-client';

export async function POST(request: NextRequest) {
  console.log('🚀 Snapshot creation API called');
  
  try {
    const body = await request.json();
    console.log('📋 Snapshot request body:', JSON.stringify(body, null, 2));
    
    const { urls, topic, userId } = body;
    
    // Validate input
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      console.error('❌ Invalid URLs array:', urls);
      return NextResponse.json(
        { error: 'URLs array is required' },
        { status: 400 }
      );
    }
    
    if (!topic || typeof topic !== 'string') {
      console.error('❌ Invalid topic:', topic);
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }
    
    console.log('✅ Input validation passed');
    console.log(`   URLs: ${urls.length} provided`);
    console.log(`   Topic: "${topic}"`);
    console.log(`   User ID: ${userId || 'anonymous'}`);
    
    // Create snapshot request
    console.log('💾 Creating snapshot request in database...');
    const { success, requestId, error } = await createSnapshotRequest(urls, topic, userId);
    
    console.log('📊 Snapshot creation result:', {
      success,
      requestId,
      error: error || 'none'
    });
    
    if (!success || !requestId) {
      console.error('❌ Failed to create snapshot request:', error);
      return NextResponse.json(
        { error: error || 'Failed to create snapshot request' },
        { status: 500 }
      );
    }
    
    console.log(`✅ Snapshot request created with ID: ${requestId}`);
    
    // Trigger processing for THIS specific snapshot (not queue-based)
    console.log('🔄 Triggering immediate processing for this snapshot...');
    try {
      // Pass the specific request ID instead of relying on queue order
      const triggerResult = await triggerSnapshotProcessing(userId, requestId);
      console.log('📡 Processing trigger result:', {
        success: triggerResult.success,
        message: triggerResult.message,
        error: triggerResult.error || 'none'
      });
      
      if (!triggerResult.success) {
        console.warn('⚠️ Processing trigger failed, but request was created:', triggerResult.error);
        console.warn('   Details:', triggerResult.message);
        // Don't fail the whole request if trigger fails - the request is still created
      } else {
        console.log('✅ Immediate processing trigger successful');
      }
    } catch (triggerError: any) {
      console.error('❌ Processing trigger exception:', triggerError.message);
      console.error('   Name:', triggerError.name);
      console.error('   Stack:', triggerError.stack);
      console.error('   Cause:', triggerError.cause);
      console.error('   Constructor:', triggerError.constructor.name);
      // Don't fail the whole request if trigger fails
    }
    
    console.log('🎉 Snapshot API completed successfully');
    
    return NextResponse.json({ 
      success: true,
      requestId,
      message: 'Snapshot request created successfully'
    });
    
  } catch (error: any) {
    console.error('❌ Snapshot API error:', error.message);
    console.error('   Stack:', error.stack);
    
    return NextResponse.json(
      { error: error.message || 'Failed to create snapshot' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  console.log('📊 Snapshot list API called');
  
  // Optional: List user's snapshots
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  console.log(`   User ID: ${userId || 'missing'}`);
  
  if (!userId) {
    console.error('❌ Missing userId parameter');
    return NextResponse.json(
      { error: 'userId is required' },
      { status: 400 }
    );
  }

  try {
    const { getUserSnapshots } = await import('@/lib/snapshot-client');
    console.log('🔍 Fetching user snapshots...');
    
    const { success, requests, error } = await getUserSnapshots(userId);
    
    console.log('📊 Fetch result:', {
      success,
      count: requests?.length || 0,
      error: error || 'none'
    });

    if (!success) {
      console.error('❌ Failed to fetch snapshots:', error);
      return NextResponse.json(
        { error: error || 'Failed to fetch snapshots' },
        { status: 500 }
      );
    }

    console.log('✅ Snapshots fetched successfully');

    return NextResponse.json({ 
      success: true,
      snapshots: requests || []
    });

  } catch (error: any) {
    console.error('❌ GET snapshots error:', error.message);
    console.error('   Stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch snapshots' },
      { status: 500 }
    );
  }
} 
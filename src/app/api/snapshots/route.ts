import { NextRequest, NextResponse } from 'next/server';
import { createSnapshotRequest, triggerSnapshotProcessing } from '@/lib/snapshot-client';
import { createServiceRoleClient } from '@/lib/supabase/server';

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

    if (!userId) {
      console.error('❌ Missing userId');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    console.log('✅ Input validation passed');
    console.log(`   URLs: ${urls.length} provided`);
    console.log(`   Topic: "${topic}"`);
    console.log(`   User ID: ${userId}`);

    // Check if user has available snapshots before creating
    console.log('🔍 Checking user snapshot usage...');
    const serviceSupabase = createServiceRoleClient();
    
    const { data: billingPeriod, error: billingError } = await serviceSupabase
      .rpc('get_current_billing_period', { p_user_id: userId })
      .single() as { data: any, error: any };

    if (billingError || !billingPeriod) {
      console.error('❌ Failed to get billing period:', billingError);
      return NextResponse.json(
        { error: 'Unable to verify snapshot limits' },
        { status: 500 }
      );
    }

    const snapshotsUsed = billingPeriod.snapshots_used || 0;
    const snapshotsIncluded = billingPeriod.snapshots_included || 0;
    const snapshotsRemaining = billingPeriod.snapshots_remaining || 0;

    console.log('📊 Snapshot usage check:', {
      used: snapshotsUsed,
      included: snapshotsIncluded,
      remaining: snapshotsRemaining
    });

    if (snapshotsRemaining <= 0) {
      console.error('❌ Snapshot limit exceeded');
      return NextResponse.json(
        { 
          error: 'Snapshot limit exceeded',
          details: {
            used: snapshotsUsed,
            included: snapshotsIncluded,
            remaining: snapshotsRemaining
          }
        },
        { status: 402 } // Payment Required
      );
    }
    
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

    // Track usage in billing system
    console.log('📈 Tracking snapshot usage...');
    const { error: trackingError } = await serviceSupabase
      .rpc('track_usage_event', {
        p_user_id: userId,
        p_event_type: 'snapshot_created',
        p_amount: 1,
        p_metadata: { 
          snapshot_id: requestId,
          urls_count: urls.length,
          topic: topic
        }
      });

    if (trackingError) {
      console.error('⚠️ Warning: Failed to track usage:', trackingError);
      // Don't fail the request for tracking errors, but log it
    } else {
      console.log('✅ Usage tracked successfully');
    }
    
    // Return immediately and trigger processing in background
    console.log('🎉 Snapshot API completed successfully - returning immediately');
    
    // Trigger processing in background (don't await)
    setImmediate(() => {
      console.log('🔄 Triggering background processing for snapshot:', requestId);
      triggerSnapshotProcessing(userId, requestId)
        .then(result => {
          console.log('✅ Background processing trigger completed:', result);
        })
        .catch(error => {
          console.error('❌ Background processing trigger failed:', error.message);
        });
    });
    
    return NextResponse.json({ 
      success: true,
      requestId,
      message: 'Snapshot request created successfully',
      usage: {
        used: snapshotsUsed + 1,
        included: snapshotsIncluded,
        remaining: snapshotsRemaining - 1
      }
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
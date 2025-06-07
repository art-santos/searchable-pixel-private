import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { workspaceId } = await request.json()
    
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 })
    }

    const supabase = createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify workspace belongs to user
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id, domain')
      .eq('id', workspaceId)
      .eq('user_id', user.id)
      .single()

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Get visitor IP (for testing, we'll use a placeholder)
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const ip = forwarded?.split(',')[0] || realIP || '8.8.8.8' // Google DNS as fallback for testing

    // Simulate visitor data
    const testVisitorData = {
      v: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Test visitor ID
      w: workspaceId,
      u: `${workspace.domain}/test-page`,
      r: 'https://google.com',
      ua: request.headers.get('user-agent') || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Test Browser',
      tz: 'America/New_York',
      t: new Date().toISOString(),
      vp: { w: 1920, h: 1080 },
      sp: { w: 2560, h: 1440 }
    }

    console.log('🧪 TEST VISITOR TRACKED:', {
      workspaceId: workspaceId,
      domain: workspace.domain,
      visitorId: testVisitorData.v,
      url: testVisitorData.u,
      ip: ip,
      userAgent: testVisitorData.ua.substring(0, 100) + '...',
      timestamp: testVisitorData.t
    })

    // Simple IP geolocation for testing
    let locationData = null
    try {
      const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,regionName,city,lat,lon,timezone,isp,org,as,query`)
      if (response.ok) {
        const data = await response.json()
        locationData = data.status === 'success' ? data : null
      }
    } catch (error) {
      console.warn('Geolocation test failed:', error)
    }

    console.log('🌍 TEST LOCATION DATA:', locationData)

    // Basic company identification for testing
    const companyData = {
      company: locationData?.org || locationData?.isp || 'Test Company Inc.',
      confidence: 'test'
    }

    console.log('🏢 TEST COMPANY DATA:', companyData)

    // Enhanced test data
    const enrichedTestData = {
      // Core tracking data
      visitorId: testVisitorData.v,
      workspaceId: workspaceId,
      url: testVisitorData.u,
      referrer: testVisitorData.r,
      userAgent: testVisitorData.ua,
      timestamp: testVisitorData.t,
      timezone: testVisitorData.tz,
      
      // Device/browser info
      viewport: testVisitorData.vp,
      screen: testVisitorData.sp,
      
      // Network/location info
      ipAddress: ip,
      location: locationData ? {
        country: locationData.country,
        countryCode: locationData.countryCode,
        region: locationData.regionName,
        city: locationData.city,
        latitude: locationData.lat,
        longitude: locationData.lon,
        timezone: locationData.timezone,
        isp: locationData.isp
      } : null,
      
      // Company identification
      company: companyData.company,
      confidence: companyData.confidence,
      
      // Test flags
      isTest: true,
      testType: 'dashboard_simulation'
    }

    console.log('✨ TEST ENRICHED VISITOR DATA:', JSON.stringify(enrichedTestData, null, 2))

    // Store test event for verification
    await supabase
      .from('usage_events')
      .insert({
        user_id: user.id,
        event_type: 'visitor_tracked',
        metadata: {
          workspace_id: workspaceId,
          visitor_id: testVisitorData.v,
          url: testVisitorData.u,
          ip: ip,
          timestamp: testVisitorData.t,
          test: true
        }
      })

    return NextResponse.json({ 
      success: true,
      data: enrichedTestData,
      message: 'Test visitor data simulated successfully'
    })

  } catch (error) {
    console.error('❌ Error in test tracking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface VisitorData {
  v: string    // visitor ID
  w: string    // workspace ID
  u: string    // URL
  r: string    // referrer
  ua: string   // user agent
  tz: string   // timezone
  t: string    // timestamp
  vp: { w: number, h: number }  // viewport
  sp: { w: number, h: number }  // screen
}

// Simple IP geolocation using a free service
async function getLocationFromIP(ip: string) {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,regionName,city,lat,lon,timezone,isp,org,as,query`)
    if (response.ok) {
      const data = await response.json()
      return data.status === 'success' ? data : null
    }
  } catch (error) {
    console.error('Geolocation lookup failed:', error)
  }
  return null
}

// Extract company info from IP (placeholder - will expand later)
async function getCompanyFromIP(ip: string, locationData: any) {
  // For now, we'll just return the ISP/organization info
  // Later this can be enhanced with services like Clearbit Reveal
  return {
    company: locationData?.org || locationData?.isp || null,
    confidence: locationData?.org ? 'medium' : 'low'
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get visitor IP
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const ip = forwarded?.split(',')[0] || realIP || '127.0.0.1'

    // Parse visitor data
    const visitorData: VisitorData = await request.json()
    
    console.log('🔍 New visitor tracked:', {
      visitorId: visitorData.v,
      workspaceId: visitorData.w,
      url: visitorData.u,
      ip: ip,
      userAgent: visitorData.ua?.substring(0, 100) + '...',
      timestamp: visitorData.t
    })

    // Get location data
    const locationData = await getLocationFromIP(ip)
    console.log('📍 Location data:', locationData)

    // Attempt company identification
    const companyData = await getCompanyFromIP(ip, locationData)
    console.log('🏢 Company data:', companyData)

    // Enhanced visitor information
    const enrichedData = {
      // Core tracking data
      visitorId: visitorData.v,
      workspaceId: visitorData.w,
      url: visitorData.u,
      referrer: visitorData.r,
      userAgent: visitorData.ua,
      timestamp: visitorData.t,
      timezone: visitorData.tz,
      
      // Device/browser info
      viewport: visitorData.vp,
      screen: visitorData.sp,
      
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
      
      // Company identification (basic for now)
      company: companyData.company,
      confidence: companyData.confidence,
      
      // Session info (can be enhanced later)
      sessionStart: visitorData.t,
      pageViews: 1 // This visit
    }

    console.log('✨ Enriched visitor data:', JSON.stringify(enrichedData, null, 2))

    // TODO: Store in database once schema is ready
    // For now, we'll just log and maybe store basic info for connection verification

    // Verify workspace exists and user has access
    const supabase = createClient()
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id, user_id, domain')
      .eq('id', visitorData.w)
      .single()

    if (workspace) {
      console.log('✅ Workspace verified:', workspace.domain)
      
      // Store connection verification (simple approach)
      // We could use this to verify the connection is working
      await supabase
        .from('usage_events')
        .insert({
          user_id: workspace.user_id,
          event_type: 'visitor_tracked',
          metadata: {
            workspace_id: visitorData.w,
            visitor_id: visitorData.v,
            url: visitorData.u,
            ip: ip,
            timestamp: visitorData.t
          }
        })
        .select()
    } else {
      console.warn('⚠️  Workspace not found:', visitorData.w)
    }

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    console.error('❌ Error processing visitor data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
} 
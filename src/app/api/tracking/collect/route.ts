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

// Extract company info from IP using IPInfo
async function getCompanyFromIP(ip: string) {
  try {
    // Use IPInfo for better company detection
    const response = await fetch(`https://ipinfo.io/${ip}/json?token=${process.env.IPINFO_API_KEY}`)
    if (response.ok) {
      const data = await response.json()
      
      // Check if it's a business/hosting provider
      const isBusinessIP = data.company && 
        !data.org?.toLowerCase().includes('residential') &&
        !data.org?.toLowerCase().includes('broadband') &&
        !data.org?.toLowerCase().includes('telecom');
      
      return {
        company: data.company?.name || data.org || null,
        domain: data.company?.domain || null,
        type: data.company?.type || (data.asn?.type === 'hosting' ? 'hosting' : 'isp'),
        confidence: data.company ? 'high' : (isBusinessIP ? 'medium' : 'low'),
        location: {
          city: data.city,
          region: data.region,
          country: data.country
        }
      }
    }
  } catch (error) {
    console.error('IPInfo lookup failed:', error)
  }
  
  return {
    company: null,
    confidence: 'low'
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

    // Get location data (optional, we can use IPInfo for everything)
    const locationData = await getLocationFromIP(ip)
    console.log('📍 Location data:', locationData)

    // Get company data from IPInfo (better data quality)
    const companyData = await getCompanyFromIP(ip)
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

    // Verify workspace exists and user has access
    const supabase = createClient()
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id, user_id, domain')
      .eq('id', visitorData.w)
      .single()

    if (!workspace) {
      console.warn('⚠️  Workspace not found:', visitorData.w)
      return NextResponse.json({ error: 'Invalid workspace' }, { status: 400 })
    }

    console.log('✅ Workspace verified:', workspace.domain)

    // Parse URL parameters for attribution
    const url = new URL(visitorData.u)
    const utm_source = url.searchParams.get('utm_source')
    const utm_medium = url.searchParams.get('utm_medium')
    const utm_campaign = url.searchParams.get('utm_campaign')

    // Save to user_visits table
    const { data: userVisit, error: visitError } = await supabase
      .from('user_visits')
      .insert({
        workspace_id: visitorData.w,
        ip_address: ip,
        page_url: visitorData.u,
        referrer: visitorData.r || null,
        utm_source,
        utm_medium,
        utm_campaign,
        enrichment_status: 'pending',
        session_duration: 0,
        pages_viewed: 1,
        country: locationData?.countryCode || null,
        city: locationData?.city || null,
        region: locationData?.regionName || null
      })
      .select()
      .single()

    if (visitError) {
      console.error('❌ Failed to save visit:', visitError)
      return NextResponse.json({ error: 'Failed to save visit' }, { status: 500 })
    }

    console.log('✅ Visit saved:', userVisit.id)

    // Trigger enrichment if this looks like a business IP
    const isBusinessIP = companyData.company && 
      (companyData.confidence === 'high' || companyData.confidence === 'medium') &&
      companyData.type !== 'isp'
      
    if (isBusinessIP) {
      console.log('🏢 Business IP detected, triggering enrichment...')
      console.log(`   Company: ${companyData.company}`)
      console.log(`   Domain: ${companyData.domain}`)
      console.log(`   Confidence: ${companyData.confidence}`)
      
      // Update visit with company info
      await supabase
        .from('user_visits')
        .update({
          company_name: companyData.company,
          company_domain: companyData.domain,
          enrichment_status: 'processing'
        })
        .eq('id', userVisit.id)
      
      // Call the websets enrichment endpoint asynchronously
      // Don't wait for response to keep tracking fast
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/leads/enrich-websets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userVisitId: userVisit.id,
          icpDescription: 'Senior executive or decision maker',
          internalApiKey: process.env.INTERNAL_API_KEY
        })
      }).then(response => {
        if (response.ok) {
          response.json().then(result => {
            console.log('✅ Enrichment completed:', result.status)
          })
        } else {
          console.warn('⚠️  Enrichment failed:', response.status)
        }
      }).catch(error => {
        console.error('❌ Error triggering enrichment:', error)
      })
    } else {
      console.log('ℹ️  Not a business IP, skipping enrichment')
      console.log(`   Company: ${companyData.company || 'none'}`)
      console.log(`   Type: ${companyData.type}`)
      console.log(`   Confidence: ${companyData.confidence}`)
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
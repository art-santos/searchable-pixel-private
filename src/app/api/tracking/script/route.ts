import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspace')
  
  if (!workspaceId) {
    return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 })
  }

  // Generate the tracking script
  const script = `
!function(){
  const VISITOR_ID_KEY="_splitid";
  const API_ENDPOINT="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tracking/collect";
  const WORKSPACE_ID="${workspaceId}";
  
  // Get or create visitor ID
  const visitorId = (document.cookie.match("(^|;)\\\\s*"+VISITOR_ID_KEY+"=([^;]*)")||[])[2] || crypto.randomUUID();
  
  // Set cookie with visitor ID
  document.cookie = VISITOR_ID_KEY+"="+visitorId+";path=/;max-age=31536000;SameSite=Lax"+(location.protocol==="https:"?";Secure":"");
  
  // Collect visitor data
  const data = {
    v: visitorId,
    w: WORKSPACE_ID,
    u: location.href,
    r: document.referrer,
    ua: navigator.userAgent,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    t: new Date().toISOString(),
    vp: {w: window.innerWidth, h: window.innerHeight},
    sp: {w: screen.width, h: screen.height}
  };
  
  // Send data using sendBeacon for reliability
  if (navigator.sendBeacon) {
    navigator.sendBeacon(API_ENDPOINT, JSON.stringify(data));
  } else {
    // Fallback for older browsers
    fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data),
      keepalive: true
    }).catch(function(){});
  }
}();`

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=300', // 5 minutes cache
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
} 
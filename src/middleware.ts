import { NextResponse, type NextRequest } from 'next/server'
import { isAiCrawler } from "@/lib/ai"
import { createClient } from '@/lib/supabase/middleware'
import { checkRouteAccess } from '@/lib/subscription/route-config'
import { PlanType } from '@/lib/subscription/config'
import { createClient as createServerClient } from '@/lib/supabase/server'

// Cache for API key to avoid frequent DB lookups
let cachedApiKey: string | null = null
let cacheExpiry: number = 0

async function getSystemApiKey(): Promise<string | null> {
  try {
    // Check cache first
    if (cachedApiKey && Date.now() < cacheExpiry) {
      return cachedApiKey
    }
    
    const supabase = await createServerClient()
    
    // First, try to get an existing API key for the admin user
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_admin', true)
      .limit(1)
      .single()
    
    if (!adminProfile) {
      console.error('[CRAWLER-TRACKING] No admin user found')
      return null
    }
    
    // Check for existing workspace API key
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id')
      .eq('user_id', adminProfile.id)
      .eq('is_primary', true)
      .single()
    
    if (workspaces) {
      const { data: apiKey } = await supabase
        .from('workspace_api_keys')
        .select('api_key')
        .eq('workspace_id', workspaces.id)
        .eq('name', 'System Crawler Tracking')
        .eq('is_active', true)
        .single()
      
      if (apiKey) {
        cachedApiKey = apiKey.api_key
        cacheExpiry = Date.now() + 3600000 // Cache for 1 hour
        return cachedApiKey
      }
    }
    
    // Fall back to user API key
    const { data: userApiKey } = await supabase
      .from('api_keys')
      .select('key')
      .eq('user_id', adminProfile.id)
      .eq('name', 'System Crawler Tracking')
      .eq('is_active', true)
      .single()
    
    if (userApiKey) {
      cachedApiKey = userApiKey.key
      cacheExpiry = Date.now() + 3600000 // Cache for 1 hour
      return cachedApiKey
    }
    
    console.warn('[CRAWLER-TRACKING] No system API key found')
    return null
  } catch (error) {
    console.error('[CRAWLER-TRACKING] Error getting API key:', error)
    return null
  }
}

// Track crawler visits using the system's own API
async function trackCrawlerVisit(request: NextRequest, userAgent: string) {
  try {
    const apiKey = await getSystemApiKey()
    if (!apiKey) {
      console.warn('[CRAWLER-TRACKING] No API key available, skipping tracking')
      return
    }
    
    // Extract crawler info
    const crawlerInfo = getCrawlerInfo(userAgent)
    if (!crawlerInfo) return
    
    const event = {
      url: request.url,
      userAgent: userAgent,
      crawler: crawlerInfo,
      timestamp: new Date().toISOString(),
      metadata: {
        method: request.method,
        pathname: request.nextUrl.pathname,
        host: request.nextUrl.host
      }
    }
    
    // Send to our own API
    const apiUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000/api/crawler-events'
      : `${request.nextUrl.origin}/api/crawler-events`
    
    // Use fetch without await to avoid blocking the response
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ events: [event] })
    }).then(response => {
      if (response.ok) {
        console.log('[CRAWLER-TRACKING] Successfully tracked:', crawlerInfo.name, request.nextUrl.pathname)
      } else {
        console.error('[CRAWLER-TRACKING] Failed with status:', response.status)
      }
    }).catch(err => {
      console.error('[CRAWLER-TRACKING] Failed to track:', err)
    })
    
  } catch (error) {
    console.error('[CRAWLER-TRACKING] Error:', error)
  }
}

// Simplified crawler detection
function getCrawlerInfo(userAgent: string) {
  const crawlers = {
    'GPTBot': { name: 'GPTBot', company: 'OpenAI', category: 'ai-training' },
    'ChatGPT-User': { name: 'ChatGPT-User', company: 'OpenAI', category: 'ai-assistant' },
    'Claude-Web': { name: 'Claude-Web', company: 'Anthropic', category: 'ai-assistant' },
    'ClaudeBot': { name: 'ClaudeBot', company: 'Anthropic', category: 'ai-training' },
    'PerplexityBot': { name: 'PerplexityBot', company: 'Perplexity', category: 'ai-search' },
    'Google-Extended': { name: 'Google-Extended', company: 'Google', category: 'ai-training' },
    'Bingbot': { name: 'Bingbot', company: 'Microsoft', category: 'search-ai' },
    'FacebookBot': { name: 'FacebookBot', company: 'Meta', category: 'social-ai' },
    'Bytespider': { name: 'Bytespider', company: 'ByteDance', category: 'ai-training' },
  }
  
  for (const [key, info] of Object.entries(crawlers)) {
    if (userAgent.includes(key)) {
      return info
    }
  }
  
  return null
}

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    
    // Skip middleware for Stripe webhook - it needs raw body access
    if (pathname === '/api/stripe/webhook') {
      return NextResponse.next();
    }
    
    // Skip tracking for API routes to avoid loops
    if (pathname.startsWith('/api/')) {
      const { supabase, response } = createClient(request)
      await supabase.auth.getUser()
      return response
    }
    
    const { supabase, response } = createClient(request)
    await supabase.auth.getUser()
    
    const ua = request.headers.get("user-agent") ?? "";
    if (isAiCrawler(ua)) {
      console.log("[AI-CRAWLER]", ua, request.nextUrl.pathname);
      // Actually track the crawler visit (non-blocking)
      trackCrawlerVisit(request, ua)
    }

    const { data: { user } } = await supabase.auth.getUser();

    // Allow public access to image files
    if (pathname.match(/\.(jpg|jpeg|png|gif|ico|svg|webp)$/i)) {
      return NextResponse.next();
    }

    // Normalize article URLs to lowercase to prevent 404s
    if (pathname.startsWith('/article/')) {
      const originalSlug = pathname.replace('/article/', '');
      const normalizedSlug = originalSlug.toLowerCase();
      
      if (normalizedSlug !== originalSlug) {
        console.log(`[MIDDLEWARE] Redirecting article: ${originalSlug} → ${normalizedSlug}`);
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = `/article/${normalizedSlug}`;
        
        const response = NextResponse.redirect(redirectUrl);
        response.headers.set('Cache-Control', 'no-store, no-cache, max-age=0, must-revalidate');
        response.headers.set('Pragma', 'no-cache');
        return response;
      }
    }

    // If user is not logged in and tries to access protected routes, redirect to login
    if (!user && isProtectedRoute(pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set(`redirectedFrom`, pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // If user IS logged in and tries to access /login, redirect to /dashboard
    if (user && pathname === '/login') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/dashboard';
      return NextResponse.redirect(redirectUrl);
    }

    // Subscription-based route protection
    if (user) {
      // Get user's subscription plan from centralized table
      const { data: subscriptionData } = await supabase
        .rpc('get_user_subscription', { p_user_id: user.id })
        .single()
      
      // Cast to any to avoid TypeScript errors
      const subscription = subscriptionData as any
      
      // Fallback to profiles table if centralized data not available
      let userPlan: PlanType = 'starter'
      
      if (subscription?.plan_type) {
        userPlan = subscription.plan_type as PlanType
      } else {
        // Fallback to profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_plan, is_admin')
          .eq('id', user.id)
          .single()
        
        if (profile?.is_admin) {
          userPlan = 'admin' as PlanType
        } else {
          userPlan = (profile?.subscription_plan || 'starter') as PlanType
        }
      }
      
      // Check route access
      const accessCheck = checkRouteAccess(pathname, userPlan)
      
      if (accessCheck.shouldRedirect) {
        // Hard block - redirect to settings page with upgrade dialog params
        console.log(`[MIDDLEWARE] Access denied for ${pathname} - Plan: ${userPlan}, Required: ${accessCheck.config?.requiredPlan}`)
        
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/settings';
        
        // Add parameters for the upgrade dialog
        redirectUrl.searchParams.set('tab', 'billing'); // Select billing tab
        redirectUrl.searchParams.set('showUpgrade', 'true'); // Show upgrade dialog
        redirectUrl.searchParams.set('feature', accessCheck.config?.feature || '');
        redirectUrl.searchParams.set('requiredPlan', accessCheck.config?.requiredPlan || '');
        redirectUrl.searchParams.set('fromPath', pathname); // Track where they came from
        
        return NextResponse.redirect(redirectUrl);
      }
      
      // For soft blocks, add headers so the page can show upgrade UI
      if (accessCheck.config && accessCheck.config.softBlock && !accessCheck.allowed) {
        console.log(`[MIDDLEWARE] Soft block for ${pathname} - Plan: ${userPlan}`)
        
        response.headers.set('X-Subscription-Soft-Block', 'true');
        response.headers.set('X-Required-Plan', accessCheck.config.requiredPlan || '');
        response.headers.set('X-Feature', accessCheck.config.feature || '');
      }
      
      // Add user's plan to headers for client-side checks
      response.headers.set('X-User-Plan', userPlan);
    }

    return response;
  } catch (e) {
    console.error('Error in Supabase middleware:', e);
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
}

// Fixed function name and added more specific route protection
function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/settings',
    '/api-keys',
    '/domains',
    '/analytics'
  ];
  
  return protectedRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 
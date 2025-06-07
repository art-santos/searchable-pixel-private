import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create service role client for server-side operations that bypass RLS
let supabaseServiceRole: any = null

try {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('[Tracking Pixel] Missing NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[Tracking Pixel] Missing SUPABASE_SERVICE_ROLE_KEY')
  }
  
  supabaseServiceRole = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
  console.log('[Tracking Pixel] Service role client initialized successfully')
} catch (error) {
  console.error('[Tracking Pixel] Failed to initialize service role client:', error)
}

// Crawler detection function (same as in middleware.ts)
function getCrawlerInfo(userAgent: string | null) {
  if (!userAgent) return null
  
  const crawlers = {
    'GPTBot': { name: 'GPTBot', company: 'OpenAI', category: 'ai-training' },
    'ChatGPT-User': { name: 'ChatGPT-User', company: 'OpenAI', category: 'ai-assistant' },
    'OAI-SearchBot': { name: 'OAI-SearchBot', company: 'OpenAI', category: 'ai-search' },
    'Claude-Web': { name: 'Claude-Web', company: 'Anthropic', category: 'ai-assistant' },
    'ClaudeBot': { name: 'ClaudeBot', company: 'Anthropic', category: 'ai-training' },
    'anthropic-ai': { name: 'anthropic-ai', company: 'Anthropic', category: 'ai-training' },
    'PerplexityBot': { name: 'PerplexityBot', company: 'Perplexity', category: 'ai-search' },
    'Google-Extended': { name: 'Google-Extended', company: 'Google', category: 'ai-training' },
    'Googlebot': { name: 'Googlebot', company: 'Google', category: 'search-ai' },
    'Bingbot': { name: 'Bingbot', company: 'Microsoft', category: 'search-ai' },
    'msnbot': { name: 'msnbot', company: 'Microsoft', category: 'search-ai' },
    'FacebookBot': { name: 'FacebookBot', company: 'Meta', category: 'social-ai' },
    'Meta-ExternalAgent': { name: 'Meta-ExternalAgent', company: 'Meta', category: 'ai-training' },
    'YouBot': { name: 'YouBot', company: 'You.com', category: 'ai-search' },
    'Bytespider': { name: 'Bytespider', company: 'ByteDance', category: 'ai-training' },
    'Baiduspider': { name: 'Baiduspider', company: 'Baidu', category: 'search-ai' },
    'Amazonbot': { name: 'Amazonbot', company: 'Amazon', category: 'ai-assistant' },
    'LinkedInBot': { name: 'LinkedInBot', company: 'LinkedIn', category: 'social-ai' },
    'Applebot': { name: 'Applebot', company: 'Apple', category: 'search-ai' },
    'Applebot-Extended': { name: 'Applebot-Extended', company: 'Apple', category: 'ai-training' },
    'CCBot': { name: 'CCBot', company: 'Common Crawl', category: 'ai-training' },
    'PetalBot': { name: 'PetalBot', company: 'Petal Search', category: 'search-ai' },
    'YandexBot': { name: 'YandexBot', company: 'Yandex', category: 'search-ai' },
    'DuckDuckBot': { name: 'DuckDuckBot', company: 'DuckDuckGo', category: 'search-ai' }
  }
  
  for (const [key, info] of Object.entries(crawlers)) {
    if (userAgent.includes(key)) {
      return info
    }
  }
  
  return null
}

// 1x1 transparent GIF in base64
const TRANSPARENT_GIF = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
const TRANSPARENT_GIF_BUFFER = Buffer.from(TRANSPARENT_GIF, 'base64')

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const startTime = Date.now()
  const requestId = Math.random().toString(36).substring(7)
  
  try {
    const { workspaceId } = await params
    const userAgent = request.headers.get('user-agent')
    const referer = request.headers.get('referer')
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const url = request.nextUrl.searchParams.get('url') || referer || 'unknown'
    const page = request.nextUrl.searchParams.get('page') || ''
    const campaign = request.nextUrl.searchParams.get('c') || ''
    
    console.log(`[Tracking Pixel ${requestId}] 🔥 INCOMING REQUEST`)
    console.log(`[Tracking Pixel ${requestId}] Workspace: ${workspaceId}`)
    console.log(`[Tracking Pixel ${requestId}] IP: ${ip}`)
    console.log(`[Tracking Pixel ${requestId}] User-Agent: ${userAgent}`)
    console.log(`[Tracking Pixel ${requestId}] Referer: ${referer}`)
    console.log(`[Tracking Pixel ${requestId}] URL param: ${url}`)
    console.log(`[Tracking Pixel ${requestId}] Page param: ${page}`)
    console.log(`[Tracking Pixel ${requestId}] Campaign param: ${campaign}`)

    // Detect AI crawler
    const crawlerInfo = getCrawlerInfo(userAgent)
    
    if (crawlerInfo) {
      console.log(`[Tracking Pixel ${requestId}] 🤖 AI Crawler detected: ${crawlerInfo.name} (${crawlerInfo.company})`)
      
      // Check if service role client is available
      if (!supabaseServiceRole) {
        console.error(`[Tracking Pixel ${requestId}] ❌ Service role client not initialized`)
        return new Response(TRANSPARENT_GIF_BUFFER, {
          headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Content-Length': '43',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'User-Agent, Referer'
          }
        })
      }
      
      // Get workspace and user info - using service role client to bypass RLS
      console.log(`[Tracking Pixel ${requestId}] 📊 Looking up workspace...`)
      
      try {
        const { data: workspace, error: workspaceError } = await supabaseServiceRole
          .from('workspaces')
          .select('id, user_id, domain, workspace_name')
          .eq('id', workspaceId)
          .single()
        
        if (workspaceError) {
          console.error(`[Tracking Pixel ${requestId}] ❌ Workspace query error:`, workspaceError)
          console.log(`[Tracking Pixel ${requestId}] 🔍 Trying alternative workspace lookup...`)
          
          // Try a broader query to see if workspace exists at all
          const { data: allWorkspaces, error: listError } = await supabaseServiceRole
            .from('workspaces')
            .select('id, workspace_name')
            .eq('id', workspaceId)
          
          console.log(`[Tracking Pixel ${requestId}] 📋 Workspace query result:`, { allWorkspaces, listError })
        }
        
        if (workspaceError || !workspace) {
          console.error(`[Tracking Pixel ${requestId}] ❌ Workspace not found: ${workspaceId}`, workspaceError)
          return new Response(TRANSPARENT_GIF_BUFFER, {
            headers: {
              'Content-Type': 'image/gif',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Content-Length': '43',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET',
              'Access-Control-Allow-Headers': 'User-Agent, Referer'
            }
          })
        }
        
        console.log(`[Tracking Pixel ${requestId}] ✅ Workspace found: ${workspace.workspace_name} (${workspace.domain})`)
        
        // Parse URL to extract domain and path
        let domain = workspace.domain
        let path = '/'
        
        try {
          const parsedUrl = new URL(url)
          domain = parsedUrl.hostname
          path = parsedUrl.pathname
        } catch (e) {
          // If URL parsing fails, use referer or fallback
          if (referer) {
            try {
              const parsedReferer = new URL(referer)
              domain = parsedReferer.hostname
              path = parsedReferer.pathname
            } catch (e2) {
              // Use workspace domain as fallback
            }
          }
        }
        
        console.log(`[Tracking Pixel ${requestId}] 🌐 Domain: ${domain}, Path: ${path}`)
        
        // Track the crawler visit
        const crawlerVisit = {
          user_id: workspace.user_id,
          workspace_id: workspace.id,
          domain: domain,
          path: path,
          crawler_name: crawlerInfo.name,
          crawler_company: crawlerInfo.company,
          crawler_category: crawlerInfo.category,
          user_agent: userAgent || '',
          timestamp: new Date().toISOString(),
          status_code: 200,
          response_time_ms: null, // Will be calculated at the end
          country: null, // Could be enhanced with IP geolocation
          metadata: {
            source: 'tracking_pixel',
            page: page,
            campaign: campaign,
            referer: referer,
            tracking_method: 'html_pixel',
            pixel_load_time: null as number | null, // Will be set below
            request_id: requestId,
            ip_address: ip
          }
        }
        
        // Calculate response time before database insert
        const responseTime = Date.now() - startTime
        if (crawlerVisit.metadata) {
          crawlerVisit.metadata.pixel_load_time = responseTime
        }
        
        console.log(`[Tracking Pixel ${requestId}] 💾 Inserting crawler visit to database...`)
        
        // Insert into database (non-blocking)
        const insertVisit = async () => {
          try {
            const { error } = await supabaseServiceRole
              .from('crawler_visits')
              .insert(crawlerVisit)
            
            if (error) {
              console.error(`[Tracking Pixel ${requestId}] ❌ Failed to insert visit:`, error)
            } else {
              console.log(`[Tracking Pixel ${requestId}] ✅ Successfully tracked ${crawlerInfo.name} visit`)
            }
          } catch (err: any) {
            console.error(`[Tracking Pixel ${requestId}] ❌ Database error:`, err)
          }
        }
        
        // Execute insert without blocking response
        insertVisit()
        
        console.log(`[Tracking Pixel ${requestId}] 📊 Pixel served in ${responseTime}ms`)
        
      } catch (dbError) {
        console.error(`[Tracking Pixel ${requestId}] ❌ Database connection error:`, dbError)
      }
    } else {
      console.log(`[Tracking Pixel ${requestId}] 👤 Human visitor (not an AI crawler)`)
    }
    
    // Always return the transparent GIF
    return new Response(TRANSPARENT_GIF_BUFFER, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Content-Length': '43',
        'Access-Control-Allow-Origin': '*', // Allow cross-origin requests
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'User-Agent, Referer'
      }
    })
    
  } catch (error) {
    console.error(`[Tracking Pixel] ❌ Error:`, error)
    
    // Always return the pixel even on error
    return new Response(TRANSPARENT_GIF_BUFFER, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Length': '43'
      }
    })
  }
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'User-Agent, Referer',
    }
  })
} 
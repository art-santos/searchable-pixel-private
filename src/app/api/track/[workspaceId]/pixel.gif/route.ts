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

// Enhanced function to detect human visitors from AI platforms
function detectAITrafficSource(referer: string | null, userAgent: string | null): 
  { isFromAI: boolean; sourceInfo?: { platform: string; aiSource: string; category: string } } {
  
  if (!referer || !userAgent) return { isFromAI: false }
  
  // Check if this is a human user agent (not an AI crawler)
  const isHumanUA = userAgent.includes('Mozilla') && 
                    !getCrawlerInfo(userAgent) &&
                    (userAgent.includes('Chrome') || userAgent.includes('Safari') || userAgent.includes('Firefox'))
  
  if (!isHumanUA) return { isFromAI: false }
  
  // Known patterns for AI-originated traffic
  const aiPlatforms = {
    'chat.openai.com': { platform: 'ChatGPT', aiSource: 'OpenAI', category: 'ai-chat' },
    'perplexity.ai': { platform: 'Perplexity', aiSource: 'Perplexity', category: 'ai-search' },
    'claude.ai': { platform: 'Claude', aiSource: 'Anthropic', category: 'ai-chat' },
    'bard.google.com': { platform: 'Bard', aiSource: 'Google', category: 'ai-chat' },
    'gemini.google.com': { platform: 'Gemini', aiSource: 'Google', category: 'ai-chat' },
    'copilot.microsoft.com': { platform: 'Copilot', aiSource: 'Microsoft', category: 'ai-assistant' },
    'bing.com/chat': { platform: 'Bing Chat', aiSource: 'Microsoft', category: 'ai-search' },
    'you.com': { platform: 'You.com', aiSource: 'You.com', category: 'ai-search' }
  }
  
  try {
    const refererUrl = new URL(referer)
    const refererHost = refererUrl.hostname.toLowerCase()
    
    for (const [pattern, info] of Object.entries(aiPlatforms)) {
      if (refererHost === pattern || refererHost.includes(pattern)) {
        return { isFromAI: true, sourceInfo: info }
      }
    }
  } catch (e) {
    // Invalid URL, continue with other checks
  }
  
  return { isFromAI: false }
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
    
    // Silently ignore placeholder workspace IDs from documentation
    if (workspaceId === 'YOUR_WORKSPACE_ID' || workspaceId === 'workspace-id') {
      return new Response(TRANSPARENT_GIF_BUFFER, {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Length': '43',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
    
    // Detect AI crawler and AI traffic source
    const crawlerInfo = getCrawlerInfo(userAgent)
    const aiTrafficSource = detectAITrafficSource(referer, userAgent)
    
    // Parse URL to extract domain and path early for logging
    let domain = 'unknown'
    let path = '/'
    
    try {
      const parsedUrl = new URL(url)
      domain = parsedUrl.hostname
      path = parsedUrl.pathname
    } catch (e) {
      if (referer) {
        try {
          const parsedReferer = new URL(referer)
          domain = parsedReferer.hostname
          path = parsedReferer.pathname
        } catch (e2) {
          // Use unknown as fallback
          domain = 'unknown'
        }
      }
    }
    
    // Differentiated logging based on visitor type
    if (crawlerInfo) {
      // AI Crawler - show detailed info with visual separators
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`[TP ${requestId}] 🤖 AI CRAWLER: ${crawlerInfo.name} (${crawlerInfo.company})`)
      console.log(`[TP ${requestId}] 📍 Tracking Pixel URL: ${url}`)
      console.log(`[TP ${requestId}] 📄 Tracking Pixel Page: ${page || 'not specified'}`)
      console.log(`[TP ${requestId}] 🎯 Campaign: ${campaign || 'none'}`)
      console.log(`[TP ${requestId}] 🌐 Domain: ${domain}`)
      console.log(`[TP ${requestId}] 📱 Category: ${crawlerInfo.category}`)
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    } else if (aiTrafficSource.isFromAI && aiTrafficSource.sourceInfo) {
      // AI-to-human conversion - use fire emoji borders
      console.log(`🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥`)
      console.log(`[TP ${requestId}] 🏆💰 HIGH-VALUE CONVERSION: ${aiTrafficSource.sourceInfo.platform} → Human`)
      console.log(`[TP ${requestId}] 📍 Tracking Pixel URL: ${url}`)
      console.log(`[TP ${requestId}] 📄 Tracking Pixel Page: ${page || 'not specified'}`)
      console.log(`[TP ${requestId}] 🎯 Campaign: ${campaign || 'none'}`)
      console.log(`[TP ${requestId}] 🌐 AI Source: ${aiTrafficSource.sourceInfo.aiSource}`)
      console.log(`[TP ${requestId}] 🔄 Referer: ${referer}`)
      console.log(`🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥`)
    } else {
      // Regular human visitor - subtle one-line log
      try {
        const logPath = page || new URL(url).pathname
        console.log(`[TP ${requestId}] visitor • ${ip} • ${logPath} • ${campaign || 'none'}`)
      } catch (e) {
        console.log(`[TP ${requestId}] visitor • ${ip} • ${page || path} • ${campaign || 'none'}`)
      }
    }
    
    // Check if service role client is available
    if (!supabaseServiceRole) {
      console.error(`[Tracking Pixel ${requestId}] ❌ Service role client not initialized`)
      return new Response(TRANSPARENT_GIF_BUFFER, {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Length': '43',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
    
    // Only proceed with database operations if we have something to track
    if (crawlerInfo || aiTrafficSource.isFromAI) {
      if (crawlerInfo) {
        console.log(`[Tracking Pixel ${requestId}] 🤖 AI Crawler detected: ${crawlerInfo.name} (${crawlerInfo.company})`)
      }
      
      if (aiTrafficSource.isFromAI && aiTrafficSource.sourceInfo) {
        console.log(`[Tracking Pixel ${requestId}] 🏆 HUMAN FROM AI DETECTED: ${aiTrafficSource.sourceInfo.platform}`)
      }
      
      // Get workspace info
      const { data: workspace, error: workspaceError } = await supabaseServiceRole
        .from('workspaces')
        .select('id, user_id, domain, workspace_name')
        .eq('id', workspaceId)
        .single()
      
      if (workspaceError || !workspace) {
        console.error(`[Tracking Pixel ${requestId}] ❌ Workspace not found: ${workspaceId}`)
        return new Response(TRANSPARENT_GIF_BUFFER, {
          headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Content-Length': '43'
          }
        })
      }
      
      // Use domain and path from earlier parsing, fallback to workspace domain if needed
      if (domain === 'unknown') {
        domain = workspace.domain
      }
      
      if (crawlerInfo) {
        // This is an AI crawler visit
        console.log(`[Tracking Pixel ${requestId}] 🤖 AI Crawler detected: ${crawlerInfo.name}`)
        
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
          response_time_ms: null,
          country: null,
          metadata: {
            source: 'tracking_pixel',
            page: page,
            campaign: campaign,
            referer: referer,
            tracking_method: 'html_pixel',
            pixel_load_time: Date.now() - startTime,
            request_id: requestId,
            ip_address: ip
          }
        }
        
        // Insert into database (non-blocking)
        const insertVisit = async () => {
          try {
            const { data, error } = await supabaseServiceRole
              .from('crawler_visits')
              .insert(crawlerVisit)
              .select();

            if (error) {
              console.error(`[Tracking Pixel ${requestId}] ❌ Failed to insert visit:`, error);
            } else {
              console.log(`[Tracking Pixel ${requestId}] ✅ Successfully tracked ${crawlerInfo.name} visit`);
              if (data && data.length > 0) {
                const channel = supabaseServiceRole.channel(`workspace-${workspace.id}`);
                channel.subscribe((status) => {
                  if (status === 'SUBSCRIBED') {
                    channel.send({
                      type: 'broadcast',
                      event: 'new_visit',
                      payload: { visit: data[0] },
                    });
                  }
                });
              }
            }
          } catch (err: any) {
            console.error(`[Tracking Pixel ${requestId}] ❌ Database error:`, err);
          }
        };
        
        // Execute insert without blocking response
        insertVisit()
        
      } else if (aiTrafficSource.isFromAI && aiTrafficSource.sourceInfo) {
        // This is a human visitor from an AI platform - GOLD MINE! 🏆
        console.log(`[Tracking Pixel ${requestId}] 🏆 HUMAN FROM AI DETECTED: ${aiTrafficSource.sourceInfo.platform}`)
        
        const aiConversionEvent = {
          user_id: workspace.user_id,
          workspace_id: workspace.id,
          domain: domain,
          path: path,
          crawler_name: `${aiTrafficSource.sourceInfo.platform} → Human`,
          crawler_company: aiTrafficSource.sourceInfo.aiSource,
          crawler_category: 'ai-to-human-conversion',
          user_agent: userAgent || '',
          timestamp: new Date().toISOString(),
          status_code: 200,
          response_time_ms: null,
          country: null,
          metadata: {
            source: 'tracking_pixel',
            page: page,
            campaign: campaign,
            referer: referer,
            tracking_method: 'html_pixel',
            pixel_load_time: Date.now() - startTime,
            request_id: requestId,
            ip_address: ip,
            conversion_type: 'ai_to_human',
            ai_platform: aiTrafficSource.sourceInfo.platform,
            ai_source_company: aiTrafficSource.sourceInfo.aiSource,
            ai_category: aiTrafficSource.sourceInfo.category,
            is_conversion: true
          }
        }
        
        // Insert conversion tracking (non-blocking)
        const insertConversion = async () => {
          try {
            const { error } = await supabaseServiceRole
              .from('crawler_visits')
              .insert(aiConversionEvent)
            
            if (error) {
              console.error(`[Tracking Pixel ${requestId}] ❌ Failed to insert conversion:`, error)
            } else {
              console.log(`[Tracking Pixel ${requestId}] 🎉 Successfully tracked AI-to-Human conversion`)
            }
          } catch (err: any) {
            console.error(`[Tracking Pixel ${requestId}] ❌ Conversion tracking error:`, err)
          }
        }
        
        insertConversion()
      }
    } else {
      console.log(`[Tracking Pixel ${requestId}] 👤 Regular human visitor (no AI source detected)`)
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
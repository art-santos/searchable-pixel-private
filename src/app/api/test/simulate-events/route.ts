import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
)

const crawlers = [
  { name: 'GPTBot', company: 'OpenAI', category: 'ai-training' },
  { name: 'ChatGPT-User', company: 'OpenAI', category: 'ai-assistant' },
  { name: 'ClaudeBot', company: 'Anthropic', category: 'ai-training' },
  { name: 'Claude-Web', company: 'Anthropic', category: 'ai-assistant' },
  { name: 'PerplexityBot', company: 'Perplexity', category: 'ai-search' },
  { name: 'Googlebot', company: 'Google', category: 'search-ai' },
  { name: 'Bingbot', company: 'Microsoft', category: 'search-ai' },
  { name: 'FacebookBot', company: 'Meta', category: 'social-ai' },
]

const pages = [
  '/',
  '/about',
  '/blog',
  '/products',
  '/contact',
  '/pricing',
  '/docs',
  '/api',
  '/features',
  '/blog/latest-post'
]

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { workspaceId, duration = 10 } = body // duration in seconds

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Workspace ID is required' },
        { status: 400 }
      )
    }

    // Verify the user has access to this workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, domain, user_id')
      .eq('id', workspaceId)
      .single()
    
    if (workspaceError || !workspace) {
      return NextResponse.json(
        { success: false, error: 'Workspace not found' },
        { status: 404 }
      )
    }
    
    if (workspace.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const domain = workspace.domain || 'example.com'
    const startTime = Date.now()
    const durationMs = duration * 1000
    let eventsGenerated = 0

    console.log(`Starting event simulation for workspace ${workspaceId} for ${duration} seconds`)

    // Start the simulation loop
    const simulationInterval = setInterval(async () => {
      try {
        const currentTime = Date.now()
        const elapsed = currentTime - startTime

        // Stop if we've exceeded the duration
        if (elapsed >= durationMs) {
          clearInterval(simulationInterval)
          console.log(`Event simulation completed. Generated ${eventsGenerated} events over ${duration} seconds`)
          return
        }

        // Generate 1-3 events per interval (every 500ms)
        const eventsThisRound = Math.floor(Math.random() * 3) + 1
        const events = []

        for (let i = 0; i < eventsThisRound; i++) {
          const crawler = getRandomElement(crawlers)
          const path = getRandomElement(pages)

          events.push({
            user_id: user.id,
            workspace_id: workspaceId,
            domain: domain,
            path: path,
            crawler_name: crawler.name,
            crawler_company: crawler.company,
            crawler_category: crawler.category,
            user_agent: `Mozilla/5.0 (compatible; ${crawler.name}/1.0; +https://${crawler.company.toLowerCase()}.com/bot)`,
            timestamp: new Date().toISOString(),
            status_code: Math.random() > 0.95 ? 404 : 200,
            response_time_ms: Math.floor(Math.random() * 1000) + 50,
            country: getRandomElement(['US', 'GB', 'CA', 'DE', 'FR', null]),
            metadata: {
              source: 'realtime_simulation',
              simulation_run: true,
              generated_at: new Date().toISOString(),
              elapsed_seconds: Math.floor(elapsed / 1000),
              event_batch: Math.floor(elapsed / 500)
            }
          })
        }

        // Insert events
        const { error: insertError } = await supabaseAdmin
          .from('crawler_visits')
          .insert(events)

        if (insertError) {
          console.error('Error inserting simulated events:', insertError)
        } else {
          eventsGenerated += events.length
          console.log(`Generated ${events.length} events (total: ${eventsGenerated}) at ${Math.floor(elapsed / 1000)}s`)
          
          // Broadcast real-time update to subscribers
          const channel = supabaseAdmin.channel(`workspace-${workspaceId}`)
          channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              events.forEach(event => {
                channel.send({
                  type: 'broadcast',
                  event: 'new_visit',
                  payload: { visit: event },
                })
              })
            }
          })
        }
      } catch (error) {
        console.error('Error in simulation interval:', error)
        clearInterval(simulationInterval)
      }
    }, 500) // Generate events every 500ms

    // Return immediately to not block the request
    return NextResponse.json({
      success: true,
      message: `Started event simulation for ${duration} seconds`,
      details: {
        workspace_id: workspaceId,
        domain: domain,
        duration_seconds: duration,
        expected_events: `${duration * 2}-${duration * 6}`, // Rough estimate
        simulation_started: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error starting event simulation:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
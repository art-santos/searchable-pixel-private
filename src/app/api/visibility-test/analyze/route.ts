import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { analyzeCrawlResults } from '@/lib/visibility/analyzer'
import { getCrawlResults } from '@/services/firecrawl-client'

export async function POST(request: NextRequest) {
  // Get the crawlJobId from the request
  const body = await request.json()
  const { crawlJobId } = body
  
  if (!crawlJobId) {
    return NextResponse.json({ error: 'Missing crawlJobId parameter' }, { status: 400 })
  }
  
  try {
    // Create a direct Supabase admin client for server operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Get current user from auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.split(' ')[1]
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get the crawl results from FireCrawl
    const crawlResults = await getCrawlResults(crawlJobId)
    
    if (!crawlResults || !crawlResults.results || !crawlResults.results.length) {
      return NextResponse.json({ error: 'No crawl results found' }, { status: 404 })
    }
    
    // Get the base URL that was crawled
    const baseUrl = crawlResults.url || crawlResults.results[0].url
    
    // Analyze the results
    const analysisResults = await analyzeCrawlResults(
      crawlResults.results,
      baseUrl
    )
    
    // Set the user ID in the analysis results
    analysisResults.userId = userData.user.id
    
    // Save results directly to the database
    const { data, error } = await supabase
      .from('site_audit_summary')
      .insert({
        user_id: userData.user.id,
        domain: analysisResults.siteUrl,
        aeo_score: analysisResults.aeoScore,
        owned_citations: analysisResults.ownedCitations,
        operated_citations: analysisResults.operatedCitations,
        earned_citations: 0, // Not calculated by legacy analyzer
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        status: 'completed'
      })
      .select()
    
    if (error) {
      console.error('Failed to save visibility results', error)
      return NextResponse.json({ error: 'Failed to save results' }, { status: 500 })
    }
    
    // Return the analysis results
    return NextResponse.json({
      success: true,
      results: analysisResults
    })
  } catch (err) {
    console.error('Failed to analyze visibility', err)
    return NextResponse.json({ 
      error: 'Failed to analyze visibility', 
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 })
  }
} 
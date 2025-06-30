import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: projectId } = await params
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get request body
    const body = await request.json()
    const { urlIds } = body

    if (!urlIds || !Array.isArray(urlIds) || urlIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'URL IDs array is required' },
        { status: 400 }
      )
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    // Get the selected URLs
    const { data: urls, error: urlsError } = await supabase
      .from('project_urls')
      .select('*')
      .eq('project_id', projectId)
      .in('id', urlIds)

    if (urlsError || !urls || urls.length === 0) {
      return NextResponse.json(
        { success: false, error: 'URLs not found' },
        { status: 404 }
      )
    }

    // Update URL statuses to 'processing'
    await supabase
      .from('project_urls')
      .update({ status: 'processing' })
      .in('id', urlIds)

    // Call the comprehensive audit API
    const auditResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/comprehensive-audit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        urls: urls.map(u => u.url),
        topic: null, // No topic needed for technical audits
        userId: user.id,
        auditType: 'technical' // ONLY technical audits, no visibility
      })
    })

    if (!auditResponse.ok) {
      const errorData = await auditResponse.json()
      throw new Error(errorData.error || 'Audit failed')
    }

    const auditData = await auditResponse.json()

    // Process results and update project URLs
    if (auditData.success && auditData.results) {
      console.log('Processing audit results:', auditData.results.length)
      
      for (const result of auditData.results) {
        // Normalize URLs for comparison
        const normalizeUrl = (url: string) => {
          return url.trim().toLowerCase().replace(/\/$/, '')
        }
        
        const url = urls.find(u => normalizeUrl(u.url) === normalizeUrl(result.url))
        
        if (!url) {
          console.error(`No matching URL found for result: ${result.url}`)
          console.log('Available URLs:', urls.map(u => u.url))
          continue
        }
        
        console.log(`Processing result for URL ${url.id}: ${url.url}`)

        if (result.error) {
          // Mark as failed
          await supabase
            .from('project_urls')
            .update({ 
              status: 'failed',
              last_analyzed_at: new Date().toISOString()
            })
            .eq('id', url.id)
        } else if (result.technical) {
          // Update with technical audit results
          const updateData: any = {
            status: 'analyzed',
            last_analyzed_at: new Date().toISOString(),
            technical_score: result.technical.overallScore,
            issues_count: result.technical.issuesCount,
            page_score: result.technical.overallScore,
            ssr_rendered: result.technical.renderingMode === 'SSR',
            // Don't set default values - wait for actual data
          }

          // If we have a pageId, fetch the detailed data
          if (result.pageId) {
            const { data: pageData } = await supabase
              .from('pages')
              .select('*')
              .eq('id', result.pageId)
              .single()

            if (pageData) {
              // Only set values if they actually exist
              if (pageData.analysis_metadata?.h1_present !== undefined) {
                updateData.h1_present = pageData.analysis_metadata.h1_present
              }
              if (pageData.word_count !== undefined && pageData.word_count !== null) {
                updateData.word_count = pageData.word_count
              }
              if (pageData.analysis_metadata?.external_eeat_links !== undefined) {
                updateData.external_eeat_links = pageData.analysis_metadata.external_eeat_links
              }
              if (pageData.analysis_metadata?.internal_link_count !== undefined) {
                updateData.internal_link_count = pageData.analysis_metadata.internal_link_count
              }
              if (pageData.page_summary) {
                updateData.page_summary = pageData.page_summary
              }
              // Use AEO audit data if available, otherwise fall back to enhanced recommendations
              if (result.enhancedRecommendations?.aeoAudit) {
                const aeoAudit = result.enhancedRecommendations.aeoAudit
                updateData.technical_recommendations = aeoAudit.technical_recommendations
                updateData.content_recommendations = aeoAudit.content_recommendations
                updateData.page_summary = aeoAudit.page_summary
                updateData.render_mode = aeoAudit.render_mode
                updateData.semantic_url_quality = aeoAudit.semantic_url
                updateData.meta_description_feedback = aeoAudit.meta_description_feedback
                updateData.passage_slicing = aeoAudit.passage_slicing
                updateData.corporate_jargon_flags = aeoAudit.corporate_jargon_flags
                updateData.schema_suggestions = aeoAudit.schema_suggestions
                updateData.recency_signal = aeoAudit.recency_signal
                updateData.micro_niche_specificity = aeoAudit.micro_niche_specificity
              } else {
                if (result.enhancedRecommendations?.technicalQuickWin) {
                  updateData.technical_recommendations = result.enhancedRecommendations.technicalQuickWin
                }
                if (result.enhancedRecommendations?.contentQuickWin) {
                  updateData.content_recommendations = result.enhancedRecommendations.contentQuickWin
                }
              }
            }
          }

          console.log(`Updating project_url ${url.id} with data:`, updateData)
          
          const { error: updateError } = await supabase
            .from('project_urls')
            .update(updateData)
            .eq('id', url.id)
            
          if (updateError) {
            console.error(`Failed to update project_url ${url.id}:`, updateError)
          } else {
            console.log(`Successfully updated project_url ${url.id}`)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: auditData,
      message: `Audit completed for ${urls.length} URLs`
    })

  } catch (error: any) {
    console.error('Project audit error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to run audit' },
      { status: 500 }
    )
  }
} 
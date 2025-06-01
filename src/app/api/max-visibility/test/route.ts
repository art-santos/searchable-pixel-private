// API Route: MAX Visibility System Test
// GET /api/max-visibility/test

import { NextRequest, NextResponse } from 'next/server'
import { MaxVisibilityPipeline } from '@/lib/max-visibility/pipeline'
import { ConversationalQuestionGenerator } from '@/lib/max-visibility/question-generator'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const testResults = {
      timestamp: new Date().toISOString(),
      overall_status: 'unknown',
      components: {
        database: { status: 'unknown', message: '' },
        perplexity: { status: 'unknown', message: '' },
        question_generator: { status: 'unknown', message: '' },
        pipeline: { status: 'unknown', message: '' }
      },
      system_info: {
        node_env: process.env.NODE_ENV,
        has_perplexity_key: !!process.env.PERPLEXITY_API_KEY,
        has_openai_key: !!process.env.OPENAI_API_KEY
      }
    }

    // Test 1: Database connection
    try {
      const { data, error } = await supabase
        .from('max_assessments')
        .select('id')
        .limit(1)

      if (error) throw error
      
      testResults.components.database = {
        status: 'healthy',
        message: 'Database connection successful'
      }
    } catch (error) {
      testResults.components.database = {
        status: 'error',
        message: `Database error: ${(error as Error).message}`
      }
    }

    // Test 2: Question Generator
    try {
      const generator = new ConversationalQuestionGenerator()
      const templates = generator.getTemplates()
      
      if (templates.length === 0) {
        throw new Error('No question templates available')
      }
      
      // Test question generation
      const testCompany = {
        id: 'test',
        name: 'Test Company',
        domain: 'test.com',
        description: 'A test technology company for validation'
      }
      
      const questions = await generator.generateQuestions({
        company: testCompany,
        question_count: 3,
        question_types: ['direct_conversational']
      })
      
      if (questions.length === 0) {
        throw new Error('Question generation returned no results')
      }
      
      testResults.components.question_generator = {
        status: 'healthy',
        message: `Generated ${questions.length} test questions from ${templates.length} templates`
      }
    } catch (error) {
      testResults.components.question_generator = {
        status: 'error',
        message: `Question generator error: ${(error as Error).message}`
      }
    }

    // Test 3: Pipeline connectivity (includes Perplexity)
    try {
      const pipeline = new MaxVisibilityPipeline()
      const connectivityTest = await pipeline.testConnectivity()
      
      if (connectivityTest.success) {
        testResults.components.pipeline = {
          status: 'healthy',
          message: 'All pipeline services connected successfully'
        }
        testResults.components.perplexity = {
          status: 'healthy',
          message: 'Perplexity API connection verified'
        }
      } else {
        testResults.components.pipeline = {
          status: 'error',
          message: `Pipeline connectivity issues: ${connectivityTest.errors.join(', ')}`
        }
        
        // Check specifically for Perplexity issues
        const perplexityError = connectivityTest.errors.find(e => e.includes('Perplexity'))
        if (perplexityError) {
          testResults.components.perplexity = {
            status: 'error',
            message: perplexityError
          }
        }
      }
    } catch (error) {
      testResults.components.pipeline = {
        status: 'error',
        message: `Pipeline test error: ${(error as Error).message}`
      }
    }

    // Determine overall status
    const componentStatuses = Object.values(testResults.components).map(c => c.status)
    if (componentStatuses.every(status => status === 'healthy')) {
      testResults.overall_status = 'healthy'
    } else if (componentStatuses.some(status => status === 'healthy')) {
      testResults.overall_status = 'degraded'
    } else {
      testResults.overall_status = 'unhealthy'
    }

    const statusCode = testResults.overall_status === 'healthy' ? 200 : 503

    return NextResponse.json({
      success: testResults.overall_status !== 'unhealthy',
      test_results: testResults
    }, { status: statusCode })

  } catch (error) {
    console.error('MAX Visibility test error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'System test failed',
        message: (error as Error).message
      },
      { status: 500 }
    )
  }
} 
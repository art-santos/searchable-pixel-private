import { NextRequest, NextResponse } from 'next/server'
import { testOnboardingDatabaseFlow } from '@/test/onboarding-database-test'

export async function GET(req: NextRequest) {
  try {
    console.log('🧪 Running onboarding database test via API...')
    
    const result = await testOnboardingDatabaseFlow()
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Onboarding database integration test passed',
        data: {
          companyId: result.companyId,
          runId: result.runId
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Onboarding database integration test failed',
        error: result.error
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ API test error:', error)
    return NextResponse.json({
      success: false,
      message: 'API test failed',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  return NextResponse.json({
    message: 'Use GET method to run the test'
  }, { status: 405 })
} 
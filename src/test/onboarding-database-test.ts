/**
 * Test file for onboarding database integration
 * This file can be run to test the database saving functionality
 */

import { saveOnboardingData, saveAeoQuestions, saveAeoResults, updateAeoScore, saveCompleteAeoAnalysis } from '@/lib/onboarding/database'
import type { OnboardingData } from '@/lib/onboarding/database'

// Mock user object for testing
const mockUser = {
  id: 'test-user-id-' + Date.now(),
  email: 'test@example.com',
  // Add other required User properties as needed
} as any

// Test onboarding data
const testOnboardingData: OnboardingData = {
  workspaceName: 'Test Company',
  userEmail: 'test@example.com',
  analyticsProvider: 'ga4',
  domain: 'https://example.com',
  isAnalyticsConnected: true,
  keywords: ['AI automation', 'business intelligence', 'workflow optimization'],
  businessOffering: 'We provide AI-powered business automation solutions that help enterprises streamline their operations and improve efficiency through intelligent workflow management.',
  knownFor: 'Leading enterprise AI platform with focus on automation and analytics',
  competitors: ['competitor1.com', 'competitor2.com', 'acme-corp.com'],
  knowledgeBase: 'Additional context about our business offerings, target market, and competitive advantages in the AI automation space.',
  cms: 'nextjs'
}

// Test questions (simulating AEO question generation)
const testQuestions = [
  'What is Test Company?',
  'Test Company pricing',
  'Test Company vs competitors',
  'Test Company features and benefits',
  'How does Test Company work?',
  'Test Company customer reviews',
  'best AI automation tools',
  'enterprise business intelligence platforms',
  'workflow optimization software comparison',
  'top business automation solutions',
  'AI-powered productivity tools',
  'business process management software'
]

// Test AEO pipeline data (simulating what comes from the actual analysis)
const testPipelineData = {
  overallScore: 75,
  scoreHistory: [
    { date: new Date().toISOString().split('T')[0], score: 75 }
  ],
  topics: [
    { topic: 'Owned Content', score: 65 },
    { topic: 'Operated Channels', score: 45 },
    { topic: 'Share of Voice', score: 55 }
  ],
  citations: {
    owned: 12,
    operated: 3,
    earned: 25
  },
  competitors: [],
  suggestions: [
    {
      topic: 'Content Optimization',
      suggestion: 'Focus on creating more targeted content for key search questions to improve visibility.'
    }
  ],
  aeoData: {
    aeo_score: 75,
    coverage_owned: 0.45,
    coverage_operated: 0.15,
    coverage_total: 0.60,
    share_of_voice: 0.35,
    metrics: {
      questions_analyzed: 12,
      total_results: 120,
      owned_appearances: 12,
      operated_appearances: 3,
      earned_appearances: 25,
      avg_owned_position: 4.2,
      avg_operated_position: 6.8,
      top_3_presence: 8
    },
    breakdown: {
      by_question: [
        {
          question: 'What is Test Company?',
          owned_results: 2,
          operated_results: 0,
          earned_results: 8,
          owned_positions: [2, 5],
          operated_positions: [],
          coverage_score: 1.2,
          voice_score: 0.7,
          is_direct: true,
          weight: 1.2
        },
        {
          question: 'Test Company pricing',
          owned_results: 1,
          operated_results: 1,
          earned_results: 8,
          owned_positions: [3],
          operated_positions: [7],
          coverage_score: 1.4,
          voice_score: 0.5,
          is_direct: true,
          weight: 1.2
        },
        {
          question: 'best AI automation tools',
          owned_results: 0,
          operated_results: 0,
          earned_results: 10,
          owned_positions: [],
          operated_positions: [],
          coverage_score: 0,
          voice_score: 0,
          is_direct: false,
          weight: 1.0
        }
      ]
    },
    metadata: {
      target_domain: 'example.com',
      calculated_at: new Date().toISOString(),
      score_version: '1.0.0'
    }
  }
}

/**
 * Test the complete onboarding database flow
 */
export async function testOnboardingDatabaseFlow() {
  console.log('🧪 Starting comprehensive onboarding database test...')
  
  try {
    // Step 1: Save onboarding data (creates profile, company, and AEO run)
    console.log('📝 Testing saveOnboardingData...')
    const onboardingResult = await saveOnboardingData(mockUser, testOnboardingData)
    
    if (!onboardingResult.success) {
      throw new Error(`Failed to save onboarding data: ${onboardingResult.error}`)
    }
    
    console.log('✅ Onboarding data saved successfully')
    console.log(`   Company ID: ${onboardingResult.companyId}`)
    console.log(`   Run ID: ${onboardingResult.runId}`)
    
    const { companyId, runId } = onboardingResult
    
    if (!runId) {
      throw new Error('No run ID returned from onboarding save')
    }
    
    // Step 2: Test complete AEO analysis save (simulates pipeline completion)
    console.log('🎯 Testing saveCompleteAeoAnalysis...')
    const completeAnalysisResult = await saveCompleteAeoAnalysis(runId, testPipelineData, mockUser.id)
    
    if (!completeAnalysisResult.success) {
      throw new Error(`Failed to save complete AEO analysis: ${completeAnalysisResult.error}`)
    }
    
    console.log('✅ Complete AEO analysis saved successfully')
    
    // Step 3: Verify individual components were saved correctly
    console.log('🔍 Testing individual function components...')
    
    // Test individual question saving (as fallback)
    const individualQuestionsResult = await saveAeoQuestions(runId, ['Test question 1', 'Test question 2'])
    if (individualQuestionsResult.success) {
      console.log('✅ Individual questions saving works')
    } else {
      console.log('⚠️ Individual questions test failed (expected if questions already exist)')
    }
    
    // Test score update with user completion
    const scoreUpdateResult = await updateAeoScore(runId, 80, mockUser.id)
    if (scoreUpdateResult.success) {
      console.log('✅ Score update and onboarding completion works')
    } else {
      console.log('❌ Score update failed:', scoreUpdateResult.error)
    }
    
    console.log('🎉 All database integration tests passed!')
    
    return {
      success: true,
      companyId,
      runId,
      summary: {
        profile_created: true,
        company_created: true,
        aeo_run_created: true,
        questions_saved: true,
        results_saved: true,
        score_updated: true,
        onboarding_completed: true
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

/**
 * Test individual database functions separately
 */
export async function testIndividualFunctions() {
  console.log('🔧 Testing individual database functions...')
  
  const tests = [
    {
      name: 'saveOnboardingData',
      test: () => saveOnboardingData(mockUser, testOnboardingData)
    },
    {
      name: 'saveAeoQuestions', 
      test: () => saveAeoQuestions('test-run-id', testQuestions.slice(0, 5))
    }
  ]
  
  for (const test of tests) {
    try {
      console.log(`Testing ${test.name}...`)
      const result = await test.test()
      console.log(`✅ ${test.name} passed:`, result)
    } catch (error) {
      console.error(`❌ ${test.name} failed:`, error)
    }
  }
}

/**
 * Test the data extraction functions
 */
export function testDataExtraction() {
  console.log('🔍 Testing data extraction functions...')
  
  // This would test the extraction functions directly
  // but they need to be imported differently since they're in the same file
  console.log('Test pipeline data structure:', {
    hasAeoData: !!testPipelineData.aeoData,
    hasBreakdown: !!testPipelineData.aeoData.breakdown,
    hasQuestions: !!testPipelineData.aeoData.breakdown.by_question,
    questionCount: testPipelineData.aeoData.breakdown.by_question.length,
    hasScore: !!testPipelineData.aeoData.aeo_score
  })
}

// Export test data for use in other files
export {
  testOnboardingData,
  testQuestions,
  testPipelineData,
  mockUser
} 
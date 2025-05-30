/**
 * Test file for onboarding database integration
 * This file can be run to test the database saving functionality
 */

import { saveOnboardingData, saveAeoQuestions, saveAeoResults, updateAeoScore } from '@/lib/onboarding/database'
import type { OnboardingData } from '@/lib/onboarding/database'

// Mock user object for testing
const mockUser = {
  id: 'test-user-id',
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
  businessOffering: 'We provide AI-powered business automation solutions',
  knownFor: 'Leading enterprise AI platform',
  competitors: ['competitor1.com', 'competitor2.com'],
  knowledgeBase: 'Additional context about our business and offerings',
  cms: 'nextjs'
}

// Test questions
const testQuestions = [
  'What is Test Company?',
  'Test Company pricing',
  'Test Company vs competitors',
  'best AI automation tools',
  'enterprise business intelligence',
  'workflow optimization software'
]

// Test results
const testResults = [
  {
    questionId: 'question-1',
    rank: 1,
    url: 'https://example.com',
    title: 'Test Company - AI Automation Platform',
    snippet: 'Leading AI automation solutions for enterprises',
    domain: 'example.com',
    bucket: 'owned' as const
  },
  {
    questionId: 'question-1', 
    rank: 2,
    url: 'https://competitor1.com',
    title: 'Competitor 1 - Business Solutions',
    snippet: 'Alternative business automation platform',
    domain: 'competitor1.com',
    bucket: 'earned' as const
  }
]

/**
 * Test the complete onboarding database flow
 */
export async function testOnboardingDatabaseFlow() {
  console.log('🧪 Starting onboarding database test...')
  
  try {
    // Step 1: Save onboarding data
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
    
    // Step 2: Save questions
    console.log('❓ Testing saveAeoQuestions...')
    const questionsResult = await saveAeoQuestions(runId, testQuestions)
    
    if (!questionsResult.success) {
      throw new Error(`Failed to save questions: ${questionsResult.error}`)
    }
    
    console.log('✅ Questions saved successfully')
    
    // Step 3: Save results (would normally come from actual AEO analysis)
    console.log('📊 Testing saveAeoResults...')
    const resultsResult = await saveAeoResults(runId, testResults)
    
    if (!resultsResult.success) {
      throw new Error(`Failed to save results: ${resultsResult.error}`)
    }
    
    console.log('✅ Results saved successfully')
    
    // Step 4: Update score
    console.log('🏆 Testing updateAeoScore...')
    const scoreResult = await updateAeoScore(runId, 75.5)
    
    if (!scoreResult.success) {
      throw new Error(`Failed to update score: ${scoreResult.error}`)
    }
    
    console.log('✅ Score updated successfully')
    
    console.log('🎉 All tests passed! Onboarding database integration is working.')
    
    return {
      success: true,
      companyId,
      runId
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
 * Test individual database functions
 */
export async function testIndividualFunctions() {
  console.log('🔧 Testing individual database functions...')
  
  const tests = [
    {
      name: 'saveOnboardingData',
      test: () => saveOnboardingData(mockUser, testOnboardingData)
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

// Export for use in other files
export {
  testOnboardingData,
  testQuestions,
  testResults,
  mockUser
} 
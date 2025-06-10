import { createClient } from '@/lib/supabase/client'
import { saveAeoQuestions, saveCompleteAeoAnalysis } from '../onboarding/database'

/**
 * Debug utilities for testing AEO database operations
 * Use these in the browser console to test database functionality
 */

// Test Supabase client connectivity
export const testSupabaseClient = async () => {
  console.log('🔍 Testing Supabase Client...')
  
  const supabase = createClient()
  if (!supabase) {
    console.error('❌ Supabase client not available!')
    return false
  }
  
  try {
    // Test basic connectivity by querying profiles
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    if (error) {
      console.error('❌ Supabase connection error:', error)
      return false
    }
    
    console.log('✅ Supabase client connected successfully')
    console.log('📊 Test query result:', data)
    return true
  } catch (err) {
    console.error('❌ Exception testing Supabase:', err)
    return false
  }
}

// Test RLS policies by attempting to view AEO tables
export const testRLSPolicies = async () => {
  console.log('🔍 Testing RLS Policies...')
  
  const supabase = createClient()
  if (!supabase) {
    console.error('❌ Supabase client not available!')
    return
  }
  
  // Test aeo_runs
  try {
    const { data: runs, error: runsError } = await supabase
      .from('aeo_runs')
      .select('id')
      .limit(1)
    
    console.log('📊 aeo_runs test:', {
      success: !runsError,
      error: runsError?.message,
      data: runs
    })
  } catch (err) {
    console.error('❌ aeo_runs test failed:', err)
  }
  
  // Test aeo_questions
  try {
    const { data: questions, error: questionsError } = await supabase
      .from('aeo_questions')
      .select('id')
      .limit(1)
    
    console.log('📊 aeo_questions test:', {
      success: !questionsError,
      error: questionsError?.message,
      data: questions
    })
  } catch (err) {
    console.error('❌ aeo_questions test failed:', err)
  }
  
  // Test aeo_results
  try {
    const { data: results, error: resultsError } = await supabase
      .from('aeo_results')
      .select('id')
      .limit(1)
    
    console.log('📊 aeo_results test:', {
      success: !resultsError,
      error: resultsError?.message,
      data: results
    })
  } catch (err) {
    console.error('❌ aeo_results test failed:', err)
  }
}

// Test question insertion with a dummy run ID
export const testQuestionInsertion = async (runId?: string) => {
  console.log('🔍 Testing Question Insertion...')
  
  if (!runId) {
    console.error('❌ No runId provided. Usage: testQuestionInsertion("your-run-id")')
    return
  }
  
  const testQuestions = [
    'Test question 1',
    'Test question 2', 
    'Test question 3'
  ]
  
  try {
    const result = await saveAeoQuestions(runId, testQuestions)
    console.log('📊 Question insertion test result:', result)
    return result
  } catch (err) {
    console.error('❌ Question insertion test failed:', err)
    return { success: false, error: err }
  }
}

// Get all runs for current user to find run IDs for testing
export const getCurrentUserRuns = async () => {
  console.log('🔍 Getting current user runs...')
  
  const supabase = createClient()
  if (!supabase) {
    console.error('❌ Supabase client not available!')
    return
  }
  
  try {
    const { data: runs, error } = await supabase
      .from('aeo_runs')
      .select(`
        id,
        company_id,
        question_count,
        total_score,
        computed_at,
        companies(company_name, root_url)
      `)
      .order('computed_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error fetching runs:', error)
      return
    }
    
    console.log('📊 Current user runs:', runs)
    if (runs && runs.length > 0) {
      console.log('💡 Use this run ID for testing:', runs[0].id)
    }
    
    return runs
  } catch (err) {
    console.error('❌ Exception getting user runs:', err)
  }
}

// Test complete analysis save with mock data
export const testCompleteAnalysisSave = async (runId?: string) => {
  console.log('🔍 Testing Complete Analysis Save...')
  
  if (!runId) {
    console.error('❌ No runId provided. Usage: testCompleteAnalysisSave("your-run-id")')
    return
  }
  
  const mockPipelineData = {
    overallScore: 85,
    questions: ['Test question 1', 'Test question 2'],
    serpResults: [
      {
        question: 'Test question 1',
        results: [
          { url: 'https://test.com', title: 'Test Result 1', snippet: 'Test snippet' }
        ]
      }
    ],
    targetDomain: 'test.com',
    aeoData: {
      aeo_score: 85,
      coverage_owned: 0.5,
      coverage_operated: 0.1
    }
  }
  
  try {
    const result = await saveCompleteAeoAnalysis(runId, mockPipelineData, 'test-user-id')
    console.log('📊 Complete analysis save test result:', result)
    return result
  } catch (err) {
    console.error('❌ Complete analysis save test failed:', err)
    return { success: false, error: err }
  }
}

// Make functions available in browser console
if (typeof window !== 'undefined') {
  (window as any).aeoDebug = {
    testSupabaseClient,
    testRLSPolicies,
    testQuestionInsertion,
    getCurrentUserRuns,
    testCompleteAnalysisSave
  }
  
  console.log('🛠️ AEO Debug utilities loaded!')
  console.log('Usage:')
  console.log('  aeoDebug.testSupabaseClient()')
  console.log('  aeoDebug.testRLSPolicies()')
  console.log('  aeoDebug.getCurrentUserRuns()')
  console.log('  aeoDebug.testQuestionInsertion("run-id")')
  console.log('  aeoDebug.testCompleteAnalysisSave("run-id")')
} 
/**
 * Test file for onboarding database integration
 * This file can be run to test the database saving functionality
 */

import { saveOnboardingData } from '@/lib/onboarding/database'
import type { OnboardingData } from '@/lib/onboarding/database'

// Mock user object for testing
const mockUser = {
  id: 'test-user-id-' + Date.now(),
  email: 'test@example.com',
  // Add other required User properties as needed
} as any

// Test onboarding data
const testOnboardingData: OnboardingData = {
  userEmail: 'test@example.com',
  userName: 'John Doe',
  workspaceName: 'Test Workspace',
  domain: 'test.com',
  profileData: {
    first_name: 'John',
    last_name: 'Doe', 
    company_name: 'Test Company',
    role: 'CEO',
    team_size: '1-10'
  }
}

/**
 * Test the basic onboarding database flow
 */
export async function testOnboardingDatabaseFlow() {
  console.log('🧪 Starting basic onboarding database test...')
  
  try {
    // Test onboarding data save (creates profile, company, workspace, and subscription)
    console.log('📝 Testing saveOnboardingData...')
    const result = await saveOnboardingData(mockUser, testOnboardingData)
    
    if (!result.success) {
      throw new Error(`Failed to save onboarding data: ${result.error}`)
    }
    
    console.log('✅ Onboarding data saved successfully')
    console.log(`   Company ID: ${result.companyId}`)
    console.log(`   Workspace ID: ${result.workspaceId}`)
    
    console.log('🎉 Onboarding database test passed!')
    
    return {
      success: true,
      companyId: result.companyId,
      workspaceId: result.workspaceId,
      summary: {
        profile_created: true,
        company_created: true,
        workspace_created: true,
        subscription_initialized: true,
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

// Export test data for use in other files
export {
  testOnboardingData,
  mockUser
} 
/**
 * Debug utility for onboarding flow issues
 */

export function debugOnboardingState() {
  if (typeof window === 'undefined') {
    return { error: 'Not in browser environment' }
  }

  const state = {
    localStorage: {
      onboardingCompleted: localStorage.getItem('onboardingCompleted'),
      onboardingData: localStorage.getItem('onboardingData'),
    },
    sessionStorage: {
      justSignedUp: sessionStorage.getItem('justSignedUp'),
      onboardingInProgress: sessionStorage.getItem('onboardingInProgress'),
    },
    cookies: {
      justVerified: document.cookie.includes('justVerified=true')
    },
    timestamp: new Date().toISOString()
  }

  console.log('🔍 Onboarding Debug State:', state)
  return state
}

export function clearOnboardingState() {
  if (typeof window === 'undefined') {
    return
  }

  console.log('🧹 Clearing all onboarding state...')
  
  // Clear localStorage
  localStorage.removeItem('onboardingCompleted')
  localStorage.removeItem('onboardingData')
  
  // Clear sessionStorage
  sessionStorage.removeItem('justSignedUp')
  sessionStorage.removeItem('onboardingInProgress')
  
  // Clear cookies
  document.cookie = 'justVerified=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  
  console.log('✅ All onboarding state cleared')
}

export function simulateNewUser() {
  if (typeof window === 'undefined') {
    return
  }

  console.log('👤 Simulating new user signup...')
  
  // Clear existing state
  clearOnboardingState()
  
  // Set flags for new user
  sessionStorage.setItem('justSignedUp', 'true')
  
  console.log('✅ New user simulation complete - refresh page to test onboarding')
}

export function simulateReturningUser() {
  if (typeof window === 'undefined') {
    return
  }

  console.log('🔄 Simulating returning user...')
  
  // Clear existing state
  clearOnboardingState()
  
  // Set completed flag
  localStorage.setItem('onboardingCompleted', 'true')
  
  console.log('✅ Returning user simulation complete - refresh page to test')
}

// Add global debug functions for easy testing
if (typeof window !== 'undefined') {
  (window as any).debugOnboarding = {
    debug: debugOnboardingState,
    clear: clearOnboardingState,
    simulateNew: simulateNewUser,
    simulateReturning: simulateReturningUser
  }
} 
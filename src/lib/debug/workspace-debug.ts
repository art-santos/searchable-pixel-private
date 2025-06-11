import { createClient } from '@/lib/supabase/client'

export const debugWorkspace = async () => {
  console.log('🔍 WORKSPACE DEBUG UTILITY')
  console.log('='.repeat(50))
  
  const supabase = createClient()
  if (!supabase) {
    console.error('❌ Supabase client not available')
    return
  }
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('❌ No authenticated user found:', userError?.message)
      return
    }
    
    console.log('👤 User ID:', user.id)
    console.log('👤 User Email:', user.email)
    
    // Check profile
    console.log('\n📋 Profile Check:')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      console.error('❌ Profile error:', profileError.message)
    } else {
      console.log('✅ Profile found:', {
        onboarding_completed: profile.onboarding_completed,
        onboarding_completed_at: profile.onboarding_completed_at,
        workspace_name: profile.workspace_name,
        domain: profile.domain
      })
    }
    
    // Check workspaces
    console.log('\n🏢 Workspace Check:')
    const { data: workspaces, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('user_id', user.id)
    
    if (workspaceError) {
      console.error('❌ Workspace error:', workspaceError.message)
    } else {
      console.log(`✅ Found ${workspaces?.length || 0} workspaces:`)
      workspaces?.forEach((ws, index) => {
        console.log(`  ${index + 1}. ${ws.workspace_name} (${ws.domain}) - Primary: ${ws.is_primary}`)
      })
    }
    
    // Analyze consistency
    console.log('\n🔍 Consistency Analysis:')
    const hasWorkspaces = workspaces && workspaces.length > 0
    const onboardingComplete = profile?.onboarding_completed === true
    
    console.log('- Has workspaces:', hasWorkspaces)
    console.log('- Onboarding flag set:', onboardingComplete)
    
    if (hasWorkspaces && !onboardingComplete) {
      console.log('⚠️ INCONSISTENCY DETECTED: User has workspaces but onboarding flag is false')
      console.log('🔧 This could cause the create-workspace loop issue')
    } else if (!hasWorkspaces && onboardingComplete) {
      console.log('⚠️ INCONSISTENCY DETECTED: Onboarding flag is true but no workspaces found')
    } else if (hasWorkspaces && onboardingComplete) {
      console.log('✅ State is consistent - user should be able to access dashboard')
    } else {
      console.log('ℹ️ User needs to complete onboarding')
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error)
  }
  
  console.log('='.repeat(50))
}

export const fixWorkspaceConsistency = async () => {
  console.log('🔧 FIXING WORKSPACE CONSISTENCY')
  console.log('='.repeat(50))
  
  const supabase = createClient()
  if (!supabase) {
    console.error('❌ Supabase client not available')
    return
  }
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('❌ No authenticated user found:', userError?.message)
      return
    }
    
    // Check if user has workspaces
    const { data: workspaces, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, is_primary')
      .eq('user_id', user.id)
    
    if (workspaceError) {
      console.error('❌ Error checking workspaces:', workspaceError.message)
      return
    }
    
    const hasWorkspaces = workspaces && workspaces.length > 0
    
    if (hasWorkspaces) {
      console.log('✅ User has workspaces, setting onboarding as complete...')
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString()
        })
        .eq('id', user.id)
      
      if (updateError) {
        console.error('❌ Failed to update profile:', updateError.message)
      } else {
        console.log('✅ Profile updated successfully!')
        console.log('🔄 Please refresh the page to see changes')
      }
    } else {
      console.log('ℹ️ No workspaces found - user needs to complete onboarding')
    }
    
  } catch (error) {
    console.error('❌ Fix error:', error)
  }
  
  console.log('='.repeat(50))
}

// Make these available in the browser console
if (typeof window !== 'undefined') {
  (window as any).debugWorkspace = debugWorkspace
  (window as any).fixWorkspaceConsistency = fixWorkspaceConsistency
} 
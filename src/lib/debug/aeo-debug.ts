// Debug utilities for testing basic Supabase functionality
// AEO functionality has been disabled due to missing database tables

import { createClient } from '@/lib/supabase/client'

// Test basic Supabase functionality that works with current schema
export const testBasicSupabase = async () => {
  console.log('🔍 Testing Basic Supabase Functionality...')
  
  const supabase = createClient()
  if (!supabase) {
    console.error('❌ Supabase client not available!')
    return false
  }
  
  try {
    // Test profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, workspace_name')
      .limit(3)
    
    console.log('📊 Profiles test:', {
      success: !profilesError,
      error: profilesError?.message,
      count: profiles?.length || 0,
      sample: profiles?.[0]
    })
    
    // Test workspaces table
    const { data: workspaces, error: workspacesError } = await supabase
      .from('workspaces')
      .select('id, workspace_name, domain')
      .limit(3)
    
    console.log('📊 Workspaces test:', {
      success: !workspacesError,
      error: workspacesError?.message,
      count: workspaces?.length || 0,
      sample: workspaces?.[0]
    })
    
    // Test companies table
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, company_name, root_url')
      .limit(3)
    
    console.log('📊 Companies test:', {
      success: !companiesError,
      error: companiesError?.message,
      count: companies?.length || 0,
      sample: companies?.[0]
    })
    
    return true
  } catch (err) {
    console.error('❌ Exception testing basic Supabase:', err)
    return false
  }
}

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

// Make functions available in browser console for debugging
if (typeof window !== 'undefined') {
  (window as any).debugUtils = {
    testBasicSupabase,
    testSupabaseClient
  }
  
  console.log('🛠️ Basic debug utilities loaded!')
  console.log('Usage:')
  console.log('  debugUtils.testBasicSupabase()')
  console.log('  debugUtils.testSupabaseClient()')
} 
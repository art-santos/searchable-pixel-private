import { createClient } from '@/lib/supabase/client'

export const debugAuth = async () => {
  console.log('🔍 AUTH DEBUG UTILITY')
  console.log('='.repeat(50))
  
  // Check environment variables
  console.log('📊 Environment Check:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  
  // Test client creation
  console.log('\n🔧 Client Creation:')
  const supabase = createClient()
  console.log('- Client created:', !!supabase)
  
  if (!supabase) {
    console.error('❌ Failed to create Supabase client')
    return
  }
  
  try {
    // Check session first
    console.log('\n📋 Session Check:')
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    console.log('- Session exists:', !!sessionData.session)
    console.log('- Session error:', sessionError?.message || 'None')
    
    if (sessionData.session) {
      console.log('- Access token exists:', !!sessionData.session.access_token)
      console.log('- Refresh token exists:', !!sessionData.session.refresh_token)
      console.log('- Expires at:', sessionData.session.expires_at)
      console.log('- User ID:', sessionData.session.user?.id)
    }
    
    // Check user
    console.log('\n👤 User Check:')
    const { data: userData, error: userError } = await supabase.auth.getUser()
    console.log('- User exists:', !!userData.user)
    console.log('- User error:', userError?.message || 'None')
    
    if (userData.user) {
      console.log('- User ID:', userData.user.id)
      console.log('- User email:', userData.user.email)
      console.log('- Email confirmed:', userData.user.email_confirmed_at ? 'Yes' : 'No')
    }
    
    // Test database connection
    console.log('\n🏥 Database Connection:')
    const { data: dbTest, error: dbError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    console.log('- DB connection:', dbError ? 'Failed' : 'Success')
    console.log('- DB error:', dbError?.message || 'None')
    
  } catch (error) {
    console.error('❌ Auth debug error:', error)
  }
  
  console.log('='.repeat(50))
}

// Call this function in your browser console or component to debug
export const authStatus = () => {
  if (typeof window !== 'undefined') {
    debugAuth()
  } else {
    console.log('Auth debug can only be run in the browser')
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUG AUTH ENDPOINT')
    console.log('='.repeat(50))
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('📊 Environment Variables:')
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Not set')
    console.log('- NEXT_PUBLIC_SUPABASE_URL value:', supabaseUrl)
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Not set')
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY length:', supabaseAnonKey?.length || 0)
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY first 50 chars:', supabaseAnonKey?.substring(0, 50) || 'None')
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY last 50 chars:', supabaseAnonKey?.substring(supabaseAnonKey.length - 50) || 'None')
    
    // Test client creation
    console.log('🔧 Testing Supabase Client Creation:')
    const supabase = createClient()
    console.log('- Client created:', !!supabase)
    
    if (supabase) {
      try {
        // Test a simple query
        console.log('🧪 Testing Auth Status:')
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        console.log('- Session data:', !!sessionData)
        console.log('- Session error:', sessionError?.message || 'None')
        
        // Test a simple RPC call or health check
        console.log('🏥 Testing Database Connection:')
        const { data: healthData, error: healthError } = await supabase
          .from('profiles')
          .select('count')
          .limit(1)
        console.log('- Health check data:', !!healthData)
        console.log('- Health check error:', healthError?.message || 'None')
        
      } catch (clientError) {
        console.error('❌ Client test error:', clientError)
      }
    }
    
    return NextResponse.json({
      status: 'debug',
      environment: {
        supabaseUrl: supabaseUrl ? 'Set' : 'Not set',
        supabaseAnonKeyLength: supabaseAnonKey?.length || 0,
        supabaseAnonKeyFirst50: supabaseAnonKey?.substring(0, 50) || 'None',
        supabaseAnonKeyLast50: supabaseAnonKey?.substring(supabaseAnonKey.length - 50) || 'None'
      },
      clientCreated: !!supabase,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Debug endpoint error:', error)
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 
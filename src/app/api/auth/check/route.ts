import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    
    console.log('[Auth Check] All cookies:', allCookies.map(c => c.name))
    
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Try getSession first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Try getUser
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    return NextResponse.json({
      cookies: allCookies.map(c => ({ 
        name: c.name, 
        hasValue: !!c.value,
        isAuth: c.name.includes('auth') || c.name.includes('sb-')
      })),
      session: {
        exists: !!session,
        user: session?.user?.id,
        error: sessionError?.message
      },
      user: {
        exists: !!user,
        id: user?.id,
        email: user?.email,
        error: userError?.message
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Auth check failed', details: error }, { status: 500 })
  }
} 
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Set a flag to indicate user just verified their email
      const response = NextResponse.redirect(`${origin}${next}`)
      response.cookies.set('justVerified', 'true', {
        maxAge: 60 * 5, // 5 minutes
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
      return response
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
} 
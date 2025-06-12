import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Find valid reset token
    const { data: resetRecord, error: tokenError } = await supabase
      .from('password_resets')
      .select('user_id, expires_at, used_at')
      .eq('token', token)
      .single()

    if (tokenError || !resetRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (new Date() > new Date(resetRecord.expires_at)) {
      return NextResponse.json(
        { error: 'Reset token has expired' },
        { status: 400 }
      )
    }

    // Check if token was already used
    if (resetRecord.used_at) {
      return NextResponse.json(
        { error: 'Reset token has already been used' },
        { status: 400 }
      )
    }

    // Update user password in Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      resetRecord.user_id,
      { password: password }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      )
    }

    // Mark token as used
    const { error: markUsedError } = await supabase
      .from('password_resets')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token)

    if (markUsedError) {
      console.error('Error marking token as used:', markUsedError)
      // Don't fail the request if this fails
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully!'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
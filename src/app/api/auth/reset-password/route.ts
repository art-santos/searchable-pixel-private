import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    console.log('🔍 Reset password request for token:', token?.substring(0, 8) + '...')

    if (!token || !password) {
      console.log('❌ Missing token or password')
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      console.log('❌ Password too short')
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Use service role client for admin operations
    const supabase = createServiceClient()

    console.log('🔍 Looking up reset token...')
    // Find valid reset token
    const { data: resetRecord, error: tokenError } = await supabase
      .from('password_resets')
      .select('user_id, expires_at, used_at')
      .eq('token', token)
      .single()

    if (tokenError || !resetRecord) {
      console.log('❌ Invalid reset token:', tokenError)
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    console.log('✅ Reset token found for user:', resetRecord.user_id)

    // Check if token is expired
    if (new Date() > new Date(resetRecord.expires_at)) {
      console.log('❌ Reset token expired')
      return NextResponse.json(
        { error: 'Reset token has expired' },
        { status: 400 }
      )
    }

    // Check if token was already used
    if (resetRecord.used_at) {
      console.log('❌ Reset token already used')
      return NextResponse.json(
        { error: 'Reset token has already been used' },
        { status: 400 }
      )
    }

    console.log('🔍 Updating user password...')
    // Update user password in Supabase Auth using admin client
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      resetRecord.user_id,
      { password: password }
    )

    if (updateError) {
      console.error('❌ Error updating password:', updateError)
      return NextResponse.json(
        { error: 'Failed to update password', details: updateError },
        { status: 500 }
      )
    }

    console.log('✅ Password updated successfully')

    console.log('🔍 Marking token as used...')
    // Mark token as used
    const { error: markUsedError } = await supabase
      .from('password_resets')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token)

    if (markUsedError) {
      console.error('❌ Error marking token as used:', markUsedError)
      // Don't fail the request if this fails
    } else {
      console.log('✅ Token marked as used')
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully!'
    })

  } catch (error) {
    console.error('❌ Reset password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
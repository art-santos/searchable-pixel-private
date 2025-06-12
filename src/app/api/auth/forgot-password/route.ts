import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'
import { templates } from '@/lib/email-templates'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Check if user exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, email')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      // For security, don't reveal if email exists or not
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, we\'ve sent a password reset link.'
      })
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // 1 hour expiry

    // Store reset token in database
    const { error: tokenError } = await supabase
      .from('password_resets')
      .insert({
        user_id: profile.id,
        token: resetToken,
        expires_at: expiresAt.toISOString()
      })

    if (tokenError) {
      console.error('Error storing reset token:', tokenError)
      return NextResponse.json(
        { error: 'Failed to process password reset request' },
        { status: 500 }
      )
    }

    // Send password reset email using our template
    const emailData = templates.passwordReset(
      profile.first_name || profile.email.split('@')[0],
      resetToken
    )

    const result = await sendEmail({
      to: email,
      subject: emailData.subject,
      html: emailData.html,
      senderName: 'Sam from Split'
    })

    if (result.success) {
      // Log the email
      try {
        await supabase
          .from('email_notifications')
          .insert({
            user_id: profile.id,
            email_type: 'password_reset',
            recipient_email: email,
            subject: emailData.subject,
            resend_id: result.data?.id,
            status: 'sent',
            metadata: { reset_token: resetToken }
          })
      } catch (logError) {
        console.error('Failed to log password reset email:', logError)
      }

      return NextResponse.json({
        success: true,
        message: 'Password reset email sent successfully!'
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to send password reset email' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
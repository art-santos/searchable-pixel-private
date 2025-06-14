import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import { templates } from '@/lib/email-templates'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    console.log('🔍 Forgot password request for:', email)

    if (!email) {
      console.log('❌ No email provided')
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    // Check environment variables
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not configured')
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    // Use service role client to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if user exists
    console.log('🔍 Looking up user profile...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, email')
      .eq('email', email)
      .single()

    if (profileError) {
      console.log('❌ Profile lookup error:', profileError)
      // For security, don't reveal if email exists or not
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, we\'ve sent a password reset link.'
      })
    }

    if (!profile) {
      console.log('❌ No profile found for email:', email)
      // For security, don't reveal if email exists or not
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, we\'ve sent a password reset link.'
      })
    }

    console.log('✅ Profile found:', profile.id)

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // 1 hour expiry

    console.log('🔍 Storing reset token...')
    // Store reset token in database
    const { error: tokenError } = await supabase
      .from('password_resets')
      .insert({
        user_id: profile.id,
        token: resetToken,
        expires_at: expiresAt.toISOString()
      })

    if (tokenError) {
      console.error('❌ Error storing reset token:', tokenError)
      return NextResponse.json(
        { error: 'Failed to process password reset request' },
        { status: 500 }
      )
    }

    console.log('✅ Reset token stored successfully')

    // Send password reset email using our template
    console.log('🔍 Generating email template...')
    const emailData = templates.passwordReset(
      profile.first_name || profile.email.split('@')[0],
      resetToken
    )

    console.log('🔍 Sending email via Resend...')
    console.log('📧 To:', email)
    console.log('📧 Subject:', emailData.subject)
    console.log('📧 From:', process.env.FROM_EMAIL || 'onboarding@resend.dev')

    const result = await sendEmail({
      to: email,
      subject: emailData.subject,
      html: emailData.html,
      senderName: 'Sam from Split'
    })

    console.log('📧 Email send result:', result)

    if (result.success) {
      console.log('✅ Email sent successfully!')
      
      // Log the email
      try {
        console.log('🔍 Logging email notification...')
        const { error: logError } = await supabase
          .from('email_notifications')
          .insert({
            user_id: profile.id,
            email_type: 'password_reset',
            recipient_email: email,
            subject: emailData.subject,
            resend_id: (result.data as any)?.id,
            status: 'sent',
            metadata: { reset_token: resetToken }
          })
        
        if (logError) {
          console.error('❌ Failed to log password reset email:', logError)
        } else {
          console.log('✅ Email notification logged')
        }
      } catch (logError) {
        console.error('❌ Error logging password reset email:', logError)
      }

      return NextResponse.json({
        success: true,
        message: 'Password reset email sent successfully!'
      })
    } else {
      console.error('❌ Failed to send email:', result.error)
      return NextResponse.json(
        { error: 'Failed to send password reset email', details: result.error },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
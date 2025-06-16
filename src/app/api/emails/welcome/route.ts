import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { templates } from '@/lib/email-templates'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, workspaceName, domain } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    // Get user from auth to verify they exist
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // For welcome emails, we don't require auth since this is called during signup
    // But we'll log the email for tracking
    
    // Generate welcome email
    const emailData = templates.welcome(name || email.split('@')[0], workspaceName, domain)
    
    // Send the email
    const result = await sendEmail({
      to: email,
      subject: emailData.subject,
      html: emailData.html,
      senderName: 'Sam from Split'
    })

    if (result.success) {
      // Log the email in our tracking table
      try {
        const { error: logError } = await supabase
          .from('email_notifications')
          .insert({
            user_id: user?.id || null, // May be null for new signups
            email_type: 'welcome',
            recipient_email: email,
            subject: emailData.subject,
            resend_id: result.data?.id,
            status: 'sent',
            metadata: { name }
          })
        
        if (logError) {
          console.error('Failed to log welcome email:', logError)
        }
      } catch (logError) {
        console.error('Error logging welcome email:', logError)
        // Don't fail the request if logging fails
      }

      return NextResponse.json({
        success: true,
        message: 'Welcome email sent successfully!',
        data: result.data
      })
    } else {
      return NextResponse.json(
        { 
          error: 'Failed to send welcome email',
          details: result.error 
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Welcome email error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send welcome email',
        message: (error as Error).message 
      },
      { status: 500 }
    )
  }
} 
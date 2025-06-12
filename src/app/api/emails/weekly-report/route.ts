import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { templates } from '@/lib/email-templates'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, userEmail, userName, stats } = body

    if (!userId || !userEmail || !stats) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, userEmail, stats' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    
    // Check if user has email notifications enabled
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('email_notifications, last_weekly_email')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error checking user profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to verify user preferences' },
        { status: 500 }
      )
    }

    // Check if user has email notifications disabled
    if (userProfile?.email_notifications === false) {
      return NextResponse.json({
        success: false,
        message: 'User has email notifications disabled'
      })
    }

    // Check if we already sent a weekly email recently (within 6 days)
    if (userProfile?.last_weekly_email) {
      const lastEmailDate = new Date(userProfile.last_weekly_email)
      const daysSinceLastEmail = (Date.now() - lastEmailDate.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysSinceLastEmail < 6) {
        return NextResponse.json({
          success: false,
          message: `Weekly email already sent ${Math.round(daysSinceLastEmail)} days ago`
        })
      }
    }

    // Generate weekly report email
    const emailData = templates.weeklyReport(
      userName || userEmail.split('@')[0],
      stats
    )
    
    // Send the email
    const result = await sendEmail({
      to: userEmail,
      subject: emailData.subject,
      html: emailData.html,
      senderName: 'Sam from Split'
    })

    if (result.success) {
      // Update last weekly email timestamp
      try {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ last_weekly_email: new Date().toISOString() })
          .eq('id', userId)
        
        if (updateError) {
          console.error('Failed to update last_weekly_email:', updateError)
        }
      } catch (updateError) {
        console.error('Error updating last_weekly_email:', updateError)
      }

      // Log the email in our tracking table
      try {
        const { error: logError } = await supabase
          .from('email_notifications')
          .insert({
            user_id: userId,
            email_type: 'weekly_report',
            recipient_email: userEmail,
            subject: emailData.subject,
            resend_id: result.data?.id,
            status: 'sent',
            metadata: { 
              stats: stats,
              user_name: userName
            }
          })
        
        if (logError) {
          console.error('Failed to log weekly report email:', logError)
        }
      } catch (logError) {
        console.error('Error logging weekly report email:', logError)
      }

      return NextResponse.json({
        success: true,
        message: 'Weekly report email sent successfully!',
        data: result.data
      })
    } else {
      return NextResponse.json(
        { 
          error: 'Failed to send weekly report email',
          details: result.error 
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Weekly report email error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send weekly report email',
        message: (error as Error).message 
      },
      { status: 500 }
    )
  }
} 
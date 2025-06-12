import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { templates } from '@/lib/email-templates'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, crawlerName, page, userEmail, userName } = body

    if (!userId || !crawlerName || !page || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, crawlerName, page, userEmail' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    
    // Check if this is actually the user's first crawler
    const { data: existingCrawlers, error: crawlerError } = await supabase
      .from('crawler_visits')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)

    if (crawlerError) {
      console.error('Error checking existing crawlers:', crawlerError)
      // For testing purposes, continue if user doesn't exist yet
      console.log('Continuing with first crawler email for testing...')
    }

    // If there are existing crawlers beyond the current batch, this isn't the first one
    if (existingCrawlers && existingCrawlers.length > 1) {
      return NextResponse.json({
        success: false,
        message: 'Not the first crawler for this user'
      })
    }

    // Check if we already sent a first crawler email
    const { data: existingEmail, error: emailError } = await supabase
      .from('email_notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('email_type', 'first_crawler')
      .limit(1)

    if (emailError) {
      console.error('Error checking existing first crawler emails:', emailError)
    }

    if (existingEmail && existingEmail.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'First crawler email already sent to this user'
      })
    }

    // Generate first crawler email
    const emailData = templates.firstCrawler(
      userName || userEmail.split('@')[0],
      crawlerName,
      page
    )
    
    // Send the email
    const result = await sendEmail({
      to: userEmail,
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
            user_id: userId,
            email_type: 'first_crawler',
            recipient_email: userEmail,
            subject: emailData.subject,
            resend_id: result.data?.id,
            status: 'sent',
            metadata: { 
              crawler_name: crawlerName,
              page: page,
              user_name: userName
            }
          })
        
        if (logError) {
          console.error('Failed to log first crawler email:', logError)
        }
      } catch (logError) {
        console.error('Error logging first crawler email:', logError)
      }

      return NextResponse.json({
        success: true,
        message: 'First crawler email sent successfully!',
        data: result.data
      })
    } else {
      return NextResponse.json(
        { 
          error: 'Failed to send first crawler email',
          details: result.error 
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('First crawler email error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send first crawler email',
        message: (error as Error).message 
      },
      { status: 500 }
    )
  }
} 
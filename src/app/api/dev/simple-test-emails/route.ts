import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'
import { templates } from '@/lib/email-templates'

// Only allow in development
if (process.env.NODE_ENV === 'production') {
  throw new Error('Test email endpoint should not be available in production')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, testEmail } = body

    if (!testEmail) {
      return NextResponse.json({ error: 'testEmail is required' }, { status: 400 })
    }

    const supabase = createClient()
    const testUserId = `test-${Date.now()}`
    
    let result: any

    switch (type) {
      case 'first-crawler':
        // Clean state
        await supabase.from('profiles').delete().eq('id', testUserId)
        await supabase.from('crawler_visits').delete().eq('user_id', testUserId)
        
        // Create test user
        await supabase.from('profiles').insert({
          id: testUserId,
          email: testEmail,
          first_name: 'Test User'
        })

        // Send first crawler email directly
        const emailData = templates.firstCrawler('Test User', 'Googlebot', '/test-page')
        
        const emailResult = await sendEmail({
          to: testEmail,
          subject: emailData.subject,
          html: emailData.html,
          senderName: 'Sam from Split'
        })

        if (emailResult.success) {
          // Log the email
          await supabase.from('email_notifications').insert({
            user_id: testUserId,
            email_type: 'first_crawler',
            recipient_email: testEmail,
            subject: emailData.subject,
            resend_id: emailResult.data?.id,
            status: 'sent',
            metadata: { 
              crawler_name: 'Googlebot',
              page: '/test-page',
              user_name: 'Test User'
            }
          })
        }

        result = {
          success: emailResult.success,
          message: emailResult.success ? 'First crawler email sent!' : 'Failed to send email',
          data: emailResult.data,
          error: emailResult.error
        }
        
        // Clean up
        await supabase.from('profiles').delete().eq('id', testUserId)
        break

      case 'weekly-report':
        const weeklyData = templates.weeklyReport('Test User', {
          totalVisits: 15,
          uniqueCrawlers: 3,
          topPage: '/test-page',
          growth: 25
        })
        
        const weeklyResult = await sendEmail({
          to: testEmail,
          subject: weeklyData.subject,
          html: weeklyData.html,
          senderName: 'Sam from Split'
        })

        result = {
          success: weeklyResult.success,
          message: weeklyResult.success ? 'Weekly report sent!' : 'Failed to send weekly report',
          data: weeklyResult.data,
          error: weeklyResult.error
        }

        if (weeklyResult.success) {
          await supabase.from('email_notifications').insert({
            user_id: testUserId,
            email_type: 'weekly_summary',
            recipient_email: testEmail,
            subject: weeklyData.subject,
            resend_id: weeklyResult.data?.id,
            status: 'sent'
          })
        }
        break

      case 'welcome':
        const welcomeData = templates.welcome('Test User')
        
        const welcomeResult = await sendEmail({
          to: testEmail,
          subject: welcomeData.subject,
          html: welcomeData.html,
          senderName: 'Sam from Split'
        })

        result = {
          success: welcomeResult.success,
          message: welcomeResult.success ? 'Welcome email sent!' : 'Failed to send welcome email',
          data: welcomeResult.data,
          error: welcomeResult.error
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      type,
      testEmail,
      result
    })

  } catch (error) {
    console.error('Simple test email error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send test email',
        message: (error as Error).message 
      },
      { status: 500 }
    )
  }
} 
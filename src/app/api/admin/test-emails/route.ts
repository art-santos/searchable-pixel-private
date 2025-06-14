import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'
import { templates } from '@/lib/email-templates'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, testEmail, adminUserId } = body

    if (!testEmail || !type || !adminUserId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Use service role client to bypass RLS
    const supabase = createClient()
    
    // Verify the requesting user is an admin
    const { data: adminUser, error: adminError } = await supabase.auth.getUser()
    
    if (adminError || !adminUser.user?.email?.endsWith('@split.dev')) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    let result: any

    switch (type) {
      case 'first-crawler':
        // Send first crawler email directly
        const emailData = templates.firstCrawler('Test User', 'Googlebot', '/test-page')
        
        const emailResult = await sendEmail({
          to: testEmail,
          subject: emailData.subject,
          html: emailData.html,
          senderName: 'Sam from Split'
        })

        if (emailResult.success) {
          // Log the email using service role (bypasses RLS)
          try {
            const { error: logError } = await supabase
              .from('email_notifications')
              .insert({
                user_id: adminUserId, // Use admin user ID
                email_type: 'first_crawler',
                recipient_email: testEmail,
                subject: emailData.subject,
                resend_id: (emailResult.data as any)?.id,
                status: 'sent',
                metadata: { 
                  crawler_name: 'Googlebot',
                  page: '/test-page',
                  user_name: 'Test User',
                  is_test: true,
                  admin_test: true
                }
              })
            
            if (logError) {
              console.error('Failed to log first crawler email:', logError)
            }
          } catch (logError) {
            console.error('Error logging first crawler email:', logError)
          }
        }

        result = {
          success: emailResult.success,
          message: emailResult.success ? 'First crawler email sent!' : 'Failed to send email',
          data: emailResult.data,
          error: emailResult.error
        }
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

        if (weeklyResult.success) {
          try {
            const { error: logError } = await supabase
              .from('email_notifications')
              .insert({
                user_id: adminUserId,
                email_type: 'weekly_report',
                recipient_email: testEmail,
                subject: weeklyData.subject,
                resend_id: (weeklyResult.data as any)?.id,
                status: 'sent',
                metadata: {
                  is_test: true,
                  admin_test: true
                }
              })
            
            if (logError) {
              console.error('Failed to log weekly email:', logError)
            }
          } catch (logError) {
            console.error('Error logging weekly email:', logError)
          }
        }

        result = {
          success: weeklyResult.success,
          message: weeklyResult.success ? 'Weekly report sent!' : 'Failed to send weekly report',
          data: weeklyResult.data,
          error: weeklyResult.error
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

        if (welcomeResult.success) {
          try {
            const { error: logError } = await supabase
              .from('email_notifications')
              .insert({
                user_id: adminUserId,
                email_type: 'welcome',
                recipient_email: testEmail,
                subject: welcomeData.subject,
                resend_id: (welcomeResult.data as any)?.id,
                status: 'sent',
                metadata: {
                  is_test: true,
                  admin_test: true
                }
              })
            
            if (logError) {
              console.error('Failed to log welcome email:', logError)
            }
          } catch (logError) {
            console.error('Error logging welcome email:', logError)
          }
        }

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
    console.error('Admin test email error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send test email',
        message: (error as Error).message 
      },
      { status: 500 }
    )
  }
} 
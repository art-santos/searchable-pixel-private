import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { templates } from '@/lib/email-templates'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, type = 'welcome' } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    // Test different email types
    let emailData
    switch (type) {
      case 'welcome':
        emailData = templates.welcome('Test User')
        break
      case 'verification':
        emailData = templates.emailVerification('Test User', 'test-token-123')
        break
      case 'passwordReset':
      case 'password_reset':
        emailData = templates.passwordReset('Test User', 'test-reset-token-123')
        break
      case 'first_crawler':
        emailData = templates.firstCrawler('Test User', 'GPTBot', '/homepage')
        break
      case 'weekly_report':
        emailData = templates.weeklyReport('Test User', {
          totalVisits: 42,
          uniqueCrawlers: 3,
          topPage: '/blog/ai-seo-guide',
          growth: 23
        })
        break
      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        )
    }

    // Send the test email
    const result = await sendEmail({
      to: email,
      subject: `[TEST] ${emailData.subject}`,
      html: emailData.html
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test ${type} email sent successfully!`,
        data: result.data
      })
    } else {
      return NextResponse.json(
        { 
          error: 'Failed to send email',
          details: result.error 
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send test email',
        message: (error as Error).message 
      },
      { status: 500 }
    )
  }
} 
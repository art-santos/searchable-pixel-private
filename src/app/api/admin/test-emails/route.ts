import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'
import { templates } from '@/lib/email-templates'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, testEmail, adminUserId, useRealUser } = body

    if (!testEmail || !type || !adminUserId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Use service role client to bypass RLS
    const supabase = createServiceRoleClient()
    
    // Verify the requesting user is an admin by checking their profile
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('email, is_admin')
      .eq('id', adminUserId)
      .single()
    
    if (adminError || !adminProfile?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    let result: any

    switch (type) {
      case 'first-crawler':
        // Send first crawler email directly with hardcoded data (this one doesn't need real stats)
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
        let weeklyData
        let realUserData = null

        if (useRealUser) {
          // Find a user with actual crawler visit data
          const oneWeekAgo = new Date()
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
          
          const twoWeeksAgo = new Date()
          twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

          // Get users with recent crawler activity (excluding admin users)
          const { data: usersWithActivity, error: usersError } = await supabase
            .from('crawler_visits')
            .select('user_id')
            .gte('timestamp', oneWeekAgo.toISOString())
            .not('user_id', 'is', null)
            .limit(50)

          if (usersError || !usersWithActivity || usersWithActivity.length === 0) {
            return NextResponse.json({ 
              error: 'No users with recent crawler activity found for testing',
              suggestion: 'Try using hardcoded data instead'
            }, { status: 404 })
          }

          // Get unique user IDs and find one with good data
          const uniqueUserIds = [...new Set(usersWithActivity.map((v: any) => v.user_id))]
          
          // Get user profiles for these users (exclude admin emails)
          const { data: userProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, email, first_name')
            .in('id', uniqueUserIds)
            .not('email', 'like', '%@split.dev')
            .not('email', 'is', null)
            .limit(10)

          if (profilesError || !userProfiles || userProfiles.length === 0) {
            return NextResponse.json({ 
              error: 'No suitable test users found',
              suggestion: 'Try using hardcoded data instead'
            }, { status: 404 })
          }

          // Pick the first user and get their real stats
          const testUser = userProfiles[0]
          
          // Get detailed stats for this user (same logic as weekly email cron)
          const { data: userVisits, error: visitsError } = await supabase
            .from('crawler_visits')
            .select('crawler_name, crawler_company, path, timestamp')
            .eq('user_id', testUser.id)
            .gte('timestamp', oneWeekAgo.toISOString())
            .order('timestamp', { ascending: false })

          if (visitsError || !userVisits || userVisits.length === 0) {
            // Fall back to hardcoded data
            weeklyData = templates.weeklyReport('Test User', {
              totalVisits: 15,
              uniqueCrawlers: 3,
              topPage: '/test-page',
              growth: 25
            })
          } else {
            // Calculate real stats
            const totalVisits = userVisits.length
            const uniqueCrawlers = new Set(userVisits.map((v: any) => v.crawler_name)).size
            
            // Find most visited page
            const pageCounts = new Map()
            userVisits.forEach((visit: any) => {
              const count = pageCounts.get(visit.path) || 0
              pageCounts.set(visit.path, count + 1)
            })
            
            let topPage = '/'
            let maxCount = 0
            pageCounts.forEach((count, page) => {
              if (count > maxCount) {
                maxCount = count
                topPage = page
              }
            })

            // Calculate growth (compare to previous week)
            const { count: previousWeekCount, error: prevError } = await supabase
              .from('crawler_visits')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', testUser.id)
              .gte('timestamp', twoWeeksAgo.toISOString())
              .lt('timestamp', oneWeekAgo.toISOString())

            let growth = 0
            if (!prevError && previousWeekCount !== null) {
              const previousCount = previousWeekCount
              if (previousCount > 0) {
                growth = Math.round(((totalVisits - previousCount) / previousCount) * 100)
              } else if (totalVisits > 0) {
                growth = 100 // First week with activity
              }
            }

            const stats = {
              totalVisits,
              uniqueCrawlers,
              topPage,
              growth
            }

            weeklyData = templates.weeklyReport(testUser.first_name || 'Test User', stats)
            
            realUserData = {
              userId: testUser.id,
              email: testUser.email,
              firstName: testUser.first_name,
              stats
            }
          }
        } else {
          // Use hardcoded data
          weeklyData = templates.weeklyReport('Test User', {
            totalVisits: 15,
            uniqueCrawlers: 3,
            topPage: '/test-page',
            growth: 25
          })
        }
        
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
                  admin_test: true,
                  real_user_data: realUserData
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
          message: weeklyResult.success ? 
            `Weekly report sent! ${realUserData ? `(Using real data from user: ${realUserData.email})` : '(Using hardcoded data)'}` : 
            'Failed to send weekly report',
          data: weeklyResult.data,
          error: weeklyResult.error,
          realUserData: realUserData
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
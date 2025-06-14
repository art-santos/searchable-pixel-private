import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    
    // Get users who have crawler activity in the last week and haven't received a weekly email recently
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    const sixDaysAgo = new Date()
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6)

    console.log('[Weekly Emails] Starting weekly email job...')

    // Get users with recent crawler activity
    const { data: activeUserIds, error: usersError } = await supabase
      .from('crawler_visits')
      .select('user_id')
      .gte('timestamp', oneWeekAgo.toISOString())
      .not('user_id', 'is', null)

    if (usersError) {
      console.error('[Weekly Emails] Error fetching active users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    if (!activeUserIds || activeUserIds.length === 0) {
      console.log('[Weekly Emails] No active users found')
      return NextResponse.json({ 
        success: true, 
        message: 'No active users found',
        processed: 0 
      })
    }

    // Get unique user IDs
    const uniqueUserIds = [...new Set(activeUserIds.map(v => v.user_id))]
    console.log(`[Weekly Emails] Found ${uniqueUserIds.length} unique users with activity`)

    // Get user profiles for these users
    const { data: userProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, first_name, email_notifications, last_weekly_email')
      .in('id', uniqueUserIds)
      .not('email', 'is', null)

    if (profilesError) {
      console.error('[Weekly Emails] Error fetching user profiles:', profilesError)
      return NextResponse.json({ error: 'Failed to fetch user profiles' }, { status: 500 })
    }

    if (!userProfiles || userProfiles.length === 0) {
      console.log('[Weekly Emails] No user profiles found')
      return NextResponse.json({ 
        success: true, 
        message: 'No user profiles found',
        processed: 0 
      })
    }

    // Filter eligible users
    const userMap = new Map()
    userProfiles.forEach(profile => {
      // Skip if email notifications disabled
      if (profile.email_notifications === false) return

      // Skip if weekly email sent recently
      if (profile.last_weekly_email) {
        const lastEmailDate = new Date(profile.last_weekly_email)
        if (lastEmailDate > sixDaysAgo) return
      }

      userMap.set(profile.id, {
        userId: profile.id,
        email: profile.email,
        firstName: profile.first_name
      })
    })

    console.log(`[Weekly Emails] Found ${userMap.size} eligible users`)

    let emailsSent = 0
    let emailsFailed = 0

    // Process each user
    for (const [userId, userData] of userMap) {
      try {
        // Get detailed stats for this user
        const { data: userVisits, error: visitsError } = await supabase
          .from('crawler_visits')
          .select('crawler_name, crawler_company, path, timestamp')
          .eq('user_id', userId)
          .gte('timestamp', oneWeekAgo.toISOString())
          .order('timestamp', { ascending: false })

        if (visitsError || !userVisits || userVisits.length === 0) {
          console.log(`[Weekly Emails] No visits found for user ${userId}`)
          continue
        }

        // Calculate stats
        const totalVisits = userVisits.length
        const uniqueCrawlers = new Set(userVisits.map(v => v.crawler_name)).size
        
        // Find most visited page
        const pageCounts = new Map()
        userVisits.forEach(visit => {
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
        const twoWeeksAgo = new Date()
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
        
        const { count: previousWeekCount, error: prevError } = await supabase
          .from('crawler_visits')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
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

        // Send weekly report email
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/emails/weekly-report`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId,
            userEmail: userData.email,
            userName: userData.firstName,
            stats: stats
          })
        })

        if (emailResponse.ok) {
          emailsSent++
          console.log(`[Weekly Emails] ✅ Sent weekly report to ${userData.email}`)
        } else {
          emailsFailed++
          console.error(`[Weekly Emails] ❌ Failed to send weekly report to ${userData.email}`)
        }

      } catch (userError) {
        emailsFailed++
        console.error(`[Weekly Emails] Error processing user ${userId}:`, userError)
      }
    }

    console.log(`[Weekly Emails] Job completed: ${emailsSent} sent, ${emailsFailed} failed`)

    return NextResponse.json({
      success: true,
      message: `Weekly emails job completed`,
      processed: userMap.size,
      sent: emailsSent,
      failed: emailsFailed
    })

  } catch (error) {
    console.error('[Weekly Emails] Job error:', error)
    return NextResponse.json(
      { 
        error: 'Weekly emails job failed',
        message: (error as Error).message 
      },
      { status: 500 }
    )
  }
} 